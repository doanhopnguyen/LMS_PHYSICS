export function formatLogValue(value, empty = '—') {
  if (value == null || value === '') return empty;
  if (typeof value === 'string') {
    try { return JSON.stringify(JSON.parse(value), null, 2); }
    catch { return value; }
  }
  return JSON.stringify(value, null, 2) ?? empty;
}
