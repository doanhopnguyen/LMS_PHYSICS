import React, { createContext, useContext, useState } from 'react';

export const PageHeaderContext = createContext(null);

export function PageHeaderProvider({ children, enabled = true }) {
  const [target, setTarget] = useState(null);
  return <PageHeaderContext.Provider value={{ target, setTarget, enabled }}>{children}</PageHeaderContext.Provider>;
}

export function PageHeaderSlot() {
  const context = useContext(PageHeaderContext);
  return context && context.enabled !== false ? <div className="page-header-slot" ref={context.setTarget} /> : null;
}
