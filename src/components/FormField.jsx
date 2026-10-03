import React, { forwardRef, useId } from 'react';
export const FormField = forwardRef(function FormField(
  { label, multiline = false, bare = false, wrapperClassName = '', className = '', id, hint, error, ...props },
  ref
) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const Tag = multiline ? 'textarea' : 'input';
  const temporal = ['date', 'datetime-local', 'time', 'month', 'week'].includes(props.type) ? props.type : '';
  const control = (
    <Tag
      ref={ref}
      id={fieldId}
      className={`form-field__control ${temporal ? `form-field__control--${temporal}` : ''} ${className}`}
      aria-invalid={error ? true : undefined}
      aria-describedby={hint || error ? `${fieldId}-hint` : undefined}
      {...props}
    />
  );
  if (bare) return control;
  return (
    <label
      htmlFor={fieldId}
      className={`form-field ${temporal ? `form-field--temporal form-field--${temporal}` : ''} grid min-w-0 gap-1 text-body-md font-normal ${wrapperClassName}`}
    >
      {label && <span className="form-field__label">{label}</span>}
      {control}
      {(hint || error) && (
        <span id={`${fieldId}-hint`} className={error ? 'text-body-sm text-red-700' : 'text-body-sm text-slate-500'}>
          {error || hint}
        </span>
      )}
    </label>
  );
});
