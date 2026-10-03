import { Form as SharedForm, SubmitButton } from '../../components/Form.jsx';
import { FormField as SharedFormField } from '../../components/FormField.jsx';
import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { ProgressBar } from '../../components/ProgressBar.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { api } from '../../lib/apiClient.js';
import { experimentHref, loadStudentExperiment } from '../../lib/experimentContext.js';
import { LabMeasurementTable } from '../../components/LabMeasurementTable.jsx';
import { buildLabReport, emptyLabTrial, getLabReportSchema, MIN_LAB_TRIALS } from '../../lib/labReportSchema.js';
import { buildExperimentSubmission } from '../../lib/experimentSubmission.js';

export function LabReportPage() {
  const params = new URLSearchParams(window.location.search);
  const experimentId = params.get('experimentId');
  const assignmentId = params.get('assignmentId');
  const classId = params.get('classId');
  const [experiment, setExperiment] = useState(null);
  const [file, setFile] = useState(null);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [rawData, setRawData] = useState('');
  const [measurements, setMeasurements] = useState([]);
  const [measurementErrors, setMeasurementErrors] = useState({});
  const [loading, setLoading] = useState(Boolean(experimentId));
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!experimentId) return;
    let alive = true;
    loadStudentExperiment(experimentId, assignmentId)
      .then((data) => {
        if (alive) {
          setExperiment(data);
          const schema = getLabReportSchema(data);
          setMeasurements(schema ? Array.from({ length: MIN_LAB_TRIALS }, () => emptyLabTrial(schema)) : []);
          setMeasurementErrors({});
        }
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
  }, [experimentId, assignmentId]);
  const submit = async (event) => {
    event.preventDefault();
    if (!assignmentId || submitting) return;
    const report = buildLabReport(getLabReportSchema(experiment), measurements, rawData);
    setMeasurementErrors(report.errors);
    if (!report.data && Object.keys(report.errors).length) {
      setError('Vui lòng kiểm tra các ô số liệu được đánh dấu.');
      return;
    }
    if (!event.currentTarget.reportValidity()) return;
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const formData = await buildExperimentSubmission({ report: report.data, file, evidenceUrl });
      await api.experiments.submitAssignment(assignmentId, formData);
      setMessage('Đã gửi báo cáo thí nghiệm. Minh chứng sẽ được đưa vào kho sau khi giảng viên xác nhận kết quả.');
    } catch (submitError) {
      setError(submitError.message || 'Không thể nộp báo cáo thí nghiệm.');
    } finally {
      setSubmitting(false);
    }
  };
  const title = experiment?.title || 'Báo cáo thí nghiệm';
  const schema = getLabReportSchema(experiment);
  const validMeasurements = schema && measurements.length >= MIN_LAB_TRIALS && !Object.keys(buildLabReport(schema, measurements, rawData).errors).length;
  const completion = [file, evidenceUrl.trim(), schema ? validMeasurements : rawData.trim()].filter(Boolean).length * 33.33;
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
                      {schema ? 'Điền bảng số liệu trước khi gửi. Có thể bổ sung tệp hoặc liên kết minh chứng.' : 'Điền dữ liệu hoặc đính kèm tệp minh chứng trước khi gửi.'}
                    </p>
                  </div>
                  <div className="w-full lg:w-80">
                    <ProgressBar value={completion} label="Mức độ hoàn thiện" />
                  </div>
                </div>
              </Card>
              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
                <Card className="min-w-0 p-6 lg:col-span-8">
                  <h2 className="text-headline-md font-bold">Nội dung và dữ liệu thí nghiệm</h2>
                  {experiment.instructions && (
                    <div className="mt-4 whitespace-pre-wrap rounded-xl bg-[#F8FAFC] p-4 text-body-md leading-7 text-[#475569]">
                      {experiment.instructions}
                    </div>
                  )}
                  <SharedForm className="mt-6 min-w-0 space-y-5" onSubmit={submit} noValidate>
                    <p className="text-body-sm text-slate-500">Giảng viên sẽ xem số liệu, nhận xét và các minh chứng bạn nộp cùng báo cáo.</p>
                    {schema && (
                      <LabMeasurementTable schema={schema} rows={measurements} errors={measurementErrors} disabled={submitting}
                        onChange={(rows) => { setMeasurements(rows); setMeasurementErrors({}); setError(''); setMessage(''); }} />
                    )}
                    <SharedFormField
                      type="file"
                      disabled={submitting}
                      onChange={(event) => setFile(event.target.files?.[0] || null)}
                      className="mt-2 block w-full"
                      label={<>Tệp báo cáo hoặc minh chứng</>}
                      wrapperClassName="block text-body-sm font-semibold"
                    />
                    <SharedFormField
                      value={evidenceUrl}
                      disabled={submitting}
                      onChange={(event) => setEvidenceUrl(event.target.value)}
                      type="url"
                      placeholder="https://…"
                      className="mt-2 block w-full"
                      label={<>Liên kết minh chứng (nếu có)</>}
                      wrapperClassName="block text-body-sm font-semibold"
                    />
                    <SharedFormField
                      value={rawData}
                      disabled={submitting}
                      onChange={(event) => setRawData(event.target.value)}
                      rows="7"
                      placeholder={schema ? 'Nhận xét về kết quả đo, sai số và điều kiện thực hiện…' : 'Nhập số liệu đo và nhận xét của bạn…'}
                      className="mt-2 block w-full"
                      multiline
                      label={schema ? 'Nhận xét' : 'Số liệu và ghi chú'}
                      hint={schema ? 'Có thể bổ sung nhận xét hoặc giải thích chênh lệch giữa các lần đo.' : 'Nhập số liệu từng lần đo và nhận xét của bạn.'}
                      wrapperClassName="block text-body-sm font-semibold"
                    />
                    {message && <div role="status" className="space-y-2 text-[#15803D]">
                      <p>{message}</p>
                    </div>}
                    {error && (
                      <p role="alert" className="text-primary">
                        {error}
                      </p>
                    )}
                    <SubmitButton
                      type="submit"
                      icon="send"
                      disabled={!assignmentId || submitting || (!schema && !file && !evidenceUrl.trim() && !rawData.trim())}
                    >
                      {submitting ? 'Đang nộp…' : 'Nộp báo cáo'}
                    </SubmitButton>
                    {!assignmentId && (
                      <p className="text-body-sm text-[#B45309]">
                        Giảng viên cần gửi liên kết bài giao có assignmentId để hệ thống xác định đúng bài nộp của bạn.
                      </p>
                    )}
                  </SharedForm>
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
                    href={experimentHref('3d_workspace.html', { experimentId, classId, assignmentId })}
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
