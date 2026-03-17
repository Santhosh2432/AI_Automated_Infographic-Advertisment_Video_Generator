import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Video,
  Settings,
  Sparkles,
  Menu,
  X
} from 'lucide-react';

// Modules
import Home from './components/Home';
import UploadAndProcess from './components/UploadAndProcess';
import Results from './components/Results';
import Authentication from './components/Authentication';
import Explore from './components/Explore';
import About from './components/About';
import Contact from './components/Contact';
import TabButton from './components/TabButton';
import Profile from './components/Profile';
import BrandKit from './components/BrandKit';
import { GenerationProvider } from './context/GenerationContext';
import { BACKEND_URL } from './constants';
import Logo from './assets/app-logo.png';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [videoData, setVideoData] = useState(null);
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check for OAuth tokens in URL
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlUser = params.get('user');

    if (urlToken && urlUser) {
      try {
        const decodedUser = JSON.parse(atob(urlUser));
        localStorage.setItem('token', urlToken);
        localStorage.setItem('user', JSON.stringify(decodedUser));
        setUser(decodedUser);
        setActiveTab('home');
        // Clean up URL
        window.history.replaceState({}, document.title, "/");
      } catch (e) {
        console.error("Failed to decode OAuth user", e);
      }
    } else {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (savedUser && token) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
    }
  }, []);

  const handleComplete = (data) => {
    setVideoData(data);
    setActiveTab('results');
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setActiveTab('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setActiveTab('home');
  };

  return (
    <GenerationProvider onComplete={handleComplete}>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
        {/* Navbar */}
      <nav className="sticky top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl z-[100] px-4 sm:px-12 flex items-center justify-between border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 lg:gap-12">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="flex items-center justify-center transition-transform group-hover:scale-110">
              <img src={Logo} alt="Logo" className="w-[32px] h-[32px] object-contain" />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">
              <span className="hidden sm:inline">AI Automated Infographic </span>
              <span className="sm:text-slate-600 sm:inline hidden"> Video Generator</span>
              <span className="sm:hidden">Gen AI Studio</span>
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'home' ? 'text-slate-900 bg-slate-100' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'explore' ? 'text-slate-900 bg-slate-100' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              Explore
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'about' ? 'text-slate-900 bg-slate-100' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'contact' ? 'text-slate-900 bg-slate-100' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              Contact
            </button>
            <button
              onClick={() => setActiveTab('process')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'process' ? 'text-slate-900 bg-slate-100' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              Generate
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'results' ? 'text-slate-900 bg-slate-100' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              Results
            </button>
            <button
              onClick={() => setActiveTab('brandkit')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'brandkit' ? 'text-slate-900 bg-slate-100' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              Brand Kit
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end cursor-pointer group" onClick={() => setActiveTab('profile')}>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 transition-colors">Welcome</span>
                <span className="text-xs font-bold text-slate-900 group-hover:text-slate-600 transition-colors">{user.name}</span>
              </div>
              <button
                onClick={() => setActiveTab('profile')}
                className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-slate-200 transition-all shadow-sm"
                title="View Profile"
              >
                <div className="w-7 h-7 rounded-md bg-slate-200 overflow-hidden">
                  <img src={user.avatar_url ? `${BACKEND_URL}${user.avatar_url}` : `https://i.pravatar.cc/100?u=${user.email}`} alt="avatar" className="w-full h-full object-cover" />
                </div>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('authentication')}
              className={`h-9 px-5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-md ${activeTab === 'authentication' ? 'bg-slate-900 text-white shadow-slate-900/20' : 'bg-slate-100 text-slate-900 hover:bg-slate-900 hover:text-white'}`}
            >
              Sign In
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 border border-slate-200 text-slate-900 shadow-sm"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden fixed top-16 left-0 right-0 bg-white border-b border-slate-200 z-50 overflow-hidden"
          >
            <div className="px-6 py-8 flex flex-col gap-4">
              {[
                { id: 'home', label: 'Home' },
                { id: 'explore', label: 'Explore' },
                { id: 'about', label: 'About' },
                { id: 'contact', label: 'Contact' },
                { id: 'process', label: 'Generate' },
                { id: 'results', label: 'Results' },
                { id: 'brandkit', label: 'Brand Kit' },
                { id: 'profile', label: 'Profile' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-6 py-4 rounded-2xl text-lg font-black uppercase tracking-widest transition-all ${activeTab === item.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  {item.label}
                </button>
              ))}
              {user && (
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-6 py-4 rounded-2xl text-lg font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all border border-red-100"
                >
                  Log Out
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="min-h-screen pt-4">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Home onStart={() => setActiveTab('process')} onExplore={() => setActiveTab('explore')} />
            </motion.div>
          )}
          {activeTab === 'explore' && (
            <motion.div
              key="explore"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              <Explore />
            </motion.div>
          )}
          {activeTab === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              <About />
            </motion.div>
          )}
          {activeTab === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              <Contact onGenerate={() => setActiveTab('process')} />
            </motion.div>
          )}
          {activeTab === 'authentication' && (
            <motion.div
              key="authentication"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              <Authentication onLoginSuccess={handleLoginSuccess} />
            </motion.div>
          )}
          {activeTab === 'process' && (
            <motion.div
              key="process"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <UploadAndProcess />
            </motion.div>
          )}
          {activeTab === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Results data={videoData} />
            </motion.div>
          )}
          {activeTab === 'brandkit' && (
            <motion.div
              key="brandkit"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              <BrandKit user={user} />
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              <Profile user={user} onLogout={handleLogout} onUserUpdate={(updatedUser) => setUser(updatedUser)} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-24 px-6 sm:px-12 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 lg:col-span-2">
              <div className="flex items-center gap-2 mb-8">
                <div className="flex items-center justify-center">
                  <img src={Logo} alt="Logo" className="w-[24px] h-[24px] object-contain" />
                </div>
                <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">AI Automated <span className="text-slate-600">Infographic</span> Video Generator</span>
              </div>
              <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs mb-10">
                The next generation of content automation. Synthesize reports, docs, and research papers into infographic visuals in seconds.
              </p>

              <div className="flex gap-4">
                {[
                  { id: 'twitter', label: 'Twitter' },
                  { id: 'facebook', label: 'Facebook' },
                  { id: 'linkedin', label: 'LinkedIn' },
                  { id: 'instagram', label: 'Instagram' }
                ].map((s) => (
                  <div
                    key={s.id}
                    title={s.label}
                    className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] uppercase hover:bg-slate-900 hover:border-slate-900 hover:text-white hover:-translate-y-1 transition-all cursor-pointer text-slate-500 font-black shadow-sm group"
                  >
                    {s.id.slice(0, 2)}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 col-span-1 lg:col-span-2">
              <div>
                <h4 className="text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] mb-10">Product</h4>
                <div className="flex flex-col gap-5 text-slate-500 text-sm font-bold">
                  <button onClick={() => setActiveTab('explore')} className="text-left hover:text-slate-900 transition-colors">Infographic</button>
                  <button onClick={() => setActiveTab('about')} className="text-left hover:text-slate-900 transition-colors">About</button>
                  <button onClick={() => setActiveTab('contact')} className="text-left hover:text-slate-900 transition-colors">Contact</button>
                  <button onClick={() => setActiveTab('results')} className="text-left hover:text-slate-900 transition-colors">Results</button>
                  <button onClick={() => setActiveTab('explore')} className="text-left hover:text-slate-900 transition-colors">Documentation</button>
                </div>
              </div>

              <div>
                <h4 className="text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] mb-10">Resources</h4>
                <div className="flex flex-col gap-5 text-slate-500 text-sm font-bold">
                  <button onClick={() => setActiveTab('explore')} className="text-left hover:text-slate-900 transition-colors">How It Works</button>
                  <button className="text-left hover:text-slate-900 transition-colors">API Overview</button>
                  <button className="text-left hover:text-slate-900 transition-colors">FAQ</button>
                  <button onClick={() => setActiveTab('explore')} className="text-left hover:text-slate-900 transition-colors">Use Cases</button>
                </div>
              </div>

              <div className="col-span-2 lg:col-span-1">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 shadow-xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-3">Quick Start</p>
                    <p className="text-sm font-black text-slate-900 mb-5 leading-snug">Ready to create your first video?</p>
                    <button
                      onClick={() => setActiveTab('authentication')}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                    >
                      Get Started
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] order-2 md:order-1">
              © 2026 AI Automated Infographic Video Generator. All rights reserved.
            </p>
            <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400 order-1 md:order-2">
              <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </GenerationProvider>
  );
}
