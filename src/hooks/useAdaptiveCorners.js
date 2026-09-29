import { useEffect } from 'react';
import { cornerRadius } from '../lib/cornerRadius.js';

const selector = [
  '[class*="rounded"]',
  'button',
  'input',
  'select',
  'textarea',
  '.app-header',
  '.app-sidebar-drawer',
  '.app-footer',
  '.detail-toolbar-back',
  '.detail-toolbar-actions > a',
  '.chat-launcher',
  '.chat-widget-panel',
  '.chat-widget-avatar',
  '.chat-widget-message',
  '.chapter-outline',
  '.chapter-panel',
  '.chapter-lesson-number',
  '.lesson-formula',
  '.lesson-question',
  '.lesson-experiment',
].join(',');

function kindFor(element) {
  if (
    element.matches(
      '.floating-brand-mark, .floating-brand-mark *, .sidebar-backdrop, .dashboard-calendar__event, .dashboard-sky, input[type="range"], input[type="checkbox"], input[type="radio"]'
    )
  )
    return null;
  if (element.classList.contains('app-header')) return 'header';
  if (
    element.matches('.app-sidebar-drawer, .app-footer, .chat-widget-panel, .chapter-panel, .chapter-outline, textarea')
  )
    return 'panel';
  const { width, height } = element.getBoundingClientRect();
  if (!width || !height) return null;
  const explicitlyRound =
    element.classList.contains('rounded-full') ||
    element.matches('.chapter-lesson-number, .chat-launcher, .chat-widget-avatar, .chapter-close');
  if (explicitlyRound && Math.abs(width - height) < Math.min(width, height) * 0.15) return 'circle';
  // Multiline rows, large question cards and preview panels need gentler corners.
  if (height <= 64 && (explicitlyRound || element.matches('button, input, select, a, .detail-toolbar-back')))
    return 'control';
  return 'panel';
}

export function useAdaptiveCorners() {
  useEffect(() => {
    const root = document.getElementById('root');
    if (!root || !window.ResizeObserver) return;
    const tracked = new Set();
    let frame;

    const update = (element) => {
      const kind = kindFor(element);
      if (!kind) {
        element.removeAttribute('data-adaptive-corners');
        element.style.removeProperty('--ptit-adaptive-radius');
        return;
      }
      const { width, height } = element.getBoundingClientRect();
      const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const value = `${cornerRadius(width, height, kind, rootSize).toFixed(2)}px`;
      if (element.style.getPropertyValue('--ptit-adaptive-radius') !== value) {
        element.style.setProperty('--ptit-adaptive-radius', value);
      }
      element.dataset.adaptiveCorners = kind;
    };
    const observer = new ResizeObserver((entries) => entries.forEach(({ target }) => update(target)));
    const scan = () => {
      tracked.forEach((element) => {
        if (!root.contains(element) || !element.matches(selector)) {
          observer.unobserve(element);
          tracked.delete(element);
          element.removeAttribute('data-adaptive-corners');
          element.style.removeProperty('--ptit-adaptive-radius');
        }
      });
      root.querySelectorAll(selector).forEach((element) => {
        if (!(element instanceof HTMLElement)) return;
        if (!tracked.has(element)) {
          tracked.add(element);
          observer.observe(element);
        }
        update(element);
      });
    };
    const scheduleScan = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(scan);
    };
    const mutations = new MutationObserver(scheduleScan);
    mutations.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', scheduleScan);
    scan();
    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      observer.disconnect();
      window.removeEventListener('resize', scheduleScan);
      tracked.forEach((element) => {
        element.removeAttribute('data-adaptive-corners');
        element.style.removeProperty('--ptit-adaptive-radius');
      });
    };
  }, []);
}
