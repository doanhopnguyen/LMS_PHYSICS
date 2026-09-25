import React, { forwardRef } from 'react';
import { Button } from './Button.jsx';

// Keep native form semantics: callers retain validation, FormData and API handlers.
export const Form = forwardRef(function Form({ className = '', busy = false, children, ...props }, ref) {
  return (
    <form ref={ref} className={`app-form ${className}`} aria-busy={busy || undefined} {...props}>
      {children}
    </form>
  );
});

export const SubmitButton = forwardRef(function SubmitButton(
  { busy = false, disabled, children, className = '', ...props },
  ref
) {
  return (
    <Button ref={ref} {...props} type="submit" className={`form-submit ${className}`} disabled={disabled || busy}>
      {busy ? 'Đang lưu…' : children}
    </Button>
  );
});
