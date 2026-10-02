import React from 'react';

export function PageContainer({ children, className = '' }) {
  return <main className={`page-container p-3 md:p-5 lg:p-6 max-w-[1440px] w-full mx-auto space-y-5 ${className}`}>{children}</main>;
}
