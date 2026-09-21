import React from 'react';

const variants = {
  primary: 'bg-primary-container text-white hover:bg-[#C41E1A]',
  secondary: 'bg-white text-[#1F2937] border border-[#CBD5E1] hover:bg-[#F1F5F9] hover:border-primary',
  ghost: 'text-primary hover:bg-[#FEF2F2]',
  dark: 'bg-[#0F172A] text-white hover:bg-[#1E293B]',
};

export function Button({ children, variant = 'primary', icon, className = '', ...props }) {
  return (
    <button
      className={`
    inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-full font-body-md-medium transition-all active:scale-[0.98]
    ${variants[variant] ?? variants.primary}
    ${className}
  `}
      {...props}
    >
      {icon && <span className="material-symbols-outlined text-base">{icon}</span>}
      {children}
    </button>
  );
}
