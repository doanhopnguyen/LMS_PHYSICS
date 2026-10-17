import { useEffect, useState } from 'react';
import { api, tokenStore } from '../lib/apiClient.js';
import { getDemoSession, setAuthenticatedSession } from '../lib/demoSession.js';

let currentRefresh;
let refreshedToken;
let refreshedAt = 0;

function refreshCurrentUser(id, token) {
  if (refreshedToken === token && Date.now() - refreshedAt < 60000) return;
  if (currentRefresh?.token === token) return;
  const request = { token };
  currentRefresh = request;
  Promise.all([api.users.me(), api.users.profile().catch(() => null)])
    .then(([user, profile]) => {
      if (getDemoSession()?.userId !== id || tokenStore.getAccessToken() !== token) return;
      const previous = getDemoSession();
      // Retry a failed profile read on the next mount instead of caching it.
      if (profile) {
        refreshedToken = token;
        refreshedAt = Date.now();
      }
      setAuthenticatedSession(user, profile || { fullName: previous?.name });
    })
    .catch(() => {
      /* Keep the authenticated session if the server is unavailable. */
    })
    .finally(() => {
      if (currentRefresh === request) currentRefresh = undefined;
    });
}

if (typeof window !== 'undefined') {
  window.addEventListener('ptit-session-changed', () => {
    if (!tokenStore.getAccessToken() || !getDemoSession()?.userId) {
      refreshedToken = undefined;
      refreshedAt = 0;
    }
  });
}

export function useCurrentUser() {
  const [session, setSession] = useState(getDemoSession);
  useEffect(() => {
    const update = () => setSession(getDemoSession());
    window.addEventListener('ptit-session-changed', update);
    window.addEventListener('storage', update);
    const id = getDemoSession()?.userId;
    const token = tokenStore.getAccessToken();
    if (token && id) refreshCurrentUser(id, token);
    return () => {
      window.removeEventListener('ptit-session-changed', update);
      window.removeEventListener('storage', update);
    };
  }, []);
  // Role-only demo sessions must not be presented as a real signed-in person.
  return session?.userId ? session : null;
}
