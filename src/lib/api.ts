const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://spirited-friendship-production-fb20.up.railway.app/api';

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T = unknown>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token, headers = {} } = options;

  const config: RequestInit = {
    method,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (token) {
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'Network error' }));
    throw new ApiError(data.error || data.message || 'Request failed', response.status);
  }

  return response.json();
}

// Auth endpoints
// Backend returns: { user: {...}, tokens: { accessToken, refreshToken, expiresIn } }
export const authApi = {
  login: (email: string, password: string) =>
    api<{ user: User; tokens: { accessToken: string; refreshToken: string; expiresIn: number } }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  changePassword: (currentPassword: string, newPassword: string, token: string) =>
    api('/auth/change-password', {
      method: 'PUT',
      body: { currentPassword, newPassword },
      token,
    }),

  getProfile: (token: string) =>
    api<User>('/auth/me', { token }),

  updateProfile: (data: Partial<User>, token: string) =>
    api('/auth/profile', { method: 'PUT', body: data, token }),

  refreshToken: (refreshToken: string) =>
    api<{ user: User; tokens: { accessToken: string; refreshToken: string; expiresIn: number } }>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    }),
};

// GDPR endpoints
export const gdprApi = {
  acceptTerms: (version: string, token: string) =>
    api('/gdpr/accept-terms', { method: 'POST', body: { version }, token }),

  termsStatus: (token: string) =>
    api<{ acceptedAt: string | null; needsAcceptance: boolean }>('/gdpr/terms-status', { token }),

  exportData: (token: string) =>
    api('/gdpr/export', { token }),

  deleteAccount: (token: string) =>
    api('/gdpr/delete-account', { method: 'POST', token }),

  cancelDeletion: (token: string) =>
    api('/gdpr/cancel-deletion', { method: 'POST', token }),
};

// Courses endpoints — backend returns direct arrays
export const coursesApi = {
  list: (token: string) =>
    api<Course[]>('/courses', { token }),

  enrollments: (token: string) =>
    api<Enrollment[]>('/courses/enrollments/me', { token }),

  get: (id: string | number, token: string) =>
    api<Course>(`/courses/${id}`, { token }),

  modules: (courseId: string | number, token: string) =>
    api<Module[]>(`/courses/${courseId}/modules`, { token }),

  progress: (courseId: string | number, token: string) =>
    api(`/courses/${courseId}/progress`, { token }),

  updateProgress: (data: {
    moduleId: string | number;
    courseId: string | number;
    status: string;
    completionPercent: number;
    totalTimeSpentSec?: number;
    pdfFullyRead?: boolean;
    pdfLastPageReached?: number;
  }, token: string) =>
    api('/courses/progress', { method: 'PUT', body: data, token }),

  create: (data: { title: string; description: string; organizationId: string | number; subject?: string; level?: string; contentType?: string }, token: string) =>
    api<Course>('/courses', { method: 'POST', body: data, token }),

  update: (id: string | number, data: Partial<Course>, token: string) =>
    api<Course>(`/courses/${id}`, { method: 'PUT', body: data, token }),

  delete: (id: string | number, token: string) =>
    api(`/courses/${id}`, { method: 'DELETE', token }),

  createModule: (courseId: string | number, data: { title: string; description?: string; orderIndex?: number }, token: string) =>
    api<Module>(`/courses/${courseId}/modules`, { method: 'POST', body: data, token }),

  updateModule: (courseId: string | number, moduleId: string | number, data: Partial<Module>, token: string) =>
    api<Module>(`/courses/${courseId}/modules/${moduleId}`, { method: 'PUT', body: data, token }),

  deleteModule: (courseId: string | number, moduleId: string | number, token: string) =>
    api(`/courses/${courseId}/modules/${moduleId}`, { method: 'DELETE', token }),

  reorderModules: (courseId: string | number, moduleIds: (string | number)[], token: string) =>
    api(`/courses/${courseId}/modules/reorder`, { method: 'PUT', body: { moduleIds }, token }),
};

// Organizations endpoints — backend returns direct arrays
export const orgsApi = {
  list: (token: string, includeInactive = true) =>
    api<Organization[]>(`/organizations${includeInactive ? '?includeInactive=true' : ''}`, { token }),

  get: (id: number, token: string) =>
    api<Organization>(`/organizations/${id}`, { token }),

  members: (id: number, token: string) =>
    api<User[]>(`/organizations/${id}/members`, { token }),

  create: (data: { name: string; type: string; code: string; description?: string }, token: string) =>
    api<Organization>('/organizations', { method: 'POST', body: data, token }),

  update: (id: number, data: Partial<Organization & { isActive?: boolean; description?: string }>, token: string) =>
    api<Organization>(`/organizations/${id}`, { method: 'PUT', body: data, token }),

  delete: (id: number, token: string) =>
    api<{ message: string }>(`/organizations/${id}`, { method: 'DELETE', token }),
};

// Users endpoints (admin) — backend returns direct arrays
export const usersApi = {
  list: (token: string) =>
    api<User[]>('/users', { token }),

  get: (id: number, token: string) =>
    api<User>(`/users/${id}`, { token }),

  create: (data: Partial<User>, token: string) =>
    api('/users', { method: 'POST', body: data, token }),

  update: (id: number, data: Partial<User>, token: string) =>
    api(`/users/${id}`, { method: 'PUT', body: data, token }),

  delete: (id: number, token: string) =>
    api(`/users/${id}`, { method: 'DELETE', token }),
};

// Dashboard endpoints
export const dashboardApi = {
  stats: (token: string) =>
    api('/dashboard/stats', { token }),

  recentActivity: (token: string) =>
    api('/dashboard/recent-activity', { token }),
};

// Announcements endpoints — backend returns direct array
export const announcementsApi = {
  list: (orgId: number, token: string) =>
    api<Announcement[]>(`/organizations/${orgId}/announcements`, { token }),
};

// Analytics endpoints
export const analyticsApi = {
  adminOverview: (token: string, period: string = '7d') =>
    api<AdminAnalytics>(`/analytics/admin/overview?period=${period}`, { token }),

  orgOverview: (orgId: string, token: string) =>
    api<OrgAnalytics>(`/analytics/org/${orgId}/overview`, { token }),
};

// Exams endpoints
export const examsApi = {
  list: (token: string, params?: { courseId?: number; moduleId?: number }) => {
    const sp = new URLSearchParams();
    if (params?.courseId) sp.set('courseId', String(params.courseId));
    if (params?.moduleId) sp.set('moduleId', String(params.moduleId));
    const qs = sp.toString();
    return api<Exam[]>(`/exams${qs ? `?${qs}` : ''}`, { token });
  },

  get: (id: string | number, token: string) =>
    api<Exam>(`/exams/${id}`, { token }),

  getQuestions: (examId: string | number, token: string) =>
    api<Question[]>(`/exams/${examId}/questions`, { token }),

  addQuestion: (examId: string | number, data: {
    text: string;
    type?: string;
    options: { text: string; label: string }[];
    correctOptionId: string;
    explanation?: string;
  }, token: string) =>
    api<Question>(`/exams/${examId}/questions`, { method: 'POST', body: data, token }),

  updateQuestion: (examId: string | number, questionId: string | number, data: {
    text?: string;
    type?: string;
    options?: { text: string; label: string }[];
    correctOptionId?: string;
    explanation?: string;
  }, token: string) =>
    api<Question>(`/exams/${examId}/questions/${questionId}`, { method: 'PUT', body: data, token }),

  deleteQuestion: (examId: string | number, questionId: string | number, token: string) =>
    api(`/exams/${examId}/questions/${questionId}`, { method: 'DELETE', token }),

  update: (id: string | number, data: Partial<Exam>, token: string) =>
    api<Exam>(`/exams/${id}`, { method: 'PUT', body: data, token }),

  // Module-level question endpoints
  moduleQuestions: (moduleId: string | number, token: string) =>
    api<Question[]>(`/exams/module/${moduleId}/questions`, { token }),

  addModuleQuestion: (moduleId: string | number, data: {
    text: string;
    type?: string;
    options: { text: string; label: string }[];
    correctOptionId: string;
    explanation?: string;
  }, token: string) =>
    api<Question>(`/exams/module/${moduleId}/questions`, { method: 'POST', body: data, token }),

  // Attempt endpoints
  startAttempt: (examId: string | number, token: string) =>
    api<ExamAttempt>(`/exams/${examId}/attempt`, { method: 'POST', token }),

  submitAttempt: (attemptId: string, answers: { questionId: string; selectedOptionId: string; timeTakenSec?: number }[], token: string) =>
    api<ExamSubmitResult>(`/exams/attempts/${attemptId}/submit`, { method: 'PUT', body: { answers }, token }),

  myAttempts: (token: string) =>
    api<ExamAttempt[]>('/exams/attempts/me', { token }),
};

// Files endpoints
export const filesApi = {
  upload: async (file: File, courseId: string | number, moduleId: string | number | null, token: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('courseId', String(courseId));
    if (moduleId) formData.append('moduleId', String(moduleId));

    const response = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new ApiError(data.error || 'Upload failed', response.status);
    }
    return response.json() as Promise<FileMetadata>;
  },

  listByCourse: (courseId: string | number, token: string) =>
    api<FileMetadata[]>(`/files/course/${courseId}`, { token }),

  listByModule: (moduleId: string | number, token: string) =>
    api<FileMetadata[]>(`/files/module/${moduleId}`, { token }),

  rename: (fileId: string | number, newName: string, token: string) =>
    api(`/files/${fileId}/rename`, { method: 'PUT', body: { newName }, token }),

  delete: (fileId: string | number, token: string) =>
    api(`/files/${fileId}`, { method: 'DELETE', token }),

  downloadUrl: (fileId: number) => `${API_BASE}/files/${fileId}/download`,
};

// Two-Factor Authentication endpoints
export const twoFactorApi = {
  setup: (token: string) =>
    api<{ qrCodeUrl: string; secret: string }>('/2fa/setup', { method: 'POST', token }),

  confirm: (code: string, token: string) =>
    api('/2fa/confirm', { method: 'POST', body: { code }, token }),

  validate: (code: string, tempToken: string) =>
    api<{ user: User; tokens: { accessToken: string; refreshToken: string; expiresIn: number } }>('/2fa/validate', {
      method: 'POST',
      body: { code, tempToken },
    }),

  disable: (code: string, token: string) =>
    api('/2fa/disable', { method: 'POST', body: { code }, token }),

  status: (token: string) =>
    api<{ twoFactorEnabled: boolean }>('/2fa/status', { token }),
};

// Audit Logs endpoints (admin only)
export const auditLogsApi = {
  list: (token: string, params?: { page?: number; limit?: number; eventType?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.eventType) searchParams.set('eventType', params.eventType);
    const qs = searchParams.toString();
    return api<{ logs: AuditLog[]; total: number; page: number; limit: number }>(
      `/audit-logs${qs ? `?${qs}` : ''}`, { token }
    );
  },

  eventTypes: (token: string) =>
    api<string[]>('/audit-logs/event-types', { token }),
};

// Bug Reports endpoints
export const bugReportsApi = {
  submit: (data: { title: string; description: string; category?: string; severity?: string; deviceInfo?: string }, token: string) =>
    api<BugReport>('/bug-reports', { method: 'POST', body: data, token }),

  list: (token: string, params?: { page?: number; limit?: number; status?: string; category?: string }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set('page', String(params.page));
    if (params?.limit) sp.set('limit', String(params.limit));
    if (params?.status) sp.set('status', params.status);
    if (params?.category) sp.set('category', params.category);
    const qs = sp.toString();
    return api<{ reports: BugReport[]; total: number; page: number; limit: number }>(
      `/bug-reports${qs ? `?${qs}` : ''}`, { token }
    );
  },

  stats: (token: string) =>
    api<{ open: number; inProgress: number; resolved: number; total: number }>('/bug-reports/stats', { token }),

  update: (id: string, data: { status?: string; adminResponse?: string }, token: string) =>
    api<BugReport>(`/bug-reports/${id}`, { method: 'PUT', body: data, token }),

  delete: (id: string, token: string) =>
    api(`/bug-reports/${id}`, { method: 'DELETE', token }),
};

// Notifications
export const notificationsApi = {
  list: (token: string, params?: { page?: number; unreadOnly?: boolean }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set('page', String(params.page));
    if (params?.unreadOnly) sp.set('unreadOnly', 'true');
    const qs = sp.toString();
    return api<{ notifications: Notification[]; total: number; unreadCount: number }>(
      `/notifications${qs ? `?${qs}` : ''}`, { token }
    );
  },
  unreadCount: (token: string) =>
    api<{ unreadCount: number }>('/notifications/unread-count', { token }),
  markRead: (id: string, token: string) =>
    api(`/notifications/${id}/read`, { method: 'PUT', token }),
  markAllRead: (token: string) =>
    api('/notifications/read-all', { method: 'PUT', token }),
  delete: (id: string, token: string) =>
    api(`/notifications/${id}`, { method: 'DELETE', token }),
  deleteAll: (token: string) =>
    api('/notifications', { method: 'DELETE', token }),
};

// Logbook endpoints
export const logbooksApi = {
  list: (token: string, params?: { page?: number; limit?: number; startDate?: string; endDate?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.startDate) q.set('startDate', params.startDate);
    if (params?.endDate) q.set('endDate', params.endDate);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return api<{ data: LogbookEntry[]; total: number; page: number; limit: number }>(`/logbooks/entries${qs}`, { token });
  },
  get: (id: string, token: string) =>
    api<LogbookEntry>(`/logbooks/entries/${id}`, { token }),
  create: (entry: Partial<LogbookEntry>, token: string) =>
    api<LogbookEntry>('/logbooks/entries', { method: 'POST', body: entry, token }),
  update: (id: string, entry: Partial<LogbookEntry>, token: string) =>
    api<LogbookEntry>(`/logbooks/entries/${id}`, { method: 'PUT', body: entry, token }),
  delete: (id: string, token: string) =>
    api(`/logbooks/entries/${id}`, { method: 'DELETE', token }),

  // Aircraft memory
  listAircraft: (token: string) =>
    api<UserAircraft[]>('/logbooks/aircraft', { token }),
  saveAircraft: (aircraftId: string, aircraftType: string, token: string) =>
    api<UserAircraft>('/logbooks/aircraft', { method: 'POST', body: { aircraftId, aircraftType }, token }),

  // Stats
  stats: (token: string, startDate?: string, endDate?: string, userId?: string) => {
    const q = new URLSearchParams();
    if (startDate) q.set('startDate', startDate);
    if (endDate) q.set('endDate', endDate);
    if (userId) q.set('userId', userId);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return api<LogbookStats>(`/logbooks/stats${qs}`, { token });
  },
  statsRoutes: (token: string, startDate?: string, endDate?: string, userId?: string) => {
    const q = new URLSearchParams();
    if (startDate) q.set('startDate', startDate);
    if (endDate) q.set('endDate', endDate);
    if (userId) q.set('userId', userId);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return api<LogbookRoute[]>(`/logbooks/stats/routes${qs}`, { token });
  },

  // Admin
  adminUsers: (token: string) =>
    api<LogbookUser[]>('/logbooks/admin/users', { token }),
  adminUserEntries: (userId: string, token: string, params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return api<{ data: LogbookEntry[]; total: number; page: number; limit: number; user: { id: string; firstName: string; lastName: string; email: string; role: string } }>(`/logbooks/admin/user/${userId}/entries${qs}`, { token });
  },

  // Export
  exportPdf: async (token: string, period: string = 'all') => {
    const r = await fetch(`${API_BASE}/logbooks/export-pdf`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ period }),
    });
    if (!r.ok) throw new Error(`Export failed: ${r.status}`);
    return r.blob();
  },
};

// Student Tracking endpoints
export const studentTrackingApi = {
  // Load students from org members, filtered client-side for students
  orgMembers: (orgId: string, token: string) =>
    api<User[]>(`/organizations/${orgId}/members`, { token }),

  // Get full ATPL tracking summary for a student
  summary: (studentId: string, orgId: string, token: string) =>
    api(`/student-tracking/summary/${studentId}/${orgId}`, { token }),
};

// Types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin' | 'org_admin' | 'pilot';
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  profilePhotoUrl?: string;
  mustChangePassword: boolean;
  twoFactorEnabled?: boolean;
  acceptedTermsAt?: string;
  isActive: boolean;
  createdAt: string;
  organizations?: UserOrganization[];
}

export interface UserOrganization {
  id: number;
  name: string;
  role: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  organizationId: number;
  organizationName?: string;
  moduleCount?: number;
  enrolledCount?: number;
  progress?: number;
  subject?: string;
  level?: string;
  contentType?: string;
  thumbnailUrl?: string;
  isPublished?: boolean;
  program?: string;
  category?: string;
  estimatedDurationMin?: number;
  createdAt: string;
}

export interface Enrollment {
  id: number;
  userId: number;
  courseId: number;
  instructorId?: number;
  enrolledAt: string;
  overallProgress: number;
  course: {
    title: string;
    description: string;
    subject?: string;
    level?: string;
    contentType?: string;
    thumbnailUrl?: string;
    moduleCount?: number;
    estimatedDurationMin?: number;
    isPublished?: boolean;
  };
}

export interface Module {
  id: number | string;
  courseId: number | string;
  title: string;
  description: string;
  orderIndex: number;
  pdfUrl?: string;
  contentUrl?: string;
  contentType?: string;
  durationMin?: number;
  progress?: number;
  examId?: string | number | null;
  fileCount?: number;
  questionCount?: number;
}

export interface Exam {
  id: number | string;
  courseId: number | string;
  moduleId?: number | string;
  title: string;
  description?: string;
  subject?: string;
  level?: string;
  timeLimitMin: number;
  passMark: number;
  questionCount: number;
  isRandomized: boolean;
  isPublished: boolean;
}

export interface Question {
  id: number | string;
  examId: number | string;
  text: string;
  type: string;
  options: QuestionOption[];
  correctOptionId?: string;
  explanation?: string;
  imageUrl?: string;
  orderIndex: number;
}

export interface QuestionOption {
  id: number;
  questionId: number;
  text: string;
  label: string;
}

export interface ExamAttempt {
  id: string;
  userId: string;
  examId: string;
  startedAt: string;
  completedAt: string | null;
  score: number | null;
  correctCount: number | null;
  totalQuestions: number;
  durationSec: number | null;
  examTitle?: string;
}

export interface ExamCorrection {
  questionId: string;
  selectedOptionId: string;
  correctOptionId: string;
  isCorrect: boolean;
}

export interface ExamSubmitResult {
  attempt: ExamAttempt;
  corrections: ExamCorrection[];
}

export interface FileMetadata {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  courseId?: string;
  moduleId?: string;
  createdAt: string;
}

export interface Organization {
  id: number;
  name: string;
  type: string;
  code: string;
  description?: string;
  logoUrl?: string;
  isActive?: boolean;
  memberCount?: number;
  courseCount?: number;
  userCount?: number;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  organizationId: number;
  authorName: string;
  createdAt: string;
}

export interface AdminAnalytics {
  totalActiveStudents: number;
  totalStudyHoursThisWeek: number;
  activeStudentsLast7Days: number;
  activeStudentsLast30Days: number;
  topCoursesByTime: { courseId: string; courseTitle: string; totalTime: number }[];
  concurrentUsers: number;
  offlineDownloadsCount: number;
  totalAppTimeHours: number;
  courseTimeByOrg: { orgId: string; orgName: string; orgType: string; courseId: string; courseTitle: string; totalSeconds: number }[];
  genderDistribution: Record<string, number>;
  roleDistribution: Record<string, number>;
  passRateByPromotion: { promotion: string; avgScore: number; attemptCount: number; passedCount: number; passRate: number }[];
  passRateByGender: { gender: string; avgScore: number; attemptCount: number; passedCount: number; passRate: number }[];
}

export interface OrgAnalytics {
  orgName: string;
  orgType: string;
  totalUsers: number;
  activeUsers: number;
  concurrentUsers: number;
  offlineDownloadsCount: number;
  totalAppTimeHours: number;
  genderDistribution: Record<string, number>;
  roleDistribution: Record<string, number>;
  courseTimeByOrg: { courseId: string; courseTitle: string; totalSeconds: number }[];
  passRateByPromotion?: { promotion: string; avgScore: number; attemptCount: number; passedCount: number; passRate: number }[];
  passRateByGender?: { gender: string; avgScore: number; attemptCount: number; passedCount: number; passRate: number }[];
}

export interface TrackingStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  promotion?: string;
  assignedProgram?: string;
  gender?: string;
}

export interface BugReport {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  adminResponse: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  deviceInfo: string | null;
  appVersion: string | null;
  createdAt: string;
  updatedAt: string;
  userName: string | null;
  userEmail: string | null;
  userRole: string | null;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  referenceType: string | null;
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  eventType: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
}

// ─── Logbook Types ─────────────────────────────────────────

export interface LogbookEntry {
  id: string;
  userId: string;
  date: string;
  callsign: string;
  aircraftId: string;
  aircraftType: string;
  departure: string;
  destination: string;
  scheduledOut: string | null;
  scheduledIn: string | null;
  blockOff: string;
  takeOffTime: string;
  landingTime: string;
  blockIn: string;
  picName: string;
  picLicenceNumber: string | null;
  sicName: string;
  sicLicenceNumber: string | null;
  ifrTime: number;
  nightTime: number;
  picTime: number;
  sicTime: number;
  reliefTime: number;
  xcTime: number;
  multiPilotTime: number;
  dualReceived: number;
  dualGiven: number;
  simulatorTime: number;
  takeoffDay: number;
  takeoffNight: number;
  landingDay: number;
  landingNight: number;
  autoland: number;
  holdCount: number | null;
  approachCount: number | null;
  goAroundCount: number | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserAircraft {
  id: string;
  aircraftId: string;
  aircraftType: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LogbookStats {
  totalFlights: number;
  totalBlockMinutes: number;
  totalFlightMinutes: number;
  ifrMinutes: number;
  nightMinutes: number;
  picMinutes: number;
  sicMinutes: number;
  dualReceivedMinutes: number;
  dualGivenMinutes: number;
  xcMinutes: number;
  multiPilotMinutes: number;
  simulatorMinutes: number;
  airports: { icao: string; count: number }[];
  routes: { dep: string; dest: string; count: number }[];
}

export interface LogbookRoute {
  dep: string;
  dest: string;
  count: number;
  dates: string[];
}

export interface LogbookUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  organizationName?: string;
  entryCount: number;
}
