import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../styles/markdown.css';
import { FileImage } from './FileImage.jsx';
import { FileDownloadButton } from './FileDownloadButton.jsx';
import { api } from '../lib/apiClient.js';

const components = {
  img: ({ node, ...props }) => <FileImage {...props} />,
  a: ({ node, href, children, ...props }) => {
    let backendFile = false;
    try {
      backendFile = Boolean(href && api.files.isBackendUrl(href));
    } catch {
      /* ReactMarkdown filters invalid URLs. */
    }
    return backendFile ? (
      <FileDownloadButton file={href}>{children}</FileDownloadButton>
    ) : (
      <a {...props} href={href}>
        {children}
      </a>
    );
  },
};

export function MarkdownContent({ content = '', tocMode = 'inline' }) {
  const prefix = useId();
  const bodyRef = useRef(null);
  const tocRef = useRef(null);
  const toggleRef = useRef(null);
  const [tocOpen, setTocOpen] = useState(false);
  const [outline, setOutline] = useState({ content: null, headings: [] });
  const renderers = useMemo(
    () => ({
      ...components,
      ...Object.fromEntries(
        Array.from({ length: 6 }, (_, index) => {
          const tag = `h${index + 1}`;
          return [
            tag,
            ({ node, ...props }) =>
              React.createElement(tag, {
                ...props,
                id: `${prefix}-heading-${node.position.start.offset}`,
                tabIndex: -1,
              }),
          ];
        })
      ),
    }),
    [prefix]
  );
  useEffect(() => {
    const headings = [...bodyRef.current.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((heading) => ({
      id: heading.id,
      title: heading.textContent.trim(),
      level: Number(heading.tagName.slice(1)),
    }));
    setOutline({ content, headings });
  }, [content]);
  useEffect(() => {
    if (!tocOpen) return;
    const dismiss = (event) => {
      if (!tocRef.current?.contains(event.target)) setTocOpen(false);
    };
    const escape = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setTocOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener('pointerdown', dismiss);
    window.addEventListener('keydown', escape, true);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      window.removeEventListener('keydown', escape, true);
    };
  }, [tocOpen]);
  const headings = outline.content === content ? outline.headings : [];
  const firstLevel = Math.min(...headings.map((heading) => heading.level));
  return (
    <div
      className={`markdown-content${headings.length ? ' markdown-content--outlined' : ''}${tocMode === 'fixed' ? ' markdown-content--fixed-toc' : ''}`}
    >
      {headings.length > 0 && (
        <div className={`markdown-toc${tocMode === 'fixed' ? ' markdown-toc--fixed' : ''}`} ref={tocRef}>
          <div className="markdown-toc__floating">
            <button
              type="button"
              ref={toggleRef}
              className="markdown-toc__toggle"
              data-fixed-corners={tocMode === 'fixed' ? true : undefined}
              aria-label={tocOpen ? 'Đóng mục lục' : 'Mở mục lục'}
              title="Mục lục"
              aria-expanded={tocOpen}
              aria-controls={`${prefix}-toc`}
              onClick={() => setTocOpen((value) => !value)}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                toc
              </span>
              <span className="markdown-toc__toggle-label">Mục lục</span>
              <span className="material-symbols-outlined" aria-hidden="true">
                {tocOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {tocOpen && (
              <nav id={`${prefix}-toc`} className="markdown-toc__panel" aria-label="Mục lục Markdown">
                <p className="markdown-toc__title">Mục lục</p>
                <ol className="markdown-toc__list">
                  {headings.map((heading) => (
                    <li key={heading.id} style={{ paddingInlineStart: `${(heading.level - firstLevel) * 12}px` }}>
                      <a
                        href={`#${heading.id}`}
                        onClick={(event) => {
                          event.preventDefault();
                          setTocOpen(false);
                          const target = document.getElementById(heading.id);
                          target?.scrollIntoView({ block: 'start', behavior: 'smooth' });
                          target?.focus({ preventScroll: true });
                        }}
                      >
                        {heading.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
          </div>
        </div>
      )}
      <div className="markdown-content__body" ref={bodyRef}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={renderers} skipHtml>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
