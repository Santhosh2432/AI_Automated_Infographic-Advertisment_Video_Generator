import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const Features = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 pb-24 px-6 sm:px-12 max-w-7xl mx-auto">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -8, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="group p-8 rounded-[2rem] bg-slate-50 border border-slate-200 shadow-xl hover:border-slate-300 transition-all cursor-default relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:bg-slate-200 transition-colors" />
            <h3 className="text-slate-900 font-black text-[10px] uppercase tracking-widest mb-6 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-slate-900" />
                Core Capabilities
            </h3>
            <ul className="space-y-4 relative z-10">
                {[
                    "OCR-based text extraction",
                    "AI-powered script & scene planning",
                    "Animated infographic generation",
                    "AI narration with TTS",
                    "Avatar video generation"
                ].map((f, i) => (
                    <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                        className="flex items-center gap-3 text-slate-500 text-sm font-medium"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-900 group-hover:scale-125 transition-transform" />
                        {f}
                    </motion.li>
                ))}
            </ul>
        </motion.div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -8, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
            className="group p-8 rounded-[2rem] bg-slate-50 border border-slate-200 shadow-xl hover:border-slate-300 transition-all cursor-default relative overflow-hidden"
        >
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-100 blur-3xl rounded-full -translate-x-10 translate-y-10 group-hover:bg-slate-200 transition-colors" />
            <h3 className="text-slate-900 font-black text-[10px] uppercase tracking-widest mb-6 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-slate-900" />
                Technology Stack
            </h3>
            <ul className="space-y-4 relative z-10">
                {[
                    "Python & FastAPI Backend",
                    "React & Tailwind Frontend",
                    "Azure OpenAI & OCR Services",
                    "Pillow & FFmpeg Rendering",
                    "Framer Motion Animations"
                ].map((f, i) => (
                    <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.05 }}
                        className="flex items-center gap-3 text-slate-500 text-sm font-medium"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-900 group-hover:scale-125 transition-transform" />
                        {f}
                    </motion.li>
                ))}
            </ul>
        </motion.div>
    </div>
);

export default Features;
