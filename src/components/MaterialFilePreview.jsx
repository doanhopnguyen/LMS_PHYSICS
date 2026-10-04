import React, { useEffect, useState } from 'react';
import { Button } from './Button.jsx';
import { FormDialog } from './FormDialog.jsx';
import { previewType, formatJson } from '../lib/evidencePreview.js';
import { safeUrl } from '../lib/lecturerUtils.js';
import { MaterialVideoPlayer } from './MaterialVideoPlayer.jsx';

export function MaterialFilePreview({ material, fill = false }) {
  const [attempt, setAttempt] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    if (material.type === 'VIDEO') return;
    const controller = new AbortController();
    let objectUrl;
    setState({ loading: true });
    (async () => {
      const source = safeUrl(material.downloadUrl || material.fileUrl || material.url);
      if (!source) throw new Error('Không có liên kết tài liệu hợp lệ.');
      const response = await fetch(source, { signal: controller.signal });
      if (!response.ok) throw new Error(`Không thể tải tài liệu (${response.status}).`);
      const blob = await response.blob();
      const name = material.fileName || decodeURIComponent(new URL(source).pathname.split('/').pop()) || material.title;
      const type = previewType(
        name,
        blob.type === 'application/octet-stream' && material.type === 'PDF' ? 'application/pdf' : blob.type
      );
      const text = ['text', 'json'].includes(type) ? await blob.text() : '';
      if (controller.signal.aborted) return;
      objectUrl = URL.createObjectURL(type === 'pdf' ? new Blob([blob], { type: 'application/pdf' }) : blob);
      setState({ loading: false, url: objectUrl, type, text, name });
    })().catch((error) => {
      if (!controller.signal.aborted) setState({ loading: false, error: error.message });
    });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [material.downloadUrl, material.fileUrl, material.url, material.fileName, material.title, material.type, attempt]);
  if (material.type === 'VIDEO') return <MaterialVideoPlayer material={material} fill={fill} />;
  if (state.loading) return <p role="status">Đang tải tài liệu…</p>;
  if (state.error)
    return (
      <div className="space-y-3">
        <p role="alert">{state.error}</p>
        <Button variant="secondary" onClick={() => setAttempt((value) => value + 1)}>
          Thử lại
        </Button>
      </div>
    );
  const immersive = fill || expanded;
  const preview = (
    <section
      aria-label="Trình xem tài liệu"
      className={immersive ? 'flex min-h-0 w-full flex-1 flex-col overflow-hidden' : 'space-y-3'}
    >
      {!immersive && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="secondary"
            icon={expanded ? 'fullscreen_exit' : 'fullscreen'}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? 'Thu gọn' : 'Mở rộng khung xem'}
          </Button>
          <a href={state.url} download={state.name} className="inline-block font-semibold text-primary underline">
            Tải tài liệu
          </a>
        </div>
      )}
      {state.type === 'pdf' && (
        <iframe
          title={`Tài liệu: ${material.title}`}
          src={state.url}
          className={
            immersive
              ? 'min-h-0 w-full flex-1 border-0'
              : 'h-[80dvh] min-h-[240px] w-full rounded-xl border border-slate-200'
          }
        />
      )}
      {state.type === 'image' && (
        <img
          src={state.url}
          alt={material.title || 'Tài liệu học tập'}
          className={
            immersive ? 'min-h-0 w-full flex-1 object-contain' : 'mx-auto max-h-[80dvh] max-w-full object-contain'
          }
        />
      )}
      {state.type === 'video' && (
        <video
          src={state.url}
          controls
          preload="metadata"
          className={immersive ? 'min-h-0 w-full flex-1' : 'max-h-[80dvh] w-full'}
        />
      )}
      {state.type === 'audio' && <audio src={state.url} controls preload="metadata" className="w-full" />}
      {['text', 'json'].includes(state.type) && (
        <pre
          className={`${immersive ? 'min-h-0 flex-1' : 'max-h-[80dvh] rounded-xl'} overflow-auto whitespace-pre-wrap break-words bg-slate-50 p-4 text-body-sm`}
        >
          {state.type === 'json' ? formatJson(state.text) : state.text}
        </pre>
      )}
      {state.type === 'download' && (
        <div className="p-4">
          <p>Định dạng tài liệu này chưa hỗ trợ xem trực tiếp trong trình duyệt.</p>
          {immersive && (
            <a href={state.url} download={state.name} className="font-semibold text-primary underline">
              Tải tài liệu
            </a>
          )}
        </div>
      )}
    </section>
  );
  return expanded ? (
    <FormDialog title={material.title || 'Tài liệu học tập'} reader onClose={() => setExpanded(false)}>
      {preview}
    </FormDialog>
  ) : (
    preview
  );
}
