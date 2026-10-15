import React from 'react';
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

export function MarkdownContent({ content = '' }) {
  return (
    <div className="markdown-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} skipHtml>
        {content}
      </ReactMarkdown>
    </div>
  );
}
