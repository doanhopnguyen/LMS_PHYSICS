import React, { useMemo, useRef, useState } from 'react';
import { Card } from './Card.jsx';
import { Button } from './Button.jsx';
import { StatusBadge } from './StatusBadge.jsx';
import { FormDialog } from './FormDialog.jsx';
import { dateKey } from '../lib/datePicker.js';
import { labelOf } from '../lib/lecturerUtils.js';
import { calendarDays, normalizeCalendarEvent, eventsForDay, calendarStatus } from '../lib/monthlyCalendar.js';

const typeLabels = {
  EXAM: 'Kỳ thi',
  CLASS: 'Lớp học',
  EXPERIMENT: 'Thí nghiệm',
  ASSIGNMENT: 'Bài tập',
  PERSONAL: 'Cá nhân',
  OTHER: 'Sự kiện',
};
const statusLabels = {
  UPCOMING: 'Sắp diễn ra',
  ONGOING: 'Đang diễn ra',
  COMPLETED: 'Đã kết thúc',
  CANCELLED: 'Đã hủy',
  DRAFT: 'Bản nháp',
};
const statusTones = {
  UPCOMING: 'warning',
  ONGOING: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  DRAFT: 'neutral',
};
const timeText = (date, locale) => date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
const dateText = (date, locale) =>
  date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });

export function CalendarEvent({ event, onClick, locale = 'vi-VN' }) {
  const type = typeLabels[event.type] ? event.type.toLowerCase() : 'other';
  return (
    <button
      type="button"
      className={`monthly-event monthly-event--${type}`}
      title={event.title}
      aria-label={`${event.allDay ? '' : timeText(event.start, locale) + ', '}${event.title}`}
      onClick={(click) => {
        click.stopPropagation();
        onClick(event, click.currentTarget);
      }}
    >
      {!event.allDay && <span className="monthly-event__time">{timeText(event.start, locale)}</span>}
      <span className="monthly-event__title">{event.title}</span>
    </button>
  );
}

export function EventDetailModal({ event, onClose, locale = 'vi-VN', canEdit, canDelete, onEdit, onDelete }) {
  const status = calendarStatus(event);
  const fields = [
    [
      'Ngày',
      dateText(event.start, locale) +
        (event.end && dateKey(event.end) !== dateKey(event.start) ? ` – ${dateText(event.end, locale)}` : ''),
      'calendar_today',
    ],
    [
      'Thời gian',
      event.allDay ? 'Cả ngày' : timeText(event.start, locale) + (event.end ? ` – ${timeText(event.end, locale)}` : ''),
      'schedule',
    ],
    ['Địa điểm', event.location, 'location_on'],
    ['Môn học', event.subjectName, 'menu_book'],
    ['Lớp học', event.className, 'groups'],
    ['Giảng viên', event.lecturer, 'person'],
    ['Người tạo', event.createdBy, 'person'],
    ['Số người tham gia', event.participants, 'groups'],
    ['Loại đề', event.examType ? labelOf(event.examType) : null, 'quiz'],
    ['Thời lượng', event.durationMinutes != null ? `${event.durationMinutes} phút` : null, 'timer'],
    ['Số câu hỏi', event.totalQuestions, 'help'],
  ].filter(([, value]) => value !== null && value !== undefined && value !== '');
  return (
    <FormDialog title="Chi tiết sự kiện" onClose={onClose} compact>
      <h3 className="text-title-lg font-medium break-words">{event.title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge tone="neutral">{typeLabels[event.type] || 'Sự kiện'}</StatusBadge>
        {status && <StatusBadge tone={statusTones[status]}>{statusLabels[status]}</StatusBadge>}
      </div>
      <dl className="monthly-event-details">
        {fields.map(([name, value, icon]) => (
          <div key={name}>
            <span className="material-symbols-outlined" aria-hidden="true">
              {icon}
            </span>
            <div>
              <dt>{name}</dt>
              <dd>{value}</dd>
            </div>
          </div>
        ))}
      </dl>
      {event.description && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <h4 className="text-body-sm text-slate-500">Mô tả</h4>
          <p className="mt-1 whitespace-pre-wrap break-words text-body-md">{event.description}</p>
        </div>
      )}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        {canDelete?.(event) === true && onDelete && (
          <Button variant="ghost" onClick={() => onDelete(event)}>
            Xóa
          </Button>
        )}
        {canEdit?.(event) === true && onEdit && (
          <Button variant="secondary" onClick={() => onEdit(event)}>
            Chỉnh sửa
          </Button>
        )}
        <Button variant="secondary" onClick={onClose}>
          Đóng
        </Button>
        {event.href && (
          <a className="monthly-detail-link" href={event.href}>
            {event.detailLabel || 'Xem chi tiết'}
          </a>
        )}
      </div>
    </FormDialog>
  );
}

export function MonthlyCalendar({
  events = [],
  initialMonth = new Date(),
  loading = false,
  error = '',
  onRetry,
  title = 'Lịch sự kiện',
  description,
  locale = 'vi-VN',
  maxVisibleEvents = 2,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onMonthChange,
}) {
  const [month, setMonth] = useState(() => new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1));
  const [selectedEvent, setSelectedEvent] = useState(null),
    [selectedDay, setSelectedDay] = useState(null);
  const returnFocus = useRef(null);
  const normalized = useMemo(() => events.map(normalizeCalendarEvent).filter(Boolean), [events]);
  const days = useMemo(() => calendarDays(month), [month]);
  const daily = useMemo(() => days.map((day) => ({ day, events: eventsForDay(normalized, day) })), [days, normalized]);
  const limit = Math.max(1, Math.min(3, Number(maxVisibleEvents) || 2));
  const changeMonth = (next) => {
    const first = new Date(next.getFullYear(), next.getMonth(), 1);
    setMonth(first);
    setSelectedDay(null);
    setSelectedEvent(null);
    onMonthChange?.(first, calendarDays(first));
  };
  const weekdays =
    locale === 'vi-VN'
      ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
      : Array.from({ length: 7 }, (_, index) =>
          new Date(2026, 0, 5 + index).toLocaleDateString(locale, { weekday: 'short' })
        );
  const monthTitle =
    locale === 'vi-VN'
      ? `Tháng ${month.getMonth() + 1}, ${month.getFullYear()}`
      : month.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const openEvent = (event, target) => {
    if (!selectedDay) returnFocus.current = target;
    setSelectedDay(null);
    setSelectedEvent(event);
  };
  const closeModal = () => {
    setSelectedDay(null);
    setSelectedEvent(null);
    requestAnimationFrame(() => returnFocus.current?.isConnected && returnFocus.current.focus({ preventScroll: true }));
  };
  return (
    <Card
      className="monthly-calendar"
      aria-label={title}
      style={{
        '--calendar-cell-height': limit === 3 ? '172px' : '144px',
        '--calendar-cell-height-mobile': limit === 3 ? '164px' : '128px',
      }}
    >
      <header className="monthly-calendar__header">
        <div>
          <h2>{title}</h2>
          <p aria-live="polite">{monthTitle}</p>
        </div>
        <div className="monthly-calendar__controls">
          <Button
            variant="secondary"
            aria-label="Tháng trước"
            onClick={() => changeMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            icon="chevron_left"
          />
          <Button variant="secondary" onClick={() => changeMonth(new Date())}>
            Hôm nay
          </Button>
          <Button
            variant="secondary"
            aria-label="Tháng sau"
            onClick={() => changeMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            icon="chevron_right"
          />
        </div>
      </header>
      {description && <p className="monthly-calendar__description">{description}</p>}
      <div
        className="monthly-calendar__scroll"
        tabIndex={0}
        aria-label="Lịch tháng, có thể cuộn ngang trên màn hình nhỏ"
        aria-busy={loading}
      >
        <div className="monthly-calendar__grid" role="table" aria-label={monthTitle}>
          <div className="monthly-calendar__weekdays" role="row">
            {weekdays.map((day) => (
              <span key={day} role="columnheader">
                {day}
              </span>
            ))}
          </div>
          {Array.from({ length: days.length / 7 }, (_, week) => (
            <div key={week} className="monthly-calendar__week" role="row">
              {daily.slice(week * 7, week * 7 + 7).map(({ day, events: rows }) => (
                <div
                  key={dateKey(day)}
                  role="cell"
                  className="monthly-day"
                  data-date={dateKey(day)}
                  data-outside={day.getMonth() !== month.getMonth()}
                  data-today={dateKey(day) === dateKey(new Date())}
                  aria-label={dateText(day, locale)}
                >
                  <span
                    className="monthly-day__number"
                    aria-current={dateKey(day) === dateKey(new Date()) ? 'date' : undefined}
                  >
                    {day.getDate()}
                  </span>
                  <div className="monthly-day__events">
                    {rows.slice(0, limit).map((event) => (
                      <CalendarEvent key={event.id} event={event} onClick={openEvent} locale={locale} />
                    ))}
                    {rows.length > limit && (
                      <button
                        type="button"
                        className="monthly-day__more"
                        data-count={rows.length - limit}
                        onClick={(event) => {
                          event.stopPropagation();
                          returnFocus.current = event.currentTarget;
                          setSelectedDay(day);
                        }}
                        aria-label={`${dateText(day, locale)}, ${rows.length - limit} sự kiện khác`}
                      >
                        +{rows.length - limit} sự kiện khác
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="monthly-calendar__feedback" aria-live="polite">
        {loading ? (
          <p role="status">Đang tải lịch sự kiện…</p>
        ) : error ? (
          <p role="alert">
            {error}{' '}
            {onRetry && (
              <Button variant="ghost" onClick={onRetry}>
                Thử lại
              </Button>
            )}
          </p>
        ) : !daily.some(({ day, events: rows }) => day.getMonth() === month.getMonth() && rows.length) ? (
          <p>Tháng này chưa có sự kiện.</p>
        ) : null}
      </div>
      {selectedDay && (
        <FormDialog title={`Sự kiện ngày ${dateText(selectedDay, locale)}`} compact onClose={closeModal}>
          <div className="monthly-day-list">
            {eventsForDay(normalized, selectedDay).map((event) => (
              <CalendarEvent key={event.id} event={event} onClick={openEvent} locale={locale} />
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="secondary" onClick={closeModal}>
              Đóng
            </Button>
          </div>
        </FormDialog>
      )}
      {selectedEvent && (
        <EventDetailModal
          key={selectedEvent.id}
          event={selectedEvent}
          onClose={closeModal}
          locale={locale}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </Card>
  );
}
