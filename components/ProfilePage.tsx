import React from 'react';
import { User, Zap, Film, CreditCard, Award, TrendingUp } from 'lucide-react';

interface Props {
    onBack: () => void;
}

export const ProfilePage: React.FC<Props> = ({ onBack }) => {
    return (
        <div className="max-w-4xl mx-auto p-6 md:p-12">
            <button onClick={onBack} className="text-slate-500 hover:text-slate-900 mb-8 font-medium">← Back to Dashboard</button>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-32 relative">
                    <div className="absolute -bottom-12 left-8 border-4 border-white rounded-full bg-slate-200 w-24 h-24 flex items-center justify-center text-slate-400">
                        <User size={40} />
                    </div>
                </div>

                <div className="pt-16 pb-8 px-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Creative User</h1>
                            <p className="text-slate-500">Free Tier Member</p>
                        </div>
                        <button className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-bold hover:bg-indigo-100 transition-colors">
                            Upgrade Plan
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Film size={14} /> Total Shorts
                            </div>
                            <div className="text-3xl font-bold text-slate-900">12</div>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Zap size={14} /> Generations
                            </div>
                            <div className="text-3xl font-bold text-slate-900">45</div>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                <TrendingUp size={14} /> Viral Score
                            </div>
                            <div className="text-3xl font-bold text-emerald-600">8.4</div>
                        </div>
                    </div>

                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Award className="text-amber-500" /> Achievements
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl flex items-center gap-4 bg-amber-50/50">
                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-lg">🚀</div>
                            <div>
                                <div className="font-bold text-slate-900">Early Adopter</div>
                                <div className="text-xs text-slate-500">Joined during beta</div>
                            </div>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl flex items-center gap-4 opacity-50 grayscale">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-lg">🔥</div>
                            <div>
                                <div className="font-bold text-slate-900">Viral Hit</div>
                                <div className="text-xs text-slate-500">Get 10k views on a short</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
