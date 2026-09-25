import { formatPercent } from '../../lib/formatPercent.js';
import { PaginatedList } from "../../components/Pagination.jsx";
import React, { useEffect, useMemo, useState } from 'react';
import { useAcademicClass } from '../../lib/academicScope.js';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { LecturerPageShell } from '../../components/LecturerPageShell.jsx';
import { ProgressBar } from '../../components/ProgressBar.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { PaginatedCollection } from '../../components/Pagination.jsx';
import {
  assessments as initialAssessments,
  assessmentStats,
  assessmentStatusMeta,
  assessmentTypeLabels,
  cognitiveLevelLabels,
  lecturerCourses,
  lecturerQuestions,
  questionChapterLabels,
} from '../../data/lecturerData.js';

const levels = Object.keys(cognitiveLevelLabels);
const statusTabs = [
  { id: 'ALL', label: 'Tất cả' },
  ...Object.entries(assessmentStatusMeta).map(([id, meta]) => ({ id, label: meta.label })),
];
const wizardSteps = ['Thông tin', 'Ma trận đề', 'Câu hỏi', 'Cấu hình', 'Xem trước'];
const emptyMatrixRow = () => Object.fromEntries(levels.map((level) => [level, 0]));
const emptyAssessment = {
  title: '',
  type: 'REGULAR',
  description: '',
  classIds: [],
  chapters: [],
  matrix: {},
  questionIds: [],
  duration: 30,
  totalScore: 10,
  startAt: '',
  endAt: '',
  attemptsAllowed: 1,
  shuffleQuestions: true,
  shuffleAnswers: true,
  showScoreAfterSubmit: true,
  showAnswersAfterClose: true,
  showExplanationAfterSubmit: false,
};

function formatDateTime(value) {
  if (!value) return 'Chưa thiết lập';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function matrixTotal(matrix) {
  return Object.values(matrix).reduce(
    (total, row) => total + levels.reduce((sum, level) => sum + (Number(row[level]) || 0), 0),
    0
  );
}

function matrixDeficits(matrix, selectedQuestions) {
  const deficits = [];
  Object.entries(matrix).forEach(([chapterId, row]) =>
    levels.forEach((level) => {
      const required = Number(row[level]) || 0;
      const selected = selectedQuestions.filter(
        (question) => question.chapterId === chapterId && question.cognitiveLevel === level
      ).length;
      if (selected < required) deficits.push({ chapterId, level, required, selected });
    })
  );
  return deficits;
}

function MatrixTable({ matrix, onChange, questions, readOnly = false }) {
  const chapterTotals = Object.fromEntries(
    Object.entries(matrix).map(([chapterId, row]) => [
      chapterId,
      levels.reduce((sum, level) => sum + (Number(row[level]) || 0), 0),
    ])
  );
  const levelTotals = Object.fromEntries(
    levels.map((level) => [level, Object.values(matrix).reduce((sum, row) => sum + (Number(row[level]) || 0), 0)])
  );
  return (
    <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
      <table className="w-full min-w-[760px] text-left text-body-sm">
        <thead className="bg-[#F8FAFC] text-[#64748B]">
          <tr>
            <th className="px-3 py-3">Nội dung</th>
            {levels.map((level) => (
              <th key={level} className="px-3 py-3 text-center">
                {cognitiveLevelLabels[level]}
              </th>
            ))}
            <th className="px-3 py-3 text-center">Tổng</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(matrix).map(([chapterId, row]) => (
            <tr key={chapterId} className="border-t border-[#E2E8F0]">
              <td className="px-3 py-3 font-semibold">{questionChapterLabels[chapterId]}</td>
              {levels.map((level) => {
                const available = questions.filter(
                  (question) =>
                    question.status === 'APPROVED' &&
                    question.chapterId === chapterId &&
                    question.cognitiveLevel === level
                ).length;
                const required = Number(row[level]) || 0;
                return (
                  <td key={level} className="px-3 py-3 text-center">
                    <input
                      type="number"
                      min="0"
                      value={required}
                      disabled={readOnly}
                      onChange={(event) => onChange?.(chapterId, level, Math.max(0, Number(event.target.value) || 0))}
                      aria-label={`${questionChapterLabels[chapterId]} ${cognitiveLevelLabels[level]}`}
                      className="mx-auto w-16 border border-[#CBD5E1] bg-white px-2 text-center disabled:bg-[#F8FAFC]"
                    />
                    {required > available && (
                      <span className="mt-1 block text-label-sm text-[#B45309]">
                        Có {available}/{required}
                      </span>
                    )}
                  </td>
                );
              })}
              <td className="px-3 py-3 text-center font-bold">{chapterTotals[chapterId]}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-[#CBD5E1] bg-[#F8FAFC] font-bold">
          <tr>
            <td className="px-3 py-3">Tổng</td>
            {levels.map((level) => (
              <td key={level} className="px-3 py-3 text-center">
                {levelTotals[level]}
              </td>
            ))}
            <td className="px-3 py-3 text-center text-primary">{matrixTotal(matrix)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function CloDistribution({ questions }) {
  const total = questions.length || 1;
  return (
    <Card className="p-4">
      <h3 className="font-semibold">Phân bố CLO</h3>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        {['CLO1', 'CLO2', 'CLO3', 'CLO4'].map((clo) => {
          const count = questions.filter((question) => question.clo === clo).length;
          const percent = questions.length ? Math.round((count / total) * 100) : 0;
          return (
            <Card as="div" key={clo} className="bg-[#F8FAFC] p-3">
              <div className="flex justify-between text-body-sm">
                <strong>{clo}</strong>
                <span>{formatPercent(percent)}</span>
              </div>
              <ProgressBar value={percent} compact className="mt-2" />
            </Card>
          );
        })}
      </div>
    </Card>
  );
}

function Wizard({ assessment, onCancel, onSave, onViewQuestion }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(() =>
    assessment
      ? {
          ...assessment,
          classIds: [...assessment.classIds],
          chapters: [...assessment.chapters],
          matrix: Object.fromEntries(Object.entries(assessment.matrix).map(([key, row]) => [key, { ...row }])),
          questionIds: [...assessment.questionIds],
        }
      : { ...emptyAssessment, classIds: [], chapters: [], matrix: {}, questionIds: [] }
  );
  const [errors, setErrors] = useState([]);
  const [questionQuery, setQuestionQuery] = useState('');
  const [questionChapter, setQuestionChapter] = useState('ALL');
  const [selectionFeedback, setSelectionFeedback] = useState('');
  const selectedQuestions = lecturerQuestions.filter((question) => data.questionIds.includes(question.id));
  const totalQuestions = matrixTotal(data.matrix);

  const toggleValue = (field, value) =>
    setData((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value],
    }));
  const toggleChapter = (chapterId) =>
    setData((current) => {
      const selected = current.chapters.includes(chapterId);
      const chapters = selected
        ? current.chapters.filter((item) => item !== chapterId)
        : [...current.chapters, chapterId];
      const matrix = { ...current.matrix };
      if (selected) delete matrix[chapterId];
      else matrix[chapterId] = emptyMatrixRow();
      return {
        ...current,
        chapters,
        matrix,
        questionIds: current.questionIds.filter((id) =>
          chapters.includes(lecturerQuestions.find((question) => question.id === id)?.chapterId)
        ),
      };
    });
  const updateMatrix = (chapterId, level, value) =>
    setData((current) => ({
      ...current,
      matrix: { ...current.matrix, [chapterId]: { ...current.matrix[chapterId], [level]: value } },
    }));
  const validateStep = (currentStep) => {
    const nextErrors = [];
    if (currentStep === 0) {
      if (!data.title.trim()) nextErrors.push('Vui lòng nhập tên bài kiểm tra.');
      if (!data.classIds.length) nextErrors.push('Vui lòng chọn ít nhất một lớp.');
      if (!data.chapters.length) nextErrors.push('Vui lòng chọn phạm vi nội dung.');
    }
    if (currentStep === 1 && totalQuestions === 0) nextErrors.push('Ma trận phải có ít nhất một câu hỏi.');
    if (currentStep === 2) {
      if (data.questionIds.length !== totalQuestions)
        nextErrors.push(`Cần chọn đúng ${totalQuestions} câu hỏi; hiện đã chọn ${data.questionIds.length}.`);
      const deficits = matrixDeficits(data.matrix, selectedQuestions);
      if (deficits.length) nextErrors.push('Các câu đã chọn chưa đáp ứng đúng phân bố chương và mức độ trong ma trận.');
    }
    if (currentStep === 3) {
      if (Number(data.duration) <= 0) nextErrors.push('Thời gian làm bài phải lớn hơn 0.');
      if (!data.startAt || !data.endAt) nextErrors.push('Vui lòng nhập đầy đủ thời gian bắt đầu và kết thúc.');
      else if (new Date(data.endAt) <= new Date(data.startAt))
        nextErrors.push('Thời gian kết thúc phải sau thời gian bắt đầu.');
    }
    setErrors(nextErrors);
    return nextErrors.length === 0;
  };
  const next = () => {
    if (validateStep(step)) {
      setStep((current) => Math.min(4, current + 1));
      setErrors([]);
    }
  };
  const autoSelect = () => {
    const selected = [];
    const missing = [];
    Object.entries(data.matrix).forEach(([chapterId, row]) =>
      levels.forEach((level) => {
        const required = Number(row[level]) || 0;
        const matches = lecturerQuestions
          .filter(
            (question) =>
              question.status === 'APPROVED' && question.chapterId === chapterId && question.cognitiveLevel === level
          )
          .slice(0, required);
        selected.push(...matches.map((question) => question.id));
        if (matches.length < required)
          missing.push(
            `Thiếu ${required - matches.length} câu ${questionChapterLabels[chapterId].split(' — ')[0]} — ${cognitiveLevelLabels[level]}.`
          );
      })
    );
    setData((current) => ({ ...current, questionIds: [...new Set(selected)] }));
    setSelectionFeedback(missing.length ? missing.join(' ') : `Đã chọn đủ ${selected.length} câu từ Question Bank.`);
  };
  const toggleQuestion = (id) =>
    setData((current) => ({
      ...current,
      questionIds: current.questionIds.includes(id)
        ? current.questionIds.filter((item) => item !== id)
        : [...current.questionIds, id],
    }));
  const moveQuestion = (index, direction) =>
    setData((current) => {
      const nextIds = [...current.questionIds];
      const target = index + direction;
      if (target < 0 || target >= nextIds.length) return current;
      [nextIds[index], nextIds[target]] = [nextIds[target], nextIds[index]];
      return { ...current, questionIds: nextIds };
    });
  const manualQuestions = lecturerQuestions.filter(
    (question) =>
      question.status === 'APPROVED' &&
      data.chapters.includes(question.chapterId) &&
      (questionChapter === 'ALL' || question.chapterId === questionChapter) &&
      (!questionQuery ||
        `${question.id} ${question.content} ${question.topic}`
          .toLocaleLowerCase('vi')
          .includes(questionQuery.toLocaleLowerCase('vi')))
  );
  const matrixWarnings = Object.entries(data.matrix).flatMap(([chapterId, row]) =>
    levels.flatMap((level) => {
      const required = Number(row[level]) || 0;
      const available = lecturerQuestions.filter(
        (question) =>
          question.status === 'APPROVED' && question.chapterId === chapterId && question.cognitiveLevel === level
      ).length;
      return required > available
        ? [
            `Ngân hàng câu hỏi chỉ có ${available}/${required} câu phù hợp cho ${questionChapterLabels[chapterId].split(' — ')[0]} — ${cognitiveLevelLabels[level]}.`,
          ]
        : [];
    })
  );
  const save = (draft) => {
    if (!draft && ![0, 1, 2, 3].every((value) => validateStep(value))) return;
    const start = new Date(data.startAt);
    const end = new Date(data.endAt);
    const now = new Date();
    const status = draft ? 'DRAFT' : start > now ? 'SCHEDULED' : end > now ? 'OPEN' : 'CLOSED';
    onSave({ ...data, status });
  };

  return (
    <div className="space-y-5">
      <Card className="p-4 md:p-5">
        <div className="flex min-w-max items-center gap-2 overflow-x-auto pb-1">
          {wizardSteps.map((label, index) => (
            <React.Fragment key={label}>
              <div
                className={`flex items-center gap-2 rounded-full px-3 py-2 text-body-sm ${index === step ? 'bg-primary text-white' : index < step ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#F1F5F9] text-[#64748B]'}`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-xs font-bold text-[#475569]">
                  {index < step ? '✓' : index + 1}
                </span>
                <span className="whitespace-nowrap font-semibold">{label}</span>
              </div>
              {index < wizardSteps.length - 1 && <span className="h-px w-4 shrink-0 bg-[#CBD5E1]" />}
            </React.Fragment>
          ))}
        </div>
      </Card>
      {errors.length > 0 && (
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-body-sm text-primary" role="alert">
          <strong>Vui lòng kiểm tra:</strong>
          <ul className="mt-2 list-disc pl-5">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      {step === 0 && (
        <Card className="p-5 md:p-6">
          <h2 className="text-headline-md font-bold">Thông tin bài kiểm tra</h2>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="text-body-sm font-semibold md:col-span-2">
              Tên bài kiểm tra *
              <input
                value={data.title}
                onChange={(event) => setData({ ...data, title: event.target.value })}
                placeholder="Kiểm tra Chương 2 — Động lực học"
                className="mt-2 w-full border border-[#CBD5E1] px-4"
              />
            </label>
            <label className="text-body-sm font-semibold">
              Loại
              <select
                value={data.type}
                onChange={(event) => setData({ ...data, type: event.target.value })}
                className="mt-2 w-full border border-[#CBD5E1] bg-white px-4"
              >
                {Object.entries(assessmentTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-body-sm font-semibold md:col-span-2">
              Mô tả
              <textarea
                value={data.description}
                onChange={(event) => setData({ ...data, description: event.target.value })}
                rows="3"
                className="mt-2 w-full border border-[#CBD5E1] p-3"
              />
            </label>
          </div>
          <fieldset className="mt-5">
            <legend className="text-body-sm font-semibold">Lớp được giao *</legend>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {lecturerCourses.map((course) => (
                <label
                  key={course.className}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${data.classIds.includes(course.className) ? 'border-primary bg-[#FEF2F2]' : 'border-[#E2E8F0]'}`}
                >
                  <input
                    type="checkbox"
                    checked={data.classIds.includes(course.className)}
                    onChange={() => toggleValue('classIds', course.className)}
                    className="h-5 w-5 accent-[#E52220]"
                  />
                  <span>
                    <strong className="block">{course.className}</strong>
                    <span className="text-body-sm text-[#64748B]">{course.students} sinh viên</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-5">
            <legend className="text-body-sm font-semibold">Phạm vi nội dung *</legend>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {Object.entries(questionChapterLabels).map(([chapterId, label]) => (
                <label
                  key={chapterId}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${data.chapters.includes(chapterId) ? 'border-primary bg-[#FEF2F2]' : 'border-[#E2E8F0]'}`}
                >
                  <input
                    type="checkbox"
                    checked={data.chapters.includes(chapterId)}
                    onChange={() => toggleChapter(chapterId)}
                    className="h-5 w-5 accent-[#E52220]"
                  />
                  <span className="font-semibold">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </Card>
      )}
      {step === 1 && (
        <div className="space-y-5">
          <Card className="p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-headline-md font-bold">Ma trận đề</h2>
                <p className="mt-1 text-body-sm text-[#64748B]">Điều chỉnh số câu theo chương và mức độ nhận thức.</p>
              </div>
              <StatusBadge tone="primary">Tổng số câu: {totalQuestions}</StatusBadge>
            </div>
            <div className="mt-5">
              <MatrixTable matrix={data.matrix} onChange={updateMatrix} questions={lecturerQuestions} />
            </div>
            {matrixWarnings.length > 0 && (
              <Card as="div" className="mt-4 border-[#FDE68A] bg-[#FFFBEB] p-4 text-body-sm text-[#B45309]">
                <strong>Question Bank chưa đủ theo ma trận:</strong>
                <ul className="mt-2 list-disc pl-5">
                  {matrixWarnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
                <a
                  href="lecturer_question_bank.html"
                  className="mt-3 inline-block font-semibold text-primary hover:underline"
                >
                  Xem câu hỏi
                </a>
              </Card>
            )}
          </Card>
          <CloDistribution questions={selectedQuestions} />
        </div>
      )}
      {step === 2 && (
        <div className="space-y-5">
          <Card className="p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-headline-md font-bold">Chọn câu hỏi</h2>
                <p className="mt-1 text-body-sm text-[#64748B]">
                  Đã chọn {data.questionIds.length} / {totalQuestions} câu
                </p>
              </div>
              <StatusBadge tone={data.questionIds.length === totalQuestions ? 'success' : 'warning'}>
                {data.questionIds.length === totalQuestions
                  ? 'Đủ số lượng'
                  : data.questionIds.length < totalQuestions
                    ? 'Chưa đủ câu'
                    : 'Vượt số lượng'}
              </StatusBadge>
            </div>
            <div className="mt-5">
              <Tabs
                items={[
                  { id: 'AUTO', label: 'Tự động chọn' },
                  { id: 'MANUAL', label: 'Chọn thủ công' },
                ]}
              >
                {(mode) =>
                  mode === 'AUTO' ? (
                    <div className="py-6 text-center">
                      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FEE2E2] text-primary">
                        <span className="material-symbols-outlined text-3xl">auto_awesome</span>
                      </span>
                      <h3 className="mt-4 text-headline-sm font-bold">Tạo đề từ ma trận</h3>
                      <p className="mx-auto mt-2 max-w-xl text-body-md text-[#64748B]">
                        Hệ thống chọn ổn định các câu đã phê duyệt phù hợp với chương và mức độ.
                      </p>
                      <Button className="mt-5" icon="auto_awesome" onClick={autoSelect}>
                        Tạo đề từ ma trận
                      </Button>
                      {selectionFeedback && (
                        <p
                          className={`mt-4 text-body-sm ${selectionFeedback.startsWith('Thiếu') ? 'text-[#B45309]' : 'text-[#15803D]'}`}
                        >
                          {selectionFeedback}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="pt-5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        <label className="md:col-span-2 text-body-sm font-semibold">
                          Tìm câu hỏi
                          <input
                            value={questionQuery}
                            onChange={(event) => setQuestionQuery(event.target.value)}
                            type="search"
                            className="mt-2 w-full border border-[#CBD5E1] px-4"
                          />
                        </label>
                        <label className="text-body-sm font-semibold">
                          Chương
                          <select
                            value={questionChapter}
                            onChange={(event) => setQuestionChapter(event.target.value)}
                            className="mt-2 w-full border border-[#CBD5E1] bg-white px-4"
                          >
                            <option value="ALL">Tất cả</option>
                            {data.chapters.map((chapterId) => (
                              <option key={chapterId} value={chapterId}>
                                {questionChapterLabels[chapterId]}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <DataTable
                        columns={['', 'Mã', 'Câu hỏi', 'Chương', 'Mức độ', 'CLO']}
                        rows={manualQuestions}
                        renderRow={(row) => (
                          <tr className="border-t border-[#E2E8F0]">
                            <td className="px-3 py-3">
                              <input
                                type="checkbox"
                                checked={data.questionIds.includes(row.id)}
                                onChange={() => toggleQuestion(row.id)}
                                aria-label={`Chọn ${row.id}`}
                                className="h-5 w-5 accent-[#E52220]"
                              />
                            </td>
                            <td className="px-3 py-3 font-mono font-semibold whitespace-nowrap">{row.id}</td>
                            <td className="px-3 py-3">
                              <p className="line-clamp-2 min-w-[260px] max-w-[400px]">{row.content}</p>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">{row.chapterId}</td>
                            <td className="px-3 py-3 whitespace-nowrap">{cognitiveLevelLabels[row.cognitiveLevel]}</td>
                            <td className="px-3 py-3">{row.clo}</td>
                          </tr>
                        )}
                      />
                    </div>
                  )
                }
              </Tabs>
            </div>
          </Card>
          <Card className="p-5 md:p-6">
            <h2 className="text-headline-sm font-bold">Câu hỏi trong đề</h2>
            {selectedQuestions.length ? (
              <PaginatedList as="ol" className="mt-4 space-y-3">
                {data.questionIds.map((id, index) => {
                  const question = lecturerQuestions.find((item) => item.id === id);
                  if (!question) return null;
                  return (
                    <Card as="li"
                      key={id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-4"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FEE2E2] font-bold text-primary">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <strong>{question.id}</strong>
                        <p className="line-clamp-1 text-body-sm text-[#64748B]">{question.content}</p>
                        <span className="text-label-sm text-[#64748B]">
                          {question.chapterId} · {cognitiveLevelLabels[question.cognitiveLevel]} · {question.clo}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => moveQuestion(index, -1)}
                          disabled={index === 0}
                          aria-label={`Đưa ${id} lên`}
                          className="p-2 text-[#64748B] disabled:opacity-30"
                        >
                          <span className="material-symbols-outlined">arrow_upward</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => moveQuestion(index, 1)}
                          disabled={index === data.questionIds.length - 1}
                          aria-label={`Đưa ${id} xuống`}
                          className="p-2 text-[#64748B] disabled:opacity-30"
                        >
                          <span className="material-symbols-outlined">arrow_downward</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onViewQuestion(question)}
                          className="px-2 text-body-sm font-semibold text-primary"
                        >
                          Xem
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleQuestion(id)}
                          className="px-2 text-body-sm font-semibold text-primary"
                        >
                          Loại
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </PaginatedList>
            ) : (
              <p className="mt-4 text-body-sm text-[#64748B]">Chưa có câu hỏi nào trong đề.</p>
            )}
          </Card>
          <CloDistribution questions={selectedQuestions} />
        </div>
      )}
      {step === 3 && (
        <Card className="p-5 md:p-6">
          <h2 className="text-headline-md font-bold">Cấu hình bài kiểm tra</h2>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <label className="text-body-sm font-semibold">
              Thời gian làm bài (phút) *
              <input
                type="number"
                min="1"
                value={data.duration}
                onChange={(event) => setData({ ...data, duration: Number(event.target.value) })}
                className="mt-2 w-full border border-[#CBD5E1] px-4"
              />
            </label>
            <label className="text-body-sm font-semibold">
              Thời gian bắt đầu *
              <input
                type="datetime-local"
                value={data.startAt}
                onChange={(event) => setData({ ...data, startAt: event.target.value })}
                className="mt-2 w-full border border-[#CBD5E1] px-4"
              />
            </label>
            <label className="text-body-sm font-semibold">
              Thời gian kết thúc *
              <input
                type="datetime-local"
                value={data.endAt}
                onChange={(event) => setData({ ...data, endAt: event.target.value })}
                className="mt-2 w-full border border-[#CBD5E1] px-4"
              />
            </label>
            <label className="text-body-sm font-semibold">
              Số lần làm bài
              <select
                value={data.attemptsAllowed}
                onChange={(event) =>
                  setData({
                    ...data,
                    attemptsAllowed: event.target.value === 'UNLIMITED' ? 'UNLIMITED' : Number(event.target.value),
                  })
                }
                className="mt-2 w-full border border-[#CBD5E1] bg-white px-4"
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="UNLIMITED">Không giới hạn</option>
              </select>
            </label>
            <label className="text-body-sm font-semibold">
              Tổng điểm
              <input
                type="number"
                min="1"
                value={data.totalScore}
                onChange={(event) => setData({ ...data, totalScore: Number(event.target.value) })}
                className="mt-2 w-full border border-[#CBD5E1] px-4"
              />
            </label>
            <Card as="div" className="bg-[#F8FAFC] p-4">
              <span className="text-body-sm text-[#64748B]">Chia đều điểm</span>
              <strong className="mt-1 block text-headline-sm">
                Mỗi câu:{' '}
                {totalQuestions ? (Number(data.totalScore) / totalQuestions).toFixed(2).replace(/\.00$/, '') : '0'} điểm
              </strong>
            </Card>
          </div>
          <fieldset className="mt-6">
            <legend className="font-semibold">Tùy chọn hiển thị</legend>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                ['shuffleQuestions', 'Đảo thứ tự câu hỏi'],
                ['shuffleAnswers', 'Đảo thứ tự đáp án'],
                ['showScoreAfterSubmit', 'Hiển thị điểm sau khi nộp'],
                ['showAnswersAfterClose', 'Hiển thị đáp án sau khi bài kiểm tra kết thúc'],
                ['showExplanationAfterSubmit', 'Cho phép xem lời giải ngay sau khi nộp'],
              ].map(([field, label]) => (
                <label key={field} className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] p-4">
                  <input
                    type="checkbox"
                    checked={data[field]}
                    onChange={(event) => setData({ ...data, [field]: event.target.checked })}
                    className="h-5 w-5 accent-[#E52220]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </Card>
      )}
      {step === 4 && (
        <div className="space-y-5">
          <Card className="p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-label-md font-bold text-primary">XEM TRƯỚC BÀI KIỂM TRA</p>
                <h2 className="mt-1 text-headline-md font-bold">{data.title}</h2>
                <p className="mt-1 text-body-md text-[#64748B]">{assessmentTypeLabels[data.type]}</p>
              </div>
              <StatusBadge tone="primary">
                {totalQuestions} câu · {data.duration} phút · {data.totalScore} điểm
              </StatusBadge>
            </div>
            <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-body-sm">
              <div>
                <dt className="text-[#64748B]">Lớp</dt>
                <dd className="mt-1 font-semibold">{data.classIds.join(', ')}</dd>
              </div>
              <div>
                <dt className="text-[#64748B]">Bắt đầu</dt>
                <dd className="mt-1 font-semibold">{formatDateTime(data.startAt)}</dd>
              </div>
              <div>
                <dt className="text-[#64748B]">Kết thúc</dt>
                <dd className="mt-1 font-semibold">{formatDateTime(data.endAt)}</dd>
              </div>
              <div>
                <dt className="text-[#64748B]">Số lần làm</dt>
                <dd className="mt-1 font-semibold">
                  {data.attemptsAllowed === 'UNLIMITED' ? 'Không giới hạn' : data.attemptsAllowed}
                </dd>
              </div>
            </dl>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-body-sm">
              {[
                ['shuffleQuestions', 'Đảo câu hỏi'],
                ['shuffleAnswers', 'Đảo đáp án'],
                ['showScoreAfterSubmit', 'Hiển thị điểm sau khi nộp'],
                ['showAnswersAfterClose', 'Hiển thị đáp án sau khi kết thúc'],
              ].map(([field, label]) => (
                <span key={field} className={data[field] ? 'text-[#15803D]' : 'text-[#64748B]'}>
                  {data[field] ? '✓' : '○'} {label}
                </span>
              ))}
            </div>
          </Card>
          <Card className="p-5 md:p-6">
            <h2 className="text-headline-sm font-bold">Ma trận đề</h2>
            <div className="mt-4">
              <MatrixTable matrix={data.matrix} questions={lecturerQuestions} readOnly />
            </div>
          </Card>
          <Card className="p-5 md:p-6">
            <h2 className="text-headline-sm font-bold">Danh sách câu hỏi</h2>
            <PaginatedList as="ol" className="mt-4 divide-y divide-[#E2E8F0]">
              {data.questionIds.map((id, index) => {
                const question = lecturerQuestions.find((item) => item.id === id);
                return question ? (
                  <li key={id} className="flex items-start gap-3 py-3">
                    <strong className="text-primary">{index + 1}.</strong>
                    <div className="flex-1">
                      <span className="font-mono text-label-md">{id}</span>
                      <p className="mt-1 line-clamp-2 text-body-sm">{question.content}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onViewQuestion(question)}
                      className="text-body-sm font-semibold text-primary"
                    >
                      Xem
                    </button>
                  </li>
                ) : null;
              })}
            </PaginatedList>
          </Card>
        </div>
      )}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <Button variant="ghost" onClick={onCancel}>
          Hủy tạo bài
        </Button>
        <div className="flex flex-col-reverse sm:flex-row gap-2">
          {step > 0 && (
            <Button
              variant="secondary"
              icon="arrow_back"
              onClick={() => {
                setStep((current) => current - 1);
                setErrors([]);
              }}
            >
              Quay lại
            </Button>
          )}
          {step < 4 ? (
            <Button icon="arrow_forward" onClick={next}>
              Tiếp tục
            </Button>
          ) : (
            <>
              <Button variant="secondary" icon="save" onClick={() => save(true)}>
                Lưu bản nháp
              </Button>
              <Button icon="send" onClick={() => save(false)}>
                Giao bài
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AssessmentDetail({ assessment, onClose, onViewQuestion }) {
  const status = assessmentStatusMeta[assessment.status];
  const questions = assessment.questionIds
    .map((id) => lecturerQuestions.find((item) => item.id === id))
    .filter(Boolean);
  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#0F172A]/45 p-2 md:p-6"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="max-h-[calc(100dvh-16px)] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assessment-detail-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] p-5 md:p-6">
          <div>
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
            <h2 id="assessment-detail-title" className="mt-3 text-headline-md font-bold">
              {assessment.title}
            </h2>
            <p className="mt-1 text-body-sm text-[#64748B]">
              {assessmentTypeLabels[assessment.type]} · {assessment.id}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng chi tiết" className="p-2 text-[#64748B]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-5 md:p-6">
          <Tabs
            items={[
              { id: 'OVERVIEW', label: 'Tổng quan' },
              { id: 'QUESTIONS', label: 'Câu hỏi' },
              { id: 'STUDENTS', label: 'Sinh viên' },
            ]}
          >
            {(tab) =>
              tab === 'OVERVIEW' ? (
                <div className="space-y-5 pt-5">
                  <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-body-sm">
                    <div>
                      <dt className="text-[#64748B]">Lớp</dt>
                      <dd className="mt-1 font-semibold">{assessment.classIds.join(', ')}</dd>
                    </div>
                    <div>
                      <dt className="text-[#64748B]">Số câu · Điểm</dt>
                      <dd className="mt-1 font-semibold">
                        {assessment.questionIds.length} · {assessment.totalScore} điểm
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#64748B]">Thời lượng</dt>
                      <dd className="mt-1 font-semibold">{assessment.duration} phút</dd>
                    </div>
                    <div>
                      <dt className="text-[#64748B]">Hoàn thành</dt>
                      <dd className="mt-1 font-semibold">
                        {assessment.completedCount}/{assessment.totalStudents}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#64748B]">Bắt đầu</dt>
                      <dd className="mt-1 font-semibold">{formatDateTime(assessment.startAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-[#64748B]">Kết thúc</dt>
                      <dd className="mt-1 font-semibold">{formatDateTime(assessment.endAt)}</dd>
                    </div>
                  </dl>
                  <MatrixTable matrix={assessment.matrix} questions={lecturerQuestions} readOnly />
                </div>
              ) : tab === 'QUESTIONS' ? (
                <PaginatedList as="ol" className="space-y-3 pt-5">
                  {questions.map((question, index) => (
                    <Card as="li" key={question.id} className="flex gap-3 p-4">
                      <strong className="text-primary">{index + 1}.</strong>
                      <div className="flex-1">
                        <span className="font-mono text-label-md">{question.id}</span>
                        <p className="mt-1 text-body-sm">{question.content}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onViewQuestion(question)}
                        className="text-body-sm font-semibold text-primary"
                      >
                        Xem
                      </button>
                    </Card>
                  ))}
                </PaginatedList>
              ) : (
                <div className="pt-5">
                  <Card className="p-5">
                    <h3 className="font-semibold">Tóm tắt sinh viên</h3>
                    <p className="mt-2 text-body-md text-[#64748B]">
                      Đã hoàn thành {assessment.completedCount}/{assessment.totalStudents} sinh viên. Chi tiết từng lượt
                      làm sẽ được phát triển ở bước tiếp theo.
                    </p>
                    <ProgressBar
                      value={
                        assessment.totalStudents ? (assessment.completedCount / assessment.totalStudents) * 100 : 0
                      }
                      className="mt-4"
                    />
                  </Card>
                </div>
              )
            }
          </Tabs>
          <div className="mt-6 flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export function LecturerAssessmentsPage() {
  const [assessments, setAssessments] = useState(initialAssessments);
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useAcademicClass();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [chapterFilter, setChapterFilter] = useState('ALL');
  const [tabsKey, setTabsKey] = useState(0);
  const [wizard, setWizard] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [viewingQuestion, setViewingQuestion] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [feedback, setFeedback] = useState('');
  useEffect(() => {
    if (!feedback) return undefined;
    const timer = window.setTimeout(() => setFeedback(''), 3000);
    return () => window.clearTimeout(timer);
  }, [feedback]);
  const baseFiltered = useMemo(
    () =>
      assessments.filter(
        (item) =>
          (!query || item.title.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))) &&
          (classFilter === 'ALL' || item.classIds.includes(classFilter)) &&
          (statusFilter === 'ALL' || item.status === statusFilter) &&
          (chapterFilter === 'ALL' || item.chapters.includes(chapterFilter))
      ),
    [assessments, chapterFilter, classFilter, query, statusFilter]
  );
  const resetFilters = () => {
    setQuery('');
    setClassFilter('ALL');
    setStatusFilter('ALL');
    setChapterFilter('ALL');
    setTabsKey((key) => key + 1);
  };
  const saveAssessment = (values) => {
    const existing = editing;
    const id =
      existing?.id ??
      `ASM${String(Math.max(0, ...assessments.map((item) => Number(item.id.replace('ASM', '')) || 0)) + 1).padStart(3, '0')}`;
    const totalStudents = values.classIds.reduce(
      (sum, className) => sum + (lecturerCourses.find((course) => course.className === className)?.students ?? 0),
      0
    );
    const next = { ...values, id, completedCount: existing?.completedCount ?? 0, totalStudents };
    setAssessments((current) =>
      existing ? current.map((item) => (item.id === id ? next : item)) : [next, ...current]
    );
    setWizard(false);
    setEditing(null);
    setFeedback(values.status === 'DRAFT' ? 'Đã lưu bản nháp.' : 'Đã giao bài kiểm tra.');
  };
  const copyAssessment = (item) => {
    const id = `ASM${String(Math.max(0, ...assessments.map((assessment) => Number(assessment.id.replace('ASM', '')) || 0)) + 1).padStart(3, '0')}`;
    setAssessments((current) => [
      {
        ...item,
        id,
        title: `${item.title} — Bản sao`,
        status: 'DRAFT',
        completedCount: 0,
        classIds: [...item.classIds],
        chapters: [...item.chapters],
        matrix: Object.fromEntries(Object.entries(item.matrix).map(([key, row]) => [key, { ...row }])),
        questionIds: [...item.questionIds],
      },
      ...current,
    ]);
    setFeedback(`Đã sao chép thành ${id}.`);
  };
  const changeStatus = (id, status) => {
    setAssessments((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
    setFeedback(`Đã chuyển trạng thái sang “${assessmentStatusMeta[status].label}”.`);
  };
  const confirmDelete = () => {
    setAssessments((current) => current.filter((item) => item.id !== deleting.id));
    setFeedback(`Đã xóa ${deleting.id}.`);
    setDeleting(null);
  };
  const openEdit = (item) => {
    setEditing(item);
    setWizard(true);
  };

  if (wizard)
    return (
      <LecturerPageShell
        currentPage="lecturer_assessments.html"
        title={editing ? 'Chỉnh sửa bài kiểm tra' : 'Tạo bài kiểm tra'}
        eyebrow="WIZARD TẠO BÀI ĐÁNH GIÁ"
        description="Thiết lập thông tin, ma trận, câu hỏi và cấu hình trước khi giao bài."
      >
        <Wizard
          assessment={editing}
          onCancel={() => {
            setWizard(false);
            setEditing(null);
          }}
          onSave={saveAssessment}
          onViewQuestion={setViewingQuestion}
        />
        {viewingQuestion && <QuestionPreview question={viewingQuestion} onClose={() => setViewingQuestion(null)} />}
      </LecturerPageShell>
    );

  return (
    <LecturerPageShell
      currentPage="lecturer_assessments.html"
      title="Bài tập & kiểm tra"
      eyebrow="ĐÁNH GIÁ HỌC TẬP"
      description="Tạo, giao và quản lý các bài đánh giá Vật lý đại cương 1"
      actions={
        <Button icon="add" onClick={() => setWizard(true)}>
          Tạo bài kiểm tra
        </Button>
      }
    >
      {feedback && (
        <div
          className="flex items-center gap-2 rounded-xl border border-[#86EFAC] bg-[#F0FDF4] px-4 py-3 text-body-sm font-semibold text-[#15803D]"
          role="status"
        >
          <span className="material-symbols-outlined">check_circle</span>
          {feedback}
        </div>
      )}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Thống kê bài kiểm tra">
        <StatCard label="Tổng bài kiểm tra" value={String(assessmentStats.total)} icon="assignment" />
        <StatCard label="Đang mở" value={String(assessmentStats.open)} icon="play_circle" tone="success" />
        <StatCard label="Sắp diễn ra" value={String(assessmentStats.scheduled)} icon="event_upcoming" tone="warning" />
        <StatCard label="Đã kết thúc" value={String(assessmentStats.closed)} icon="task_alt" />
      </section>
      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <label className="text-body-sm font-semibold xl:col-span-2">
            Tìm bài kiểm tra
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              placeholder="Tìm bài kiểm tra..."
              className="mt-2 w-full border border-[#CBD5E1] px-4"
            />
          </label>
          <label className="text-body-sm font-semibold">
            Lớp
            <select
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
              className="mt-2 w-full border border-[#CBD5E1] bg-white px-4"
            >
              <option value="ALL">Tất cả</option>
              {lecturerCourses.map((course) => (
                <option key={course.className}>{course.className}</option>
              ))}
            </select>
          </label>
          <label className="text-body-sm font-semibold">
            Trạng thái
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="mt-2 w-full border border-[#CBD5E1] bg-white px-4"
            >
              <option value="ALL">Tất cả</option>
              {Object.entries(assessmentStatusMeta).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-body-sm font-semibold">
            Chương
            <select
              value={chapterFilter}
              onChange={(event) => setChapterFilter(event.target.value)}
              className="mt-2 w-full border border-[#CBD5E1] bg-white px-4"
            >
              <option value="ALL">Tất cả</option>
              {Object.entries(questionChapterLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>
      <Tabs key={tabsKey} items={statusTabs}>
        {(activeStatus) => {
          const visible = baseFiltered.filter((item) => activeStatus === 'ALL' || item.status === activeStatus);
          return visible.length ? (
            <PaginatedCollection items={visible} resetKeys={[activeStatus, query, classFilter, statusFilter, chapterFilter]} pageSize={8}>
              {(pageItems) => <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 pt-5">
              {pageItems.map((item) => {
                const meta = assessmentStatusMeta[item.status];
                return (
                  <Card key={item.id} variant="accent" className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-label-md font-bold text-primary">
                          {item.id} · {assessmentTypeLabels[item.type]}
                        </p>
                        <h2 className="mt-1 text-headline-sm font-bold">{item.title}</h2>
                        <p className="mt-1 text-body-sm text-[#64748B]">{item.classIds.join(', ')}</p>
                      </div>
                      <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                    </div>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-body-sm">
                      <Card as="div" className="bg-[#F8FAFC] p-3">
                        <span className="text-[#64748B]">Câu hỏi</span>
                        <strong className="mt-1 block">{item.questionIds.length} câu</strong>
                      </Card>
                      <Card as="div" className="bg-[#F8FAFC] p-3">
                        <span className="text-[#64748B]">Thời gian</span>
                        <strong className="mt-1 block">{item.duration} phút</strong>
                      </Card>
                      <Card as="div" className="bg-[#F8FAFC] p-3 col-span-2">
                        <span className="text-[#64748B]">Lịch</span>
                        <strong className="mt-1 block">
                          {formatDateTime(item.startAt)} → {formatDateTime(item.endAt)}
                        </strong>
                      </Card>
                    </div>
                    <ProgressBar
                      value={item.totalStudents ? (item.completedCount / item.totalStudents) * 100 : 0}
                      label={`Đã hoàn thành: ${item.completedCount} / ${item.totalStudents}`}
                      className="mt-4 text-[#64748B]"
                    />
                    <div className="mt-5 flex items-center gap-2">
                      {['OPEN', 'CLOSED'].includes(item.status) ? (
                        <a href={`lecturer_assessment_results.html?assessment=${item.id}`} className="flex-1">
                          <Button variant="secondary" className="w-full">
                            {item.status === 'CLOSED' ? 'Xem kết quả' : 'Theo dõi'}
                          </Button>
                        </a>
                      ) : (
                        <Button variant="secondary" onClick={() => setViewing(item)} className="flex-1">
                          Xem
                        </Button>
                      )}
                      <details className="relative">
                        <summary
                          className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border border-[#CBD5E1] text-[#64748B]"
                          aria-label={`Tùy chọn ${item.title}`}
                        >
                          <span className="material-symbols-outlined">more_vert</span>
                        </summary>
                        <div className="absolute bottom-11 right-0 z-30 w-48 rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-lg">
                          <button
                            type="button"
                            onClick={() => setViewing(item)}
                            className="w-full rounded-lg px-3 py-2 text-left text-body-sm hover:bg-[#F1F5F9]"
                          >
                            Xem chi tiết
                          </button>
                          {['DRAFT', 'SCHEDULED'].includes(item.status) && (
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              className="w-full rounded-lg px-3 py-2 text-left text-body-sm hover:bg-[#F1F5F9]"
                            >
                              Chỉnh sửa
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => copyAssessment(item)}
                            className="w-full rounded-lg px-3 py-2 text-left text-body-sm hover:bg-[#F1F5F9]"
                          >
                            Sao chép
                          </button>
                          {item.status === 'DRAFT' && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEdit(item)}
                                className="w-full rounded-lg px-3 py-2 text-left text-body-sm hover:bg-[#F1F5F9]"
                              >
                                Giao bài
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleting(item)}
                                className="w-full rounded-lg px-3 py-2 text-left text-body-sm text-primary hover:bg-[#FEF2F2]"
                              >
                                Xóa
                              </button>
                            </>
                          )}
                          {item.status === 'SCHEDULED' && (
                            <button
                              type="button"
                              onClick={() => changeStatus(item.id, 'DRAFT')}
                              className="w-full rounded-lg px-3 py-2 text-left text-body-sm hover:bg-[#F1F5F9]"
                            >
                              Hủy lịch
                            </button>
                          )}
                          {item.status === 'OPEN' && (
                            <button
                              type="button"
                              onClick={() => changeStatus(item.id, 'CLOSED')}
                              className="w-full rounded-lg px-3 py-2 text-left text-body-sm hover:bg-[#F1F5F9]"
                            >
                              Đóng bài
                            </button>
                          )}
                        </div>
                      </details>
                    </div>
                  </Card>
                );
              })}
            </div>}
            </PaginatedCollection>
          ) : (
            <Card className="mt-5 p-10 text-center">
              <span className="material-symbols-outlined text-4xl text-[#94A3B8]">search_off</span>
              <h2 className="mt-3 text-headline-sm font-bold">Không tìm thấy bài kiểm tra</h2>
              <p className="mt-1 text-body-md text-[#64748B]">Thử thay đổi từ khóa hoặc bộ lọc.</p>
              <Button variant="secondary" className="mt-5" onClick={resetFilters}>
                Xóa bộ lọc
              </Button>
            </Card>
          );
        }}
      </Tabs>
      {viewing && (
        <AssessmentDetail assessment={viewing} onClose={() => setViewing(null)} onViewQuestion={setViewingQuestion} />
      )}
      {viewingQuestion && <QuestionPreview question={viewingQuestion} onClose={() => setViewingQuestion(null)} />}
      {deleting && (
        <ConfirmDialog
          title="Xóa bài kiểm tra?"
          description={`Bài kiểm tra ${deleting.id} sẽ bị xóa khỏi danh sách.`}
          confirmLabel="Xóa bài kiểm tra"
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}
    </LecturerPageShell>
  );
}

function QuestionPreview({ question, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-[#0F172A]/45 p-4"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <Card className="max-h-[calc(100dvh-32px)] w-full max-w-2xl overflow-y-auto p-6" as="section">
        <div className="flex items-start justify-between gap-4">
          <div>
            <StatusBadge tone="neutral">{question.id}</StatusBadge>
            <h2 className="mt-3 text-headline-sm font-bold">{question.content}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng câu hỏi" className="text-[#64748B]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="mt-5 space-y-2">
          {question.answers.map((answer) => (
            <Card as="div"
              key={answer.id}
              className={`border p-3 ${answer.correct ? 'border-[#86EFAC] bg-[#F0FDF4]' : 'border-[#E2E8F0]'}`}
            >
              <strong>{answer.id}.</strong> {answer.content}
              {answer.correct && <span className="ml-2 font-semibold text-[#15803D]">— Đáp án đúng</span>}
            </Card>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </Card>
    </div>
  );
}
