import React, { useId } from 'react';

const chartColors = {
  primary: '#e52220',
  success: '#15803d',
  warning: '#b45309',
  neutral: '#64748b',
};

function safeNumbers(values) {
  return values.map((value) => Number(value) || 0);
}

export function SparklineChart({ data, tone = 'primary', label = 'Xu hướng 7 ngày gần nhất' }) {
  const gradientId = useId().replace(/:/g, '');
  const values = safeNumbers(data);
  const width = 164;
  const height = 46;
  const padding = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(values.length - 1, 1);
    const y = height - padding - ((value - min) / range) * (height - padding * 2 - 7);
    return [x, y];
  });
  const line = points.map(([x, y]) => `${x},${y}`).join(' ');
  const area = `${padding},${height - padding} ${line} ${width - padding},${height - padding}`;
  const color = chartColors[tone] ?? chartColors.primary;
  const lastPoint = points.at(-1) ?? [width - padding, height - padding];

  return (
    <div className="mt-3" role="img" aria-label={label}>
      <svg className="block h-12 w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.24" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`M ${area}`} fill={`url(#${gradientId})`} />
        <polyline
          points={line}
          fill="none"
          stroke={color}
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={lastPoint[0]} cy={lastPoint[1]} r="3.25" fill="white" stroke={color} strokeWidth="2" />
      </svg>
      <span className="block text-label-sm text-[#94A3B8]">7 ngày gần nhất</span>
    </div>
  );
}

export function HorizontalBarChart({ items, label = 'Tiến độ theo chương' }) {
  return (
    <div className="space-y-4" role="img" aria-label={label}>
      {items.map((item) => {
        const value = Math.min(100, Math.max(0, Number(item.value) || 0));
        const color = chartColors[item.tone] ?? chartColors.primary;
        return (
          <div key={item.label}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-body-sm">
              <span className="text-[#475569]">{item.label}</span>
              <strong style={{ color }}>{value}%</strong>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#E2E8F0]">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${value}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ColumnChart({ values, labels, label = 'Điểm theo tuần', color = '#16a34a' }) {
  const data = safeNumbers(values);
  const max = Math.max(...data, 100);

  return (
    <div
      className="flex h-56 items-end gap-3 border-b border-l border-[#E2E8F0] px-4 pt-5"
      role="img"
      aria-label={label}
    >
      {data.map((value, index) => {
        const height = Math.max(5, (value / max) * 100);
        return (
          <div key={`${labels[index]}-${index}`} className="flex h-full flex-1 flex-col items-center gap-2">
            <span className="text-label-sm text-[#64748B]">{value}%</span>
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-lg transition-all duration-500 hover:opacity-80"
                style={{ height: `${height}%`, backgroundColor: color }}
                title={`${labels[index]}: ${value}%`}
              />
            </div>
            <span className="text-label-sm text-[#94A3B8]">{labels[index]}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ProgressFillList({ items, label = 'Tiến độ theo chương' }) {
  return (
    <div className="space-y-4" role="img" aria-label={label}>
      {items.map((item) => {
        const value = Math.min(100, Math.max(0, Number(item.value) || 0));
        return (
          <div
            key={item.label}
            className="course-progress-card relative overflow-hidden rounded-xl border border-[#BBF7D0]"
            role="progressbar"
            aria-label={item.label}
            aria-valuenow={value}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div className="chapter-progress-fill" style={{ '--chapter-progress': `${value}%` }} aria-hidden="true" />
            <div className="relative z-10 flex items-center justify-between gap-4 p-3.5 text-body-sm">
              <span className="font-medium text-[#1F2937]">{item.label}</span>
              <strong className="text-[#15803D]">{value}%</strong>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function LineChart({ values, labels, label = 'Điểm theo tuần', color = '#16a34a' }) {
  const data = safeNumbers(values);
  const width = 440;
  const height = 230;
  const padding = { top: 18, right: 16, bottom: 30, left: 26 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const points = data.map((value, index) => {
    const x = padding.left + (index * chartWidth) / Math.max(data.length - 1, 1);
    const y = padding.top + chartHeight - (Math.min(100, Math.max(0, value)) / 100) * chartHeight;
    return [x, y];
  });
  const line = points.map(([x, y]) => `${x},${y}`).join(' ');
  const area = `${padding.left},${padding.top + chartHeight} ${line} ${padding.left + chartWidth},${padding.top + chartHeight}`;
  const gradientId = useId().replace(/:/g, '');

  return (
    <div role="img" aria-label={label}>
      <svg className="block h-60 w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[25, 50, 75, 100].map((tick) => {
          const y = padding.top + chartHeight - (tick / 100) * chartHeight;
          return (
            <g key={tick}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#E2E8F0" strokeDasharray="3 4" />
              <text x={padding.left - 7} y={y + 3} fill="#94A3B8" fontSize="9" textAnchor="end">
                {tick}
              </text>
            </g>
          );
        })}
        <path d={`M ${area} Z`} fill={`url(#${gradientId})`} />
        <polyline
          points={line}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map(([x, y], index) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r="4.2" fill="white" stroke={color} strokeWidth="2.5" />
            <text x={x} y={y - 10} fill="#475569" fontSize="10" fontWeight="700" textAnchor="middle">
              {data[index]}
            </text>
            <text x={x} y={height - 7} fill="#94A3B8" fontSize="9" textAnchor="middle">
              {labels[index]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function MiniColumnChart({
  values,
  label = 'Xu hướng điểm trung bình',
  color = '#16a34a',
  compact = false,
  caption = 'Điểm 6 tuần gần nhất',
}) {
  const data = safeNumbers(values);
  const max = Math.max(...data, 10);

  return (
    <div className={compact ? 'w-28' : 'mt-3'} role="img" aria-label={label}>
      <div className={`flex ${compact ? 'h-14' : 'h-12'} items-end gap-1.5 border-b border-[#E2E8F0] px-0.5`}>
        {data.map((value, index) => (
          <div key={`${value}-${index}`} className="flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t-sm"
              style={{ height: `${Math.max(0, (value / max) * 100)}%`, backgroundColor: color }}
              title={`${value}/10`}
            />
          </div>
        ))}
      </div>
      {!compact && <span className="block pt-1 text-label-sm text-[#94A3B8]">{caption}</span>}
    </div>
  );
}

export function DonutChart({ value, label = 'Tỷ lệ hoàn thành', color = '#16a34a', size = 68, compact = false }) {
  const progress = Math.round(Math.min(100, Math.max(0, Number(value) || 0)) * 10) / 10;
  const radius = 17;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const chart = (
    <svg className="-rotate-90" style={{ width: size, height: size }} viewBox="0 0 44 44" aria-hidden="true">
      <circle cx="22" cy="22" r={radius} fill="none" stroke="#DCFCE7" strokeWidth="5" />
      <circle
        cx="22"
        cy="22"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
      <text
        x="22"
        y="24.5"
        fill="#166534"
        fontSize="8"
        fontWeight="700"
        textAnchor="middle"
        transform="rotate(90 22 22)"
      >
        {progress}%
      </text>
    </svg>
  );

  if (compact)
    return (
      <span className="flex shrink-0" role="img" aria-label={`${label}: ${progress}%`}>
        {chart}
      </span>
    );

  return (
    <div className="mt-2 flex items-center gap-3" role="img" aria-label={`${label}: ${progress}%`}>
      {chart}
      <span className="text-label-sm text-[#64748B]">{progress}% hoàn thành</span>
    </div>
  );
}

export function CountDotsChart({ value, unit = 'mục', groupSize = 1, color = '#0284c7' }) {
  const count = Math.max(0, Math.floor(Number(value) || 0));
  const group = Math.max(1, Math.floor(Number(groupSize) || 1));
  const dots = Math.ceil(count / group);
  return (
    <div role="img" aria-label={`${count} ${unit}; mỗi chấm tương ứng ${group} ${unit}`}>
      <div className="flex flex-wrap gap-1.5 py-2" aria-hidden="true">
        {Array.from({ length: dots }, (_, index) => (
          <span
            key={index}
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: color, opacity: Math.min(1, (count - index * group) / group) }}
          />
        ))}
      </div>
      <span className="text-label-sm text-[#64748B]">
        Mỗi chấm = {group} {unit}
      </span>
    </div>
  );
}
