import React from 'react';
import { motion } from 'framer-motion';
import Features from './Features';

import {
    FileText,
    ScanLine,
    Terminal,
    LayoutTemplate,
    Mic2,
    Film,
    ChevronRight,
    Sparkles
} from 'lucide-react';

const Explore = () => {
    const workflowSteps = [
        { icon: FileText, label: 'Document', color: 'slate' },
        { icon: ScanLine, label: 'OCR', color: 'slate' },
        { icon: Terminal, label: 'AI Script', color: 'slate' },
        { icon: LayoutTemplate, label: 'Infographics', color: 'slate' },
        { icon: Mic2, label: 'Voice', color: 'slate' },
        { icon: Film, label: 'Video', color: 'slate' }
    ];

    return (
        <section className="py-24 px-6 sm:px-12 bg-white min-h-[70vh]">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
                    <div className="max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <span className="text-slate-900 font-black uppercase tracking-widest text-[10px] mb-4 block">Process Innovation</span>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                                Streamlining Video <br />
                                Production via <span className="text-slate-500 italic font-light">Azure AI.</span>
                            </h2>
                        </motion.div>
                    </div>
                    <motion.p
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-slate-500 max-w-xs text-sm font-medium leading-relaxed"
                    >
                        We leverage cloud-scale intelligence to synthesize narration, timing, and visual hierarchies automatically.
                    </motion.p>
                </div>

                {/* Interactive Workflow Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-32 bg-slate-50 rounded-[2.5rem] sm:rounded-[3rem] p-8 sm:p-12 border border-slate-200 relative overflow-hidden group shadow-xl"
                >
                    <div className="absolute inset-0 bg-slate-900/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-12">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                                <Sparkles size={16} />
                            </div>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Automated Pipeline Architecture</h3>
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
                            {workflowSteps.map((step, i) => (
                                <React.Fragment key={i}>
                                    <motion.div
                                        whileHover={{ y: -5 }}
                                        className="flex flex-col items-center gap-4 relative"
                                    >
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 border bg-white text-slate-900 border-slate-200`}>
                                            <step.icon size={28} />
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest text-slate-500`}>
                                            {step.label}
                                        </span>
                                    </motion.div>

                                    {i < workflowSteps.length - 1 && (
                                        <div className="flex items-center justify-center h-16 pointer-events-none">
                                            <motion.div
                                                initial={{ width: 0, opacity: 0 }}
                                                animate={{ width: 40, opacity: 1 }}
                                                transition={{ delay: 0.5 + i * 0.1 }}
                                                className="hidden md:block h-px bg-slate-200 relative"
                                            >
                                                <motion.div
                                                    animate={{ left: ['0%', '100%'], opacity: [0, 1, 0] }}
                                                    transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                                                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-900"
                                                />
                                            </motion.div>
                                            <ChevronRight className="text-slate-300 md:ml-2" size={20} />
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </motion.div>

                <div className="relative">
                    <div className="absolute -top-20 left-0 text-[100px] font-black text-slate-900/[0.02] select-none pointer-events-none tracking-tighter uppercase">Process</div>
                    <Features />
                </div>
            </div>
        </section>
    );
};

export default Explore;
