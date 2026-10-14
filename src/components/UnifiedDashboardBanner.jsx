import React, { useEffect, useState, useRef, useMemo } from 'react';
import { WeatherGraphic } from './WeatherIllustrations.jsx';
import { api, tokenStore } from '../lib/apiClient.js';
import { getDemoSession } from '../lib/demoSession.js';

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

export function getWeatherMeta(code, isDay = 1, role = 'STUDENT') {
  const isLecturer = role === 'LECTURER';
  if (code === 0) {
    return {
      label: isDay ? 'Trời quang đãng' : 'Đêm quang đãng',
      theme: 'clear',
      advice: isLecturer
        ? 'Trời quang mây tạnh, không khí lý tưởng cho công tác nghiên cứu và giảng dạy.'
        : 'Trời quang mây tạnh, không khí lý tưởng để học tập và nghiên cứu.',
    };
  }
  if ([1, 2].includes(code)) {
    return {
      label: isDay ? 'Nắng dịu, ít mây' : 'Trời trong, ít mây',
      theme: 'cloudy',
      advice: isLecturer
        ? 'Thời tiết mát mẻ dễ chịu, tiếp thêm cảm hứng đồng hành cùng các lớp học!'
        : 'Thời tiết mát mẻ dễ chịu, tiếp thêm cảm hứng giải bài tập!',
    };
  }
  if (code === 3) {
    return {
      label: 'Nhiều mây u ám',
      theme: 'overcast',
      advice: isLecturer
        ? 'Trời râm mát dịu êm, thuận lợi cho việc chuẩn bị học liệu và chấm bài.'
        : 'Trời râm mát dịu êm, thích hợp ngồi bên bàn học trực tuyến.',
    };
  }
  if ([45, 48].includes(code)) {
    return {
      label: 'Sương mù nhẹ',
      theme: 'cloudy',
      advice: isLecturer
        ? 'Sương sớm bảng lảng, chúc Thầy/Cô khởi đầu ngày làm việc hanh thông.'
        : 'Sương sớm bảng lảng, hãy khởi động ngày mới bằng một bài học nhé.',
    };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      label: 'Có mưa rào',
      theme: 'rain',
      advice: isLecturer
        ? 'Tiếng mưa rơi nhẹ nhàng, thích hợp theo dõi tiến độ và giải đáp học thuật.'
        : 'Tiếng mưa rơi nhẹ nhàng, rất hợp để ngồi tĩnh tâm ôn luyện.',
    };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return {
      label: 'Tuyết lạnh',
      theme: 'snow',
      advice: isLecturer
        ? 'Trời lạnh, chúc Thầy/Cô giữ ấm và làm việc thật ấm áp.'
        : 'Trời lạnh, thưởng thức một tách trà nóng khi học nhé.',
    };
  }
  if (code >= 95) {
    return {
      label: 'Dông sét mưa to',
      theme: 'storm',
      advice: isLecturer
        ? 'Trời đang dông sét, Thầy/Cô chú ý an toàn khi di chuyển giữa các cơ sở.'
        : 'Trời đang dông sét, hãy ở nơi an toàn và học tập trực tuyến.',
    };
  }
  return {
    label: 'Thời tiết ôn hòa',
    theme: 'clear',
    advice: isLecturer
      ? 'Chúc Thầy/Cô một ngày làm việc và giảng dạy thật nhiều niềm vui!'
      : 'Chúc bạn một buổi học tập thật nhiều năng lượng và hứng khởi!',
  };
}

export function getSkyPeriod(hour) {
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 19) return 'sunset';
  return 'night';
}

export function getTimeGreeting(period, role = 'STUDENT') {
  if (role === 'LECTURER') {
    switch (period) {
      case 'dawn':
        return 'Bình minh rạng rỡ, chúc Thầy/Cô một ngày làm việc và nghiên cứu tràn đầy nhiệt huyết!';
      case 'morning':
        return 'Chúc Thầy/Cô một buổi sáng lên lớp thành công và nhiều niềm vui cùng sinh viên!';
      case 'afternoon':
        return 'Buổi chiều làm việc hiệu quả, chúc Thầy/Cô có những tiết giảng say mê và cuốn hút!';
      case 'sunset':
        return 'Hoàng hôn dịu nhẹ, chúc Thầy/Cô một buổi chiều thanh thản sau những giờ giảng dạy tận tụy.';
      case 'night':
        return 'Màn đêm yên ả, chúc Thầy/Cô có một buổi tối thư thái, bình yên và tái tạo năng lượng!';
      default:
        return 'Chúc Thầy/Cô một ngày làm việc và giảng dạy thật nhiều cảm hứng!';
    }
  }

  switch (period) {
    case 'dawn':
      return 'Bình minh rạng rỡ, khởi đầu ngày mới tràn đầy năng lượng!';
    case 'morning':
      return 'Chúc bạn một buổi sáng học tập thật hiệu quả và sáng tạo!';
    case 'afternoon':
      return 'Buổi chiều bứt phá các mục tiêu học tập nhé!';
    case 'sunset':
      return 'Chiều tà buông xuống, ôn luyện nhẹ nhàng sau giờ học.';
    case 'night':
      return 'Màn đêm yên ả, chúc bạn tập trung ôn bài thật tốt!';
    default:
      return 'Chúc bạn một buổi học tập thật nhiều hứng khởi!';
  }
}

export function UnifiedDashboardBanner({
  displayName: propDisplayName,
  role = 'STUDENT',
  actionButtons,
  className = '',
}) {
  const [selectedLocation, setSelectedLocation] = useState(CAMPUSES[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const dropdownRef = useRef(null);

  // Real user state dynamically fetched from live API & authenticated session
  const [profileUser, setProfileUser] = useState(() => {
    const session = getDemoSession();
    return {
      name: (propDisplayName && propDisplayName !== 'Học viên' && propDisplayName !== 'TS. Nguyễn Văn B' && propDisplayName !== 'Sinh viên')
        ? propDisplayName
        : (session?.name || ''),
      detail: session?.detail || (role === 'LECTURER' ? 'Bộ môn Vật lý' : ''),
      email: session?.email || '',
    };
  });

  useEffect(() => {
    let active = true;
    const session = getDemoSession();

    if (propDisplayName && propDisplayName !== 'Học viên' && propDisplayName !== 'TS. Nguyễn Văn B' && propDisplayName !== 'Sinh viên') {
      setProfileUser((prev) => ({ ...prev, name: propDisplayName }));
    }

    if (tokenStore.getAccessToken()) {
      Promise.all([
        api.users.me().catch(() => null),
        api.users.profile().catch(() => null),
      ]).then(([me, profile]) => {
        if (!active) return;
        const realName = profile?.fullName || me?.fullName || me?.name || me?.username || session?.name;
        const realDetail = profile?.bio || profile?.phone || session?.detail || (role === 'LECTURER' ? 'Bộ môn Vật lý' : '');
        const realEmail = me?.email || session?.email || '';

        setProfileUser({
          name: (propDisplayName && propDisplayName !== 'Học viên' && propDisplayName !== 'TS. Nguyễn Văn B' && propDisplayName !== 'Sinh viên')
            ? propDisplayName
            : (realName || session?.name || (role === 'LECTURER' ? 'Giảng viên' : 'Học viên')),
          detail: realDetail,
          email: realEmail,
        });
      });
    } else if (session) {
      setProfileUser({
        name: (propDisplayName && propDisplayName !== 'Học viên' && propDisplayName !== 'TS. Nguyễn Văn B' && propDisplayName !== 'Sinh viên')
          ? propDisplayName
          : (session.name || (role === 'LECTURER' ? 'Giảng viên' : 'Học viên')),
        detail: session.detail || (role === 'LECTURER' ? 'Bộ môn Vật lý' : ''),
        email: session.email || '',
      });
    }

    return () => {
      active = false;
    };
  }, [propDisplayName, role]);

  const effectiveDisplayName = profileUser.name || propDisplayName || (role === 'LECTURER' ? 'Giảng viên' : 'Học viên');

  // Time & Sky Period
  const hours = now.getHours();
  const skyPeriod = useMemo(() => getSkyPeriod(hours), [hours]);
  const isNight = skyPeriod === 'night';

  // Live second-by-second clock
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Weather state
  const [weather, setWeather] = useState({
    loading: true,
    temperature: 28,
    feelsLike: 31,
    humidity: 75,
    windSpeed: 12,
    pressure: 1012,
    tempMax: 32,
    tempMin: 24,
    weatherCode: 1,
    isDay: isNight ? 0 : 1,
    ...getWeatherMeta(1, isNight ? 0 : 1, role),
    locationName: CAMPUSES[0].name,
    locationFull: CAMPUSES[0].fullName,
  });

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
      const isDayApi = current.is_day ?? (isNight ? 0 : 1);
      const code = current.weather_code ?? 0;
      const meta = getWeatherMeta(code, isDayApi, role);

      setWeather({
        loading: false,
        temperature: Math.round(Number(current.temperature_2m)),
        feelsLike: Math.round(Number(current.apparent_temperature)),
        humidity: Math.round(Number(current.relative_humidity_2m)),
        windSpeed: Math.round(Number(current.wind_speed_10m)),
        pressure: Math.round(Number(current.surface_pressure)),
        tempMax: daily.temperature_2m_max ? Math.round(Number(daily.temperature_2m_max[0])) : null,
        tempMin: daily.temperature_2m_min ? Math.round(Number(daily.temperature_2m_min[0])) : null,
        weatherCode: code,
        isDay: isDayApi,
        ...meta,
        locationName: loc.name,
        locationFull: loc.fullName,
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
  }, [selectedLocation, isNight, role]);

  // GPS Location Detect
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
          // fallback
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
        alert('Không thể truy cập vị trí. Hãy bật quyền định vị trên trình duyệt.');
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

  // Floating Leaves Data with vector SVG and 3D aerodynamic drift
  const leaves = useMemo(
    () => [
      { id: 1, top: '15%', delay: '0s', dur: '9s', anim: 'drift-1', color: '#fde047', size: 18 },
      { id: 2, top: '28%', delay: '2.5s', dur: '11.5s', anim: 'drift-2', color: '#86efac', size: 16 },
      { id: 3, top: '10%', delay: '1.2s', dur: '8s', anim: 'drift-3', color: '#f59e0b', size: 15 },
      { id: 4, top: '42%', delay: '4.8s', dur: '12s', anim: 'drift-1', color: '#4ade80', size: 14 },
      { id: 5, top: '22%', delay: '6.5s', dur: '10s', anim: 'drift-2', color: '#facc15', size: 20 },
      { id: 6, top: '35%', delay: '3.6s', dur: '9.2s', anim: 'drift-3', color: '#cbd5e1', size: 15 },
      { id: 7, top: '50%', delay: '8s', dur: '11s', anim: 'drift-1', color: '#fb923c', size: 17 },
    ],
    []
  );

  // Fireflies & Night Light Bokeh
  const fireflies = useMemo(
    () => [
      { id: 1, left: '14%', top: '65%', delay: '0s', dur: '4.5s', size: 4 },
      { id: 2, left: '28%', top: '48%', delay: '1.2s', dur: '5.5s', size: 3 },
      { id: 3, left: '44%', top: '72%', delay: '2.4s', dur: '4.2s', size: 5 },
      { id: 4, left: '60%', top: '55%', delay: '0.8s', dur: '5.2s', size: 3.5 },
      { id: 5, left: '76%', top: '68%', delay: '3.1s', dur: '4.8s', size: 4 },
      { id: 6, left: '88%', top: '52%', delay: '1.7s', dur: '6s', size: 3 },
    ],
    []
  );

  // Weather Effects: strictly determined by live weather conditions
  const isRaining = weather.theme === 'rain' || weather.theme === 'storm';
  const isSunny = weather.theme === 'clear' && !!weather.isDay;
  const raindrops = useMemo(
    () =>
      isRaining
        ? Array.from({ length: 32 }).map((_, i) => ({
            id: i,
            left: `${(i * 3.1 + 1) % 100}%`,
            delay: `${(i * 0.11) % 1.2}s`,
            dur: `${0.65 + (i % 6) * 0.06}s`,
          }))
        : [],
    [isRaining]
  );

  return (
    <div
      className={`vietnam-banner ${className}`}
      data-period={skyPeriod}
      data-weather={weather.theme}
    >
      {/* 1. AMBIENT BREATHING AURORA */}
      <div className="vietnam-banner__aurora" />

      {/* 2. MODERN CITY SKYLINE SILHOUETTE WITH DENSE NIGHT LIGHTS */}
      <div className="vietnam-banner__cityscape" aria-hidden="true">
        <svg viewBox="0 0 1200 120" className="w-full h-full" preserveAspectRatio="none">
          {/* Buildings Silhouette */}
          <path
            d="M0,120 L0,70 L50,70 L50,55 L85,55 L85,75 L120,75 L120,40 L160,40 L160,70 L195,70 L195,30 L220,15 L245,30 L245,80 L280,80 L280,45 L320,45 L320,20 L330,20 L330,8 L332,8 L332,20 L345,20 L345,75 L385,75 L385,50 L425,50 L425,85 L460,85 L460,25 L475,25 L475,5 L477,5 L477,25 L500,25 L500,80 L540,80 L540,55 L580,55 L580,35 L615,35 L615,70 L650,70 L650,45 L690,45 L690,80 L730,80 L730,20 L745,10 L760,20 L760,75 L800,75 L800,48 L840,48 L840,85 L880,85 L880,30 L905,15 L910,2 L912,2 L915,15 L935,30 L935,80 L970,80 L970,55 L1010,55 L1010,80 L1050,80 L1050,40 L1090,40 L1090,75 L1130,75 L1130,60 L1170,60 L1170,85 L1200,85 L1200,120 Z"
            className="vietnam-banner__city-building"
          />

          {/* Red flashing antenna beacons on spires at night */}
          <circle cx="331" cy="7" r="2.5" fill="#ef4444" className="vietnam-banner__beacon" />
          <circle cx="476" cy="4" r="3" fill="#ef4444" className="vietnam-banner__beacon" />
          <circle cx="911" cy="2" r="2.5" fill="#ef4444" className="vietnam-banner__beacon" />

          {/* Building Window Lights (Active and twinkling at night, unlit during the day) */}
          {/* Cluster 1: 0 - 120px */}
          <rect x="15" y="80" width="6" height="5" rx="1" fill="#fef08a" className="vietnam-banner__window vietnam-banner__window--twinkle-1" />
          <rect x="30" y="80" width="6" height="5" rx="1" fill="#fde047" className="vietnam-banner__window vietnam-banner__window--twinkle-2" />
          <rect x="62" y="65" width="6" height="5" rx="1" fill="#38bdf8" className="vietnam-banner__window vietnam-banner__window--twinkle-3" />
          <rect x="74" y="65" width="6" height="5" rx="1" fill="#fef08a" className="vietnam-banner__window vietnam-banner__window--twinkle-1" />
          <rect x="96" y="84" width="6" height="5" rx="1" fill="#fde047" className="vietnam-banner__window vietnam-banner__window--twinkle-4" />

          {/* Cluster 2: 120 - 280px */}
          <rect x="128" y="48" width="6" height="5" rx="1" fill="#fef08a" className="vietnam-banner__window vietnam-banner__window--twinkle-1" />
          <rect x="144" y="48" width="6" height="5" rx="1" fill="#fef08a" className="vietnam-banner__window" />
          <rect x="128" y="58" width="6" height="5" rx="1" fill="#fde047" className="vietnam-banner__window vietnam-banner__window--twinkle-2" />
          <rect x="144" y="58" width="6" height="5" rx="1" fill="#fef08a" className="vietnam-banner__window" />
          <rect x="170" y="78" width="6" height="5" rx="1" fill="#38bdf8" className="vietnam-banner__window vietnam-banner__window--twinkle-3" />
          <rect x="205" y="38" width="7" height="6" rx="1" fill="#38bdf8" className="vietnam-banner__window vietnam-banner__window--twinkle-3" />
          <rect x="225" y="38" width="7" height="6" rx="1" fill="#fde047" className="vietnam-banner__window" />
          <rect x="205" y="50" width="7" height="6" rx="1" fill="#fef08a" className="vietnam-banner__window vietnam-banner__window--twinkle-1" />
          <rect x="225" y="50" width="7" height="6" rx="1" fill="#38bdf8" className="vietnam-banner__window" />
          <rect x="205" y="62" width="7" height="6" rx="1" fill="#fde047" className="vietnam-banner__window vietnam-banner__window--twinkle-2" />
          <rect x="225" y="62" width="7" height="6" rx="1" fill="#fef08a" className="vietnam-banner__window" />
          <rect x="256" y="90" width="6" height="5" rx="1" fill="#fef08a" className="vietnam-banner__window vietnam-banner__window--twinkle-4" />

          {/* Cluster 3: 280 - 450px */}
          <rect x="290" y="30" width="8" height="6" rx="1" fill="#fef08a" className="vietnam-banner__window" />
          <rect x="305" y="30" width="8" height="6" rx="1" fill="#fde047" className="vietnam-banner__window vietnam-banner__window--twinkle-2" />
          <rect x="290" y="42" width="8" height="6" rx="1" fill="#38bdf8" className="vietnam-banner__window vietnam-banner__window--twinkle-1" />
          <rect x="305" y="42" width="8" height="6" rx="1" fill="#fef08a" className="vietnam-banner__window" />
          <rect x="290" y="54" width="8" height="6" rx="1" fill="#fde047" className="vietnam-banner__window" />
          <rect x="305" y="54" width="8" height="6" rx="1" fill="#38bdf8" className="vietnam-banner__window vietnam-banner__window--twinkle-3" />
          <rect x="358" y="85" width="6" height="5" rx="1" fill="#fef08a" className="vietnam-banner__window vietnam-banner__window--twinkle-1" />
          <rect x="398" y="60" width="7" height="6" rx="1" fill="#fde047" className="vietnam-banner__window vietnam-banner__window--twinkle-2" />
          <rect x="412" y="60" width="7" height="6" rx="1" fill="#38bdf8" className="vietnam-banner__window vietnam-banner__window--twinkle-4" />

          {/* Cluster 4: 450 - 650px (Center Skyscraper) */}
          <rect x="468" y="35" width="8" height="7" rx="1" fill="#fef08a" className="vietnam-banner__window vietnam-banner__window--twinkle-1" />
          <rect x="484" y="35" width="8" height="7" rx="1" fill="#38bdf8" className="vietnam-banner__window" />
          <rect x="468" y="48" width="8" height="7" rx="1" fill="#fde047" className="vietnam-banner__window vietnam-banner__window--twinkle-3" />
          <rect x="484" y="48" width="8" height="7" rx="1" fill="#fef08a" className="vietnam-banner__window" />
          <rect x="468" y="61" width="8" height="7" rx="1" fill="#38bdf8" className="vietnam-banner__window vietnam-banner__window--twinkle-2" />
          <rect x="484" y="61" width="8" height="7" rx="1" fill="#fde047" className="vietnam-banner__window" />
          <rect x="468" y="74" width="8" height="7" rx="1" fill="#fef08a" className="vietnam-banner__window vietnam-banner__window--twinkle-4" />
          <rect x="484" y="74" width="8" height="7" rx="1" fill="#38bdf8" className="vietnam-banner__window vietnam-banner__window--twinkle-1" />
          <rect x="515" y="90" width="6" height="5" rx="1" fill="#fde047" className="vietnam-banner__window vietnam-banner__window--twinkle-2" />
          <rect x="550" y="45" width="7" height="6" rx="1" fill="#fde047" className="vietnam-banner__window vietnam-banner__window--twinkle-2" />
          <rect x="565" y="45" width="7" height="6" rx="1" fill="#fef08a" className="vietnam-banner__window" />
          <rect x="550" y="57" width="7" height="6" rx="1" fill="#38bdf8" className="vietnam-banner__window vietnam-banner__window--twinkle-1" />
          <rect x="565" y="57" width="7" height="6" rx="1" fill="#fde047" className="vietnam-banner__window" />
          <rect x="592" y="45" width="6" height="5" rx="1" fill="#fef08a" className="vietnam-banner__window vietnam-banner__window--twinkle-3" />
          <rect x="628" y="80" width="6" height="5" rx="1" fill="#38bdf8" className="vietnam-banner__window vietnam-banner__window--twinkle-4" />

          {/* Cluster 5: 650 - 880px */}
          <rect x="662" y="56" width="7" height="6" rx="1" fill="#fef08a" className="vietnam-banner__window vietnam-banner__window--twinkle-1" />
          <rect x="676" y="56" width="7" height="6" rx="1" fill="#fde047" className="vietnam-banner__window vietnam-banner__window--twinkle-2" />
          <rect x="738" y="30" width="7" height="6" rx="1" fill="#fef08a" className="vietnam-banner__window vietnam-banner__window--twinkle-3" />
          <rect x="748" y="30" width="7" height="6" rx="1" fill="#38bdf8" className="vietnam-banner__window" />
          <rect x="738" y="42" width="7" height="6" rx="1" fill="#fde047" className="vietnam-banner__window" />
          <rect x="748" y="42" width="7" height="6" rx="1" fill="#fef08a" className="vietnam-banner__window vietnam-banner__window--twinkle-2" />
          <rect x="738" y="54" width="7" height="6" rx="1" fill="#38bdf8" className="vietnam-banner__window vietnam-banner__window--twinkle-1" />
          <rect x="748" y="54" width="7" height="6" rx="1" fill="#fde047" className="vietnam-banner__window" />
          <rect x="774" y="85" width="6" height="5" rx="1" fill="#fef08a" className="vietnam-banner__window vietnam-banner__window--twinkle-4" />
          <rect x="814" y="60" width="7" height="6" rx="1" fill="#38bdf8" className="vietnam-banner__window vietnam-banner__window--twinkle-2" />
          <rect x="828" y="60" width="7" height="6" rx="1" fill="#fde047" className="vietnam-banner__window vietnam-banner__window--twinkle-3" />

          {/* Cluster 6: 880 - 1200px (Tower & Right Skyline) */}
          <rect x="895" y="35" width="8" height="6" rx="1" fill="#fef08a" className="vietnam-banner__window vietnam-banner__window--twinkle-1" />
          <rect x="915" y="35" width="8" height="6" rx="1" fill="#fde047" className="vietnam-banner__window" />
          <rect x="895" y="47" width="8" height="6" rx="1" fill="#38bdf8" className="vietnam-banner__window vietnam-banner__window--twinkle-3" />
          <rect x="915" y="47" width="8" height="6" rx="1" fill="#fef08a" className="vietnam-banner__window" />
          <rect x="895" y="59" width="8" height="6" rx="1" fill="#fde047" className="vietnam-banner__window vietnam-banner__window--twinkle-2" />
          <rect x="915" y="59" width="8" height="6" rx="1" fill="#38bdf8" className="vietnam-banner__window" />
          <rect x="946" y="90" width="6" height="5" rx="1" fill="#fef08a" className="vietnam-banner__window vietnam-banner__window--twinkle-4" />
          <rect x="984" y="68" width="7" height="6" rx="1" fill="#fde047" className="vietnam-banner__window vietnam-banner__window--twinkle-1" />
          <rect x="1024" y="90" width="6" height="5" rx="1" fill="#38bdf8" className="vietnam-banner__window vietnam-banner__window--twinkle-3" />
          <rect x="1060" y="50" width="7" height="6" rx="1" fill="#fef08a" className="vietnam-banner__window vietnam-banner__window--twinkle-2" />
          <rect x="1075" y="50" width="7" height="6" rx="1" fill="#fde047" className="vietnam-banner__window" />
          <rect x="1060" y="62" width="7" height="6" rx="1" fill="#38bdf8" className="vietnam-banner__window vietnam-banner__window--twinkle-1" />
          <rect x="1075" y="62" width="7" height="6" rx="1" fill="#fef08a" className="vietnam-banner__window" />
          <rect x="1104" y="85" width="6" height="5" rx="1" fill="#fde047" className="vietnam-banner__window vietnam-banner__window--twinkle-4" />
          <rect x="1144" y="72" width="6" height="5" rx="1" fill="#38bdf8" className="vietnam-banner__window vietnam-banner__window--twinkle-2" />
          <rect x="1180" y="95" width="6" height="5" rx="1" fill="#fef08a" className="vietnam-banner__window vietnam-banner__window--twinkle-1" />
        </svg>
      </div>

      {/* 3. TWINKLING STARS & NIGHT LIGHT GLOWS */}
      {isNight && (
        <>
          {[
            { id: 1, left: '10%', top: '22%', delay: '0.2s' },
            { id: 2, left: '22%', top: '14%', delay: '1.4s' },
            { id: 3, left: '45%', top: '28%', delay: '2.5s' },
            { id: 4, left: '58%', top: '16%', delay: '0.8s' },
            { id: 5, left: '72%', top: '12%', delay: '1.9s' },
            { id: 6, left: '88%', top: '20%', delay: '0.6s' },
          ].map((s) => (
            <div
              key={s.id}
              className="vietnam-banner__star"
              style={{ left: s.left, top: s.top, animationDelay: s.delay }}
            />
          ))}

          {/* Glowing night particles / fireflies */}
          {fireflies.map((f) => (
            <div
              key={f.id}
              className="vietnam-banner__firefly"
              style={{
                left: f.left,
                top: f.top,
                width: f.size,
                height: f.size,
                animationDelay: f.delay,
                animationDuration: f.dur,
              }}
            />
          ))}
        </>
      )}

      {/* 4. HIỆU ỨNG NẮNG: SUNSHINE & RADIANT SUNBEAMS (Chỉ xuất hiện khi thời tiết nắng ban ngày) */}
      {isSunny && (
        <>
          <div className="vietnam-banner__sunshine" aria-hidden="true" />
          <div className="vietnam-banner__sunbeam" aria-hidden="true" />
        </>
      )}

      {/* 5. LÁ BAY: FLOATING & SWAYING LEAVES IN THE BREEZE */}
      <div className="vietnam-banner__leaves" aria-hidden="true">
        {leaves.map((leaf) => (
          <div
            key={leaf.id}
            className={`vietnam-banner__leaf vietnam-banner__leaf--${leaf.anim}`}
            style={{
              top: leaf.top,
              animationDelay: leaf.delay,
              animationDuration: leaf.dur,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              style={{ width: leaf.size, height: leaf.size, color: leaf.color }}
              className="fill-current"
            >
              <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25V7.75C12,7.25 17,7 17,8Z" />
            </svg>
          </div>
        ))}
      </div>

      {/* 6. HIỆU ỨNG MƯA & DÔNG SÉT */}
      {weather.theme === 'storm' && <div className="vietnam-banner__lightning" />}

      {/* Falling Rain */}
      {isRaining && (
        <div className="vietnam-banner__rain">
          {raindrops.map((r) => (
            <div
              key={r.id}
              className="vietnam-banner__rain-drop"
              style={{
                left: r.left,
                animationDelay: r.delay,
                animationDuration: r.dur,
              }}
            />
          ))}
        </div>
      )}

      {/* 7. FOREGROUND CONTENT: UNIFIED COHESIVE DASHBOARD BANNER */}
      <div className="relative z-10 flex flex-col justify-between p-6 md:p-8 min-h-[290px] text-white">
        {/* TOP STATUS BAR: Location selector, Date & Live Clock */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Location, Real-time Clock & Weather Effects Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Campus dropdown selector with Vietnam flag badge */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="vietnam-glass-pill inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm active:scale-95"
                title="Đổi địa điểm thời tiết"
              >
                <span className="inline-flex items-center justify-center overflow-hidden rounded-[3px] border border-red-500/40 shadow-sm" style={{ width: 17, height: 11 }}>
                  <svg viewBox="0 0 30 20" className="w-full h-full">
                    <rect width="30" height="20" fill="#DA251D" />
                    <polygon
                      points="15,4 16.5,8.5 21,8.5 17.5,11.2 18.8,15.5 15,12.8 11.2,15.5 12.5,11.2 9,8.5 13.5,8.5"
                      fill="#FFFF00"
                    />
                  </svg>
                </span>
                <span className="max-w-[140px] truncate sm:max-w-[190px]">{weather.locationName}</span>
                <span className="material-symbols-outlined text-xs text-white/70">expand_more</span>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-2xl border border-white/20 bg-slate-950/90 p-2 text-white shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
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

                    {/* GPS auto detect */}
                    <button
                      type="button"
                      disabled={locating}
                      onClick={handleDetectGPS}
                      className="mt-1 flex w-full items-center gap-2 rounded-xl border border-dashed border-white/20 px-2.5 py-2 text-xs font-medium text-amber-300 hover:bg-white/10 hover:border-amber-300/50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm animate-pulse">my_location</span>
                      <span>{locating ? 'Đang định vị GPS…' : 'Lấy vị trí GPS của tôi'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Date & Live Pulsing Clock */}
            <div className="vietnam-glass-pill inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="capitalize">{dateString}</span>
              <span className="text-white/40">·</span>
              <span className="font-mono font-bold tracking-wider">{timeString}</span>
            </div>

          </div>
        </div>

        {/* MAIN BODY: Unified Greeting, Actions and Integrated Weather Panorama */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-center gap-6 pt-5">
          {/* Left Column: Greeting, dynamic poetic message & action buttons */}
          <div className="lg:col-span-7 space-y-3.5">
            <div className="flex items-center gap-3 flex-wrap">
              <h1
                className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white drop-shadow-md"
                style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
              >
                Xin chào, {effectiveDisplayName}!
              </h1>
              {role === 'LECTURER' && profileUser.detail && (
                <span className="vietnam-glass-pill inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-full font-medium text-amber-200 border-amber-300/30 bg-amber-400/15 shadow-sm">
                  <span className="material-symbols-outlined text-[13px]">school</span>
                  {profileUser.detail}
                </span>
              )}
            </div>
            <p
              className="text-sm sm:text-base text-white/90 max-w-xl drop-shadow-sm font-normal"
              style={{ textShadow: '0 1px 6px rgba(0,0,0,0.45)' }}
            >
              {getTimeGreeting(skyPeriod, role)}
            </p>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap pt-2">
              {actionButtons ? (
                actionButtons
              ) : role === 'LECTURER' ? (
                <>
                  <a
                    href="lecturer_assessments.html"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span className="material-symbols-outlined text-lg">add_task</span>
                    Tạo bài kiểm tra
                  </a>
                  <a
                    href="lecturer_labs.html"
                    className="vietnam-glass-pill flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium hover:-translate-y-0.5 transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined text-lg">science</span>
                    Giao thí nghiệm
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="ai_tutor.html"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold hover:from-red-500 hover:to-rose-500 transition-all shadow-lg hover:shadow-red-500/30 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span className="material-symbols-outlined text-lg">smart_toy</span>
                    Hỏi trợ giảng AI
                  </a>
                  <a
                    href="exam_practice_center.html"
                    className="vietnam-glass-pill flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium hover:-translate-y-0.5 transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined text-lg">assignment</span>
                    Vào làm bài tập
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Integrated Weather Display (NO separate box - blends naturally!) */}
          <div className="lg:col-span-5 flex flex-col sm:items-end justify-center gap-3">
            {/* Top row: Big temperature & Animated weather graphic */}
            <div className="flex items-center gap-4 sm:justify-end">
              <div className="text-left sm:text-right">
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-5xl sm:text-6xl font-black tracking-tighter drop-shadow-lg"
                    style={{ textShadow: '0 4px 16px rgba(0,0,0,0.45)' }}
                  >
                    {weather.loading ? '--' : weather.temperature}°
                  </span>
                  <span className="text-xl font-semibold text-white/80">C</span>
                </div>
                <div
                  className="text-xs text-white/85 font-medium mt-0.5"
                  style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
                >
                  <span>Cảm giác {weather.feelsLike}°C</span>
                  {weather.tempMax != null && weather.tempMin != null && (
                    <span className="ml-1 text-white/70">
                      · H: {weather.tempMax}° / L: {weather.tempMin}°
                    </span>
                  )}
                </div>
              </div>

              {/* Floating Animated Graphic */}
              <div className="transition-transform duration-500 hover:scale-110 drop-shadow-2xl">
                <WeatherGraphic
                  theme={weather.theme}
                  isDay={weather.isDay}
                  className="h-20 w-20 sm:h-24 sm:w-24"
                />
              </div>
            </div>

            {/* Bottom row: Executive Unified Metrics Bar (borderless, high border-radius pill) */}
            <div className="flex items-center justify-between rounded-full bg-white/[0.09] px-5 py-2.5 backdrop-blur-xl text-white w-full max-w-sm shadow-sm gap-2">
              {/* Humidity */}
              <div className="flex items-center gap-2 flex-1">
                <span className="material-symbols-outlined text-[16px] text-cyan-300">humidity_mid</span>
                <div className="text-left">
                  <div className="text-[10px] font-medium text-white/60 leading-tight">Độ ẩm</div>
                  <div className="text-xs font-bold font-mono">{weather.loading ? '—' : `${weather.humidity}%`}</div>
                </div>
              </div>

              {/* Wind Speed */}
              <div className="flex items-center gap-2 flex-1 justify-center">
                <span className="material-symbols-outlined text-[16px] text-emerald-300">air</span>
                <div className="text-left">
                  <div className="text-[10px] font-medium text-white/60 leading-tight">Gió</div>
                  <div className="text-xs font-bold font-mono">{weather.loading ? '—' : `${weather.windSpeed} km/h`}</div>
                </div>
              </div>

              {/* Pressure */}
              <div className="flex items-center gap-2 flex-1 justify-end">
                <span className="material-symbols-outlined text-[16px] text-amber-300">speed</span>
                <div className="text-left">
                  <div className="text-[10px] font-medium text-white/60 leading-tight">Khí áp</div>
                  <div className="text-xs font-bold font-mono">{weather.loading ? '—' : `${weather.pressure} hPa`}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
