import React, { forwardRef } from 'react';

export const SelectField = forwardRef(function SelectField({ label, hint, error, className = '', children, id, ...props }, ref) {
  const fieldId = id || props.name;
  return <label className={`select-field ${className}`} htmlFor={fieldId}>
    {label && <span className="select-field__label">{label}</span>}
    <select ref={ref} id={fieldId} aria-invalid={Boolean(error)} aria-describedby={hint || error ? `${fieldId}-hint` : undefined} {...props} className="select-field__control">
      {children}
    </select>
    {(hint || error) && <span id={`${fieldId}-hint`} className={`select-field__hint${error ? ' select-field__hint--error' : ''}`}>{error || hint}</span>}
  </label>;
});
