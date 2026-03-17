import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false, 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0A14] disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-fuchsia-600 hover:bg-fuchsia-700 text-white focus:ring-fuchsia-500",
    secondary: "bg-[#1C1C26] hover:bg-[#2A2A35] text-white border border-[#2A2A35] focus:ring-[#444455]",
    ghost: "bg-transparent hover:bg-[#1C1C26] text-gray-300 hover:text-white focus:ring-[#444455]",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 focus:ring-red-500",
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
