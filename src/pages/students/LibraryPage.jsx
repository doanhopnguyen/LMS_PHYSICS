import React, { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { ResourceCard } from '../../components/ResourceCard.jsx';
import { PaginatedCollection } from '../../components/Pagination.jsx';
import { api } from '../../lib/apiClient.js';

const rowsOf = (value) => (Array.isArray(value) ? value : value?.content || value?.data || []);
const typeMeta = {
  PDF: ['Giáo trình', 'picture_as_pdf'],
  VIDEO: ['Bài giảng', 'play_circle'],
  SLIDE: ['Bài giảng', 'slideshow'],
  MARKDOWN: ['Bài đọc', 'article'],
  TEXT: ['Bài đọc', 'notes'],
  OTHER: ['Tệp đính kèm', 'attach_file'],
};

export function LibraryPage() {
  const [resources, setResources] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [type, setType] = useState('Tất cả');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [classData, materialData] = await Promise.all([api.students.myClasses(), api.students.myMaterials()]);
        const classes = rowsOf(classData);
        const studentMaterials = rowsOf(materialData);
        const enrolled = [
          ...new Map(classes.filter((item) => item.subjectId).map((item) => [String(item.subjectId), item])).values(),
        ];
        const subjectRows = enrolled.map((item) => ({
          subjectId: item.subjectId,
          subjectName: item.subjectName || item.subjectCode || item.classCode || 'Học phần',
          classId: item.classId,
        }));
        if (studentMaterials.length) {
          if (!alive) return;
          setSubjects(subjectRows);
          setResources(
            studentMaterials.map((material) => {
              const [tag, icon] = typeMeta[material.type] || ['Học liệu', 'menu_book'];
              const source = subjectRows.find((item) => String(item.subjectId) === String(material.subjectId));
              return {
                materialId: material.materialId,
                title: material.title || 'Học liệu không có tiêu đề',
                tag,
                icon,
                type: material.type || 'OTHER',
                subjectId: material.subjectId,
                author: material.subjectName || source?.subjectName || 'Học phần',
                href:
                  material.fileUrl || `interactive_lesson.html?materialId=${encodeURIComponent(material.materialId)}`,
                external: Boolean(material.fileUrl),
              };
            })
          );
          return;
        }
        const topicGroups = await Promise.all(
          subjectRows.map(async (subject) => ({
            subject,
            topics: rowsOf(await api.subjects.topics(subject.subjectId)),
          }))
        );
        const materialGroups = await Promise.all(
          topicGroups.flatMap(({ subject, topics }) =>
            topics.map(async (topic) => ({
              subject,
              topic,
              materials: rowsOf(await api.materials.list(topic.topicId)),
            }))
          )
        );
        if (!alive) return;
        setSubjects(subjectRows);
        setResources(
          materialGroups.flatMap(({ subject, topic, materials }) =>
            materials.map((material) => {
              const [tag, icon] = typeMeta[material.type] || ['Học liệu', 'menu_book'];
              const internalHref = `interactive_lesson.html?classId=${encodeURIComponent(subject.classId)}&subjectId=${encodeURIComponent(subject.subjectId)}&topicId=${encodeURIComponent(topic.topicId)}&materialId=${encodeURIComponent(material.materialId)}`;
              return {
                materialId: material.materialId,
                title: material.title || 'Học liệu không có tiêu đề',
                tag,
                icon,
                type: material.type || 'Học liệu',
                author: `${subject.subjectName} · ${topic.topicName || topic.name || 'Chủ đề'}`,
                subjectId: subject.subjectId,
                href: material.fileUrl || internalHref,
                external: Boolean(material.fileUrl),
              };
            })
          )
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
  }, [reloadKey]);

  const filtered = useMemo(
    () =>
      resources.filter((item) => {
        const text = `${item.title} ${item.author} ${item.tag} ${item.type}`.toLowerCase();
        return (
          (!query || text.includes(query.toLowerCase())) &&
          (!subjectId || String(item.subjectId) === String(subjectId)) &&
          (type === 'Tất cả' || item.tag === type)
        );
      }),
    [resources, query, subjectId, type]
  );
  const filters = ['Tất cả', ...new Set(resources.map((item) => item.tag))];
  const search = () => setQuery(queryInput.trim());

  return (
    <AppShell
      currentPage="library.html"
      title="Kho học liệu · PTIT Physics 1"
      breadcrumbs={['Kho học liệu']}
      current="Thư viện điện tử"
      filterActions={
        <Button
          variant="secondary"
          icon="refresh"
          onClick={() => setReloadKey((value) => value + 1)}
          disabled={loading}
        >
          Tải lại
        </Button>
      }
    >
      <PageContainer>
        <PageTitle
          eyebrow="TÀI NGUYÊN HỌC TẬP"
          title="Kho học liệu điện tử"
          description="Học liệu thuộc các học phần bạn đang theo học."
        />
        <Card className="p-5">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                search
              </span>
              <input
                value={queryInput}
                onChange={(event) => setQueryInput(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && search()}
                className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] pl-11 pr-4 focus:border-primary focus:outline-none"
                placeholder="Tìm tên tài liệu, chuyên đề..."
              />
            </div>
            <select
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
              className="h-11 rounded-xl border border-[#CBD5E1] bg-white px-3"
            >
              <option value="">Tất cả học phần</option>
              {subjects.map((subject) => (
                <option key={subject.subjectId} value={subject.subjectId}>
                  {subject.subjectName}
                </option>
              ))}
            </select>
            <Button icon="search" onClick={search}>
              Tìm kiếm
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setType(filter)}
                className={`rounded-full px-3.5 py-1.5 text-label-md ${type === filter ? 'bg-primary-container text-white' : 'bg-[#F1F5F9] text-[#475569]'}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </Card>
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
            <PaginatedCollection items={filtered} resetKeys={[query, subjectId, type]} pageSize={8}>
              {(pageItems) => (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {pageItems.map((resource) => (
                    <ResourceCard key={resource.materialId} resource={resource} />
                  ))}
                </div>
              )}
            </PaginatedCollection>
            {!filtered.length && (
              <Card className="p-10 text-center">
                <span className="material-symbols-outlined text-4xl text-[#94A3B8]">search_off</span>
                <p className="mt-2 text-body-md text-[#64748B]">Không tìm thấy tài liệu phù hợp.</p>
              </Card>
            )}
          </>
        )}
      </PageContainer>
    </AppShell>
  );
}
