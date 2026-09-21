import React, { useState } from 'react';
import { AppShell } from '../components/AppShell.jsx';
import { Button } from '../components/Button.jsx';
import { Card } from '../components/Card.jsx';
import { PageContainer } from '../components/PageContainer.jsx';
import { PageTitle } from '../components/PageTitle.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';

export function VoiceCitationsPage() {
  const [recording, setRecording] = useState(false);
  return 
  <AppShell currentPage="ai_tutor.html" title="Voice & citations · PTIT Physics 1" breadcrumbs={['Trợ giảng AI']} current="Voice & citations">
    <PageContainer><PageTitle eyebrow="AI STUDY COMPANION" title="Voice & citations" description="Đặt câu hỏi bằng giọng nói và nhận câu trả lời có trích dẫn từ giáo trình PTIT." actions={
      <StatusBadge tone="success">
        <span className="w-2 h-2 rounded-full bg-[#15803D] mr-1.5" />AI đang trực tuyến</StatusBadge>} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-7 p-6 bg-gradient-to-b from-[#18202F] to-[#0F172A] text-white border-slate-700">
            <div className="flex items-center justify-between">
              <div>
              <span className="text-label-md text-red-300">PHIÊN HỎI ĐÁP</span>
              <h2 className="text-headline-md font-bold mt-1">Giải thích lực ma sát</h2>
              </div>
              <span className="material-symbols-outlined text-3xl text-red-300">graphic_eq</span>
              </div><div className="mt-10 h-28 flex items-center justify-center gap-1.5 px-6 rounded-xl bg-slate-900/70 border border-slate-700">{Array.from({length:32},(_,index) => <span key={index} className="w-1 rounded-full bg-red-400/80" style={{height:`${20 + ((index * 17) % 55)}%`}} />)}</div><div className="flex flex-col items-center mt-8"><button onClick={() => setRecording(!recording)} className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${recording ? 'bg-red-500 animate-pulse' : 'bg-primary-container hover:bg-[#991B1B]'}`}><span className="material-symbols-outlined text-4xl">{recording ? 'stop' : 'mic'}</span></button><span className="text-body-sm text-slate-300 mt-4">{recording ? 'Đang lắng nghe... Nhấn để dừng' : 'Nhấn để bắt đầu hỏi bằng giọng nói'}</span></div><div className="mt-8 p-4 rounded-xl bg-slate-900/60 border border-slate-700"><div className="flex gap-3"><span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold">VA</span><p className="text-body-md text-slate-200">“Tại sao lực ma sát lại phụ thuộc vào áp lực của vật lên mặt phẳng?”</p></div></div></Card><div className="lg:col-span-5 space-y-6"><Card className="p-6"><div className="flex items-center justify-between"><h2 className="text-headline-sm font-bold">Trả lời có trích dẫn</h2><StatusBadge tone="primary">PTIT Tutor</StatusBadge></div><p className="text-body-md leading-relaxed text-[#475569] mt-4">Lực ma sát trượt tỉ lệ với áp lực của vật lên mặt phẳng vì diện tích tiếp xúc vi mô tạo ra lực cản phụ thuộc vào độ ép giữa hai bề mặt.</p><div className="mt-5 p-4 rounded-xl bg-[#FEF2F2] border-l-4 border-primary"><div className="flex items-center gap-2 text-primary font-semibold text-body-sm"><span className="material-symbols-outlined text-sm">menu_book</span>Nguồn tham khảo</div><p className="text-body-sm text-[#475569] mt-2">Giáo trình Vật lý đại cương 1, Chương 2, trang 58-61.</p><a href="document_viewer.html" className="text-body-sm text-primary font-semibold mt-2 inline-block">Mở trang trích dẫn →</a></div><Button className="w-full mt-5" variant="secondary" icon="volume_up">Nghe câu trả lời</Button></Card><Card className="p-6"><h2 className="text-headline-sm font-bold">Trích dẫn đã lưu</h2><div className="space-y-3 mt-4">{['Định luật II Newton · tr.45','Công của lực ma sát · tr.82','Bảo toàn động lượng · tr.103'].map((item) => <div key={item} className="flex items-center gap-3 p-3 rounded-lg bg-[#F8FAFC]"><span className="material-symbols-outlined text-primary">bookmark</span><span className="text-body-sm flex-1">{item}</span><span className="material-symbols-outlined text-[#94A3B8] text-sm">arrow_forward</span></div>)}</div></Card></div></div></PageContainer></AppShell>;
}
