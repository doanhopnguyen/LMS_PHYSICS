import React, { createContext, useContext, useState } from 'react';

export const PageHeaderContext = createContext(null);

export function PageHeaderProvider({ children }) {
  const [target, setTarget] = useState(null);
  return <PageHeaderContext.Provider value={{ target, setTarget }}>{children}</PageHeaderContext.Provider>;
}

export function PageHeaderSlot() {
  const context = useContext(PageHeaderContext);
  return context ? <div className="page-header-slot" ref={context.setTarget} /> : null;
}
