import React from 'react';
import { routeFromLink, navigate } from '../lib/navigation.js';
import { clearDemoSession } from '../lib/demoSession.js';
import { api, tokenStore } from '../lib/apiClient.js';
import { PageHeaderSlot } from './PageHeaderContext.jsx';
import { useCurrentUser } from '../hooks/useCurrentUser.js';
import { NotificationBell } from './NotificationBell.jsx';
import { goBack } from '../lib/navigation.js';
import { getPageFile } from '../lib/routes.js';

const defaultUser = {
  name: 'Tài khoản',
  role: '',
  detail: '',
  initials: 'TK',
};

export function Header({ onMenuClick, homeHref = 'dashboard.html' }) {
  const session = useCurrentUser();
  const user = session ? { ...session, role: session.label } : defaultUser;
  const home = session?.home || homeHref;
  const page = getPageFile();
  const isHome =
    page === home ||
    ['dashboard.html', 'lecturer_dashboard.html', 'ta_dashboard.html', 'admin_dashboard.html'].includes(page);
  const handleLink = (event) => {
    const link = event.target.closest('a');
    const target = link && routeFromLink(link);
    if (target) {
      event.preventDefault();
      navigate(target);
    }
  };
  const logout = () => {
    if (tokenStore.getRefreshToken()) api.auth.logout().catch(() => undefined);
    tokenStore.clear();
    clearDemoSession();
    navigate('login.html');
  };

  return (
    <header className="app-header" onClick={handleLink}>
      <div className="header-leading">
        <button
          className="header-menu-button"
          onClick={onMenuClick}
          aria-label="Mở thanh điều hướng"
          title="Mở thanh điều hướng"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        {!isHome && (
          <button
            type="button"
            className="header-back-button"
            onClick={() => goBack(home)}
            title="Quay lại trang trước"
          >
            Quay lại
          </button>
        )}
        <a className="floating-brand" href={home} aria-label="PTIT Physics LMS - Trang chủ">
          <span className="floating-brand-mark">
            <img src="ptitwhite.png" alt="Logo PTIT" />
          </span>
          <span className="floating-brand-copy">
            <strong>HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG</strong>
            <span>Hệ thống học tập và thí nghiệm vật lý</span>
          </span>
        </a>
      </div>

      <PageHeaderSlot />

      <div className="floating-actions">
        <NotificationBell />
        <div className="h-8 w-px bg-white/30 hidden sm:block" />
        <button
          type="button"
          className="floating-profile"
          onClick={() => navigate('account.html')}
          title={`${user.name}${user.role ? ` · ${user.role}` : ''}`}
          aria-label={`Mở hồ sơ ${user.name}`}
        >
          <div className="w-9 h-9 rounded-full ring-2 ring-white/50 bg-white/15 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
            {user.initials}
          </div>
          <div className="hidden sm:block text-left">
            <div className="flex items-center gap-2">
              <span className="floating-profile-name text-body-md-medium leading-tight" title={user.name}>
                {user.name}
              </span>
              <span className="floating-profile-role px-2 py-0.5 text-label-sm rounded-full">{user.role}</span>
            </div>
            <span className="floating-profile-id text-body-sm tracking-wide">{user.detail}</span>
          </div>
        </button>
        <button
          type="button"
          onClick={logout}
          className="p-2 rounded-full text-white hover:bg-white/16 transition-colors"
          title="Đăng xuất"
          aria-label="Đăng xuất"
        >
          <span className="material-symbols-outlined text-2xl">logout</span>
        </button>
      </div>
    </header>
  );
}
