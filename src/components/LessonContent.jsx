import React, { useState } from 'react';
import { Button } from './Button.jsx';

export function LessonContent({ lesson, completed, onComplete, onPrevious, onNext }) {
  const [revealed, setRevealed] = useState(false);
  const [force, setForce] = useState(10);

  return <div className="lesson-content">
    <section><h3>Kiến thức trọng tâm</h3><p>{lesson.explanation}</p></section>
    <div className="lesson-formula" aria-label="Công thức">{lesson.formula}</div>
    <section><h3>Ví dụ minh họa</h3><p>{lesson.example}</p></section>
    {lesson.id === '02-3' && <section className="lesson-experiment">
      <h3>Thử thay đổi hợp lực</h3>
      <label htmlFor="lesson-force">Hợp lực: <strong>{force} N</strong> · Khối lượng: 2 kg</label>
      <input id="lesson-force" type="range" min="0" max="50" value={force} onChange={(event) => setForce(Number(event.target.value))} />
      <p>Gia tốc: <strong>{force / 2} m/s²</strong></p>
    </section>}
    <section className="lesson-question"><h3>Tự kiểm tra</h3><p>{lesson.question}</p>
      <button type="button" className="lesson-answer-toggle" aria-expanded={revealed} onClick={() => setRevealed(!revealed)}>{revealed ? 'Ẩn giải thích' : 'Xem giải thích'}</button>
      {revealed && <p className="lesson-answer">{lesson.answer}</p>}
    </section>
    <div className="lesson-controls">
      <Button variant="secondary" icon="arrow_back" disabled={!onPrevious} onClick={onPrevious}>Bài trước</Button>
      <Button icon="check" disabled={completed} onClick={onComplete}>{completed ? 'Đã học' : 'Đánh dấu đã học'}</Button>
      <Button variant="secondary" icon="arrow_forward" disabled={!onNext} onClick={onNext}>Bài tiếp</Button>
    </div>
  </div>;
}
