import React from 'react';
import { materialVideoSource } from '../lib/materialSources.js';
import { useFileSource } from '../hooks/useFileSource.js';

export function MaterialVideoPlayer({ material, fill = false }) {
  const source = materialVideoSource(material);
  const playback = useFileSource(
    {
      fileId:
        !source?.url || source.url === (material.downloadUrl || material.fileUrl || material.url)
          ? material.fileId
          : undefined,
      fileUrl: source?.url,
    },
    { enabled: source?.type === 'video' }
  );
  if (!source) return <p className="p-4 text-slate-500">Video bài giảng chưa được cung cấp.</p>;
  if (source.type === 'video' && playback.loading) return <p role="status">Đang tải video…</p>;
  if (source.type === 'video' && playback.error)
    return (
      <p role="alert">
        {playback.error}{' '}
        <button type="button" onClick={playback.retry}>
          Thử lại
        </button>
      </p>
    );
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
      src={playback.url}
      controls
      playsInline
      preload="metadata"
      className={className}
    />
  );
}
