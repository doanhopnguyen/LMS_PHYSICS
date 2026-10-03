import React, { forwardRef, useEffect, useId, useRef, useState } from 'react';
import { Popover } from './Popover.jsx';
import { useNativePicker } from './useNativePicker.js';

// Visual dropdown for SelectField; the native select remains the form control.
export const SelectControl = forwardRef(function SelectControl({ children, className = '', label, ...props }, ref) {
  const listId = useId();
  const picker = useNativePicker(props.value, props.defaultValue, ref, 'select');
  const [options, setOptions] = useState([]),
    [active, setActive] = useState(-1);
  const listRef = useRef(null),
    typed = useRef({ text: '', time: 0 });
  useEffect(() => {
    const native = picker.nativeRef.current;
    if (!native) return;
    setOptions(
      [...native.options].map((option) => ({
        value: option.value,
        text: option.textContent,
        disabled: option.disabled || Boolean(option.parentElement.disabled),
        group: option.parentElement.tagName === 'OPTGROUP' ? option.parentElement.label : '',
      }))
    );
    picker.sync();
  }, [children]);
  const selectedValue = String(props.value ?? picker.current);
  const selected = options.find((option) => option.value === selectedValue);
  const open = () => {
    if (props.disabled) return;
    const index = options.findIndex((option) => option.value === picker.nativeRef.current?.value && !option.disabled);
    setActive(index < 0 ? options.findIndex((option) => !option.disabled) : index);
    picker.setOpen(true);
  };
  useEffect(() => {
    if (!picker.open) return;
    const frame = requestAnimationFrame(() => {
      listRef.current?.focus({ preventScroll: true });
      listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
    });
    return () => cancelAnimationFrame(frame);
  }, [picker.open, active]);
  const choose = (index) => {
    if (index < 0 || !options[index] || options[index].disabled) return;
    picker.commit(options[index].value);
    picker.close(true);
  };
  const move = (direction, start = active) => {
    for (let index = start + direction; index >= 0 && index < options.length; index += direction) {
      if (!options[index].disabled) {
        setActive(index);
        break;
      }
    }
  };
  const keyDown = (event) => {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      if (!picker.open) {
        open();
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') choose(active);
      else if (event.key === 'Home') move(1, -1);
      else if (event.key === 'End') move(-1, options.length);
      else move(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now();
      const text = (now - typed.current.time < 600 ? typed.current.text : '') + event.key.toLocaleLowerCase('vi');
      typed.current = { text, time: now };
      const matches = options
        .map((option, index) => ({ option, index }))
        .filter(({ option }) => !option.disabled && option.text.toLocaleLowerCase('vi').startsWith(text));
      if (matches.length) {
        if (!picker.open) open();
        setActive((matches.find((match) => match.index > active) || matches[0]).index);
      }
    }
  };
  if (props.multiple || props.size > 1)
    return (
      <select {...props} ref={picker.assignRef} className={className}>
        {children}
      </select>
    );
  return (
    <span
      className={`select-field__picker${className.includes('--standalone') ? ' select-field__picker--standalone' : ''}`}
    >
      <select
        {...props}
        ref={picker.assignRef}
        tabIndex={-1}
        aria-hidden="true"
        className={`${className} picker-native`}
        onFocus={(event) => {
          props.onFocus?.(event);
          picker.triggerRef.current?.focus();
          open();
        }}
      >
        {children}
      </select>
      <button
        type="button"
        ref={picker.triggerRef}
        className={`${className} picker-trigger`}
        disabled={props.disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={picker.open}
        aria-controls={`${listId}-list`}
        aria-label={typeof label === 'string' ? label : props['aria-label'] || selected?.text || 'Chọn một mục'}
        aria-required={props.required || undefined}
        aria-invalid={props['aria-invalid']}
        aria-describedby={props['aria-describedby']}
        onClick={() => (picker.open ? picker.close() : open())}
        onKeyDown={keyDown}
      >
        <span>{selected?.text || picker.nativeRef.current?.selectedOptions[0]?.textContent || 'Chọn một mục'}</span>
        <span className="material-symbols-outlined picker-icon" aria-hidden="true">
          expand_more
        </span>
      </button>
      <Popover
        anchorRef={picker.triggerRef}
        open={picker.open && !props.disabled}
        onClose={picker.close}
        className="select-picker-panel"
      >
        <div
          ref={listRef}
          id={`${listId}-list`}
          role="listbox"
          tabIndex={-1}
          aria-label={typeof label === 'string' ? label : props['aria-label'] || 'Lựa chọn'}
          aria-activedescendant={active >= 0 ? `${listId}-option-${active}` : undefined}
          onKeyDown={keyDown}
        >
          {options.map((option, index) => (
            <React.Fragment key={`${index}-${option.value}`}>
              {option.group && options[index - 1]?.group !== option.group && (
                <div className="select-picker-group">{option.group}</div>
              )}
              <div
                id={`${listId}-option-${index}`}
                role="option"
                data-index={index}
                aria-selected={option.value === selectedValue}
                aria-disabled={option.disabled || undefined}
                className={`select-picker-option${active === index ? ' is-active' : ''}`}
                onPointerMove={() => !option.disabled && setActive(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(index)}
              >
                <span>{option.text}</span>
                {option.value === selectedValue && (
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check
                  </span>
                )}
              </div>
            </React.Fragment>
          ))}
          {!options.length && <p className="picker-placeholder">Chưa có lựa chọn.</p>}
        </div>
      </Popover>
    </span>
  );
});
