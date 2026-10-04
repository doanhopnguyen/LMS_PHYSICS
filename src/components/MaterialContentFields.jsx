import React, { useId, useState } from 'react';
import { Card } from './Card.jsx';
import { FormField } from './FormField.jsx';
import { MarkdownContent } from './MarkdownContent.jsx';
import { VideoSourceFields } from './VideoSourceFields.jsx';

export const materialFormats = [
  ['MARKDOWN', 'Markdown'],
  ['VIDEO', 'Video'],
  ['PDF', 'PDF'],
  ['TEXT', 'Văn bản'],
  ['SLIDE', 'Slide'],
  ['OTHER', 'Tệp khác'],
];

export function MaterialContentFields({ type, initial = {}, busy = false }) {
  const [content, setContent] = useState(initial.contentText || '');
  const editorId = useId();
  const previewId = useId();
  if (type === 'MARKDOWN')
    return (
      <div className="markdown-editor">
        <Card className="markdown-editor__pane">
          <div className="markdown-editor__heading">
            <span className="material-symbols-outlined" aria-hidden="true">
              code
            </span>
            <label htmlFor={editorId}>Nội dung Markdown *</label>
          </div>
          <div className="markdown-editor__body markdown-editor__body--code">
            <FormField
              id={editorId}
              data-fixed-corners
              bare
              name="contentText"
              multiline
              required
              rows={20}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              disabled={busy}
              placeholder="# Tiêu đề bài học"
              className="markdown-editor__input"
            />
          </div>
        </Card>
        <Card className="markdown-editor__pane" aria-labelledby={previewId}>
          <div className="markdown-editor__heading">
            <span className="material-symbols-outlined" aria-hidden="true">
              visibility
            </span>
            <h3 id={previewId}>Xem trước Markdown</h3>
          </div>
          <div className="markdown-editor__body markdown-editor__preview">
            {content.trim() ? (
              <MarkdownContent content={content} />
            ) : (
              <p className="text-slate-500">Nhập nội dung bên trái để xem trước bài học.</p>
            )}
          </div>
        </Card>
      </div>
    );
  if (type === 'VIDEO')
    return (
      <>
        <FormField
          label="Nội dung / mô tả"
          name="contentText"
          multiline
          rows={6}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          disabled={busy}
        />
        <VideoSourceFields initial={initial} busy={busy} />
      </>
    );
  if (type === 'TEXT')
    return (
      <FormField
        label="Nội dung *"
        name="contentText"
        multiline
        required
        rows={12}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        disabled={busy}
      />
    );
  return (
    <>
      {initial.fileUrl && <p className="text-body-sm text-slate-500">Đã có tệp. Chọn tệp mới nếu muốn thay thế.</p>}
      <FormField
        label="Tệp học liệu *"
        name="file"
        type="file"
        accept={type === 'PDF' ? '.pdf,application/pdf' : undefined}
        required={!initial.fileUrl || initial.type !== type}
        disabled={busy}
      />
    </>
  );
}
