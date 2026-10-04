import React, { useEffect, useRef, useState } from 'react';
import { SelectField } from '../../components/SelectField.jsx';
import { FormField } from '../../components/FormField.jsx';
import { Form, SubmitButton } from '../../components/Form.jsx';
import { DetailToolbar } from '../../components/DetailToolbar.jsx';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { useChatAutoScroll } from '../../hooks/useChatAutoScroll.js';
import { useApiData, listItems } from '../../hooks/useApiData.js';
import { api, apiRequest } from '../../lib/apiClient.js';
import { loadAllPages, safeUrl } from '../../lib/lecturerUtils.js';

const questions = [
  'Giải thích định luật II Newton',
  'Tại sao vật rơi tự do có gia tốc g?',
  'Gợi ý cách giải bài tập về lực ma sát',
];
const dateLabel = (value) =>
  value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleDateString('vi-VN') : 'Hội thoại';

export function AiTutorPage() {
  const [messages, setMessages] = useState([]);
  const [value, setValue] = useState('');
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [topics, setTopics] = useState([]);
  const [topicId, setTopicId] = useState('');
  const [conversation, setConversation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [rated, setRated] = useState({});
  const [ratingId, setRatingId] = useState(null);
  const lock = useRef(false);
  const composer = useRef(null);
  const messagesRef = useChatAutoScroll(messages);
  const history = useApiData('/api/v1/ai-tutor/conversations/my');
  const conversations = [...listItems(history.data)].sort(
    (a, b) => (Date.parse(b.startedAt) || 0) - (Date.parse(a.startedAt) || 0)
  );
  const ended = Boolean(conversation?.endedAt);
  const selectedClass = classes.find((row) => row.classId === classId);
  const selectedTopic = topics.find((row) => row.topicId === topicId);
  useEffect(() => {
    const input = composer.current;
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
  }, [value]);

  useEffect(() => {
    let alive = true;
    loadAllPages(apiRequest, '/api/v1/students/me/classes')
      .then((rows) => {
        if (alive) {
          setClasses(rows);
          setClassId((current) => current || rows[0]?.classId || '');
        }
      })
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    let alive = true;
    setTopics([]);
    if (selectedClass?.subjectId)
      api.subjects
        .topics(selectedClass.subjectId)
        .then((data) => alive && setTopics(listItems(data)))
        .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [selectedClass?.subjectId]);

  const remember = (conv) => {
    setConversation(conv);
    history.updateData((data) => [
      conv,
      ...listItems(data).filter((row) => row.conversationId !== conv.conversationId),
    ]);
  };
  const newChat = () => {
    if (lock.current) return;
    setConversation(null);
    setMessages([]);
    setValue('');
    setRated({});
    setError('');
    composer.current?.focus();
  };
  const loadConversation = async (conv) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const data = await api.aiTutor.messages(conv.conversationId);
      setMessages(listItems(data));
      setConversation(conv);
      setClassId(conv.classId);
      setTopicId(conv.topicId || '');
      setRated({});
      setValue('');
    } catch (err) {
      setError(err.message || 'Không thể tải hội thoại.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const send = async () => {
    const content = value.trim();
    if (!content || ended || lock.current || !classId) return;
    lock.current = true;
    setBusy(true);
    setSending(true);
    setError('');
    setValue('');
    try {
      let conv = conversation;
      if (!conv) {
        conv = await api.aiTutor.start({ classId, topicId: topicId || null, mode: 'TEXT' });
        remember(conv);
      }
      const reply = await api.aiTutor.send(conv.conversationId, { content });
      setMessages((rows) => [...rows, { sender: 'USER', contentText: content }, reply]);
      remember({ ...conv, messageCount: (conv.messageCount || 0) + 2 });
    } catch (err) {
      setValue(content);
      setError(err.message || 'Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      lock.current = false;
      setBusy(false);
      setSending(false);
      composer.current?.focus();
    }
  };
  const endConversation = async () => {
    if (!conversation || ended || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      remember(await api.aiTutor.end(conversation.conversationId));
    } catch (err) {
      setError(err.message || 'Không thể kết thúc phiên.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const feedback = async (messageId, rating) => {
    if (ratingId) return;
    setRatingId(messageId);
    try {
      await api.aiTutor.sendFeedback(messageId, { rating });
      setRated((current) => ({ ...current, [messageId]: rating }));
    } catch (err) {
      setError(err.message || 'Không thể gửi đánh giá.');
    } finally {
      setRatingId(null);
    }
  };
  return (
    <AppShell
      currentPage="ai_tutor.html"
      title="Trợ giảng AI · PTIT Physics LMS"
      footer={false}
      contentClass="chat-page-content"
      showChatLauncher={false}
      toolbar={
        <DetailToolbar
          title="Trợ giảng AI"
          subtitle="Hỏi đáp và gợi mở cách giải"
          backHref="dashboard.html"
          backLabel="Về trang chủ"
          actions={
            <Button icon="add" onClick={newChat} disabled={busy}>
              Chat mới
            </Button>
          }
        />
      }
    >
      <AuthAlert error>{error}</AuthAlert>
      <div className="chat-page ai-chat">
        <Card as="aside" className="chat-page__history ai-chat__history flex flex-col p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-body-md font-semibold">Lịch sử hội thoại</h2>
            <Button
              variant="ghost"
              icon="refresh"
              aria-label="Tải lại lịch sử"
              disabled={history.loading || busy}
              onClick={history.reload}
              className="px-2"
            />
          </div>
          {history.loading ? (
            <p role="status" className="mt-3 text-body-sm text-slate-500">
              Đang tải…
            </p>
          ) : history.error ? (
            <p role="alert" className="mt-3 text-body-sm text-primary">
              Không thể tải lịch sử. Bấm tải lại để thử.
            </p>
          ) : (
            <div className="ai-chat__history-list mt-3">
              {conversations.map((conv) => (
                <button
                  type="button"
                  key={conv.conversationId}
                  disabled={busy}
                  aria-current={conversation?.conversationId === conv.conversationId ? 'true' : undefined}
                  onClick={() => loadConversation(conv)}
                  className={
                    'ai-chat__history-item rounded-xl p-3 text-left text-body-sm transition-colors disabled:opacity-50 ' +
                    (conversation?.conversationId === conv.conversationId
                      ? 'bg-red-50 text-primary'
                      : 'text-slate-600 hover:bg-slate-50')
                  }
                >
                  <span className="block font-medium">
                    {classes.find((row) => row.classId === conv.classId)?.classCode ||
                      classes.find((row) => row.classId === conv.classId)?.className ||
                      'Hỏi đáp Vật lý'}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {dateLabel(conv.startedAt)} · {conv.messageCount || 0} tin{conv.endedAt ? ' · Đã kết thúc' : ''}
                  </span>
                </button>
              ))}
              {!conversations.length && (
                <p className="text-body-sm text-slate-500">Chưa có hội thoại. Gửi câu hỏi để bắt đầu.</p>
              )}
            </div>
          )}
          <a
            href="my_courses.html"
            className="mt-4 inline-flex items-center gap-2 text-body-sm font-medium text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              menu_book
            </span>
            Học phần của tôi
          </a>
        </Card>
        <Card className="chat-page__conversation flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-slate-200 p-4">
            {!conversation ? (
              <div className="ai-chat__context">
                <SelectField
                  label="Lớp học"
                  value={classId}
                  disabled={busy}
                  onChange={(e) => {
                    setClassId(e.target.value);
                    setTopicId('');
                  }}
                >
                  <option value="">Chọn lớp học</option>
                  {classes.map((row) => (
                    <option key={row.classId} value={row.classId}>
                      {row.classCode || row.className || row.subjectName}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="Chủ đề"
                  value={topicId}
                  disabled={busy || !topics.length}
                  onChange={(e) => setTopicId(e.target.value)}
                >
                  <option value="">Trao đổi chung</option>
                  {topics.map((row) => (
                    <option key={row.topicId} value={row.topicId}>
                      {row.topicName || row.name}
                    </option>
                  ))}
                </SelectField>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <h2 className="shrink-0 text-body-md font-semibold">
                    {selectedClass?.classCode || selectedClass?.className || 'Hội thoại'}
                  </h2>
                  <p
                    className="min-w-0 truncate text-body-sm text-slate-500"
                    title={selectedTopic?.topicName || selectedTopic?.name || 'Trao đổi chung'}
                  >
                    {selectedTopic?.topicName || selectedTopic?.name || 'Trao đổi chung'}
                    {ended ? ' · Đã kết thúc' : ''}
                  </p>
                </div>
                <Button className="shrink-0" variant="ghost" disabled={busy || ended} onClick={endConversation}>
                  {ended ? 'Đã kết thúc' : 'Kết thúc phiên'}
                </Button>
              </div>
            )}
          </div>
          <div
            ref={messagesRef}
            className="chat-page__messages min-h-0 flex-1 space-y-5 overflow-y-auto bg-slate-50 p-4 md:p-6"
            role="log"
            aria-label="Tin nhắn trợ giảng AI"
            aria-live="polite"
          >
            {!messages.length && !busy && (
              <div className="mx-auto flex max-w-lg flex-col items-center py-8 text-center">
                <span className="material-symbols-outlined text-4xl text-primary" aria-hidden="true">
                  forum
                </span>
                <h2 className="mt-4 text-title-lg font-medium">Bạn muốn tìm hiểu điều gì?</h2>
                <p className="mt-2 text-body-sm text-slate-500">
                  Chọn lớp và chủ đề, rồi đặt câu hỏi. AI sẽ gợi mở từng bước để bạn tự tìm lời giải.
                </p>
                {!ended && (
                  <div className="mt-5 grid w-full gap-2">
                    {questions.map((question) => (
                      <Button
                        key={question}
                        variant="secondary"
                        onClick={() => {
                          setValue(question);
                          composer.current?.focus();
                        }}
                        className="h-auto min-h-10 py-2 text-body-sm"
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={message.messageId || index}
                className={'flex ' + (message.sender === 'USER' ? 'justify-end' : 'justify-start')}
              >
                <Card
                  as="article"
                  data-fixed-corners="true"
                  className={'chat-message ' + (message.sender === 'USER' ? 'is-user' : '')}
                >
                  <span
                    className={
                      'mb-2 block text-label-sm font-medium ' +
                      (message.sender === 'USER' ? 'text-white' : 'text-primary')
                    }
                  >
                    {message.sender === 'USER' ? 'Bạn' : 'PTIT Tutor'}
                  </span>
                  <p className="text-body-md leading-relaxed">{message.contentText}</p>
                  {safeUrl(message.audioUrl) && (
                    <audio controls preload="none" src={safeUrl(message.audioUrl)} className="mt-3 max-w-full" />
                  )}
                  {message.sender === 'AI' && message.messageId && (
                    <div className="mt-3 flex gap-1">
                      {[5, 1].map((rating) => (
                        <Button
                          key={rating}
                          variant="ghost"
                          icon={rating === 5 ? 'thumb_up' : 'thumb_down'}
                          aria-label={rating === 5 ? 'Hữu ích' : 'Chưa hữu ích'}
                          aria-pressed={rated[message.messageId] === rating}
                          disabled={Boolean(ratingId)}
                          onClick={() => feedback(message.messageId, rating)}
                          className={'h-8 px-2 ' + (rated[message.messageId] === rating ? 'bg-red-50' : '')}
                        />
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            ))}
            {busy && (
              <p role="status" className="text-body-sm text-slate-500">
                {sending ? 'AI đang trả lời…' : 'Đang tải hội thoại…'}
              </p>
            )}
          </div>
          <div className="shrink-0 border-t border-slate-200 p-3 md:p-4">
            {ended && (
              <p className="mb-3 text-body-sm text-slate-500">
                Phiên đã kết thúc. Chọn “Chat mới” để tiếp tục trao đổi.
              </p>
            )}
            <Card
              as={Form}
              data-fixed-corners="true"
              className="chat-composer"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <FormField
                ref={composer}
                bare
                multiline
                rows={1}
                value={value}
                aria-label="Câu hỏi cho trợ giảng AI"
                onChange={(e) => setValue(e.target.value)}
                disabled={ended || busy || !classId}
                placeholder={classId ? 'Nhập câu hỏi…' : 'Chọn lớp học để bắt đầu…'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send();
                  }
                }}
                className="min-w-0 flex-1 resize-none"
              />
              <SubmitButton
                aria-label="Gửi câu hỏi"
                disabled={ended || busy || !classId || !value.trim()}
                icon="send"
                className="ai-chat__send h-11 w-11 shrink-0 px-0"
              />
            </Card>
            <p className="mt-2 text-center text-xs text-slate-400">
              Enter để gửi · Shift+Enter xuống dòng. Kiểm tra câu trả lời với giáo trình.
            </p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
