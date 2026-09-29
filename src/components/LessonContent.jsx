import React from 'react';
import { Button } from './Button.jsx';

const fileUrlOf = (material) => material?.downloadUrl || material?.fileUrl || material?.url || '';

export function LessonContent({ material, completed, saving, onComplete, onPrevious, onNext }) {
  const fileUrl = fileUrlOf(material);
  const isVideo = material?.type === 'VIDEO';

  return <div className="lesson-content">
    {material?.contentText && <section><h3>Nội dung học liệu</h3><div className="whitespace-pre-wrap leading-7 text-[#334155]">{material.contentText}</div></section>}
    {fileUrl && !isVideo && <section className="lesson-question"><h3>Tệp đính kèm</h3><p>Mở học liệu gốc do giảng viên cung cấp trong cửa sổ mới.</p><a href={fileUrl} target="_blank" rel="noreferrer"><Button variant="secondary" icon="open_in_new">Mở {material?.type === 'PDF' ? 'tệp PDF' : 'học liệu'}</Button></a></section>}
    {material?.sourceCitation && <section><h3>Nguồn học liệu</h3><p>{material.sourceCitation}</p></section>}
    {!material?.contentText && !fileUrl && <section className="lesson-question"><h3>Nội dung chưa được cung cấp</h3><p>Giảng viên đã công bố học liệu này nhưng chưa đính kèm nội dung hoặc tệp.</p></section>}
    <div className="lesson-controls">
      <Button variant="secondary" icon="arrow_back" disabled={!onPrevious} onClick={onPrevious}>Bài trước</Button>
      <Button icon="check" disabled={completed || saving} onClick={onComplete}>{completed ? 'Đã học' : saving ? 'Đang lưu…' : 'Đánh dấu đã học'}</Button>
      <Button variant="secondary" icon="arrow_forward" disabled={!onNext} onClick={onNext}>Bài tiếp</Button>
    </div>
  </div>;
}
