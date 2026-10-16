import React, { useState } from 'react';
import { FormDialog } from './FormDialog.jsx';
import { materialSourceParts } from '../lib/materialSources.js';
import { FileDownloadButton } from './FileDownloadButton.jsx';
import { api } from '../lib/apiClient.js';
import { MaterialVideoPlayer } from './MaterialVideoPlayer.jsx';

export function MaterialSource({ value, title = 'Video nguồn học liệu' }) {
  const [viewing, setViewing] = useState(null);
  return (
    <>
      <p className="whitespace-pre-wrap break-words">
        {materialSourceParts(value).map((part, index) =>
          !part.url ? (
            <React.Fragment key={index}>{part.text}</React.Fragment>
          ) : api.files.isBackendUrl(part.url) ? (
            <FileDownloadButton key={index} file={part.url}>
              {part.text}
            </FileDownloadButton>
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
          <MaterialVideoPlayer material={{ title, type: 'VIDEO', fileUrl: viewing.url }} fill />
        </FormDialog>
      )}
    </>
  );
}
