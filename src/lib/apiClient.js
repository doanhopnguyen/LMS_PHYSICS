const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const ACCESS_TOKEN_KEY = 'ptit-physics-access-token';
const REFRESH_TOKEN_KEY = 'ptit-physics-refresh-token';

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const tokenStore = {
  getAccessToken: () => window.localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => window.localStorage.getItem(REFRESH_TOKEN_KEY),
  set(tokens) {
    if (tokens?.accessToken) window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    if (tokens?.refreshToken) window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  },
  clear() {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

function makeUrl(path, query) {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    (Array.isArray(value) ? value : [value]).forEach((item) => url.searchParams.append(key, item));
  });
  return url.toString();
}

let refreshing;
async function refreshAccessToken() {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) return null;
  if (!refreshing) {
    refreshing = fetch(makeUrl('/api/v1/users/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.data?.accessToken) throw new ApiError(payload?.message || 'Phiên đăng nhập đã hết hạn.', { status: response.status, data: payload });
        tokenStore.set(payload.data);
        return payload.data.accessToken;
      })
      .catch(() => {
        tokenStore.clear();
        return null;
      })
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

/** Calls the documented { status, message, data } API envelope and returns data. */
export async function apiRequest(path, options = {}) {
  const { method = 'GET', query, body, formData, auth = true, retry = true, headers = {} } = options;
  const requestHeaders = { ...headers };
  const accessToken = auth && tokenStore.getAccessToken();
  if (accessToken) requestHeaders.Authorization = `Bearer ${accessToken}`;
  if (body !== undefined && !formData) requestHeaders['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(makeUrl(path, query), {
      method,
      headers: requestHeaders,
      body: formData || (body === undefined ? undefined : JSON.stringify(body)),
    });
  } catch {
    throw new ApiError('Không thể kết nối tới máy chủ API. Kiểm tra VITE_API_BASE_URL hoặc backend tại cổng 8080.');
  }

  if (response.status === 401 && auth && retry && await refreshAccessToken()) {
    return apiRequest(path, { ...options, retry: false });
  }
  if (response.ok && options.responseType === 'blob') return response.blob();
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(payload?.message || `Yêu cầu thất bại (${response.status}).`, { status: response.status, data: payload });
  return payload?.data ?? payload;
}

export const api = {
  auth: {
    signin: (credentials) => apiRequest('/api/v1/users/signin', { method: 'POST', body: credentials, auth: false }),
    signup: (account) => apiRequest('/api/v1/users/signup', { method: 'POST', body: account, auth: false }),
    forgotPassword: (email) => apiRequest('/api/v1/users/forgot-password', { method: 'POST', body: { email }, auth: false }),
    resetPassword: (payload) => apiRequest('/api/v1/users/reset-password', { method: 'POST', body: payload, auth: false }),
    logout: () => apiRequest('/api/v1/users/logout', { method: 'POST', body: { refreshToken: tokenStore.getRefreshToken() } }),
  },
  users: {
    me: () => apiRequest('/api/v1/users/me'),
    updateMe: (body) => apiRequest('/api/v1/users/me', { method: 'PUT', body }),
    profile: () => apiRequest('/api/v1/users/me/profile'),
    updateProfile: (body) => apiRequest('/api/v1/users/me/profile', { method: 'PUT', body }),
    changePassword: (body) => apiRequest('/api/v1/users/me/password', { method: 'PUT', body }),
  },
  classes: {
    list: (query) => apiRequest('/api/v1/classes', { query }),
    get: (id) => apiRequest(`/api/v1/classes/${id}`),
    create: (body) => apiRequest('/api/v1/classes', { method: 'POST', body }),
    update: (id, body) => apiRequest(`/api/v1/classes/${id}`, { method: 'PUT', body }),
    students: (id, query) => apiRequest(`/api/v1/classes/${id}/students`, { query }),
    progress: (id, query) => apiRequest(`/api/v1/classes/${id}/progress`, { query }),
  },
  subjects: {
    list: (query) => apiRequest('/api/v1/subjects', { query }),
    get: (id) => apiRequest(`/api/v1/subjects/${id}`),
    topics: (id, query) => apiRequest(`/api/v1/subjects/${id}/topics`, { query }),
  },
  questions: {
    list: (query) => apiRequest('/api/v1/questions', { query }),
    get: (id) => apiRequest(`/api/v1/questions/${id}`),
    create: (body) => apiRequest('/api/v1/questions', { method: 'POST', body }),
    update: (id, body) => apiRequest(`/api/v1/questions/${id}`, { method: 'PUT', body }),
    remove: (id) => apiRequest(`/api/v1/questions/${id}`, { method: 'DELETE' }),
  },
  exams: {
    listForClass: (classId, query) => apiRequest(`/api/v1/exams/class/${classId}`, { query }),
    get: (id) => apiRequest(`/api/v1/exams/${id}`),
    create: (body) => apiRequest('/api/v1/exams', { method: 'POST', body }),
    startAttempt: (id) => apiRequest(`/api/v1/exams/${id}/attempts`, { method: 'POST' }),
    saveAnswer: (attemptId, body) => apiRequest(`/api/v1/exams/attempts/${attemptId}/answers`, { method: 'POST', body }),
    submit: (attemptId) => apiRequest(`/api/v1/exams/attempts/${attemptId}/submit`, { method: 'PUT' }),
  },
  aiTutor: {
    conversations: () => apiRequest('/api/v1/ai-tutor/conversations/my'),
    start: (body) => apiRequest('/api/v1/ai-tutor/conversations', { method: 'POST', body }),
    messages: (id) => apiRequest(`/api/v1/ai-tutor/conversations/${id}/messages`),
    send: (id, body) => apiRequest(`/api/v1/ai-tutor/conversations/${id}/messages`, { method: 'POST', body }),
    end: (id) => apiRequest(`/api/v1/ai-tutor/conversations/${id}/end`, { method: 'PUT' }),
  },
  files: {
    upload: (formData, query) => apiRequest('/api/v1/files/upload', { method: 'POST', formData, query }),
  },
};
