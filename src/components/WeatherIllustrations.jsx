import React from 'react';

export function WeatherGraphic({ theme, isDay = 1, className = 'w-24 h-24' }) {
  if (theme === 'clear') {
    return isDay ? <SunnyGraphic className={className} /> : <NightGraphic className={className} />;
  }
  if (theme === 'cloudy') {
    return isDay ? <PartlyCloudyGraphic isDay={true} className={className} /> : <PartlyCloudyGraphic isDay={false} className={className} />;
  }
  if (theme === 'overcast') {
    return <OvercastGraphic className={className} />;
  }
  if (theme === 'rain') {
    return <RainGraphic className={className} />;
  }
  if (theme === 'storm') {
    return <StormGraphic className={className} />;
  }
  if (theme === 'snow') {
    return <SnowGraphic className={className} />;
  }
  return <PartlyCloudyGraphic isDay={Boolean(isDay)} className={className} />;
}

export function SunnyGraphic({ className = 'w-24 h-24' }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        <defs>
          <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sun-core" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="40%" stopColor="#FDE047" />
            <stop offset="85%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </radialGradient>
          <filter id="sun-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#F59E0B" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Ambient Glow */}
        <circle cx="50" cy="50" r="46" fill="url(#sun-glow)" className="animate-pulse" />

        {/* Sunbeams group - rotating slowly */}
        <g className="origin-center animate-[spin_24s_linear_infinite]">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <line
              key={angle}
              x1="50"
              y1="10"
              x2="50"
              y2="18"
              stroke="#FDE047"
              strokeWidth="4"
              strokeLinecap="round"
              transform={`rotate(${angle} 50 50)`}
              opacity="0.9"
            />
          ))}
        </g>

        {/* Inner core */}
        <circle cx="50" cy="50" r="26" fill="url(#sun-core)" filter="url(#sun-shadow)" />

        {/* 3D highlight */}
        <ellipse cx="43" cy="40" rx="9" ry="5" fill="#FFFFFF" opacity="0.4" transform="rotate(-25 43 40)" />
      </svg>
    </div>
  );
}

export function NightGraphic({ className = 'w-24 h-24' }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="moon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#E0F2FE" />
            <stop offset="100%" stopColor="#7DD3FC" />
          </linearGradient>
          <filter id="moon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="#38BDF8" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Twinkling stars */}
        <g className="animate-pulse">
          <circle cx="20" cy="25" r="2" fill="#FDE047" opacity="0.8" />
          <circle cx="75" cy="18" r="2.5" fill="#FFFFFF" opacity="0.9" />
          <circle cx="85" cy="55" r="1.5" fill="#BAE6FD" opacity="0.75" />
          <circle cx="25" cy="70" r="2" fill="#FFFFFF" opacity="0.85" />
        </g>

        {/* Crescent Moon */}
        <path
          d="M58 20 A 30 30 0 1 0 78 72 A 26 26 0 1 1 58 20 Z"
          fill="url(#moon-gradient)"
          filter="url(#moon-glow)"
          className="transition-transform duration-700 hover:scale-105"
        />

        {/* Soft craters */}
        <circle cx="44" cy="48" r="3.5" fill="#0284C7" opacity="0.15" />
        <circle cx="50" cy="62" r="2.5" fill="#0284C7" opacity="0.12" />
        <circle cx="36" cy="58" r="2" fill="#0284C7" opacity="0.15" />
      </svg>
    </div>
  );
}

export function PartlyCloudyGraphic({ isDay = true, className = 'w-24 h-24' }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        <defs>
          <radialGradient id="sun-subtle" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="60%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EA580C" />
          </radialGradient>
          <linearGradient id="cloud-glass" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#F1F5F9" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0.7" />
          </linearGradient>
          <filter id="cloud-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#0F172A" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Sun or Moon behind cloud */}
        {isDay ? (
          <g className="origin-top-right transition-transform animate-[pulse_4s_ease-in-out_infinite]">
            <circle cx="68" cy="34" r="18" fill="url(#sun-subtle)" />
            <circle cx="68" cy="34" r="24" fill="#FDE047" opacity="0.25" filter="blur(4px)" />
          </g>
        ) : (
          <path
            d="M62 20 A 18 18 0 1 0 76 50 A 15 15 0 1 1 62 20 Z"
            fill="#BAE6FD"
            className="animate-pulse"
          />
        )}

        {/* Front Cloud with gentle float animation */}
        <g filter="url(#cloud-shadow)" className="animate-[bounce_6s_ease-in-out_infinite]">
          <path
            d="M28 68 C22 68 18 63 18 57 C18 51 22 47 28 47 C29 41 34 36 41 36 C48 36 54 41 55 47 C57 46 60 46 62 46 C69 46 75 51 75 58 C75 64 70 68 64 68 Z"
            fill="url(#cloud-glass)"
          />
          {/* Cloud Highlight */}
          <path
            d="M30 49 C33 44 38 40 43 40 C48 40 52 44 54 48"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />
        </g>
      </svg>
    </div>
  );
}

export function OvercastGraphic({ className = 'w-24 h-24' }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="cloud-back" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>
          <linearGradient id="cloud-front" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="70%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <filter id="overcast-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#0F172A" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Back Cloud */}
        <g opacity="0.8" transform="translate(14, -6) scale(0.9)">
          <path
            d="M28 68 C22 68 18 63 18 57 C18 51 22 47 28 47 C29 41 34 36 41 36 C48 36 54 41 55 47 C57 46 60 46 62 46 C69 46 75 51 75 58 C75 64 70 68 64 68 Z"
            fill="url(#cloud-back)"
          />
        </g>

        {/* Front Cloud */}
        <g filter="url(#overcast-shadow)" className="animate-[pulse_5s_ease-in-out_infinite]">
          <path
            d="M26 72 C19 72 14 66 14 60 C14 54 19 49 25 49 C27 42 33 37 41 37 C49 37 55 42 57 49 C59 48 62 48 65 48 C73 48 79 54 79 61 C79 68 73 72 66 72 Z"
            fill="url(#cloud-front)"
          />
        </g>
      </svg>
    </div>
  );
}

export function RainGraphic({ className = 'w-24 h-24' }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="rain-cloud" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#CBD5E1" />
            <stop offset="50%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <filter id="rain-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0F172A" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Cloud */}
        <g filter="url(#rain-shadow)">
          <path
            d="M26 58 C20 58 15 53 15 47 C15 41 20 37 26 37 C28 30 34 25 42 25 C50 25 57 30 58 37 C61 36 64 36 66 36 C74 36 80 42 80 49 C80 56 74 58 68 58 Z"
            fill="url(#rain-cloud)"
          />
        </g>

        {/* Rain droplets */}
        <g stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" opacity="0.85">
          <line x1="28" y1="65" x2="24" y2="76" className="animate-[pulse_1s_ease-in-out_infinite]" />
          <line x1="42" y1="66" x2="38" y2="78" className="animate-[pulse_1.2s_ease-in-out_infinite_0.2s]" />
          <line x1="56" y1="65" x2="52" y2="77" className="animate-[pulse_0.9s_ease-in-out_infinite_0.4s]" />
          <line x1="68" y1="66" x2="64" y2="78" className="animate-[pulse_1.1s_ease-in-out_infinite_0.3s]" />
        </g>
      </svg>
    </div>
  );
}

export function StormGraphic({ className = 'w-24 h-24' }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="storm-cloud" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="60%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <filter id="lightning-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#FACC15" floodOpacity="0.9" />
          </filter>
        </defs>

        {/* Storm Cloud */}
        <g>
          <path
            d="M26 56 C20 56 15 51 15 45 C15 39 20 35 26 35 C28 28 34 23 42 23 C50 23 57 28 58 35 C61 34 64 34 66 34 C74 34 80 40 80 47 C80 54 74 56 68 56 Z"
            fill="url(#storm-cloud)"
          />
        </g>

        {/* Lightning Bolt */}
        <polygon
          points="48,50 40,66 49,66 43,84 60,60 51,60 56,50"
          fill="#FDE047"
          filter="url(#lightning-glow)"
          className="animate-[pulse_1.5s_ease-in-out_infinite]"
        />

        {/* Rain droplets */}
        <g stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" opacity="0.7">
          <line x1="26" y1="64" x2="22" y2="74" />
          <line x1="68" y1="63" x2="64" y2="73" />
        </g>
      </svg>
    </div>
  );
}

export function SnowGraphic({ className = 'w-24 h-24' }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="snow-cloud" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
        </defs>

        <path
          d="M26 56 C20 56 15 51 15 45 C15 39 20 35 26 35 C28 28 34 23 42 23 C50 23 57 28 58 35 C61 34 64 34 66 34 C74 34 80 40 80 47 C80 54 74 56 68 56 Z"
          fill="url(#snow-cloud)"
        />

        {/* Snowflakes */}
        <g fill="#E0F2FE" className="animate-pulse">
          <circle cx="30" cy="68" r="2.5" />
          <circle cx="44" cy="74" r="3" />
          <circle cx="58" cy="67" r="2.5" />
          <circle cx="68" cy="73" r="2" />
        </g>
      </svg>
    </div>
  );
}
