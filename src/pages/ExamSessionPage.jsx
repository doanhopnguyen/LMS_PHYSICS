import { DetailToolbar } from '../components/DetailToolbar.jsx';
import React, { useState } from 'react';
import { AppShell } from '../components/AppShell.jsx';
import { Button } from '../components/Button.jsx';
import { Card } from '../components/Card.jsx';
import { ImmersiveShell } from '../components/ImmersiveShell.jsx';
import { PageContainer } from '../components/PageContainer.jsx';
import { PageTitle } from '../components/PageTitle.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';

const examOptions = [
  { id: 'chapter-2', title: 'Kiểm tra trắc nghiệm Chương 2', description: 'Động lực học chất điểm và các định luật Newton', questions: 20, duration: '45 phút', difficulty: 'Trung bình', due: 'Hạn nộp: 21/03/2025 · 23:59', status: 'Đang mở' },
  { id: 'midterm', title: 'Bài kiểm tra giữa kỳ Vật lý 1', description: 'Tổng hợp Chương 1 và Chương 2', questions: 50, duration: '90 phút', difficulty: 'Tổng hợp', due: 'Mở từ 25/03/2025', status: 'Sắp mở' },
  { id: 'practice', title: 'Bài luyện tập nhanh: Công và năng lượng', description: 'Tự luyện trước khi học Chương 3', questions: 15, duration: '25 phút', difficulty: 'Cơ bản', due: 'Không giới hạn thời gian', status: 'Tự luyện' }
];

const questions = [
  'Một vật khối lượng 2kg chịu lực 10N. Gia tốc của vật là bao nhiêu?',
  'Lực ma sát trượt phụ thuộc vào đại lượng nào?',
  'Trong chuyển động tròn đều, gia tốc hướng về đâu?',
  'Công của lực không đổi được tính như thế nào?'
];

function ExamSelection({ onStart }) {
  const [selectedId, setSelectedId] = useState(examOptions[0].id);
  const selected = examOptions.find((exam) => exam.id === selectedId);

  return <AppShell currentPage="exam_session.html" title="Chọn bài kiểm tra · PTIT Physics 1" breadcrumbs={['Kiểm tra']} current="Chọn bài kiểm tra">
    <PageContainer className="max-w-[1180px]">
      <PageTitle eyebrow="TRUNG TÂM KIỂM TRA" title="Chọn bài kiểm tra" description="Chọn một bài kiểm tra để xem hướng dẫn và bắt đầu làm bài. Bạn sẽ không thể đổi bài sau khi phiên làm bài bắt đầu." />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-4">
          {examOptions.map((exam) => <button key={exam.id} onClick={() => setSelectedId(exam.id)} className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${selectedId === exam.id ? 'border-primary bg-[#FEF2F2] shadow-sm' : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'}`}>
            <div className="flex items-start gap-4"><span className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedId === exam.id ? 'bg-primary text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}><span className="material-symbols-outlined">{exam.id === 'practice' ? 'fitness_center' : 'assignment'}</span></span><span className="flex-1"><span className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"><strong className="text-headline-sm">{exam.title}</strong><StatusBadge tone={exam.status === 'Đang mở' ? 'success' : exam.status === 'Sắp mở' ? 'warning' : 'neutral'}>{exam.status}</StatusBadge></span><span className="block text-body-md text-[#64748B] mt-1">{exam.description}</span><span className="flex flex-wrap gap-x-5 gap-y-2 text-body-sm text-[#64748B] mt-4"><span><span className="material-symbols-outlined text-sm mr-1">quiz</span>{exam.questions} câu hỏi</span><span><span className="material-symbols-outlined text-sm mr-1">timer</span>{exam.duration}</span><span><span className="material-symbols-outlined text-sm mr-1">signal_cellular_alt</span>{exam.difficulty}</span></span><span className="block text-label-sm text-[#94A3B8] mt-3">{exam.due}</span></span><span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedId === exam.id ? 'border-primary' : 'border-[#CBD5E1]'}`}>{selectedId === exam.id && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}</span></div>
          </button>)}
        </div>
        <Card className="lg:col-span-4 p-6 lg:sticky lg:top-24"><div className="flex items-center gap-3"><span className="w-10 h-10 rounded-xl bg-[#FEE2E2] text-primary flex items-center justify-center"><span className="material-symbols-outlined">fact_check</span></span><div><span className="text-body-sm text-[#64748B]">Bài đã chọn</span><h2 className="text-headline-sm font-bold">{selected.title}</h2></div></div><div className="mt-5 space-y-3 text-body-sm"><div className="flex justify-between"><span className="text-[#64748B]">Số câu hỏi</span><strong>{selected.questions} câu</strong></div><div className="flex justify-between"><span className="text-[#64748B]">Thời gian</span><strong>{selected.duration}</strong></div><div className="flex justify-between"><span className="text-[#64748B]">Số lần làm</span><strong>{selected.id === 'practice' ? 'Không giới hạn' : '1 lần'}</strong></div></div><div className="mt-5 p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-body-sm text-[#92400E]"><span className="material-symbols-outlined text-sm mr-1 align-middle">info</span>Hãy đảm bảo kết nối mạng ổn định trước khi bắt đầu.</div><Button className="w-full mt-5" disabled={selected.status === 'Sắp mở'} onClick={() => onStart(selected)} icon="play_arrow">{selected.status === 'Sắp mở' ? 'Chưa đến thời gian mở' : 'Bắt đầu kiểm tra'}</Button></Card>
      </div>
    </PageContainer>
  </AppShell>;
}

function RunningExam({ exam, onBack }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const options = current === 0 ? ['2 m/s²', '5 m/s²', '10 m/s²', '20 m/s²'] : ['Khối lượng và vận tốc', 'Hệ số ma sát và áp lực', 'Diện tích tiếp xúc', 'Nhiệt độ bề mặt'];

  return <ImmersiveShell showChatLauncher={false} title={`${exam.title} · PTIT Physics 1`} bodyClass="bg-[#F8FAFC] text-on-surface min-h-screen" topbar={<DetailToolbar title={exam.title} subtitle={`${Object.keys(selected).length}/${exam.questions} câu đã chọn · ${exam.duration}`} onBack={onBack} backLabel="Chọn bài khác" actions={<><span className="detail-toolbar-status"><span className="material-symbols-outlined" aria-hidden="true">timer</span>32:18</span><Button icon="task_alt" onClick={() => setSubmitted(true)}>Nộp bài</Button></>} />}>
    <div className="max-w-[1440px] mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6"><Card className="lg:col-span-8 p-6 md:p-8"><div className="flex items-center justify-between"><StatusBadge tone="primary">Câu {current + 1}/{exam.questions}</StatusBadge><span className="text-body-sm text-[#64748B]">{exam.description}</span></div><h1 className="text-headline-md font-bold mt-6">{questions[current]}</h1><div className="space-y-3 mt-8">{options.map((option, index) => <button key={option} onClick={() => setSelected({ ...selected, [current]: index })} className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${selected[current] === index ? 'border-primary bg-[#FEF2F2] text-primary' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'}`}><span className={`w-8 h-8 rounded-full flex items-center justify-center border ${selected[current] === index ? 'border-primary bg-primary text-white' : 'border-[#CBD5E1] text-[#64748B]'}`}>{String.fromCharCode(65 + index)}</span><span className="text-body-md">{option}</span></button>)}</div><div className="flex items-center justify-between mt-10 pt-5 border-t border-[#E2E8F0]"><button disabled={current === 0} onClick={() => setCurrent(current - 1)} className="px-4 py-2 rounded-xl border border-[#CBD5E1] disabled:opacity-40">← Câu trước</button><button onClick={() => setCurrent(Math.min(questions.length - 1, current + 1))} className="px-4 py-2 rounded-xl bg-primary-container text-white">Câu tiếp theo →</button></div></Card><Card className="lg:col-span-4 p-6 h-fit"><div className="flex items-center justify-between"><h2 className="text-headline-sm font-bold">Danh sách câu hỏi</h2><span className="text-body-sm text-[#64748B]">{Object.keys(selected).length}/{exam.questions} đã chọn</span></div><div className="grid grid-cols-5 gap-2 mt-5">{Array.from({ length: exam.questions }, (_, index) => <button key={index} onClick={() => setCurrent(Math.min(index, questions.length - 1))} className={`w-10 h-10 rounded-lg text-body-sm font-semibold ${current === index ? 'bg-primary text-white' : selected[index] !== undefined ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>{index + 1}</button>)}</div><div className="mt-6 p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-body-sm text-[#92400E]"><span className="material-symbols-outlined text-sm mr-1">info</span>Bạn có thể quay lại câu hỏi trước khi nộp bài.</div></Card></div>{submitted && <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"><Card className="p-7 max-w-md w-full text-center"><span className="w-14 h-14 rounded-full bg-[#FEF2F2] text-primary flex items-center justify-center mx-auto"><span className="material-symbols-outlined text-3xl">assignment_turned_in</span></span><h2 className="text-headline-md font-bold mt-4">Nộp bài kiểm tra?</h2><p className="text-body-md text-[#64748B] mt-2">Bạn đã chọn {Object.keys(selected).length}/{exam.questions} câu. Sau khi nộp, bạn không thể chỉnh sửa.</p><div className="flex gap-3 mt-6"><Button variant="secondary" className="flex-1" onClick={() => setSubmitted(false)}>Tiếp tục làm</Button><a href="exam_results.html" className="flex-1"><Button className="w-full">Xác nhận nộp</Button></a></div></Card></div>}</ImmersiveShell>;
}

export function ExamSessionPage() {
  const [exam, setExam] = useState(null);
  return exam ? <RunningExam exam={exam} onBack={() => setExam(null)} /> : <ExamSelection onStart={setExam} />;
}
