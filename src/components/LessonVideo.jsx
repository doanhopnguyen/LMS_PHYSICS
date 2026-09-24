import React, { useEffect, useRef, useState } from 'react';
import { Card } from './Card.jsx';

const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

export function LessonVideo({ lesson }) {
  const player = useRef(null);
  const picker = useRef(null);
  const [localSource, setLocalSource] = useState('');
  const [error, setError] = useState('');
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState('1');
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);
  const source = localSource || lesson.video?.src;

  useEffect(() => () => { if (localSource) URL.revokeObjectURL(localSource); }, [localSource]);

  const selectVideo = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setError('Vui lòng chọn một tệp video.');
      return;
    }
    setError('');
    setTime(0);
    setDuration(0);
    setSpeed('1');
    setNotes([]);
    setLocalSource(URL.createObjectURL(file));
    event.target.value = '';
  };

  return (
    <div className="lesson-video">
      <div className="lesson-video__player">
        {source ? (
          <video key={source} ref={player} src={source} controls playsInline preload="metadata" aria-label={`Video bài học: ${lesson.title}`}
            onLoadedMetadata={() => setDuration(Number.isFinite(player.current.duration) ? player.current.duration : 0)}
            onTimeUpdate={() => setTime(player.current.currentTime)}
            onError={() => setError('Không thể phát video này. Vui lòng chọn tệp MP4 hoặc WebM khác.')}>
            Trình duyệt không hỗ trợ phát video.
          </video>
        ) : (
          <div className="lesson-video__placeholder">
            <span className="lesson-video__badge">VIDEO BÀI GIẢNG</span>
            <span className="material-symbols-outlined lesson-video__symbol" aria-hidden="true">ondemand_video</span>
            <h2>{lesson.title}</h2>
            <p>Video bài giảng chưa được cung cấp.</p>
            <button type="button" onClick={() => picker.current.click()}><span className="material-symbols-outlined" aria-hidden="true">video_file</span>Chọn video để xem thử</button>
          </div>
        )}
      </div>
      <input ref={picker} type="file" accept="video/*" className="sr-only" tabIndex={-1} onChange={selectVideo} aria-label="Chọn video minh họa từ thiết bị" />
      {error && <p className="lesson-video__error" role="alert">{error}</p>}
      <div className="lesson-video__toolbar">
        <span className="lesson-video__time"><span className="material-symbols-outlined" aria-hidden="true">schedule</span>{formatTime(time)} / {formatTime(duration)}</span>
        <label>Tốc độ <select value={speed} disabled={!source || !!error} onChange={(event) => { setSpeed(event.target.value); if (player.current) player.current.playbackRate = Number(event.target.value); }}>
          {['0.5', '0.75', '1', '1.25', '1.5', '2'].map(value => <option key={value} value={value}>{value}×</option>)}
        </select></label>
        {source && <button type="button" onClick={() => picker.current.click()}>Đổi video minh họa</button>}
      </div>
      <p className="lesson-video__demo">Xem thử trên thiết bị · Video không được tải lên hệ thống.</p>
      <Card className="lesson-video__notes">
        <div className="lesson-video__notes-heading"><h3>Ghi chú theo thời gian</h3><span>Lưu trong phiên xem</span></div>
        <form onSubmit={(event) => { event.preventDefault(); if (!note.trim() || !duration) return; setNotes(current => [...current, { id: Date.now(), time, text: note.trim() }]); setNote(''); }}>
          <label className="sr-only" htmlFor="video-note">Nội dung ghi chú</label>
          <input id="video-note" value={note} onChange={event => setNote(event.target.value)} placeholder="Ghi lại điều cần nhớ tại thời điểm đang xem…" disabled={!duration || !!error} />
          <button type="submit" disabled={!duration || !note.trim() || !!error}>Lưu tại {formatTime(time)}</button>
        </form>
        {notes.length > 0 && <ol>{notes.map(item => <li key={item.id}><button type="button" aria-label={`Tua đến ${formatTime(item.time)}`} onClick={() => { if (player.current) player.current.currentTime = item.time; }}>{formatTime(item.time)}</button><p>{item.text}</p></li>)}</ol>}
      </Card>
    </div>
  );
}
