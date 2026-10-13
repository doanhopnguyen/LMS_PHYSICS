import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';

export function AuthLayout({ title, description, children }) {
  useDocumentMeta({ title: `${title} · PTIT Physics`, bodyClass: 'login-body' });
  return (
    <main
      className="login-page"
      style={{ '--login-background-image': `url("${import.meta.env.BASE_URL}background_login.jpg")` }}
    >
      <div className="login-layout">
        <header className="login-brand">
          <img src={`${import.meta.env.BASE_URL}ptitlogo.png`} alt="Logo PTIT" width="54" height="69" />
          <div>
            <strong>HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG</strong>
            <span>HỆ THỐNG HỌC TẬP VÀ THÍ NGHIỆM VẬT LÝ</span>
          </div>
        </header>
        <section className="login-panel" aria-labelledby="auth-title">
          <h1 id="auth-title">{title}</h1>
          {description && <p className="login-intro">{description}</p>}
          {children}
        </section>
      </div>
    </main>
  );
}

export function AuthAlert({ error, children }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [children, error]);
  if (!children || !visible) return null;
  return createPortal(
    <p
      className={`form-alert form-alert--${error ? 'error' : 'success'} auth-alert`}
      role={error ? 'alert' : 'status'}
      aria-atomic="true"
    >
      <span className="material-symbols-outlined" aria-hidden="true">
        {error ? 'error' : 'check_circle'}
      </span>
      <span>{children}</span>
    </p>,
    document.body
  );
}

export function AuthInput({ error, onChange, ...props }) {
  const [validation, setValidation] = useState('');
  const message = error || validation;
  return (
    <div className={`auth-input${message ? ' auth-input--invalid' : ''}`}>
      <input
        {...props}
        aria-invalid={Boolean(message)}
        aria-describedby={message ? `${props.id}-error` : undefined}
        onInvalid={(event) => {
          event.preventDefault();
          const input = event.currentTarget;
          setValidation(
            input.validity.valueMissing
              ? 'Vui lòng nhập thông tin này.'
              : input.validity.typeMismatch
                ? 'Địa chỉ email không hợp lệ.'
                : input.validity.tooShort
                  ? `Vui lòng nhập ít nhất ${props.minLength} ký tự.`
                  : 'Thông tin không hợp lệ.'
          );
        }}
        onChange={(event) => {
          setValidation('');
          onChange?.(event);
        }}
      />
      {message && (
        <span id={`${props.id}-error`} className="auth-input-error" role="alert" title={message}>
          {message}
        </span>
      )}
    </div>
  );
}
