
import React, { useState } from 'react';
import { ToolOption, IntegrationType } from '../types';
import { Check, Settings, Youtube, MessageSquare, Video, Mic, ArrowLeft, Wrench, HelpCircle } from 'lucide-react';

interface Props {
  onNext: (tools: ToolOption[]) => void;
  onBack: () => void;
}

const DEFAULT_TOOLS: ToolOption[] = [
  {
    id: 'gemini-flash',
    name: 'Gemini 2.5 Flash',
    type: IntegrationType.CONTENT,
    description: 'High-speed text generation for scripts and metadata. Extremely low latency and cost.',
    required: true,
    selected: true
  },
  {
    id: 'google-trends',
    name: 'Google Trends Data (Grounding)',
    type: IntegrationType.CONTENT,
    description: 'Uses Gemini Grounding with Google Search to identify real-time spikes in interest.',
    required: true,
    selected: true
  },
  {
    id: 'veo',
    name: 'Veo Video Generation',
    type: IntegrationType.VIDEO,
    description: 'Generates cinematic 1080p video clips from text. (Premium: Requires paid key, approx $0.10+ per video).',
    required: false,
    selected: true
  },
  {
    id: 'imagen',
    name: 'Imagen 3 (Static Images)',
    type: IntegrationType.VIDEO,
    description: 'Generates static images as an alternative to video.',
    required: false,
    selected: true
  },
  {
    id: 'youtube-api',
    name: 'YouTube Data API',
    type: IntegrationType.PUBLISHING,
    description: 'Essential for auto-uploading, setting titles, tags, and scheduling posts.',
    required: true,
    selected: true
  },
  {
    id: 'tts-gemini',
    name: 'Gemini Text-to-Speech',
    type: IntegrationType.VOICE,
    description: 'Native audio generation for narration.',
    required: false,
    selected: true
  }
];

export const TechStackStage: React.FC<Props> = ({ onNext, onBack }) => {
  const [tools, setTools] = useState<ToolOption[]>(DEFAULT_TOOLS);
  const [showGuide, setShowGuide] = useState(false);

  const toggleTool = (id: string) => {
    setTools(prev => prev.map(t => 
      t.id === id && !t.required ? { ...t, selected: !t.selected } : t
    ));
  };

  const getIcon = (type: IntegrationType) => {
    switch (type) {
      case IntegrationType.CONTENT: return <MessageSquare size={20} />;
      case IntegrationType.VIDEO: return <Video size={20} />;
      case IntegrationType.PUBLISHING: return <Youtube size={20} />;
      case IntegrationType.VOICE: return <Mic size={20} />;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn h-full overflow-y-auto pb-20">
      <div className="text-center space-y-4 relative">
        <button 
            onClick={() => setShowGuide(!showGuide)}
            className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full transition-colors absolute right-0 top-0 md:right-4"
            title="How it works"
         >
            <HelpCircle size={20} />
         </button>

        <h2 className="text-3xl font-bold text-slate-900">Step 2: Architecture & Integrations</h2>
        <p className="text-slate-600 max-w-2xl mx-auto text-lg">
          Select the components for your automated pipeline. 
          We've pre-selected the essential stack for a robust AI automation app.
        </p>

        {showGuide && (
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 text-sm text-slate-700 animate-slideDown max-w-2xl mx-auto text-left">
                <h4 className="font-bold text-indigo-900 mb-2">Why customize the stack?</h4>
                <p className="mb-2">This step defines which AI models will be active in the Content Generation studio.</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Veo (Video):</strong> Best for high-quality motion backgrounds. Enable if you want cinematic outputs.</li>
                    <li><strong>Imagen (Image):</strong> A static alternative. Good for slideshow-style Shorts.</li>
                    <li><strong>Gemini TTS:</strong> Enable this to generate audio narration.</li>
                </ul>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((tool) => (
          <div 
            key={tool.id}
            onClick={() => toggleTool(tool.id)}
            title={tool.required ? "This tool is required" : "Click to toggle this tool"}
            className={`flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${
              tool.selected 
                ? 'bg-indigo-50 border-indigo-500 shadow-md' 
                : 'bg-white border-slate-200 hover:border-indigo-300 opacity-80 hover:opacity-100'
            }`}
          >
            <div className={`p-3 rounded-lg ${tool.selected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {getIcon(tool.type)}
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-slate-900 text-lg">{tool.name}</h4>
                    {tool.selected && <Check size={20} className="text-indigo-600 bg-white rounded-full p-0.5" />}
                </div>
                <p className="text-sm text-slate-600 leading-snug">{tool.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Settings size={20} className="text-indigo-600" />
            Estimated Pipeline Workflow
        </h3>
        <p className="text-slate-600 text-sm leading-relaxed">
            1. <strong>Trigger:</strong> Schedule (Cron Job) or Manual Input.<br/>
            2. <strong>Trend Analysis:</strong> {tools.find(t => t.id === 'google-trends')?.selected ? 'Gemini scans Search & News.' : 'Manual topic entry.'}<br/>
            3. <strong>Scripting:</strong> Gemini 2.5 Flash generates 3 script variations.<br/>
            4. <strong>Media Gen:</strong> {tools.find(t => t.id === 'veo')?.selected ? 'Veo generates clips.' : 'Imagen creates slides.'}<br/>
            5. <strong>Assembly:</strong> FFMPEG (Backend) stitches Audio + Video.<br/>
            6. <strong>Publishing:</strong> {tools.find(t => t.id === 'youtube-api')?.selected ? 'Auto-upload to YouTube.' : 'Download file for manual upload.'}
        </p>
      </div>

      <div className="flex justify-between pt-4 items-center">
        <button
            onClick={onBack}
            title="Return to Brainstorming"
            className="text-slate-500 hover:text-slate-900 px-6 py-2 font-medium flex items-center gap-2"
        >
            <ArrowLeft size={18} /> Back
        </button>
        <button
            onClick={() => onNext(tools)}
            title="Confirm stack and enter content generation studio"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-bold py-3 px-10 rounded-full shadow-lg shadow-indigo-200 flex items-center gap-2"
        >
            <Wrench size={20} />
            Start Content Gen
        </button>
      </div>
    </div>
  );
};