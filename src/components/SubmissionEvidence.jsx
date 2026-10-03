import React, { useEffect, useState } from 'react';
import { Card } from './Card.jsx';
import { Button } from './Button.jsx';
import { FormDialog } from './FormDialog.jsx';
import { JsonDataView } from './JsonDataView.jsx';
import { api } from '../lib/apiClient.js';
import { safeUrl } from '../lib/lecturerUtils.js';
import { previewType, readEvidenceFiles } from '../lib/evidencePreview.js';

function EvidenceFile({ file }) {
  const type = previewType(file.name, file.blob.type);
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  useEffect(() => {
    let active = true;
    const objectUrl = URL.createObjectURL(file.blob);
    setUrl(objectUrl);
    if (type === 'json' || type === 'text')
      file.blob.text().then((value) => {
        if (active) setText(value);
      });
    return () => {
      active = false;
      URL.revokeObjectURL(objectUrl);
    };
  }, [file, type]);
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="min-w-0 break-all font-medium">{file.name}</h3>
        {url && (
          <a href={url} download={file.name.split('/').pop()} className="text-body-sm font-medium text-primary">
            Tải tệp
          </a>
        )}
      </div>
      {type === 'json' && text && <JsonDataView value={text} />}
      {type === 'text' && (
        <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-4 text-body-sm">
          {text}
        </pre>
      )}
      {url && type === 'image' && (
        <img src={url} alt={`Minh chứng ${file.name}`} className="mx-auto max-h-[36rem] max-w-full object-contain" />
      )}
      {url && type === 'pdf' && (
        <iframe title={`Minh chứng ${file.name}`} src={url} className="h-[36rem] w-full rounded-lg border" />
      )}
      {url && type === 'video' && <video src={url} controls preload="metadata" className="max-h-[36rem] w-full" />}
      {url && type === 'audio' && <audio src={url} controls preload="metadata" className="w-full" />}
      {type === 'download' && (
        <p className="text-body-sm text-slate-500">
          Định dạng này chưa hỗ trợ xem trực tiếp. Bạn có thể tải tệp để xem.
        </p>
      )}
    </div>
  );
}

export function SubmissionEvidence({ submission }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [popup, setPopup] = useState('');
  const { fileId, evidenceUrl, fileName, rawDataJson } = submission;
  useEffect(() => {
    const controller = new AbortController();
    setFiles([]);
    setError('');
    setSourceUrl('');
    if (!popup || (!fileId && !evidenceUrl) || (popup === 'data' && rawDataJson != null)) {
      setLoading(false);
      return () => controller.abort();
    }
    setLoading(true);
    (async () => {
      try {
        const response = fileId ? await api.files.downloadUrl(fileId) : null;
        if (controller.signal.aborted) return;
        const url = safeUrl(response?.downloadUrl || response?.url || evidenceUrl);
        if (!url) throw new Error('Không có liên kết tệp hợp lệ.');
        setSourceUrl(url);
        const result = await fetch(url, { signal: controller.signal });
        if (!result.ok) throw new Error(`Không thể tải minh chứng (${result.status}).`);
        const name =
          fileName || response?.fileName || decodeURIComponent(new URL(url).pathname.split('/').pop()) || 'minh-chung';
        const entries = await readEvidenceFiles(await result.blob(), name);
        if (!controller.signal.aborted) setFiles(entries);
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message || 'Không thể xem minh chứng.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [fileId, evidenceUrl, fileName, attempt, popup, rawDataJson]);
  if (!fileId && !evidenceUrl && rawDataJson == null) return null;
  const visibleFiles = files.filter(
    (file) => (previewType(file.name, file.blob.type) === 'json') === (popup === 'data')
  );
  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-medium">Tệp minh chứng và số liệu JSON</h2>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" icon="table_chart" onClick={() => setPopup('data')}>
          Xem số liệu
        </Button>
        {(fileId || evidenceUrl) && (
          <Button variant="secondary" icon="attachment" onClick={() => setPopup('evidence')}>
            Xem minh chứng
          </Button>
        )}
      </div>
      {popup && (
        <FormDialog
          title={popup === 'data' ? 'Số liệu thí nghiệm' : 'Minh chứng thí nghiệm'}
          wide
          onClose={() => setPopup('')}
        >
          <div className="space-y-4">
            {loading && (
              <p role="status" className="text-body-sm text-slate-500">
                Đang tải nội dung…
              </p>
            )}
            {error && (
              <div className="space-y-2">
                <p role="alert" className="text-body-sm text-primary">
                  {error}
                </p>
                <Button variant="secondary" icon="refresh" onClick={() => setAttempt((value) => value + 1)}>
                  Thử lại
                </Button>
              </div>
            )}
            {popup === 'data' && rawDataJson != null && <JsonDataView value={rawDataJson} />}
            {visibleFiles.map((file, index) => (
              <EvidenceFile key={`${attempt}-${index}-${file.name}`} file={file} />
            ))}
            {!loading && !error && !visibleFiles.length && !(popup === 'data' && rawDataJson != null) && (
              <p className="rounded-xl bg-slate-50 p-4 text-body-sm text-slate-500">
                {popup === 'data' ? 'Bài nộp chưa có số liệu JSON.' : 'Bài nộp chưa có tệp minh chứng riêng.'}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
              {sourceUrl ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-body-sm font-medium text-primary"
                >
                  Mở tệp gốc
                </a>
              ) : (
                <span />
              )}
              <Button variant="secondary" onClick={() => setPopup('')}>
                Đóng
              </Button>
            </div>
          </div>
        </FormDialog>
      )}
    </Card>
  );
}
