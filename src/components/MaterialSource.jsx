import React, { useState } from 'react';
import { FormDialog } from './FormDialog.jsx';
import { materialSourceParts } from '../lib/materialSources.js';

export function MaterialSource({ value, title = 'Video nguồn học liệu' }) {
  const [viewing, setViewing] = useState(null);
  return (
    <>
      <p className="whitespace-pre-wrap break-words">
        {materialSourceParts(value).map((part, index) =>
          !part.url ? (
            <React.Fragment key={index}>{part.text}</React.Fragment>
          ) : part.video ? (
            <button
              type="button"
              key={index}
              onClick={() => setViewing(part.video)}
              className="break-all text-left font-medium text-primary underline"
            >
              {part.text}
            </button>
          ) : (
            <a
              key={index}
              href={part.url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all font-medium text-primary underline"
            >
              {part.text}
            </a>
          )
        )}
      </p>
      {viewing && (
        <FormDialog title={title} reader onClose={() => setViewing(null)}>
          {viewing.type === 'embed' ? (
            <iframe
              title={title}
              src={viewing.url}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="min-h-0 w-full flex-1 border-0"
            />
          ) : (
            <video
              aria-label={title}
              src={viewing.url}
              controls
              playsInline
              preload="metadata"
              className="min-h-0 w-full flex-1"
            />
          )}
        </FormDialog>
      )}
    </>
  );
}
