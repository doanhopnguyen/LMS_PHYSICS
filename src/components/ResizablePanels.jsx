import React, { Children, useEffect, useId, useRef, useState } from 'react';
import './ResizablePanels.css';

export function ResizablePanels({
  children,
  leftWidth,
  onLeftWidthChange,
  minLeft = 260,
  minRight = 380,
  defaultWidth = 340,
  className = '',
}) {
  const container = useRef(null);
  const drag = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const id = useId();
  const [left, right] = Children.toArray(children);
  const maximum = containerWidth
    ? Math.max(minLeft, containerWidth - minRight - 16)
    : Math.max(defaultWidth, leftWidth, minLeft);
  const clamp = (value) => Math.min(maximum, Math.max(minLeft, value));
  const width = clamp(leftWidth);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => setContainerWidth(entries[0].contentRect.width));
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  function finish(event) {
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  return (
    <div
      ref={container}
      className={`resizable-panels ${dragging ? 'is-resizing' : ''} ${className}`}
      style={{ '--panel-left-width': `${width}px` }}
    >
      <div id={`${id}-left`} className="resizable-panels-left">
        {left}
      </div>
      <div
        role="separator"
        tabIndex={0}
        aria-label="Điều chỉnh độ rộng cây chương trình"
        aria-orientation="vertical"
        aria-controls={`${id}-left ${id}-right`}
        aria-valuemin={minLeft}
        aria-valuemax={maximum}
        aria-valuenow={Math.round(width)}
        aria-valuetext={`Cây chương trình rộng ${Math.round(width)} pixel`}
        className="resizable-panels-handle"
        title="Kéo để điều chỉnh hai khung. Nhấn đúp để đặt lại."
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.focus();
          drag.current = {
            id: event.pointerId,
            offset: event.clientX - container.current.getBoundingClientRect().left - width,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
        }}
        onPointerMove={(event) => {
          if (drag.current?.id !== event.pointerId) return;
          onLeftWidthChange(
            clamp(event.clientX - container.current.getBoundingClientRect().left - drag.current.offset)
          );
        }}
        onPointerUp={finish}
        onPointerCancel={finish}
        onLostPointerCapture={() => {
          drag.current = null;
          setDragging(false);
        }}
        onDoubleClick={() => onLeftWidthChange(clamp(defaultWidth))}
        onKeyDown={(event) => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          const delta = event.shiftKey ? 40 : 16;
          onLeftWidthChange(
            clamp(
              event.key === 'Home'
                ? minLeft
                : event.key === 'End'
                  ? maximum
                  : width + (event.key === 'ArrowLeft' ? -delta : delta)
            )
          );
        }}
      >
        <span aria-hidden="true" />
      </div>
      <div id={`${id}-right`} className="resizable-panels-right">
        {right}
      </div>
    </div>
  );
}
