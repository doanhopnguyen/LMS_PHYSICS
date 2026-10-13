import { MarkdownContent } from './MarkdownContent.jsx';
import React from 'react';
import { Button } from './Button.jsx';
import { MaterialFilePreview } from './MaterialFilePreview.jsx';
import { MaterialSource } from './MaterialSource.jsx';

const fileUrlOf = (material) => material?.downloadUrl || material?.fileUrl || material?.url || '';

export function LessonContent({
  material,
  completed,
  saving,
  completionBlocked = false,
  onComplete,
  onPrevious,
  onNext,
}) {
  const fileUrl = fileUrlOf(material);
  const isVideo = material?.type === 'VIDEO';

  return (
    <div className="lesson-content">
      {material?.contentText && (
        <section>
          <h3>Nội dung học liệu</h3>
          {material.type === 'MARKDOWN' ? (
            <MarkdownContent content={material.contentText} />
          ) : (
            <div className="whitespace-pre-wrap leading-7 text-[#334155]">{material.contentText}</div>
          )}
        </section>
      )}
      {fileUrl && !isVideo && (
        <section className="lesson-question">
          <h3>Tài liệu học tập</h3>
          <MaterialFilePreview key={material.materialId || fileUrl} material={material} />
        </section>
      )}
      {material?.sourceCitation && !isVideo && (
        <section>
          <h3>Nguồn học liệu</h3>
          <MaterialSource value={material.sourceCitation} title={material.title} />
        </section>
      )}
      {!material?.contentText && !fileUrl && !material?.sourceCitation && (
        <section className="lesson-question">
          <h3>Nội dung chưa được cung cấp</h3>
          <p>Giảng viên đã công bố học liệu này nhưng chưa đính kèm nội dung hoặc tệp.</p>
        </section>
      )}
      <div className="lesson-controls">
        <Button variant="secondary" icon="arrow_back" disabled={!onPrevious} onClick={onPrevious}>
          Bài trước
        </Button>
        <Button icon="check" disabled={completed || saving || completionBlocked} onClick={onComplete}>
          {completed
            ? 'Đã học'
            : saving
              ? 'Đang lưu…'
              : completionBlocked
                ? 'Xem hết video để hoàn thành'
                : 'Đánh dấu đã học'}
        </Button>
        <Button variant="secondary" icon="arrow_forward" disabled={!onNext} onClick={onNext}>
          Bài tiếp
        </Button>
      </div>
    </div>
  );
}
