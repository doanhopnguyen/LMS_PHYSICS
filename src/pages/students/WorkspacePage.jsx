import { DetailToolbar } from '../../components/DetailToolbar.jsx';
import React, { useState } from 'react';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { ImmersiveShell } from '../../components/ImmersiveShell.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';

export function WorkspacePage() {
  const [running, setRunning] = useState(true);
  const [angle, setAngle] = useState(30);
  return (
    <ImmersiveShell
      title="3D Experiment Workspace · PTIT Physics 1"
      bodyClass="bg-[#070B12] text-slate-200 min-h-screen"
      topbar={
        <DetailToolbar
          title="Khảo sát lực ma sát trên mặt phẳng nghiêng"
          subtitle={`Bài TN 02 · ${running ? 'Đang chạy mô phỏng' : 'Đã tạm dừng'}`}
          backHref="virtual_lab.html"
          backLabel="Về thí nghiệm"
          actions={
            <>
              <Button onClick={() => setRunning(!running)} icon={running ? 'pause' : 'play_arrow'}>
                {running ? 'Tạm dừng' : 'Chạy'}
              </Button>
              <a href="lab_report_rubric.html">Mở báo cáo</a>
            </>
          }
        />
      }
    >
      <div className="h-[calc(100dvh-64px)] min-h-[600px] flex flex-col">
        <div className="flex-1 min-h-0 flex">
          <aside className="hidden lg:flex w-[270px] shrink-0 bg-[#0C121E] border-r border-[#1E293B] p-4 flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <strong className="text-body-sm uppercase tracking-wider">Quy trình thí nghiệm</strong>
              <span className="text-label-sm text-emerald-400">60%</span>
            </div>
            {[
              'Thiết lập góc dốc ban đầu',
              'Đo thời gian chuyển động',
              'Thay đổi góc nghiêng',
              'Thu thập số liệu',
              'Viết kết luận',
            ].map((step, index) => (
              <div
                key={step}
                className={`flex gap-2.5 p-3 rounded-lg border ${index < 2 ? 'border-emerald-900/50 bg-emerald-950/20' : index === 2 ? 'border-amber-700/60 bg-amber-950/30' : 'border-slate-800 bg-[#111928]/60'}`}
              >
                <span
                  className={`material-symbols-outlined text-sm ${index < 2 ? 'text-emerald-400' : index === 2 ? 'text-amber-400' : 'text-slate-500'}`}
                >
                  {index < 2 ? 'check_circle' : index === 2 ? 'radio_button_checked' : 'radio_button_unchecked'}
                </span>
                <span className="text-body-sm">
                  {index + 1}. {step}
                </span>
              </div>
            ))}
          </aside>
          <section className="flex-1 min-w-0 relative bg-[#070B12] overflow-hidden">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-[70%] max-w-[720px] h-[270px]">
                <div className="absolute left-[8%] right-[5%] bottom-20 h-5 bg-slate-500 rounded-full rotate-[-10deg] shadow-[0_0_20px_rgba(148,163,184,.35)]" />
                <div className="absolute left-[16%] bottom-[118px] w-24 h-16 rounded-xl bg-red-700 border-4 border-red-300 rotate-[-10deg] shadow-lg">
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-red-300 text-xs">m = 0.5kg</span>
                </div>
                <div className="absolute left-[8%] bottom-[67px] w-4 h-28 bg-slate-700 rotate-[-10deg]" />
                <div className="absolute right-[10%] bottom-[67px] w-4 h-28 bg-slate-700 rotate-[-10deg]" />
                <div className="absolute left-[12%] bottom-5 text-xs text-slate-400">0 cm</div>
                <div className="absolute right-[8%] bottom-5 text-xs text-slate-400">100 cm</div>
                <div className="absolute left-[45%] bottom-[116px] text-amber-300 text-sm">α = {angle}°</div>
              </div>
            </div>
            <div className="absolute left-4 top-4 rounded-xl bg-[#0B1120]/90 border border-slate-800 p-3 text-body-sm space-y-2">
              <div className="flex justify-between gap-8">
                <span className="text-slate-400">Vận tốc</span>
                <strong className="font-mono text-emerald-400">1.28 m/s</strong>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-slate-400">Gia tốc</span>
                <strong className="font-mono text-amber-300">4.90 m/s²</strong>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-slate-400">Thời gian</span>
                <strong className="font-mono text-slate-200">0.84 s</strong>
              </div>
            </div>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#0B1120]/95 p-2 rounded-2xl border border-slate-800">
              <button className="p-2 rounded-xl hover:bg-slate-800">
                <span className="material-symbols-outlined">restart_alt</span>
              </button>
              <button onClick={() => setRunning(!running)} className="p-2.5 rounded-xl bg-primary text-white">
                <span className="material-symbols-outlined">{running ? 'pause' : 'play_arrow'}</span>
              </button>
              <button className="p-2 rounded-xl hover:bg-slate-800">
                <span className="material-symbols-outlined">skip_next</span>
              </button>
            </div>
          </section>
          <aside className="hidden xl:flex w-[300px] shrink-0 bg-[#0C121E] border-l border-[#1E293B] p-4 flex-col gap-5">
            <div>
              <h3 className="text-body-sm font-bold uppercase tracking-wider">Thông số mô phỏng</h3>
              <label className="block text-body-sm text-slate-400 mt-5">
                Góc nghiêng <strong className="float-right text-white">{angle}°</strong>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={angle}
                  onChange={(event) => setAngle(event.target.value)}
                  className="w-full mt-3 accent-red-600"
                />
              </label>
              <label className="block text-body-sm text-slate-400 mt-5">
                Hệ số ma sát <strong className="float-right text-white">0.35</strong>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  defaultValue="0.35"
                  className="w-full mt-3 accent-red-600"
                />
              </label>
            </div>
            <Card className="p-4 bg-[#111928] border-slate-800 text-slate-200">
              <h3 className="text-body-sm font-bold">Độ tin cậy dữ liệu</h3>
              <div className="text-3xl font-bold text-emerald-400 mt-2">98.2%</div>
              <p className="text-label-sm text-slate-400 mt-1">Sai số hệ thống ±0.02%</p>
            </Card>
            <a href="lab_report_rubric.html" className="mt-auto">
              <Button className="w-full" icon="article">
                Mở báo cáo thực hành
              </Button>
            </a>
          </aside>
        </div>
        <div className="h-56 bg-[#0B1120] border-t border-[#1E293B] p-4 overflow-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-body-sm font-bold">Bảng số liệu thực nghiệm</h3>
            <span className="text-label-sm text-slate-400">Tự động lưu · 10:24:18</span>
          </div>
          <table className="w-full text-left text-body-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2">Lần đo</th>
                <th>Quãng đường (m)</th>
                <th>Thời gian (s)</th>
                <th>Vận tốc (m/s)</th>
                <th>Gia tốc (m/s²)</th>
              </tr>
            </thead>
            <tbody>
              {[
                [1, '0.50', '0.46', '1.09', '4.74'],
                [2, '0.50', '0.45', '1.11', '4.92'],
                [3, '0.50', '0.44', '1.14', '5.04'],
              ].map((row) => (
                <tr key={row[0]} className="border-t border-slate-800">
                  <td className="py-2">{row[0]}</td>
                  {row.slice(1).map((value, index) => (
                    <td key={index} className="font-mono text-slate-300">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ImmersiveShell>
  );
}
