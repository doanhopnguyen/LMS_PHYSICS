import React, { useState } from 'react';

const initialMessages = [{ role: 'assistant', text: 'Bạn cần hỏi gì về bài học hoặc thí nghiệm này?' }];

export function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [messages, setMessages] = useState(initialMessages);

  const send = () => {
    const question = value.trim();
    if (!question) return;
    setMessages((current) => [
      ...current,
      { role: 'user', text: question },
      {
        role: 'assistant',
        text: 'Mình đã nhận câu hỏi. Hãy xác định các đại lượng và lực tác dụng trước khi chọn công thức nhé!',
      },
    ]);
    setValue('');
  };

  return (
    <div className={`chat-widget ${open ? 'is-open' : ''}`}>
      {open && (
        <section className="chat-widget-panel" role="dialog" aria-label="Hỏi trợ giảng AI">
          <div className="chat-widget-header">
            <div className="flex items-center gap-2">
              <span className="chat-widget-avatar">
                <span className="material-symbols-outlined text-base">smart_toy</span>
              </span>
              <div>
                <strong>Hỏi AI</strong>
                <span>PTIT Tutor · Trực tuyến</span>
              </div>
            </div>
            <button type="button" className="chat-widget-close" onClick={() => setOpen(false)} aria-label="Đóng chat">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="chat-widget-messages">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`chat-widget-message ${message.role === 'user' ? 'is-user' : ''}`}
              >
                {message.text}
              </div>
            ))}
          </div>
          <div className="chat-widget-composer">
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
              placeholder="Nhập câu hỏi..."
              aria-label="Nhập câu hỏi cho AI"
            />
            <button type="button" onClick={send} aria-label="Gửi câu hỏi">
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </section>
      )}
      <button
        type="button"
        className="chat-launcher"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? 'Đóng trợ giảng AI' : 'Mở trợ giảng AI'}
        title="Hỏi trợ giảng AI"
      >
        <span className="chat-launcher-ping" />
        <span className="material-symbols-outlined">{open ? 'close' : 'smart_toy'}</span>
      </button>
    </div>
  );
}
