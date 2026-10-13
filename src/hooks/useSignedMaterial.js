import { useEffect, useState } from 'react';
import { resolveMaterialDownload } from '../lib/materialDownloads.js';

export function useSignedMaterial(material) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ loading: Boolean(material.fileId), url: '', error: '' });
  useEffect(() => {
    if (!material.fileId) return;
    let active = true;
    setState({ loading: true, url: '', error: '' });
    resolveMaterialDownload(material).then(
      (url) => active && setState({ loading: false, url, error: '' }),
      (error) => active && setState({ loading: false, url: '', error: error.message })
    );
    return () => {
      active = false;
    };
  }, [material.fileId, attempt]);
  return {
    material: material.fileId ? { ...material, fileUrl: state.url, downloadUrl: state.url } : material,
    loading: material.fileId && state.loading,
    error: material.fileId && state.error,
    refresh: () => setAttempt((value) => value + 1),
  };
}
