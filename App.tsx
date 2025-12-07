import React, { useState, useEffect } from 'react';
import { BrainstormStage } from './components/BrainstormStage';
import { PrototypeDashboard } from './components/PrototypeDashboard';
import { PublishStage } from './components/PublishStage';
import { ProjectHistoryModal } from './components/ProjectHistoryModal';
import { AppStage, StrategyOption, ToolOption, RefinedStrategy, ShortConcept, SavedProject } from './types';
import { ProfilePage } from './components/ProfilePage';
import { SettingsPage } from './components/SettingsPage';
import { getAiClient } from './services/gemini';
import { Key, Home, Zap, Layers, PlayCircle, BarChart3, ArrowRight, LogOut, Layout, Cpu, Video, Mic, Globe, CheckCircle2, X, Star, Users, MessageCircle, AlertCircle, Settings, User } from 'lucide-react';

// --- Components for Landing Page Sections ---

const StepByStepPreview: React.FC = () => {
  return (
    <section className="py-24 bg-white border-b border-slate-100 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-10 left-10 w-64 h-64 bg-indigo-100 rounded-full blur-3xl mix-blend-multiply"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-purple-100 rounded-full blur-3xl mix-blend-multiply"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">How TrendShorts Works</h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            Go from "I need an idea" to "Ready to Publish" in three guided steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-indigo-100 via-indigo-200 to-indigo-100 -z-10"></div>

          {/* Step 1 */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-16 h-16 bg-white rounded-2xl border-2 border-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold mb-6 mx-auto shadow-sm relative z-10">
              1
            </div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-3">1. Research & Brainstorm</h3>
            <p className="text-slate-600 text-center text-sm leading-relaxed mb-6">
              Stop guessing what's trending. Select a region (e.g., US, Brazil) and category. Our AI performs live <strong>Google Grounded Search</strong> to find high-opportunity niches with low competition.
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-500 font-mono space-y-2">
              <div className="flex justify-between"><span className="text-slate-400">Query:</span> <span className="text-indigo-600">"AI History"</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Gap:</span> <span className="text-emerald-600">High Volume</span></div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1"><div className="w-[92%] h-full bg-indigo-500 rounded-full"></div></div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-16 h-16 bg-white rounded-2xl border-2 border-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold mb-6 mx-auto shadow-sm relative z-10">
              2
            </div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-3">2. Build Your Stack</h3>
            <p className="text-slate-600 text-center text-sm leading-relaxed mb-6">
              Tailor your production pipeline. Choose <strong>Veo</strong> for cinematic video generation or <strong>Imagen 3</strong> for static storytelling. Toggle text-to-speech for automated narration.
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-500 font-mono space-y-2">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-400 rounded-full"></div> <span>Gemini 2.5 Flash</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-500 rounded-full"></div> <span>Veo Video Gen</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-300 rounded-full"></div> <span>Imagen (Disabled)</span></div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-16 h-16 bg-white rounded-2xl border-2 border-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold mb-6 mx-auto shadow-sm relative z-10">
              3
            </div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-3">3. Content Generation</h3>
            <p className="text-slate-600 text-center text-sm leading-relaxed mb-6">
              Enter the dashboard. Generate a full script, visualize it with AI-generated media, edit prompts, and listen to the voiceover. Once satisfied, simulate the upload.
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-500 font-mono space-y-2">
              <div className="flex justify-between border-b border-slate-200 pb-1"><span>Script</span> <span className="text-emerald-500">Ready</span></div>
              <div className="flex justify-between border-b border-slate-200 pb-1 pt-1"><span>Audio</span> <span className="text-emerald-500">Synced</span></div>
              <div className="flex justify-between pt-1"><span>Video</span> <span className="text-indigo-500 animate-pulse">Rendering...</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const WorkflowDiagram: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto py-12">
      <div className="relative">
        {/* Connecting Line (Desktop) */}
        <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 -translate-y-1/2"></div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center group" title="Step 1: Trend Discovery">
            <div className="w-16 h-16 bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:border-indigo-500 group-hover:shadow-indigo-200 transition-all z-10">
              <Globe className="text-blue-500" size={28} />
            </div>
            <h4 className="font-bold text-slate-900 mb-1">1. Trends</h4>
            <p className="text-xs text-slate-500 max-w-[120px]">Real-time Google Trends & News analysis</p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center group" title="Step 2: Script Generation">
            <div className="w-16 h-16 bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:border-indigo-500 group-hover:shadow-indigo-200 transition-all z-10">
              <Cpu className="text-indigo-600" size={28} />
            </div>
            <h4 className="font-bold text-slate-900 mb-1">2. Ideation</h4>
            <p className="text-xs text-slate-500 max-w-[120px]">Gemini 2.5 Flash generates scripts</p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center group" title="Step 3: Media Creation">
            <div className="w-16 h-16 bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:border-indigo-500 group-hover:shadow-indigo-200 transition-all z-10">
              <div className="flex gap-1">
                <Video className="text-purple-500" size={18} />
                <Mic className="text-amber-500" size={18} />
              </div>
            </div>
            <h4 className="font-bold text-slate-900 mb-1">3. Assets</h4>
            <p className="text-xs text-slate-500 max-w-[120px]">Veo Video + Gemini TTS Audio</p>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col items-center text-center group" title="Step 4: Editing & Stitching">
            <div className="w-16 h-16 bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:border-indigo-500 group-hover:shadow-indigo-200 transition-all z-10">
              <Layers className="text-slate-600" size={28} />
            </div>
            <h4 className="font-bold text-slate-900 mb-1">4. Assembly</h4>
            <p className="text-xs text-slate-500 max-w-[120px]">Automated Stitching & Editing</p>
          </div>

          {/* Step 5 */}
          <div className="flex flex-col items-center text-center group" title="Step 5: Publishing">
            <div className="w-16 h-16 bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:border-indigo-500 group-hover:shadow-indigo-200 transition-all z-10">
              <Layout className="text-red-600" size={28} />
            </div>
            <h4 className="font-bold text-slate-900 mb-1">5. Publish</h4>
            <p className="text-xs text-slate-500 max-w-[120px]">Auto-upload to YouTube Shorts</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const PricingSection: React.FC<{ onSubscribe: () => void }> = ({ onSubscribe }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
      {/* Starter */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Starter</h3>
        <div className="flex items-baseline gap-1 mb-6">
          <span className="text-4xl font-black text-slate-900">$0</span>
          <span className="text-slate-500">/mo</span>
        </div>
        <p className="text-slate-600 text-sm mb-6">Perfect for brainstorming and testing ideas.</p>
        <button onClick={onSubscribe} title="Select Starter Plan" className="w-full py-3 rounded-xl border-2 border-slate-900 text-slate-900 font-bold hover:bg-slate-50 transition-colors mb-6">
          Start Free
        </button>
        <ul className="space-y-3">
          <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-emerald-500" /> 10 Brainstorm queries/day</li>
          <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-emerald-500" /> Basic Script Generation</li>
          <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-emerald-500" /> Imagen Static Images</li>
          <li className="flex items-center gap-2 text-sm text-slate-400"><X size={16} /> Veo Video Generation</li>
        </ul>
      </div>

      {/* Creator (Highlighted) */}
      <div className="bg-slate-900 rounded-2xl p-8 border border-slate-900 shadow-xl transform md:-translate-y-4">
        <div className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">Most Popular</div>
        <h3 className="text-xl font-bold text-white mb-2">Creator</h3>
        <div className="flex items-baseline gap-1 mb-6">
          <span className="text-4xl font-black text-white">$29</span>
          <span className="text-slate-400">/mo</span>
        </div>
        <p className="text-slate-300 text-sm mb-6">Full automation power with video generation.</p>
        <button onClick={onSubscribe} title="Select Creator Plan" className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors mb-6 shadow-lg shadow-indigo-900/50">
          Subscribe Now
        </button>
        <ul className="space-y-3">
          <li className="flex items-center gap-2 text-sm text-white"><CheckCircle2 size={16} className="text-emerald-400" /> Unlimited Brainstorming</li>
          <li className="flex items-center gap-2 text-sm text-white"><CheckCircle2 size={16} className="text-emerald-400" /> 50 Veo Video Generations</li>
          <li className="flex items-center gap-2 text-sm text-white"><CheckCircle2 size={16} className="text-emerald-400" /> Premium Voiceovers</li>
          <li className="flex items-center gap-2 text-sm text-white"><CheckCircle2 size={16} className="text-emerald-400" /> Priority Support</li>
        </ul>
      </div>

      {/* Agency */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Agency</h3>
        <div className="flex items-baseline gap-1 mb-6">
          <span className="text-4xl font-black text-slate-900">$99</span>
          <span className="text-slate-500">/mo</span>
        </div>
        <p className="text-slate-600 text-sm mb-6">Scale up with API access and team seats.</p>
        <button onClick={onSubscribe} title="Contact Sales for Agency Plan" className="w-full py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:border-slate-300 hover:text-slate-900 transition-colors mb-6">
          Contact Sales
        </button>
        <ul className="space-y-3">
          <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-emerald-500" /> 500+ Veo Generations</li>
          <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-emerald-500" /> YouTube API Auto-Upload</li>
          <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-emerald-500" /> 5 Team Seats</li>
          <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-emerald-500" /> Dedicated Account Manager</li>
        </ul>
      </div>
    </div>
  );
};

const LoginSection: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
        <p className="text-slate-500">Sign in to your TrendShorts dashboard</p>
      </div>

      <div className="space-y-4">
        <button onClick={onLogin} title="Sign in with Google" className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-xl transition-all">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500">Or continue with email</span>
          </div>
        </div>

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
            <input type="email" title="Enter your email" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input type="password" title="Enter your password" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••••" />
          </div>
          <button type="submit" title="Sign In" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-md">
            Sign In
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        Don't have an account? <button onClick={onLogin} title="Create an account" className="text-indigo-600 font-semibold hover:underline">Sign up for free</button>
      </p>
    </div>
  );
};

const Footer: React.FC = () => (
  <footer className="bg-slate-50 border-t border-slate-200 py-12">
    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Zap size={18} fill="currentColor" />
          </div>
          <span className="text-xl font-bold text-slate-900">TrendShorts</span>
        </div>
        <p className="text-sm text-slate-500">
          AI-powered automated video creation suite for modern creators.
        </p>
      </div>
      <div>
        <h4 className="font-bold text-slate-900 mb-4">Product</h4>
        <ul className="space-y-2 text-sm text-slate-500">
          <li><span className="hover:text-indigo-600 cursor-pointer">Features</span></li>
          <li><span className="hover:text-indigo-600 cursor-pointer">Pricing</span></li>
          <li><span className="hover:text-indigo-600 cursor-pointer">Workflow</span></li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold text-slate-900 mb-4">Resources</h4>
        <ul className="space-y-2 text-sm text-slate-500">
          <li><span className="hover:text-indigo-600 cursor-pointer">Blog</span></li>
          <li><span className="hover:text-indigo-600 cursor-pointer">Community</span></li>
          <li><span className="hover:text-indigo-600 cursor-pointer">Help Center</span></li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold text-slate-900 mb-4">Legal</h4>
        <ul className="space-y-2 text-sm text-slate-500">
          <li><span className="hover:text-indigo-600 cursor-pointer">Privacy</span></li>
          <li><span className="hover:text-indigo-600 cursor-pointer">Terms</span></li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-200 text-center text-sm text-slate-400">
      © 2024 TrendShorts AI. All rights reserved.
    </div>
  </footer>
);

// --- Landing Page Component ---
type LandingSectionType = 'HOME' | 'WORKFLOW' | 'PRICING' | 'LOGIN';

const LandingPage: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [activeSection, setActiveSection] = useState<LandingSectionType>('HOME');

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToTop();
  }, [activeSection]);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setActiveSection('HOME')}
            title="Return to Home"
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
              <Zap size={24} fill="currentColor" />
            </div>
            <span className="text-2xl font-bold tracking-tight">TrendShorts</span>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-500">
              <button
                onClick={() => setActiveSection('HOME')}
                title="View Features"
                className={`transition - colors ${activeSection === 'HOME' ? 'text-indigo-600 font-bold' : 'hover:text-indigo-600'} `}
              >
                Features
              </button>
              <button
                onClick={() => setActiveSection('WORKFLOW')}
                title="View How It Works"
                className={`transition - colors ${activeSection === 'WORKFLOW' ? 'text-indigo-600 font-bold' : 'hover:text-indigo-600'} `}
              >
                Workflow
              </button>
              <button
                onClick={() => setActiveSection('PRICING')}
                title="View Pricing Plans"
                className={`transition - colors ${activeSection === 'PRICING' ? 'text-indigo-600 font-bold' : 'hover:text-indigo-600'} `}
              >
                Pricing
              </button>
            </nav>
            <button
              onClick={() => setActiveSection('LOGIN')}
              title="Sign in to your account"
              className={`px - 6 py - 2.5 rounded - full font - semibold transition - all ${activeSection === 'LOGIN'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
                } `}
            >
              Log In
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area - Switched based on activeSection */}
      <main className="flex-1 w-full h-full">
        {activeSection === 'HOME' && (
          <>
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-6 py-24 md:py-32 flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1 space-y-8 animate-fadeIn">
                <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-bold border border-indigo-100">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  v2.0 Now Available with Veo Video Gen
                </div>
                <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight text-slate-900">
                  From Idea to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Video</span> in Minutes.
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed max-w-lg">
                  Brainstorm profitable niches, prototype scripts, and generate cinematic visuals using Google's Gemini & Veo—all in one workflow.
                </p>

                {/* Trusted By Badges */}
                <div className="flex items-center gap-4 text-sm text-slate-400 font-medium">
                  <span>Trusted by creators from:</span>
                  <div className="flex gap-2 opacity-60 grayscale hover:grayscale-0 transition-all">
                    <span className="font-bold text-slate-600">YouTube</span>
                    <span className="font-bold text-slate-600">•</span>
                    <span className="font-bold text-slate-600">TikTok</span>
                    <span className="font-bold text-slate-600">•</span>
                    <span className="font-bold text-slate-600">Instagram</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveSection('LOGIN')}
                    title="Get Started for Free"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-bold px-8 py-4 rounded-xl shadow-xl shadow-indigo-200 transition-transform hover:scale-105 flex items-center gap-2"
                  >
                    Start Building Free <ArrowRight size={20} />
                  </button>
                  <button
                    onClick={() => setActiveSection('WORKFLOW')}
                    title="Learn about the automation pipeline"
                    className="px-8 py-4 rounded-xl font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 transition-colors"
                  >
                    View Workflow
                  </button>
                </div>
              </div>

              <div className="flex-1 relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-20 blur-2xl"></div>
                <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="bg-white px-3 py-1 rounded-md text-xs text-slate-400 font-mono flex-1 text-center">trendshorts.ai/dashboard</div>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="text-indigo-600" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="h-32 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 text-sm">
                      AI Generating Content...
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 bg-slate-100 rounded w-20"></div>
                      <div className="h-8 bg-indigo-600 rounded w-24 opacity-20"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step By Step Preview Section */}
            <StepByStepPreview />

            {/* Feature Cards Grid (Enhanced) */}
            <section className="bg-slate-50 py-24 border-y border-slate-200">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to go viral</h2>
                  <p className="text-slate-600 max-w-2xl mx-auto">Stop guessing. Start generating data-backed content.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Feature 1 */}
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                      <BarChart3 size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Predictive Brainstorming</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Don't just pick a topic. Use Google Search Grounding to validate niche demand before you create a single video.
                    </p>
                  </div>

                  {/* Feature 2 */}
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                      <Layers size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Modular AI Stack</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Mix and match models. Use Veo for cinematic video or Imagen for static storytelling. You control the cost/quality ratio.
                    </p>
                  </div>

                  {/* Feature 3 */}
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                      <PlayCircle size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Prototyping</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Visualize the final output immediately. See the script, hear the voiceover, and watch the Veo video in one dashboard.
                    </p>
                  </div>

                  {/* Feature 4 */}
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6">
                      <Mic size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Natural Voiceovers</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Integrated Gemini TTS provides engaging, human-like narration that keeps retention high.
                    </p>
                  </div>

                  {/* Feature 5 */}
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mb-6">
                      <Globe size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Global Trend Targeting</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Target specific regions like the US, UK, Brazil, or India to find untapped local markets.
                    </p>
                  </div>

                  {/* Feature 6 */}
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mb-6">
                      <Layout size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Auto-Formatting</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Scripts and assets are automatically formatted for the 9:16 vertical Shorts aspect ratio.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Testimonials / Social Proof */}
            <section className="bg-white py-24">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">Loved by Automation Experts</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="flex gap-1 text-amber-400 mb-3"><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /></div>
                    <p className="text-slate-700 italic mb-4">"The Veo integration is a game changer. I used to spend hours finding stock footage, now I just generate exactly what I need."</p>
                    <div className="font-bold text-slate-900 text-sm">- Sarah J., Faceless Channel Creator</div>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="flex gap-1 text-amber-400 mb-3"><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /></div>
                    <p className="text-slate-700 italic mb-4">"Brainstorming usually takes me a week. With TrendShorts, I found 3 profitable niches in 10 minutes."</p>
                    <div className="font-bold text-slate-900 text-sm">- Mike T., Digital Marketer</div>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="flex gap-1 text-amber-400 mb-3"><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /></div>
                    <p className="text-slate-700 italic mb-4">"Finally, a tool that actually understands context. The scripts aren't just generic AI fluff."</p>
                    <div className="font-bold text-slate-900 text-sm">- Alex R., Content Strategist</div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {activeSection === 'WORKFLOW' && (
          <div className="py-24 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16 space-y-4">
                <h2 className="text-4xl font-bold text-slate-900">The Automation Pipeline</h2>
                <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                  Visualize how TrendShorts connects different AI models to create a seamless production line.
                </p>
              </div>

              {/* Visual Block Diagram */}
              <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-200">
                <WorkflowDiagram />
              </div>

              <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-slate-900">Why this architecture?</h3>
                  <p className="text-slate-600 leading-relaxed">
                    We separate the <strong>Reasoning Layer</strong> (Gemini) from the <strong>Generation Layer</strong> (Veo/Imagen/TTS). This ensures that your content is logically sound and fact-checked before any expensive media generation occurs.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex gap-3">
                      <div className="mt-1"><CheckCircle2 className="text-indigo-600" size={20} /></div>
                      <div>
                        <strong className="text-slate-900 block">Cost Efficiency</strong>
                        <span className="text-slate-500 text-sm">Only generate video when the script is perfect.</span>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="mt-1"><CheckCircle2 className="text-indigo-600" size={20} /></div>
                      <div>
                        <strong className="text-slate-900 block">Modularity</strong>
                        <span className="text-slate-500 text-sm">Swap out models (e.g., switch Veo for Imagen) instantly.</span>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="bg-slate-900 rounded-2xl p-8 text-slate-300 font-mono text-sm leading-loose shadow-2xl">
                  <div className="flex gap-1.5 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <p><span className="text-purple-400">const</span> <span className="text-blue-400">pipeline</span> = <span className="text-purple-400">await</span> ai.workflow.create(&#123;</p>
                  <p className="pl-4">inputs: [<span className="text-green-400">'trends'</span>, <span className="text-green-400">'topic'</span>],</p>
                  <p className="pl-4">models: &#123;</p>
                  <p className="pl-8">script: <span className="text-green-400">'gemini-2.5-flash'</span>,</p>
                  <p className="pl-8">video: <span className="text-green-400">'veo-3.1'</span>,</p>
                  <p className="pl-8">audio: <span className="text-green-400">'gemini-tts'</span></p>
                  <p className="pl-4">&#125;</p>
                  <p>&#125;);</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'PRICING' && (
          <div className="py-24 bg-white">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl font-bold text-slate-900">Simple, Transparent Pricing</h2>
              <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                Choose the plan that fits your production volume.
              </p>
            </div>
            <PricingSection onSubscribe={() => setActiveSection('LOGIN')} />
          </div>
        )}

        {activeSection === 'LOGIN' && (
          <div className="py-24 bg-slate-50 min-h-screen flex items-center justify-center">
            <div className="w-full">
              <LoginSection onLogin={onLogin} />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [stage, setStage] = useState<AppStage>(AppStage.BRAINSTORM);

  // Application State
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<RefinedStrategy | null>(null);
  const [loadedProject, setLoadedProject] = useState<SavedProject | null>(null);

  // Results State
  const [generatedConcept, setGeneratedConcept] = useState<ShortConcept | null>(null);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
  const [finalMotionUrls, setFinalMotionUrls] = useState<string[] | null>(null);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);

  // Provider states
  const [imageProvider, setImageProvider] = useState<'google' | 'pollinations'>('pollinations');
  const [videoProvider, setVideoProvider] = useState<'veo' | 'flux-motion'>('flux-motion');

  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const checkApiKey = async () => {
      // Prioritize Runtime Config (Docker) -> Process Env (Local/Build) -> Legacy AI Studio
      const envKey = (window as any).env?.API_KEY || process.env.API_KEY;
      if (envKey) {
        setHasApiKey(true);
        return;
      }

      const win = window as any;
      if (win.aistudio) {
        try {
          const keyExists = await win.aistudio.hasSelectedApiKey();
          setHasApiKey(keyExists);
        } catch (e) {
          console.error("Error checking API key:", e);
          setHasApiKey(false);
        }
      }
    };
    checkApiKey();
  }, []);

  const handleLogin = async () => {
    // Handle API Key selection specifically for Veo/Gemini
    const win = window as any;
    if (win.aistudio) {
      try {
        const keyExists = await win.aistudio.hasSelectedApiKey();
        if (!keyExists) {
          await win.aistudio.openSelectKey();
          const updatedKeyExists = await win.aistudio.hasSelectedApiKey();
          setHasApiKey(updatedKeyExists);
          if (!updatedKeyExists) {
            alert("Please select a valid API key project to continue.");
            return;
          }
        } else {
          setHasApiKey(keyExists);
        }
      } catch (e: any) {
        console.error("API Key selection error", e);
        // Retry logic if entity not found (race condition or bad state)
        if (e.message && e.message.includes("Requested entity was not found")) {
          try {
            await win.aistudio.openSelectKey();
            const updatedKeyExists = await win.aistudio.hasSelectedApiKey();
            setHasApiKey(updatedKeyExists);
            if (!updatedKeyExists) {
              alert("Please select a valid API key project to continue.");
              return;
            }
          } catch (retryError) {
            console.error("Retry failed", retryError);
            alert("Please select a valid API key project to continue.");
            return;
          }
        }
      }
    }

    setIsLoggedIn(true);
  };

  const handleBrainstormComplete = (genre: string, strategy: RefinedStrategy) => {
    setSelectedGenre(genre);
    setSelectedStrategy(strategy);
    // Skip Tech Stack, go straight to Content Gen
    setStage(AppStage.CONTENT_GENERATION);
  };

  const handleStudioComplete = (concept: ShortConcept, videoUrl: string | null, motionUrls: string[] | null, imageUrl: string | null) => {
    setGeneratedConcept(concept);
    setFinalVideoUrl(videoUrl);
    setFinalMotionUrls(motionUrls);
    setFinalImageUrl(imageUrl);
    setStage(AppStage.PUBLISH);
  };

  const handleBackToBrainstorm = () => {
    setStage(AppStage.BRAINSTORM);
    setSelectedStrategy(null);
    setStage(AppStage.BRAINSTORM);
    setSelectedStrategy(null);
    setGeneratedConcept(null);
    setLoadedProject(null);
  };

  const handleBackToStudio = () => {
    setStage(AppStage.CONTENT_GENERATION);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setStage(AppStage.BRAINSTORM);
    // Reset state
    setSelectedStrategy(null);
    setSelectedGenre('');
    setSelectedGenre('');
    setGeneratedConcept(null);
    setLoadedProject(null);
    setFinalVideoUrl(null);
    setFinalMotionUrls(null);
    setFinalImageUrl(null);
  };

  // History Modal State
  const [showHistory, setShowHistory] = useState(false);

  const handleLoadProject = (project: SavedProject) => {
    setSelectedGenre(project.genre);
    setSelectedStrategy(project.strategy);
    setLoadedProject(project); // Set the loaded project data

    // Always go to Studio to allow editing/viewing state
    setStage(AppStage.CONTENT_GENERATION);

    // If it was fully complete, user can click Publish from Studio
    // Optional: could pre-fill generatedConcept if we want to skip generation,
    // but passing loadedProject to PrototypeDashboard handles that.

    setShowHistory(false);
  };

  const handleLogoClick = () => {
    if (isLoggedIn) {
      setStage(AppStage.BRAINSTORM);
      setStage(AppStage.BRAINSTORM);
      setSelectedStrategy(null);
      setGeneratedConcept(null);
      setLoadedProject(null);
    }
  };

  if (!isLoggedIn) {
    return <LandingPage onLogin={handleLogin} />;
  }

  // Main App Layout
  return (
    <div className="h-screen bg-slate-100 flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* App Header */}
      <header className="bg-slate-900 text-white h-16 shrink-0 flex items-center justify-between px-6 shadow-md z-20">
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleLogoClick}
          title="Return to Brainstorming"
        >
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Zap size={18} fill="currentColor" className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">TrendShorts Studio</span>
        </div>

        <div className="flex items-center gap-4">

          <button
            onClick={() => setShowHistory(true)}
            className="hidden md:flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            title="My Projects"
          >
            <Layers size={18} />
            <span className="text-sm font-medium">My Projects</span>
          </button>

          <div className="h-4 w-px bg-slate-700 hidden md:block"></div>

          {/* Image Provider Toggle */}
          <div className="hidden md:flex bg-slate-800 rounded-lg p-1 items-center gap-1">
            <button
              onClick={() => setImageProvider('google')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${imageProvider === 'google' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              title="Use Google Imagen (Requires API Key)"
            >
              Google
            </button>
            <button
              onClick={() => setImageProvider('pollinations')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${imageProvider === 'pollinations' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              title="Use Flux via Pollinations (Free)"
            >
              Flux (Free)
            </button>
          </div>

          {/* Video Provider Toggle */}
          <div className="hidden md:flex bg-slate-800 rounded-lg p-1 items-center gap-1">
            <button
              onClick={() => setVideoProvider('veo')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${videoProvider === 'veo' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              title="Use Google Veo (Requires API Key)"
            >
              Veo
            </button>
            <button
              onClick={() => setVideoProvider('flux-motion')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${videoProvider === 'flux-motion' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              title="Use Flux Motion (Free)"
            >
              Motion (Free)
            </button>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden md:block"></div>

          {/* User Profile / API Key Status */}
          <div className="flex items-center gap-3">
            {/* Profile & Settings Links */}
            <button
              onClick={() => setStage(AppStage.PROFILE)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
              title="My Profile"
            >
              <User size={20} />
            </button>
            <button
              onClick={() => setStage(AppStage.SETTINGS)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
              title="Settings"
            >
              <Settings size={20} />
            </button>

            <div className="h-4 w-px bg-slate-700 hidden md:block mx-1"></div>

            {hasApiKey ? (
              <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                API Connected
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-1 text-amber-400 text-xs font-medium bg-amber-400/10 px-2 py-1 rounded-full border border-amber-400/20 hover:bg-amber-400/20 transition-colors"
              >
                <AlertCircle size={10} />
                Connect API
              </button>
            )}

            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Stage Indicator */}
      {/* Stage Indicator */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-center shadow-sm z-10 transition-all">
        {(stage === AppStage.PROFILE || stage === AppStage.SETTINGS) ? (
          <div className="text-sm font-medium text-slate-500">
            {stage === AppStage.PROFILE ? 'User Profile' : 'Application Settings'}
          </div>
        ) : (
          <div className="flex items-center gap-2 md:gap-8 text-sm">
            <div className={`flex items-center gap-2 ${stage === AppStage.BRAINSTORM ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${stage === AppStage.BRAINSTORM ? 'bg-indigo-100' : 'bg-slate-100'}`}>1</div>
              <span>Brainstorm</span>
            </div>
            <div className="w-8 h-px bg-slate-200"></div>
            <div className={`flex items-center gap-2 ${stage === AppStage.CONTENT_GENERATION ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${stage === AppStage.CONTENT_GENERATION ? 'bg-indigo-100' : 'bg-slate-100'}`}>2</div>
              <span>Studio</span>
            </div>
            <div className="w-8 h-px bg-slate-200"></div>
            <div className={`flex items-center gap-2 ${stage === AppStage.PUBLISH ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${stage === AppStage.PUBLISH ? 'bg-indigo-100' : 'bg-slate-100'}`}>3</div>
              <span>Publish</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {!hasApiKey && stage !== AppStage.PUBLISH && stage !== AppStage.PROFILE && stage !== AppStage.SETTINGS && (
          <div className="absolute top-0 left-0 w-full bg-amber-50 text-amber-800 px-4 py-2 text-xs text-center border-b border-amber-100 z-10 flex items-center justify-center gap-2">
            <AlertCircle size={12} />
            <span>Using Demo Mode. Connect Google AI Studio API key for full functionality.</span>
            <button onClick={handleLogin} className="underline font-bold hover:text-amber-900">Connect Now</button>
          </div>
        )}

        {stage === AppStage.BRAINSTORM && (
          <div className="w-full mx-auto px-6 py-8 h-[calc(100vh-80px)]">
            <BrainstormStage
              onNext={handleBrainstormComplete}
              onLoginRequest={handleLogin}
              hasApiKey={hasApiKey}
            />
          </div>
        )}

        {stage === AppStage.CONTENT_GENERATION && selectedStrategy && (
          <div className="w-full mx-auto px-6 py-8 h-[calc(100vh-80px)]">
            <PrototypeDashboard
              genre={selectedGenre}
              strategy={selectedStrategy}
              onBack={handleBackToStudio}
              onComplete={handleStudioComplete}
              imageProvider={imageProvider}
              videoProvider={videoProvider}
              initialData={loadedProject || undefined}
            />
          </div>
        )}

        {stage === AppStage.PUBLISH && (
          <div className="w-full mx-auto px-6 py-8 h-[calc(100vh-80px)]">
            <PublishStage
              concept={generatedConcept}
              videoUrl={finalVideoUrl}
              motionUrls={finalMotionUrls}
              imageUrl={finalImageUrl}
              onBack={handleBackToStudio}
              onRestart={() => setStage(AppStage.BRAINSTORM)}
            />
          </div>
        )}

        {stage === AppStage.PROFILE && (
          <div className="w-full h-[calc(100vh-80px)] overflow-y-auto">
            <ProfilePage onBack={() => setStage(AppStage.BRAINSTORM)} />
          </div>
        )}

        {stage === AppStage.SETTINGS && (
          <div className="w-full h-[calc(100vh-80px)] overflow-y-auto">
            <SettingsPage onBack={() => setStage(AppStage.BRAINSTORM)} />
          </div>
        )}
      </main>

      <ProjectHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onLoad={handleLoadProject}
      />
    </div>
  );
};

export default App;