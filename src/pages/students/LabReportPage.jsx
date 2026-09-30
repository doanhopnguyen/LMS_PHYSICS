import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { ProgressBar } from '../../components/ProgressBar.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { api } from '../../lib/apiClient.js';

export function LabReportPage() {
  const params = new URLSearchParams(window.location.search);
  const experimentId = params.get('experimentId');
  const assignmentId = params.get('assignmentId');
  const [experiment, setExperiment] = useState(null);
  const [file, setFile] = useState(null);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [rawData, setRawData] = useState('');
  const [loading, setLoading] = useState(Boolean(experimentId));
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!experimentId) return;
    let alive = true;
    api.experiments
      .get(experimentId)
      .then((data) => {
        if (alive) setExperiment(data);
      })
      .catch((loadError) => {
        if (alive) setError(loadError.message || 'Không thể tải thông tin thí nghiệm.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [experimentId]);
  const submit = async (event) => {
    event.preventDefault();
    if (!assignmentId || submitting) return;
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (evidenceUrl.trim()) formData.append('evidenceUrl', evidenceUrl.trim());
      if (rawData.trim()) formData.append('rawDataJson', rawData.trim());
      await api.experiments.submitAssignment(assignmentId, formData);
      setMessage('Đã gửi báo cáo thí nghiệm. Bạn có thể theo dõi tệp trong Kho minh chứng.');
    } catch (submitError) {
      setError(submitError.message || 'Không thể nộp báo cáo thí nghiệm.');
    } finally {
      setSubmitting(false);
    }
  };
  const title = experiment?.title || 'Báo cáo thí nghiệm';
  const completion = [file, evidenceUrl.trim(), rawData.trim()].filter(Boolean).length * 33.33;
  return (
    <AppShell
      currentPage="lab_report_rubric.html"
      title={`${title} · PTIT Physics LMS`}
      breadcrumbs={['Phòng thí nghiệm 3D']}
      current="Báo cáo thí nghiệm"
    >
      <PageContainer>
        <PageTitle
          eyebrow="BÁO CÁO THÍ NGHIỆM"
          title={loading ? 'Đang tải báo cáo…' : title}
          description={experiment?.description || 'Gửi dữ liệu, tệp minh chứng và liên kết kết quả thực hành.'}
          actions={
            <a href="virtual_lab.html">
              <Button variant="secondary" icon="arrow_back">
                Về thí nghiệm
              </Button>
            </a>
          }
        />
        {error && !experiment && (
          <Card className="p-8 text-center">
            <p role="alert" className="text-primary">
              {error}
            </p>
          </Card>
        )}
        {!loading && !error && !experimentId && (
          <Card className="p-8 text-center text-[#64748B]">
            Hãy mở báo cáo từ một bài thí nghiệm để tải đúng hướng dẫn và dữ liệu liên quan.
          </Card>
        )}
        {loading ? (
          <p className="py-10 text-center text-[#64748B]">Đang tải thông tin thí nghiệm…</p>
        ) : (
          experiment && (
            <>
              <Card className="p-6">
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                  <div>
                    <StatusBadge tone={assignmentId ? 'primary' : 'warning'}>
                      {assignmentId ? 'Sẵn sàng nộp' : 'Chưa có bài giao'}
                    </StatusBadge>
                    <h2 className="mt-3 text-headline-md font-bold">Tiến độ chuẩn bị báo cáo</h2>
                    <p className="mt-1 text-body-md text-[#64748B]">
                      Điền dữ liệu hoặc đính kèm tệp minh chứng trước khi gửi.
                    </p>
                  </div>
                  <div className="w-full lg:w-80">
                    <ProgressBar value={completion} label="Mức độ hoàn thiện" />
                  </div>
                </div>
              </Card>
              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
                <Card className="p-6 lg:col-span-8">
                  <h2 className="text-headline-md font-bold">Nội dung và dữ liệu thí nghiệm</h2>
                  {experiment.instructions && (
                    <div className="mt-4 whitespace-pre-wrap rounded-xl bg-[#F8FAFC] p-4 text-body-md leading-7 text-[#475569]">
                      {experiment.instructions}
                    </div>
                  )}
                  <form className="mt-6 space-y-5" onSubmit={submit}>
                    <label className="block text-body-sm font-semibold">
                      Tệp báo cáo hoặc minh chứng
                      <input
                        type="file"
                        onChange={(event) => setFile(event.target.files?.[0] || null)}
                        className="mt-2 block w-full rounded-xl border border-[#CBD5E1] p-3 font-normal"
                      />
                    </label>
                    <label className="block text-body-sm font-semibold">
                      Liên kết minh chứng (nếu có)
                      <input
                        value={evidenceUrl}
                        onChange={(event) => setEvidenceUrl(event.target.value)}
                        type="url"
                        placeholder="https://…"
                        className="mt-2 block w-full rounded-xl border border-[#CBD5E1] p-3 font-normal"
                      />
                    </label>
                    <label className="block text-body-sm font-semibold">
                      Dữ liệu thô / ghi chú
                      <textarea
                        value={rawData}
                        onChange={(event) => setRawData(event.target.value)}
                        rows="7"
                        placeholder="Nhập dữ liệu đo hoặc JSON dữ liệu thực nghiệm…"
                        className="mt-2 block w-full rounded-xl border border-[#CBD5E1] p-3 font-normal"
                      />
                    </label>
                    {message && <p className="text-[#15803D]">{message}</p>}
                    {error && (
                      <p role="alert" className="text-primary">
                        {error}
                      </p>
                    )}
                    <Button
                      type="submit"
                      icon="send"
                      disabled={!assignmentId || submitting || (!file && !evidenceUrl.trim() && !rawData.trim())}
                    >
                      {submitting ? 'Đang nộp…' : 'Nộp báo cáo'}
                    </Button>
                    {!assignmentId && (
                      <p className="text-body-sm text-[#B45309]">
                        Giảng viên cần gửi liên kết bài giao có assignmentId để hệ thống xác định đúng bài nộp của bạn.
                      </p>
                    )}
                  </form>
                </Card>
                <Card className="h-fit p-6 lg:col-span-4">
                  <h2 className="text-headline-sm font-bold">Thông tin thí nghiệm</h2>
                  <dl className="mt-4 space-y-4 text-body-sm">
                    <div>
                      <dt className="text-[#64748B]">Học phần</dt>
                      <dd className="mt-1 font-semibold">Theo bài thí nghiệm đã chọn</dd>
                    </div>
                    <div>
                      <dt className="text-[#64748B]">Tài nguyên mô phỏng</dt>
                      <dd className="mt-1 font-semibold">
                        {experiment.sceneAssetUrl ? (
                          <a className="text-primary" href={experiment.sceneAssetUrl} target="_blank" rel="noreferrer">
                            Mở tài nguyên
                          </a>
                        ) : (
                          'Chưa được cung cấp'
                        )}
                      </dd>
                    </div>
                  </dl>
                  <a
                    href={`3d_workspace.html?experimentId=${encodeURIComponent(experiment.experimentId)}`}
                    className="mt-6 inline-block"
                  >
                    <Button variant="secondary" icon="science">
                      Mở mô phỏng
                    </Button>
                  </a>
                </Card>
              </div>
            </>
          )
        )}
      </PageContainer>
    </AppShell>
  );
}
