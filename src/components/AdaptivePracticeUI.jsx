import React from 'react';
import { Button } from './Button.jsx';

const paths = {
  psychology: 'M9 18v3h8v-6a7 7 0 1 0-13-4l-1 3h3v4h3M10 8l2-2 2 2-2 2-2-2z',
  refresh: 'M20 7v5h-5M4 17v-5h5M5.6 8a7 7 0 0 1 11.5-3L20 8M4 16l2.9 3A7 7 0 0 0 18.4 16',
  history: 'M3 4v5h5M3.5 9a9 9 0 1 1-.1 6M12 7v5l3 2',
  play_arrow: 'M8 5v14l11-7L8 5z',
  arrow_forward: 'M4 12h16M13 5l7 7-7 7',
  arrow_back: 'M20 12H4M11 5l-7 7 7 7',
  chevron_left: 'M15 5l-7 7 7 7',
  chevron_right: 'M9 5l7 7-7 7',
  task_alt: 'M21 11v1a9 9 0 1 1-5.3-8.2M8 11l4 4 9-10',
  school: 'M2 9l10-6 10 6-10 6L2 9zM6 12v6l6 3 6-3v-6M22 9v8',
  auto_stories: 'M12 6c-3-3-7-3-10-2v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-7-1-10 2zM12 6v15',
};

export function AdaptivePracticeIcon({ name }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d={paths[name] || paths.psychology} />
    </svg>
  );
}

// Keep the shared button styling; icons also render while web fonts are loading.
export function AdaptivePracticeButton({ icon, children, ...props }) {
  return (
    <Button {...props}>
      {icon && <AdaptivePracticeIcon name={icon} />}
      {children}
    </Button>
  );
}
