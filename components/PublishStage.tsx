
import React, { useState } from 'react';
import { ShortConcept } from '../types';
import { Youtube, CheckCircle, UploadCloud, Share2, Download, ArrowLeft, Twitter, Linkedin, Facebook, Loader2 } from 'lucide-react';

interface Props {
    concept: ShortConcept | null;
    videoUrl: string | null;
    motionUrls: string[] | null;
    imageUrl: string | null;
    onBack: () => void;
    onRestart: () => void;
}

export const PublishStage: React.FC<Props> = ({ concept, videoUrl, motionUrls, imageUrl, onBack, onRestart }) => {
    const [isPublishing, setIsPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);

    const handlePublish = () => {
        if (!concept) return;
        setIsPublishing(true);

        // Simulate API delay
        setTimeout(() => {
            setIsPublishing(false);
            setIsPublished(true);
        }, 2500);
    };

    const handleDownload = () => {
        // Basic download simulation
        const link = document.createElement('a');
        link.href = videoUrl || (motionUrls ? motionUrls[0] : '') || imageUrl || '';
        link.download = `TrendShorts-${concept?.topic || 'asset'}.mp4`; // Fake extension for sim
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!concept) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center">
                <h2 className="text-2xl font-bold text-slate-400 mb-4">No Content Generated</h2>
                <button onClick={onBack} className="text-indigo-600 font-medium hover:underline">Return to Studio</button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col animate-fadeIn bg-slate-50 relative">

            {/* Success Overlay */}
            {isPublished && (
                <div className="absolute inset-0 bg-white/95 z-50 flex flex-col items-center justify-center animate-fadeIn p-6 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 shadow-green-200 shadow-lg animate-bounce">
                        <CheckCircle size={40} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Published Successfully!</h2>
                    <p className="text-slate-600 text-lg mb-8 max-w-md">
                        Your Short <strong>"{concept.topic}"</strong> is now live on YouTube and scheduled for cross-platform promotion.
                    </p>

                    <div className="flex gap-4">
                        <button
                            onClick={() => window.open('https://youtube.com', '_blank')}
                            className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center gap-2 shadow-lg"
                        >
                            <Youtube size={20} /> Watch on YouTube
                        </button>
                        <button
                            onClick={onRestart}
                            className="bg-white border border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-bold hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            Create Another
                        </button>
                    </div>
                </div>
            )}

            {/* Main Layout */}
            <div className="max-w-6xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">

                {/* Left: Asset Preview */}
                <div className="flex flex-col gap-4">
                    <button onClick={onBack} className="self-start text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium text-sm mb-2">
                        <ArrowLeft size={16} /> Back to Studio
                    </button>

                    <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-[9/16] shadow-2xl relative group w-full max-w-sm mx-auto lg:max-w-none lg:w-full lg:h-[80vh]">
                        {videoUrl ? (
                            <video src={videoUrl} controls className="w-full h-full object-cover" />
                        ) : motionUrls ? (
                            <div className="w-full h-full relative">
                                {motionUrls.map((url, i) => (
                                    <div
                                        key={i}
                                        className="absolute inset-0 bg-cover bg-center animate-ken-burns"
                                        style={{ backgroundImage: `url(${url})`, animationDelay: `${i * 3}s`, opacity: 0 }}
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
                            </div>
                        ) : imageUrl ? (
                            <img src={imageUrl} className="w-full h-full object-cover" alt="Preview" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/50">No Asset</div>
                        )}

                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold border border-white/10">
                            Shorts Preview
                        </div>
                    </div>
                </div>

                {/* Right: Metadata & Actions */}
                <div className="flex flex-col justify-center gap-8 py-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-6">Ready to Publish?</h1>

                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 mb-6">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Title</label>
                                <div className="text-lg font-medium text-slate-900">{concept.topic} #Shorts</div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
                                <div className="text-sm text-slate-600 line-clamp-3">{concept.script.substring(0, 150)}...</div>
                            </div>
                            <div className="flex gap-2">
                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono">#TrendShorts</span>
                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono">#AI</span>
                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono">#{concept.visualStyle.split(' ')[0]}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handlePublish}
                                disabled={isPublishing}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-3"
                            >
                                {isPublishing ? <Loader2 className="animate-spin" /> : <UploadCloud size={24} />}
                                {isPublishing ? 'Uploading to YouTube...' : 'Publish to YouTube Shorts'}
                            </button>

                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={handleDownload} className="flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl transition-colors">
                                    <Download size={18} /> Download
                                </button>
                                <button className="flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl transition-colors">
                                    <Share2 size={18} /> Share Link
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Social Share grid */}
                    <div>
                        <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Or share directly to socials</p>
                        <div className="flex justify-center gap-4">
                            <button className="p-3 bg-sky-50 text-sky-500 rounded-full hover:bg-sky-100 transition-colors"><Twitter size={20} /></button>
                            <button className="p-3 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"><Linkedin size={20} /></button>
                            <button className="p-3 bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors"><Facebook size={20} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
