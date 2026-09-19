import React, { useState } from 'react';
import { DetailToolbar } from '../components/DetailToolbar.jsx';
import { AppShell } from '../components/AppShell.jsx';
import { Button } from '../components/Button.jsx';
import { Card } from '../components/Card.jsx';

const starterQuestions = [
  'Giải thích định luật II Newton',
  'Tại sao vật rơi tự do có gia tốc g?',
  'Cho tôi một bài tập về lực ma sát'
];

export function AiTutorPage() {
  const [messages, setMessages] = useState([
    { role: 'user', text: 'Tại sao lực ma sát lại phụ thuộc vào áp lực của vật lên mặt phẳng?' },
    { role: 'assistant', text: 'Lực ma sát trượt tỉ lệ với áp lực vì sự tương tác ở các điểm tiếp xúc vi mô tăng khi hai bề mặt bị ép vào nhau. Công thức là Fms = μN, trong đó N là áp lực vuông góc.' }
  ]);
  const [value, setValue] = useState('');

  const send = () => {
    if (!value.trim()) return;
    setMessages((current) => [
      ...current,
      { role: 'user', text: value },
      { role: 'assistant', text: 'Hãy bắt đầu bằng việc xác định các lực tác dụng lên vật. Bạn thử vẽ sơ đồ lực trước nhé!' }
    ]);
    setValue('');
  };

  return <AppShell currentPage="ai_tutor.html" title="Trợ giảng AI Socratic · PTIT Physics 1" breadcrumbs={['Trợ giảng AI']} current="Trợ giảng AI" footer={false} contentClass="chat-page-content" showChatLauncher={false} toolbar={<DetailToolbar title="Trợ giảng AI" subtitle="PTIT Tutor · Hỏi đáp Vật lý 1" backHref="dashboard.html" backLabel="Về trang chủ" actions={<><a href="document_viewer.html">Học liệu</a><Button icon="add" onClick={() => { setMessages([]); setValue(''); }}>Chat mới</Button></>} />}>
    <div className="chat-page mx-auto flex h-[calc(100vh-64px)] min-h-[620px] max-w-[1380px] gap-4 p-4 lg:p-6">
      <aside className="hidden w-[230px] shrink-0 flex-col gap-4 rounded-[20px] border border-[#E2E8F0] bg-white p-4 shadow-sm lg:flex">
        <div className="min-h-0 flex-1 overflow-y-auto"><span className="text-label-sm uppercase text-[#94A3B8]">Lịch sử gần đây</span><div className="mt-2 space-y-1">{['Định luật Newton', 'Bài tập lực ma sát', 'Ôn tập Chương 1', 'Công và năng lượng'].map((item, index) => <button key={item} className={`w-full rounded-xl px-3 py-2.5 text-left text-body-sm transition-colors ${index === 0 ? 'bg-[#FEF2F2] font-semibold text-primary' : 'text-[#64748B] hover:bg-[#F8FAFC]'}`}><span className="material-symbols-outlined mr-2 align-middle text-sm">chat_bubble_outline</span>{item}</button>)}</div></div>
        <div className="rounded-xl bg-[#F8FAFC] p-3 text-body-sm text-[#64748B]"><span className="material-symbols-outlined mr-1 align-middle text-sm text-primary">tips_and_updates</span>Hỏi từng bước để AI gợi mở cách giải.</div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-[#E2E8F0] bg-[#F8FAFC] shadow-sm">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 md:p-6">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex gap-2.5 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>{message.role === 'assistant' && <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-white"><span className="material-symbols-outlined text-lg">smart_toy</span></span>}<div className={`max-w-[min(680px,88%)] rounded-2xl px-4 py-3 shadow-sm ${message.role === 'user' ? 'rounded-tr-md bg-primary text-white' : 'rounded-tl-md border border-[#E2E8F0] bg-white text-on-surface'}`}>{message.role === 'assistant' && <div className="mb-1.5 text-label-md font-bold text-primary">PTIT Tutor</div>}<p className="text-body-md leading-relaxed">{message.text}</p>{message.role === 'assistant' && <div className="mt-3 rounded-xl border-l-4 border-primary bg-[#FEF2F2] px-3 py-2 text-body-sm text-[#475569]"><strong className="text-primary">Gợi ý:</strong> Xác định phản lực pháp tuyến trước khi thay số.</div>}</div></div>)}<div className="flex flex-wrap gap-2 pt-1">{starterQuestions.map((question) => <button key={question} onClick={() => setValue(question)} className="rounded-full border border-[#CBD5E1] bg-white px-3 py-2 text-body-sm text-[#475569] hover:border-primary hover:text-primary">{question}</button>)}</div></div>
        <div className="border-t border-[#E2E8F0] bg-white p-3 md:p-4"><div className="flex items-end gap-2 rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-[#FEE2E2]"><textarea value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); } }} rows="1" className="max-h-28 min-h-[40px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-body-md focus:ring-0" placeholder="Đặt câu hỏi cho trợ giảng AI..." /><button onClick={send} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:bg-[#991B1B]" aria-label="Gửi câu hỏi"><span className="material-symbols-outlined">send</span></button></div><p className="mt-1.5 text-center text-label-sm text-[#94A3B8]">AI có thể mắc lỗi. Hãy kiểm tra lại với giáo trình chính thức.</p></div>
      </section>

      <aside className="hidden w-[250px] shrink-0 flex-col gap-4 xl:flex"><Card className="p-4"><div className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">menu_book</span><strong className="text-body-md">Nguồn học liệu</strong></div><p className="mt-3 text-body-sm text-[#64748B]">Giáo trình Vật lý đại cương 1 · Chương 2</p><a href="document_viewer.html" className="mt-3 inline-block text-body-sm font-semibold text-primary">Mở tài liệu →</a></Card><Card className="p-4"><div className="flex items-center justify-between"><strong className="text-body-md">Tiến độ chương</strong><span className="font-bold text-primary">75%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E2E8F0]"><div className="h-full w-3/4 rounded-full bg-primary" /></div><p className="mt-3 text-body-sm text-[#64748B]">Bạn đang học tốt. Tiếp tục duy trì nhé!</p></Card><Card className="p-4"><h2 className="text-body-md font-bold">Công cụ nhanh</h2><div className="mt-3 grid grid-cols-2 gap-2"><button className="rounded-xl bg-[#F8FAFC] p-3 text-body-sm text-[#475569]"><span className="material-symbols-outlined block text-primary">functions</span>Công thức</button><button className="rounded-xl bg-[#F8FAFC] p-3 text-body-sm text-[#475569]"><span className="material-symbols-outlined block text-primary">bookmark</span>Đã lưu</button></div></Card></aside>
    </div>
  </AppShell>;
}
