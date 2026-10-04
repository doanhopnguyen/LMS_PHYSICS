import { FormField as SharedFormField } from '../../components/FormField.jsx';
import { DetailToolbar } from '../../components/DetailToolbar.jsx';
import React, { useEffect, useRef, useState } from 'react';
import { Card } from '../../components/Card.jsx';
import { ImmersiveShell } from '../../components/ImmersiveShell.jsx';

const outline = [
  { id: 'document-intro', label: 'Định luật II Newton', detail: 'Kiến thức trọng tâm', icon: 'menu_book' },
  {
    id: 'document-formula',
    label: 'Công thức và đại lượng',
    detail: 'Mối liên hệ giữa lực và gia tốc',
    icon: 'functions',
  },
  { id: 'document-example', label: 'Ví dụ minh họa', detail: 'Vận dụng công thức', icon: 'lightbulb' },
  { id: 'document-steps', label: 'Các bước giải bài toán', detail: 'Phương pháp thực hiện', icon: 'checklist' },
];

export function DocumentViewerPage() {
  const [page, setPage] = useState(45);
  const [zoom, setZoom] = useState(100);
  const [activeSection, setActiveSection] = useState(outline[0].id);
  const [tocOpen, setTocOpen] = useState(false);
  const reader = useRef(null);
  const jumpTo = (id) => {
    const target = document.getElementById(id);
    if (target && reader.current)
      reader.current.scrollTo({
        top:
          target.getBoundingClientRect().top -
          reader.current.getBoundingClientRect().top +
          reader.current.scrollTop -
          24,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    setActiveSection(id);
    setTocOpen(false);
  };
  useEffect(() => {
    const container = reader.current;
    if (!container) return;
    const update = () => {
      let current = outline[0].id;
      for (const item of outline) {
        if (
          document.getElementById(item.id)?.getBoundingClientRect().top <=
          container.getBoundingClientRect().top + 100
        )
          current = item.id;
      }
      if (container.scrollTop > 0 && container.scrollTop + container.clientHeight >= container.scrollHeight - 4)
        current = outline.at(-1).id;
      setActiveSection(current);
    };
    container.addEventListener('scroll', update, { passive: true });
    return () => container.removeEventListener('scroll', update);
  }, []);
  return (
    <ImmersiveShell
      title="Trình đọc tài liệu · PTIT Physics 1"
      bodyClass="bg-[#E6EEFF] text-on-surface min-h-screen"
      topbar={
        <>
          <DetailToolbar
            title="Giáo trình Vật lý đại cương 1"
            subtitle={`Cơ học · Chương 2 · Trang ${page}/280`}
            backHref="my_courses.html"
            backLabel="Về học liệu"
            actions={
              <>
                <button
                  aria-label="Trang trước"
                  disabled={Number(page) <= 1}
                  onClick={() => setPage(Math.max(1, Number(page) - 1))}
                >
                  ‹
                </button>
                <SharedFormField
                  aria-label="Trang tài liệu"
                  type="number"
                  min="1"
                  max="280"
                  value={page}
                  onChange={(event) => setPage(Math.min(280, Math.max(1, Number(event.target.value) || 1)))}
                  className="w-14 text-center"
                  label={<>Trang </>}
                />
                <button
                  aria-label="Trang tiếp"
                  disabled={Number(page) >= 280}
                  onClick={() => setPage(Math.min(280, Number(page) + 1))}
                >
                  ›
                </button>
                <button aria-label="Thu nhỏ" disabled={zoom <= 70} onClick={() => setZoom(Math.max(70, zoom - 10))}>
                  −
                </button>
                <span>{zoom}%</span>
                <button aria-label="Phóng to" disabled={zoom >= 150} onClick={() => setZoom(Math.min(150, zoom + 10))}>
                  +
                </button>
              </>
            }
          />
        </>
      }
    >
      <div className="document-reader">
        <button
          type="button"
          className="document-outline-toggle"
          aria-expanded={tocOpen}
          aria-controls="document-outline"
          onClick={() => setTocOpen(!tocOpen)}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            format_list_bulleted
          </span>
          Mục lục
          <span className="material-symbols-outlined" aria-hidden="true">
            {tocOpen ? 'expand_less' : 'expand_more'}
          </span>
        </button>
        <Card
          as="aside"
          id="document-outline"
          className={`document-outline ${tocOpen ? 'is-open' : ''}`}
          aria-label="Mục lục tài liệu"
        >
          <nav aria-label="Các phần trong trang tài liệu">
            {outline.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => jumpTo(item.id)}
                aria-current={activeSection === item.id ? 'location' : undefined}
              >
                <span className="document-outline__number">{String(index + 1).padStart(2, '0')}</span>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                </span>
                <span className="material-symbols-outlined document-outline__arrow" aria-hidden="true">
                  chevron_right
                </span>
              </button>
            ))}
          </nav>
          <div className="document-outline__footer">
            <span className="material-symbols-outlined" aria-hidden="true">
              auto_stories
            </span>
            <span>
              Trang <strong>{page}</strong> / 280
            </span>
          </div>
        </Card>
        <main ref={reader} className="document-reader__content flex-1 overflow-y-auto p-4 md:p-8 flex justify-center">
          <article
            style={{ fontSize: `${zoom}%` }}
            className="w-full max-w-[840px] min-h-[1100px] bg-white border border-[#CBD5E1] shadow-xl p-8 md:p-14"
          >
            <div className="flex items-center justify-between text-label-sm text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0] pb-3">
              <span>Học viện Công nghệ Bưu chính Viễn thông</span>
              <span className="text-primary">Giáo trình Vật lý đại cương 1</span>
            </div>
            <div className="mt-8" id="document-intro">
              <div className="text-label-md text-primary font-bold tracking-widest">
                CHƯƠNG II — ĐỘNG LỰC HỌC CHẤT ĐIỂM
              </div>
              <h1 className="text-headline-lg font-bold mt-2">Mục 2.2. Định luật II Newton</h1>
            </div>
            <div className="space-y-5 mt-8 text-body-lg leading-relaxed">
              <p>Định luật II Newton mô tả mối liên hệ giữa gia tốc của vật, khối lượng và hợp lực tác dụng lên vật.</p>
              <Card
                as="div"
                id="document-formula"
                className="p-6 bg-[#F8FAFC] text-center font-mono text-2xl text-primary"
              >
                ΣF = m · a
              </Card>
              <p>
                Trong đó, ΣF là tổng hợp lực tác dụng, m là khối lượng và a là gia tốc của vật. Đây là phương trình cơ
                bản để giải các bài toán động lực học.
              </p>
              <Card id="document-example" className="p-5 bg-[#FEF2F2] border-[#FECACA]">
                <h2 className="text-headline-sm font-bold text-primary">Ví dụ minh họa</h2>
                <p className="text-body-md mt-2">
                  Một vật có khối lượng 2 kg chịu tác dụng của lực 10 N. Gia tốc của vật là a = 10 / 2 = 5 m/s².
                </p>
              </Card>
              <h2 id="document-steps" className="text-headline-md font-bold">
                Các bước giải bài toán
              </h2>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Chọn hệ quy chiếu và biểu diễn các lực.</li>
                <li>Viết phương trình định luật II Newton theo từng phương.</li>
                <li>Chiếu phương trình lên các trục tọa độ và giải.</li>
              </ol>
            </div>
            <div className="border-t border-[#E2E8F0] mt-12 pt-4 text-body-sm text-[#64748B] flex justify-between">
              <span>PTIT Physics 1 · Trang {page}</span>
              <span>Chương 2</span>
            </div>
          </article>
        </main>
      </div>
    </ImmersiveShell>
  );
}
