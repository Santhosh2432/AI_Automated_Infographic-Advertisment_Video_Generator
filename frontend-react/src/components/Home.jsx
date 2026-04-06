import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Users, FileVideo, Award, CheckCircle2, Layout, BarChart3, Settings } from 'lucide-react';
import Features from './Features';
import Logo from '../assets/app-logo.png';

const Home = ({ onStart, onExplore }) => {
    return (
        <div className="bg-[#F8FAFC]">
            {/* Hero Section */}
            <section className="relative pt-24 pb-20 px-6 sm:px-12 overflow-hidden border-b border-slate-200 bg-white">
                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#0F172A 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-20">
                        <div className="flex-1 text-center lg:text-left">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter mb-8">
                                    Create <span className="text-slate-500">Infographic</span> <br />
                                    Videos from Docs.
                                </h1>
                                <p className="text-slate-500 text-lg leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0 font-medium">
                                    Transform business reports, research papers, and documentation into engaging high-fidelity videos in minutes. Fully automated.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                    <button
                                        onClick={onStart}
                                        className="group px-8 py-4 bg-slate-900 text-white rounded-xl font-bold text-sm transition-all hover:bg-slate-800 shadow-xl active:scale-95 flex items-center gap-3"
                                    >
                                        Generate Video
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                    <button
                                        onClick={onExplore}
                                        className="px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-xl font-bold text-sm transition-all hover:bg-slate-50 hover:shadow-md active:scale-95"
                                    >
                                        Explore Studio
                                    </button>
                                </div>
                            </motion.div>
                        </div>

                        <div className="flex-1 relative w-full max-w-2xl lg:block">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="relative z-10 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden aspect-[4/3] flex flex-col scale-[0.85] sm:scale-100 origin-center sm:origin-right lg:origin-center"
                            >
                                {/* Mock Studio Header */}
                                <div className="h-12 border-b border-slate-100 bg-slate-50 flex items-center justify-between px-6 shrink-0">
                                    <div className="flex gap-4">
                                        <div className="flex gap-1">
                                            {[1, 2, 3].map(i => <div key={i} className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-red-400' : i === 2 ? 'bg-amber-400' : 'bg-green-400'}`} />)}
                                        </div>
                                        <div className="h-4 w-px bg-slate-200" />
                                        <div className="flex gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <span className="text-slate-900">Edit</span>
                                            <span>Timeline</span>
                                            <span>Config</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="h-6 px-3 rounded-lg bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer hover:bg-slate-800 transition-all">
                                            <ArrowRight size={10} />
                                            Export
                                        </div>
                                    </div>
                                </div>

                                {/* Mock Studio Body */}
                                <div className="flex-1 flex overflow-hidden">
                                    {/* Sidebar */}
                                    <div className="w-12 border-r border-slate-100 bg-slate-50/50 flex flex-col items-center py-4 gap-4 shrink-0">
                                        {[Layout, 'play', BarChart3, Users, Settings].map((Icon, i) => (
                                            <div key={i} className={`p-2 rounded-lg ${i === 2 ? 'bg-slate-200 text-slate-900' : 'text-slate-400'}`}>
                                                {Icon === 'play' ? (
                                                    <img src={Logo} alt="Play" className="w-[16px] h-[16px] object-contain opacity-40" />
                                                ) : (
                                                    <Icon size={16} />
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Main Canvas */}
                                    <div className="flex-1 bg-white p-6 flex flex-col gap-6 overflow-hidden">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-tighter mb-1">Scene 03: Performance Logic</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active Layer: Chart Renderer</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="px-2 py-1 rounded bg-slate-50 border border-slate-200 text-[8px] font-black text-slate-400 uppercase tracking-widest">Auto Layout</div>
                                            </div>
                                        </div>

                                        {/* Visual Chart Editor Mock */}
                                        <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center relative group overflow-hidden">
                                            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#0F172A 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                                            <div className="relative z-10 flex flex-col items-center gap-4">
                                                <div className="flex items-end gap-2 h-24">
                                                    {[0.4, 0.7, 0.5, 0.9, 0.6].map((h, i) => (
                                                        <motion.div
                                                            key={i}
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${h * 100}%` }}
                                                            transition={{ delay: 0.4 + i * 0.1, duration: 1 }}
                                                            className="w-4 bg-slate-900 rounded-t-sm shadow-lg"
                                                        />
                                                    ))}
                                                </div>
                                                <div className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-sm animate-pulse">
                                                    AI Synthesizing Frames...
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Mock Timeline */}
                                <div className="h-24 border-t border-slate-100 bg-slate-50 p-3 shrink-0">
                                    <div className="flex gap-3 h-full">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className={`flex-1 rounded-lg border flex flex-col overflow-hidden transition-all hover:scale-[1.02] cursor-pointer ${i === 3 ? 'border-slate-900 bg-white shadow-xl' : 'border-slate-200 bg-slate-50/50'}`}>
                                                <div className={`flex-1 flex items-center justify-center transition-all ${i === 3 ? 'scale-110' : 'opacity-40'}`}>
                                                    <img src={Logo} alt="Logo" className="w-[32px] h-[32px] object-contain" />
                                                </div>
                                                <div className="h-4 bg-white border-t border-inherit px-2 flex items-center justify-between">
                                                    <span className="text-[7px] font-black text-slate-400 tracking-tighter uppercase">Scene 0{i}</span>
                                                    <span className="text-[7px] font-bold text-slate-300">5.2s</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Decorative Orbs */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-slate-200/50 blur-3xl rounded-full" />
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-slate-100/50 blur-3xl rounded-full" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <Features />
        </div>
    );
};

export default Home;
