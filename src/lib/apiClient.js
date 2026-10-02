const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const ACCESS_TOKEN_KEY = 'ptit-physics-access-token';
const REFRESH_TOKEN_KEY = 'ptit-physics-refresh-token';
const API_ERROR_EVENT = 'ptit-api-error';

function reportApiError(error) {
  window.dispatchEvent(new CustomEvent(API_ERROR_EVENT, { detail: {
    message: error.message,
    status: error.status,
    method: error.method,
    path: error.path,
    statusText: error.statusText,
    details: error.details,
  } }));
  return error;
}

export class ApiError extends Error {
  constructor(message, { status, data, method, path, statusText, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.method = method;
    this.path = path;
    this.statusText = statusText;
    this.details = details;
  }
}

function errorDetails(payload) {
  const value = payload?.errors || payload?.error || payload?.details || payload?.data?.errors;
  if (!value) return '';
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
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
  } catch (networkError) {
    throw reportApiError(new ApiError('Không thể kết nối tới máy chủ API. Kiểm tra VITE_API_BASE_URL hoặc backend tại cổng 8080.'));
  }

  if (response.status === 401 && auth && retry && await refreshAccessToken()) {
    return apiRequest(path, { ...options, retry: false });
  }
  if (response.ok && options.responseType === 'blob') return response.blob();
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const detailedError = new ApiError(payload?.message || `Request failed (${response.status}).`, {
      status: response.status,
      data: payload,
      method,
      path,
      statusText: response.statusText,
      details: errorDetails(payload),
    });
    throw reportApiError(detailedError);
    throw reportApiError(new ApiError(payload?.message || `Yêu cầu thất bại (${response.status}).`, { status: response.status, data: payload }));
  }
  return payload?.data ?? payload;
}

export const api = {
  // ─── Auth ────────────────────────────────────────────────────────────────────
  auth: {
    signin: (credentials) => apiRequest('/api/v1/users/signin', { method: 'POST', body: credentials, auth: false }),
    signup: (account) => apiRequest('/api/v1/users/signup', { method: 'POST', body: account, auth: false }),
    forgotPassword: (email) => apiRequest('/api/v1/users/forgot-password', { method: 'POST', body: { email }, auth: false }),
    resetPassword: (payload) => apiRequest('/api/v1/users/reset-password', { method: 'POST', body: payload, auth: false }),
    refresh: (refreshToken) => apiRequest('/api/v1/users/refresh', { method: 'POST', body: { refreshToken }, auth: false }),
    logout: () => apiRequest('/api/v1/users/logout', { method: 'POST', body: { refreshToken: tokenStore.getRefreshToken() } }),
  },

  // ─── Users ───────────────────────────────────────────────────────────────────
  users: {
    me: () => apiRequest('/api/v1/users/me'),
    updateMe: (body) => apiRequest('/api/v1/users/me', { method: 'PUT', body }),
    profile: () => apiRequest('/api/v1/users/me/profile'),
    updateProfile: (body) => apiRequest('/api/v1/users/me/profile', { method: 'PUT', body }),
    changePassword: (body) => apiRequest('/api/v1/users/me/password', { method: 'PUT', body }),
    // Admin only
    adminList: (query) => apiRequest('/api/v1/users/admin/users', { query }),
    adminCreate: (body) => apiRequest('/api/v1/users/admin/create-user', { method: 'POST', body }),
    adminUpdate: (id, body) => apiRequest(`/api/v1/users/admin/users/${id}`, { method: 'PUT', body }),
    adminGetProfile: (id) => apiRequest(`/api/v1/users/admin/users/${id}/profile`),
    adminUpdateStatus: (id, body) => apiRequest(`/api/v1/users/admin/users/${id}/status`, { method: 'PUT', body }),
    getByUsername: (username) => apiRequest(`/api/v1/users/${username}`),
    deleteByUsername: (username) => apiRequest(`/api/v1/users/${username}`, { method: 'DELETE' }),
    downloadStudentTemplate: () => apiRequest('/api/v1/users/import-excel/template', { responseType: 'blob' }),
    importStudentsExcel: (formData, query) => apiRequest('/api/v1/users/import-excel', { method: 'POST', formData, query }),
  },

  // ─── Semesters ───────────────────────────────────────────────────────────────
  semesters: {
    list: () => apiRequest('/api/v1/semesters'),
    get: (id) => apiRequest(`/api/v1/semesters/${id}`),
    create: (body) => apiRequest('/api/v1/semesters', { method: 'POST', body }),
    update: (id, body) => apiRequest(`/api/v1/semesters/${id}`, { method: 'PUT', body }),
    setCurrent: (id) => apiRequest(`/api/v1/semesters/${id}/set-current`, { method: 'PUT' }),
  },

  // ─── Subjects & Topics ───────────────────────────────────────────────────────
  subjects: {
    list: (query) => apiRequest('/api/v1/subjects', { query }),
    get: (id) => apiRequest(`/api/v1/subjects/${id}`),
    create: (body) => apiRequest('/api/v1/subjects', { method: 'POST', body }),
    update: (id, body) => apiRequest(`/api/v1/subjects/${id}`, { method: 'PUT', body }),
    toggleStatus: (id) => apiRequest(`/api/v1/subjects/${id}/toggle-status`, { method: 'PUT' }),
    topics: (subjectId) => apiRequest(`/api/v1/subjects/${subjectId}/topics`),
    getTopic: (subjectId, topicId) => apiRequest(`/api/v1/subjects/${subjectId}/topics/${topicId}`),
    createTopic: (subjectId, body) => apiRequest(`/api/v1/subjects/${subjectId}/topics`, { method: 'POST', body }),
    updateTopic: (subjectId, topicId, body) => apiRequest(`/api/v1/subjects/${subjectId}/topics/${topicId}`, { method: 'PUT', body }),
    deleteTopic: (subjectId, topicId) => apiRequest(`/api/v1/subjects/${subjectId}/topics/${topicId}`, { method: 'DELETE' }),
  },

  // ─── Learning Materials ──────────────────────────────────────────────────────
  materials: {
    list: (topicId) => apiRequest(`/api/v1/topics/${topicId}/materials`),
    get: (topicId, materialId) => apiRequest(`/api/v1/topics/${topicId}/materials/${materialId}`),
    create: (topicId, formData) => apiRequest(`/api/v1/topics/${topicId}/materials`, { method: 'POST', formData }),
    update: (topicId, materialId, formData) => apiRequest(`/api/v1/topics/${topicId}/materials/${materialId}`, { method: 'PUT', formData }),
    remove: (topicId, materialId) => apiRequest(`/api/v1/topics/${topicId}/materials/${materialId}`, { method: 'DELETE' }),
    approve: (topicId, materialId) => apiRequest(`/api/v1/topics/${topicId}/materials/${materialId}/approve`, { method: 'PUT' }),
  },

  // ─── Classes ─────────────────────────────────────────────────────────────────
  classes: {
    list: (query) => apiRequest('/api/v1/classes', { query }),
    get: (id) => apiRequest(`/api/v1/classes/${id}`),
    create: (body) => apiRequest('/api/v1/classes', { method: 'POST', body }),
    update: (id, body) => apiRequest(`/api/v1/classes/${id}`, { method: 'PUT', body }),
    updateStatus: (id, body) => apiRequest(`/api/v1/classes/${id}/status`, { method: 'PUT', body }),
    // Students enrollment
    students: (id, query) => apiRequest(`/api/v1/classes/${id}/students`, { query }),
    enrollSingle: (id, body) => apiRequest(`/api/v1/classes/${id}/enroll-single`, { method: 'POST', body }),
    enrollBulk: (id, body) => apiRequest(`/api/v1/classes/${id}/enroll-bulk`, { method: 'POST', body }),
    removeStudent: (id, studentId) => apiRequest(`/api/v1/classes/${id}/students/${studentId}`, { method: 'DELETE' }),
    updateStudentStatus: (id, studentId, body) => apiRequest(`/api/v1/classes/${id}/students/${studentId}/status`, { method: 'PUT', body }),
    // Staff
    staff: (id) => apiRequest(`/api/v1/classes/${id}/staff`),
    assignStaff: (id, body) => apiRequest(`/api/v1/classes/${id}/staff`, { method: 'POST', body }),
    removeStaff: (id, userId) => apiRequest(`/api/v1/classes/${id}/staff/${userId}`, { method: 'DELETE' }),
    // Learning data
    progress: (id) => apiRequest(`/api/v1/classes/${id}/progress`),
    evidence: (id) => apiRequest(`/api/v1/classes/${id}/evidence`),
    activityLogs: (id) => apiRequest(`/api/v1/classes/${id}/activity-logs`),
    schedules: (id) => apiRequest(`/api/v1/classes/${id}/schedules`),
    createSchedule: (classId, body) => apiRequest(`/api/v1/classes/${classId}/schedules`, { method: 'POST', body }),
    updateSchedule: (scheduleId, body) => apiRequest(`/api/v1/classes/schedules/${scheduleId}`, { method: 'PUT', body }),
    removeSchedule: (scheduleId) => apiRequest(`/api/v1/classes/schedules/${scheduleId}`, { method: 'DELETE' }),
  },

  // ─── Students ────────────────────────────────────────────────────────────────
  students: {
    search: (keyword) => apiRequest('/api/v1/students/search', { query: { keyword } }),
    myClasses: (query) => apiRequest('/api/v1/students/me/classes', { query }),
    mySchedule: () => apiRequest('/api/v1/students/me/schedule'),
    myAgenda: () => apiRequest('/api/v1/students/me/agenda'),
    myUpcomingTasks: () => apiRequest('/api/v1/students/me/upcoming-tasks'),
    myMaterials: (query) => apiRequest('/api/v1/students/me/materials', { query }),
    myExperimentAssignments: () => apiRequest('/api/v1/students/me/experiment-assignments'),
    myProgress: (classId) => apiRequest('/api/v1/students/me/progress', { query: { classId } }),
    updateProgress: (body) => apiRequest('/api/v1/students/me/progress', { method: 'PUT', body }),
    myEvidence: () => apiRequest('/api/v1/students/me/evidence'),
    myActivityLogs: () => apiRequest('/api/v1/students/me/activity-logs'),
    getEvidence: (id) => apiRequest(`/api/v1/students/${id}/evidence`),
  },

  // ─── Questions Bank ──────────────────────────────────────────────────────────
  questions: {
    list: (query) => apiRequest('/api/v1/questions', { query }),
    get: (id) => apiRequest(`/api/v1/questions/${id}`),
    create: (body) => apiRequest('/api/v1/questions', { method: 'POST', body }),
    update: (id, body) => apiRequest(`/api/v1/questions/${id}`, { method: 'PUT', body }),
    remove: (id) => apiRequest(`/api/v1/questions/${id}`, { method: 'DELETE' }),
    approve: (id) => apiRequest(`/api/v1/questions/${id}/approve`, { method: 'PUT' }),
    downloadTemplate: () => apiRequest('/api/v1/questions/import-excel/template', { responseType: 'blob' }),
    importExcel: (formData, query) => apiRequest('/api/v1/questions/import-excel', { method: 'POST', formData, query }),
  },

  notifications: {
    list: (query) => apiRequest('/api/v1/notifications', { query }),
    summary: () => apiRequest('/api/v1/notifications/summary'),
    markRead: (id) => apiRequest(`/api/v1/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () => apiRequest('/api/v1/notifications/read-all', { method: 'PUT' }),
    remove: (id) => apiRequest(`/api/v1/notifications/${id}`, { method: 'DELETE' }),
    generateReminders: () => apiRequest('/api/v1/notifications/reminders/generate', { method: 'POST' }),
    sendToClass: (classId, body) => apiRequest(`/api/v1/notifications/classes/${classId}`, { method: 'POST', body }),
  },

  files: {
    upload: (formData) => apiRequest('/api/v1/files/upload', { method: 'POST', formData }),
  },

  examMatrices: {
    list: (query) => apiRequest('/api/v1/exam-matrices', { query }),
    get: (id) => apiRequest(`/api/v1/exam-matrices/${id}`),
    create: (body) => apiRequest('/api/v1/exam-matrices', { method: 'POST', body }),
    update: (id, body) => apiRequest(`/api/v1/exam-matrices/${id}`, { method: 'PUT', body }),
    remove: (id) => apiRequest(`/api/v1/exam-matrices/${id}`, { method: 'DELETE' }),
    validate: (id) => apiRequest(`/api/v1/exam-matrices/${id}/validate`, { method: 'POST' }),
  },

  // ─── Exams ───────────────────────────────────────────────────────────────────
  exams: {
    listForClass: (classId) => apiRequest(`/api/v1/exams/class/${classId}`),
    get: (id) => apiRequest(`/api/v1/exams/${id}`),
    create: (body) => apiRequest('/api/v1/exams', { method: 'POST', body }),
    update: (id, body) => apiRequest(`/api/v1/exams/${id}`, { method: 'PUT', body }),
    remove: (id) => apiRequest(`/api/v1/exams/${id}`, { method: 'DELETE' }),
    questions: (id) => apiRequest(`/api/v1/exams/${id}/questions`),
    addQuestion: (examId, body) => apiRequest(`/api/v1/exams/${examId}/questions`, { method: 'POST', body }),
    removeQuestion: (examId, questionId) => apiRequest(`/api/v1/exams/${examId}/questions/${questionId}`, { method: 'DELETE' }),
    generateQuestions: (examId) => apiRequest(`/api/v1/exams/${examId}/generate-questions`, { method: 'POST' }),
    attempts: (id) => apiRequest(`/api/v1/exams/${id}/attempts`),
    attemptQuestions: (attemptId) => apiRequest(`/api/v1/exams/attempts/${attemptId}/questions`),
    attemptProgress: (attemptId) => apiRequest(`/api/v1/exams/attempts/${attemptId}/progress`),
    attemptPolicy: (examId) => apiRequest(`/api/v1/exams/${examId}/attempt-policy`),
    gradeAttempt: (attemptId, body) => apiRequest(`/api/v1/exams/attempts/${attemptId}/grade`, { method: 'PUT', body }),
    roster: (id) => apiRequest(`/api/v1/exams/${id}/roster`),
    transferStudent: (examId, body) => apiRequest(`/api/v1/exams/${examId}/transfers`, { method: 'POST', body }),
    removeTransferredStudent: (examId, studentId) => apiRequest(`/api/v1/exams/${examId}/transfers/${studentId}`, { method: 'DELETE' }),
    // Attempts
    startAttempt: (examId) => apiRequest(`/api/v1/exams/${examId}/attempts`, { method: 'POST' }),
    myAttempt: (examId) => apiRequest(`/api/v1/exams/${examId}/my-attempt`),
    myAttempts: (examId) => apiRequest(`/api/v1/exams/${examId}/my-attempts`),
    myTransferredExams: () => apiRequest('/api/v1/exams/my-transferred-exams'),
    getAttempt: (attemptId) => apiRequest(`/api/v1/exams/attempts/${attemptId}`),
    saveAnswer: (attemptId, body) => apiRequest(`/api/v1/exams/attempts/${attemptId}/answers`, { method: 'POST', body }),
    autosave: (attemptId, body) => apiRequest(`/api/v1/exams/attempts/${attemptId}/autosave`, { method: 'POST', body }),
    submit: (attemptId) => apiRequest(`/api/v1/exams/attempts/${attemptId}/submit`, { method: 'PUT' }),
  },

  // ─── Experiments (Virtual Lab) ───────────────────────────────────────────────
  experiments: {
    submissions: (query) => apiRequest('/api/v1/experiments/submissions', { query }),
    classSubmissions: (classId, query) => apiRequest(`/api/v1/classes/${classId}/experiment-submissions`, { query }),
    getSubmission: (submissionId) => apiRequest(`/api/v1/experiments/submissions/${submissionId}`),
    submissionRubrics: (submissionId) => apiRequest(`/api/v1/experiments/submissions/${submissionId}/rubrics`),
    rubricSummary: (submissionId) => apiRequest(`/api/v1/experiments/submissions/${submissionId}/rubric-summary`),
    list: (subjectId) => apiRequest('/api/v1/experiments', { query: { subjectId } }),
    get: (experimentId) => apiRequest(`/api/v1/experiments/${experimentId}`),
    create: (body) => apiRequest('/api/v1/experiments', { method: 'POST', body }),
    assign: (experimentId, body) => apiRequest(`/api/v1/experiments/${experimentId}/assign`, { method: 'POST', body }),
    submitAssignment: (assignmentId, formData) => apiRequest(`/api/v1/experiments/assignments/${assignmentId}/submit`, { method: 'POST', formData }),
    gradeSubmission: (submissionId, body) => apiRequest(`/api/v1/experiments/submissions/${submissionId}/scores`, { method: 'POST', body }),
    confirmSubmission: (submissionId, body) => apiRequest(`/api/v1/experiments/submissions/${submissionId}/confirmation`, { method: 'POST', body }),
  },

  // ─── AI Tutor ────────────────────────────────────────────────────────────────
  aiTutor: {
    myConversations: () => apiRequest('/api/v1/ai-tutor/conversations/my'),
    /** @deprecated Use myConversations() */
    conversations: () => apiRequest('/api/v1/ai-tutor/conversations/my'),
    start: (body) => apiRequest('/api/v1/ai-tutor/conversations', { method: 'POST', body }),
    end: (conversationId) => apiRequest(`/api/v1/ai-tutor/conversations/${conversationId}/end`, { method: 'PUT' }),
    messages: (conversationId) => apiRequest(`/api/v1/ai-tutor/conversations/${conversationId}/messages`),
    send: (conversationId, body) => apiRequest(`/api/v1/ai-tutor/conversations/${conversationId}/messages`, { method: 'POST', body }),
    sendFeedback: (messageId, body) => apiRequest(`/api/v1/ai-tutor/messages/${messageId}/feedback`, { method: 'POST', body }),
  },

  // ─── Dashboard ───────────────────────────────────────────────────────────────
  dashboard: {
    me: () => apiRequest('/api/v1/dashboard/me'),
    forClass: (id) => apiRequest(`/api/v1/dashboard/class/${id}`),
    forStudent: (classId, studentId) => apiRequest(`/api/v1/dashboard/class/${classId}/student/${studentId}`),
    regenerate: (id) => apiRequest(`/api/v1/dashboard/class/${id}/regenerate`, { method: 'POST' }),
  },

  // ─── Analytics ───────────────────────────────────────────────────────────────
  analytics: {
    topicDifficulty: (query) => apiRequest('/api/v1/analytics/topic-difficulty', { query }),
    questionQuality: (query) => apiRequest('/api/v1/analytics/question-quality', { query }),
    materialEffectiveness: (query) => apiRequest('/api/v1/analytics/material-effectiveness', { query }),
    aiGaps: (query) => apiRequest('/api/v1/analytics/ai-gaps', { query }),
    triggerAggregation: (body) => apiRequest('/api/v1/analytics/trigger', { method: 'POST', body }),
  },

  // ─── Admin ───────────────────────────────────────────────────────────────────
  admin: {
    activityLogs: (query) => apiRequest('/api/v1/admin/activity-logs', { query }),
    auditLogs: (query) => apiRequest('/api/v1/admin/audit-logs', { query }),
    settings: () => apiRequest('/api/v1/admin/settings'),
    getSetting: (key) => apiRequest(`/api/v1/admin/settings/${key}`),
    updateSetting: (key, body) => apiRequest(`/api/v1/admin/settings/${key}`, { method: 'PUT', body }),
    bulkUpdateSettings: (body) => apiRequest('/api/v1/admin/settings/bulk', { method: 'POST', body }),
  },

  // ─── Files ───────────────────────────────────────────────────────────────────
  files: {
    upload: (formData, query) => apiRequest('/api/v1/files/upload', { method: 'POST', formData, query }),
    downloadUrl: (fileId) => apiRequest(`/api/v1/files/${fileId}/download-url`, { method: 'POST' }),
    /** Get a public read-only URL for a stored file (no auth needed). */
    url: (filePath) => makeUrl(`/api/v1/files/${filePath}`, {}),
  },
};
