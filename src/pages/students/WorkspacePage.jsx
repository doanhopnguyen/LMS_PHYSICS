import React, { useEffect, useState } from 'react';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { DetailToolbar } from '../../components/DetailToolbar.jsx';
import { ImmersiveShell } from '../../components/ImmersiveShell.jsx';
import { api } from '../../lib/apiClient.js';

export function WorkspacePage() {
  const params = new URLSearchParams(window.location.search);
  const experimentId = params.get('experimentId');
  const classId = params.get('classId');
  const assignmentId = params.get('assignmentId');
  const [experiment, setExperiment] = useState(null);
  const [loading, setLoading] = useState(Boolean(experimentId));
  const [error, setError] = useState('');
  useEffect(() => {
    if (!experimentId) return;
    let alive = true;
    api.experiments.get(experimentId).then((data) => { if (alive) setExperiment(data); }).catch((loadError) => { if (alive) setError(loadError.message || 'Không thể tải mô phỏng thí nghiệm.'); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [experimentId]);
  const reportHref = `lab_report_rubric.html?experimentId=${encodeURIComponent(experimentId || '')}${classId ? `&classId=${encodeURIComponent(classId)}` : ''}${assignmentId ? `&assignmentId=${encodeURIComponent(assignmentId)}` : ''}`;
  const title = experiment?.title || 'Không gian thí nghiệm';
  return <ImmersiveShell title={`${title} · PTIT Physics LMS`} bodyClass="bg-[#070B12] text-slate-200 min-h-screen" topbar={<DetailToolbar title={title} subtitle={loading ? 'Đang tải tài nguyên…' : 'Mô phỏng và hướng dẫn thực hành'} backHref="virtual_lab.html" backLabel="Về thí nghiệm" actions={<a href={reportHref}><Button icon="description">Mở báo cáo</Button></a>} />}>
    <div className="mx-auto grid min-h-[calc(100dvh-64px)] max-w-[1440px] gap-5 p-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:p-6">
      <Card className="h-fit border-slate-700 bg-[#0C121E] p-5 text-slate-100"><div className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-400">science</span><h2 className="font-bold">Hướng dẫn thực hành</h2></div>{loading ? <p className="mt-4 text-body-sm text-slate-400">Đang tải hướng dẫn…</p> : error ? <p role="alert" className="mt-4 text-body-sm text-red-300">{error}</p> : experiment?.instructions ? <div className="mt-4 whitespace-pre-wrap text-body-sm leading-7 text-slate-300">{experiment.instructions}</div> : <p className="mt-4 text-body-sm text-slate-400">Giảng viên chưa bổ sung hướng dẫn chi tiết.</p>}</Card>
      <section className="flex min-h-[560px] items-center justify-center overflow-hidden rounded-2xl border border-slate-700 bg-[#0C121E] p-4">{loading ? <p className="text-slate-400">Đang tải không gian mô phỏng…</p> : error ? <div className="text-center"><span className="material-symbols-outlined text-4xl text-red-300">error</span><p className="mt-3 text-red-200">{error}</p></div> : experiment?.sceneAssetUrl ? <iframe title={`Mô phỏng: ${title}`} src={experiment.sceneAssetUrl} className="h-[calc(100dvh-150px)] min-h-[520px] w-full rounded-xl border-0 bg-white" allow="fullscreen" /> : <div className="max-w-md text-center"><span className="material-symbols-outlined text-6xl text-slate-500">view_in_ar</span><h1 className="mt-5 text-headline-md font-bold text-white">Chưa có tài nguyên mô phỏng</h1><p className="mt-2 text-body-md text-slate-400">Giảng viên chưa gắn liên kết mô phỏng 3D cho bài thí nghiệm này. Bạn vẫn có thể đọc hướng dẫn và chuẩn bị báo cáo.</p><a href={reportHref} className="mt-6 inline-block"><Button icon="description">Lập báo cáo</Button></a></div>}</section>
    </div>
  </ImmersiveShell>;
}
