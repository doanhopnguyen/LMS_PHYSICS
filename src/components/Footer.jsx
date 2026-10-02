import React from 'react';

const campuses = [
  [
    'Trụ sở chính',
    'Số 122 Hoàng Quốc Việt, phường Nghĩa Đô, thành phố Hà Nội.',
    'https://maps.app.goo.gl/rEUZhZKnMeKmNgeJ8',
  ],
  [
    'Học viện cơ sở tại TP. Hồ Chí Minh',
    'Số 11 Nguyễn Đình Chiểu, phường Sài Gòn, Thành phố Hồ Chí Minh.',
    'https://maps.app.goo.gl/jUuFNULm7CGRQJpr9',
  ],
  [
    'Cơ sở đào tạo tại Hà Nội',
    'Số 96A Trần Phú, phường Hà Đông, thành phố Hà Nội.',
    'https://maps.app.goo.gl/hCHZG71dhwLz2tvo8',
  ],
  [
    'Cơ sở đào tạo tại TP Hồ Chí Minh',
    'Số 97 Man Thiện, phường Tăng Nhơn Phú, thành phố Hồ Chí Minh.',
    'https://maps.app.goo.gl/B5x8pPrMfRmCXXhL6',
  ],
];

export function Footer() {
  return (
    <footer className="app-footer site-footer">
      <div className="site-footer__content">
        <div className="site-footer__brand">
          <div className="site-footer__brand-lockup floating-brand">
            <span className="floating-brand-mark">
              <img src={`${import.meta.env.BASE_URL}ptitwhite.png`} alt="Logo PTIT" />
            </span>
            <span className="floating-brand-copy">
              <strong>HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG</strong>
              <span>Hệ thống học tập và thí nghiệm vật lý</span>
            </span>
          </div>
        </div>

        <div className="site-footer__campuses">
          {campuses.map(([name, address, mapUrl]) => (
            <section key={name}>
              <h2>{name}</h2>
              <a href={mapUrl} target="_blank" rel="noreferrer">
                <span className="material-symbols-outlined" aria-hidden="true">
                  location_on
                </span>
                <span>{address}</span>
              </a>
            </section>
          ))}
        </div>

        <div className="site-footer__bottom">
          <span>© PTIT 2026</span>
          <span>Design by Hope</span>
          <nav className="site-footer__social" aria-label="Mạng xã hội PTIT">
            <a href="https://www.facebook.com/HocvienPTIT/?locale=vi_VN" target="_blank" rel="noreferrer">
              <img className="site-footer__social-icon" src={`${import.meta.env.BASE_URL}facebookwhite.png`} alt="" aria-hidden="true" width="20" height="20" />
              Facebook
            </a>
            <a href="https://www.youtube.com/@PChannels" target="_blank" rel="noreferrer">
              <img className="site-footer__social-icon" src={`${import.meta.env.BASE_URL}youtubewhite.png`} alt="" aria-hidden="true" width="20" height="20" />
              YouTube
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
