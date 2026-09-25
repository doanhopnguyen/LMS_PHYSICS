import React, { useState } from 'react';

export function Tabs({ items, children, activeId, onChange, actions }) {
  const [internalActive, setInternalActive] = useState(items[0]?.id);
  const active = activeId ?? internalActive;
  const selectTab = (id) => {
    if (activeId === undefined) setInternalActive(id);
    onChange?.(id);
  };
  return (
    <div>
      <div className="flex items-center border-b border-[#E2E8F0]">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto" role="tablist">
          {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active === item.id}
            onClick={() => selectTab(item.id)}
            className={`px-4 py-3 text-body-md whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${active === item.id ? 'text-primary font-semibold' : 'text-[#64748B] hover:text-primary'}`}
          >
            <span className={`relative inline-flex ${active === item.id ? 'after:absolute after:-bottom-3 after:left-0 after:h-0.5 after:w-full after:bg-primary' : ''}`}>{item.label}</span>
          </button>
          ))}
        </div>
        {actions && <div className="ml-3 flex shrink-0 items-center gap-2 py-1">{actions}</div>}
      </div>
      {children ? children(active) : null}
    </div>
  );
}
