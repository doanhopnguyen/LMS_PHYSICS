import { Form, SubmitButton } from '../../components/Form.jsx';
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient.js';
import { ActionMenu } from '../../components/ActionMenu.jsx';
import { queryPath, validateOptions } from '../../lib/lecturerUtils.js';
import {
  Button,
  Card,
  Field,
  FileLink,
  Lookup,
  Modal,
  Pager,
  Resource,
  SelectField,
  Table,
  Tabs,
  LecturerPageShell,
  displayName,
  idPath,
  itemsOf,
  labelOf,
  useMutation,
  useResource,
  useQueryState,
} from './LecturerShared.jsx';

function useAllMaterials(enabled, subjectsData, subjectFilter) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ loading: false, error: '', data: null });
  const subjectIds = itemsOf(subjectsData)
    .filter((subject) => !subjectFilter || subject.subjectId === subjectFilter)
    .map((subject) => subject.subjectId)
    .filter(Boolean)
    .join('|');
  useEffect(() => {
    let active = true;
    if (!enabled) {
      setState({ loading: false, error: '', data: null });
      return () => {
        active = false;
      };
    }
    setState({ loading: true, error: '', data: null });
    (async () => {
      const topicsBySubject = await Promise.all(
        subjectIds
          .split('|')
          .filter(Boolean)
          .map((id) => api.subjects.topics(id))
      );
      const topicRows = topicsBySubject.flatMap((data) => itemsOf(data));
      const materialGroups = await Promise.all(
        topicRows.map(async (topic) => ({
          topicId: topic.topicId,
          rows: itemsOf(await api.materials.list(topic.topicId)),
        }))
      );
      return materialGroups.flatMap(({ topicId, rows }) => rows.map((row) => ({ ...row, _topicId: topicId })));
    })().then(
      (data) => active && setState({ loading: false, error: '', data }),
      (requestError) => active && setState({ loading: false, error: requestError.message, data: null })
    );
    return () => {
      active = false;
    };
  }, [enabled, subjectIds, version]);
  return { ...state, enabled, reload: () => setVersion((value) => value + 1) };
}

function QuestionForm({ initial = {}, subjectId, topicId, onSave, busy }) {
  const [type, setType] = useState(initial.questionType || 'MCQ_SINGLE');
  const [options, setOptions] = useState(() =>
    Array.isArray(initial.options) && initial.options.length
      ? initial.options.map((o) => ({
          content: o.content || '',
          isCorrect: Boolean(o.isCorrect),
          explanation: o.explanation || '',
        }))
      : Array.from({ length: 4 }, () => ({ content: '', isCorrect: false, explanation: '' }))
  );
  const [error, setError] = useState('');
  const update = (index, patch) =>
    setOptions((rows) =>
      rows.map((row, i) =>
        i === index
          ? { ...row, ...patch }
          : type === 'MCQ_SINGLE' && patch.isCorrect
            ? { ...row, isCorrect: false }
            : row
      )
    );
  return (
    <Form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const message = validateOptions(type, options);
        setError(message);
        if (message) return;
        const values = Object.fromEntries(new FormData(e.currentTarget));
        onSave({
          subjectId,
          topicId,
          questionType: type,
          content: values.content.trim(),
          mediaUrl: values.mediaUrl.trim(),
          difficultyLevel: values.difficultyLevel,
          cognitiveLevel: values.cognitiveLevel,
          options: options.map((o, i) => ({ ...o, content: o.content.trim(), orderIndex: i })),
        });
      }}
    >
      <Field
        label="Nội dung câu hỏi *"
        name="content"
        multiline
        rows={4}
        required
        defaultValue={initial.content || ''}
      />
      <SelectField
        label="Loại câu hỏi"
        value={type}
        onChange={(e) => {
          setType(e.target.value);
          setOptions((rows) => rows.map((o) => ({ ...o, isCorrect: false })));
        }}
      >
        <option value="MCQ_SINGLE">Một đáp án</option>
        <option value="MCQ_MULTI">Nhiều đáp án</option>
        <option value="TRUE_FALSE">Đúng / Sai</option>
        <option value="SHORT_ANSWER">Trả lời ngắn</option>
      </SelectField>
      <SelectField label="Độ khó" name="difficultyLevel" defaultValue={initial.difficultyLevel || 'EASY'}>
        {['EASY', 'MEDIUM', 'HARD'].map((v) => (
          <option key={v} value={v}>
            {labelOf(v)}
          </option>
        ))}
      </SelectField>
      <Field
        label="Mức nhận thức (theo quy ước môn học)"
        name="cognitiveLevel"
        defaultValue={initial.cognitiveLevel || ''}
      />
      <fieldset className="grid gap-3">
        <legend className="mb-2 font-semibold">Đáp án — đánh dấu đáp án đúng</legend>
        {options.map((o, i) => (
          <div className="rounded-xl border p-3" key={i}>
            <label className="flex items-center gap-2">
              <input
                type={type === 'MCQ_SINGLE' ? 'radio' : 'checkbox'}
                name={`correct${type === 'MCQ_SINGLE' ? '' : i}`}
                checked={o.isCorrect}
                onChange={(e) => update(i, { isCorrect: e.target.checked })}
              />
              Đáp án {i + 1} đúng
            </label>
            <Field
              label={`Nội dung đáp án ${i + 1} *`}
              required
              value={o.content}
              onChange={(e) => update(i, { content: e.target.value })}
            />
            <Field
              label="Giải thích"
              value={o.explanation}
              onChange={(e) => update(i, { explanation: e.target.value })}
            />
            <Button
              variant="secondary"
              disabled={options.length <= 2}
              onClick={() => setOptions((rows) => rows.filter((_, index) => index !== i))}
            >
              Xóa đáp án
            </Button>
          </div>
        ))}
      </fieldset>
      <Button
        variant="secondary"
        onClick={() => setOptions((rows) => [...rows, { content: '', isCorrect: false, explanation: '' }])}
      >
        Thêm đáp án
      </Button>
      <Field label="URL hình ảnh (không bắt buộc)" name="mediaUrl" type="url" defaultValue={initial.mediaUrl || ''} />
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <SubmitButton type="submit" disabled={busy}>
        {busy ? 'Đang lưu…' : 'Lưu câu hỏi'}
      </SubmitButton>
    </Form>
  );
}

export function LecturerAuthoringApiPage({ kind }) {
  const materialMode = kind === 'materials';
  const subjects = useResource('/api/v1/subjects', true);
  const [subjectId, setSubject] = useQueryState('subjectId');
  const [topicId, setTopic] = useQueryState('topicId');
  const [difficulty, setDifficulty] = useState('');
  const [page, setPage] = useState(0);
  const [tab, setTab] = useState(materialMode ? 'materials' : 'questions');
  const topics = useResource(subjectId ? `/api/v1/subjects/${idPath(subjectId)}/topics` : null);
  const validTopic = itemsOf(topics.data).some((t) => t.topicId === topicId) ? topicId : '';
  const allMaterials = useAllMaterials(materialMode && tab === 'materials' && !validTopic, subjects.data, subjectId);
  const resource = useResource(
    materialMode
      ? validTopic
        ? `/api/v1/topics/${idPath(validTopic)}/materials`
        : null
      : queryPath('/api/v1/questions', {
          subjectId,
          topicId: validTopic,
          difficultyLevel: difficulty,
          page,
          size: 20,
        })
  );
  const displayedResource = materialMode && !validTopic ? allMaterials : resource;
  const [modal, setModal] = useState(null);
  const [newTopicName, setNewTopicName] = useState('');
  const action = useMutation();
  const formTopicId = modal?.row.topicId || modal?.row._topicId || validTopic;
  const validSubject = itemsOf(subjects.data).some((s) => s.subjectId === subjectId);
  const changeSubject = (value) => {
    setSubject(value);
    setTopic('');
    setPage(0);
    setNewTopicName('');
    action.clear();
  };
  const checkScope = (needsTopic = true) => {
    if (!validSubject || (needsTopic && !itemsOf(topics.data).some((t) => t.topicId === formTopicId))) {
      action.setError(needsTopic ? 'Vui lòng chọn học phần và chủ đề trước khi gửi.' : 'Vui lòng chọn học phần.');
      return false;
    }
    return true;
  };
  const createInlineTopic = async () => {
    if (!checkScope(false)) return;
    const topicName = newTopicName.trim();
    if (!topicName) {
      action.setError('Nhập tên chủ đề mới.');
      return;
    }
    const result = await action.run(
      () =>
        api.subjects.createTopic(subjectId, {
          subjectId,
          topicName,
          description: '',
          orderIndex: Math.max(0, ...itemsOf(topics.data).map((t) => Number(t.orderIndex) || 0)) + 1,
        }),
      'Đã tạo chủ đề. Tiếp tục hoàn thiện form bên dưới.'
    );
    if (result.ok) {
      topics.reload();
      if (result.data?.topicId) setTopic(result.data.topicId);
      setNewTopicName('');
    }
  };
  const close = () => {
    if (!action.busy) {
      setModal(null);
      action.clear();
    }
  };
  const open = async (type, row) => {
    action.clear();
    if (!row) {
      setNewTopicName('');
      setModal({ type, row: {} });
      return;
    }
    const result = await action.run(
      () =>
        type.startsWith('topic')
          ? api.subjects.getTopic(subjectId, row.topicId)
          : materialMode
            ? api.materials.get(row.topicId || row._topicId || validTopic, row.materialId)
            : api.questions.get(row.questionId),
      ''
    );
    if (result.ok) setModal({ type, row: result.data });
  };
  const saved = (result) => {
    if (result.ok) {
      setModal(null);
      resource.reload();
      topics.reload();
    }
  };
  const remove = (row) =>
    action.confirm(
      `Xóa ${materialMode ? 'học liệu' : 'câu hỏi'} “${(row.title || row.content || '').slice(0, 90)}”?`,
      () =>
        materialMode
          ? api.materials.remove(row.topicId || row._topicId || validTopic, row.materialId)
          : api.questions.remove(row.questionId),
      () => {
        setPage(0);
        resource.reload();
      }
    );
  const saveTopic = async (e) => {
    e.preventDefault();
    if (!checkScope(false)) return;
    const values = Object.fromEntries(new FormData(e.currentTarget));
    const body = { ...values, subjectId, topicName: values.topicName.trim(), orderIndex: Number(values.orderIndex) };
    saved(
      await action.run(() =>
        modal.row.topicId
          ? api.subjects.updateTopic(subjectId, modal.row.topicId, body)
          : api.subjects.createTopic(subjectId, body)
      )
    );
  };
  const saveMaterial = async (e) => {
    e.preventDefault();
    const materialTopicId = modal.row.topicId || modal.row._topicId || validTopic;
    if (!materialTopicId || (!modal.row.materialId && !checkScope())) return;
    const data = new FormData(e.currentTarget);
    data.set('topicId', materialTopicId);
    const title = String(data.get('title') || '').trim();
    if (!title) {
      action.setError('Vui lòng nhập tiêu đề học liệu.');
      return;
    }
    data.set('title', title);
    const file = data.get('file');
    if (!file?.size) data.delete('file');
    if (!data.get('contentText')?.trim() && !file?.size && !modal.row.fileUrl) {
      action.setError('Nhập nội dung hoặc chọn tệp học liệu.');
      return;
    }
    saved(
      await action.run(() =>
        modal.row.materialId
          ? api.materials.update(materialTopicId, modal.row.materialId, data)
          : api.materials.create(materialTopicId, data)
      )
    );
  };
  return (
    <LecturerPageShell
      currentPage={materialMode ? 'lecturer_materials.html' : 'lecturer_question_bank.html'}
      title={materialMode ? 'Kho học liệu' : 'Ngân hàng câu hỏi'}
      eyebrow="NỘI DUNG GIẢNG DẠY"
      description="Quản lý nội dung theo học phần và chủ đề."
    >
      {action.feedback}
      <Tabs
        activeId={tab}
        onChange={setTab}
        items={
          materialMode
            ? [
                { id: 'materials', label: 'Học liệu' },
                { id: 'topics', label: 'Chủ đề' },
              ]
            : [{ id: 'questions', label: 'Câu hỏi' }]
        }
        actions={
          <>
            <Lookup
              label="Học phần"
              idKey="subjectId"
              resource={subjects}
              value={subjectId}
              onChange={changeSubject}
              placeholder={materialMode ? 'Tất cả học phần' : 'Chọn học phần'}
            />
            {tab !== 'topics' && (
              <Lookup
                label="Chủ đề"
                idKey="topicId"
                resource={topics}
                value={validTopic}
                onChange={(v) => {
                  setTopic(v);
                  setPage(0);
                }}
                placeholder={materialMode ? 'Chọn chủ đề' : 'Tất cả chủ đề'}
              />
            )}
            {!materialMode && (
              <SelectField
                label="Độ khó"
                name="difficultyLevel"
                value={difficulty}
                onChange={(e) => {
                  setDifficulty(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">Tất cả</option>
                {['EASY', 'MEDIUM', 'HARD'].map((v) => (
                  <option key={v} value={v}>
                    {labelOf(v)}
                  </option>
                ))}
              </SelectField>
            )}
            <Button
              disabled={action.busy}
              onClick={() => open(tab === 'topics' ? 'topic' : materialMode ? 'material' : 'question')}
            >
              Tạo {tab === 'topics' ? 'chủ đề' : materialMode ? 'học liệu' : 'câu hỏi'}
            </Button>
            {!materialMode && (
              <>
                <Button
                  variant="secondary"
                  disabled={action.busy}
                  onClick={async () => {
                    const result = await action.run(() => api.questions.downloadTemplate(), 'Đã tải mẫu Excel.');
                    if (result.ok) {
                      const url = URL.createObjectURL(result.data);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = 'mau-nhap-cau-hoi.xlsx';
                      link.click();
                      URL.revokeObjectURL(url);
                    }
                  }}
                >
                  Tải mẫu Excel
                </Button>
                <Button variant="secondary" disabled={action.busy} onClick={() => open('import')}>
                  Nhập Excel
                </Button>
              </>
            )}
          </>
        }
      >
        {() =>
          tab === 'topics' ? (
            <Resource value={topics}>
              {(data) => (
                <Table
                  rows={itemsOf(data)}
                  asCards
                  columns={['Chủ đề', 'Mô tả', 'Thứ tự', 'Thao tác']}
                  cells={(row) => [
                    displayName(row),
                    row.description,
                    row.orderIndex,
                    <ActionMenu
                      disabled={action.busy}
                      label={`Thao tác với ${displayName(row)}`}
                      items={[{ label: 'Chỉnh sửa', onSelect: () => open('topic', row) }]}
                    />,
                  ]}
                />
              )}
            </Resource>
          ) : (
            <Resource value={displayedResource} empty="Đang tải tất cả học liệu…">
              {(data) => (
                <>
                  <Table
                    rows={itemsOf(data)}
                    server={!materialMode}
                    asCards
                    columns={['Nội dung', 'Loại', materialMode ? 'Phiên bản' : 'Độ khó', 'Trạng thái', 'Thao tác']}
                    cells={(row) => [
                      materialMode ? row.title : row.content,
                      labelOf(row.type || row.questionType),
                      materialMode ? row.version : labelOf(row.difficultyLevel),
                      labelOf(row.approvalStatus),
                      <ActionMenu
                        label={`Thao tác với ${materialMode ? row.title : row.content || 'câu hỏi'}`}
                        disabled={action.busy}
                        items={[
                          { label: 'Xem chi tiết', onSelect: () => open('view', row) },
                          { label: 'Chỉnh sửa', onSelect: () => open(materialMode ? 'material' : 'question', row) },
                          materialMode &&
                            row.approvalStatus !== 'APPROVED' && {
                              label: 'Duyệt học liệu',
                              onSelect: () =>
                                action.confirm(
                                  `Duyệt học liệu “${row.title || 'này'}”?`,
                                  () =>
                                    api.materials.approve(row.topicId || row._topicId || validTopic, row.materialId),
                                  displayedResource.reload
                                ),
                            },
                          { label: 'Xóa', danger: true, onSelect: () => remove(row) },
                        ]}
                      />,
                    ]}
                  />
                  {!materialMode && <Pager data={data} page={page} onChange={setPage} />}
                </>
              )}
            </Resource>
          )
        }
      </Tabs>
      {modal && (
        <Modal
          title={
            modal.type === 'view'
              ? 'Chi tiết nội dung'
              : modal.type === 'import'
                ? 'Nhập câu hỏi từ Excel'
                : `${modal.row.topicId || modal.row.materialId || modal.row.questionId ? 'Chỉnh sửa' : 'Tạo'} ${modal.type === 'topic' ? 'chủ đề' : modal.type === 'material' ? 'học liệu' : 'câu hỏi'}`
          }
          busy={action.busy}
          onClose={close}
        >
          {action.error && (
            <p role="alert" className="mb-3 text-red-700">
              {action.error}
            </p>
          )}
          {modal.type !== 'view' && !modal.row.materialId && !modal.row.questionId && !modal.row.topicId && (
            <section
              className="mb-5 grid gap-3 rounded-xl border border-[#E2E8F0] p-4"
              aria-label="Học phần và chủ đề của nội dung"
            >
              <p className="text-body-sm text-[#64748B]">
                Chọn nơi lưu nội dung. Nếu chưa có chủ đề, tạo chủ đề ngay bên dưới.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Lookup
                  label="Học phần *"
                  resource={subjects}
                  idKey="subjectId"
                  value={subjectId}
                  disabled={action.busy || subjects.loading || Boolean(subjects.error)}
                  onChange={changeSubject}
                />
                {modal.type !== 'topic' && (
                  <Lookup
                    label="Chủ đề *"
                    resource={topics}
                    idKey="topicId"
                    value={validTopic}
                    disabled={action.busy || topics.loading || Boolean(topics.error) || !itemsOf(topics.data).length}
                    onChange={(v) => {
                      setTopic(v);
                      setPage(0);
                      action.clear();
                    }}
                  />
                )}
              </div>
              {modal.type !== 'topic' && validSubject && !topics.loading && !topics.error && (
                <details key={subjectId} open={itemsOf(topics.data).length === 0 ? true : undefined}>
                  <summary className="cursor-pointer text-body-sm font-semibold text-primary">Tạo chủ đề mới</summary>
                  <div className="mt-3 grid gap-2">
                    <Field
                      label="Tên chủ đề mới"
                      value={newTopicName}
                      disabled={action.busy}
                      onChange={(e) => setNewTopicName(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={action.busy || !newTopicName.trim()}
                      onClick={createInlineTopic}
                    >
                      Tạo và chọn chủ đề
                    </Button>
                  </div>
                </details>
              )}
              {!validSubject ? (
                <p role="status" className="text-body-sm">
                  Chọn học phần để tải danh sách chủ đề.
                </p>
              ) : (
                modal.type !== 'topic' &&
                !validTopic && (
                  <p role="status" className="text-body-sm">
                    Chọn hoặc tạo chủ đề để có thể gửi form.
                  </p>
                )
              )}
            </section>
          )}
          {modal.type === 'question' ? (
            <QuestionForm
              initial={modal.row}
              subjectId={subjectId}
              topicId={modal.row.topicId || validTopic}
              busy={action.busy || !validSubject || !formTopicId}
              onSave={async (body) => {
                if (!checkScope()) return;
                saved(
                  await action.run(() =>
                    modal.row.questionId ? api.questions.update(modal.row.questionId, body) : api.questions.create(body)
                  )
                );
              }}
            />
          ) : modal.type === 'topic' ? (
            <Form className="grid gap-4" onSubmit={saveTopic}>
              <Field label="Tên chủ đề *" name="topicName" required defaultValue={modal.row.topicName || ''} />
              <Field
                label="Thứ tự *"
                name="orderIndex"
                type="number"
                min="0"
                step="1"
                required
                defaultValue={modal.row.orderIndex ?? 0}
              />
              <Field label="Mô tả" name="description" multiline defaultValue={modal.row.description || ''} />
              <SubmitButton type="submit" disabled={action.busy || !validSubject}>
                Lưu chủ đề
              </SubmitButton>
            </Form>
          ) : modal.type === 'material' ? (
            <Form className="grid gap-4" onSubmit={saveMaterial}>
              <Field label="Tiêu đề *" name="title" required defaultValue={modal.row.title || ''} />
              <SelectField label="Định dạng" name="type" defaultValue={modal.row.type || 'PDF'}>
                {['PDF', 'VIDEO', 'MARKDOWN', 'TEXT'].map((v) => (
                  <option key={v} value={v}>
                    {labelOf(v)}
                  </option>
                ))}
              </SelectField>
              <Field
                label="Nội dung / mô tả"
                name="contentText"
                multiline
                rows={6}
                defaultValue={modal.row.contentText || ''}
              />
              <Field label="Nguồn trích dẫn" name="sourceCitation" defaultValue={modal.row.sourceCitation || ''} />
              {modal.row.fileUrl && (
                <FileLink url={modal.row.fileUrl}>Tệp hiện tại (giữ nguyên nếu không chọn tệp mới)</FileLink>
              )}
              <Field label="Tệp học liệu" name="file" type="file" />
              <SubmitButton type="submit" disabled={action.busy || !validSubject || !validTopic}>
                {action.busy ? 'Đang tải lên…' : 'Lưu học liệu'}
              </SubmitButton>
            </Form>
          ) : modal.type === 'import' ? (
            <Form
              className="grid gap-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!checkScope()) return;
                const form = new FormData(e.currentTarget);
                const file = form.get('file');
                if (!file?.size || !/\.(xlsx|xls)$/i.test(file.name)) {
                  action.setError('Chọn tệp Excel .xlsx hoặc .xls không rỗng.');
                  return;
                }
                const result = await action.run(
                  () => api.questions.importExcel(form, { subjectId, topicId: validTopic }),
                  'Đã xử lý tệp Excel.'
                );
                if (result.ok) {
                  const imported = result.data || {};
                  action.setNotice(
                    `Đã đọc ${imported.totalParsed ?? 0} câu, nhập thành công ${imported.totalImported ?? 0} câu.`
                  );
                  setModal(null);
                  setPage(0);
                  resource.reload();
                }
              }}
            >
              <p className="text-body-sm text-[#64748B]">
                Chọn tệp Excel theo mẫu để nhập hàng loạt câu hỏi vào chủ đề đã chọn.
              </p>
              <p className="rounded-xl bg-[#F8FAFC] p-3 text-body-sm text-[#475569]">
                Cột theo thứ tự: STT · Nội dung câu hỏi (*) · Loại câu hỏi · Mức độ nhận thức (Bloom) · Mức độ khó · Đáp
                án A (*) · Đáp án B (*) · Đáp án C · Đáp án D · Đáp án đúng (*) · Giải thích chi tiết.
              </p>
              <Field
                label="Tệp Excel *"
                name="file"
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                required
              />
              <SubmitButton type="submit" disabled={action.busy || !validSubject || !validTopic}>
                {action.busy ? 'Đang nhập câu hỏi…' : 'Nhập câu hỏi'}
              </SubmitButton>
            </Form>
          ) : (
            <div className="grid gap-3">
              <h3 className="font-bold">{materialMode ? modal.row.title : modal.row.content}</h3>
              <p>
                {labelOf(modal.row.type || modal.row.questionType)} · {labelOf(modal.row.approvalStatus)}
              </p>
              <p className="whitespace-pre-wrap">
                {materialMode ? modal.row.contentText || modal.row.sourceCitation : modal.row.content}
              </p>
              {modal.row.fileUrl && <FileLink url={modal.row.fileUrl} />}
              {modal.row.mediaUrl && <FileLink url={modal.row.mediaUrl}>Xem hình ảnh</FileLink>}
              {itemsOf(modal.row.options).map((o, i) => (
                <div key={i} className="rounded-xl border p-3">
                  <p>
                    {i + 1}. {o.content}
                    {o.isCorrect ? ' — Đáp án đúng' : ''}
                  </p>
                  <p className="text-body-sm">{o.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </LecturerPageShell>
  );
}
