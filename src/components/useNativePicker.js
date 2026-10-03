import { useCallback, useEffect, useRef, useState } from 'react';

// Keep a real named form control: native validation, refs and FormData stay intact.
export function useNativePicker(value, defaultValue, forwardedRef, kind = 'input') {
  const nativeRef = useRef(null);
  const triggerRef = useRef(null);
  const [current, setCurrent] = useState(value ?? defaultValue ?? '');
  const [open, setOpen] = useState(false);
  const assignRef = useCallback(
    (node) => {
      nativeRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef]
  );
  useEffect(() => {
    setCurrent(nativeRef.current?.value ?? '');
  }, [value, defaultValue]);
  useEffect(() => {
    const native = nativeRef.current;
    const sync = () => setCurrent(native.value);
    const reset = () => requestAnimationFrame(sync);
    native?.addEventListener('change', sync);
    native?.addEventListener('input', sync);
    native?.form?.addEventListener('reset', reset);
    return () => {
      native?.removeEventListener('change', sync);
      native?.removeEventListener('input', sync);
      native?.form?.removeEventListener('reset', reset);
    };
  }, []);
  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true });
  }, []);
  const commit = (next) => {
    const native = nativeRef.current;
    const prototype = kind === 'select' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(native, next);
    if (kind !== 'select') native.dispatchEvent(new Event('input', { bubbles: true }));
    native.dispatchEvent(new Event('change', { bubbles: true }));
    setCurrent(native.value);
  };
  const sync = useCallback(() => setCurrent(nativeRef.current?.value ?? ''), []);
  return { nativeRef, triggerRef, assignRef, current, open, setOpen, close, commit, sync };
}
