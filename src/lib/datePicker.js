export const pad = (value) => String(value).padStart(2, '0');
export function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
export function parseDate(value) {
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(value || '');
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return dateKey(date) === match.slice(1).join('-') ? date : null;
}
export function monthDays(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, index) =>
    index < offset || index >= offset + count
      ? null
      : new Date(month.getFullYear(), month.getMonth(), index - offset + 1)
  );
}
export function dateDisabled(date, minDate, maxDate, disabledDates) {
  const key = dateKey(date);
  const min = parseDate(minDate),
    max = parseDate(maxDate);
  return Boolean(
    (min && key < dateKey(min)) ||
    (max && key > dateKey(max)) ||
    (typeof disabledDates === 'function'
      ? disabledDates(date)
      : disabledDates?.some((value) => {
          const parsed = parseDate(value);
          return parsed && dateKey(parsed) === key;
        }))
  );
}
export function displayTemporal(value, type, locale = 'vi-VN') {
  if (!value) return '';
  if (type === 'time') return value;
  if (type === 'month') {
    const [year, month] = value.split('-');
    return `Tháng ${Number(month)}, ${year}`;
  }
  const date = parseDate(value);
  if (!date) return '';
  const text = date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  return type === 'datetime-local' ? `${text} · ${value.split('T')[1] || '00:00'}` : text;
}
