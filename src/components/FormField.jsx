import React, { useId } from 'react';
export function FormField({ label, multiline = false, ...props }) {
  const id = useId();
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <label htmlFor={id} className="grid gap-1 text-body-md font-normal">
      {label}
      <Tag id={id} className="w-full rounded-xl border border-[#CBD5E1] p-3 font-normal" {...props} />
    </label>
  );
}
