import React from 'react';

export function Breadcrumbs({ items = ['Tổng quan'], current }) {
  return (
    <nav className="flex items-center gap-2 text-body-md text-[#64748B] min-w-0" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <React.Fragment key={`${item}-${index}`}>
          {index > 0 && <span className="text-[#CBD5E1]">/</span>}
          <span className={index === items.length - 1 && !current ? 'text-primary font-bold truncate' : 'truncate'}>{item}</span>
        </React.Fragment>
      ))}
      {current && (
        <>
          <span className="text-[#CBD5E1]">/</span>
          <span className="text-primary font-bold truncate">{current}</span>
        </>
      )}
    </nav>
  );
}
