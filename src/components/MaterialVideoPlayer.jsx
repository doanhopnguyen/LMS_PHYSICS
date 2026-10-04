import React from 'react';
import { materialVideoSource } from '../lib/materialSources.js';

export function MaterialVideoPlayer({ material, fill = false }) {
  const source = materialVideoSource(material);
  if (!source) return <p className="p-4 text-slate-500">Video bài giảng chưa được cung cấp.</p>;
  const className = fill ? 'min-h-0 w-full flex-1 border-0' : 'aspect-video w-full rounded-xl border-0';
  return source.type === 'embed' ? (
    <iframe
      title={material.title || 'Video bài giảng'}
      src={source.url}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      className={className}
    />
  ) : (
    <video
      aria-label={material.title || 'Video bài giảng'}
      src={source.url}
      controls
      playsInline
      preload="metadata"
      className={className}
    />
  );
}
