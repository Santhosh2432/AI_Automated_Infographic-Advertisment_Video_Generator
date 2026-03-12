import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Palette,
    Upload,
    Check,
    RefreshCw,
    Image as ImageIcon,
    Layout,
    Type,
    Save,
    Trash2,
    Cloud,
    CloudCheck,
    Plus,
    X,
    Grid,
    Settings2,
    MonitorPlay,
    AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../constants';

const BrandKit = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [brandKit, setBrandKit] = useState({
        primary_color: '#1A1A2E',
        secondary_color: '#E94560',
        logo_url: null,
        logos: []
    });

    // UI States
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null); // Local preview for new upload
    const [successMsg, setSuccessMsg] = useState('');
    const [activeTab, setActiveTab] = useState('palette'); // palette, library
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchBrandKit = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setLoading(false);
                    return;
                }
                const response = await axios.get(`${BACKEND_URL}/user/brand-kit`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data) {
                    setBrandKit(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch brand kit", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchBrandKit();
        }
    }, [user]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSuccessMsg('');
        const formData = new FormData();
        formData.append('primary_color', brandKit.primary_color);
        formData.append('secondary_color', brandKit.secondary_color);
        if (logoFile) {
            formData.append('logo_file', logoFile);
        } else if (brandKit.logo_url) {
            formData.append('logo_url', brandKit.logo_url);
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error("No auth token found");
            const response = await axios.post(`${BACKEND_URL}/user/brand-kit`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setBrandKit(response.data.brand_kit);
            setLogoFile(null);
            setLogoPreview(null);
            setSuccessMsg('Identity Synced Successfully');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            console.error("Failed to save brand kit", error);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLogo = async (e, url) => {
        e.stopPropagation();
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('delete_logo_url', url);
            const response = await axios.post(`${BACKEND_URL}/user/brand-kit`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBrandKit(response.data.brand_kit);
        } catch (error) {
            console.error("Failed to delete logo", error);
        }
    };

    const setActiveLogo = (url) => {
        setBrandKit({ ...brandKit, logo_url: url });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-2 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-16 px-6 sm:px-12 bg-white">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-start">
                {/* Left Side: Brand Context */}
                <div className="flex-1 lg:sticky lg:top-32">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="max-w-md"
                    >
                        <span className="text-slate-900 font-black uppercase tracking-[0.3em] text-[10px] mb-6 block">Brand Kit Engine</span>
                        <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight mb-8 tracking-tighter">
                            Brand <br />
                            <span className="text-slate-500 font-light italic">Identity.</span>
                        </h2>
                        <p className="text-slate-500 text-sm leading-relaxed mb-12 font-medium">
                            Our AI orchestration layer injects these visual tokens into every scene,
                            ensuring your productions are pixel-perfect and on-brand.
                        </p>

                        <div className="space-y-8">
                            {[
                                { icon: Palette, title: "Visual DNA", desc: "Define your brand's primary and accent colors" },
                                { icon: ImageIcon, title: "Asset Library", desc: "Upload and manage your brand logo assets" }
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

                {/* Right Side: Brand Kit Card */}
                <div className="w-full lg:w-[500px]">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-200 p-8 sm:p-12 relative overflow-hidden"
                    >
                        <div className="relative z-10">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 text-center">Configure Brand Identity</h3>

                            {/* Tab Selection */}
                            <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-10 border border-slate-200 shadow-inner">
                                {[
                                    { key: 'palette', label: 'Visual DNA', icon: Palette },
                                    { key: 'library', label: 'Assets', icon: ImageIcon }
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === tab.key ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}
                                    >
                                        <tab.icon size={12} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <AnimatePresence mode="wait">
                                {activeTab === 'palette' ? (
                                    <motion.div
                                        key="palette"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-6"
                                    >
                                        {/* Primary Color */}
                                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Identity</h4>
                                            </div>
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 rounded-xl shadow-lg border-2 border-white transition-colors duration-300" style={{ backgroundColor: brandKit.primary_color }} />
                                                <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{brandKit.primary_color}</span>
                                            </div>
                                            <div className="grid grid-cols-6 gap-2">
                                                {['#1A1A2E', '#16213E', '#0F3460', '#533483', '#2C3333', '#395B64',
                                                    '#E94560', '#FF6B6B', '#F77F00', '#FCBF49', '#2EC4B6', '#3A86FF',
                                                    '#8338EC', '#06D6A0', '#118AB2', '#EF476F', '#FFD166', '#073B4C'].map((color) => (
                                                        <button
                                                            key={`primary-${color}`}
                                                            onClick={() => setBrandKit({ ...brandKit, primary_color: color })}
                                                            className={`w-full aspect-square rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-lg border-2 ${brandKit.primary_color === color ? 'border-slate-900 scale-110 shadow-lg ring-2 ring-slate-900/20' : 'border-transparent'}`}
                                                            style={{ backgroundColor: color }}
                                                        />
                                                    ))}
                                            </div>
                                            <div className="mt-3 flex items-center gap-2">
                                                <label className="relative cursor-pointer">
                                                    <input
                                                        type="color"
                                                        value={brandKit.primary_color}
                                                        onChange={(e) => setBrandKit({ ...brandKit, primary_color: e.target.value })}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    />
                                                    <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-colors flex items-center gap-1.5">
                                                        <Plus size={10} />
                                                        Custom
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Secondary Color */}
                                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accent Core</h4>
                                            </div>
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 rounded-xl shadow-lg border-2 border-white transition-colors duration-300" style={{ backgroundColor: brandKit.secondary_color }} />
                                                <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{brandKit.secondary_color}</span>
                                            </div>
                                            <div className="grid grid-cols-6 gap-2">
                                                {['#E94560', '#FF6B6B', '#F77F00', '#FCBF49', '#2EC4B6', '#3A86FF',
                                                    '#8338EC', '#06D6A0', '#118AB2', '#EF476F', '#FFD166', '#073B4C',
                                                    '#1A1A2E', '#16213E', '#0F3460', '#533483', '#2C3333', '#395B64'].map((color) => (
                                                        <button
                                                            key={`secondary-${color}`}
                                                            onClick={() => setBrandKit({ ...brandKit, secondary_color: color })}
                                                            className={`w-full aspect-square rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-lg border-2 ${brandKit.secondary_color === color ? 'border-slate-900 scale-110 shadow-lg ring-2 ring-slate-900/20' : 'border-transparent'}`}
                                                            style={{ backgroundColor: color }}
                                                        />
                                                    ))}
                                            </div>
                                            <div className="mt-3 flex items-center gap-2">
                                                <label className="relative cursor-pointer">
                                                    <input
                                                        type="color"
                                                        value={brandKit.secondary_color}
                                                        onChange={(e) => setBrandKit({ ...brandKit, secondary_color: e.target.value })}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    />
                                                    <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-colors flex items-center gap-1.5">
                                                        <Plus size={10} />
                                                        Custom
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Typography Note */}
                                        <div className="bg-slate-900 rounded-2xl p-5 text-white overflow-hidden relative">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                                            <div className="relative z-10 flex items-center gap-5">
                                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                                                    <Type size={20} className="text-white/50" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xs font-black uppercase tracking-tighter mb-1 leading-none">Dynamic Type Scaling</h3>
                                                    <p className="text-white/40 text-[10px] leading-relaxed font-medium">
                                                        Colors auto-applied to headlines, subtitles, and charts with adaptive contrast.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="library"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        {/* Logo Upload Box */}
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="relative h-44 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center transition-all hover:bg-white hover:border-slate-900 hover:shadow-xl group overflow-hidden cursor-pointer"
                                        >
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                className="hidden"
                                                accept="image/png,image/jpeg,image/svg+xml"
                                            />
                                            {logoPreview ? (
                                                <div className="absolute inset-0 p-6 flex items-center justify-center bg-white">
                                                    <img src={logoPreview} alt="Preview" className="max-h-full max-w-full object-contain" />
                                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <RefreshCw className="text-white animate-spin-slow" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center text-slate-300 group-hover:text-slate-900 transition-colors mb-4 border border-slate-100">
                                                        <Plus size={20} />
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-slate-900">Upload New Identity Asset</p>
                                                    <p className="text-[8px] text-slate-400 mt-2 font-bold uppercase opacity-50">PNG, JPG or SVG • MAX 10MB</p>
                                                </>
                                            )}
                                        </div>

                                        {/* Library Gallery */}
                                        <div>
                                            <div className="flex items-center justify-between mb-4 px-1">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Assets</h4>
                                                <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-900">{brandKit.logos?.length || 0} Assets</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                {brandKit.logos?.map((url, i) => (
                                                    <motion.div
                                                        layoutId={`logo-${i}`}
                                                        key={i}
                                                        onClick={() => setActiveLogo(url)}
                                                        className={`group relative aspect-square rounded-[1.25rem] border-2 transition-all p-3 flex items-center justify-center bg-slate-50 cursor-pointer overflow-hidden ${brandKit.logo_url === url ? 'border-slate-900 bg-white shadow-xl scale-105' : 'border-transparent hover:border-slate-200 hover:bg-white'}`}
                                                    >
                                                        <img
                                                            src={url.startsWith('http') ? `${BACKEND_URL}/logo-proxy?url=${url}` : url}
                                                            alt={`Logo ${i}`}
                                                            className={`max-h-full max-w-full object-contain transition-all duration-700 ${brandKit.logo_url === url ? 'scale-110' : 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'}`}
                                                            onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Invalid+Asset"; }}
                                                        />
                                                        {brandKit.logo_url === url && (
                                                            <div className="absolute top-2 right-2 bg-slate-900 text-white p-1 rounded-md">
                                                                <Check size={10} strokeWidth={4} />
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-x-0 bottom-0 p-2 flex justify-center translate-y-full group-hover:translate-y-0 transition-transform">
                                                            <button
                                                                onClick={(e) => handleDeleteLogo(e, url)}
                                                                className="p-1.5 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                                                            >
                                                                <Trash2 size={10} />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                                {(!brandKit.logos || brandKit.logos.length === 0) && (
                                                    <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Your library is empty</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Save Button */}
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 mt-10 ${saving ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-slate-900 text-white shadow-xl hover:bg-slate-800'}`}
                            >
                                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                {saving ? 'Synchronizing...' : 'Commit Brand Changes'}
                            </button>

                            <AnimatePresence>
                                {successMsg && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center justify-center gap-3 text-emerald-600 text-[10px] font-black uppercase tracking-widest mt-4"
                                    >
                                        <CloudCheck size={16} />
                                        {successMsg}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Production Sync Note */}
                            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                                <AlertCircle className="text-amber-600 shrink-0" size={14} />
                                <p className="text-[10px] text-amber-700/70 font-medium leading-relaxed">
                                    Updates may take up to 30 seconds to propagate. Verify in the live preview before productions.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default BrandKit;
