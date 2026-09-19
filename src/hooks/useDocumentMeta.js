import { useEffect } from 'react';

export function useDocumentMeta({ title, bodyClass = '' }) {
  useEffect(() => {
    const previousBodyClass = document.body.className;
    document.body.className = bodyClass;
    if (title) document.title = title;
    window.scrollTo(0, 0);

    return () => {
      document.body.className = previousBodyClass;
    };
  }, [title, bodyClass]);
}
