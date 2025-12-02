import React from 'react';

export const Button = ({ className = '', variant = 'primary', ...props }) => {
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95";
  const variants = {
    primary: "bg-gradient-to-r from-brand-600 to-indigo-700 hover:from-brand-500 hover:to-indigo-600 text-white shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40",
    secondary: "bg-white dark:bg-cosmic-800 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 hover:border-brand-500/50",
    ghost: "text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
  };
  return <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props} />;
};

export const Input = ({ className = '', ...props }) => (
  <input 
    className={`w-full bg-white dark:bg-cosmic-900/50 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all ${className}`}
    {...props}
  />
);

export const Card = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-cosmic-900/60 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-none ${className}`}>
    {children}
  </div>
);

export const Badge = ({ children, type = 'info' }) => {
  const colors = {
    success: "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20",
    warning: "bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20",
    info: "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
    brand: "bg-brand-100 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 border-brand-200 dark:border-brand-500/20"
  };
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${colors[type] || colors.info}`}>
      {children}
    </span>
  );
};
