import React, { useMemo, useState } from 'react';
import { Breadcrumbs } from '../../components/Breadcrumbs.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
import { ColumnChart } from '../../components/DataCharts.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { LecturerPageShell } from '../../components/LecturerPageShell.jsx';
import { SectionHeader } from '../../components/SectionHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { labs } from '../../data/lmsData.js';
import {
  labActivities,
  labAssignments,
  labGradingStatusMeta,
  labRubrics,
  labSubmissions,
  lecturerLabMetadata,
  lecturerStudents,
  lecturerUser,
} from '../../data/lecturerData.js';
import { gradingForSubmission, saveLabGrading } from '../../lib/labGradingState.js';

const formatDateTime = (value) =>
  value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—';
const formatScore = (value) =>
  value === null || value === undefined
    ? '—'
    : Number(value)
        .toFixed(2)
        .replace(/\.00$/, '')
        .replace(/(\.\d)0$/, '$1');

function EvidencePanel({ submission, assignment }) {
  const report = submission.evidence.report;
  const measurements = submission.evidence.measurements ?? [];
  const requiredMissing = assignment.requiredEvidence.filter(
    (type) =>
      (type === 'REPORT' && !report) ||
      (type === 'SCREENSHOT' && !submission.evidence.screenshots?.length) ||
      (type === 'MEASUREMENT_DATA' && !measurements.length) ||
      (type === 'CONCLUSION' && !submission.evidence.conclusion)
  );
  const activities = labActivities.filter((item) => item.submissionId === submission.id);
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <SectionHeader title="Báo cáo thí nghiệm" />
        {report ? (
          <Card as="div" className="mt-4 bg-[#F8FAFC] p-4">
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-primary">picture_as_pdf</span>
              <div>
                <strong>{report.fileName}</strong>
                <p className="mt-1 text-body-sm text-[#64748B]">
                  {report.fileType} · {report.fileSize} · {formatDateTime(report.uploadedAt)}
                </p>
              </div>
            </div>
            <p className="mt-3 text-body-sm text-[#64748B]">Dữ liệu minh họa frontend; chưa có tệp hoặc URL thật.</p>
          </Card>
        ) : (
          <p className="mt-4 text-body-sm text-[#64748B]">Chưa có tệp báo cáo.</p>
        )}
        {requiredMissing.length > 0 && (
          <Card as="div" className="mt-4 border-[#FDE68A] bg-[#FEF3C7] p-3 text-body-sm text-[#B45309]">
            <strong>Minh chứng bắt buộc còn thiếu:</strong> {requiredMissing.join(', ')}
          </Card>
        )}
      </Card>
      <Card className="p-5">
        <SectionHeader title="Ảnh minh chứng" />
        <div className="mt-4">
          {submission.evidence.screenshots?.length ? (
            submission.evidence.screenshots.map((image) => (
              <div
                key={image.id}
                className="flex aspect-video max-w-md flex-col items-center justify-center rounded-xl bg-gradient-to-br from-[#1E293B] to-[#475569] text-white"
              >
                <span className="material-symbols-outlined text-4xl">image</span>
                <span className="mt-2 text-body-sm">{image.label}</span>
                <small className="text-slate-300">Chưa có URL ảnh thật</small>
              </div>
            ))
          ) : (
            <p className="text-body-sm text-[#64748B]">Chưa có ảnh minh chứng.</p>
          )}
        </div>
      </Card>
      {measurements.length > 0 && (
        <>
          <Card className="p-5">
            <SectionHeader title="Bảng số liệu" />
            <div className="mt-4">
              <DataTable
                columns={Object.keys(measurements[0]).map(
                  (key) =>
                    ({
                      trial: 'Lần đo',
                      distance: 'Quãng đường',
                      time: 'Thời gian',
                      velocity: 'Vận tốc',
                      acceleration: 'Gia tốc',
                    })[key] ?? key
                )}
                rows={measurements}
                renderRow={(row) => (
                  <tr className="border-t border-[#E2E8F0]">
                    {Object.values(row).map((value, index) => (
                      <td key={index} className="px-3 py-3 font-mono">
                        {value}
                      </td>
                    ))}
                  </tr>
                )}
              />
            </div>
          </Card>
          <Card className="p-5">
            <SectionHeader title="Biểu đồ" />
            <ColumnChart
              values={measurements.map((row) => Number.parseFloat(row.acceleration ?? row.time) || 0)}
              labels={measurements.map((row) => `Lần ${row.trial}`)}
              label="Biểu đồ số liệu thực nghiệm"
              color="#E52220"
            />
          </Card>
        </>
      )}
      <Card className="p-5">
        <SectionHeader title="Nhận xét và kết luận" />
        <p className="mt-4 text-body-md text-[#475569]">
          {submission.evidence.conclusion || 'Chưa có nhận xét và kết luận.'}
        </p>
      </Card>
      <Card className="p-5">
        <SectionHeader title="Nhật ký thực hiện" />
        <ol className="mt-4 space-y-3 text-body-sm">
          {activities.length ? (
            activities.map((item) => (
              <li key={item.id}>
                <strong>{item.label}</strong>
                <span className="ml-2 text-[#64748B]">{formatDateTime(item.occurredAt)}</span>
              </li>
            ))
          ) : (
            <>
              <li>
                Bắt đầu: <strong>{formatDateTime(submission.startedAt)}</strong>
              </li>
              <li>
                Số lần thực hiện: <strong>{submission.attemptCount}</strong>
              </li>
              <li>
                Nộp báo cáo: <strong>{formatDateTime(submission.submittedAt)}</strong>
              </li>
            </>
          )}
        </ol>
      </Card>
    </div>
  );
}

function historyEntry({ action, fromStatus, toStatus, previousScore, nextScore, reason = '' }) {
  return {
    id: `HISTORY-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    occurredAt: new Date().toISOString(),
    actor: lecturerUser.name,
    action,
    fromStatus,
    toStatus,
    previousScore,
    nextScore,
    reason,
  };
}

export function LecturerLabGradingPage() {
  const submissionId = new URLSearchParams(window.location.search).get('submission');
  const submission = labSubmissions.find((item) => item.id === submissionId);
  const assignment = submission ? labAssignments.find((item) => item.id === submission.assignmentId) : null;
  const rubric = assignment ? labRubrics.find((item) => item.id === assignment.rubricId) : null;
  const student = submission ? lecturerStudents.find((item) => item.id === submission.studentId) : null;
  const labIndex = assignment ? Number(assignment.labId.replace('LAB', '')) - 1 : -1;
  const lab = assignment ? { ...labs[labIndex], ...lecturerLabMetadata[assignment.labId] } : null;
  const stored = submission ? gradingForSubmission(submission.id) : null;
  const createResult = () => ({
    id: `LABGRADE-${submission.id}`,
    submissionId: submission.id,
    rubricId: rubric.id,
    status: 'UNGRADED',
    criteriaScores: rubric.criteria.map((criterion) => ({ criterionId: criterion.id, score: '', comment: '' })),
    totalScore: null,
    lecturerComment: '',
    gradedBy: null,
    confirmedBy: null,
    confirmedAt: null,
    publishedAt: null,
    history: [],
  });
  const [result, setResult] = useState(() => stored ?? (submission && rubric ? createResult() : null));
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [adjusting, setAdjusting] = useState(false);
  const [adjustmentReason, setAdjustmentReason] = useState('');

  if (!submission || !assignment || !student)
    return (
      <LecturerPageShell
        currentPage="lecturer_labs.html"
        title="Không tìm thấy báo cáo"
        eyebrow="CHẤM BÁO CÁO THÍ NGHIỆM"
        description="Submission ID không tồn tại trong dữ liệu hiện tại."
      >
        <Card className="p-10 text-center">
          <span className="material-symbols-outlined text-4xl text-[#94A3B8]">search_off</span>
          <h2 className="mt-3 text-headline-sm font-bold">Không tìm thấy báo cáo</h2>
          <a href="lecturer_labs.html">
            <Button variant="secondary" className="mt-5">
              Quay lại danh sách
            </Button>
          </a>
        </Card>
      </LecturerPageShell>
    );
  if (!rubric || !result)
    return (
      <LecturerPageShell
        currentPage="lecturer_labs.html"
        title="Lỗi cấu hình Rubric"
        eyebrow="CHẤM BÁO CÁO THÍ NGHIỆM"
        description="Không tìm thấy Rubric được gán cho assignment."
      >
        <Card className="p-10 text-center">
          <span className="material-symbols-outlined text-4xl text-primary">error</span>
          <h2 className="mt-3 text-headline-sm font-bold">Cấu hình Rubric không hợp lệ</h2>
          <p className="mt-2 text-[#64748B]">Không thể xác nhận kết quả cho đến khi cấu hình được khắc phục.</p>
        </Card>
      </LecturerPageShell>
    );

  const readOnly = result.status === 'PUBLISHED' || result.status === 'CONFIRMED';
  const values = result.criteriaScores.map((item) => item.score);
  const gradedCount = values.filter((value) => value !== '').length;
  const total = values.reduce((sum, value) => (value === '' ? sum : sum + Number(value)), 0);
  const complete = gradedCount === rubric.criteria.length;
  const validate = (requireAll) => {
    const next = {};
    rubric.criteria.forEach((criterion) => {
      const item = result.criteriaScores.find((score) => score.criterionId === criterion.id);
      const value = item?.score;
      if (value === '') {
        if (requireAll) next[criterion.id] = 'Cần nhập điểm trước khi hoàn thành.';
        return;
      }
      const number = Number(value);
      if (!Number.isFinite(number) || number < 0 || number > criterion.maxScore)
        next[criterion.id] = `Điểm phải từ 0 đến ${criterion.maxScore}.`;
    });
    setErrors(next);
    return !Object.keys(next).length;
  };
  const persist = (next, message) => {
    setResult(next);
    saveLabGrading(next);
    setFeedback(message);
  };
  const updateCriterion = (criterionId, field, value) =>
    setResult((current) => {
      const reopening = current.status === 'GRADED';
      return {
        ...current,
        status: reopening ? 'GRADING' : current.status,
        history: reopening
          ? [
              ...current.history,
              historyEntry({
                action: 'Chỉnh sửa kết quả chờ xác nhận',
                fromStatus: 'GRADED',
                toStatus: 'GRADING',
                previousScore: current.totalScore,
                nextScore: current.totalScore,
              }),
            ]
          : current.history,
        criteriaScores: current.criteriaScores.map((item) =>
          item.criterionId === criterionId ? { ...item, [field]: value } : item
        ),
      };
    });
  const updateLecturerComment = (value) =>
    setResult((current) => {
      const reopening = current.status === 'GRADED';
      return {
        ...current,
        lecturerComment: value,
        status: reopening ? 'GRADING' : current.status,
        history: reopening
          ? [
              ...current.history,
              historyEntry({
                action: 'Chỉnh sửa nhận xét chờ xác nhận',
                fromStatus: 'GRADED',
                toStatus: 'GRADING',
                previousScore: current.totalScore,
                nextScore: current.totalScore,
              }),
            ]
          : current.history,
      };
    });
  const saveDraft = () => {
    if (!validate(false)) return;
    const previous = result.totalScore;
    const next = {
      ...result,
      status: 'GRADING',
      totalScore: null,
      gradedBy: lecturerUser.name,
      history: [
        ...result.history,
        historyEntry({
          action: 'Lưu bản nháp',
          fromStatus: result.status,
          toStatus: 'GRADING',
          previousScore: previous,
          nextScore: null,
        }),
      ],
    };
    persist(next, 'Đã lưu bản nháp trong phiên demo.');
  };
  const finish = () => {
    if (!validate(true)) return;
    const next = {
      ...result,
      status: 'GRADED',
      totalScore: Number(total.toFixed(2)),
      gradedBy: lecturerUser.name,
      history: [
        ...result.history,
        historyEntry({
          action: 'Hoàn thành chấm',
          fromStatus: result.status,
          toStatus: 'GRADED',
          previousScore: result.totalScore,
          nextScore: total,
        }),
      ],
    };
    persist(next, 'Đã hoàn thành chấm, đang chờ xác nhận.');
  };
  const confirmResult = () => {
    const next = {
      ...result,
      status: 'CONFIRMED',
      confirmedBy: lecturerUser.name,
      confirmedAt: new Date().toISOString(),
      history: [
        ...result.history,
        historyEntry({
          action: 'Xác nhận kết quả',
          fromStatus: result.status,
          toStatus: 'CONFIRMED',
          previousScore: result.totalScore,
          nextScore: result.totalScore,
        }),
      ],
    };
    persist(next, 'Đã xác nhận kết quả trong phiên frontend.');
    setConfirmAction(null);
  };
  const publishResult = () => {
    const next = {
      ...result,
      status: 'PUBLISHED',
      publishedAt: new Date().toISOString(),
      history: [
        ...result.history,
        historyEntry({
          action: 'Công bố kết quả',
          fromStatus: result.status,
          toStatus: 'PUBLISHED',
          previousScore: result.totalScore,
          nextScore: result.totalScore,
        }),
      ],
    };
    persist(next, 'Đã chuyển kết quả sang trạng thái công bố trong dữ liệu demo.');
    setConfirmAction(null);
  };
  const requestAdjustment = () => {
    if (!adjustmentReason.trim()) return;
    const next = {
      ...result,
      status: 'GRADING',
      confirmedBy: null,
      confirmedAt: null,
      history: [
        ...result.history,
        historyEntry({
          action: 'Yêu cầu điều chỉnh',
          fromStatus: result.status,
          toStatus: 'GRADING',
          previousScore: result.totalScore,
          nextScore: result.totalScore,
          reason: adjustmentReason,
        }),
      ],
    };
    persist(next, 'Đã mở lại kết quả để điều chỉnh; kết quả cần được xác nhận lại.');
    setAdjusting(false);
    setAdjustmentReason('');
  };
  const statusMeta = labGradingStatusMeta[result.status];

  const rubricPanel = (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-headline-sm font-bold">{rubric.title}</h2>
            <p className="mt-1 text-body-sm text-[#64748B]">{rubric.description}</p>
          </div>
          <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
        </div>
      </Card>
      {rubric.criteria.map((criterion, index) => {
        const item = result.criteriaScores.find((score) => score.criterionId === criterion.id);
        return (
          <Card key={criterion.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold">
                  {index + 1}. {criterion.name}
                </h3>
                <p className="mt-1 text-body-sm text-[#64748B]">{criterion.description}</p>
              </div>
              <StatusBadge tone="neutral">Tối đa {criterion.maxScore}</StatusBadge>
            </div>
            <label className="mt-4 block text-body-sm font-semibold">
              Điểm đánh giá
              <input
                type="number"
                min="0"
                max={criterion.maxScore}
                step={rubric.scoreStep}
                disabled={readOnly}
                value={item.score}
                onChange={(event) => updateCriterion(criterion.id, 'score', event.target.value)}
                className="mt-2 w-full border border-[#CBD5E1] px-4 disabled:bg-[#F1F5F9]"
              />
            </label>
            {errors[criterion.id] && (
              <p className="mt-2 text-body-sm font-semibold text-primary" role="alert">
                {errors[criterion.id]}
              </p>
            )}
            <label className="mt-4 block text-body-sm font-semibold">
              Nhận xét tiêu chí
              <textarea
                rows="2"
                disabled={readOnly}
                value={item.comment}
                onChange={(event) => updateCriterion(criterion.id, 'comment', event.target.value)}
                className="mt-2 w-full border border-[#CBD5E1] p-3 disabled:bg-[#F1F5F9]"
              />
            </label>
          </Card>
        );
      })}
      <Card className="p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-body-sm text-[#64748B]">
              {complete ? 'Tổng điểm' : `Đã chấm ${gradedCount}/${rubric.criteria.length} tiêu chí · Tạm tính`}
            </p>
            <strong className="mt-1 block text-display-lg-mobile text-primary">
              {formatScore(total)} / {rubric.maxScore}
            </strong>
          </div>
        </div>
        <label className="mt-5 block text-body-sm font-semibold">
          Nhận xét của giảng viên
          <textarea
            rows="5"
            disabled={readOnly}
            value={result.lecturerComment}
            onChange={(event) => updateLecturerComment(event.target.value)}
            placeholder="Nhập nhận xét tổng thể về báo cáo thí nghiệm..."
            className="mt-2 w-full border border-[#CBD5E1] p-3 disabled:bg-[#F1F5F9]"
          />
        </label>
        <div className="mt-5 flex flex-wrap gap-2">
          {!readOnly && (
            <>
              <Button variant="secondary" onClick={saveDraft}>
                Lưu bản nháp
              </Button>
              <Button onClick={finish}>Hoàn thành chấm</Button>
            </>
          )}
          {result.status === 'GRADED' && <Button onClick={() => setConfirmAction('CONFIRM')}>Xác nhận kết quả</Button>}
          {result.status === 'CONFIRMED' && (
            <>
              <Button variant="secondary" onClick={() => setAdjusting(true)}>
                Yêu cầu điều chỉnh
              </Button>
              <Button onClick={() => setConfirmAction('PUBLISH')}>Công bố kết quả</Button>
            </>
          )}
          {result.status === 'PUBLISHED' && <StatusBadge tone="success">Kết quả ở chế độ chỉ đọc</StatusBadge>}
        </div>
      </Card>
    </div>
  );

  return (
    <LecturerPageShell
      currentPage="lecturer_labs.html"
      title={lab.title}
      eyebrow="CHẤM BÁO CÁO THÍ NGHIỆM"
      description={`${student.name} · ${student.id} · ${student.className}`}
      actions={
        <a href="lecturer_labs.html">
          <Button variant="secondary" icon="arrow_back">
            Quay lại danh sách
          </Button>
        </a>
      }
    >
      <Breadcrumbs items={['Thí nghiệm 3D', 'Báo cáo sinh viên']} current="Chấm báo cáo" />
      {feedback && (
        <div
          className="mt-5 rounded-xl border border-[#86EFAC] bg-[#DCFCE7] px-4 py-3 text-body-sm font-semibold text-[#15803D]"
          role="status"
        >
          {feedback}
        </div>
      )}
      <Card className="mt-5 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-label-md font-bold text-primary">{assignment.title}</p>
            <h2 className="mt-1 text-headline-md font-bold">{student.name}</h2>
            <p className="mt-1 text-body-sm text-[#64748B]">
              {student.id} · {student.className} · Nộp {formatDateTime(submission.submittedAt)}
            </p>
          </div>
          <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
        </div>
      </Card>
      <div className="mt-5 hidden xl:grid xl:grid-cols-[minmax(0,1.1fr)_minmax(420px,.9fr)] gap-5">
        <div>
          <SectionHeader title="Minh chứng sinh viên" />
          <div className="mt-4">
            <EvidencePanel submission={submission} assignment={assignment} />
          </div>
        </div>
        <div>
          <SectionHeader title="Rubric đánh giá" />
          <div className="mt-4">{rubricPanel}</div>
        </div>
      </div>
      <Card className="mt-5 p-5 xl:hidden">
        <Tabs
          items={[
            { id: 'EVIDENCE', label: 'Minh chứng' },
            { id: 'GRADING', label: 'Chấm điểm' },
          ]}
        >
          {(tab) => (
            <div className="pt-5">
              {tab === 'EVIDENCE' ? <EvidencePanel submission={submission} assignment={assignment} /> : rubricPanel}
            </div>
          )}
        </Tabs>
      </Card>
      <Card className="mt-5 p-5 md:p-6">
        <SectionHeader
          title="Lịch sử chấm điểm"
          
        />
        {result.history.length ? (
          <div className="mt-5">
            <DataTable
              columns={['Thời gian', 'Người thực hiện', 'Hành động', 'Trạng thái', 'Điểm', 'Lý do']}
              rows={result.history}
              renderRow={(item) => (
                <tr className="border-t border-[#E2E8F0]">
                  <td className="px-3 py-3 whitespace-nowrap">{formatDateTime(item.occurredAt)}</td>
                  <td className="px-3 py-3">{item.actor}</td>
                  <td className="px-3 py-3 font-semibold">{item.action}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {item.fromStatus} → {item.toStatus}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {formatScore(item.previousScore)} → {formatScore(item.nextScore)}
                  </td>
                  <td className="px-3 py-3">{item.reason || '—'}</td>
                </tr>
              )}
            />
          </div>
        ) : (
          <p className="mt-4 text-body-sm text-[#64748B]">Chưa có thao tác chấm điểm nào được ghi nhận.</p>
        )}
      </Card>
      {adjusting && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-[#0F172A]/45 p-4">
          <Card className="w-full max-w-lg p-6">
            <h2 className="text-headline-md font-bold">Yêu cầu điều chỉnh</h2>
            <p className="mt-2 text-body-sm text-[#64748B]">
              Kết quả sẽ quay về trạng thái đang chấm và cần xác nhận lại.
            </p>
            <label className="mt-5 block text-body-sm font-semibold">
              Lý do điều chỉnh
              <textarea
                rows="4"
                value={adjustmentReason}
                onChange={(event) => setAdjustmentReason(event.target.value)}
                className="mt-2 w-full border border-[#CBD5E1] p-3"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setAdjusting(false)}>
                Hủy
              </Button>
              <Button disabled={!adjustmentReason.trim()} onClick={requestAdjustment}>
                Xác nhận điều chỉnh
              </Button>
            </div>
          </Card>
        </div>
      )}
      {confirmAction === 'CONFIRM' && (
        <ConfirmDialog
          title="Xác nhận kết quả chấm?"
          description={`Bạn đang xác nhận kết quả chấm báo cáo thí nghiệm của ${student.name} với tổng điểm ${formatScore(result.totalScore)}/${rubric.maxScore}.`}
          confirmLabel="Xác nhận"
          onCancel={() => setConfirmAction(null)}
          onConfirm={confirmResult}
        />
      )}
      {confirmAction === 'PUBLISH' && (
        <ConfirmDialog
          title="Công bố kết quả?"
          description="Kết quả chấm sẽ được chuyển sang trạng thái công bố trong dữ liệu frontend. Bạn có chắc chắn muốn tiếp tục?"
          confirmLabel="Công bố kết quả"
          onCancel={() => setConfirmAction(null)}
          onConfirm={publishResult}
        />
      )}
    </LecturerPageShell>
  );
}
