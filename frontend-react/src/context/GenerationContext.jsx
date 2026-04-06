import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../constants';

const GenerationContext = createContext(null);

export const useGeneration = () => {
    const context = useContext(GenerationContext);
    if (!context) {
        throw new Error('useGeneration must be used within a GenerationProvider');
    }
    return context;
};

export const GenerationProvider = ({ children, onComplete }) => {
    const [file, setFile] = useState(null);
    const [mode, setMode] = useState('infographic');
    const [status, setStatus] = useState('idle'); // idle, uploading, processing, complete, error
    const [progress, setProgress] = useState(0);
    const [log, setLog] = useState('');
    const [brandKit, setBrandKit] = useState(null);
    const [selectedLogoUrl, setSelectedLogoUrl] = useState(null);

    useEffect(() => {
        const fetchBrandKit = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const response = await axios.get(`${BACKEND_URL}/user/brand-kit`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBrandKit(response.data);
                if (response.data.logo_url) {
                    setSelectedLogoUrl(response.data.logo_url);
                }
            } catch (error) {
                console.error("Failed to fetch brand kit for selection", error);
            }
        };
        fetchBrandKit();
    }, []);

    const handleGenerate = async () => {
        if (!file) return;

        setStatus('processing');
        setProgress(10);
        setLog('Parsing document with Azure AI...');

        const formData = new FormData();
        formData.append('file', file);
        if (selectedLogoUrl) {
            formData.append('logo_url', selectedLogoUrl);
        }

        const endpoint = mode === 'infographic' ? '/process-infographic' : '/process';

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${BACKEND_URL}${endpoint}`, formData, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    if (percentCompleted < 100) {
                        setLog(`Uploading: ${percentCompleted}%`);
                    } else {
                        setLog('Planning long-form animated scenes...');
                    }
                },
                timeout: 1800000 // 30 minutes for long-form renders
            });

            if (response.status === 200) {
                setProgress(90);
                setLog('Finalizing long-form video synthesis...');
                setTimeout(() => {
                    setProgress(100);
                    setStatus('complete');
                    onComplete(response.data);
                }, 1500);
            }
        } catch (err) {
            console.error(err);
            setStatus('error');
            setLog('Error connecting to Azure engineering layer.');
        }
    };

    const value = {
        file,
        setFile,
        mode,
        setMode,
        status,
        setStatus,
        progress,
        setProgress,
        log,
        setLog,
        brandKit,
        setBrandKit,
        selectedLogoUrl,
        setSelectedLogoUrl,
        handleGenerate
    };

    return (
        <GenerationContext.Provider value={value}>
            {children}
        </GenerationContext.Provider>
    );
};
