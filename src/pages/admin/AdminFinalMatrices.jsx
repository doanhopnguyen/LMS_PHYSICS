import React, { useState } from 'react';
import { api } from '../../lib/apiClient.js';
import { Form, SubmitButton } from '../../components/Form.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import {
  Button,
  Card,
  Field,
  Lookup,
  Modal,
  Resource,
  SelectField,
  Table,
  itemsOf,
  useMutation,
  useResource,
} from '../lecturers/LecturerShared.jsx';

export function AdminFinalMatrices() {
  const [subjectId, setSubjectId] = useState('');
  const [editor, setEditor] = useState(null);
  const [validation, setValidation] = useState(null);
  const [provision, setProvision] = useState(null);
  const [result, setResult] = useState(null);
  const [uncertain, setUncertain] = useState(false);
  const subjects = useResource('/api/v1/subjects', true);
  const matrices = useResource(
    subjectId ? `/api/v1/admin/exam-matrices?subjectId=${subjectId}` : '/api/v1/admin/exam-matrices'
  );
  const classes = useResource(subjectId ? `/api/v1/classes?subjectId=${subjectId}` : null, true);
  const topics = useResource(subjectId ? `/api/v1/subjects/${subjectId}/topics` : null);
  const clos = useResource(subjectId ? `/api/v1/subjects/${subjectId}/clos` : null);
  const action = useMutation();
  const lifecycle = (row, name) =>
    action.confirm(
      `${{ publish: 'Công bố', archive: 'Lưu trữ', clone: 'Tạo phiên bản mới' }[name]} ma trận?`,
      () => api.adminFinalMatrices[name](row.matrixId),
      matrices.reload
    );
  const edit = async (row) => {
    if (row.isLocked || row.matrixStatus !== 'DRAFT') return;
    setSubjectId(row.subjectId);
    const response = await action.run(() => api.examMatrices.get(row.matrixId), '');
    if (response.ok) setEditor(response.data);
  };
  return (
    <div>
      {action.feedback}
      <Card className="mt-5 flex flex-wrap items-end gap-4 p-5">
        <Lookup
          label="Môn học"
          resource={subjects}
          idKey="subjectId"
          value={subjectId}
          onChange={(id) => {
            setSubjectId(id);
            setEditor(null);
            setValidation(null);
          }}
        />
        <Button disabled={!subjectId || action.busy} onClick={() => setEditor({ examType: 'FINAL' })}>
          Tạo ma trận FINAL
        </Button>
      </Card>
      <Resource value={matrices}>
        {(data) => (
          <Table
            asCards
            rows={itemsOf(data)
              .filter((row) => row.examType === 'FINAL')
              .sort(
                (a, b) =>
                  String(a.matrixFamilyId).localeCompare(String(b.matrixFamilyId)) ||
                  b.revisionNumber - a.revisionNumber
              )}
            columns={['Ma trận', 'Môn', 'Phiên bản', 'Trạng thái', '']}
            cells={(row) => [
              row.matrixName,
              row.subjectName,
              `v${row.revisionNumber || 1}`,
              <StatusBadge status={row.matrixStatus} />,
              <div className="flex flex-wrap gap-2">
                {row.matrixStatus === 'DRAFT' && !row.isLocked && (
                  <Button variant="secondary" disabled={action.busy} onClick={() => edit(row)}>
                    Sửa
                  </Button>
                )}
                <Button
                  variant="secondary"
                  disabled={action.busy}
                  onClick={async () => {
                    const response = await action.run(() => api.adminFinalMatrices.validate(row.matrixId), '');
                    if (response.ok) setValidation(response.data);
                  }}
                >
                  Kiểm tra
                </Button>
                {row.matrixStatus === 'DRAFT' && !row.isLocked && (
                  <Button disabled={action.busy} onClick={() => lifecycle(row, 'publish')}>
                    Công bố
                  </Button>
                )}
                <Button variant="secondary" disabled={action.busy} onClick={() => lifecycle(row, 'clone')}>
                  Phiên bản mới
                </Button>
                {row.matrixStatus === 'PUBLISHED' && row.isLocked && (
                  <>
                    <Button
                      disabled={action.busy}
                      onClick={() => {
                        setSubjectId(row.subjectId);
                        setProvision(row);
                        setResult(null);
                        setUncertain(false);
                      }}
                    >
                      Cấp phát
                    </Button>
                    <Button variant="ghost" disabled={action.busy} onClick={() => lifecycle(row, 'archive')}>
                      Lưu trữ
                    </Button>
                  </>
                )}
              </div>,
            ]}
          />
        )}
      </Resource>
      {editor && (
        <Modal
          wide
          title={editor.matrixId ? 'Sửa ma trận FINAL' : 'Tạo ma trận FINAL'}
          busy={action.busy}
          onClose={() => !action.busy && setEditor(null)}
        >
          <Resource value={topics}>
            {() => (
              <Resource value={clos}>
                {() => (
                  <FinalMatrixForm
                    initial={editor}
                    topics={itemsOf(topics.data)}
                    clos={itemsOf(clos.data)}
                    busy={action.busy}
                    onError={action.setError}
                    onSave={async (body) => {
                      const response = await action.run(() =>
                        editor.matrixId
                          ? api.examMatrices.update(editor.matrixId, body)
                          : api.adminFinalMatrices.create({ ...body, subjectId })
                      );
                      if (response.ok) {
                        setEditor(null);
                        matrices.reload();
                      }
                    }}
                  />
                )}
              </Resource>
            )}
          </Resource>
        </Modal>
      )}
      {validation && (
        <Modal wide title="Kiểm tra ngân hàng" onClose={() => setValidation(null)}>
          <p className="font-semibold">{validation.valid ? 'Đủ câu hỏi' : 'Chưa đủ câu hỏi'}</p>
          <p className="mt-2">
            Cần {validation.totalRequired} · Có {validation.totalAvailable}
          </p>
          <Table
            rows={validation.items || []}
            columns={['Chủ đề', 'Độ khó', 'Cần', 'Có', 'Trạng thái']}
            cells={(row) => [
              row.topicName,
              row.difficultyLevel,
              row.requiredQuestions,
              row.availableQuestions,
              row.sufficient ? 'Đủ' : 'Thiếu',
            ]}
          />
          <ul className="mt-3">
            {(validation.warnings || []).map((text, i) => (
              <li key={i}>{text}</li>
            ))}
          </ul>
        </Modal>
      )}
      {provision && (
        <Modal
          wide
          title={`Cấp phát · ${provision.matrixName}`}
          busy={action.busy}
          onClose={() => !action.busy && setProvision(null)}
        >
          <Resource value={classes}>
            {(data) => (
              <ProvisionForm
                matrix={provision}
                classes={itemsOf(data)}
                busy={action.busy}
                uncertain={uncertain}
                onError={action.setError}
                onSave={async (body) => {
                  const response = await action.run(() => api.adminExams.provisionFinal(body), '');
                  if (response.ok) {
                    setResult(response.data);
                    setProvision(null);
                  } else setUncertain(true);
                }}
                onInspect={async () => {
                  const response = await action.run(async () => {
                    const all = await Promise.all(
                      itemsOf(classes.data).map((row) => api.exams.listForClass(row.classId))
                    );
                    return all.flatMap(itemsOf).filter((exam) => exam.matrixId === provision.matrixId);
                  }, '');
                  if (response.ok) setResult({ createdExams: response.data, inspected: true });
                }}
              />
            )}
          </Resource>
        </Modal>
      )}
      {result && (
        <Card className="mt-5 p-5">
          <h3 className="font-semibold">{result.inspected ? 'Đề đang có theo ma trận' : 'Đã cấp phát'}</h3>
          {!result.inspected && (
            <p>
              {result.totalClassesProvisioned}/{result.totalClassesRequested} lớp
            </p>
          )}
          <Table
            rows={result.createdExams || []}
            columns={['Đề', 'Lớp', 'Bắt đầu']}
            cells={(row) => [
              row.title,
              row.classCode || row.classId,
              row.startTime ? new Date(row.startTime).toLocaleString('vi-VN') : '—',
            ]}
          />
        </Card>
      )}
    </div>
  );
}
function FinalMatrixForm({ initial, topics, clos, busy, onSave, onError }) {
  const [details, setDetails] = useState(
    initial.details?.length
      ? initial.details
      : [{ topicId: '', cloId: '', difficultyLevel: 'MEDIUM', numQuestions: 1, weightPercent: 100 }]
  );
  const change = (i, key, value) =>
    setDetails((rows) => rows.map((row, n) => (n === i ? { ...row, [key]: value } : row)));
  return (
    <Form
      className="grid gap-4"
      busy={busy}
      onSubmit={(e) => {
        e.preventDefault();
        const values = Object.fromEntries(new FormData(e.currentTarget));
        const weight = details.reduce((sum, row) => sum + Number(row.weightPercent), 0);
        if (Math.abs(weight - 100) > 0.01) {
          onError('Tổng trọng số phải bằng 100%.');
          return;
        }
        if (
          details.some(
            (row) =>
              !topics.some((topic) => topic.topicId === row.topicId) ||
              (row.cloId && !clos.some((clo) => clo.cloId === row.cloId))
          )
        ) {
          onError('Chọn chủ đề và CLO cùng môn.');
          return;
        }
        onSave({
          matrixName: values.matrixName.trim(),
          examType: 'FINAL',
          description: values.description,
          totalPoints: Number(values.totalPoints),
          details: details.map((row) => ({
            topicId: row.topicId,
            cloId: row.cloId || null,
            difficultyLevel: row.difficultyLevel,
            numQuestions: Number(row.numQuestions),
            weightPercent: Number(row.weightPercent),
          })),
        });
      }}
    >
      <Field label="Tên ma trận" name="matrixName" required defaultValue={initial.matrixName || ''} />
      <Field
        label="Tổng điểm"
        name="totalPoints"
        type="number"
        min={0.1}
        step={0.1}
        required
        defaultValue={initial.totalPoints || 10}
      />
      <Field label="Mô tả" name="description" defaultValue={initial.description || ''} />
      {details.map((row, i) => (
        <Card className="grid gap-3 p-4 sm:grid-cols-2" key={i}>
          <SelectField
            label="Chủ đề"
            required
            value={row.topicId}
            onChange={(e) => change(i, 'topicId', e.target.value)}
          >
            <option value="">Chọn chủ đề</option>
            {topics.map((topic) => (
              <option key={topic.topicId} value={topic.topicId}>
                {topic.topicName}
              </option>
            ))}
          </SelectField>
          <SelectField label="CLO" value={row.cloId || ''} onChange={(e) => change(i, 'cloId', e.target.value)}>
            <option value="">Không yêu cầu CLO</option>
            {clos
              .filter((clo) => clo.isActive !== false || clo.cloId === row.cloId)
              .map((clo) => (
                <option key={clo.cloId} value={clo.cloId}>
                  {clo.cloCode}
                </option>
              ))}
          </SelectField>
          <SelectField
            label="Độ khó"
            value={row.difficultyLevel}
            onChange={(e) => change(i, 'difficultyLevel', e.target.value)}
          >
            {['EASY', 'MEDIUM', 'HARD'].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </SelectField>
          <Field
            label="Số câu"
            type="number"
            min={1}
            step={1}
            required
            value={row.numQuestions}
            onChange={(e) => change(i, 'numQuestions', e.target.value)}
          />
          <Field
            label="Trọng số (%)"
            type="number"
            min={0.01}
            max={100}
            step={0.01}
            required
            value={row.weightPercent}
            onChange={(e) => change(i, 'weightPercent', e.target.value)}
          />
          <Button
            variant="ghost"
            disabled={details.length <= 1 || busy}
            onClick={() => setDetails((rows) => rows.filter((_, n) => n !== i))}
          >
            Gỡ dòng
          </Button>
        </Card>
      ))}
      <Button
        variant="secondary"
        disabled={busy}
        onClick={() =>
          setDetails((rows) => [
            ...rows,
            { topicId: '', cloId: '', difficultyLevel: 'MEDIUM', numQuestions: 1, weightPercent: 0 },
          ])
        }
      >
        Thêm dòng
      </Button>
      <SubmitButton disabled={busy}>Lưu ma trận</SubmitButton>
    </Form>
  );
}
function ProvisionForm({ matrix, classes, busy, uncertain, onSave, onError, onInspect }) {
  const [semesterId, setSemesterId] = useState('');
  const [selected, setSelected] = useState([]);
  const [review, setReview] = useState(null);
  const available = classes.filter(
    (row) => row.subjectId === matrix.subjectId && (!semesterId || row.semesterId === semesterId)
  );
  return (
    <Form
      className="grid gap-4"
      busy={busy}
      onSubmit={(e) => {
        e.preventDefault();
        if (uncertain) return;
        const raw = Object.fromEntries(new FormData(e.currentTarget));
        if (!selected.length) {
          onError('Chọn lớp cần cấp phát.');
          return;
        }
        if (new Date(raw.startTime) >= new Date(raw.endTime)) {
          onError('Kết thúc phải sau bắt đầu.');
          return;
        }
        setReview({
          matrixId: matrix.matrixId,
          classIds: selected,
          durationMinutes: Number(raw.durationMinutes),
          startTime: new Date(raw.startTime).toISOString(),
          endTime: new Date(raw.endTime).toISOString(),
          autoGenerateQuestions: true,
          ...(semesterId ? { semesterId } : {}),
          ...(raw.title.trim() ? { title: raw.title.trim() } : {}),
        });
      }}
    >
      <SelectField
        label="Học kỳ"
        value={semesterId}
        onChange={(e) => {
          setSemesterId(e.target.value);
          setSelected([]);
          setReview(null);
        }}
        disabled={busy || uncertain}
      >
        <option value="">Tất cả học kỳ</option>
        {[...new Map(classes.map((row) => [row.semesterId, row])).values()].map((row) => (
          <option key={row.semesterId} value={row.semesterId}>
            {row.semesterName || row.semesterId}
          </option>
        ))}
      </SelectField>
      <fieldset className="grid gap-2">
        <legend className="font-semibold">Lớp học</legend>
        {available.map((row) => (
          <label key={row.classId} className="flex gap-2">
            <input
              type="checkbox"
              disabled={busy || uncertain}
              checked={selected.includes(row.classId)}
              onChange={(e) => {
                setSelected((ids) =>
                  e.target.checked ? [...ids, row.classId] : ids.filter((id) => id !== row.classId)
                );
                setReview(null);
              }}
            />
            {row.classCode}
          </label>
        ))}
      </fieldset>
      <Field label="Tên đề" name="title" disabled={busy || uncertain} onChange={() => setReview(null)} />
      <Field
        label="Thời lượng (phút)"
        name="durationMinutes"
        type="number"
        min={1}
        step={1}
        required
        disabled={busy || uncertain}
        onChange={() => setReview(null)}
      />
      <Field
        label="Bắt đầu"
        name="startTime"
        type="datetime-local"
        required
        disabled={busy || uncertain}
        onChange={() => setReview(null)}
      />
      <Field
        label="Kết thúc"
        name="endTime"
        type="datetime-local"
        required
        disabled={busy || uncertain}
        onChange={() => setReview(null)}
      />
      {uncertain ? (
        <>
          <p>Kiểm tra đề đã tạo trước khi cấp phát lại.</p>
          <Button disabled={busy} onClick={onInspect}>
            Kiểm tra đề theo lớp
          </Button>
        </>
      ) : review ? (
        <Card className="p-4">
          <p>
            {review.classIds.length} lớp · {review.durationMinutes} phút
          </p>
          <p>
            {new Date(review.startTime).toLocaleString('vi-VN')} → {new Date(review.endTime).toLocaleString('vi-VN')}
          </p>
          <Button className="mt-3" disabled={busy} onClick={() => onSave(review)}>
            Xác nhận cấp phát
          </Button>
        </Card>
      ) : (
        <SubmitButton disabled={busy}>Xem lại</SubmitButton>
      )}
    </Form>
  );
}
