import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    Mail,
    Shield,
    Settings,
    LogOut,
    Clock,
    Calendar,
    Video,
    Camera,
    RefreshCw,
    Trash2
} from 'lucide-react';
import Logo from '../assets/app-logo.png';

import axios from 'axios';
import { BACKEND_URL } from '../constants';

const Profile = ({ user, onLogout, onUserUpdate }) => {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState({
        total_videos: 0,
        generation_time: '0m',
        member_since: '...'
    });
    const fetchCalled = useRef(false);

    useEffect(() => {
        const fetchUserData = async () => {
            if (fetchCalled.current) return;
            fetchCalled.current = true;

            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const [statsRes, historyRes] = await Promise.all([
                    axios.get(`${BACKEND_URL}/user/stats`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${BACKEND_URL}/user/videos`, { headers: { Authorization: `Bearer ${token}` } })
                ]).catch(err => {
                    console.error("Fetch Data Failed:", err);
                    return [null, null];
                });

                if (statsRes && statsRes.data) {
                    setStats({
                        total_videos: statsRes.data.total_videos ?? 0,
                        generation_time: statsRes.data.generation_time ?? '0m',
                        member_since: statsRes.data.member_since ?? '...'
                    });
                }

                if (historyRes && Array.isArray(historyRes.data)) {
                    setHistory(historyRes.data);
                }
            } catch (error) {
                console.error("Profile Fetch Exception:", error);
            }
        };

        if (user) {
            fetchUserData();
        }
    }, [user]);

    const handleAvatarClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${BACKEND_URL}/user/avatar`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data && response.data.avatar_url) {
                const updatedUser = { ...user, avatar_url: response.data.avatar_url };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                if (onUserUpdate) {
                    onUserUpdate(updatedUser);
                }
            }
        } catch (error) {
            console.error("Avatar Upload Failed:", error);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (videoId) => {
        if (!window.confirm("Are you sure you want to delete this video? This will remove it from both history and storage.")) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${BACKEND_URL}/user/videos/${videoId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Refresh history and stats
            setHistory(prev => prev.filter(v => v._id !== videoId));
            
            // Re-fetch stats to get accurate remaining generation time/count
            const statsRes = await axios.get(`${BACKEND_URL}/user/stats`, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            if (statsRes.data) {
                setStats({
                    total_videos: statsRes.data.total_videos ?? 0,
                    generation_time: statsRes.data.generation_time ?? '0m',
                    member_since: statsRes.data.member_since ?? '...'
                });
            }
        } catch (error) {
            console.error("Deletion failed:", error);
            alert("Failed to delete video. Please try again.");
        }
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center p-20 text-slate-400 font-bold uppercase tracking-widest text-xs">
                Not Authenticated
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden mb-8"
            >
                <div className="h-32 bg-slate-900 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 opacity-50" />
                </div>

                <div className="px-6 sm:px-10 pb-10 relative">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end text-center sm:text-left gap-6 -mt-16">
                        <div
                            className="w-32 h-32 rounded-[2rem] bg-white p-2 shadow-2xl relative group cursor-pointer overflow-hidden border border-slate-100"
                            onClick={handleAvatarClick}
                        >
                            <div className="w-full h-full rounded-[1.5rem] bg-slate-100 overflow-hidden flex items-center justify-center relative">
                                <img
                                    src={user?.avatar_url ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${BACKEND_URL}${user.avatar_url}`) : `https://i.pravatar.cc/150?u=${user?.email || 'user'}`}
                                    alt="Avatar"
                                    className={`w-full h-full object-cover transition-all ${uploading ? 'opacity-50' : 'group-hover:scale-110'}`}
                                    onError={(e) => { e.target.src = `https://i.pravatar.cc/150?u=${user?.email || 'user'}`; }}
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Camera className="text-white" size={24} />
                                </div>
                                {uploading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 text-slate-900">
                                        <RefreshCw size={24} className="animate-spin" />
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                        </div>

                        <div className="flex-1 mb-2">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
                                {user?.fullName || user?.name || "Member Profile"}
                            </h1>
                            <p className="text-slate-500 font-bold flex items-center gap-2 justify-center sm:justify-start">
                                <Mail size={14} />
                                {user?.email || "No email provided"}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 mb-2 w-full sm:w-auto">
                            <button
                                onClick={onLogout}
                                className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all border border-red-100 flex items-center justify-center gap-2"
                            >
                                <LogOut size={14} />
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                    { label: 'Total Videos', value: String(stats?.total_videos ?? 0), icon: Video, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Generation Time', value: stats?.generation_time || '0m', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Member Since', value: stats?.member_since || '...', icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl group hover:-translate-y-1 transition-all">
                        <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-6`}>
                            {stat.icon && <stat.icon size={24} />}
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                            <Shield size={20} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Account Security</h3>
                    </div>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between py-4 border-b border-slate-100">
                            <div>
                                <p className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Password</p>
                                <p className="text-sm text-slate-500 font-bold">••••••••••••</p>
                            </div>
                            <button className="text-[10px] font-black text-slate-900 uppercase tracking-widest hover:text-slate-500 transition-colors">Change</button>
                        </div>
                        <div className="flex items-center justify-between py-4 border-b border-slate-100">
                            <div>
                                <p className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Two-Factor Auth</p>
                                <p className="text-sm text-slate-500 font-bold">Enabled</p>
                            </div>
                            <button className="text-[10px] font-black text-slate-900 uppercase tracking-widest hover:text-slate-500 transition-colors">Manage</button>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 border border-slate-200">
                            <Settings size={20} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Preferences</h3>
                    </div>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between py-4 border-b border-slate-100">
                            <div>
                                <p className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Default Model</p>
                                <p className="text-sm text-slate-500 font-bold">GPT-4o mini</p>
                            </div>
                            <button className="text-[10px] font-black text-slate-900 uppercase tracking-widest hover:text-slate-500 transition-colors">Edit</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-12 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 border border-slate-200">
                        <Video size={20} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Video History</h3>
                </div>

                <div className="space-y-4">
                    {history.length > 0 ? (
                        history.map((vid, idx) => (
                            <div key={vid?._id || idx} className="group p-6 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-10 flex items-center justify-center shrink-0">
                                        <img src={Logo} alt="Play" className="w-[28px] h-[28px] object-contain" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{vid?.type === 'infographic' ? '🎬 Infographic' : '👤 Avatar'}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{vid?.created_at ? new Date(vid.created_at).toLocaleDateString() : 'Unknown Date'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <a
                                        href={vid?.video_url ? (vid.video_url.startsWith('http') ? vid.video_url : `${BACKEND_URL}${vid.video_url}`) : '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-6 py-2 bg-white border border-slate-200 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all"
                                    >
                                        Play
                                    </a>
                                    <button
                                        onClick={() => handleDelete(vid._id)}
                                        className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100"
                                        title="Delete Video"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No productions initialized yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
