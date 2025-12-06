import React, { useState, useRef, useEffect } from 'react';
import { StrategyOption, ToolOption, ShortConcept } from '../types';
import { generateShortConcept, generateVideoAsset, generateVoiceover, generateImageAsset, generateMoreImagePrompts } from '../services/gemini';
import {
    Loader2, Play, LayoutTemplate, FileText, Image as ImageIcon,
    RefreshCcw, UploadCloud, Film, Youtube, Globe, Mic, Volume2, Pause, ArrowLeft, Video, SkipBack, SkipForward, Upload, Share2, Link, Plus, Save, Trash2, Palette, Clock, HelpCircle, AlertCircle, Zap, Monitor, RotateCcw,
    Settings, Wrench, Check
} from 'lucide-react';
import { IntegrationType } from '../types';

interface Props {
    genre: string;
    strategy: StrategyOption;
    onBack: () => void;
    onComplete: (concept: ShortConcept, videoUrl: string | null, motionUrls: string[] | null, imageUrl: string | null) => void;
    imageProvider: 'google' | 'pollinations';
    videoProvider: 'veo' | 'flux-motion';
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

export const PrototypeDashboard: React.FC<Props> = ({ genre, strategy, onBack, onComplete, imageProvider, videoProvider }) => {
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

        // Construct a strong topic from the inputs if topic is empty
        if (!topic && !hasAutoTriggered.current) {
            const autoTopic = `${strategy.title}: ${strategy.searchQuery || genre}`;
            setTopic(autoTopic);

            // Trigger generation automatically for smooth workflow
            hasAutoTriggered.current = true;
            // Use a timeout to ensure state is set before triggering (React state batching)
            setTimeout(() => handleGenerateConcept(autoTopic), 100);
        }
    }, [strategy, genre]);

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

    return (
        <div className="h-full flex flex-col animate-fadeIn bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <LayoutTemplate className="text-indigo-600" />
                        Content Generation Studio
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">Strategy: {strategy.title} | Mode: {strategy.automationLevel}</p>
                </div>
                <div className="flex items-center gap-2">
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
                        <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Stack</span>
                    </button>
                    <button
                        onClick={() => setShowGuide(!showGuide)}
                        className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full transition-colors"
                        title="How it works"
                    >
                        <HelpCircle size={20} />
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
                                <RotateCcw className="rotate-45" size={20} /> {/* X icon alternative */}
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


            <div className="flex-1 bg-slate-50/50 p-6 overflow-y-auto">

                {showGuide && (
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 text-sm text-slate-700 animate-slideDown max-w-4xl mx-auto mb-6">
                        <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                            <Zap size={16} /> Quick Guide: Content Generation
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                                <span className="font-bold text-indigo-600 block mb-1">1. Auto-Config</span>
                                Your trend strategy is automatically converted into a video topic.
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                                <span className="font-bold text-indigo-600 block mb-1">2. Draft</span>
                                We automatically generate a script and visual plan grounded in real sources.
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                                <span className="font-bold text-indigo-600 block mb-1">3. Assets</span>
                                Generate Voiceover (TTS) and click the video/image icons next to prompts to create visuals.
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                                <span className="font-bold text-indigo-600 block mb-1">4. Publish</span>
                                Use "Simulate Publish" to test the final workflow step (upload scheduling).
                            </div>
                        </div>
                    </div>
                )}

                {/* Input Section */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
                    <label className="block text-slate-600 text-xs font-bold uppercase tracking-wider mb-2">
                        Concept Configuration
                    </label>
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-4 flex-col sm:flex-row">
                            <div className="flex-1 space-y-1">
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder={`Enter a ${genre} topic (e.g., 'Recent breakthrough in...')`}
                                    title="Enter the specific topic for your YouTube Short"
                                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner"
                                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateConcept()}
                                />
                            </div>

                            {/* Style Template Selector */}
                            <div className="sm:w-1/3 space-y-1">
                                <div className="relative">
                                    <select
                                        value={selectedTemplateId}
                                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                                        title="Select a visual style template to guide generation"
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-3 pr-8 py-3 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="">Auto-Detect Style</option>
                                        {templates.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <Palette size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => handleGenerateConcept()}
                            disabled={isGenerating || !topic}
                            title="Generate script and concept based on topic and selected style"
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 shadow-md transition-all"
                        >
                            {isGenerating ? <Loader2 className="animate-spin" /> : <RefreshCcw size={18} />}
                            {isGenerating ? 'Generating Draft...' : 'Regenerate Draft'}
                        </button>
                    </div>
                </div>

                {/* Results Area */}
                {concept && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Script & Audio */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <FileText className="text-emerald-500" size={20} />
                                        Generated Script
                                    </h3>
                                    {hasTts && !audioBase64 && !isAudioLoading && (
                                        <button
                                            onClick={handleGenerateVoiceover}
                                            title="Generate AI voiceover using Gemini TTS"
                                            className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors border border-indigo-200 font-medium"
                                        >
                                            <Mic size={14} /> Generate Audio
                                        </button>
                                    )}
                                    {isAudioLoading && (
                                        <div className="flex items-center gap-2 text-indigo-600 text-xs font-medium">
                                            <Loader2 size={16} className="animate-spin" /> Generating Voice...
                                        </div>
                                    )}
                                </div>

                                <div className="bg-slate-50 p-5 rounded-lg text-slate-700 whitespace-pre-line text-sm leading-relaxed font-mono h-48 overflow-y-auto border border-slate-200 mb-6">
                                    {concept.script}
                                </div>

                                {/* Audio Player */}
                                {audioBase64 && (
                                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                                <Volume2 size={14} /> Audio Preview
                                            </h4>
                                            <span className="text-xs font-mono text-slate-500">
                                                {formatTime(currentTime)} / {formatTime(duration)}
                                            </span>
                                        </div>

                                        {/* Visualizer */}
                                        <canvas
                                            ref={canvasRef}
                                            width={300}
                                            height={40}
                                            className="w-full h-12 rounded bg-white border border-slate-200 mb-3"
                                        />

                                        {/* Controls */}
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={isPlaying ? pauseAudio : playAudio}
                                                title={isPlaying ? "Pause" : "Play"}
                                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${isPlaying
                                                    ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                                                    : 'bg-indigo-600 text-white hover:bg-indigo-500'
                                                    }`}
                                            >
                                                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                                            </button>

                                            <div className="flex-1 flex flex-col gap-1">
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={duration || 100}
                                                    value={currentTime}
                                                    onChange={handleSeek}
                                                    title="Seek"
                                                    step="0.1"
                                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                                />
                                            </div>

                                            <div className="flex items-center gap-2 w-24">
                                                <Volume2 size={16} className="text-slate-400" />
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="1"
                                                    step="0.01"
                                                    value={volume}
                                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                                    title="Volume"
                                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {concept.sources && concept.sources.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                                            <Globe size={12} /> Sources (Grounding)
                                        </h4>
                                        <ul className="space-y-1">
                                            {concept.sources.slice(0, 3).map((source, i) => (
                                                <li key={i} className="text-xs text-indigo-600 truncate hover:text-indigo-800">
                                                    <a href={source} target="_blank" rel="noopener noreferrer" title="Open source in new tab">{source}</a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <UploadCloud className="text-blue-500" size={20} />
                                        Publishing Meta
                                    </h3>
                                    {isSavingTemplate ? (
                                        <div className="flex gap-2 animate-fadeIn">
                                            <input
                                                type="text"
                                                placeholder="Template Name"
                                                value={newTemplateName}
                                                onChange={(e) => setNewTemplateName(e.target.value)}
                                                className="text-xs border border-slate-300 rounded px-2 py-1 outline-none focus:border-indigo-500 w-32"
                                                autoFocus
                                            />
                                            <button onClick={handleSaveTemplate} title="Confirm Save" className="text-xs bg-indigo-600 text-white px-2 py-1 rounded font-bold">Save</button>
                                            <button onClick={() => setIsSavingTemplate(false)} title="Cancel" className="text-xs text-slate-500 hover:text-slate-800 px-1">Cancel</button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsSavingTemplate(true)}
                                            title="Save this visual style as a reusable template"
                                            className="text-xs bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                                        >
                                            <Save size={14} /> Save Style
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <label className="text-xs text-slate-400 font-bold uppercase block mb-1">Title</label>
                                        <p className="text-slate-900 font-medium">{concept.topic} #Shorts</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 relative group/style">
                                        <label className="text-xs text-slate-400 font-bold uppercase block mb-1 flex justify-between">
                                            Visual Style
                                            <span className="text-[10px] font-normal text-slate-400 italic">Editable</span>
                                        </label>
                                        <textarea
                                            value={concept.visualStyle}
                                            onChange={(e) => handleVisualStyleChange(e.target.value)}
                                            title="Edit visual style description"
                                            className="w-full bg-transparent border-none p-0 text-slate-700 text-sm focus:ring-0 outline-none resize-none h-24"
                                        />
                                    </div>

                                    {/* Saved Templates List Management */}
                                    {templates.filter(t => !DEFAULT_TEMPLATES.some(dt => dt.id === t.id)).length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-slate-100">
                                            <label className="text-xs text-slate-400 font-bold uppercase block mb-2">My Saved Templates</label>
                                            <div className="flex flex-wrap gap-2">
                                                {templates.filter(t => !DEFAULT_TEMPLATES.some(dt => dt.id === t.id)).map(t => (
                                                    <div key={t.id} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 flex items-center gap-2">
                                                        <span
                                                            className="cursor-pointer hover:text-indigo-600 truncate max-w-[100px]"
                                                            title={t.style}
                                                            onClick={() => {
                                                                setSelectedTemplateId(t.id);
                                                                handleVisualStyleChange(t.style);
                                                            }}
                                                        >
                                                            {t.name}
                                                        </span>
                                                        <button onClick={(e) => handleDeleteTemplate(t.id, e)} title="Delete Template" className="hover:text-red-500">
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Visuals */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <ImageIcon className="text-purple-500" size={20} />
                                        Visual Assets
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {/* Resolution Selector */}
                                        <div className="relative group" title="Target Video Resolution">
                                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-lg">
                                                <Monitor size={14} className="text-slate-400" />
                                                <select
                                                    value={videoResolution}
                                                    onChange={(e) => setVideoResolution(e.target.value as '720p' | '1080p')}
                                                    className="bg-transparent text-xs text-slate-600 font-medium outline-none cursor-pointer appearance-none pr-1"
                                                >
                                                    <option value="1080p">1080p</option>
                                                    <option value="720p">720p</option>
                                                </select>
                                            </div>
                                        </div>
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
                                </div>

                                {/* Main Visual Preview */}
                                <div className="bg-slate-900 rounded-xl overflow-hidden aspect-[9/16] relative shadow-2xl flex items-center justify-center group">

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
                                            {/* Add Inline Styles for Animation directly here for portability */}
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
                                            <p className="font-bold animate-pulse">
                                                {isVideoLoading ? (videoProvider === 'veo' ? 'Rendering with Veo...' : 'Creating Motion Sequence...') : 'Generating Image...'}
                                            </p>
                                            {isVideoLoading && videoProvider === 'flux-motion' && <p className="text-xs text-slate-400 mt-2">Generating 3 sequential frames</p>}
                                        </div>
                                    )}

                                    {/* 5. Placeholder */}
                                    {!videoUrl && !imageUrl && !motionUrls && !isVideoLoading && !isImageLoading && (
                                        <div className="text-center p-8 opacity-40">
                                            <Film size={48} className="mx-auto mb-4 text-slate-600" />
                                            <h3 className="text-xl font-bold text-slate-500 mb-2">Preview Placeholder</h3>
                                            <p className="text-sm text-slate-600">Select a prompt on the right to generate.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Asset URL Display */}
                                {(videoUrl || imageUrl) && (
                                    <div className="mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200 overflow-hidden">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Link size={12} className="text-slate-400" />
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Asset URL</label>
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                readOnly
                                                value={videoUrl || imageUrl || ''}
                                                title="Click to select asset URL"
                                                className="flex-1 bg-white border border-slate-200 text-[10px] text-slate-600 rounded px-2 py-1 font-mono truncate focus:outline-none focus:border-indigo-500"
                                                onClick={(e) => e.currentTarget.select()}
                                            />
                                            {(videoUrl || imageUrl) && (
                                                <a
                                                    href={videoUrl || imageUrl || '#'}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title="Open media in a new tab"
                                                    className="bg-white border border-slate-200 p-1 rounded hover:text-indigo-600 hover:border-indigo-300 transition-colors"
                                                >
                                                    <Globe size={14} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Prompts List */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <p className="text-xs font-bold text-slate-400 uppercase">Visual Prompts (Video & Image)</p>
                                        <span className="text-[10px] text-slate-400 italic">Click text to edit</span>
                                    </div>
                                    {concept.imagePrompts.map((prompt, idx) => (
                                        <div key={idx} className="group bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs text-slate-700 flex gap-2 items-start transition-all hover:border-indigo-300 hover:shadow-sm relative">
                                            <textarea
                                                value={prompt}
                                                onChange={(e) => handlePromptChange(idx, e.target.value)}
                                                title="Edit prompt for video or image generation"
                                                className="flex-1 bg-transparent border border-transparent focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 rounded px-2 py-1.5 outline-none resize-y min-h-[6em] transition-all font-medium text-slate-600 focus:text-slate-900 pr-8"
                                                placeholder="Describe the scene, action, and camera movement..."
                                            />
                                            <div className="flex flex-col gap-1.5 shrink-0 pt-1">
                                                {hasVeo && (
                                                    <button
                                                        onClick={() => handleGenerateVideo(prompt)}
                                                        className="text-indigo-600 hover:text-indigo-700 bg-white hover:bg-indigo-50 p-2 rounded-md transition-colors shadow-sm border border-slate-200 hover:border-indigo-200"
                                                        title={`Generate ${videoDuration} video with Veo at ${videoResolution}`}
                                                    >
                                                        <Video size={16} />
                                                    </button>
                                                )}
                                                {hasImagen && (
                                                    <button
                                                        onClick={() => handleGenerateImage(prompt)}
                                                        className="text-purple-600 hover:text-purple-700 bg-white hover:bg-purple-50 p-2 rounded-md transition-colors shadow-sm border border-slate-200 hover:border-purple-200"
                                                        title="Generate static image with Imagen 3"
                                                    >
                                                        <ImageIcon size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeletePrompt(idx)}
                                                    className="text-slate-400 hover:text-red-600 bg-transparent hover:bg-red-50 p-2 rounded-md transition-colors"
                                                    title="Delete this prompt"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleAddManualPrompt}
                                            title="Add a new blank prompt manually"
                                            className="flex-1 bg-white hover:bg-slate-50 text-slate-600 font-medium py-2 rounded-lg text-xs flex items-center justify-center gap-2 border border-slate-200 transition-colors border-dashed"
                                        >
                                            <Plus size={14} /> Add Manual Prompt
                                        </button>
                                        <button
                                            onClick={handleMorePrompts}
                                            disabled={isMorePromptsLoading}
                                            title="Generate 3 additional image prompts using AI"
                                            className="flex-[2] bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-2 rounded-lg text-xs flex items-center justify-center gap-2 border border-slate-200 transition-colors"
                                        >
                                            {isMorePromptsLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                                            Generate 3 More AI Prompts
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {!concept && !isGenerating && (
                    <div className="text-center py-20 opacity-40">
                        <LayoutTemplate size={64} className="mx-auto mb-4 text-slate-400" />
                        <p className="text-slate-500 text-lg">Initializing Content Generation Workflow...</p>
                    </div>
                )}
            </div>
        </div >
    );
};