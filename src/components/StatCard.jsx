import React from 'react';
import { formatPercentText } from '../lib/formatPercent.js';
import { ProgressBar } from './ProgressBar.jsx';
import { SparklineChart } from './DataCharts.jsx';

export function StatCard({
  label,
  value,
  detail,
  icon,
  tone = 'primary',
  progress,
  trend,
  chart,
  sideChart,
  fillProgress,
  accentColor,
  onClick,
  onOpen,
  headerActions,
  active = false,
  footer,
  ribbonLabel,
  ribbonPosition = 'top',
}) {
  const palette = ['#0284c7', '#059669', '#7c3aed', '#db2777', '#b45309', '#4f46e5', '#0e7490'];
  const seed = Array.from(label ?? '').reduce((hash, char) => (hash * 31 + char.codePointAt(0)) >>> 0, 0);
  const accent = accentColor ?? palette[seed % palette.length];
  const hasChart = chart || trend?.length || progress !== undefined;
  const Container = onClick ? 'button' : 'section';
  const ribbon = (
    <div className="stat-card__ribbon">
      {ribbonLabel || (fillProgress !== undefined || progress !== undefined ? 'TIẾN ĐỘ' : 'THỐNG KÊ HỌC TẬP')}
    </div>
  );

  return (
    <Container
      type={onClick ? 'button' : undefined}
      className={`stat-card stat-card--blink ${ribbonPosition === 'bottom' ? 'stat-card--ribbon-bottom' : ''} ${onClick ? 'w-full cursor-pointer border-0 p-0 text-left transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2' : ''} ${active ? 'ring-2 ring-primary ring-offset-2' : ''}`}
      style={{ '--stat-accent': accent }}
      aria-label={label}
      aria-pressed={onClick ? active : undefined}
      onClick={onClick}
    >
      {ribbonPosition !== 'bottom' && ribbon}
      <div className="stat-card__surface">
        {fillProgress !== undefined ? (
          <div
            className="course-progress-card__fill"
            style={{ '--course-progress': `${fillProgress}%` }}
            aria-hidden="true"
          />
        ) : null}
        <div className="stat-card__content">
          <div className="stat-card__heading">
            <h3 className="min-w-0 break-words">{label}</h3>
            <div className="relative z-20 flex shrink-0 items-center gap-2">
              <span className="stat-card__icon" aria-hidden="true">
                <span className="material-symbols-outlined text-lg">{icon}</span>
              </span>
              {headerActions}
            </div>
          </div>
          <div className="stat-card__metrics">
            <div className="stat-card__value min-w-0 max-w-full">
              <span className="max-w-full break-words text-display-lg-mobile text-on-surface font-bold tracking-tight">
                {formatPercentText(value)}
              </span>
              {detail && <span className="text-body-md text-[#64748B]">{formatPercentText(detail)}</span>}
            </div>
            {sideChart && <div className="stat-card__side-chart">{sideChart}</div>}
          </div>
          {hasChart ? (
            <div className="stat-card__chart">
              {chart ??
                (trend?.length ? <SparklineChart data={trend} tone={tone} label={`Xu hướng ${label}`} /> : null)}
              {!chart && !trend?.length && progress !== undefined ? (
                <ProgressBar value={progress} tone={tone} compact />
              ) : null}
            </div>
          ) : null}
          {footer ? <div className="stat-card__footer">{footer}</div> : null}
          {onOpen && (
            <button
              type="button"
              onClick={onOpen}
              className="absolute inset-0 z-10 rounded-[14px] text-left transition-colors hover:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
            >
              <span className="sr-only">{label}</span>
            </button>
          )}
        </div>
      </div>
      {ribbonPosition === 'bottom' && ribbon}
    </Container>
  );
}
