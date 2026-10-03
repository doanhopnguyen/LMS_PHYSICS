import React, { forwardRef } from 'react';

const variants = {
  primary: 'bg-primary-container text-white hover:bg-[#C41E1A]',
  secondary: 'bg-white text-[#1F2937] border border-[#CBD5E1] hover:bg-[#F1F5F9] hover:border-primary',
  ghost: 'text-primary hover:bg-[#FEF2F2]',
  dark: 'bg-[#0F172A] text-white hover:bg-[#1E293B]',
};

export const Button = forwardRef(function Button(
  { children, variant = 'primary', icon, className = '', type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={`
    inline-flex shrink-0 items-center justify-center gap-1.5 h-9 px-3 rounded-full whitespace-nowrap text-body-md font-body-md-medium transition-all active:scale-[0.98]
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
    disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100
    ${variants[variant] ?? variants.primary}
    ${className}
      `}
      type={type}
      {...props}
    >
      {icon && <span className="material-symbols-outlined text-base">{icon}</span>}
      {children}
    </button>
  );
});
