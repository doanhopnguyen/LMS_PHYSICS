import React, { useState } from 'react';
import { materialVideoSource } from '../lib/materialSources.js';
import { useSignedMaterial } from '../hooks/useSignedMaterial.js';
import { Button } from './Button.jsx';

export function MaterialVideoPlayer({ material, fill = false }) {
  const resolved = useSignedMaterial(material);
  const [mediaError, setMediaError] = useState(false);
  const source = materialVideoSource(resolved.material);
  if (resolved.loading) return <p role="status">Đang tải video…</p>;
  if (resolved.error)
    return (
      <div role="alert">
        {resolved.error}
        <Button variant="secondary" onClick={resolved.refresh}>
          Thử lại
        </Button>
      </div>
    );
  if (mediaError)
    return (
      <div role="alert">
        Không thể phát video.
        <Button
          variant="secondary"
          onClick={() => {
            setMediaError(false);
            resolved.refresh();
          }}
        >
          Thử lại
        </Button>
      </div>
    );
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
      onError={() => setMediaError(true)}
      className={className}
    />
  );
}
