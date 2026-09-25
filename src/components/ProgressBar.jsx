import React from 'react';
import { formatPercent, formatPercentText } from '../lib/formatPercent.js';

export function ProgressBar({ value = 0, className = '', color = '', label, tone = 'primary', compact = false }) {
  const progress = Math.min(100, Math.max(0, Number(value) || 0));

  return (
    <div className={className}>
      {label && (
        <div className="flex items-center justify-between text-body-sm mb-1.5">
          <span>{formatPercentText(label)}</span>
          <strong className="text-primary">{formatPercent(progress)}</strong>
        </div>
      )}
      <div
        className={`water-progress ${compact ? 'water-progress--compact' : ''}`}
        data-tone={tone}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div className={`water-progress__fill ${color}`} style={{ width: `${progress}%` }} aria-hidden="true">
          <span className="water-progress__wave water-progress__wave--back" />
          <span className="water-progress__wave" />
        </div>
      </div>
    </div>
  );
}
