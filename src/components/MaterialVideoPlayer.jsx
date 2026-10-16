import React, { useState } from 'react';
import { materialVideoSource } from '../lib/materialSources.js';
import { useFileSource } from '../hooks/useFileSource.js';
import { MediaViewer, ViewerStatus } from './MediaViewer.jsx';

export function MaterialVideoPlayer({ material, fill = false, compact = false }) {
  const source = materialVideoSource(material);
  const [failedUrl, setFailedUrl] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const playback = useFileSource(
    {
      fileId:
        !source?.url || source.url === (material.downloadUrl || material.fileUrl || material.url)
          ? material.fileId
          : undefined,
      fileUrl: source?.url,
    },
    { enabled: source?.type === 'video', attempt }
  );
  const error =
    playback.error || (failedUrl === playback.url && failedUrl ? 'Không thể phát video. Vui lòng thử lại.' : '');
  return (
    <MediaViewer
      title={material.title || 'Video bài giảng'}
      label="Video"
      icon="play_circle"
      fill={fill}
      compact={compact}
      meta={source?.type === 'embed' ? (source.url.includes('youtube') ? 'YouTube' : 'Vimeo') : 'Video bài giảng'}
    >
      {!source ? (
        <ViewerStatus error>Video bài giảng chưa được cung cấp.</ViewerStatus>
      ) : source.type === 'video' && playback.loading ? (
        <ViewerStatus>Đang tải video…</ViewerStatus>
      ) : error ? (
        <ViewerStatus
          error
          onRetry={() => {
            setFailedUrl(null);
            setAttempt((value) => value + 1);
          }}
        >
          {error}
        </ViewerStatus>
      ) : (
        <div className="media-viewer__stage media-viewer__stage--video">
          {source.type === 'embed' ? (
            <iframe
              title={material.title || 'Video bài giảng'}
              src={source.url}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <video
              key={`${playback.url}-${attempt}`}
              aria-label={material.title || 'Video bài giảng'}
              src={playback.url}
              controls
              playsInline
              preload="metadata"
              onError={() => setFailedUrl(playback.url)}
            />
          )}
        </div>
      )}
    </MediaViewer>
  );
}
