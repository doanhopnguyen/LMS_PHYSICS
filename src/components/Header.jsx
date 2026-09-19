import React from 'react';
import { routeFromLink, navigate } from '../lib/navigation.js';

export function Header({ onMenuClick }) {
  const handleLink = (event) => {
    const link = event.target.closest('a');
    const target = link && routeFromLink(link);
    if (target) {
      event.preventDefault();
      navigate(target);
    }
  };

  return <header className="app-header" onClick={handleLink}>
    <div className="header-leading">
      <button className="header-menu-button" onClick={onMenuClick} aria-label="Mở thanh điều hướng" title="Mở thanh điều hướng"><span className="material-symbols-outlined">menu</span></button>
      <a className="floating-brand" href="dashboard.html" aria-label="PTIT Physics 1 - Trang chủ">
        <span className="floating-brand-mark"><img src="ptitwhite.png" alt="Logo PTIT" /></span>
        <span className="floating-brand-copy"><strong>HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG</strong><span>Hệ thống học tập và thí nghiệm vật lý</span></span>
      </a>
    </div>

    <div className="header-search-center hidden xl:block">
      <div className="header-search relative">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] text-xl">search</span>
        <input className="w-full h-10 pl-11 pr-4 bg-surface-container-low border border-[#CBD5E1] rounded-full text-body-md text-on-surface placeholder:text-[#94A3B8] focus:bg-white focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-[#FEE2E2] transition-all" placeholder="Tìm kiếm bài học, tài liệu, công thức..." type="search" aria-label="Tìm kiếm" />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[11px] font-mono text-[#64748B] bg-white border border-[#CBD5E1] rounded-full shadow-xs">⌘K</kbd>
      </div>
    </div>

    <div className="floating-actions">
      <button className="relative p-2 rounded-full text-white hover:bg-white/16 transition-colors" title="Thông báo mới" aria-label="Thông báo">
        <span className="material-symbols-outlined text-2xl">notifications</span>
        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-primary-container rounded-full ring-2 ring-[#E52220]" />
      </button>
      <div className="h-8 w-px bg-white/30 hidden sm:block" />
      <button className="floating-profile" title="Mở hồ sơ sinh viên">
        <div className="w-9 h-9 rounded-full ring-2 ring-white/50 bg-white/15 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">VA</div>
        <div className="hidden sm:block text-left">
          <div className="flex items-center gap-2">
            <span className="floating-profile-name text-body-md-medium leading-tight">Nguyễn Văn A</span>
            <span className="floating-profile-role px-2 py-0.5 text-label-sm rounded-full">Sinh viên</span>
          </div>
          <span className="floating-profile-id text-body-sm tracking-wide">B23DCCN001</span>
        </div>
      </button>
    </div>
  </header>;
}
