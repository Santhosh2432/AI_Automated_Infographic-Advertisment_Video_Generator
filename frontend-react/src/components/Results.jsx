import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, BarChart3, Download, FileText, ExternalLink, Maximize, Sparkles, Edit3, Save, X, RotateCcw } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../constants';

const Results = ({ data }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedScript, setEditedScript] = useState('');
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [currentData, setCurrentData] = useState(data);

    const getNarrationText = (payload) => (
        payload?.narration ||
        payload?.script ||
        payload?.narration_preview ||
        payload?.script_preview ||
        ''
    );

    useEffect(() => {
        if (data) {
            setCurrentData(data);
            setEditedScript(getNarrationText(data));
        }
    }, [data]);

    if (!currentData) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
            <div className="w-24 h-24 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-8 shadow-sm">
                <Video size={40} className="text-slate-300" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">Production Queue</h2>
            <p className="font-bold uppercase tracking-widest text-[10px] text-slate-400">Await Generation Data...</p>
        </div>
    );

    const getFullUrl = (url) => {
        if (!url || url === '#') return '#';
        if (url.startsWith('http')) return url;
        return `${BACKEND_URL}${url}`;
    };

    const videoUrl = getFullUrl(currentData.video_url);
    const blobUrl = getFullUrl(currentData.video_blob_url);
    const scenes = currentData.scenes || [];

    const handleDownload = async () => {
        const downloadUrl = videoUrl !== '#' ? videoUrl : blobUrl;
        if (downloadUrl === '#') return;

        try {
            const response = await fetch(downloadUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'generated_video.mp4');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            window.open(downloadUrl, '_blank');
        }
    };

    const handleRegenerate = async () => {
        setIsRegenerating(true);
        const formData = new FormData();
        formData.append('script', editedScript);
        formData.append('video_type', currentData.type || (currentData.scenes ? 'infographic' : 'avatar'));
        if (currentData.scenes) {
            formData.append('scenes', JSON.stringify(currentData.scenes));
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${BACKEND_URL}/regenerate`, formData, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.status === 200) {
                setCurrentData({
                    ...currentData,
                    video_url: response.data.video_url,
                    video_blob_url: response.data.video_blob_url,
                    script_preview: editedScript,
                    narration_preview: editedScript
                });
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Regeneration failed:', error);
            alert('Failed to regenerate video. Please check your connection.');
        } finally {
            setIsRegenerating(false);
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto py-8 sm:py-12 px-4 sm:px-12 bg-white">
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden relative"
            >
                {/* Regeneration Overlay */}
                <AnimatePresence>
                    {isRegenerating && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[110] bg-white/90 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center"
                        >
                            <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-slate-900 animate-spin mb-6" />
                            <h3 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tighter">Regenerating Magic...</h3>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Rebuilding your visual narrative with revised timing</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Visual Header */}
                <div className="px-6 sm:px-10 py-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 gap-6">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg shrink-0">
                            <Video size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Production Studio</h2>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Status: Ready</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto justify-center sm:justify-end">
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={`h-10 px-4 sm:px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm flex items-center gap-2 ${isEditing ? 'bg-white border-slate-900 text-slate-900' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}`}
                        >
                            {isEditing ? <X size={14} /> : <Edit3 size={14} />}
                            {isEditing ? 'Cancel Edit' : 'Edit Narrative'}
                        </button>
                        <button
                            onClick={handleDownload}
                            className="h-10 px-4 sm:px-6 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2 sm:gap-3"
                        >
                            <Download size={14} />
                            Export MP4
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row min-h-[auto] lg:min-h-[800px]">
                    {/* Scene Explorer Sidebar */}
                    <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-50/30 flex flex-col order-2 lg:order-1">
                        <div className="p-8 border-b border-slate-100">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                <span>Scene Timeline</span>
                                <span className="bg-slate-900 text-white px-2 py-0.5 rounded-md text-[9px]">V1.0</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <div className="space-y-4">
                                {scenes.map((scene, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group cursor-pointer"
                                    >
                                        <div className="p-5 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 shadow-sm group-hover:shadow-md">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Scene 0{i + 1}</span>
                                                <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-slate-900 transition-colors" />
                                            </div>
                                            <p className="text-xs text-slate-400 font-bold leading-relaxed line-clamp-2 italic">
                                                "{scene.description || "Synthesizing visual..."}"
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Elite Preview Area */}
                    <div className="flex-1 bg-slate-50/50 p-6 sm:p-16 order-1 lg:order-2">
                        <motion.div
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="relative max-w-5xl mx-auto"
                        >
                            {/* Minimalism Device Frame */}
                            <div className="relative bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl p-2 sm:p-4 overflow-hidden border border-slate-200">
                                <div className="aspect-video bg-slate-900 rounded-[1.5rem] sm:rounded-[1.8rem] overflow-hidden relative shadow-inner">
                                    <video
                                        key={videoUrl}
                                        src={videoUrl}
                                        controls
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            </div>

                            {/* Metadata Footer */}
                            <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row justify-between items-start sm:items-end border-t border-slate-100 pt-8 gap-6">
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter mb-2">Automated Master Preview</h3>
                                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-900" /> 1080p Ultra HD
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-900" /> AI-Generated Narration
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto justify-end">
                                    <button className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm hover:shadow-md">
                                        <Maximize size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Script Logic Sidebar */}
                    <div className="w-full lg:w-[400px] border-t lg:border-t-0 lg:border-l border-slate-100 bg-slate-50/30 flex flex-col p-6 sm:p-10 order-3">
                        <div className="flex items-center justify-between mb-8 sm:mb-10">
                            <div className="flex items-center gap-3">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900">Narration Script</h4>
                                <div className="h-px w-12 bg-slate-100" />
                            </div>
                            {isEditing && (
                                <button
                                    onClick={handleRegenerate}
                                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                                >
                                    <RotateCcw size={10} />
                                    Update Video
                                </button>
                            )}
                        </div>
                        <div className={`flex-1 min-h-[300px] lg:min-h-0 bg-white rounded-[2rem] border transition-all duration-500 overflow-hidden ${isEditing ? 'border-slate-900 shadow-2xl ring-4 ring-slate-900/5' : 'border-slate-200 shadow-inner'}`}>
                            {isEditing ? (
                                <textarea
                                    value={editedScript}
                                    onChange={(e) => setEditedScript(e.target.value)}
                                    className="w-full h-full p-6 sm:p-8 text-sm text-slate-700 font-bold leading-[2] outline-none resize-none bg-transparent"
                                    placeholder="Refine your narrative here..."
                                />
                            ) : (
                                <div className="p-6 sm:p-8 h-full overflow-y-auto custom-scrollbar">
                                    <p className="text-sm text-slate-500 font-bold leading-[2] select-text">
                                        {getNarrationText(currentData)}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="mt-8 sm:mt-10 pt-8 sm:pt-10 border-t border-slate-100">
                            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                                <div className="flex items-center gap-3 mb-3">
                                    <Sparkles size={16} className="text-slate-900" />
                                    <span className="text-[10px] font-black uppercase text-slate-900 tracking-widest">AI Intelligence</span>
                                </div>
                                <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                                    {isEditing ? 'Modify the script above to regenerate the narration audio and video synchronization.' : 'This script was synthesized using Azure OpenAI and synchronized with Neural TTS for realistic human cadence.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Results;
