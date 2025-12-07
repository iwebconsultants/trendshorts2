import React, { useState } from 'react';
import { Settings, Key, Moon, Bell, Monitor, Save } from 'lucide-react';

interface Props {
    onBack: () => void;
}

export const SettingsPage: React.FC<Props> = ({ onBack }) => {
    const [apiKey, setApiKey] = useState('');
    const [saved, setSaved] = useState(false);

    const handleSaveKey = () => {
        if (!apiKey) return;
        // In a real app we might persist this to localStorage as a fallback
        // or prompt the user that this is session-only if not using env vars
        localStorage.setItem('trendshorts_manual_key', apiKey);

        // Force reload to pick up new key in env logic if we updated the logic to check localStorage
        // For now just show UI feedback
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="max-w-3xl mx-auto p-6 md:p-12">
            <button onClick={onBack} className="text-slate-500 hover:text-slate-900 mb-8 font-medium">← Back to Dashboard</button>

            <h1 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                <Settings className="text-indigo-600" /> Settings
            </h1>

            <div className="space-y-6">

                {/* API Configuration */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Key size={20} className="text-slate-400" /> API Configuration
                    </h2>
                    <p className="text-sm text-slate-600 mb-4">
                        Manage your Google AI Studio API key. For production, we recommend setting this via Dockploy environment variables.
                    </p>

                    <div className="flex gap-2">
                        <input
                            type="password"
                            placeholder="Paste new API Key..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="flex-1 border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                        />
                        <button
                            onClick={handleSaveKey}
                            className={`px-6 py-2 rounded-lg font-bold text-white transition-all ${saved ? 'bg-emerald-500' : 'bg-slate-900 hover:bg-slate-800'}`}
                        >
                            {saved ? 'Saved!' : 'Save'}
                        </button>
                    </div>
                </div>

                {/* Appearance */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm opacity-60">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Monitor size={20} className="text-slate-400" /> Appearance
                    </h2>
                    <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50">
                        <div className="flex items-center gap-3">
                            <Moon size={18} />
                            <span className="font-medium text-slate-700">Dark Mode</span>
                        </div>
                        <div className="w-10 h-6 bg-slate-300 rounded-full relative cursor-not-allowed">
                            <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1"></div>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm opacity-60">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Bell size={20} className="text-slate-400" /> Notifications
                    </h2>
                    <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50 mb-2">
                        <span className="font-medium text-slate-700">Email Alerts</span>
                        <span className="text-xs font-bold text-emerald-600">Enabled</span>
                    </div>
                </div>

            </div>
        </div>
    );
};
