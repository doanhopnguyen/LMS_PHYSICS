import React, { forwardRef, useId } from 'react';

export const SelectField = forwardRef(function SelectField(
  { label, hint, error, className = '', children, id, bare = false, ...props },
  ref
) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  if (bare)
    return (
      <select
        ref={ref}
        id={fieldId}
        {...props}
        className={`select-field__control select-field__control--standalone ${className}`}
      >
        {children}
      </select>
    );
  return (
    <label className={`select-field ${className}`} htmlFor={fieldId}>
      {label && (
        <span className="select-field__label" title={typeof label === 'string' ? label : undefined}>
          {label}
        </span>
      )}
      <select
        ref={ref}
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={hint || error ? `${fieldId}-hint` : undefined}
        {...props}
        className="select-field__control"
      >
        {children}
      </select>
      {(hint || error) && (
        <span id={`${fieldId}-hint`} className={`select-field__hint${error ? ' select-field__hint--error' : ''}`}>
          {error || hint}
        </span>
      )}
    </label>
  );
});
