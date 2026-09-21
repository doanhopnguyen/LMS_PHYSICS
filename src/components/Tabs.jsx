import React, { useState } from 'react';

export function Tabs({ items, children }) {
  const [active, setActive] = useState(items[0]?.id);
  return (
    <div>
      <div className="flex items-center gap-1 border-b border-[#E2E8F0] overflow-x-auto">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`px-4 py-3 text-body-md whitespace-nowrap border-b-2 transition-colors ${active === item.id ? 'border-primary text-primary font-semibold' : 'border-transparent text-[#64748B] hover:text-primary'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {children ? children(active) : null}
    </div>
  );
}
