import React, { useEffect, useState } from 'react';
import { Card } from '../../components/Card.jsx';
import { ResizablePanels } from '../../components/ResizablePanels.jsx';
import { TabAction } from '../../components/TabAction.jsx';
import { Button as EditableButton } from '../../components/Button.jsx';
import { FormField } from '../../components/FormField.jsx';
import { SelectField } from '../../components/SelectField.jsx';
import { Form, SubmitButton } from '../../components/Form.jsx';
import { FormDialog } from '../../components/FormDialog.jsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
import { ActionMenu as EditableActionMenu } from '../../components/ActionMenu.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { MaterialContentFields, materialFormats } from '../../components/MaterialContentFields.jsx';
import { MaterialFilePreview } from '../../components/MaterialFilePreview.jsx';
import { MarkdownContent } from '../../components/MarkdownContent.jsx';
import { api, apiRequest } from '../../lib/apiClient.js';
import { approveAdminMaterial } from '../../lib/adminMaterialApproval.js';
import { loadAllPages } from '../../lib/lecturerUtils.js';
import { validateVideoMaterial } from '../../lib/materialSources.js';
import { matches, PagedCards, ResourceState } from './AdminManagementShared.jsx';

const unassigned = { chapterId: 'unassigned', chapterName: 'Chủ đề chưa phân chương' };
const labels = { chapter: 'chương', topic: 'chủ đề', material: 'học liệu' };
const nameOf = (item) => item?.chapterName || item?.topicName || item?.title || '';
const sortByOrder = (rows) => [...rows].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
const iconOf = (type) =>
  type === 'PDF' ? 'picture_as_pdf' : type === 'VIDEO' ? 'videocam' : type === 'SLIDE' ? 'slideshow' : 'description';

function useCurriculum(subjectId, classId) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ data: { chapters: [], topics: [], materials: [] }, loading: true, error: '' });
  useEffect(() => {
    let alive = true;
    setState((current) => ({ ...current, loading: true, error: '' }));
    (async () => {
      const [chapters, topics] = await Promise.all([
        loadAllPages(apiRequest, `/api/v1/subjects/${subjectId}/chapters`),
        loadAllPages(apiRequest, `/api/v1/subjects/${subjectId}/topics`),
      ]);
      const materials = classId ? await loadAllPages(apiRequest, `/api/v1/classes/${classId}/materials`) : [];
      // Bound concurrent requests while keeping search complete across the subject.
      for (let index = 0; !classId && index < topics.length; index += 4) {
        if (!alive) return;
        const batches = await Promise.all(
          topics
            .slice(index, index + 4)
            .map(async (topic) =>
              (await loadAllPages(apiRequest, `/api/v1/topics/${topic.topicId}/materials`))
                .filter((item) => item.scope !== 'CLASS')
                .map((item) => ({ ...item, topicId: topic.topicId }))
            )
        );
        materials.push(...batches.flat());
      }
      if (alive)
        setState({
          data: { chapters: sortByOrder(chapters), topics: sortByOrder(topics), materials },
          loading: false,
          error: '',
        });
    })().catch((error) => alive && setState((current) => ({ ...current, loading: false, error: error.message })));
    return () => {
      alive = false;
    };
  }, [subjectId, classId, version]);
  return { ...state, reload: () => setVersion((value) => value + 1) };
}

export function AdminCurriculumTree({ subjectId, classId = '', readOnly = false, tabActionTarget = null }) {
  const resource = useCurriculum(subjectId, classId);
  const Button = readOnly ? () => null : EditableButton;
  const ActionMenu = readOnly ? () => null : EditableActionMenu;
  const { chapters, topics, materials } = resource.data;
  const [selected, setSelected] = useState(null);
  const [treeWidth, setTreeWidth] = useState(340);
  const [expanded, setExpanded] = useState(new Set());
  const [expandedTopics, setExpandedTopics] = useState(new Set());
  const [collapsedSearchChapters, setCollapsedSearchChapters] = useState(new Set());
  const [collapsedSearchTopics, setCollapsedSearchTopics] = useState(new Set());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [materialType, setMaterialType] = useState('MARKDOWN');
  const [preview, setPreview] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pendingMaterial, setPendingMaterial] = useState(null);
  const chapterIdOf = (topic) =>
    chapters.some((chapter) => chapter.chapterId === topic.chapterId) ? topic.chapterId : 'unassigned';
  const allChapters = topics.some((topic) => chapterIdOf(topic) === 'unassigned')
    ? [...chapters, unassigned]
    : chapters;
  const selectedTopic = selected?.kind === 'topic' ? topics.find((topic) => topic.topicId === selected.id) : null;
  const selectedChapter =
    selected?.kind === 'chapter'
      ? allChapters.find((chapter) => chapter.chapterId === selected.id)
      : allChapters.find((chapter) => chapter.chapterId === chapterIdOf(selectedTopic || {}));
  const current = selectedTopic || selectedChapter;
  const materialRows = selectedTopic
    ? materials.filter(
        (material) => material.topicId === selectedTopic.topicId && (!typeFilter || material.type === typeFilter)
      )
    : [];
  useEffect(() => {
    if (resource.loading || resource.error) return;
    const exists =
      selected?.kind === 'topic'
        ? topics.some((t) => t.topicId === selected.id)
        : allChapters.some((c) => c.chapterId === selected?.id);
    if (!exists) {
      const first = topics[0];
      setSelected(
        first
          ? { kind: 'topic', id: first.topicId }
          : chapters[0]
            ? { kind: 'chapter', id: chapters[0].chapterId }
            : null
      );
      if (first || chapters[0])
        setExpanded((previous) => new Set([...previous, first ? chapterIdOf(first) : chapters[0].chapterId]));
    }
  }, [resource.data, resource.loading, resource.error, selected]);
  function toggle(setter, id) {
    setter((previous) => {
      const next = new Set(previous);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function select(kind, id) {
    setSelected({ kind, id });
    setTypeFilter('');
  }
  function open(kind, item = {}, parentId = selectedChapter?.chapterId) {
    if (readOnly) return;
    if (kind === 'material' && pendingMaterial) {
      setError('Hãy hoàn tất lưu học liệu trước đó bằng nút thử lại.');
      return;
    }
    setError('');
    setMaterialType(item.type || 'MARKDOWN');
    setModal({
      kind,
      item,
      parentId: parentId === 'unassigned' ? null : parentId,
      topicId: item.topicId || selectedTopic?.topicId,
    });
  }
  async function edit(kind, item) {
    if (kind !== 'material') {
      open(kind, item, kind === 'topic' ? item.chapterId : undefined);
      return;
    }
    setBusy(true);
    setError('');
    try {
      open(kind, await api.materials.get(item.topicId, item.materialId));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const menuItems = (kind, item) => [
    { label: 'Chỉnh sửa', onSelect: () => edit(kind, item) },
    {
      label: 'Xóa',
      danger: true,
      onSelect: () => {
        setError('');
        setRemoveTarget({ kind, item });
      },
    },
  ];
  async function view(material) {
    setBusy(true);
    setError('');
    try {
      setPreview(await api.materials.get(material.topicId, material.materialId));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function save(event) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form);
    const { kind, item, parentId, topicId } = modal;
    const id =
      item.chapterId && kind === 'chapter' ? item.chapterId : kind === 'topic' ? item.topicId : item.materialId;
    setBusy(true);
    setError('');
    setMessage('');
    let savedMaterial = null;
    try {
      let result;
      if (kind === 'chapter')
        result = await apiRequest(id ? `/api/v1/chapters/${id}` : `/api/v1/subjects/${subjectId}/chapters`, {
          method: id ? 'PUT' : 'POST',
          body: { ...values, orderIndex: Number(values.orderIndex), isActive: item.isActive ?? true },
        });
      else if (kind === 'topic') {
        const body = { ...values, chapterId: parentId || null, orderIndex: Number(values.orderIndex) };
        result = id
          ? await api.subjects.updateTopic(subjectId, id, body)
          : await api.subjects.createTopic(subjectId, body);
      } else {
        form.set('type', materialType);
        form.set('scope', 'SHARED');
        form.set('topicId', topicId);
        const videoError = validateVideoMaterial(form, item);
        if (videoError) throw new Error(videoError);
        if (['TEXT', 'MARKDOWN'].includes(materialType) && !String(form.get('contentText') || '').trim())
          throw new Error('Vui lòng nhập nội dung học liệu.');
        if (!form.get('file')?.size) form.delete('file');
        result = id ? await api.materials.update(topicId, id, form) : await api.materials.create(topicId, form);
        savedMaterial = { topicId, material: result };
        setPendingMaterial(savedMaterial);
        setModal(null);
        resource.reload();
        result = await approveAdminMaterial(topicId, result);
        setPendingMaterial(null);
      }
      if (kind === 'topic' && result?.topicId) {
        select('topic', result.topicId);
        setExpanded((previous) => new Set([...previous, parentId || 'unassigned']));
      }
      if (kind === 'chapter' && result?.chapterId) {
        select('chapter', result.chapterId);
        setExpanded((previous) => new Set([...previous, result.chapterId]));
      }
      resource.reload();
      setModal(null);
      setMessage(`Đã ${id ? 'cập nhật' : 'tạo'} ${labels[kind]}.`);
    } catch (e) {
      setError(savedMaterial ? `Học liệu đã được lưu nhưng chưa thể hoàn tất. ${e.message}` : e.message);
    } finally {
      setBusy(false);
    }
  }
  async function retryMaterialSave() {
    if (!pendingMaterial || busy || readOnly) return;
    setBusy(true);
    setError('');
    try {
      await approveAdminMaterial(pendingMaterial.topicId, pendingMaterial.material);
      setPendingMaterial(null);
      resource.reload();
      setMessage('Đã lưu học liệu.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!removeTarget || busy) return;
    setBusy(true);
    setError('');
    const { kind, item } = removeTarget;
    try {
      if (kind === 'chapter') await apiRequest(`/api/v1/chapters/${item.chapterId}`, { method: 'DELETE' });
      else if (kind === 'topic') await api.subjects.deleteTopic(subjectId, item.topicId);
      else await api.materials.remove(item.topicId, item.materialId);
      resource.reload();
      setRemoveTarget(null);
      setMessage(`Đã xóa ${labels[kind]}.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const visibleChapters = allChapters.filter(
    (chapter) =>
      matches(search, nameOf(chapter), chapter.chapterCode) ||
      topics.some(
        (topic) =>
          chapterIdOf(topic) === chapter.chapterId &&
          (matches(search, nameOf(topic)) ||
            materials.some((material) => material.topicId === topic.topicId && matches(search, material.title)))
      )
  );
  return (
    <>
      <AuthAlert>{message}</AuthAlert>
      <AuthAlert error>{!modal && !removeTarget && error}</AuthAlert>
      {pendingMaterial && !busy && !readOnly && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-body-sm">
            Chưa hoàn tất lưu học liệu “{pendingMaterial.material?.title || 'Học liệu mới'}”.
          </p>
          <Button variant="secondary" onClick={retryMaterialSave}>
            Thử lại lưu học liệu
          </Button>
        </div>
      )}
      <ResourceState resource={resource}>
        <ResizablePanels leftWidth={treeWidth} onLeftWidthChange={setTreeWidth}>
          <Card className="curriculum-tree-panel min-w-0 p-4" aria-label="Cây chương trình đào tạo">
            <nav aria-label="Chương và chủ đề" className="curriculum-tree-navigation">
              <PagedCards
                compactPagination
                grid={false}
                rows={visibleChapters}
                resetKey={search}
                render={(chapter) => {
                  const chapterMatches = matches(search, nameOf(chapter), chapter.chapterCode);
                  const chapterTopics = topics.filter((topic) => chapterIdOf(topic) === chapter.chapterId);
                  const shownTopics = chapterTopics.filter(
                    (topic) =>
                      chapterMatches ||
                      matches(search, nameOf(topic)) ||
                      materials.some(
                        (material) => material.topicId === topic.topicId && matches(search, material.title)
                      )
                  );
                  const isOpen = search.trim()
                    ? !collapsedSearchChapters.has(chapter.chapterId)
                    : expanded.has(chapter.chapterId);
                  return (
                    <div key={chapter.chapterId}>
                      <div
                        className={`flex min-w-0 items-center gap-1 rounded-xl ${selected?.kind === 'chapter' && selected.id === chapter.chapterId ? 'bg-surface-container-low' : ''}`}
                      >
                        <button
                          type="button"
                          className="flex h-8 w-7 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-surface-container-low"
                          aria-label={`${isOpen ? 'Thu gọn' : 'Mở rộng'} ${nameOf(chapter)}`}
                          aria-expanded={isOpen}
                          aria-controls={`chapter-${chapter.chapterId}`}
                          onClick={() =>
                            toggle(search.trim() ? setCollapsedSearchChapters : setExpanded, chapter.chapterId)
                          }
                        >
                          <span className="material-symbols-outlined text-base">
                            {isOpen ? 'expand_more' : 'chevron_right'}
                          </span>
                        </button>
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 items-start gap-2 py-2 text-left text-body-sm font-semibold hover:text-primary"
                          onClick={() => {
                            select('chapter', chapter.chapterId);
                            setExpanded((previous) => new Set([...previous, chapter.chapterId]));
                          }}
                        >
                          <span className="material-symbols-outlined shrink-0 text-base">folder_open</span>
                          <span className="min-w-0 break-words">
                            {nameOf(chapter)}{' '}
                            <span className="font-normal text-slate-500">({chapterTopics.length} chủ đề)</span>
                          </span>
                        </button>
                        {chapter.chapterId !== 'unassigned' && (
                          <ActionMenu
                            label={`Thao tác với ${nameOf(chapter)}`}
                            disabled={busy}
                            items={menuItems('chapter', chapter)}
                          />
                        )}
                      </div>
                      {isOpen && (
                        <div id={`chapter-${chapter.chapterId}`} className="ml-3 border-l border-[#E2E8F0] pl-3">
                          {shownTopics.map((topic) => {
                            const topicMaterials = materials.filter((material) => material.topicId === topic.topicId);
                            const topicOpen = search.trim()
                              ? !collapsedSearchTopics.has(topic.topicId)
                              : expandedTopics.has(topic.topicId);
                            return (
                              <div key={topic.topicId}>
                                <div
                                  className={`flex min-w-0 items-center gap-1 rounded-xl ${selected?.kind === 'topic' && selected.id === topic.topicId ? 'bg-surface-container-low text-primary' : ''}`}
                                >
                                  <button
                                    type="button"
                                    className="flex h-8 w-6 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-surface-container-low"
                                    aria-label={`${topicOpen ? 'Thu gọn' : 'Mở rộng'} ${topic.topicName}`}
                                    aria-expanded={topicOpen}
                                    aria-controls={`topic-${topic.topicId}`}
                                    onClick={() =>
                                      toggle(
                                        search.trim() ? setCollapsedSearchTopics : setExpandedTopics,
                                        topic.topicId
                                      )
                                    }
                                  >
                                    <span className="material-symbols-outlined text-base">
                                      {topicOpen ? 'expand_more' : 'chevron_right'}
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    aria-current={selectedTopic?.topicId === topic.topicId ? 'true' : undefined}
                                    className="min-w-0 flex-1 break-words py-2 text-left text-body-sm hover:text-primary"
                                    onClick={() => select('topic', topic.topicId)}
                                  >
                                    {topic.topicName}{' '}
                                    <span className="text-slate-500">({topicMaterials.length} học liệu)</span>
                                  </button>
                                  <ActionMenu
                                    label={`Thao tác với ${topic.topicName}`}
                                    disabled={busy}
                                    items={menuItems('topic', topic)}
                                  />
                                </div>
                                {topicOpen && (
                                  <div id={`topic-${topic.topicId}`} className="ml-3 border-l border-[#E2E8F0] pl-3">
                                    {topicMaterials
                                      .filter(
                                        (material) =>
                                          chapterMatches ||
                                          matches(search, topic.topicName) ||
                                          matches(search, material.title)
                                      )
                                      .map((material) => (
                                        <button
                                          key={material.materialId}
                                          type="button"
                                          disabled={busy}
                                          onClick={() => {
                                            select('topic', topic.topicId);
                                            view(material);
                                          }}
                                          className="flex w-full min-w-0 items-center gap-2 rounded-xl px-2 py-2 text-left text-body-sm text-slate-500 hover:bg-surface-container-low hover:text-primary"
                                        >
                                          <span className="material-symbols-outlined shrink-0 text-base">
                                            {iconOf(material.type)}
                                          </span>
                                          <span className="truncate">{material.title}</span>
                                        </button>
                                      ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          <Button
                            variant="ghost"
                            icon="add"
                            disabled={busy}
                            className="my-2 text-body-sm"
                            onClick={() => open('topic', {}, chapter.chapterId)}
                          >
                            Tạo mới chủ đề
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
            </nav>
            <TabAction target={tabActionTarget}>
              <Button
                variant={tabActionTarget ? 'primary' : 'ghost'}
                icon="add"
                disabled={busy}
                className={tabActionTarget ? 'shrink-0 whitespace-nowrap' : 'mt-3 shrink-0 self-start'}
                onClick={() => open('chapter')}
              >
                Tạo mới chương
              </Button>
            </TabAction>
            <Card as="div" className="curriculum-tree-search p-2 shadow-lg">
              <span className="material-symbols-outlined shrink-0 text-slate-500" aria-hidden="true">
                search
              </span>
              <FormField
                bare
                aria-label="Tìm kiếm chương, chủ đề, học liệu"
                type="search"
                placeholder="Tìm kiếm chương, chủ đề, học liệu…"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCollapsedSearchChapters(new Set());
                  setCollapsedSearchTopics(new Set());
                }}
              />
            </Card>
          </Card>
          <section className="min-w-0" aria-label="Nội dung chương trình">
            {current ? (
              <>
                <Card className="mb-5 flex items-start gap-4 p-5">
                  <span className="material-symbols-outlined rounded-xl bg-surface-container-low p-3 text-primary">
                    {selectedTopic ? 'description' : 'folder_open'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="break-words text-headline-sm font-semibold">{nameOf(current)}</h2>
                    {current.description && (
                      <p className="mt-2 break-words text-body-sm text-slate-500">{current.description}</p>
                    )}
                  </div>
                  {current.chapterId !== 'unassigned' && (
                    <ActionMenu
                      label={`Thao tác nội dung ${nameOf(current)}`}
                      disabled={busy}
                      items={menuItems(selectedTopic ? 'topic' : 'chapter', current)}
                    />
                  )}
                </Card>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-semibold">
                    {selectedTopic
                      ? `Học liệu (${materials.filter((material) => material.topicId === selectedTopic.topicId).length})`
                      : `Chủ đề (${topics.filter((topic) => chapterIdOf(topic) === selectedChapter.chapterId).length})`}
                  </h3>
                  <div className="curriculum-material-toolbar flex w-full min-w-0 max-w-full items-center gap-3 sm:w-auto">
                    {selectedTopic && (
                      <SelectField
                        label="Loại học liệu"
                        value={typeFilter}
                        onChange={(event) => setTypeFilter(event.target.value)}
                      >
                        <option value="">Tất cả</option>
                        {materialFormats.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </SelectField>
                    )}
                    <Button icon="add" disabled={busy} onClick={() => open(selectedTopic ? 'material' : 'topic')}>
                      Tạo mới {selectedTopic ? 'học liệu' : 'chủ đề'}
                    </Button>
                  </div>
                </div>
                {selectedTopic ? (
                  <>
                    <div className="curriculum-materials-grid">
                      <PagedCards
                        compactPagination
                        rows={materialRows}
                        resetKey={selectedTopic.topicId + typeFilter}
                        render={(material) => (
                          <Card key={material.materialId} className="flex min-w-0 flex-col p-4">
                            <div className="mb-4 flex items-center justify-between gap-2">
                              <span className="material-symbols-outlined rounded-xl bg-surface-container-low p-3 text-primary">
                                {iconOf(material.type)}
                              </span>
                              <span className="text-body-sm text-slate-500">
                                {materialFormats.find(([value]) => value === material.type)?.[1] || material.type}
                              </span>
                            </div>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => view(material)}
                              className="break-words text-left font-semibold hover:text-primary"
                            >
                              {material.title}
                            </button>
                            {material.contentText && (
                              <p className="mt-2 line-clamp-2 break-words text-body-sm text-slate-500">
                                {material.contentText}
                              </p>
                            )}
                            <div className="mt-auto flex items-end justify-between gap-2 pt-5">
                              <span className="text-body-sm text-slate-500">
                                {(material.updatedAt || material.createdAt) &&
                                  `Cập nhật: ${new Date(material.updatedAt || material.createdAt).toLocaleDateString('vi-VN')}`}
                              </span>
                              <ActionMenu
                                label={`Thao tác với ${material.title}`}
                                disabled={busy}
                                items={menuItems('material', material)}
                              />
                            </div>
                          </Card>
                        )}
                      />
                    </div>
                    {!readOnly && (
                      <Card
                        as="button"
                        type="button"
                        disabled={busy}
                        onClick={() => open('material')}
                        className="mt-5 flex w-full flex-col items-center gap-2 border-dashed p-6 text-slate-500 transition-colors hover:border-primary hover:text-primary"
                      >
                        <span className="material-symbols-outlined">add_circle</span>
                        <span className="font-semibold">Thêm học liệu mới</span>
                        <span className="text-body-sm">PDF, video, slide hoặc tài liệu văn bản</span>
                      </Card>
                    )}
                  </>
                ) : (
                  <PagedCards
                    compactPagination
                    rows={topics.filter((topic) => chapterIdOf(topic) === selectedChapter.chapterId)}
                    grid={false}
                    render={(topic) => (
                      <Card key={topic.topicId} className="p-4">
                        <button
                          type="button"
                          className="w-full break-words text-left font-semibold hover:text-primary"
                          onClick={() => select('topic', topic.topicId)}
                        >
                          {topic.topicName}
                        </button>
                      </Card>
                    )}
                  />
                )}
              </>
            ) : (
              <Card className="p-8 text-center text-slate-500">
                <span className="material-symbols-outlined mb-3 block text-4xl">account_tree</span>
                <p>Chọn chương hoặc chủ đề để quản lý nội dung.</p>
                <Button variant="secondary" icon="add" className="mt-4" onClick={() => open('chapter')}>
                  Tạo mới chương
                </Button>
              </Card>
            )}
          </section>
        </ResizablePanels>
      </ResourceState>
      {preview && (
        <FormDialog title={preview.title} wide onClose={() => setPreview(null)}>
          {preview.type === 'MARKDOWN' && preview.contentText ? (
            <MarkdownContent content={preview.contentText} />
          ) : preview.type === 'TEXT' ? (
            <p className="whitespace-pre-wrap">{preview.contentText}</p>
          ) : (
            <MaterialFilePreview material={preview} />
          )}
        </FormDialog>
      )}
      {modal && (
        <FormDialog
          title={`${modal.item.chapterId || (modal.item.topicId && modal.kind === 'topic') || modal.item.materialId ? 'Chỉnh sửa' : 'Tạo mới'} ${labels[modal.kind]}`}
          busy={busy}
          wide={modal.kind === 'material'}
          expandable={modal.kind === 'material'}
          onClose={() => !busy && setModal(null)}
        >
          <AuthAlert error>{error}</AuthAlert>
          <Form className="space-y-4" onSubmit={save}>
            {modal.kind === 'chapter' && (
              <FormField
                label="Mã chương"
                name="chapterCode"
                required
                maxLength={50}
                defaultValue={modal.item.chapterCode || ''}
                disabled={busy}
              />
            )}
            <FormField
              label={`Tên ${labels[modal.kind]}`}
              name={modal.kind === 'chapter' ? 'chapterName' : modal.kind === 'topic' ? 'topicName' : 'title'}
              required
              defaultValue={nameOf(modal.item)}
              disabled={busy}
            />
            {modal.kind !== 'material' ? (
              <>
                <FormField
                  label="Thứ tự"
                  name="orderIndex"
                  type="number"
                  min="0"
                  defaultValue={
                    modal.item.orderIndex ??
                    (modal.kind === 'chapter'
                      ? chapters.length
                      : topics.filter((topic) => chapterIdOf(topic) === (modal.parentId || 'unassigned')).length) + 1
                  }
                  disabled={busy}
                />
                <FormField
                  label="Mô tả"
                  name="description"
                  multiline
                  defaultValue={modal.item.description || ''}
                  disabled={busy}
                />
              </>
            ) : (
              <>
                <SelectField
                  label="Loại học liệu"
                  name="type"
                  required
                  value={materialType}
                  onChange={(event) => setMaterialType(event.target.value)}
                  disabled={busy}
                >
                  {materialFormats.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </SelectField>
                <MaterialContentFields key={materialType} type={materialType} initial={modal.item} busy={busy} />
              </>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="secondary" disabled={busy} onClick={() => setModal(null)}>
                Hủy
              </Button>
              <SubmitButton busy={busy}>Lưu</SubmitButton>
            </div>
          </Form>
        </FormDialog>
      )}
      {removeTarget && (
        <ConfirmDialog
          title={`Xóa ${labels[removeTarget.kind]}`}
          description={`Xóa “${nameOf(removeTarget.item)}”? ${removeTarget.kind === 'chapter' ? 'Chỉ có thể xóa chương không còn chủ đề.' : removeTarget.kind === 'material' ? 'Học liệu sẽ bị gỡ khỏi chủ đề.' : 'Chủ đề sẽ bị xóa khỏi chương trình đào tạo.'}`}
          busy={busy}
          confirmLabel="Xóa"
          onCancel={() => !busy && setRemoveTarget(null)}
          onConfirm={remove}
        />
      )}
      {removeTarget && error && (
        <div
          role="alert"
          className="fixed bottom-4 left-1/2 z-[1300] -translate-x-1/2 rounded-xl bg-red-50 p-4 text-red-700"
        >
          {error}
        </div>
      )}
    </>
  );
}
