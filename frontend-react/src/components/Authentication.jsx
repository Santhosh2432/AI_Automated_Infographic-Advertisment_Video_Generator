import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail,
    Lock,
    User,
    ArrowRight,
    Github,
    Chrome,
    ShieldCheck,
    CheckCircle2
} from 'lucide-react';

import axios from 'axios';
import { BACKEND_URL } from '../constants';

const Authentication = ({ onLoginSuccess }) => {
    const [mode, setMode] = useState('login'); // 'login' or 'signup'
    const [formState, setFormState] = useState('idle'); // 'idle', 'loading', 'success', 'error'
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: ''
    });

    const handleSocialLogin = (provider) => {
        // Redirect to backend OAuth starting routes
        window.location.href = `${BACKEND_URL}/auth/${provider}`;
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormState('loading');
        setError('');

        try {
            const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';
            const payload = mode === 'login'
                ? { email: formData.email, password: formData.password }
                : { full_name: formData.fullName, email: formData.email, password: formData.password };

            const response = await axios.post(`${BACKEND_URL}${endpoint}`, payload);

            if (response.data.access_token) {
                // Save token to localStorage
                localStorage.setItem('token', response.data.access_token);
                localStorage.setItem('user', JSON.stringify(response.data.user));

                setFormState('success');
                setTimeout(() => {
                    if (onLoginSuccess) {
                        onLoginSuccess(response.data.user);
                    }
                }, 1000);
            }
        } catch (err) {
            setFormState('error');
            setError(err.response?.data?.detail || 'Authentication failed. Please check your credentials.');
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-20 px-6 bg-white relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand/10 blur-3xl rounded-full" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand/5 blur-3xl rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden relative z-10"
            >
                {/* Left Side: Messaging */}
                <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-50 relative border-r border-slate-100">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-200/50 to-transparent pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight mb-8">
                                Create Your Account
                            </h2>
                        </div>

                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight mb-8">
                            Unlock the power of <span className="text-slate-500 italic font-light">AI-Driven</span> Content Creation.
                        </h2>

                        <ul className="space-y-6">
                            {[
                                "Unlimited document transformations",
                                "High-resolution video exports",
                                "Advanced scene customization",
                                "Premium AI narration voices"
                            ].map((item, i) => (
                                <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-3 text-slate-500 text-sm font-medium"
                                >
                                    <CheckCircle2 size={18} className="text-slate-900 shrink-0" />
                                    {item}
                                </motion.li>
                            ))}
                        </ul>
                    </div>

                    <div className="relative z-6 pt-8 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Enterprise-grade visual synthesis engine</p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="p-8 md:p-16 flex flex-col justify-center relative bg-white/[0.02]">
                    <AnimatePresence mode="wait">
                        {formState === 'success' ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-12"
                            >
                                <div className="w-20 h-20 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-6 border border-green-100 shadow-sm">
                                    <ShieldCheck size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tighter">Welcome Back!</h3>
                                <p className="text-slate-500 font-medium mb-8 text-sm">Authentication successful. Redirecting you to the studio...</p>
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-slate-900 animate-bounce" />
                                    <div className="w-2 h-2 rounded-full bg-slate-900 animate-bounce delay-75" />
                                    <div className="w-2 h-2 rounded-full bg-slate-900 animate-bounce delay-150" />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className="mb-10 text-center lg:text-left">
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">
                                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                                    </h3>
                                    <p className="text-slate-400 text-sm font-medium">
                                        {mode === 'login' ? 'Enter your credentials to continue' : 'Join our community of AI creators'}
                                    </p>
                                </div>

                                {error && (
                                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold animate-shake">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {mode === 'signup' && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                                            <div className="relative group">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={18} />
                                                <input required name="fullName" value={formData.fullName} onChange={handleInputChange} type="text" placeholder="John Doe" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:border-slate-400 outline-none transition-all placeholder:text-slate-300" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={18} />
                                            <input required name="email" value={formData.email} onChange={handleInputChange} type="email" placeholder="user@example.com" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:border-slate-400 outline-none transition-all placeholder:text-slate-300" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                                            {mode === 'login' && (
                                                <button type="button" className="text-[10px] font-black text-slate-900 uppercase tracking-widest hover:text-slate-500 transition-colors">Forgot?</button>
                                            )}
                                        </div>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={18} />
                                            <input required name="password" value={formData.password} onChange={handleInputChange} type="password" placeholder="••••••••" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:border-slate-400 outline-none transition-all placeholder:text-slate-300" />
                                        </div>
                                    </div>

                                    <button
                                        disabled={formState === 'loading'}
                                        type="submit"
                                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3 group overflow-hidden"
                                    >
                                        {formState === 'loading' ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse delay-75" />
                                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse delay-150" />
                                            </div>
                                        ) : (
                                            <>
                                                {mode === 'login' ? 'Sign In to Studio' : 'Create Account'}
                                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>

                                <div className="mt-10">
                                    <div className="relative flex items-center justify-center mb-8">
                                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                                        <span className="relative px-4 text-[10px] font-black text-slate-400 uppercase bg-white">Or continue with</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => handleSocialLogin('google')}
                                            className="flex items-center justify-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all shadow-sm"
                                        >
                                            <Chrome size={18} className="text-slate-900" />
                                            <span className="text-xs font-bold text-slate-900">Google</span>
                                        </button>
                                        <button
                                            onClick={() => handleSocialLogin('github')}
                                            className="flex items-center justify-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all shadow-sm"
                                        >
                                            <Github size={18} className="text-slate-900" />
                                            <span className="text-xs font-bold text-slate-900">GitHub</span>
                                        </button>
                                    </div>
                                </div>

                                <p className="mt-10 text-center text-sm font-medium text-slate-400">
                                    {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
                                    <button
                                        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                                        className="text-slate-900 font-black uppercase tracking-widest text-[11px] hover:text-slate-500 transition-colors"
                                    >
                                        {mode === 'login' ? 'Create Account' : 'Sign in'}
                                    </button>
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default Authentication;
