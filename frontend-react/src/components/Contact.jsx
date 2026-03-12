import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Mail,
    MapPin,
    Clock,
    Send,
    User,
    MessageSquare,
    Building2,
    HelpCircle,
    ArrowRight,
    CheckCircle2
} from 'lucide-react';

const Contact = ({ onGenerate }) => {
    const [formState, setFormState] = useState('idle'); // idle, sending, success

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormState('sending');
        // Simulate API call
        setTimeout(() => setFormState('success'), 1500);
    };

    return (
        <div className="bg-[#F8FAFC] py-24 px-6 sm:px-12 overflow-hidden min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* 1. Short Intro */}
                <div className="text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <span className="text-slate-900 font-black uppercase tracking-widest text-[10px] mb-4 block">Get In Touch</span>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-tight max-w-2xl mx-auto mb-6">
                            Have questions about <span className="text-slate-500">AI-powered</span> video generation?
                        </h1>
                        <p className="text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
                            Reach out for demos, feedback, or collaboration opportunities. We respond to all inquiries within 24-48 hours.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                    {/* Left Side: Form Guidance & Alternative Info */}
                    <div className="lg:col-span-1 space-y-12">
                        {/* 3. What the Contact Is For */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">How we can help</h3>
                            <ul className="space-y-4">
                                {[
                                    "Product inquiries & Demos",
                                    "Technical integration questions",
                                    "Feature suggestions & Feedback",
                                    "Academic & Project collaboration"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                                        <CheckCircle2 size={16} className="text-slate-900 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* 4. Alternative Contact Info */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-xl"
                        >
                            <h3 className="text-sm font-bold text-slate-900 mb-6">Contact Details</h3>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100 shadow-sm">
                                        <Mail size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
                                        <p className="text-sm font-bold text-slate-900">contact@aivideogen.ai</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100 shadow-sm">
                                        <MapPin size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</p>
                                        <p className="text-sm font-bold text-slate-900">Bangalore, India</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100 shadow-sm">
                                        <Clock size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Response Time</p>
                                        <p className="text-sm font-bold text-slate-900">Within 24–48 hours</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* FAQ Link */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="p-6 bg-slate-900 rounded-2xl flex items-center justify-between group cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <HelpCircle size={20} className="text-white" />
                                <span className="text-sm font-bold text-white">Looking for quick answers?</span>
                            </div>
                            <ArrowRight size={16} className="text-white group-hover:translate-x-1 transition-transform" />
                        </motion.div>
                    </div>

                    {/* Right Side: 2. Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2 bg-white rounded-[2.5rem] p-6 sm:p-8 md:p-12 border border-slate-200 shadow-xl relative overflow-hidden"
                    >
                        {formState === 'success' ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-20">
                                <div className="w-20 h-20 rounded-full bg-green-50 border border-green-100 text-green-600 flex items-center justify-center mb-6">
                                    <Send size={40} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Message Sent Successfully!</h2>
                                <p className="text-slate-500 max-w-xs mx-auto mb-8 font-medium">
                                    Thank you for reaching out. Our team will get back to you shortly.
                                </p>
                                <button
                                    onClick={() => setFormState('idle')}
                                    className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm tracking-widest uppercase shadow-xl hover:bg-slate-800 transition-all"
                                >
                                    Send Another
                                </button>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">Send us a message</h3>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                                            <div className="relative group">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="John Doe"
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-slate-400 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
                                                <input
                                                    required
                                                    type="email"
                                                    placeholder="john@example.com"
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-slate-400 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Company / Institution</label>
                                            <div className="relative group">
                                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="Acme Corp"
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-slate-400 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Inquiry Type</label>
                                            <select className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:border-slate-400 outline-none transition-all appearance-none cursor-pointer">
                                                <option className="bg-white">Demo Request</option>
                                                <option className="bg-white">Technical Support</option>
                                                <option className="bg-white">General Feedback</option>
                                                <option className="bg-white">Collaboration</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Your Message</label>
                                        <div className="relative group">
                                            <MessageSquare className="absolute left-4 top-6 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
                                            <textarea
                                                required
                                                rows={5}
                                                placeholder="Tell us about your project or questions..."
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-slate-400 outline-none transition-all resize-none"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        disabled={formState === 'sending'}
                                        type="submit"
                                        className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3 group"
                                    >
                                        {formState === 'sending' ? (
                                            <>Sending...</>
                                        ) : (
                                            <>
                                                Send Message
                                                <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </motion.div>
                </div>

                {/* 5. Call-to-Action After Form */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-24 p-8 sm:p-12 bg-white border border-slate-200 rounded-[2.5rem] sm:rounded-[3rem] text-center relative overflow-hidden shadow-2xl"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-900 opacity-[0.02] blur-3xl rounded-full translate-x-32 -translate-y-32" />
                    <div className="relative z-10">
                        <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Want to see it in action?</h3>
                        <p className="text-slate-500 mb-10 max-w-sm mx-auto text-sm font-medium">Ready to transform your static documents into cinematic infographics?</p>
                        <button
                            onClick={onGenerate}
                            className="px-10 py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all flex items-center gap-4 mx-auto group"
                        >
                            Try the Generate Demo
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Contact;
