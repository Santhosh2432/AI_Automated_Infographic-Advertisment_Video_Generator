import React from 'react';
import { motion } from 'framer-motion';
import {
    Target,
    AlertCircle,
    Lightbulb,
    RefreshCcw,
    ListChecks,
    Layers,
    Briefcase,
    Activity,
    FileText,
    Brain,
    MonitorPlay,
    CheckCircle2
} from 'lucide-react';

const About = () => {
    return (
        <div className="bg-[#F8FAFC] py-24 px-6 sm:px-12">
            <div className="max-w-5xl mx-auto">
                {/* 1. Short Mission Statement */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-24"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-900 text-[10px] font-black uppercase tracking-widest mb-6">
                        <Target size={12} />
                        Our Mission
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-tight max-w-3xl mx-auto">
                        AI Automated Infographic Video Generator transforms static documents into <span className="text-slate-500">engaging, high-quality infographic videos</span>.
                    </h1>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-24">
                    {/* 2. The Problem */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
                                <AlertCircle size={20} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">The Problem</h3>
                        </div>
                        <p className="text-slate-500 leading-relaxed font-medium">
                            Creating infographic videos from reports and research papers is time-consuming, expensive, and requires design expertise. Most users struggle to convert data-heavy documents into visually engaging content.
                        </p>
                    </motion.div>

                    {/* 3. The Solution */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
                                <Lightbulb size={20} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">The Solution</h3>
                        </div>
                        <p className="text-slate-500 leading-relaxed font-medium">
                            Our platform automatically analyzes documents, extracts key insights, and converts them into structured infographic scenes with charts, animations, and voice-ready timelines — all in minutes.
                        </p>
                    </motion.div>
                </div>

                {/* 4. How It Works */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-[2.5rem] p-8 sm:p-12 mb-24 border border-slate-200 shadow-xl"
                >
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100">
                            <RefreshCcw size={20} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase tracking-widest text-[11px]">Workflow Architecture</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                        {[
                            { step: 'Upload', icon: FileText, label: 'Upload Document' },
                            { step: 'Analyze', icon: Brain, label: 'AI Content Analysis' },
                            { step: 'Generate', icon: Layers, label: 'Scene Generation' },
                            { step: 'Render', icon: MonitorPlay, label: 'Video Output' }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-sm">
                                    <item.icon size={20} />
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{item.step}</div>
                                <div className="text-xs font-bold text-slate-900">{item.label}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-24">
                    {/* 5. Key Features */}
                    <div className="col-span-1">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-center">
                                <ListChecks size={16} />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Key Features</h3>
                        </div>
                        <ul className="space-y-4">
                            {[
                                "Document-to-video automation",
                                "Smart infographic & chart generation",
                                "Auto scene design & layouts",
                                "AI-ready voiceover timeline",
                                "Fast rendering pipeline"
                            ].map((f, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-500">
                                    <CheckCircle2 size={16} className="text-slate-900 shrink-0" />
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* 6. Technology Stack */}
                    <div className="col-span-1">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-center">
                                <Layers size={16} />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Tech Stack</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-900 uppercase mb-1">Frontend</h4>
                                <p className="text-sm font-medium text-slate-500">React + Vite + Tailwind CSS</p>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-900 uppercase mb-1">AI Engine</h4>
                                <p className="text-sm font-medium text-slate-500">NLP, text summarization, content segmentation</p>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-900 uppercase mb-1">Visualization</h4>
                                <p className="text-sm font-medium text-slate-500">Chart rendering & motion logic</p>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-900 uppercase mb-1">Architecture</h4>
                                <p className="text-sm font-medium text-slate-500">Modular pipeline-based system</p>
                            </div>
                        </div>
                    </div>

                    {/* 7. Use Cases */}
                    <div className="col-span-1">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-center">
                                <Briefcase size={16} />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Use Cases</h3>
                        </div>
                        <ul className="space-y-4">
                            {[
                                "Business presentations",
                                "Research & academic reports",
                                "Marketing explainers",
                                "E-learning content",
                                "Corporate documentation"
                            ].map((f, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-500">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* 8. Why It Matters */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="border-t border-slate-200 pt-16 text-center"
                >
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                            <Activity size={20} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Why This Project Matters</h3>
                    </div>
                    <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
                        This project demonstrates the practical application of AI in content automation, reducing production time while improving visual communication and accessibility.
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default About;
