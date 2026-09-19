// Ratios use the shorter edge so a narrow/tall panel never becomes an oval.
export function cornerRadius(width, height, kind, rootFontSize = 16) {
  const edge = Math.max(0, Math.min(width, height));
  if (kind === 'circle') return edge / 2;
  if (kind === 'header') return Math.min(edge * 0.5, rootFontSize * 2);
  if (kind === 'control') return Math.min(edge * 0.5, rootFontSize * 1.5);
  return Math.min(edge * 0.09, rootFontSize * 1.5);
}
