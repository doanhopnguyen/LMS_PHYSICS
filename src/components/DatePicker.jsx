import React, { forwardRef, useEffect, useId, useRef, useState } from 'react';
import { Button } from './Button.jsx';
import { Popover } from './Popover.jsx';
import { useNativePicker } from './useNativePicker.js';
import { dateKey, parseDate, monthDays, dateDisabled, displayTemporal, pad } from '../lib/datePicker.js';

const stringValue = (value) => (value instanceof Date ? dateKey(value) : value);
const placeholders = { date: 'Chọn ngày', 'datetime-local': 'Chọn ngày và giờ', time: 'Chọn giờ', month: 'Chọn tháng' };

export const DatePicker = forwardRef(function DatePicker(
  {
    value,
    defaultValue,
    onChange,
    nativeOnChange,
    minDate,
    maxDate,
    disabledDates,
    locale = 'vi-VN',
    type = 'date',
    min,
    max,
    step,
    id,
    label,
    className = 'form-field__control',
    disabled,
    readOnly,
    placeholder,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const minimum = min ?? stringValue(minDate),
    maximum = max ?? stringValue(maxDate);
  const picker = useNativePicker(stringValue(value), stringValue(defaultValue), ref);
  const [month, setMonth] = useState(new Date());
  const [activeDay, setActiveDay] = useState('');
  const [draftDate, setDraftDate] = useState('');
  const [hour, setHour] = useState('00'),
    [minute, setMinute] = useState('00'),
    [second, setSecond] = useState('00');
  const [validation, setValidation] = useState('');
  const panelRef = useRef(null);
  const hasTime = type === 'time' || type === 'datetime-local';
  const hasSeconds =
    hasTime &&
    (step === 'any' || (Number(step) > 0 && Number(step) < 60) || picker.current.split('T').at(-1)?.length > 5);
  const unavailable = (date) => dateDisabled(date, minimum, maximum, disabledDates);
  const open = () => {
    if (disabled || readOnly) return;
    let initial = type === 'month' ? parseDate(`${picker.current}-01`) : parseDate(picker.current);
    initial ||= parseDate(minimum) && new Date() < parseDate(minimum) ? parseDate(minimum) : new Date();
    if (parseDate(maximum) && initial > parseDate(maximum)) initial = parseDate(maximum);
    setMonth(new Date(initial.getFullYear(), initial.getMonth(), 1));
    setActiveDay(dateKey(initial));
    setDraftDate(type === 'datetime-local' ? picker.current.split('T')[0] : '');
    const time = (type === 'time' ? picker.current : picker.current.split('T')[1]) || '00:00';
    const parts = time.split(':');
    setHour(parts[0]);
    setMinute(parts[1]);
    setSecond(parts[2] || '00');
    setValidation('');
    picker.setOpen(true);
  };
  useEffect(() => {
    if (!picker.open) return;
    const frame = requestAnimationFrame(() => {
      const target =
        panelRef.current?.querySelector(`[data-day="${activeDay}"]:not(:disabled)`) ||
        panelRef.current?.querySelector('button:not(:disabled),input:not(:disabled)');
      target?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [picker.open, activeDay]);
  const select = (next) => {
    const native = picker.nativeRef.current;
    const previous = native.value;
    // Validate a proposed value without emitting a partial/invalid form change.
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(native, next);
    const valid = native.validity.valid;
    const message = native.validationMessage;
    setter.call(native, previous);
    if (!valid) {
      setValidation(message);
      return;
    }
    picker.commit(next);
    picker.close(true);
  };
  const moveDay = (event, date) => {
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
    let next = new Date(date);
    if (delta) next.setDate(next.getDate() + delta);
    else if (event.key === 'Home') next.setDate(next.getDate() - ((next.getDay() + 6) % 7));
    else if (event.key === 'End') next.setDate(next.getDate() + 6 - ((next.getDay() + 6) % 7));
    else if (event.key === 'PageUp' || event.key === 'PageDown') {
      const jump = event.key === 'PageUp' ? -1 : 1;
      next = new Date(date.getFullYear(), date.getMonth() + jump, 1);
      next.setDate(Math.min(date.getDate(), new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
    } else return;
    event.preventDefault();
    const direction = next < date ? -1 : 1;
    for (let tries = 0; tries < 366 && unavailable(next); tries++) next.setDate(next.getDate() + direction);
    if (unavailable(next)) return;
    setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    setActiveDay(dateKey(next));
  };
  const navigate = (amount) => {
    setMonth(
      new Date(
        month.getFullYear() + (type === 'month' ? amount : 0),
        month.getMonth() + (type === 'month' ? 0 : amount),
        1
      )
    );
  };
  const chosen = type === 'datetime-local' ? draftDate : picker.current;
  const candidate = `${pad(hour)}:${pad(minute)}${hasSeconds ? `:${pad(second)}` : ''}`;
  const weekdayNames =
    locale === 'vi-VN'
      ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
      : Array.from({ length: 7 }, (_, index) =>
          new Date(2026, 0, 5 + index).toLocaleDateString(locale, { weekday: 'short' })
        );
  return (
    <span className={`temporal-picker temporal-picker--${type}`}>
      <input
        {...props}
        ref={picker.assignRef}
        id={fieldId}
        type={type}
        value={stringValue(value)}
        defaultValue={stringValue(defaultValue)}
        min={minimum}
        max={maximum}
        step={step}
        disabled={disabled}
        readOnly={readOnly}
        tabIndex={-1}
        className={`${className} picker-native`}
        aria-hidden="true"
        onFocus={(event) => {
          props.onFocus?.(event);
          picker.triggerRef.current?.focus();
          open();
        }}
        onChange={(event) => {
          nativeOnChange?.(event);
          onChange?.(event.target.value);
        }}
      />
      <button
        ref={picker.triggerRef}
        type="button"
        disabled={disabled}
        aria-disabled={readOnly || undefined}
        className={`${className} picker-trigger`}
        aria-haspopup="dialog"
        aria-expanded={picker.open}
        aria-controls={`${fieldId}-popover`}
        aria-label={typeof label === 'string' ? label : props['aria-label'] || placeholders[type]}
        aria-describedby={props['aria-describedby']}
        aria-invalid={props['aria-invalid']}
        aria-required={props.required || undefined}
        onClick={() => (picker.open ? picker.close() : open())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            open();
          }
        }}
      >
        <span className={!picker.current ? 'picker-placeholder' : ''}>
          {displayTemporal(picker.current, type, locale) || placeholder || placeholders[type]}
        </span>
        <span className="material-symbols-outlined picker-icon" aria-hidden="true">
          {type === 'time' ? 'schedule' : 'calendar_today'}
        </span>
      </button>
      <Popover
        anchorRef={picker.triggerRef}
        open={picker.open && !disabled && !readOnly}
        onClose={picker.close}
        id={`${fieldId}-popover`}
        role="dialog"
        aria-label={typeof label === 'string' ? label : placeholders[type]}
        className="date-picker-panel"
      >
        <div ref={panelRef}>
          {type !== 'time' && (
            <>
              <header className="date-picker-header">
                <button
                  type="button"
                  aria-label={type === 'month' ? 'Năm trước' : 'Tháng trước'}
                  onClick={() => navigate(-1)}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    chevron_left
                  </span>
                </button>
                <strong aria-live="polite">
                  {type === 'month'
                    ? month.getFullYear()
                    : locale === 'vi-VN'
                      ? `Tháng ${month.getMonth() + 1}, ${month.getFullYear()}`
                      : month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
                </strong>
                <button
                  type="button"
                  aria-label={type === 'month' ? 'Năm sau' : 'Tháng sau'}
                  onClick={() => navigate(1)}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    chevron_right
                  </span>
                </button>
              </header>
              {type === 'month' ? (
                <div className="date-picker-months">
                  {Array.from({ length: 12 }, (_, index) => {
                    const key = `${month.getFullYear()}-${pad(index + 1)}`;
                    return (
                      <button
                        type="button"
                        key={key}
                        aria-pressed={picker.current === key}
                        disabled={Boolean((minimum && key < minimum) || (maximum && key > maximum))}
                        onClick={() => select(key)}
                      >
                        Tháng {index + 1}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div role="grid" aria-label="Lịch chọn ngày" className="date-picker-grid">
                  <div role="row" className="date-picker-weekdays">
                    {weekdayNames.map((day) => (
                      <span key={day} role="columnheader">
                        {day}
                      </span>
                    ))}
                  </div>
                  {Array.from({ length: monthDays(month).length / 7 }, (_, row) => (
                    <div role="row" key={row} className="date-picker-week">
                      {monthDays(month)
                        .slice(row * 7, row * 7 + 7)
                        .map((date, column) => {
                          if (!date) return <span role="gridcell" key={column} />;
                          const key = dateKey(date),
                            selected = chosen === key,
                            today = dateKey(new Date()) === key;
                          return (
                            <button
                              type="button"
                              key={key}
                              role="gridcell"
                              data-day={key}
                              aria-selected={selected}
                              aria-label={date.toLocaleDateString(locale, {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                              aria-current={today ? 'date' : undefined}
                              disabled={unavailable(date)}
                              tabIndex={activeDay === key ? 0 : -1}
                              onKeyDown={(event) => moveDay(event, date)}
                              onClick={() => {
                                if (hasTime) {
                                  setDraftDate(key);
                                  setActiveDay(key);
                                  setValidation('');
                                } else select(key);
                              }}
                            >
                              <span
                                className={`date-picker-day${selected ? ' is-selected' : today ? ' is-today' : ''}`}
                              >
                                {date.getDate()}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {hasTime && (
            <div className="date-picker-time">
              <p>
                {type === 'datetime-local'
                  ? draftDate
                    ? displayTemporal(draftDate, 'date', locale)
                    : 'Chọn ngày trước khi xác nhận'
                  : 'Chọn thời gian'}
              </p>
              <div className="date-picker-time-fields">
                {[
                  ['Giờ', hour, setHour, 23],
                  ['Phút', minute, setMinute, 59],
                  ...(hasSeconds ? [['Giây', second, setSecond, 59]] : []),
                ].map(([title, number, setNumber, limit]) => (
                  <label key={title}>
                    {title}
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max={limit}
                      step="1"
                      value={number}
                      onChange={(event) => {
                        setNumber(event.target.value);
                        setValidation('');
                      }}
                      onBlur={() => number !== '' && setNumber(pad(Math.min(limit, Math.max(0, Number(number)))))}
                    />
                  </label>
                ))}
              </div>
              <Button
                onClick={() => select(type === 'time' ? candidate : `${draftDate}T${candidate}`)}
                disabled={
                  (type === 'datetime-local' && !draftDate) ||
                  hour === '' ||
                  minute === '' ||
                  !Number.isInteger(Number(hour)) ||
                  !Number.isInteger(Number(minute)) ||
                  Number(hour) > 23 ||
                  Number(hour) < 0 ||
                  Number(minute) > 59 ||
                  Number(minute) < 0 ||
                  (hasSeconds &&
                    (second === '' || !Number.isInteger(Number(second)) || Number(second) > 59 || Number(second) < 0))
                }
              >
                Xác nhận
              </Button>
            </div>
          )}
          {validation && (
            <p role="alert" className="picker-error">
              {validation}
            </p>
          )}
          {!props.required && !readOnly && picker.current && (
            <button type="button" className="picker-clear" onClick={() => select('')}>
              Xóa lựa chọn
            </button>
          )}
        </div>
      </Popover>
    </span>
  );
});
