import React, { useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell.jsx';
import { Button } from '../components/Button.jsx';
import { Card } from '../components/Card.jsx';
import { PageContainer } from '../components/PageContainer.jsx';
import { PageTitle } from '../components/PageTitle.jsx';
import { ResourceCard } from '../components/ResourceCard.jsx';
import { resources } from '../data/lmsData.js';

export function LibraryPage() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => resources.filter((item) => `${item.title} ${item.author} ${item.tag}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return <AppShell currentPage="library.html" title="Kho học liệu · PTIT Physics 1" breadcrumbs={['Kho học liệu']} current="Thư viện điện tử"><PageContainer><PageTitle eyebrow="TÀI NGUYÊN HỌC TẬP" title="Kho học liệu điện tử" description="Tìm kiếm giáo trình, công thức, video bài giảng và mô phỏng thực hành cho Vật lý 1." actions={<Button variant="secondary" icon="bookmark">Đã lưu</Button>} /><Card className="p-5"><div className="flex flex-col md:flex-row gap-3"><div className="relative flex-1"><span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">search</span><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full h-11 pl-11 pr-4 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] focus:outline-none focus:border-primary" placeholder="Tìm tên tài liệu, tác giả, chuyên đề..." /></div><Button icon="search">Tìm kiếm</Button></div><div className="flex items-center gap-2 flex-wrap mt-4">{['Tất cả','Giáo trình','Công thức','Bài giảng','Thí nghiệm'].map((filter,index) => <button key={filter} className={`px-3.5 py-1.5 rounded-full text-label-md ${index === 0 ? 'bg-primary-container text-white' : 'bg-[#F1F5F9] text-[#475569]'}`}>{filter}</button>)}</div></Card><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{filtered.map((resource) => <ResourceCard key={resource.title} resource={resource} />)}</div>{filtered.length === 0 && <Card className="p-10 text-center"><span className="material-symbols-outlined text-4xl text-[#94A3B8]">search_off</span><p className="text-body-md text-[#64748B] mt-2">Không tìm thấy tài liệu phù hợp.</p></Card>}</PageContainer></AppShell>;
}
