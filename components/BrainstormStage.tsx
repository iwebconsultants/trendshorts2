import React, { useState, useEffect } from 'react';
import { StrategyOption, ChatMessage, RefinedStrategy } from '../types';
import { brainstormStrategies, chatAboutStrategy } from '../services/gemini';
import { getTopTrends, generateAlternateKeywords, TrendData } from '../services/trends';
import { Loader2, Zap, TrendingUp, Filter, Clock, X, RotateCcw, Globe, Plus, MapPin, Tag, ChevronDown, ChevronUp, Edit2, Send, MessageSquare, ExternalLink, Sparkles, Lightbulb, Flame, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface Props {
    onNext: (genre: string, strategy: RefinedStrategy) => void;
    onLoginRequest: () => void;
    hasApiKey: boolean;
}

const COUNTRIES = [
    { code: 'US', name: 'United States', lat: 37, lon: -95 },
    { code: 'GB', name: 'United Kingdom', lat: 55, lon: -3 },
    { code: 'CA', name: 'Canada', lat: 56, lon: -106 },
    { code: 'AU', name: 'Australia', lat: -25, lon: 133 },
    { code: 'IN', name: 'India', lat: 20, lon: 77 },
    { code: 'PK', name: 'Pakistan', lat: 30, lon: 69 },
    { code: 'AE', name: 'UAE', lat: 23, lon: 53 },
    { code: 'SA', name: 'Saudi Arabia', lat: 23, lon: 45 },
    { code: 'DE', name: 'Germany', lat: 51, lon: 10 },
    { code: 'br', name: 'Brazil', lat: -14, lon: -51 },
    { code: 'mx', name: 'Mexico', lat: 23, lon: -102 },
    { code: 'fr', name: 'France', lat: 46, lon: 2 },
    { code: 'jp', name: 'Japan', lat: 36, lon: 138 },
];

const CATEGORIES = [
    'Technology', 'Health', 'finance', 'Entertainment', 'Education', 'Travel', 'Food', 'Gaming'
];

interface RecentSearch {
    keywords: string[];
    locations: string[];
    categories: string[];
}

export const BrainstormStage: React.FC<Props> = ({ onNext, onLoginRequest, hasApiKey }) => {
    // Input State
    const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
    const [selectedLocations, setSelectedLocations] = useState<string[]>(['United States']);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [keywords, setKeywords] = useState<string[]>([]);
    const [keywordInput, setKeywordInput] = useState('');

    // UI State
    const [topics, setTopics] = useState<string[]>([]);
    const [manualTopic, setManualTopic] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [strategies, setStrategies] = useState<StrategyOption[]>([]);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    // Chat State
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [chatInputs, setChatInputs] = useState<{ [key: number]: string }>({});
    const [chatHistories, setChatHistories] = useState<{ [key: number]: ChatMessage[] }>({});
    const [chatLoading, setChatLoading] = useState<{ [key: number]: boolean }>({});

    // Trends State
    const [topTrends, setTopTrends] = useState<TrendData[]>([]);
    const [alternateKeywords, setAlternateKeywords] = useState<string[]>([]);
    const [loadingAlternates, setLoadingAlternates] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('trendShorts_recentSearches');
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse recent searches", e);
            }
        }
    }, []);

    // Load top trends on mount
    useEffect(() => {
        const loadTopTrends = async () => {
            const trends = await getTopTrends();
            setTopTrends(trends);
        };
        loadTopTrends();
    }, []);

    // Generate alternate keywords when keywords change
    useEffect(() => {
        const loadAlternates = async () => {
            if (keywords.length > 0) {
                setLoadingAlternates(true);
                const alternates = await generateAlternateKeywords(keywords);
                setAlternateKeywords(alternates);
                setLoadingAlternates(false);
            } else {
                setAlternateKeywords([]);
            }
        };
        loadAlternates();
    }, [keywords]);

    const saveSearch = () => {
        const newSearch = { keywords, locations: selectedLocations, categories: selectedCategories };
        const updated = [newSearch, ...recentSearches.slice(0, 4)];
        setRecentSearches(updated);
        localStorage.setItem('trendShorts_recentSearches', JSON.stringify(updated));
    };

    const handleReset = () => {
        setKeywords([]);
        setSelectedLocations(['US']);
        setSelectedCategories(['Entertainment']);
        setStrategies([]);
        setExpandedId(null);
        setHasSearched(false);
    };

    const handleAddKeyword = () => {
        if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
            setKeywords([...keywords, keywordInput.trim()]);
            setKeywordInput('');
        }
    };

    const handleRemoveKeyword = (kw: string) => {
        setKeywords(keywords.filter(k => k !== kw));
    };

    const handleTopTrends = () => {
        const trendingKeywords = ["Viral", "Challenge", "POV", "Life Hacks", "Satisfying", "Facts"];
        setKeywords(trendingKeywords);
    };

    const handleAddTrendKeyword = (keyword: string) => {
        if (!keywords.includes(keyword)) {
            setKeywords([...keywords, keyword]);
        }
    };

    const handleAddAlternateKeyword = (keyword: string) => {
        if (!keywords.includes(keyword)) {
            setKeywords([...keywords, keyword]);
        }
    };

    const toggleLocation = (code: string) => {
        if (selectedLocations.includes(code)) {
            setSelectedLocations(selectedLocations.filter(c => c !== code));
        } else {
            setSelectedLocations([...selectedLocations, code]);
        }
    };

    const toggleCategory = (cat: string) => {
        if (selectedCategories.includes(cat)) {
            setSelectedCategories(selectedCategories.filter(c => c !== cat));
        } else {
            setSelectedCategories([...selectedCategories, cat]);
        }
    };

    const handleBrainstorm = async () => {
        if (keywords.length === 0 && selectedCategories.length === 0) return;

        setLoading(true);
        setStrategies([]);
        setExpandedId(null);
        setHasSearched(true);

        saveSearch();

        try {
            const results = await brainstormStrategies(keywords, selectedLocations, selectedCategories);
            if (results.length === 0) throw new Error("No strategies found");
            setStrategies(results);
        } catch (error) {
            console.error(error);
            alert("Analysis failed. Try adjusting your signals.");
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (idx: number) => {
        setExpandedId(expandedId === idx ? null : idx);
    };

    const handleUpdateStrategy = (idx: number, field: keyof StrategyOption, value: string) => {
        const updated = [...strategies];
        updated[idx] = { ...updated[idx], [field]: value };
        setStrategies(updated);
    };

    const handleChat = async (idx: number) => {
        const input = chatInputs[idx];
        if (!input?.trim()) return;

        const currentHistory = chatHistories[idx] || [];
        const newHistory = [...currentHistory, { role: 'user', text: input } as ChatMessage];

        setChatHistories(prev => ({ ...prev, [idx]: newHistory }));
        setChatInputs(prev => ({ ...prev, [idx]: '' }));
        setChatLoading(prev => ({ ...prev, [idx]: true }));

        try {
            const rawResponse = await chatAboutStrategy(strategies[idx], newHistory, input);

            // Check for JSON update block
            let cleanResponse = rawResponse;
            if (rawResponse.includes("~~~UPDATE_JSON")) {
                const parts = rawResponse.split("~~~UPDATE_JSON");
                cleanResponse = parts[0].trim();
                const jsonPart = parts[1].trim();
                try {
                    const updates = JSON.parse(jsonPart);
                    // Apply updates to the strategy
                    const updatedStrategies = [...strategies];
                    updatedStrategies[idx] = { ...updatedStrategies[idx], ...updates };
                    setStrategies(updatedStrategies);
                } catch (e) {
                    console.error("Failed to parse strategy update from chat", e);
                }
            }

            setChatHistories(prev => ({
                ...prev,
                [idx]: [...newHistory, { role: 'model', text: cleanResponse }]
            }));
        } catch (e) {
            console.error(e);
        } finally {
            setChatLoading(prev => ({ ...prev, [idx]: false }));
        }
    };

    // Helper to render sparkline
    const renderSparkline = (data: number[]) => {
        if (!data || data.length < 2) return null;
        const max = 100;
        const points = data.map((val, idx) => {
            const x = (idx / (data.length - 1)) * 100;
            const y = 100 - (val / max) * 100;
            return `${x},${y}`;
        }).join(' ');

        return (
            <div className="w-24 h-8 bg-slate-50 rounded overflow-hidden relative border border-slate-100">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                    <polyline fill="none" stroke="#4f46e5" strokeWidth="4" points={points} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto animate-fadeIn bg-slate-50">

            {/* --- DASHBOARD HEADER & CONFIG --- */}
            <div className="bg-white border-b border-slate-200 shadow-sm z-10 flex flex-col md:flex-row">

                {/* LEFT: 3D GLOBE VISUALIZATION */}
                <div className="md:w-1/3 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[280px]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-100/50 via-purple-100/30 to-transparent"></div>

                    {/* 3D-style Globe SVG */}
                    <div className="relative w-48 h-48 md:w-56 md:h-56 group perspective-1000">
                        {/* Outer Glow */}
                        <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-xl"></div>

                        <svg className="w-full h-full drop-shadow-2xl" viewBox="0 0 100 100">
                            <defs>
                                <radialGradient id="globeGrad" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
                                </radialGradient>
                            </defs>

                            {/* Sphere Base */}
                            <circle cx="50" cy="50" r="48" fill="url(#globeGrad)" stroke="#818cf8" strokeWidth="1" className="opacity-60" />

                            {/* Animated Rings/Orbits */}
                            <ellipse cx="50" cy="50" rx="48" ry="15" fill="none" stroke="#818cf8" strokeWidth="0.2" className="opacity-40 origin-center animate-[spin_10s_linear_infinite]" />
                            <ellipse cx="50" cy="50" rx="48" ry="35" fill="none" stroke="#818cf8" strokeWidth="0.2" className="opacity-40 origin-center animate-[spin_15s_linear_infinite_reverse]" />
                            <ellipse cx="50" cy="50" rx="15" ry="48" fill="none" stroke="#818cf8" strokeWidth="0.2" className="opacity-30 origin-center animate-[spin_20s_linear_infinite]" />

                            {/* Latitude Lines */}
                            <path d="M2,50 Q50,90 98,50" fill="none" stroke="#818cf8" strokeWidth="0.1" className="opacity-30" />
                            <path d="M2,50 Q50,10 98,50" fill="none" stroke="#818cf8" strokeWidth="0.1" className="opacity-30" />
                        </svg>

                        {/* Active Region Pins - Adjusted for spherical look */}
                        {selectedLocations.map(loc => {
                            const country = COUNTRIES.find(c => c.code === loc);
                            if (!country) return null;
                            // Simple projection map adjusted for center
                            const x = 50 + (country.lon / 3.6) * 0.9;
                            const y = 50 - (country.lat / 1.8) * 0.9;

                            return (
                                <div
                                    key={loc}
                                    style={{ left: `${x}%`, top: `${y}%` }}
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center group"
                                >
                                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)] animate-pulse"></div>
                                    <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/95 text-indigo-700 border border-indigo-200 text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none z-20 shadow-lg">
                                        {country.name}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-6 text-center relative z-10">
                        <h3 className="text-indigo-900 text-xs font-bold tracking-widest flex items-center justify-center gap-2 uppercase">
                            <Globe size={12} className="text-indigo-600" /> Trend Signal Monitor
                        </h3>
                        <div className="flex gap-3 justify-center mt-2 text-[10px] text-indigo-700 font-mono">
                            <span className="bg-white/80 px-2 py-0.5 rounded border border-indigo-200 shadow-sm">{selectedLocations.length} Regions</span>
                            <span className="bg-white/80 px-2 py-0.5 rounded border border-indigo-200 shadow-sm">{keywords.length} Keywords</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT: CONFIGURATION DASHBOARD */}
                <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto max-h-[400px] md:max-h-none">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Trend Search</h2>
                            <p className="text-slate-500 text-sm">Combine keywords and regions to detect trending intersections.</p>
                        </div>
                        <button onClick={handleReset} title="Reset All" className="text-slate-400 hover:text-red-500 transition-colors p-2">
                            <RotateCcw size={18} />
                        </button>
                    </div>

                    {/* 1. Keyword Input */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                                <Tag size={12} /> Interest Tags (Keywords)
                            </label>
                            <button
                                onClick={handleTopTrends}
                                className="text-[10px] bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full flex items-center gap-1 hover:shadow-md transition-shadow"
                            >
                                <Zap size={10} fill="currentColor" /> Top Signals
                            </button>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all">
                            {keywords.map((kw, idx) => (
                                <span key={idx} className="bg-indigo-100 text-indigo-700 text-sm font-medium px-2 py-1 rounded-lg flex items-center gap-1 animate-scaleIn">
                                    {kw}
                                    <button onClick={() => handleRemoveKeyword(kw)} className="hover:text-indigo-900"><X size={12} /></button>
                                </span>
                            ))}
                            <input
                                type="text"
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                                placeholder={keywords.length === 0 ? "Type keyword & press Enter (e.g. 'Crypto', 'ASMR')" : "Add another..."}
                                className="bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 flex-1 min-w-[150px] py-1 px-1"
                            />
                            <button onClick={handleAddKeyword} disabled={!keywordInput} className="text-slate-400 hover:text-indigo-600 p-1">
                                <Plus size={18} />
                            </button>
                        </div>

                        {/* Alternate Keywords Suggestions */}
                        {alternateKeywords.length > 0 && (
                            <div className="mt-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles size={12} className="text-indigo-600" />
                                    <label className="text-[10px] font-bold text-indigo-600 uppercase">
                                        AI Suggestions
                                    </label>
                                    {loadingAlternates && <Loader2 size={10} className="animate-spin text-indigo-400" />}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {alternateKeywords.map((kw, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleAddAlternateKeyword(kw)}
                                            disabled={keywords.includes(kw)}
                                            className={`text-xs px-2 py-1 rounded-md border transition-all ${keywords.includes(kw)
                                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300'
                                                }`}
                                        >
                                            <Plus size={10} className="inline mr-1" />
                                            {kw}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. Locations Row */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                            <MapPin size={12} /> Target Markets
                        </label>
                        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
                            <button
                                onClick={() => setSelectedLocations([])}
                                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${selectedLocations.length === 0 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                            >
                                Global
                            </button>
                            {COUNTRIES.map(c => (
                                <button
                                    key={c.code}
                                    onClick={() => toggleLocation(c.code)}
                                    className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 ${selectedLocations.includes(c.code)
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                                        }`}
                                >
                                    {c.name}
                                    {selectedLocations.includes(c.code) && <X size={10} className="ml-1 opacity-50 hover:opacity-100" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. Categories Row */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                            <Filter size={12} /> Context Filter
                        </label>
                        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => toggleCategory(cat)}
                                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${selectedCategories.includes(cat)
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                                        : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleBrainstorm}
                        disabled={loading || (keywords.length === 0 && selectedCategories.length === 0)}
                        className="mt-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
                        {loading ? 'Analyzing Signals...' : 'Run Signal Analysis'}
                    </button>
                </div>
            </div>

            {/* --- RESULTS AREA (HORIZONTAL LAYOUT) --- */}
            <div className="flex-1 bg-white p-4 md:p-8">

                {/* Top Trends Right Now */}
                {!hasSearched && topTrends.length > 0 && (
                    <div className="mb-8">
                        <div className="bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 border border-orange-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Flame size={18} className="text-orange-500" />
                                    <h3 className="text-lg font-bold text-slate-900">Top Trends Right Now</h3>
                                </div>
                                <span className="text-xs text-slate-500 font-mono">Live • Updated hourly</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                {topTrends.slice(0, 10).map((trend, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleAddTrendKeyword(trend.keyword)}
                                        disabled={keywords.includes(trend.keyword)}
                                        className={`group relative bg-white rounded-xl p-3 border-2 transition-all hover:shadow-md ${keywords.includes(trend.keyword)
                                            ? 'border-gray-200 opacity-50 cursor-not-allowed'
                                            : 'border-transparent hover:border-orange-300 cursor-pointer'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="text-xs font-mono font-bold text-orange-600">#{idx + 1}</span>
                                            {trend.trending === 'up' && <ArrowUp size={12} className="text-emerald-500" />}
                                            {trend.trending === 'down' && <ArrowDown size={12} className="text-red-500" />}
                                            {trend.trending === 'stable' && <Minus size={12} className="text-slate-400" />}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-slate-900 mb-1 line-clamp-1">{trend.keyword}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                                    {trend.category}
                                                </span>
                                                <span className="text-xs font-bold text-indigo-600">{trend.score}</span>
                                            </div>
                                        </div>
                                        {!keywords.includes(trend.keyword) && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-indigo-600/90 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="flex items-center gap-1 text-white text-xs font-bold">
                                                    <Plus size={12} /> Add
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Searches */}
                {recentSearches.length > 0 && !hasSearched && (
                    <div className="mb-8">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Clock size={12} /> Recent Configurations</h4>
                        <div className="flex flex-wrap gap-3">
                            {recentSearches.map((s, i) => (
                                <div key={i} onClick={() => { setKeywords(s.keywords); setSelectedLocations(s.locations); setSelectedCategories(s.categories); }}
                                    className="cursor-pointer bg-white border border-slate-200 hover:border-indigo-300 px-3 py-2 rounded-lg flex items-center gap-3 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex gap-1">
                                        {s.keywords.slice(0, 2).map(k => <span key={k} className="bg-indigo-50 text-indigo-600 text-[10px] px-1.5 rounded">{k}</span>)}
                                    </div>
                                    <div className="w-px h-3 bg-slate-200"></div>
                                    <span className="text-[10px] text-slate-500 font-mono uppercase">{s.locations[0] || 'Global'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Strategy List Header */}
                {strategies.length > 0 && (
                    <div className="bg-white rounded-t-xl border border-slate-200 px-6 py-3 flex text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <div className="flex-[3]">Strategy / Title</div>
                        <div className="flex-[2] hidden md:block">Keywords</div>
                        <div className="flex-[2] hidden sm:block">Trend Momentum</div>
                        <div className="w-24 text-right">Actions</div>
                    </div>
                )}

                {/* Strategy List Rows */}
                <div className="space-y-2 pb-24">
                    {strategies.map((strategy, idx) => (
                        <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">

                            {/* Collapsed View (Row) */}
                            <div
                                onClick={() => toggleExpand(idx)}
                                className={`px-6 py-4 flex items-center cursor-pointer transition-colors ${expandedId === idx ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                            >
                                {/* Col 1: Title & Badge */}
                                <div className="flex-[3] pr-4">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{strategy.title}</h3>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${strategy.automationLevel === 'High' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'
                                            }`}>
                                            {strategy.automationLevel} Auto
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-1">{strategy.description}</p>
                                </div>

                                {/* Col 2: Keywords (Hidden on Mobile) */}
                                <div className="flex-[2] hidden md:flex flex-wrap gap-1 pr-4">
                                    <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full border border-slate-200 truncate max-w-[120px]">
                                        {strategy.searchQuery}
                                    </span>
                                </div>

                                {/* Col 3: Sparkline */}
                                <div className="flex-[2] hidden sm:flex items-center gap-3">
                                    {renderSparkline(strategy.trendMetrics?.dataPoints)}
                                    <span className="text-xs font-mono font-bold text-indigo-600">{strategy.trendMetrics?.score}/100</span>
                                </div>

                                {/* Col 4: Action */}
                                <div className="w-24 flex justify-end">
                                    <div className={`p-2 rounded-full transition-all ${expandedId === idx ? 'bg-indigo-200 text-indigo-700' : 'text-slate-400 group-hover:bg-slate-100'}`}>
                                        {expandedId === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded View (Details) */}
                            {expandedId === idx && (
                                <div className="border-t border-slate-100 p-6 bg-slate-50/50 animate-slideDown">
                                    <div className="flex flex-col lg:flex-row gap-8">

                                        {/* Left: Edit & Details */}
                                        <div className="flex-1 space-y-6">
                                            <div className="space-y-4">
                                                <div className="group/edit relative">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Edit2 size={10} /> Title</label>
                                                    <input
                                                        value={strategy.title}
                                                        onChange={(e) => handleUpdateStrategy(idx, 'title', e.target.value)}
                                                        className="w-full bg-transparent text-lg font-bold text-slate-900 border-b border-transparent focus:border-indigo-400 focus:bg-white outline-none transition-all px-1"
                                                    />
                                                </div>
                                                <div className="group/edit relative">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Edit2 size={10} /> Description</label>
                                                    <textarea
                                                        value={strategy.description}
                                                        onChange={(e) => handleUpdateStrategy(idx, 'description', e.target.value)}
                                                        className="w-full bg-transparent text-sm text-slate-600 border border-transparent focus:border-indigo-400 focus:bg-white rounded p-2 outline-none transition-all resize-none h-20"
                                                    />
                                                </div>
                                            </div>

                                            {/* Why it Trends */}
                                            {strategy.trendingReason && (
                                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                                    <h4 className="text-xs font-bold text-amber-700 uppercase mb-2 flex items-center gap-2">
                                                        <Lightbulb size={14} fill="currentColor" /> Why it trends
                                                    </h4>
                                                    <p className="text-xs text-amber-900 leading-relaxed">
                                                        {strategy.trendingReason}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Trend Sources Links */}
                                            <div className="bg-white p-4 rounded-xl border border-slate-200">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><TrendingUp size={14} /> Trend Validation Sources</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                    <a href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(strategy.searchQuery)}`} target="_blank" rel="noreferrer"
                                                        className="text-xs flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 rounded transition-colors">
                                                        <ExternalLink size={12} /> Google Trends
                                                    </a>
                                                    <a href="https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en" target="_blank" rel="noreferrer"
                                                        className="text-xs flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-pink-50 text-slate-600 hover:text-pink-600 border border-slate-200 rounded transition-colors">
                                                        <ExternalLink size={12} /> TikTok Creative
                                                    </a>
                                                    <a href="https://www.youtube.com/feed/trending" target="_blank" rel="noreferrer"
                                                        className="text-xs flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 rounded transition-colors">
                                                        <ExternalLink size={12} /> YouTube Trends
                                                    </a>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    // Build refined strategy with all context
                                                    const refinedStrategy: RefinedStrategy = {
                                                        ...strategy,
                                                        selectedKeywords: keywords,
                                                        trendAnalysis: {
                                                            topTrends: topTrends.slice(0, 5).map(t => t.keyword),
                                                            alternateKeywords: alternateKeywords,
                                                            userRefinements: selectedLocations.join(', ') + ' • ' + selectedCategories.join(', ')
                                                        },
                                                        refinementNotes: chatHistories[idx]?.map(m => `${m.role}: ${m.text}`).join('\n') || ''
                                                    };
                                                    onNext(keywords.join(' '), refinedStrategy);
                                                }}
                                                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                                            >
                                                Generate Content <ExternalLink size={16} />
                                            </button>
                                        </div>

                                        {/* Right: AI Chat Assistant */}
                                        <div className="lg:w-1/3 bg-white rounded-xl border border-indigo-100 shadow-sm flex flex-col h-[480px]">
                                            <div className="p-3 border-b border-indigo-50 bg-indigo-50/30 flex items-center gap-2">
                                                <div className="bg-indigo-100 p-1.5 rounded-lg"><Sparkles size={14} className="text-indigo-600" /></div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-indigo-900">AI Strategy Assistant</h4>
                                                    <p className="text-[10px] text-indigo-600">Update & Refine Idea</p>
                                                </div>
                                            </div>

                                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                                {(chatHistories[idx] || []).map((msg, i) => (
                                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[85%] text-xs p-3 rounded-2xl ${msg.role === 'user'
                                                            ? 'bg-indigo-600 text-white rounded-br-none'
                                                            : 'bg-slate-100 text-slate-700 rounded-bl-none'
                                                            }`}>
                                                            {msg.text}
                                                        </div>
                                                    </div>
                                                ))}
                                                {chatLoading[idx] && (
                                                    <div className="flex justify-start">
                                                        <div className="bg-slate-100 p-3 rounded-2xl rounded-bl-none">
                                                            <Loader2 size={14} className="animate-spin text-slate-400" />
                                                        </div>
                                                    </div>
                                                )}
                                                {!chatHistories[idx]?.length && (
                                                    <div className="text-center mt-10 px-4">
                                                        <p className="text-xs text-slate-400">
                                                            Ask me to change the title, refine the description, or find a better hook!<br /><br />
                                                            <em>"Change title to 'Viral Tech Hacks'"</em>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-3 border-t border-slate-100 flex gap-2">
                                                <input
                                                    value={chatInputs[idx] || ''}
                                                    onChange={(e) => setChatInputs(prev => ({ ...prev, [idx]: e.target.value }))}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleChat(idx)}
                                                    placeholder="Suggest a new title..."
                                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-400"
                                                />
                                                <button
                                                    onClick={() => handleChat(idx)}
                                                    disabled={!chatInputs[idx] || chatLoading[idx]}
                                                    className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg disabled:opacity-50 transition-colors"
                                                >
                                                    <Send size={14} />
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};