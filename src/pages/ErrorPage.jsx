import React from 'react';
import { Button } from '../components/Button.jsx';
import { clearDemoSession, demoRoles } from '../lib/demoSession.js';
import { navigate } from '../lib/navigation.js';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';

const content = {
  403: {
    
    title: 'Bạn không có quyền mở trang này',

  },
  404: {
    title: 'Trang bạn tìm không tồn tại',
  },
};

export function ErrorPage({ status = 404, session }) {
  const page = content[status] || content[404];
  const home = session?.home || 'login.html';
  const role = session && demoRoles[session.role]?.label;
  useDocumentMeta({ title: `${status} · PTIT Physics`, bodyClass: 'error-page-body' });

  const signInWithAnotherAccount = () => {
    clearDemoSession();
    navigate('login.html');
  };

  return (
    <main className="error-page" aria-labelledby="error-page-title">
      <div className="error-page__glow error-page__glow--one" aria-hidden="true" />
      <div className="error-page__glow error-page__glow--two" aria-hidden="true" />
      <section className="error-page__content">
        <a className="error-page__brand" href={home} aria-label="PTIT Physics LMS - Trang chủ">
          <img src={`${import.meta.env.BASE_URL}ptitlogo.png`} alt="Logo PTIT" width="86" height="110" />
          <span className="error-page__brand-copy"><strong>HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG</strong><span>Hệ thống học tập và thí nghiệm vật lý</span></span>
        </a>
        
        <h1 id="error-page-title">{page.title}</h1>
        {status === 403 && role && <p className="error-page__role">Vai trò hiện tại: <strong>{role}</strong></p>}
        <p className="error-page__description">{page.description}</p>
        <div className="error-page__actions">
          <Button icon="home" onClick={() => navigate(home)}>{session ? 'Về khu vực của tôi' : 'Về trang đăng nhập'}</Button>
          {status === 403 && <Button variant="secondary" icon="login" onClick={signInWithAnotherAccount}>Đăng nhập tài khoản khác</Button>}
          {status === 404 && <Button variant="secondary" icon="arrow_back" onClick={() => window.history.back()}>Quay lại trang trước</Button>}
        </div>
      </section>
    </main>
  );
}
