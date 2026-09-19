import React from 'react';

export function Footer() {
  return (
    <footer className="app-footer w-full py-4 px-gutter flex flex-col md:flex-row justify-between items-center gap-2 text-body-sm text-on-surface-variant border-t border-[#E2E8F0] bg-surface-container-lowest">
      <span>© 2025 PTIT Physics 1 • Hệ thống học tập thông minh</span>
      <nav className="flex items-center gap-4" aria-label="Liên kết chân trang">
        <a className="hover:text-primary transition-colors" href="#">Điều khoản sử dụng</a>
        <a className="hover:text-primary transition-colors" href="#">Chính sách bảo mật</a>
        <a className="hover:text-primary transition-colors" href="notifications_help.html">Hỗ trợ kỹ thuật</a>
      </nav>
    </footer>
  );
}
