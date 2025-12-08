import React, { useState, useRef, useEffect } from 'react';
import { StrategyOption, ToolOption, ShortConcept, SavedProject, RefinedStrategy } from '../types';
import { generateShortConcept, generateVideoAsset, generateVoiceover, generateImageAsset, generateMoreImagePrompts } from '../services/gemini';
import { composeVideo } from '../services/videoComposer';
import {
    Loader2, Play, LayoutTemplate, FileText, Image as ImageIcon,
    RefreshCcw, UploadCloud, Film, Youtube, Globe, Mic, Volume2, Pause, ArrowLeft, Video, SkipBack, SkipForward, Upload, Share2, Link, Plus, Save, Trash2, Palette, Clock, HelpCircle, AlertCircle, Zap, Monitor, RotateCcw,
    Settings, Wrench, Check, X, Download
} from 'lucide-react';
import { IntegrationType } from '../types';

interface Props {
    genre: string;
    strategy: RefinedStrategy;
    onBack: () => void;
    onComplete: (concept: ShortConcept, videoUrl: string | null, motionUrls: string[] | null, imageUrl: string | null) => void;
    imageProvider: 'google' | 'pollinations';
    videoProvider: 'veo' | 'flux-motion';
    initialData?: SavedProject;
}

interface StyleTemplate {
    id: string;
    name: string;
    style: string;
}

const DEFAULT_TOOLS: ToolOption[] = [
    { id: 'gemini-flash', name: 'Gemini 2.5', type: IntegrationType.CONTENT, description: 'Script Gen', required: true, selected: true },
    { id: 'google-trends', name: 'Google Trends', type: IntegrationType.CONTENT, description: 'Grounding', required: true, selected: true },
    { id: 'veo', name: 'Veo Video', type: IntegrationType.VIDEO, description: 'High-end Video', required: false, selected: true },
    { id: 'imagen', name: 'Imagen 3', type: IntegrationType.VIDEO, description: 'Static Images', required: false, selected: true },
    { id: 'tts-gemini', name: 'Gemini TTS', type: IntegrationType.VOICE, description: 'Voiceover', required: false, selected: true }
];

const DEFAULT_TEMPLATES: StyleTemplate[] = [
    { id: 'cinematic', name: 'Cinematic Documentary', style: 'High-contrast, 35mm film look, dramatic lighting, photorealistic, 4k, moody atmosphere.' },
    { id: 'minimal', name: 'Minimalist Tech', style: 'Clean white background, soft shadows, isometric 3D elements, pastel accent colors, modern UI graphics.' },
    { id: 'neon', name: 'Cyberpunk Neon', style: 'Dark background, glowing neon pink and blue lights, futuristic cityscapes, glitch effects, digital noise.' },
    { id: 'anime', name: 'Anime Style', style: 'Vibrant anime art style, cel-shaded, expressive characters, dynamic action lines, Studio Ghibli inspired landscapes.' }
];

export const PrototypeDashboard: React.FC<Props> = ({ genre, strategy, onBack, onComplete, imageProvider, videoProvider, initialData }) => {
    // Internal Tools State (formerly from TechStackStage)
    const [tools, setTools] = useState<ToolOption[]>(DEFAULT_TOOLS);
    const [showStackConfig, setShowStackConfig] = useState(false);

    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [concept, setConcept] = useState<ShortConcept | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [motionUrls, setMotionUrls] = useState<string[] | null>(null); // For Flux Motion Slideshow
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isVideoLoading, setIsVideoLoading] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [isMorePromptsLoading, setIsMorePromptsLoading] = useState(false);
    const [videoDuration, setVideoDuration] = useState('6s');
    const [videoResolution, setVideoResolution] = useState<'720p' | '1080p'>('1080p');

    // Style Templates State
    const [templates, setTemplates] = useState<StyleTemplate[]>(DEFAULT_TEMPLATES);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');

    // Save State
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    // Guide State
    const [showGuide, setShowGuide] = useState(false);

    // Audio State & Refs
    const [audioBase64, setAudioBase64] = useState<string | null>(null);
    const [isAudioLoading, setIsAudioLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const hasAutoTriggered = useRef(false);

    // Video Composition State
    const [composedVideoBlob, setComposedVideoBlob] = useState<Blob | null>(null);
    const [composedVideoUrl, setComposedVideoUrl] = useState<string | null>(null);
    const [isComposing, setIsComposing] = useState(false);
    const [compositionProgress, setCompositionProgress] = useState(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const startTimeRef = useRef<number>(0);
    const pausedAtRef = useRef<number>(0);
    const rafRef = useRef<number | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const hasVeo = tools.some(t => t.id === 'veo' && t.selected);
    const hasImagen = tools.some(t => t.id === 'imagen' && t.selected);
    const hasTts = tools.some(t => t.id === 'tts-gemini' && t.selected);

    // Load templates from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('trendShorts_styleTemplates');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setTemplates([...DEFAULT_TEMPLATES, ...parsed]);
            } catch (e) {
                console.error("Failed to load templates", e);
            }
        }
    }, []);

    // AUTO-FILL & TRIGGER WORKFLOW
    useEffect(() => {
        if (!strategy || !genre) return;

        // If loading a draft, populate state
        if (initialData && !hasAutoTriggered.current) {
            setTopic(initialData.name.replace('Draft: ', '').replace(`${strategy.title}: `, '')); // Simple cleanup
            // Or use initialData.name directly if it was edited
            // Better: use the topic if it was saved in concept
            if (initialData.concept?.topic) setTopic(initialData.concept.topic);

            setConcept(initialData.concept || null);
            setVideoUrl(initialData.videoUrl || null);
            setMotionUrls(initialData.motionUrls || null);
            setImageUrl(initialData.imageUrl || null);
            hasAutoTriggered.current = true;
            return;
        }

        // Construct a strong topic from the inputs if topic is empty
        if (!topic && !hasAutoTriggered.current && !initialData) {
            const autoTopic = `${strategy.title}: ${strategy.searchQuery || genre}`;
            setTopic(autoTopic);

            // Trigger generation automatically for smooth workflow
            hasAutoTriggered.current = true;
            setTimeout(() => handleGenerateConcept(autoTopic), 100);
        }
    }, [strategy, genre, initialData]);

    // AUTO-CHAINING: Generate Video & Voiceover once Concept is ready
    useEffect(() => {
        if (concept && !isGenerating) {
            // 1. Auto-Generate Video (if none exists)
            if (!videoUrl && !motionUrls && !imageUrl && !isVideoLoading && !isImageLoading && concept.imagePrompts.length > 0) {
                // Use a small timeout to prevent state clashes
                setTimeout(() => {
                    console.log("Auto-triggering video generation...");
                    handleGenerateVideo(concept.imagePrompts[0]);
                }, 500);
            }

            // 2. Auto-Generate Voiceover (if not exists)
            if (!audioBase64 && !isAudioLoading && concept.script) {
                setTimeout(() => {
                    console.log("Auto-triggering voiceover...");
                    handleGenerateVoiceover();
                }, 1000);
            }
        }
    }, [concept, isGenerating]);

    // AUTO-COMPOSITION: Merge video + audio when both ready
    useEffect(() => {
        const videoSource = videoUrl || motionUrls;
        if (videoSource && audioBase64 && !composedVideoBlob && !isComposing) {
            console.log('Auto-triggering video composition...');
            setTimeout(() => handleComposeVideo(), 1500);
        }
    }, [videoUrl, motionUrls, audioBase64, composedVideoBlob, isComposing]);

    // Initialize Web Audio API
    useEffect(() => {
        // Cleanup function to close context on unmount
        return () => {
            if (sourceRef.current) {
                sourceRef.current.stop();
            }
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    // Decode audio whenever base64 changes
    useEffect(() => {
        if (!audioBase64) {
            // Cleanup if audio is removed
            audioBufferRef.current = null;
            setDuration(0);
            setCurrentTime(0);
            drawVisualizer(true);
            return;
        }

        const initAudio = async () => {
            try {
                // Re-use or create context
                if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                }
                const ctx = audioContextRef.current;

                // Create nodes if they don't exist
                if (!gainNodeRef.current) {
                    const gain = ctx.createGain();
                    gain.gain.value = volume;
                    gain.connect(ctx.destination);
                    gainNodeRef.current = gain;
                }
                if (!analyserRef.current) {
                    const analyser = ctx.createAnalyser();
                    analyser.fftSize = 256;
                    analyser.connect(gainNodeRef.current!);
                    analyserRef.current = analyser;
                }

                // Decode Raw PCM
                const binaryString = atob(audioBase64);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                // Convert Int16 PCM to Float32
                const dataInt16 = new Int16Array(bytes.buffer);
                const float32Data = new Float32Array(dataInt16.length);
                for (let i = 0; i < dataInt16.length; i++) {
                    float32Data[i] = dataInt16[i] / 32768.0;
                }

                const buffer = ctx.createBuffer(1, float32Data.length, 24000);
                buffer.copyToChannel(float32Data, 0);

                audioBufferRef.current = buffer;
                setDuration(buffer.duration);
                setCurrentTime(0);
                pausedAtRef.current = 0;
                setIsPlaying(false);

                // Reset visualizer
                drawVisualizer(true);

            } catch (e) {
                console.error("Audio decoding failed", e);
            }
        };

        initAudio();
    }, [audioBase64]);

    // Handle Volume Changes
    useEffect(() => {
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = volume;
        }
    }, [volume]);

    const drawVisualizer = (reset = false) => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        // Ensure no previous loop is running
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }

        if (reset || !analyserRef.current) {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = '#f1f5f9'; // slate-100
            ctx.fillRect(0, 0, width, height);

            // Draw a flat line
            ctx.beginPath();
            ctx.moveTo(0, height / 2);
            ctx.lineTo(width, height / 2);
            ctx.strokeStyle = '#cbd5e1'; // slate-300
            ctx.stroke();
            return;
        }

        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const renderFrame = () => {
            rafRef.current = requestAnimationFrame(renderFrame);
            analyser.getByteFrequencyData(dataArray);

            ctx.fillStyle = '#f8fafc'; // slate-50 background
            ctx.fillRect(0, 0, width, height);

            const barWidth = (width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * height;

                // Gradient color based on height
                const r = 79 + (barHeight / height) * 100; // Indigo-ish base
                const g = 70;
                const b = 229;

                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x, height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }

            // Update Progress Time UI in loop for smoothness
            if (audioContextRef.current && startTimeRef.current && isPlaying) {
                const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
                if (elapsed >= duration) {
                    // Audio finished
                    setIsPlaying(false);
                    pausedAtRef.current = 0;
                    setCurrentTime(0);
                    cancelAnimationFrame(rafRef.current!);
                    rafRef.current = null;
                    // Redraw reset state
                    drawVisualizer(true);
                } else {
                    setCurrentTime(elapsed);
                }
            }
        };

        // Only start the loop if we aren't resetting
        if (!reset) {
            renderFrame();
        }
    };

    const playAudio = async () => {
        if (!audioContextRef.current || !audioBufferRef.current) return;

        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        // Stop existing source if any
        if (sourceRef.current) {
            sourceRef.current.stop();
        }

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBufferRef.current;

        // Connect: Source -> Analyser -> Gain -> Destination
        source.connect(analyserRef.current!); // analyser already connected to gain in init

        // Calculate start time
        const offset = pausedAtRef.current;
        source.start(0, offset);

        sourceRef.current = source;
        startTimeRef.current = audioContextRef.current.currentTime - offset;

        setIsPlaying(true);
        // drawVisualizer will clear any existing RAF and start a new one
        drawVisualizer();
    };

    const pauseAudio = () => {
        if (sourceRef.current) {
            sourceRef.current.stop();
        }
        if (audioContextRef.current) {
            pausedAtRef.current = audioContextRef.current.currentTime - startTimeRef.current;
        }
        setIsPlaying(false);
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        setCurrentTime(time);
        pausedAtRef.current = time;

        if (isPlaying) {
            playAudio(); // Re-trigger play from new time
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handleReset = () => {
        if (window.confirm("Start a new concept? This will clear all current progress in the dashboard.")) {
            setTopic('');
            setConcept(null);
            setVideoUrl(null);
            setMotionUrls(null);
            setImageUrl(null);
            setAudioBase64(null);
            pauseAudio();
            hasAutoTriggered.current = false;
        }
    };

    const handleGenerateConcept = async (overrideTopic?: string) => {
        const topicToUse = overrideTopic || topic;
        if (!topicToUse) return;

        setIsGenerating(true);
        setConcept(null);
        setVideoUrl(null);
        setMotionUrls(null);
        setImageUrl(null);
        setAudioBase64(null);
        pauseAudio(); // Stop any audio

        try {
            // Find selected style description if any
            const stylePreset = templates.find(t => t.id === selectedTemplateId)?.style;

            const data = await generateShortConcept(topicToUse, genre, strategy.title, stylePreset);
            setConcept(data);
        } catch (e) {
            console.error(e);
            alert("Error generating concept. Please try a different topic.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateVideo = async (prompt: string) => {
        // Check constraint only if using Veo
        if (videoProvider === 'veo' && !hasVeo) {
            alert("Veo is not enabled. Switch to 'Motion (Free)' or enable Veo.");
            return;
        }

        setIsVideoLoading(true);
        setImageUrl(null);
        setVideoUrl(null);
        setMotionUrls(null);

        try {
            if (videoProvider === 'flux-motion') {
                // Free Flux Motion (Slideshow)
                const urls = await import('../services/gemini').then(m => m.generateFluxMotionAssets(prompt));
                setMotionUrls(urls);
            } else {
                // Paid Veo
                const uri = await generateVideoAsset(prompt, videoDuration, videoResolution);
                setVideoUrl(uri);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to generate video asset.");
        } finally {
            setIsVideoLoading(false);
        }
    };

    const handleGenerateImage = async (prompt: string) => {
        // Check constraint only if using Google provider (Imagen requires it)
        if (imageProvider === 'google' && !hasImagen) {
            alert("Imagen is not enabled in your tech stack. Switch to 'Pollinations' for free generation or enable Imagen.");
            return;
        }

        setIsImageLoading(true);
        setVideoUrl(null);
        try {
            const result = await generateImageAsset(prompt, imageProvider);
            setImageUrl(result);
        } catch (e) {
            console.error(e);
            alert("Failed to generate image.");
        } finally {
            setIsImageLoading(false);
        }
    };

    const handleGenerateVoiceover = async () => {
        if (!concept?.script) return;
        pauseAudio(); // Ensure previous audio stops before requesting new one
        setIsAudioLoading(true);
        try {
            const base64 = await generateVoiceover(concept.script);
            setAudioBase64(base64);
        } catch (e) {
            console.error(e);
            alert("Failed to generate voiceover.");
        } finally {
            setIsAudioLoading(false);
        }
    };

    const handleComposeVideo = async () => {
        if (!concept) return;

        const videoSource = videoUrl || motionUrls;
        if (!videoSource || !audioBase64) {
            console.log('Missing video or audio for composition');
            return;
        }

        setIsComposing(true);
        setCompositionProgress(0);

        try {
            const durationSeconds = parseInt(videoDuration.replace('s', ''));
            const blob = await composeVideo(
                videoSource,
                audioBase64,
                durationSeconds,
                (progress) => setCompositionProgress(progress)
            );

            // Create object URL for preview
            const url = URL.createObjectURL(blob);
            setComposedVideoBlob(blob);
            setComposedVideoUrl(url);

            console.log('Video composition complete!', url);
        } catch (error) {
            console.error('Composition error:', error);
            alert(`Failed to compose video: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsComposing(false);
        }
    };

    const handleDownloadVideo = () => {
        if (!composedVideoBlob) return;

        const url = URL.createObjectURL(composedVideoBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${concept?.topic || 'trendshorts'}-final.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleMorePrompts = async () => {
        if (!concept) return;
        setIsMorePromptsLoading(true);
        try {
            const newPrompts = await generateMoreImagePrompts(concept.topic, concept.script, concept.visualStyle);
            setConcept(prev => prev ? { ...prev, imagePrompts: [...prev.imagePrompts, ...newPrompts] } : null);
        } catch (e) {
            console.error(e);
            alert("Failed to generate more prompts.");
        } finally {
            setIsMorePromptsLoading(false);
        }
    };

    const handleAddManualPrompt = () => {
        if (!concept) return;
        setConcept({ ...concept, imagePrompts: [...concept.imagePrompts, "New scene description..."] });
    };

    const handleDeletePrompt = (index: number) => {
        if (!concept) return;
        const updated = concept.imagePrompts.filter((_, i) => i !== index);
        setConcept({ ...concept, imagePrompts: updated });
    };

    const handlePromptChange = (index: number, newValue: string) => {
        if (!concept) return;
        const updatedPrompts = [...concept.imagePrompts];
        updatedPrompts[index] = newValue;
        setConcept({ ...concept, imagePrompts: updatedPrompts });
    };

    const handleVisualStyleChange = (newValue: string) => {
        if (!concept) return;
        setConcept({ ...concept, visualStyle: newValue });
    };

    const handleSaveTemplate = () => {
        if (!concept || !newTemplateName.trim()) return;

        const newTemplate: StyleTemplate = {
            id: Date.now().toString(),
            name: newTemplateName.trim(),
            style: concept.visualStyle
        };

        const updated = [...templates, newTemplate];

        // Save custom ones to local storage
        const customTemplates = updated.filter(t => !DEFAULT_TEMPLATES.some(dt => dt.id === t.id));
        localStorage.setItem('trendShorts_styleTemplates', JSON.stringify(customTemplates));

        setTemplates(updated);
        setIsSavingTemplate(false);
        setNewTemplateName('');
        setSelectedTemplateId(newTemplate.id);
    };

    const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = templates.filter(t => t.id !== id);
        setTemplates(updated);

        const customTemplates = updated.filter(t => !DEFAULT_TEMPLATES.some(dt => dt.id === t.id));
        localStorage.setItem('trendShorts_styleTemplates', JSON.stringify(customTemplates));

        if (selectedTemplateId === id) setSelectedTemplateId('');
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setVideoUrl(url);
            setImageUrl(null);
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const handleShare = async () => {
        if (!concept) return;

        const shareText = `🎬 TrendShorts Concept\n\nTopic: ${concept.topic}\nStyle: ${concept.visualStyle}\n\nScript:\n${concept.script.substring(0, 150)}...\n\nGenerated with TrendShorts AI #TrendShorts #AI #ContentCreation`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'TrendShorts Concept',
                    text: shareText,
                });
            } else {
                await navigator.clipboard.writeText(shareText);
                // Fallback to Twitter intent for better "social" feeling on desktop
                const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
                window.open(twitterUrl, '_blank');
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleSimulatePublish = () => {
        if (!concept) return;
        const confirm = window.confirm(`Ready to publish "${concept.topic}" to YouTube Shorts?\n\nThis will compile assets and schedule the upload.`);
        if (confirm) {
            alert(`🚀 Success! "${concept.topic}" has been scheduled for upload.\n\n(Simulation Complete)`);
        }
    };

    const handleSaveDraft = () => {
        if (!strategy) return;
        setSaveStatus('saving');

        // Construct SavedProject object
        const savedProject: SavedProject = {
            id: Date.now().toString(),
            name: topic || `Draft: ${strategy.title}`,
            date: Date.now(),
            genre,
            strategy,
            concept: concept || undefined,
            videoUrl,
            motionUrls,
            imageUrl
        };

        // Save to localStorage
        try {
            const existing = localStorage.getItem('trendshorts_history');
            const history = existing ? JSON.parse(existing) : [];
            // Remove mostly duplicate if editing recent
            const updated = [savedProject, ...history.slice(0, 49)]; // Limit to 50
            localStorage.setItem('trendshorts_history', JSON.stringify(updated));

            setTimeout(() => {
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            }, 800);
        } catch (e) {
            console.error("Failed to save draft", e);
            setSaveStatus('idle');
            alert("Failed to save draft. Local storage might be full.");
        }
    };

    return (
        <div className="h-full flex flex-col animate-fadeIn bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <LayoutTemplate className="text-indigo-600" />
                        Content Studio
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">Strategy: {strategy.title} | {strategy.automationLevel} Mode</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSaveDraft}
                        disabled={saveStatus !== 'idle'}
                        title="Save Project Draft"
                        className={`bg-white border border-slate-300 text-slate-700 p-2 rounded-lg transition-all shadow-sm flex items-center gap-2 ${saveStatus === 'saved' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'hover:bg-slate-50'}`}
                    >
                        {saveStatus === 'saving' ? <Loader2 size={18} className="animate-spin" /> : saveStatus === 'saved' ? <Check size={18} /> : <Save size={18} />}
                        <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">{saveStatus === 'saved' ? 'Saved' : 'Save Draft'}</span>
                    </button>

                    <button
                        onClick={handleReset}
                        title="Reset Workspace (New Concept)"
                        className="bg-white border border-slate-300 hover:bg-red-50 hover:text-red-600 text-slate-700 p-2 rounded-lg transition-colors shadow-sm"
                    >
                        <RotateCcw size={18} />
                    </button>
                    <button
                        onClick={() => setShowStackConfig(true)}
                        title="Configure AI Stack"
                        className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 p-2 rounded-lg transition-colors shadow-sm flex items-center gap-2"
                    >
                        <Settings size={18} />
                        <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Settings</span>
                    </button>
                    <button
                        onClick={() => onComplete(concept!, videoUrl, motionUrls, imageUrl)}
                        disabled={!concept}
                        title="Proceed to Publish"
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-md ${concept ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        Publish <ArrowLeft className="rotate-180" size={16} />
                    </button>
                </div>
            </div>

            {/* Stack Config Modal */}
            {showStackConfig && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Wrench size={18} className="text-indigo-600" /> AI Stack Configuration
                            </h3>
                            <button onClick={() => setShowStackConfig(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                            {tools.map(tool => (
                                <div
                                    key={tool.id}
                                    onClick={() => !tool.required && setTools(prev => prev.map(t => t.id === tool.id ? { ...t, selected: !t.selected } : t))}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${tool.selected ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 opacity-60'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded flex items-center justify-center ${tool.selected ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>
                                        {tool.selected && <Check size={14} />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="font-bold text-sm text-slate-900">{tool.name}</span>
                                            {tool.required && <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 rounded">Required</span>}
                                        </div>
                                        <p className="text-xs text-slate-500">{tool.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button onClick={() => setShowStackConfig(false)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700">
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* 3-Column Layout: Controls | Prompts | Video */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden gap-0">

                {/* Column 1: Editor & Config */}
                <div className="w-full lg:w-[360px] xl:w-[420px] shrink-0 bg-white p-6 overflow-y-auto border-r border-slate-200 custom-scrollbar z-10 shadow-sm">

                    {/* Guide */}
                    {showGuide && (
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 text-sm text-slate-700 animate-slideDown mb-6">
                            <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                                <Zap size={16} /> Quick Start
                            </h4>
                            <p className="mb-2">1. Enter a topic and click "Regenerate Draft".</p>
                            <p className="mb-2">2. Review the generated script.</p>
                            <p>3. Use the right panel to generate visual assets.</p>
                        </div>
                    )}

                    {/* Controls Section */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
                        <label className="block text-slate-600 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                            Concept Setup <span className="text-slate-300">|</span> <span className="text-indigo-600">{genre}</span>
                        </label>
                        <div className="flex flex-col gap-4">
                            <div>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder={`Enter a topic (e.g., 'Future of AI')`}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateConcept()}
                                />
                            </div>

                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <select
                                        value={selectedTemplateId}
                                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-3 pr-8 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="">Auto-Detect Style</option>
                                        {templates.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <Palette size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                                <button
                                    onClick={() => handleGenerateConcept()}
                                    disabled={isGenerating || !topic}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 shadow-md transition-all shrink-0"
                                >
                                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                                    {isGenerating ? 'Generating...' : 'Generate'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Script Area */}
                    {concept && (
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-fadeIn">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <FileText className="text-emerald-500" size={16} />
                                    Script & Voice
                                </h3>
                                {hasTts && !audioBase64 && !isAudioLoading && (
                                    <button
                                        onClick={handleGenerateVoiceover}
                                        title="Generate AI voiceover"
                                        className="text-[10px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-1 rounded-md flex items-center gap-1 transition-colors border border-indigo-200 font-bold uppercase tracking-wide"
                                    >
                                        <Mic size={12} /> Generate Audio
                                    </button>
                                )}
                                {isAudioLoading && (
                                    <div className="flex items-center gap-2 text-indigo-600 text-xs font-medium">
                                        <Loader2 size={14} className="animate-spin" /> Generated...
                                    </div>
                                )}
                            </div>

                            <div className="bg-slate-50 p-4 rounded-lg text-slate-700 whitespace-pre-line text-sm leading-relaxed font-mono h-64 overflow-y-auto border border-slate-200 mb-4 shadow-inner">
                                {concept.script}
                            </div>

                            {/* Audio Player */}
                            {audioBase64 && (
                                <div className="bg-indigo-50/30 rounded-lg border border-indigo-100 p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-[10px] font-bold text-indigo-400 uppercase flex items-center gap-1">
                                            <Volume2 size={12} /> Preview
                                        </h4>
                                    </div>
                                </div>
                            )}
                            {/* Duration Selector */}
                            <div className="relative group" title="Target Video Duration">
                                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-lg">
                                    <Clock size={14} className="text-slate-400" />
                                    <select
                                        value={videoDuration}
                                        onChange={(e) => setVideoDuration(e.target.value)}
                                        className="bg-transparent text-xs text-slate-600 font-medium outline-none cursor-pointer appearance-none pr-1"
                                    >
                                        <option value="6s">6s</option>
                                        <option value="15s">15s</option>
                                        <option value="30s">30s</option>
                                        <option value="45s">45s</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={triggerFileUpload}
                                title="Upload a local video file to preview"
                                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors border border-slate-200 font-medium"
                            >
                                <Upload size={14} /> Upload
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept="video/*"
                                className="hidden"
                            />
                        </div>
                    )}
                </div>

                {/* Column 2: Prompts List (Middle - Dark Theme) */}
                <div className="flex-1 bg-slate-900 p-6 overflow-y-auto custom-scrollbar border-r border-slate-800">
                    {/* Prompts Header */}
                    <div className="flex justify-between items-end mb-4">
                        <p className="text-xs font-bold text-slate-500 uppercase">Visual Prompts (Video & Image)</p>
                        <span className="text-[10px] text-slate-500 italic">Click text to edit</span>
                    </div>

                    {/* Prompts List */}
                    <div className="space-y-3">
                        {concept?.imagePrompts?.map((prompt, idx) => (
                            <div key={idx} className="group bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 text-xs text-slate-300 flex gap-3 items-start transition-all hover:border-indigo-500/30 hover:bg-slate-800 hover:shadow-lg relative">
                                <textarea
                                    value={prompt}
                                    onChange={(e) => handlePromptChange(idx, e.target.value)}
                                    title="Edit prompt for video or image generation"
                                    className="flex-1 bg-transparent border border-transparent focus:bg-slate-700 focus:border-indigo-500/30 focus:ring-1 focus:ring-indigo-500/50 rounded-lg px-2 py-1.5 outline-none resize-y min-h-[5em] transition-all font-medium text-slate-400 focus:text-slate-200 pr-0 leading-relaxed custom-scrollbar"
                                    placeholder="Describe the scene, action, and camera movement..."
                                />
                                <div className="flex flex-col gap-2 shrink-0 pt-0.5">
                                    {hasVeo && (
                                        <button
                                            onClick={() => handleGenerateVideo(prompt)}
                                            className="text-indigo-400 hover:text-indigo-300 bg-slate-700 hover:bg-indigo-900/50 p-2.5 rounded-lg transition-all shadow-sm border border-slate-600 hover:border-indigo-500/50"
                                            title={`Generate ${videoDuration} video with Veo at ${videoResolution}`}
                                        >
                                            <Video size={16} />
                                        </button>
                                    )}
                                    {hasImagen && (
                                        <button
                                            onClick={() => handleGenerateImage(prompt)}
                                            className="text-purple-400 hover:text-purple-300 bg-slate-700 hover:bg-purple-900/50 p-2.5 rounded-lg transition-all shadow-sm border border-slate-600 hover:border-purple-500/50"
                                            title="Generate static image with Imagen 3"
                                        >
                                            <ImageIcon size={16} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeletePrompt(idx)}
                                        className="text-slate-500 hover:text-red-400 bg-transparent hover:bg-red-900/20 p-2.5 rounded-lg transition-colors"
                                        title="Delete this prompt"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Add Prompt Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddManualPrompt}
                                title="Add a new blank prompt manually"
                                className="flex-1 bg-slate-800/50 hover:bg-slate-800 text-slate-500 hover:text-white font-medium py-3 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 border-dashed transition-all"
                            >
                                <Plus size={14} /> Add Manual Prompt
                            </button>
                            <button
                                onClick={handleMorePrompts}
                                disabled={isMorePromptsLoading}
                                title="Generate 3 additional image prompts using AI"
                                className="flex-[2] bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-medium py-2 rounded-lg text-xs flex items-center justify-center gap-2 border border-indigo-500/30 transition-colors"
                            >
                                {isMorePromptsLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                                Generate 3 More AI Prompts
                            </button>
                        </div>
                    </div>
                </div>

                {/* Column 3: Video Preview (Right - Vertical, Prominent) */}
                <div className="w-full lg:w-[400px] xl:w-[480px] shrink-0 bg-black p-6 overflow-y-auto custom-scrollbar flex flex-col items-center gap-4">
                    {/* Main Visual Preview */}
                    <div className="w-full bg-black rounded-2xl overflow-hidden aspect-[9/16] relative shadow-2xl flex items-center justify-center group border border-slate-800 ring-1 ring-slate-800/50">
                        {/* 1. Video (Veo) */}
                        {videoUrl && (
                            <video
                                src={videoUrl}
                                className="w-full h-full object-cover"
                                controls
                                autoPlay
                                loop
                                muted
                            />
                        )}

                        {/* 2. Flux Motion (Slideshow) */}
                        {motionUrls && !videoUrl && (
                            <div className="w-full h-full relative overflow-hidden">
                                {motionUrls.map((url, i) => (
                                    <div
                                        key={i}
                                        className="absolute inset-0 w-full h-full bg-cover bg-center animate-ken-burns"
                                        style={{
                                            backgroundImage: `url(${url})`,
                                            animationDelay: `${i * 3}s`,
                                            opacity: 0
                                        }}
                                    />
                                ))}
                                <style>{`
                            @keyframes ken-burns {
                                0% { opacity: 0; transform: scale(1); }
                                10% { opacity: 1; }
                                90% { opacity: 1; }
                                100% { opacity: 0; transform: scale(1.1); }
                            }
                            .animate-ken-burns {
                                animation: ken-burns 9s infinite;
                            }
                        `}</style>
                                <div className="absolute bottom-4 right-4 bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">
                                    Generated with Flux Motion
                                </div>
                            </div>
                        )}

                        {/* 3. Static Image */}
                        {imageUrl && !videoUrl && !motionUrls && (
                            <img src={imageUrl} alt="Generated Asset" className="w-full h-full object-cover" />
                        )}

                        {/* 4. Loading State */}
                        {(isVideoLoading || isImageLoading) && (
                            <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center text-white z-10">
                                <Loader2 size={48} className="animate-spin mb-4 text-indigo-500" />
                                <p className="font-bold animate-pulse text-sm">
                                    {isVideoLoading ? (videoProvider === 'veo' ? 'Rendering with Veo...' : 'Creating Motion...') : 'Generating Image...'}
                                </p>
                                {isVideoLoading && videoProvider === 'flux-motion' && <p className="text-xs text-slate-400 mt-2">Generating 3 frames</p>}
                            </div>
                        )}

                        {/* 5. Placeholder */}
                        {!videoUrl && !imageUrl && !motionUrls && !isVideoLoading && !isImageLoading && (
                            <div className="text-center p-8 opacity-40">
                                <Film size={48} className="mx-auto mb-4 text-slate-600" />
                                <h3 className="text-xl font-bold text-slate-500 mb-2">Preview</h3>
                                <p className="text-sm text-slate-600">Select a prompt to generate</p>
                            </div>
                        )}
                    </div>

                    {/* Asset URL (if exists) */}
                    {(videoUrl || imageUrl) && (
                        <div className="w-full bg-slate-900 p-3 rounded-lg border border-slate-700">
                            <div className="flex items-center gap-2 mb-1">
                                <Link size={12} className="text-slate-500" />
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Asset URL</label>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={videoUrl || imageUrl || ''}
                                    className="flex-1 bg-black border border-slate-700 text-[10px] text-slate-400 rounded px-2 py-1 font-mono truncate focus:outline-none"
                                    onClick={(e) => e.currentTarget.select()}
                                />
                                <a
                                    href={videoUrl || imageUrl || '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-slate-800 border border-slate-700 p-1.5 rounded hover:text-indigo-400 hover:border-indigo-500 transition-colors"
                                >
                                    <Globe size={14} />
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};