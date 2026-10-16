import React, { useEffect, useState } from 'react';
import { MediaViewer, ViewerStatus } from './MediaViewer.jsx';
import { previewType, formatJson } from '../lib/evidencePreview.js';
import { api } from '../lib/apiClient.js';
import { MaterialVideoPlayer } from './MaterialVideoPlayer.jsx';
import { MarkdownContent } from './MarkdownContent.jsx';

export function MaterialFilePreview({ material, fill = false, compact = false }) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    if (material.type === 'VIDEO') return;
    const controller = new AbortController();
    let objectUrl;
    setState({ loading: true });
    (async () => {
      const { blob, fileName: name } = await api.files.read(material, { signal: controller.signal });
      const isMarkdown =
        material.type === 'MARKDOWN' ||
        /\.(md|markdown)$/i.test(name) ||
        ['text/markdown', 'text/x-markdown'].includes(blob.type.split(';')[0].trim().toLowerCase());
      const type = isMarkdown
        ? 'markdown'
        : previewType(
            name,
            blob.type === 'application/octet-stream' && material.type === 'PDF' ? 'application/pdf' : blob.type
          );
      const text = ['markdown', 'text', 'json'].includes(type) ? await blob.text() : '';
      if (controller.signal.aborted) return;
      objectUrl = URL.createObjectURL(type === 'pdf' ? new Blob([blob], { type: 'application/pdf' }) : blob);
      setState({ loading: false, url: objectUrl, type, text, name, size: blob.size });
    })().catch((error) => {
      if (!controller.signal.aborted) setState({ loading: false, error: error.message });
    });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [
    material.fileId,
    material.downloadUrl,
    material.fileUrl,
    material.url,
    material.fileName,
    material.title,
    material.type,
    attempt,
  ]);
  if (material.type === 'VIDEO') return <MaterialVideoPlayer material={material} fill={fill} compact={compact} />;
  if (state.type === 'pdf' || material.type === 'PDF') {
    if (state.loading) return <ViewerStatus>Đang tải tài liệu…</ViewerStatus>;
    if (state.error)
      return (
        <ViewerStatus error onRetry={() => setAttempt((value) => value + 1)}>
          {state.error}
        </ViewerStatus>
      );
    return (
      <MediaViewer nativePdf title={material.title || state.name} label="PDF" fill={fill}>
        <iframe title={`Tài liệu: ${material.title || state.name}`} src={state.url} />
      </MediaViewer>
    );
  }
  const labels = {
    pdf: 'PDF',
    image: 'Hình ảnh',
    video: 'Video',
    audio: 'Âm thanh',
    markdown: 'Markdown',
    text: 'Văn bản',
    json: 'JSON',
  };
  const size =
    state.size >= 1024 * 1024
      ? `${(state.size / 1024 / 1024).toFixed(1)} MB`
      : `${Math.max(1, Math.ceil(state.size / 1024))} KB`;
  return (
    <MediaViewer
      title={state.name || material.fileName || material.title}
      label={labels[state.type] || 'Tài liệu'}
      icon={state.type === 'pdf' ? 'picture_as_pdf' : state.type === 'image' ? 'image' : 'description'}
      meta={state.size ? size : undefined}
      fill={fill}
      compact={compact}
      actions={
        state.url && (
          <>
            <a
              className="media-viewer__action"
              href={state.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Mở tài liệu trong tab mới"
              aria-label="Mở tài liệu trong tab mới"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                open_in_new
              </span>
              <span>Tab mới</span>
            </a>
            <a
              className="media-viewer__action"
              href={state.url}
              download={state.name}
              aria-label="Tải tài liệu"
              title="Tải tài liệu"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                download
              </span>
              <span>Tải tài liệu</span>
            </a>
          </>
        )
      }
    >
      {state.loading ? (
        <ViewerStatus>Đang tải tài liệu…</ViewerStatus>
      ) : state.error ? (
        <ViewerStatus error onRetry={() => setAttempt((value) => value + 1)}>
          {state.error}
        </ViewerStatus>
      ) : (
        <>
          {state.type === 'image' && (
            <div className="media-viewer__stage media-viewer__stage--image">
              <img src={state.url} alt={material.title || 'Tài liệu học tập'} />
            </div>
          )}
          {state.type === 'video' && (
            <div className="media-viewer__stage media-viewer__stage--video">
              <video src={state.url} controls playsInline preload="metadata" />
            </div>
          )}
          {state.type === 'audio' && (
            <div className="media-viewer__stage media-viewer__stage--audio">
              <audio src={state.url} controls preload="metadata" />
            </div>
          )}
          {state.type === 'markdown' && (
            <article className="media-viewer__reading">
              <MarkdownContent content={state.text} />
            </article>
          )}
          {['text', 'json'].includes(state.type) && (
            <div className="media-viewer__reading">
              <pre>{state.type === 'json' ? formatJson(state.text) : state.text}</pre>
            </div>
          )}
          {state.type === 'download' && (
            <div className="media-viewer__status">
              <span className="material-symbols-outlined" aria-hidden="true">
                folder_zip
              </span>
              <strong>Tệp đã sẵn sàng</strong>
              <p>Định dạng này chưa hỗ trợ xem trực tiếp. Tải tài liệu để mở bằng ứng dụng trên thiết bị.</p>
            </div>
          )}
        </>
      )}
    </MediaViewer>
  );
}
