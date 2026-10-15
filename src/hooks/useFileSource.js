import { useEffect, useState } from 'react';
import { api } from '../lib/apiClient.js';

// Native images/video cannot send JWT headers. Prefer BE's signed URL when an
// ID exists, otherwise fetch protected storage paths and expose an object URL.
export function useFileSource({ fileId, fileUrl }, { enabled = true, attempt = 0 } = {}) {
  const key = JSON.stringify([fileId, fileUrl, enabled, attempt]);
  const [version, refresh] = useState(0);
  const [state, setState] = useState({ key: '', loading: true, url: '', error: '' });
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl;
    setState({ key, loading: Boolean(enabled && (fileId || fileUrl)), url: '', error: '' });
    if (enabled && (fileId || fileUrl)) {
      (async () => {
        let url;
        if (fileId) url = (await api.files.location({ fileId }, { signal: controller.signal })).url;
        else if (api.files.isBackendUrl(api.files.resolveUrl(fileUrl))) {
          const result = await api.files.read({ fileUrl }, { signal: controller.signal });
          if (controller.signal.aborted) return;
          objectUrl = URL.createObjectURL(result.blob);
          url = objectUrl;
        } else url = api.files.resolveUrl(fileUrl);
        if (!controller.signal.aborted) setState({ key, loading: false, url, error: '' });
      })().catch((error) => {
        if (!controller.signal.aborted) setState({ key, loading: false, url: '', error: error.message });
      });
    }
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [key, version]);
  return {
    ...(state.key === key ? state : { loading: Boolean(enabled), url: '', error: '' }),
    retry: () => refresh((value) => value + 1),
  };
}
