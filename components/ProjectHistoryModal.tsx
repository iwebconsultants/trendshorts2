import React, { useEffect, useState } from 'react';
import { X, Clock, PlayCircle, Trash2, FolderOpen } from 'lucide-react';
import { SavedProject } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onLoad: (project: SavedProject) => void;
}

export const ProjectHistoryModal: React.FC<Props> = ({ isOpen, onClose, onLoad }) => {
    const [projects, setProjects] = useState<SavedProject[]>([]);

    useEffect(() => {
        if (isOpen) {
            const saved = localStorage.getItem('trendshorts_history');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    // Sort by newest first
                    setProjects(parsed.sort((a: SavedProject, b: SavedProject) => b.date - a.date));
                } catch (e) {
                    console.error("Failed to load history", e);
                }
            }
        }
    }, [isOpen]);

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = projects.filter(p => p.id !== id);
        setProjects(updated);
        localStorage.setItem('trendshorts_history', JSON.stringify(updated));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-slideUp">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                            <FolderOpen size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">My Projects</h2>
                            <p className="text-sm text-slate-500">Manage your drafts and creations</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {projects.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                            <Clock size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-lg font-medium text-slate-900">No projects yet</h3>
                            <p className="text-slate-500">Your generated drafts and videos will appear here.</p>
                        </div>
                    ) : (
                        projects.map(project => (
                            <div
                                key={project.id}
                                onClick={() => onLoad(project)}
                                className="group bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex items-center gap-4"
                            >
                                <div className="w-16 h-16 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                                    {project.imageUrl ? (
                                        <img src={project.imageUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                                    ) : (
                                        <PlayCircle className="text-slate-400 group-hover:text-indigo-500" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-slate-900 truncate pr-2 group-hover:text-indigo-600 transition-colors">
                                            {project.name || "Untitled Project"}
                                        </h4>
                                        <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                                            {new Date(project.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 truncate">
                                        {project.genre} • {project.strategy.targetAudience}
                                    </p>
                                    <div className="flex gap-2 mt-2">
                                        {project.videoUrl && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">Video Ready</span>}
                                        {project.concept && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">Script Ready</span>}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(project.id, e)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete Project"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 text-center text-xs text-slate-400">
                    Projects are stored locally in your browser
                </div>
            </div>
        </div>
    );
};
