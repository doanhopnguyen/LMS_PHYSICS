import { useLayoutEffect, useRef } from 'react';

// Scroll only the message list, never the surrounding page or input focus.
export function useChatAutoScroll(messages, active = true) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (!active || !ref.current) return;
    const container = ref.current;
    container.scrollTop = container.scrollHeight;
    const frame = requestAnimationFrame(() => { container.scrollTop = container.scrollHeight; });
    return () => cancelAnimationFrame(frame);
  }, [messages, active]);
  return ref;
}
