import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export function ActionMenu({ label, items }) {
  const id = useId();
  const trigger = useRef(null);
  const panel = useRef(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const close = (focus = false) => { setOpen(false); if (focus) trigger.current?.focus(); };

  useEffect(() => {
    const otherMenu = (event) => { if (event.detail !== id) setOpen(false); };
    window.addEventListener('ptit-action-menu-open', otherMenu);
    return () => window.removeEventListener('ptit-action-menu-open', otherMenu);
  }, [id]);

  useLayoutEffect(() => {
    if (!open) return;
    const anchor = trigger.current.getBoundingClientRect();
    const box = panel.current.getBoundingClientRect();
    const below = window.innerHeight - anchor.bottom - 8;
    const above = anchor.top - 8;
    const top = below >= box.height || below >= above ? anchor.bottom + 6 : anchor.top - box.height - 6;
    setPosition({ top: Math.max(8, Math.min(top, window.innerHeight - box.height - 8)), left: Math.max(8, Math.min(anchor.right - box.width, window.innerWidth - box.width - 8)) });
  }, [open]);

  useEffect(() => {
    if (open && position) panel.current?.querySelector('[role="menuitem"]')?.focus({ preventScroll: true });
  }, [open, position]);

  useEffect(() => {
    if (!open) return;
    const outside = (event) => {
      if (!trigger.current?.contains(event.target) && !panel.current?.contains(event.target)) setOpen(false);
    };
    const scroll = (event) => { if (!panel.current?.contains(event.target)) setOpen(false); };
    const resize = () => setOpen(false);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    window.addEventListener('scroll', scroll, true);
    window.addEventListener('resize', resize);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
      window.removeEventListener('scroll', scroll, true);
      window.removeEventListener('resize', resize);
    };
  }, [open]);

  const toggle = () => {
    if (open) { close(); return; }
    window.dispatchEvent(new CustomEvent('ptit-action-menu-open', { detail: id }));
    setPosition(null); setOpen(true);
  };
  const keyDown = (event) => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
    const buttons = [...panel.current.querySelectorAll('[role="menuitem"]')];
    const index = buttons.indexOf(document.activeElement);
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next]?.focus();
    }
  };
  return <>
    <button ref={trigger} type="button" className="row-action-trigger" aria-label={label} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined} onClick={toggle} onKeyDown={(event) => { if (event.key === 'ArrowDown' && !open) { event.preventDefault(); toggle(); } }}><span className="material-symbols-outlined" aria-hidden="true">more_vert</span></button>
    {open && createPortal(<div ref={panel} id={id} className="row-action-menu" role="menu" aria-label={label} onKeyDown={keyDown} style={{ top: position?.top ?? 0, left: position?.left ?? 0, visibility: position ? 'visible' : 'hidden' }}>
      {items.filter(Boolean).map((item) => <button key={item.label} type="button" role="menuitem" className={item.danger ? 'is-danger' : ''} onClick={() => { close(true); item.onSelect(); }}>{item.label}</button>)}
    </div>, document.body)}
  </>;
}
