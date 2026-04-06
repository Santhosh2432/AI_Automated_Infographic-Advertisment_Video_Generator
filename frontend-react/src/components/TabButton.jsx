import React from 'react';
import Button from './ui/Button';

const TabButton = ({ active, onClick, icon: Icon, label }) => (
    <Button
        onClick={onClick}
        variant={active ? 'primary' : 'ghost'}
        className={`gap-2 rounded-xl transition-all duration-300 ${active
            ? 'shadow-lg bg-slate-900 hover:bg-slate-800'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
    >
        <Icon size={18} />
        <span>{label}</span>
    </Button>
);

export default TabButton;
