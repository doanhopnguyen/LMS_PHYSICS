import React, { useEffect, useState, useRef } from 'react';
import { WeatherGraphic } from './WeatherIllustrations.jsx';

export const CAMPUSES = [
  {
    id: 'ptit_hn',
    name: 'PTIT Hà Đông',
    fullName: 'Học viện CNBCVT · Hà Đông, Hà Nội',
    lat: 20.9808,
    lon: 105.7852,
  },
  {
    id: 'ptit_hcm',
    name: 'PTIT TP.HCM',
    fullName: 'Học viện CNBCVT Cơ sở 2 · TP. Thủ Đức, TP.HCM',
    lat: 10.848,
    lon: 106.7865,
  },
  {
    id: 'danang',
    name: 'Đà Nẵng',
    fullName: 'Thành phố Đà Nẵng',
    lat: 16.0544,
    lon: 108.2022,
  },
];

export function weatherMeta(code, isDay = 1) {
  if (code === 0) {
    return {
      label: isDay ? 'Trời quang đãng' : 'Đêm quang đãng',
      icon: isDay ? 'wb_sunny' : 'bedtime',
      theme: 'clear',
      advice: 'Nhiệt độ và ánh sáng hoàn hảo cho việc học tập.',
    };
  }
  if ([1, 2].includes(code)) {
    return {
      label: isDay ? 'Nắng dịu, ít mây' : 'Trời trong, ít mây',
      icon: isDay ? 'partly_cloudy_day' : 'partly_cloudy_night',
      theme: 'cloudy',
      advice: 'Thời tiết mát mẻ dễ chịu, thích hợp ôn bài.',
    };
  }
  if (code === 3) {
    return {
      label: 'Nhiều mây u ám',
      icon: 'cloud',
      theme: 'overcast',
      advice: 'Trời dịu mát, lý tưởng để tập trung học trực tuyến.',
    };
  }
  if ([45, 48].includes(code)) {
    return {
      label: 'Sương mù nhẹ',
      icon: 'foggy',
      theme: 'cloudy',
      advice: 'Không khí ẩm mát, chú ý giữ ấm khi ra ngoài.',
    };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      label: 'Có mưa rào',
      icon: 'rainy',
      theme: 'rain',
      advice: 'Tiếng mưa rơi nhẹ nhàng, rất hợp để ngồi giải bài tập.',
    };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return {
      label: 'Tuyết lạnh',
      icon: 'ac_unit',
      theme: 'snow',
      advice: 'Trời lạnh, hãy thưởng thức ly trà nóng khi học nhé.',
    };
  }
  if (code >= 95) {
    return {
      label: 'Dông sét mưa to',
      icon: 'thunderstorm',
      theme: 'storm',
      advice: 'Trời đang dông sét, hãy ở trong nhà an toàn ôn bài.',
    };
  }
  return {
    label: 'Thời tiết ôn hòa',
    icon: 'cloud_queue',
    theme: 'clear',
    advice: 'Chúc bạn có một buổi học tập hiệu quả!',
  };
}

export function WeatherWidget({ className = '', onWeatherChange }) {
  const [selectedLocation, setSelectedLocation] = useState(CAMPUSES[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [locating, setLocating] = useState(false);
  const [weather, setWeather] = useState({
    loading: true,
    temperature: null,
    feelsLike: null,
    humidity: null,
    windSpeed: null,
    pressure: null,
    tempMax: null,
    tempMin: null,
    weatherCode: 0,
    isDay: 1,
    ...weatherMeta(0, 1),
    locationName: CAMPUSES[0].name,
    locationFull: CAMPUSES[0].fullName,
  });

  const dropdownRef = useRef(null);

  // Live Clock (seconds update)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Weather Data
  const fetchWeather = async (loc) => {
    setWeather((prev) => ({ ...prev, loading: true }));
    try {
      const query = new URLSearchParams({
        latitude: String(loc.lat),
        longitude: String(loc.lon),
        current:
          'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,surface_pressure',
        daily: 'temperature_2m_max,temperature_2m_min',
        timezone: 'auto',
      });
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`);
      if (!response.ok) throw new Error('Failed to fetch weather');
      const data = await response.json();

      const current = data.current || {};
      const daily = data.daily || {};
      const isDay = current.is_day ?? 1;
      const code = current.weather_code ?? 0;
      const meta = weatherMeta(code, isDay);
      const parsedTemp = Math.round(Number(current.temperature_2m));

      setWeather({
        loading: false,
        temperature: parsedTemp,
        feelsLike: Math.round(Number(current.apparent_temperature)),
        humidity: Math.round(Number(current.relative_humidity_2m)),
        windSpeed: Math.round(Number(current.wind_speed_10m)),
        pressure: Math.round(Number(current.surface_pressure)),
        tempMax: daily.temperature_2m_max ? Math.round(Number(daily.temperature_2m_max[0])) : null,
        tempMin: daily.temperature_2m_min ? Math.round(Number(daily.temperature_2m_min[0])) : null,
        weatherCode: code,
        isDay,
        ...meta,
        locationName: loc.name,
        locationFull: loc.fullName,
      });

      onWeatherChange?.({
        theme: meta.theme,
        isDay,
        temperature: parsedTemp,
      });
    } catch {
      setWeather((prev) => ({
        ...prev,
        loading: false,
        locationName: loc.name,
        locationFull: loc.fullName,
      }));
    }
  };

  useEffect(() => {
    fetchWeather(selectedLocation);
  }, [selectedLocation]);

  // Request browser GPS Geolocation
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        let placeName = 'Vị trí của bạn';
        let placeFull = 'Tọa độ GPS hiện tại';

        try {
          // Reverse geocode via BigDataCloud client API
          const geoRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=vi`
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const district = geoData.locality || geoData.city || '';
            const province = geoData.principalSubdivision || '';
            if (district && province) {
              placeName = `${district}, ${province}`;
              placeFull = `${district}, ${province} (GPS)`;
            } else if (province) {
              placeName = province;
              placeFull = `${province} (GPS)`;
            }
          }
        } catch {
          // fallback to coordinates if reverse geocode fails
        }

        const customLoc = {
          id: 'custom_gps',
          name: placeName,
          fullName: placeFull,
          lat,
          lon,
        };
        setSelectedLocation(customLoc);
        setIsDropdownOpen(false);
        setLocating(false);
      },
      () => {
        setLocating(false);
        alert('Không thể truy cập vị trí. Hãy kiểm tra quyền định vị trên trình duyệt.');
      },
      { timeout: 8000 }
    );
  };

  const timeString = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(now);

  const dateString = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  }).format(now);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-xl shadow-2xl transition-all hover:border-white/30 ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%)',
      }}
    >
      {/* Ambient background glow according to weather theme */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-2xl opacity-40 transition-colors duration-1000"
        style={{
          background:
            weather.theme === 'clear'
              ? weather.isDay
                ? '#F59E0B'
                : '#38BDF8'
              : weather.theme === 'rain'
                ? '#0284C7'
                : weather.theme === 'storm'
                  ? '#818CF8'
                  : '#CBD5E1',
        }}
      />

      {/* Header: Location & Live Status */}
      <div className="relative z-10 mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-3">
        {/* Location selector dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="group inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold text-white shadow-sm transition-all hover:bg-white/25 hover:border-white/40 active:scale-95"
            title="Đổi địa điểm thời tiết"
          >
            <span className="material-symbols-outlined text-sm text-amber-300">location_on</span>
            <span className="max-w-[140px] truncate sm:max-w-[180px]">{weather.locationName}</span>
            <span className="material-symbols-outlined text-xs text-white/70 transition-transform group-hover:translate-y-0.5">
              expand_more
            </span>
          </button>

          {/* Location dropdown menu */}
          {isDropdownOpen && (
            <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-2xl border border-white/20 bg-slate-900/90 p-2 text-white shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Chọn cơ sở / địa điểm
              </div>
              <div className="space-y-1">
                {CAMPUSES.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      setSelectedLocation(loc);
                      setIsDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${
                      selectedLocation.id === loc.id
                        ? 'bg-primary/80 font-semibold text-white'
                        : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{loc.name}</div>
                      <div className="text-[10px] text-slate-300/80 line-clamp-1">{loc.fullName}</div>
                    </div>
                    {selectedLocation.id === loc.id && (
                      <span className="material-symbols-outlined text-sm">check</span>
                    )}
                  </button>
                ))}

                {/* GPS auto detect button */}
                <button
                  type="button"
                  disabled={locating}
                  onClick={handleDetectGPS}
                  className="mt-1 flex w-full items-center gap-2 rounded-xl border border-dashed border-white/20 px-2.5 py-2 text-xs font-medium text-amber-300 hover:bg-white/10 hover:border-amber-300/50 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm animate-pulse">my_location</span>
                  <span>{locating ? 'Đang xác định GPS…' : 'Lấy vị trí GPS của tôi'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Clock & Pulse Indicator */}
        <div className="flex items-center gap-2 text-xs text-white/90">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-300 border border-emerald-400/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 -ml-3" />
            {timeString}
          </span>
          <button
            type="button"
            onClick={() => fetchWeather(selectedLocation)}
            className="rounded-full p-1 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
            title="Làm mới thời tiết"
          >
            <span className={`material-symbols-outlined text-sm ${weather.loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </button>
        </div>
      </div>

      {/* Main Body: Temperature & Animated Graphic */}
      <div className="relative z-10 flex items-center justify-between gap-4">
        {/* Left: Temp and condition */}
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-extrabold tracking-tight sm:text-5xl drop-shadow-md">
              {weather.loading ? (
                <span className="animate-pulse">--</span>
              ) : Number.isFinite(weather.temperature) ? (
                `${weather.temperature}°`
              ) : (
                '—'
              )}
            </span>
            <span className="text-lg font-medium text-white/75 sm:text-xl">C</span>
          </div>

          <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-md">
            <span>{weather.loading ? 'Đang cập nhật…' : weather.label}</span>
          </div>

          {/* Feels like & High/Low */}
          <div className="mt-2 text-[11px] text-white/80">
            {Number.isFinite(weather.feelsLike) && (
              <span>Cảm giác {weather.feelsLike}°C</span>
            )}
            {Number.isFinite(weather.tempMax) && Number.isFinite(weather.tempMin) && (
              <span className="ml-1.5 text-white/60">
                · H: {weather.tempMax}° / L: {weather.tempMin}°
              </span>
            )}
          </div>
        </div>

        {/* Right: Dynamic Animated Weather Graphic */}
        <div className="shrink-0 transition-transform duration-500 hover:scale-110">
          <WeatherGraphic
            theme={weather.theme}
            isDay={weather.isDay}
            className="h-20 w-20 sm:h-24 sm:w-24 drop-shadow-xl"
          />
        </div>
      </div>

      {/* Footer: Micro-metrics chips */}
      <div className="relative z-10 mt-4 grid grid-cols-3 gap-2 border-t border-white/15 pt-3">
        {/* Humidity */}
        <div className="flex flex-col items-center rounded-2xl bg-white/10 px-2 py-1.5 text-center backdrop-blur-md transition-all hover:bg-white/20">
          <div className="flex items-center gap-1 text-[10px] text-white/70">
            <span className="material-symbols-outlined text-[12px] text-cyan-300">humidity_mid</span>
            <span>Độ ẩm</span>
          </div>
          <span className="mt-0.5 text-xs font-bold sm:text-sm">
            {weather.loading || weather.humidity == null ? '—' : `${weather.humidity}%`}
          </span>
        </div>

        {/* Wind Speed */}
        <div className="flex flex-col items-center rounded-2xl bg-white/10 px-2 py-1.5 text-center backdrop-blur-md transition-all hover:bg-white/20">
          <div className="flex items-center gap-1 text-[10px] text-white/70">
            <span className="material-symbols-outlined text-[12px] text-teal-300">air</span>
            <span>Gió</span>
          </div>
          <span className="mt-0.5 text-xs font-bold sm:text-sm">
            {weather.loading || weather.windSpeed == null ? '—' : `${weather.windSpeed} km/h`}
          </span>
        </div>

        {/* Surface Pressure */}
        <div className="flex flex-col items-center rounded-2xl bg-white/10 px-2 py-1.5 text-center backdrop-blur-md transition-all hover:bg-white/20">
          <div className="flex items-center gap-1 text-[10px] text-white/70">
            <span className="material-symbols-outlined text-[12px] text-amber-300">speed</span>
            <span>Khí áp</span>
          </div>
          <span className="mt-0.5 text-xs font-bold sm:text-sm">
            {weather.loading || weather.pressure == null ? '—' : `${weather.pressure} hPa`}
          </span>
        </div>
      </div>

      {/* Motivational Note */}
      <div className="relative z-10 mt-2.5 flex items-center gap-1.5 text-[11px] text-white/80 line-clamp-1 italic">
        <span className="material-symbols-outlined text-[13px] text-amber-300">lightbulb</span>
        <span>{weather.advice}</span>
      </div>
    </div>
  );
}
