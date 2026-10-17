import React from 'react';
import { createPortal } from 'react-dom';

export function TabAction({ target, children, className }) {
  if (target) return createPortal(children, target);
  return className ? <div className={className}>{children}</div> : children;
}
