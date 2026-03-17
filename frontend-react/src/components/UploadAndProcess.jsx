import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Sparkles, Zap, Check } from 'lucide-react';
import Logo from '../assets/app-logo.png';
import { BACKEND_URL } from '../constants';
import { useGeneration } from '../context/GenerationContext';

const UploadAndProcess = () => {
    const {
        file, setFile,
        mode, setMode,
        status, setStatus,
        progress,
        log,
        brandKit,
        selectedLogoUrl, setSelectedLogoUrl,
        handleGenerate
    } = useGeneration();
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('idle');
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setStatus('idle');
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-16 px-6 sm:px-12 bg-white">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-start">
                {/* Left Side: Creative Context */}
                <div className="flex-1 lg:sticky lg:top-32">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="max-w-md"
                    >
                        <span className="text-slate-900 font-black uppercase tracking-[0.3em] text-[10px] mb-6 block">Generation Studio</span>
                        <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight mb-8 tracking-tighter">
                            Engineering <br />
                            Visual <span className="text-slate-500 font-light italic">Logic.</span>
                        </h2>
                        <p className="text-slate-500 text-sm leading-relaxed mb-12 font-medium">
                            Upload your documents to our AI synthesis engine. We'll decompose the text into
                            richer long-form scenes, generate narration, and compile high-fidelity infographic animations
                            for 1:00 to 1:30 minute videos.
                        </p>

                        <div className="space-y-8">
                            {[
                                { icon: Sparkles, title: "Neural Synthesis", desc: "Automated extraction of key narrative themes" },
                                { icon: Zap, title: "Extended Motion", desc: "Long-form rendering with denser animations and visuals" }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + i * 0.1 }}
                                    className="flex gap-6"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 shrink-0 shadow-sm">
                                        <item.icon size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-slate-900 font-bold text-sm mb-1">{item.title}</h4>
                                        <p className="text-slate-500 text-xs font-medium">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Right Side: Upload Card */}
                <div className="w-full lg:w-[500px]">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-200 p-8 sm:p-12 relative overflow-hidden"
                    >
                        {/* Status Overlay for Processing */}
                        <AnimatePresence>
                            {status === 'processing' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center"
                                >
                                    <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-slate-900 animate-spin mb-6" />
                                    <h3 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tighter">Synthesizing...</h3>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{log}</p>
                                    <div className="w-full h-1 bg-slate-100 rounded-full mt-8 overflow-hidden border border-slate-200">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            className="h-full bg-slate-900"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="relative z-10">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 text-center">Configure Production</h3>

                            {/* Mode Selection */}
                            <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-10 border border-slate-200 shadow-inner">
                                {['infographic', 'avatar'].map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => setMode(m)}
                                        className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>

                            {/* Logo Selection Section */}
                            {brandKit && brandKit.logos && brandKit.logos.length > 0 && (
                                <div className="mb-10 px-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Select Brand Identity</h4>
                                        <div className="flex gap-1">
                                            {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-slate-200" />)}
                                        </div>
                                    </div>
                                    <div className="flex gap-4 overflow-x-auto pb-6 pt-2 px-1 no-scrollbar sm:grid sm:grid-cols-4 sm:overflow-visible">
                                        {brandKit.logos.map((url, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedLogoUrl(url)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        setSelectedLogoUrl(url);
                                                    }
                                                }}
                                                aria-label={`Select brand logo ${i + 1}`}
                                                tabIndex={0}
                                                className={`relative group shrink-0 w-24 h-24 sm:w-auto aspect-square rounded-[1.5rem] border-2 transition-all duration-500 flex items-center justify-center p-3 bg-slate-50 overflow-hidden focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 ${selectedLogoUrl === url ? 'border-slate-900 bg-white shadow-2xl scale-105 z-10' : 'border-transparent hover:border-slate-200 hover:bg-white'}`}
                                            >
                                                <img
                                                    src={url.startsWith('http') ? `${BACKEND_URL}/logo-proxy?url=${url}` : url}
                                                    alt={`Logo ${i}`}
                                                    className={`max-w-full max-h-full object-contain transition-all duration-700 ${selectedLogoUrl === url ? 'scale-110' : 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'}`}
                                                />

                                                {selectedLogoUrl === url && (
                                                    <motion.div
                                                        layoutId="select-indicator"
                                                        className="absolute inset-0 bg-slate-900/5 pointer-events-none"
                                                    />
                                                )}

                                                {selectedLogoUrl === url && (
                                                    <div className="absolute top-2 right-2 bg-slate-900 text-white rounded-full p-1 shadow-lg">
                                                        <Check size={10} strokeWidth={4} />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Upload Area */}
                            <div
                                className="relative group mb-10"
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                    accept=".pdf,.docx,.txt"
                                />
                                <div className={`h-72 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-6 transition-all ${isDragging ? 'border-slate-900 bg-slate-100 scale-[1.02] shadow-inner' : file ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-slate-50 group-hover:bg-slate-100 group-hover:border-slate-300 shadow-sm'}`}>
                                    <div className={`${file ? 'text-slate-900' : 'text-slate-300'} transition-transform group-hover:scale-110 duration-700 ${isDragging ? 'scale-110 text-slate-900 animate-bounce' : ''}`}>
                                        <Upload size={56} strokeWidth={1.5} />
                                    </div>
                                    <div className="text-center px-8">
                                        <p className="text-slate-900 font-black text-sm mb-2 uppercase tracking-tighter">
                                            {isDragging ? 'Drop File Here' : file ? file.name : 'Select or Drop Document'}
                                        </p>
                                        <p className="text-slate-400 text-[10px] uppercase tracking-widest leading-none font-bold">
                                            PDF, DOCX, TXT • MAX 200MB
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Main CTA */}
                            <button
                                onClick={handleGenerate}
                                disabled={!file || status === 'processing'}
                                className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 ${!file ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-slate-900 text-white shadow-xl hover:bg-slate-800'}`}
                            >
                                <img src={Logo} alt="Play" className="w-5 h-5 object-contain" />
                                {status === 'error' ? 'Retry Generation' : 'Initialize Production'}
                            </button>

                            {status === 'error' && (
                                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-[10px] font-black uppercase tracking-widest animate-shake">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    {log}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default UploadAndProcess;
