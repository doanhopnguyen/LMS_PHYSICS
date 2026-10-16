import { LoadingIndicator } from './LoadingIndicator.jsx';
import React from 'react';
import { useFileSource } from '../hooks/useFileSource.js';

export function FileImage({ src, alt, ...props }) {
  const source = useFileSource({ fileUrl: src });
  if (source.loading)
    return (
      <LoadingIndicator inline className="text-body-sm text-slate-500">Đang tải ảnh…</LoadingIndicator>
    );
  if (source.error)
    return (
      <span role="alert" className="text-body-sm text-primary">
        {alt}: {source.error}
      </span>
    );
  return <img {...props} src={source.url} alt={alt} />;
}
