import { SelectField as SharedSelectField } from '../../components/SelectField.jsx';
import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { ActionMenu } from '../../components/ActionMenu.jsx';
import { FormDialog } from '../../components/FormDialog.jsx';
import { useApiData } from '../../hooks/useApiData.js';
import { navigate } from '../../lib/navigation.js';
import { PaginatedCollection } from '../../components/Pagination.jsx';
import { api, apiRequest } from '../../lib/apiClient.js';

import { loadAllPages, safeUrl } from '../../lib/lecturerUtils.js';

const rowsOf = (value) => (Array.isArray(value) ? value : value?.content || value?.data || []);
const typeMeta = {
  PDF: ['PDF', 'picture_as_pdf'],
  VIDEO: ['Video', 'play_circle'],
  SLIDE: ['Slide', 'slideshow'],
  MARKDOWN: ['Bài đọc', 'article'],
  TEXT: ['Bài đọc', 'notes'],
  OTHER: ['Tệp đính kèm', 'attach_file'],
};

export function LibraryPage() {
  const [resources, setResources] = useState([]);
  const [viewing, setViewing] = useState(null);
  const detail = useApiData(viewing ? '/api/v1/materials/' + encodeURIComponent(viewing.materialId) : null);
  const [subjects, setSubjects] = useState([]);
  const [classId, setClassId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const initial = params.get('classId') || params.get('class');
    return initial && initial !== 'ALL' ? initial : '';
  });
  const [type, setType] = useState('');
  const [topicId, setTopicId] = useState('');
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [classData, materialData] = await Promise.all([
          loadAllPages(apiRequest, '/api/v1/students/me/classes'),
          api.students.myMaterials({
            classId: classId || undefined,
            topicId: topicId || undefined,
            type: type || undefined,
          }),
        ]);
        const classes = rowsOf(classData);
        const subjects = [
          ...new Map(classes.filter((row) => row.subjectId).map((row) => [row.subjectId, row])).values(),
        ];
        const topicGroups = await Promise.all(
          subjects.map(async (row) =>
            rowsOf(await api.subjects.topics(row.subjectId)).map((topic) => ({
              ...topic,
              subjectId: row.subjectId,
              subjectName: row.subjectName,
            }))
          )
        );
        const topicRows = topicGroups.flat();
        if (!alive) return;
        setSubjects(classes);
        setTopics(topicRows);
        setResources(
          rowsOf(materialData).map((material) => {
            const topic = topicRows.find((row) => row.topicId === material.topicId);
            const course =
              classes.find((row) => row.classId === classId) ||
              classes.find((row) => row.subjectId === topic?.subjectId);
            const [tag, icon] = typeMeta[material.type] || ['Tệp đính kèm', 'attach_file'];
            const params = new URLSearchParams(
              Object.entries({
                classId: course?.classId,
                subjectId: topic?.subjectId,
                topicId: material.topicId,
                materialId: material.materialId,
              }).filter(([, value]) => value)
            );
            const fileUrl = safeUrl(material.fileUrl);
            return {
              ...material,
              title: material.title || 'Học liệu',
              tag,
              icon,
              subjectName: course?.subjectName || '—',
              topicName: topic?.topicName || topic?.name || '—',
              author: [course?.subjectName, topic?.topicName || topic?.name].filter(Boolean).join(' · '),
              href: fileUrl || 'interactive_lesson.html?' + params,
              external: Boolean(fileUrl),
            };
          })
        );
      } catch (loadError) {
        if (alive) setError(loadError?.message || 'Không thể tải kho học liệu.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [reloadKey, classId, topicId, type]);

  const filtered = resources;
  const selectedClass = subjects.find((row) => row.classId === classId);
  const topicOptions = topics.filter((row) => !classId || row.subjectId === selectedClass?.subjectId);

  return (
    <AppShell
      currentPage="library.html"
      title="Kho học liệu · PTIT Physics 1"
      breadcrumbs={['Kho học liệu']}
      current="Thư viện điện tử"
    >
      <PageContainer>
        <PageTitle
          eyebrow="TÀI NGUYÊN HỌC TẬP"
          title="Kho học liệu"
          description="Học liệu thuộc các học phần bạn đang theo học."
        />
        <Tabs
          items={[{ id: 'materials', label: 'Học liệu' }]}
          filters={
            <>
              <SharedSelectField
                label="Lớp học"
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  setTopicId('');
                }}
              >
                <option value="">Tất cả lớp đã ghi danh</option>
                {subjects.map((row) => (
                  <option key={row.classId} value={row.classId}>
                    {row.classCode || row.className || row.subjectName}
                  </option>
                ))}
              </SharedSelectField>
              <SharedSelectField
                label="Chủ đề"
                value={topicId}
                disabled={!topicOptions.length}
                onChange={(e) => setTopicId(e.target.value)}
              >
                <option value="">Tất cả chủ đề</option>
                {topicOptions.map((row) => (
                  <option key={row.topicId} value={row.topicId}>
                    {row.topicName || row.name}
                    {!classId && row.subjectName ? ' · ' + row.subjectName : ''}
                  </option>
                ))}
              </SharedSelectField>
              <SharedSelectField label="Loại học liệu" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">Tất cả loại</option>
                {Object.entries(typeMeta).map(([key, [label]]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </SharedSelectField>
            </>
          }
          actions={
            <>
              <Button
                variant="ghost"
                disabled={!classId && !topicId && !type}
                onClick={() => {
                  setClassId('');
                  setTopicId('');
                  setType('');
                }}
              >
                Xóa bộ lọc
              </Button>
              <Button
                variant="secondary"
                icon="refresh"
                disabled={loading}
                onClick={() => setReloadKey((value) => value + 1)}
              >
                Tải lại
              </Button>
            </>
          }
        >
          {() => (
            <div className="mt-5 space-y-4">
              {loading ? (
                <Card className="p-10 text-center text-[#64748B]">Đang tải học liệu…</Card>
              ) : error ? (
                <Card className="p-10 text-center">
                  <p role="alert" className="text-primary">
                    {error}
                  </p>
                  <Button className="mt-4" onClick={() => setReloadKey((value) => value + 1)}>
                    Thử lại
                  </Button>
                </Card>
              ) : (
                <>
                  <p className="text-body-sm text-[#64748B]">Hiển thị {filtered.length} học liệu</p>
                  {filtered.length > 0 && (
                    <PaginatedCollection items={filtered} resetKeys={[classId, topicId, type]} pageSize={8}>
                      {(pageItems) => (
                        <DataTable
                          asCards
                          paginate={false}
                          rows={pageItems}
                          columns={['Nội dung', 'Loại', 'Phiên bản', 'Chủ đề', 'Trạng thái', 'Thao tác']}
                          cells={(row) => [
                            row.title,
                            row.tag,
                            row.version ?? '—',
                            row.topicName,
                            'Đã duyệt',
                            <ActionMenu
                              label={'Thao tác với ' + row.title}
                              items={[
                                { label: 'Xem chi tiết', onSelect: () => setViewing(row) },
                                {
                                  label: 'Mở tài liệu',
                                  onSelect: () =>
                                    row.external
                                      ? window.open(row.href, '_blank', 'noopener,noreferrer')
                                      : navigate(row.href),
                                },
                              ]}
                            />,
                          ]}
                        />
                      )}
                    </PaginatedCollection>
                  )}
                  {!filtered.length && (
                    <Card className="p-10 text-center">
                      <span className="material-symbols-outlined text-4xl text-[#94A3B8]">search_off</span>
                      <p className="mt-2 text-body-md text-[#64748B]">Không tìm thấy tài liệu phù hợp.</p>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}
        </Tabs>
        {viewing && (
          <FormDialog title="Chi tiết học liệu" onClose={() => setViewing(null)}>
            {detail.loading ? (
              <p role="status">Đang tải chi tiết…</p>
            ) : detail.error ? (
              <div>
                <p role="alert" className="text-primary">
                  {detail.error}
                </p>
                <Button className="mt-3" onClick={detail.reload}>
                  Thử lại
                </Button>
              </div>
            ) : (
              detail.data && (
                <>
                  <h2 className="text-title-lg font-medium">{detail.data.title || viewing.title}</h2>
                  <dl className="mt-4 grid grid-cols-2 gap-4 text-body-sm">
                    <div>
                      <dt className="text-slate-500">Học phần</dt>
                      <dd className="mt-1">{viewing.subjectName}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Chủ đề</dt>
                      <dd className="mt-1">{viewing.topicName}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Loại</dt>
                      <dd className="mt-1">{typeMeta[detail.data.type]?.[0] || viewing.tag}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Phiên bản</dt>
                      <dd className="mt-1">{detail.data.version ?? viewing.version ?? '—'}</dd>
                    </div>
                  </dl>
                  {detail.data.contentText && (
                    <p className="mt-5 whitespace-pre-wrap break-words text-body-md leading-relaxed">
                      {detail.data.contentText}
                    </p>
                  )}
                  {detail.data.sourceCitation && (
                    <p className="mt-4 break-words text-body-sm text-slate-500">Nguồn: {detail.data.sourceCitation}</p>
                  )}
                  <div className="mt-5 flex justify-end gap-3">
                    <Button variant="secondary" onClick={() => setViewing(null)}>
                      Đóng
                    </Button>
                    <a
                      className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
                      href={viewing.href}
                      target={viewing.external ? '_blank' : undefined}
                      rel={viewing.external ? 'noreferrer' : undefined}
                    >
                      Mở tài liệu
                      <span className="material-symbols-outlined text-base" aria-hidden="true">
                        arrow_forward
                      </span>
                    </a>
                  </div>
                </>
              )
            )}
          </FormDialog>
        )}
      </PageContainer>
    </AppShell>
  );
}
