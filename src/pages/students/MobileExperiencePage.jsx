import { Card } from '../../components/Card.jsx';
import React from 'react';
import { Button } from '../../components/Button.jsx';
import { ImmersiveShell } from '../../components/ImmersiveShell.jsx';
import { ProgressBar } from '../../components/ProgressBar.jsx';
import { NotificationBell } from '../../components/NotificationBell.jsx';

export function MobileExperiencePage() {
  return (
    <ImmersiveShell
      title="Mobile experience · PTIT Physics 1"
      bodyClass="bg-[#E2E8F0] text-on-surface min-h-screen"
      topbar={
        <header className="h-14 bg-white border-b border-[#CBD5E1] px-4 flex items-center justify-between">
          <a href="dashboard.html" className="text-body-sm text-[#64748B]">
            ← Dashboard
          </a>
          <strong className="text-body-md">Mobile preview</strong>
          <NotificationBell />
        </header>
      }
    >
      <div className="min-h-[calc(100vh-56px)] flex items-start justify-center p-4 md:p-10">
        <div className="w-full max-w-[390px] min-h-[760px] bg-[#F8FAFC] rounded-[32px] shadow-2xl border-[10px] border-[#1E293B] overflow-hidden">
          <div className="h-7 bg-[#1E293B] flex items-center justify-center">
            <span className="w-20 h-1.5 rounded-full bg-slate-600" />
          </div>
          <header className="h-14 bg-white px-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-md bg-primary-container text-white flex items-center justify-center font-bold text-xs">
                P1
              </span>
              <strong className="text-primary">VẬT LÝ 1</strong>
            </div>
            <NotificationBell />
          </header>
          <main className="p-4 space-y-4">
            <Card as="section" className="p-4 bg-gradient-to-br from-[#800F0F] to-primary-container text-white">
              <span className="text-label-sm text-red-100">HỌC KỲ 1 · 2024-2025</span>
              <h1 className="text-headline-sm font-bold mt-2">Xin chào, Nguyễn Văn A!</h1>
              <p className="text-body-sm text-white/80 mt-1">Bạn đã học 5 ngày liên tiếp.</p>
              <Button className="w-full mt-4 !bg-white !text-primary" icon="play_arrow">
                Tiếp tục học
              </Button>
            </Card>
            <Card as="section" className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-label-sm text-primary font-bold">ĐANG HỌC DỞ</span>
                <span className="text-label-sm text-[#64748B]">75%</span>
              </div>
              <h2 className="text-headline-sm font-bold mt-2">Các định luật Newton</h2>
              <p className="text-body-sm text-[#64748B] mt-1">Bài 4 · Động lực học chất điểm</p>
              <ProgressBar value={75} className="mt-4" compact />
            </Card>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['68%', 'Tiến độ', 'trending_up'],
                ['18', 'Bài học', 'menu_book'],
                ['8.8', 'Điểm TB', 'emoji_events'],
                ['2', 'Nhiệm vụ', 'assignment'],
              ].map(([value, label, icon]) => (
                <Card as="div" key={label} className="p-3">
                  <span className="material-symbols-outlined text-primary">{icon}</span>
                  <strong className="block text-headline-md mt-2">{value}</strong>
                  <span className="text-body-sm text-[#64748B]">{label}</span>
                </Card>
              ))}
            </div>
            <Card as="section" className="p-4">
              <h2 className="text-headline-sm font-bold">Truy cập nhanh</h2>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[
                  ['smart_toy', 'AI Tutor'],
                  ['science', 'Lab 3D'],
                  ['quiz', 'Ôn luyện'],
                ].map(([icon, label]) => (
                  <a
                    key={label}
                    href={
                      label === 'AI Tutor'
                        ? 'ai_tutor.html'
                        : label === 'Lab 3D'
                          ? 'virtual_lab.html'
                          : 'exam_practice_center.html'
                    }
                    className="p-2 rounded-xl bg-[#F8FAFC] text-center"
                  >
                    <span className="w-9 h-9 rounded-lg bg-[#FEE2E2] text-primary flex items-center justify-center mx-auto">
                      <span className="material-symbols-outlined">{icon}</span>
                    </span>
                    <span className="block text-label-sm mt-1">{label}</span>
                  </a>
                ))}
              </div>
            </Card>
          </main>
          <nav className="sticky bottom-0 h-16 bg-white border-t border-[#E2E8F0] flex items-center justify-around text-[#64748B]">
            <a href="dashboard.html" className="flex flex-col items-center text-primary">
              <span className="material-symbols-outlined">home</span>
              <span className="text-[10px]">Trang chủ</span>
            </a>
            <a href="my_courses.html" className="flex flex-col items-center">
              <span className="material-symbols-outlined">menu_book</span>
              <span className="text-[10px]">Học phần</span>
            </a>
            <a href="ai_tutor.html" className="flex flex-col items-center">
              <span className="material-symbols-outlined">smart_toy</span>
              <span className="text-[10px]">AI Tutor</span>
            </a>
            <a href="profile_settings.html" className="flex flex-col items-center">
              <span className="material-symbols-outlined">person</span>
              <span className="text-[10px]">Cá nhân</span>
            </a>
          </nav>
        </div>
      </div>
    </ImmersiveShell>
  );
}
