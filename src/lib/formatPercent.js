const percentNumber = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 2,
  useGrouping: false,
});

// Input is a percentage (0–100), not a fractional ratio. Only the label is rounded.
export function formatPercent(value) {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  return Number.isFinite(number) ? `${percentNumber.format(number)}%` : '—';
}

export function formatPercentText(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/(-?\d+(?:[.,]\d+)?)\s*%/g, (_, number) => formatPercent(number.replace(',', '.')));
}
