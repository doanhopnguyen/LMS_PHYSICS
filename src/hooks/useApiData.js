import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/apiClient.js';

export const listItems = (data) => Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];

export function useApiData(path) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setState({ data: null, loading: Boolean(path), error: '' });
    if (path) apiRequest(path).then(
      (data) => active && setState({ data, loading: false, error: '' }),
      (error) => active && setState({ data: null, loading: false, error: error.message }),
    );
    return () => { active = false; };
  }, [path, version]);
  return { ...state, reload: () => setVersion((value) => value + 1) };
}
