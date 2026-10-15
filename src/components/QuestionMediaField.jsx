import React, { useEffect, useRef, useState } from 'react';
import { FormField } from './FormField.jsx';
import { Button } from './Button.jsx';
import { ProgressBar } from './ProgressBar.jsx';
import { api } from '../lib/apiClient.js';
import { validateChunkFile } from '../lib/chunkUpload.js';

export function QuestionMediaField({ initialUrl = '', disabled = false, onPendingChange }) {
  const [url, setUrl] = useState(() => (initialUrl.startsWith('/') ? api.files.resolveUrl(initialUrl) : initialUrl));
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const input = useRef(null);
  const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);

  const upload = async (selected) => {
    if (controller.current || disabled) return;
    try {
      validateChunkFile(selected);
      if (!selected.type.startsWith('image/') && !/\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i.test(selected.name))
        throw new Error('Vui lòng chọn một tệp hình ảnh.');
    } catch (validationError) {
      setFile(null);
      setProgress(null);
      setError(validationError.message);
      onPendingChange?.(false);
      if (input.current) input.current.value = '';
      return;
    }
    const active = new AbortController();
    controller.current = active;
    setFile(selected);
    setUploading(true);
    setProgress(null);
    setError('');
    onPendingChange?.(true);
    try {
      const result = await api.files.upload(selected, {
        signal: active.signal,
        onProgress: (value) => {
          if (!active.signal.aborted) setProgress(value);
        },
      });
      if (active.signal.aborted) return;
      setUrl(api.files.resolveUrl(result.fileUrl));
      onPendingChange?.(false);
    } catch (uploadError) {
      if (!active.signal.aborted) setError(uploadError.message || 'Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      if (!active.signal.aborted) {
        setUploading(false);
        controller.current = null;
      }
    }
  };
  const clearSelection = () => {
    setFile(null);
    setError('');
    setProgress(null);
    if (input.current) input.current.value = '';
    onPendingChange?.(false);
  };
  return (
    <div className="space-y-3">
      <FormField
        label="Ảnh minh họa (không bắt buộc)"
        type="file"
        accept="image/*"
        ref={input}
        disabled={disabled || uploading}
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (selected) upload(selected);
        }}
      />
      <p className="text-body-sm text-[#64748B]">
        Chọn ảnh từ thiết bị hoặc nhập URL bên dưới. Dung lượng tối đa 50 MB.
      </p>
      {progress && (
        <div className="space-y-2">
          <ProgressBar value={progress.percent} />
          <p role="status" className="text-body-sm text-[#64748B]">
            {progress.phase === 'completed'
              ? `Đã tải ảnh: ${file?.name}`
              : progress.phase === 'merging'
                ? 'Đang hoàn tất tệp ảnh…'
                : `Đang tải ảnh: ${progress.percent}%`}
          </p>
        </div>
      )}
      {error && (
        <p role="alert" className="text-body-sm text-primary">
          {error}
        </p>
      )}
      {error && file && (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={disabled || uploading} onClick={() => upload(file)}>
            Thử lại tải ảnh
          </Button>
          <Button variant="secondary" disabled={disabled || uploading} onClick={clearSelection}>
            Bỏ tệp đã chọn
          </Button>
        </div>
      )}
      <FormField
        label="URL hình ảnh"
        name="mediaUrl"
        type="url"
        value={url}
        disabled={disabled || uploading}
        onChange={(event) => {
          setUrl(event.target.value);
          clearSelection();
          try {
            api.files.persistedUrl(event.target.value);
          } catch (failure) {
            setError(failure.message);
            onPendingChange?.(true);
          }
        }}
      />
    </div>
  );
}
