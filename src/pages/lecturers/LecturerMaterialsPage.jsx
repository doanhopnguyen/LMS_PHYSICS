import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { LecturerPageShell } from '../../components/LecturerPageShell.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { PaginatedCollection } from '../../components/Pagination.jsx';
import {
  lecturerMaterials,
  materialChapterLabels,
  materialStatusMeta,
  materialTypeLabels,
} from '../../data/lecturerData.js';

const typeIcons = {
  TEXTBOOK: 'menu_book',
  SLIDE: 'slideshow',
  VIDEO: 'play_circle',
  READING: 'article',
  OTHER: 'description',
};

const tabItems = [
  { id: 'ALL', label: 'Tất cả' },
  ...Object.entries(materialTypeLabels).map(([id, label]) => ({ id, label })),
];

const emptyForm = {
  title: '',
  type: 'TEXTBOOK',
  chapter: 'ALL',
  description: '',
  keywords: '',
  source: '',
  fileName: '',
  fileSize: '',
  status: 'DRAFT',
};

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T00:00:00`));
}

function MaterialFormModal({ material, onClose, onSave }) {
  const [form, setForm] = useState(() => material ? {
    ...material,
    keywords: material.keywords.join(', '),
  } : emptyForm);
  const [errors, setErrors] = useState({});

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = 'Vui lòng nhập tên học liệu.';
    if (!form.type) nextErrors.type = 'Vui lòng chọn loại học liệu.';
    if (!form.chapter) nextErrors.chapter = 'Vui lòng chọn chương.';
    if (!form.fileName.trim()) nextErrors.fileName = 'Vui lòng chọn file hoặc nhập URL.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      source: form.source.trim(),
      fileName: form.fileName.trim(),
      keywords: form.keywords.split(',').map((item) => item.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#0F172A]/45 p-3 md:p-6" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="max-h-[calc(100dvh-24px)] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-xl" role="dialog" aria-modal="true" aria-labelledby="material-form-title">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#E2E8F0] bg-white p-5">
          <div><p className="text-label-md font-bold text-primary">KHO HỌC LIỆU</p><h2 id="material-form-title" className="text-headline-md font-bold">{material ? 'Chỉnh sửa học liệu' : 'Thêm học liệu'}</h2></div>
          <button type="button" onClick={onClose} aria-label="Đóng biểu mẫu" className="flex h-9 w-9 items-center justify-center rounded-full text-[#64748B] hover:bg-[#F1F5F9]"><span className="material-symbols-outlined">close</span></button>
        </div>
        <form onSubmit={submit} className="space-y-5 p-5 md:p-6">
          <label className="block text-body-sm font-semibold">Tên học liệu *<input value={form.title} onChange={(event) => update('title', event.target.value)} className="mt-2 w-full border border-[#CBD5E1] px-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-[#FEE2E2]" aria-invalid={Boolean(errors.title)} />{errors.title && <span className="mt-1 block text-body-sm text-primary">{errors.title}</span>}</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="text-body-sm font-semibold">Loại học liệu *<select value={form.type} onChange={(event) => update('type', event.target.value)} className="mt-2 w-full border border-[#CBD5E1] bg-white px-4">{Object.entries(materialTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="text-body-sm font-semibold">Chương *<select value={form.chapter} onChange={(event) => update('chapter', event.target.value)} className="mt-2 w-full border border-[#CBD5E1] bg-white px-4">{Object.entries(materialChapterLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          </div>
          <label className="block text-body-sm font-semibold">Mô tả<textarea value={form.description} onChange={(event) => update('description', event.target.value)} rows="3" className="mt-2 w-full border border-[#CBD5E1] p-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-[#FEE2E2]" /></label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="text-body-sm font-semibold">Từ khóa<input value={form.keywords} onChange={(event) => update('keywords', event.target.value)} placeholder="Phân cách bằng dấu phẩy" className="mt-2 w-full border border-[#CBD5E1] px-4" /></label>
            <label className="text-body-sm font-semibold">Nguồn/Tác giả<input value={form.source} onChange={(event) => update('source', event.target.value)} className="mt-2 w-full border border-[#CBD5E1] px-4" /></label>
          </div>
          <div>
            <label className="block text-body-sm font-semibold">File hoặc URL *<input value={form.fileName} onChange={(event) => update('fileName', event.target.value)} placeholder="Tên file hoặc https://..." className="mt-2 w-full border border-[#CBD5E1] px-4" aria-invalid={Boolean(errors.fileName)} />{errors.fileName && <span className="mt-1 block text-body-sm text-primary">{errors.fileName}</span>}</label>
            <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-5 text-body-sm text-[#64748B] hover:border-primary"><span className="material-symbols-outlined">upload_file</span><span>Chọn file minh họa từ thiết bị</span><input type="file" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) setForm((current) => ({ ...current, fileName: file.name, fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB` })); }} /></label>
          </div>
          <label className="block text-body-sm font-semibold">Trạng thái<select value={form.status} onChange={(event) => update('status', event.target.value)} className="mt-2 w-full border border-[#CBD5E1] bg-white px-4"><option value="DRAFT">Bản nháp</option><option value="PENDING_APPROVAL">Chờ phê duyệt</option>{material && <><option value="APPROVED">Đã phê duyệt</option><option value="ARCHIVED">Đã lưu trữ</option></>}</select></label>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-[#E2E8F0] pt-5"><Button type="button" variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" icon="save">Lưu học liệu</Button></div>
        </form>
      </section>
    </div>
  );
}

function MaterialDetailModal({ material, onClose }) {
  const status = materialStatusMeta[material.status];
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#0F172A]/45 p-3 md:p-6" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="max-h-[calc(100dvh-24px)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-xl" role="dialog" aria-modal="true" aria-labelledby="material-detail-title">
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] p-5 md:p-6"><div className="flex gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FEE2E2] text-primary"><span className="material-symbols-outlined">{typeIcons[material.type]}</span></span><div><p className="text-label-md font-bold text-primary">{materialTypeLabels[material.type]}</p><h2 id="material-detail-title" className="text-headline-md font-bold">{material.title}</h2></div></div><button type="button" onClick={onClose} aria-label="Đóng chi tiết" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#64748B] hover:bg-[#F1F5F9]"><span className="material-symbols-outlined">close</span></button></div>
        <div className="space-y-5 p-5 md:p-6">
          <div className="flex flex-wrap gap-2"><StatusBadge tone={status.tone}>{status.label}</StatusBadge><StatusBadge tone="neutral">{materialChapterLabels[material.chapter]}</StatusBadge></div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-body-sm"><div><dt className="text-[#64748B]">Nguồn/Tác giả</dt><dd className="mt-1 font-semibold">{material.source || 'Chưa cập nhật'}</dd></div><div><dt className="text-[#64748B]">Thông tin file</dt><dd className="mt-1 break-all font-semibold">{material.fileName} · {material.fileSize || 'Không xác định'}</dd></div><div><dt className="text-[#64748B]">Ngày tạo</dt><dd className="mt-1 font-semibold">{formatDate(material.createdAt)}</dd></div><div><dt className="text-[#64748B]">Ngày cập nhật</dt><dd className="mt-1 font-semibold">{formatDate(material.updatedAt)}</dd></div></dl>
          <div><h3 className="font-semibold">Mô tả</h3><p className="mt-2 text-body-md text-[#64748B]">{material.description || 'Chưa có mô tả.'}</p></div>
          <div><h3 className="font-semibold">Từ khóa</h3><div className="mt-2 flex flex-wrap gap-2">{material.keywords.length ? material.keywords.map((keyword) => <span key={keyword} className="rounded-full bg-[#F1F5F9] px-3 py-1 text-label-md text-[#475569]">{keyword}</span>) : <span className="text-body-sm text-[#64748B]">Chưa có từ khóa.</span>}</div></div>
          <Card className={`p-4 ${material.status === 'APPROVED' ? 'border-[#86EFAC] bg-[#F0FDF4]' : 'bg-[#F8FAFC]'}`}><h3 className="font-semibold">Sử dụng bởi AI</h3><p className={`mt-2 text-body-sm ${material.status === 'APPROVED' ? 'text-[#15803D]' : 'text-[#64748B]'}`}>{material.status === 'APPROVED' ? '✓ Học liệu này có thể được sử dụng làm nguồn tham chiếu cho Trợ giảng AI.' : 'Học liệu này chưa được sử dụng làm nguồn chính thức cho Trợ giảng AI.'}</p></Card>
          <div className="flex justify-end"><Button type="button" variant="secondary" onClick={onClose}>Đóng</Button></div>
        </div>
      </section>
    </div>
  );
}

export function LecturerMaterialsPage() {
  const requestedMaterialId = new URLSearchParams(window.location.search).get('material');
  const requestedMaterial = requestedMaterialId
    ? lecturerMaterials.find((item) => item.id === requestedMaterialId)
    : null;
  const [materials, setMaterials] = useState(lecturerMaterials);
  const [query, setQuery] = useState('');
  const [chapter, setChapter] = useState('ALL_FILTER');
  const [status, setStatus] = useState('ALL');
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(requestedMaterial);
  const [formOpen, setFormOpen] = useState(false);
  const [feedback, setFeedback] = useState(
    requestedMaterialId && !requestedMaterial ? `Không tìm thấy học liệu ${requestedMaterialId}.` : ''
  );
  const [tabsKey, setTabsKey] = useState(0);

  useEffect(() => {
    if (!formOpen && !viewing) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') { setFormOpen(false); setViewing(null); } };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [formOpen, viewing]);

  useEffect(() => {
    if (!feedback) return undefined;
    const timer = window.setTimeout(() => setFeedback(''), 3000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const counts = useMemo(() => ({
    total: materials.length,
    approved: materials.filter((item) => item.status === 'APPROVED').length,
    pending: materials.filter((item) => item.status === 'PENDING_APPROVAL').length,
    draft: materials.filter((item) => item.status === 'DRAFT').length,
  }), [materials]);

  const filteredByControls = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi');
    return materials.filter((item) => {
      const searchable = `${item.title} ${materialChapterLabels[item.chapter]} ${item.keywords.join(' ')}`.toLocaleLowerCase('vi');
      return (!normalized || searchable.includes(normalized)) &&
        (chapter === 'ALL_FILTER' || item.chapter === chapter) &&
        (status === 'ALL' || item.status === status);
    });
  }, [chapter, materials, query, status]);

  const resetFilters = () => { setQuery(''); setChapter('ALL_FILTER'); setStatus('ALL'); setTabsKey((key) => key + 1); };
  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (material) => { setEditing(material); setFormOpen(true); };
  const saveMaterial = (values) => {
    const today = new Date().toISOString().slice(0, 10);
    if (editing) {
      setMaterials((current) => current.map((item) => item.id === editing.id ? { ...item, ...values, updatedAt: today } : item));
      setFeedback('Đã cập nhật học liệu.');
    } else {
      const nextNumber = Math.max(...materials.map((item) => Number(item.id.replace('MAT', ''))), 0) + 1;
      setMaterials((current) => [{ ...values, id: `MAT${String(nextNumber).padStart(3, '0')}`, createdAt: today, updatedAt: today }, ...current]);
      setFeedback('Đã thêm học liệu mới.');
    }
    setFormOpen(false);
    setEditing(null);
  };
  const changeStatus = (id, nextStatus) => {
    const today = new Date().toISOString().slice(0, 10);
    setMaterials((current) => current.map((item) => item.id === id ? { ...item, status: nextStatus, updatedAt: today } : item));
    setFeedback(`Đã chuyển trạng thái sang “${materialStatusMeta[nextStatus].label}”.`);
  };

  return (
    <LecturerPageShell currentPage="lecturer_materials.html" title="Kho học liệu" eyebrow="VẬT LÝ ĐẠI CƯƠNG 1 · BAS1201" description="Quản lý học liệu của học phần Vật lý đại cương 1" actions={<Button icon="add" onClick={openCreate}>Thêm học liệu</Button>}>
      {feedback && <div className="flex items-center gap-2 rounded-xl border border-[#86EFAC] bg-[#F0FDF4] px-4 py-3 text-body-sm font-semibold text-[#15803D]" role="status"><span className="material-symbols-outlined">check_circle</span>{feedback}</div>}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Thống kê học liệu">
        <StatCard label="Tổng học liệu" value={String(counts.total)} icon="folder_open" />
        <StatCard label="Đã phê duyệt" value={String(counts.approved)} icon="verified" tone="success" />
        <StatCard label="Chờ phê duyệt" value={String(counts.pending)} icon="pending_actions" tone="warning" />
        <StatCard label="Bản nháp" value={String(counts.draft)} icon="draft" />
      </section>
      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <label className="text-body-sm font-semibold md:col-span-2"><span className="sr-only">Tìm kiếm học liệu</span><span className="relative block"><span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">search</span><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Tìm kiếm học liệu..." className="w-full border border-[#CBD5E1] bg-[#F8FAFC] pl-11 pr-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-[#FEE2E2]" /></span></label>
          <label className="text-body-sm font-semibold"><span className="mb-2 block">Chương</span><select value={chapter} onChange={(event) => setChapter(event.target.value)} className="w-full border border-[#CBD5E1] bg-white px-4"><option value="ALL_FILTER">Tất cả</option>{Object.entries(materialChapterLabels).filter(([value]) => value !== 'ALL').map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="text-body-sm font-semibold"><span className="mb-2 block">Trạng thái</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full border border-[#CBD5E1] bg-white px-4"><option value="ALL">Tất cả</option>{Object.entries(materialStatusMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</select></label>
        </div>
      </Card>
      <Tabs key={tabsKey} items={tabItems}>
        {(activeType) => {
          const visible = filteredByControls.filter((item) => activeType === 'ALL' || item.type === activeType);
          return visible.length ? (
            <PaginatedCollection items={visible} resetKeys={[activeType, query, chapter, status]} pageSize={9}>
              {(pageItems) => <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pt-5">
              {pageItems.map((item) => {
                const statusMeta = materialStatusMeta[item.status];
                return (
                  <Card key={item.id} className="p-5 flex min-w-0 flex-col hover:-translate-y-1 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FEE2E2] text-primary"><span className="material-symbols-outlined">{typeIcons[item.type]}</span></span><StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge></div>
                    <p className="mt-4 text-label-md font-bold text-primary">{materialTypeLabels[item.type]}</p>
                    <h2 className="mt-1 text-headline-sm font-bold leading-6">{item.title}</h2>
                    <p className="mt-2 line-clamp-2 text-body-sm text-[#64748B]">{item.description}</p>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-body-sm"><div className="rounded-lg bg-[#F8FAFC] p-3"><dt className="text-[#64748B]">Chương</dt><dd className="mt-1 font-semibold">{materialChapterLabels[item.chapter]}</dd></div><div className="rounded-lg bg-[#F8FAFC] p-3"><dt className="text-[#64748B]">Dung lượng</dt><dd className="mt-1 font-semibold">{item.fileSize}</dd></div></dl>
                    <p className="mt-3 text-body-sm text-[#64748B]">Cập nhật: {formatDate(item.updatedAt)}</p>
                    <div className="mt-auto flex items-center gap-2 pt-5"><Button variant="secondary" onClick={() => setViewing(item)} className="flex-1">Xem</Button><Button variant="secondary" onClick={() => openEdit(item)} className="flex-1">Chỉnh sửa</Button><details className="relative"><summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border border-[#CBD5E1] text-[#64748B] hover:border-primary" aria-label={`Tùy chọn cho ${item.title}`}><span className="material-symbols-outlined">more_vert</span></summary><div className="absolute bottom-11 right-0 z-20 w-48 rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-lg"><button type="button" onClick={() => changeStatus(item.id, 'APPROVED')} className="w-full rounded-lg px-3 py-2 text-left text-body-sm hover:bg-[#F1F5F9]">Phê duyệt</button><button type="button" onClick={() => changeStatus(item.id, 'PENDING_APPROVAL')} className="w-full rounded-lg px-3 py-2 text-left text-body-sm hover:bg-[#F1F5F9]">Gửi phê duyệt</button><button type="button" onClick={() => changeStatus(item.id, 'ARCHIVED')} className="w-full rounded-lg px-3 py-2 text-left text-body-sm hover:bg-[#F1F5F9]">Lưu trữ</button></div></details></div>
                  </Card>
                );
              })}
            </div>}
            </PaginatedCollection>
          ) : (
            <Card className="mt-5 p-10 text-center"><span className="material-symbols-outlined text-4xl text-[#94A3B8]">search_off</span><h2 className="mt-3 text-headline-sm font-bold">Không tìm thấy học liệu</h2><p className="mt-1 text-body-md text-[#64748B]">Thử thay đổi từ khóa hoặc bộ lọc.</p><Button variant="secondary" className="mt-5" onClick={resetFilters}>Xóa bộ lọc</Button></Card>
          );
        }}
      </Tabs>
      {formOpen && <MaterialFormModal material={editing} onClose={() => { setFormOpen(false); setEditing(null); }} onSave={saveMaterial} />}
      {viewing && <MaterialDetailModal material={viewing} onClose={() => setViewing(null)} />}
    </LecturerPageShell>
  );
}
