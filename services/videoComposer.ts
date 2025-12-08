import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let isLoading = false;
let loadPromise: Promise<FFmpeg> | null = null;

/**
 * Lazy-load FFmpeg.wasm instance
 */
async function loadFFmpeg(): Promise<FFmpeg> {
    if (ffmpegInstance) return ffmpegInstance;
    if (loadPromise) return loadPromise;

    isLoading = true;
    loadPromise = (async () => {
        const ffmpeg = new FFmpeg();

        ffmpeg.on('log', ({ message }) => {
            console.log('[FFmpeg]', message);
        });

        // Load FFmpeg core (use single-threaded version to avoid SharedArrayBuffer/Header issues)
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });

        ffmpegInstance = ffmpeg;
        isLoading = false;
        return ffmpeg;
    })();

    return loadPromise;
}

/**
 * Load a font file for captions
 */
async function loadFont(ffmpeg: FFmpeg): Promise<void> {
    const fontUrl = 'https://raw.githubusercontent.com/ffmpegwasm/testdata/master/arial.ttf';
    await ffmpeg.writeFile('arial.ttf', await fetchFile(fontUrl));
}

/**
 * Convert base64 PCM audio to WAV format
 */
function base64ToWav(base64: string, sampleRate = 24000): Blob {
    // Decode base64
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    // Convert Int16 PCM to Float32
    const dataInt16 = new Int16Array(bytes.buffer);
    const numChannels = 1;
    const numSamples = dataInt16.length;

    // Create WAV header
    const headerSize = 44;
    const dataSize = numSamples * 2;
    const buffer = new ArrayBuffer(headerSize + dataSize);
    const view = new DataView(buffer);

    // RIFF header
    const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
    view.setUint16(32, numChannels * 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Copy PCM data
    for (let i = 0; i < numSamples; i++) {
        view.setInt16(headerSize + i * 2, dataInt16[i], true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Create video from image sequence (for Flux Motion)
 */
async function createVideoFromImages(
    ffmpeg: FFmpeg,
    imageUrls: string[],
    duration: number
): Promise<void> {
    const frameDuration = duration / imageUrls.length;
    const fps = 30;
    const framesPerImage = Math.max(1, Math.floor(frameDuration * fps));

    // Download and write images
    for (let i = 0; i < imageUrls.length; i++) {
        const imageData = await fetchFile(imageUrls[i]);
        await ffmpeg.writeFile(`image${i}.jpg`, imageData);
    }

    // Create concat file for images
    let concatContent = '';
    for (let i = 0; i < imageUrls.length; i++) {
        concatContent += `file 'image${i}.jpg'\n`;
        concatContent += `duration ${frameDuration}\n`;
    }
    // Add last image again for proper duration
    concatContent += `file 'image${imageUrls.length - 1}.jpg'\n`;

    await ffmpeg.writeFile('concat.txt', concatContent);

    // Create video from images
    await ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'concat.txt',
        '-vf', `fps=${fps},scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2`,
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-t', duration.toString(),
        'temp_video.mp4'
    ]);
}

/**
 * Compose final video with audio, music, and captions
 * @param videoSource - Video URL or image URLs
 * @param audioBase64 - Voiceover audio
 * @param duration - Duration in seconds
 * @param captionText - Text to overlay (optional)
 * @param musicUrl - Background music URL (optional)
 * @param onProgress - Progress callback
 */
export async function composeVideo(
    videoSource: string | string[],
    audioBase64: string,
    duration: number = 30,
    captionText?: string,
    musicUrl?: string,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    try {
        onProgress?.(5);

        // Load FFmpeg
        const ffmpeg = await loadFFmpeg();
        onProgress?.(10);

        // Load Font for captions
        if (captionText) {
            await loadFont(ffmpeg);
        }

        // Write Voiceover
        const audioWav = base64ToWav(audioBase64);
        await ffmpeg.writeFile('voice.wav', await fetchFile(audioWav));

        // Handle Music
        let hasMusic = false;
        if (musicUrl) {
            try {
                await ffmpeg.writeFile('music.mp3', await fetchFile(musicUrl));
                hasMusic = true;
            } catch (e) {
                console.warn('Failed to load music, proceeding without it', e);
            }
        }
        onProgress?.(20);

        // Handle Video Input
        if (Array.isArray(videoSource)) {
            // Flux Motion - create video from images
            await createVideoFromImages(ffmpeg, videoSource, duration);
            onProgress?.(40);
        } else {
            // Veo - download video
            const videoData = await fetchFile(videoSource);
            await ffmpeg.writeFile('temp_video.mp4', videoData);
            onProgress?.(40);
        }

        // Build FFmpeg Command
        // Complex filter components
        const inputs = ['-i', 'temp_video.mp4', '-i', 'voice.wav'];
        if (hasMusic) inputs.push('-i', 'music.mp3');

        let filterComplex = '';

        // 1. Audio Mixing (Voice + Music)
        if (hasMusic) {
            // Mix voice (volume 1.0) and music (volume 0.2)
            filterComplex += `[1:a]volume=1.0[a1];[2:a]volume=0.2[a2];[a1][a2]amix=inputs=2:duration=first:dropout_transition=2[aout];`;
        } else {
            filterComplex += `[1:a]volume=1.0[aout];`;
        }

        // 2. Video Text (Captions)
        // Draw text box at bottom with black background
        let videoStream = '[0:v]';
        if (captionText) {
            // Clean text for FFmpeg (escape special chars)
            const sanitizedText = captionText.replace(/:/g, '\\:').replace(/'/g, '').slice(0, 100) + '...';
            // Draw text
            /*
             drawtext=fontfile=arial.ttf:text='...':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=h-th-50
            */
            filterComplex += `${videoStream}drawtext=fontfile=arial.ttf:text='${sanitizedText}':fontcolor=white:fontsize=32:box=1:boxcolor=black@0.6:boxborderw=10:x=(w-text_w)/2:y=h-th-100[vout]`;
        } else {
            filterComplex += `${videoStream}copy[vout]`; // Pass through if no text
        }

        // Execute Command
        const cmd = [
            ...inputs,
            '-filter_complex', filterComplex,
            '-map', (captionText ? '[vout]' : '0:v'),
            '-map', '[aout]',
            '-c:v', 'libx264', // Re-encode video for text
            '-c:a', 'aac',
            '-b:a', '192k',
            '-shortest',
            'output.mp4'
        ];

        // If simple copy (no text/music), we can optimise, but user wants features. 
        // Re-encoding is necessary for text overlay.

        await ffmpeg.exec(cmd);
        onProgress?.(90);

        // Read output
        const data = await ffmpeg.readFile('output.mp4');
        // FileData can be Uint8Array or string, convert appropriately
        const uint8Array = data instanceof Uint8Array ? data : new TextEncoder().encode(data as string);
        const blob = new Blob([uint8Array.buffer as ArrayBuffer], { type: 'video/mp4' });

        // Cleanup
        await ffmpeg.deleteFile('voice.wav');
        if (hasMusic) await ffmpeg.deleteFile('music.mp3');
        if (captionText) await ffmpeg.deleteFile('arial.ttf');
        await ffmpeg.deleteFile('temp_video.mp4');
        await ffmpeg.deleteFile('output.mp4');
        if (Array.isArray(videoSource)) {
            await ffmpeg.deleteFile('concat.txt');
            for (let i = 0; i < videoSource.length; i++) {
                await ffmpeg.deleteFile(`image${i}.jpg`);
            }
        }

        onProgress?.(100);
        return blob;
    } catch (error) {
        console.error('Video composition failed:', error);
        throw new Error(`Failed to compose video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Check if FFmpeg is ready (useful for showing loading UI)
 */
export function isFFmpegLoading(): boolean {
    return isLoading;
}

/**
 * Check if FFmpeg is loaded
 */
export function isFFmpegLoaded(): boolean {
    return ffmpegInstance !== null;
}
