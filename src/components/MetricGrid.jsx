import React from 'react';
import { StatCard } from './StatCard.jsx';

export function MetricGrid({ items, columns = 4 }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${columns === 4 ? 'lg:grid-cols-4' : ''} gap-4`}>
      {items.map((item) => (
        <StatCard key={item.label} {...item} />
      ))}
    </div>
  );
}
