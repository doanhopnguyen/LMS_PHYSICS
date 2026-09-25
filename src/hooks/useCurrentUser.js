import { useEffect, useState } from 'react';
import { api, tokenStore } from '../lib/apiClient.js';
import { getDemoSession, setAuthenticatedSession } from '../lib/demoSession.js';

export function useCurrentUser() {
  const [session, setSession] = useState(getDemoSession);
  useEffect(() => {
    let active = true;
    const update = () => setSession(getDemoSession());
    window.addEventListener('ptit-session-changed', update);
    window.addEventListener('storage', update);
    const id = getDemoSession()?.userId;
    if (tokenStore.getAccessToken() && id) {
      Promise.all([api.users.me(), api.users.profile().catch(() => null)]).then(([user, profile]) => {
        if (active && getDemoSession()?.userId === id) {
          const previous = getDemoSession();
          setAuthenticatedSession(user, profile || { fullName: previous?.name });
        }
      }).catch(() => { /* Keep the authenticated session if the server is unavailable. */ });
    }
    return () => {
      active = false;
      window.removeEventListener('ptit-session-changed', update);
      window.removeEventListener('storage', update);
    };
  }, []);
  // Role-only demo sessions must not be presented as a real signed-in person.
  return session?.userId ? session : null;
}
