import React from 'react';

export function Card({ children, className = '', as: Component = 'section' }) {
  return <Component className={`bg-surface-container-lowest rounded-[16px] border border-[#E2E8F0] shadow-sm ${className}`}>{children}</Component>;
}
