import React, { useState, useEffect } from 'react';
import { DetailToolbar } from '../../components/DetailToolbar.jsx';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { ProgressBar } from '../../components/ProgressBar.jsx';
import { useChatAutoScroll } from '../../hooks/useChatAutoScroll.js';
import { api } from '../../lib/apiClient.js';
import { useApiData } from '../../hooks/useApiData.js';

const starterQuestions = [
  'Giải thích định luật II Newton',
  'Tại sao vật rơi tự do có gia tốc g?',
  'Cho tôi một bài tập về lực ma sát',
];

export function AiTutorPage() {
  const [messages, setMessages] = useState([]);
  const [value, setValue] = useState('');
  const [mode, setMode] = useState('TEXT');
  const [ended, setEnded] = useState(false);
  const [rated, setRated] = useState({});
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [lastMessageId, setLastMessageId] = useState(null);
  const messagesRef = useChatAutoScroll(messages);

  // Load my conversations list
  const { data: conversationsData } = useApiData('/api/v1/ai-tutor/conversations/my');
  const conversations = Array.isArray(conversationsData) ? conversationsData : [];

  // Start a new conversation
  const startNewConversation = async () => {
    try {
      const conv = await api.aiTutor.start({ mode });
      setConversationId(conv.conversationId);
      setMessages([]);
      setEnded(false);
      setRated({});
      setValue('');
    } catch (err) {
      console.error('Cannot start conversation:', err);
    }
  };

  // Load messages for an existing conversation
  const loadConversation = async (convId) => {
    try {
      const msgs = await api.aiTutor.messages(convId);
      const list = Array.isArray(msgs) ? msgs : [];
      setMessages(list.map((m) => ({
        role: m.sender === 'USER' ? 'user' : 'assistant',
        text: m.contentText,
        messageId: m.messageId,
      })));
      setConversationId(convId);
      setEnded(false);
    } catch (err) {
      console.error('Cannot load messages:', err);
    }
  };

  const send = async () => {
    if (!value.trim() || ended || sending) return;
    const userText = value;
    setValue('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setSending(true);
    try {
      let convId = conversationId;
      if (!convId) {
        const conv = await api.aiTutor.start({ mode });
        convId = conv.conversationId;
        setConversationId(convId);
      }
      const reply = await api.aiTutor.send(convId, { content: userText });
      setLastMessageId(reply.messageId);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: reply.contentText, messageId: reply.messageId },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.', isError: true },
      ]);
    } finally {
      setSending(false);
    }
  };

  const endConversation = async () => {
    if (!conversationId) { setEnded(true); return; }
    try {
      await api.aiTutor.end(conversationId);
    } catch (err) { /* ignore */ }
    setEnded(true);
  };

  const submitFeedback = async (messageId, rating) => {
    setRated((prev) => ({ ...prev, [messageId]: rating }));
    try {
      await api.aiTutor.sendFeedback(messageId, { rating: rating === 'UP' ? 1 : 0 });
    } catch (err) { /* ignore */ }
  };

  return (
    <AppShell
      currentPage="ai_tutor.html"
      title="Trợ giảng AI Socratic · PTIT Physics 1"
      breadcrumbs={['Trợ giảng AI']}
      current="Trợ giảng AI"
      footer={false}
      contentClass="chat-page-content"
      showChatLauncher={false}
      toolbar={
        <DetailToolbar
          title="Trợ giảng AI"
          subtitle="PTIT Tutor · Hỏi đáp Vật lý 1"
          backHref="dashboard.html"
          backLabel="Về trang chủ"
          actions={
            <>
              <a href="document_viewer.html">Học liệu</a>
              <Button
                icon="add"
                onClick={startNewConversation}
              >
                Chat mới
              </Button>
            </>
          }
        />
      }
    >
      <div className="chat-page">
        <Card as="aside" className="chat-page__history hidden w-[230px] shrink-0 flex-col gap-4 p-4 lg:flex">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <span className="text-label-sm uppercase text-[#94A3B8]">Lịch sử gần đây</span>
            <div className="mt-2 space-y-1">
              {(conversations.length > 0 ? conversations.slice(0, 6) : []).map((conv, index) => (
                <button
                  key={conv.conversationId}
                  onClick={() => loadConversation(conv.conversationId)}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-body-sm transition-colors ${conversationId === conv.conversationId ? 'bg-[#FEF2F2] font-semibold text-primary' : 'text-[#64748B] hover:bg-[#F8FAFC]'}`}
                >
                  <span className="material-symbols-outlined mr-2 align-middle text-sm">chat_bubble_outline</span>
                  {`Phiên ${index + 1} • ${conv.messageCount || 0} tin`}
                </button>
              ))}
              {conversations.length === 0 && (
                <p className="text-body-sm text-[#94A3B8] px-3 py-2">Chưa có phiên nào</p>
              )}
            </div>
          </div>
          <Card as="div" className="bg-[#F8FAFC] p-3 text-body-sm text-[#64748B]">
            <span className="material-symbols-outlined mr-1 align-middle text-sm text-primary">tips_and_updates</span>
            Hỏi từng bước để AI gợi mở cách giải.
          </Card>
        </Card>

        <Card as="section" className="chat-page__conversation flex min-w-0 flex-1 flex-col overflow-hidden bg-[#F8FAFC]">
          <div className="flex flex-col gap-2 border-b border-[#E2E8F0] bg-white p-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-body-sm">
              <span className="font-semibold text-[#475569]">Lớp D23CQCN01-B</span>
              <select value={topic} onChange={(event) => setTopic(event.target.value)} className="rounded-lg border border-[#CBD5E1] bg-white px-2 py-1.5 text-body-sm"><option value="TOPIC-FRICTION">Lực ma sát</option><option value="TOPIC-NEWTON">Định luật Newton</option><option value="TOPIC-ENERGY">Công và năng lượng</option></select>
              <select value={mode} onChange={(event) => setMode(event.target.value)} className="rounded-lg border border-[#CBD5E1] bg-white px-2 py-1.5 text-body-sm"><option value="TEXT">Trao đổi văn bản</option><option value="VOICE">Chế độ giọng nói</option></select>
            </div>
            <button type="button" onClick={() => setEnded(true)} disabled={ended} className="text-body-sm font-semibold text-primary disabled:text-[#94A3B8]">{ended ? 'Đã kết thúc phiên' : 'Kết thúc phiên'}</button>
          </div>
          <div className="chat-page__messages min-h-0 flex-1 space-y-4 overflow-y-auto p-4 md:p-6" ref={messagesRef} role="log" aria-label="Tin nhắn trợ giảng AI" aria-live="polite">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex gap-2.5 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                    <span className="material-symbols-outlined text-lg">smart_toy</span>
                  </span>
                )}
                <div
                  className={`chat-message ${message.role === 'user' ? 'is-user' : ''}`}
                >
                  {message.role === 'assistant' && (
                    <div className="mb-1.5 text-label-md font-bold text-primary">PTIT Tutor</div>
                  )}
                  <p className="text-body-md leading-relaxed">{message.text}</p>
                  {message.role === 'assistant' && message.messageId && !message.isError && (
                    <div className="mt-3 flex items-center gap-2 text-label-sm text-[#64748B]">
                      <span>Phản hồi hữu ích?</span>
                      <button
                        onClick={() => submitFeedback(message.messageId, 'UP')}
                        className={`rounded-full px-2 py-1 ${rated[message.messageId] === 'UP' ? 'bg-[#DCFCE7] text-[#15803D]' : 'hover:bg-[#F1F5F9]'}`}
                        aria-label="Hữu ích"
                      >👍</button>
                      <button
                        onClick={() => submitFeedback(message.messageId, 'DOWN')}
                        className={`rounded-full px-2 py-1 ${rated[message.messageId] === 'DOWN' ? 'bg-[#FEE2E2] text-primary' : 'hover:bg-[#F1F5F9]'}`}
                        aria-label="Chưa hữu ích"
                      >👎</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-1">
              {starterQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => setValue(question)}
                  className="rounded-full border border-[#CBD5E1] bg-white px-3 py-2 text-body-sm text-[#475569] hover:border-primary hover:text-primary"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-[#E2E8F0] bg-white p-3 md:p-4">
            {ended && <p className="mb-3 rounded-xl bg-[#F1F5F9] px-3 py-2 text-body-sm text-[#475569]">Phiên trao đổi đã kết thúc. Chọn “Chat mới” để bắt đầu phiên khác.</p>}
            <div className="chat-composer">
              <textarea
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    send();
                  }
                }}
                rows="1"
                aria-label="Đặt câu hỏi cho trợ giảng AI"
                disabled={ended}
                className="max-h-28 min-h-[40px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-body-md focus:ring-0"
                placeholder="Đặt câu hỏi cho trợ giảng AI..."
              />
              <button
                onClick={send}
                disabled={ended || !value.trim() || sending}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:bg-[#C41E1A] disabled:opacity-50"
                aria-label="Gửi câu hỏi"
              >
                <span className="material-symbols-outlined">{sending ? 'pending' : 'send'}</span>
              </button>
            </div>
            <p className="mt-1.5 text-center text-label-sm text-[#94A3B8]">
              AI có thể mắc lỗi. Hãy kiểm tra lại với giáo trình chính thức.
            </p>
          </div>
        </Card>

        <aside className="hidden w-[250px] shrink-0 flex-col gap-4 xl:flex">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">menu_book</span>
              <strong className="text-body-md">Nguồn học liệu</strong>
            </div>
            <p className="mt-3 text-body-sm text-[#64748B]">Giáo trình Vật lý đại cương 1 · Chương 2</p>
            <a href="document_viewer.html" className="mt-3 inline-block text-body-sm font-semibold text-primary">
              Mở tài liệu →
            </a>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <strong className="text-body-md">Tiến độ chương</strong>
              <span className="font-bold text-primary">75%</span>
            </div>
            <ProgressBar value={75} className="mt-3" />
            <p className="mt-3 text-body-sm text-[#64748B]">Bạn đang học tốt. Tiếp tục duy trì nhé!</p>
          </Card>
          <Card className="p-4">
            <h2 className="text-body-md font-bold">Công cụ nhanh</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button className="rounded-xl bg-[#F8FAFC] p-3 text-body-sm text-[#475569]">
                <span className="material-symbols-outlined block text-primary">functions</span>Công thức
              </button>
              <button className="rounded-xl bg-[#F8FAFC] p-3 text-body-sm text-[#475569]">
                <span className="material-symbols-outlined block text-primary">bookmark</span>Đã lưu
              </button>
            </div>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}
