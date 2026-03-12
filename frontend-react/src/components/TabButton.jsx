import React from 'react';

const TabButton = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${active
            ? 'bg-slate-900 text-white shadow-lg'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
    >
        <Icon size={18} />
        <span>{label}</span>
    </button>
);

export default TabButton;
