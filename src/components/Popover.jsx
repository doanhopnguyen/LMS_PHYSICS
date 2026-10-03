import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
const usePositionEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

// Render outside scrolling cards/forms so a picker never gets clipped.
export function Popover({ anchorRef, open, onClose, children, className = '', ...props }) {
  const panelRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0, visibility: 'hidden' });
  usePositionEffect(() => {
    if (!open) return;
    const place = () => {
      const anchor = anchorRef.current?.getBoundingClientRect();
      const panel = panelRef.current;
      if (!anchor || !panel) return;
      const viewport = window.visualViewport;
      const width = viewport?.width || window.innerWidth;
      const height = viewport?.height || window.innerHeight;
      const leftEdge = viewport?.offsetLeft || 0;
      const topEdge = viewport?.offsetTop || 0;
      const margin = 12;
      panel.style.maxHeight = `${height - margin * 2}px`;
      const size = panel.getBoundingClientRect();
      const below = anchor.bottom + 6;
      const top = below + size.height <= topEdge + height - margin ? below : anchor.top - size.height - 6;
      setPosition({
        top: Math.max(topEdge + margin, Math.min(top, topEdge + height - size.height - margin)),
        left: Math.max(leftEdge + margin, Math.min(anchor.left, leftEdge + width - size.width - margin)),
        visibility: 'visible',
      });
    };
    const outside = (event) => {
      if (!panelRef.current?.contains(event.target) && !anchorRef.current?.contains(event.target)) onClose();
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(panelRef.current);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    window.visualViewport?.addEventListener('resize', place);
    window.visualViewport?.addEventListener('scroll', place);
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('focusin', outside, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      window.visualViewport?.removeEventListener('resize', place);
      window.visualViewport?.removeEventListener('scroll', place);
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('focusin', outside, true);
    };
  }, [open, anchorRef, onClose]);
  if (!open) return null;
  return createPortal(
    <div
      ref={panelRef}
      className={`picker-popover ${className}`}
      style={position}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          onClose(true);
        }
        if (event.key === 'Tab') {
          event.stopPropagation();
          const nodes = [
            ...panelRef.current.querySelectorAll(
              'button:not(:disabled):not([tabindex="-1"]),input:not(:disabled),[tabindex="0"]'
            ),
          ];
          if (
            !nodes.length ||
            (!event.shiftKey && document.activeElement === nodes.at(-1)) ||
            (event.shiftKey && document.activeElement === nodes[0])
          ) {
            event.preventDefault();
            onClose(true);
          }
        }
      }}
      {...props}
    >
      {children}
    </div>,
    document.body
  );
}
