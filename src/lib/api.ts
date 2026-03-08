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

  get: (id: number, token: string) =>
    api<Course>(`/courses/${id}`, { token }),

  modules: (courseId: number, token: string) =>
    api<Module[]>(`/courses/${courseId}/modules`, { token }),

  progress: (courseId: number, token: string) =>
    api(`/courses/${courseId}/progress`, { token }),

  create: (data: { title: string; description: string; organizationId: number; subject?: string; level?: string; contentType?: string }, token: string) =>
    api<Course>('/courses', { method: 'POST', body: data, token }),

  update: (id: number, data: Partial<Course>, token: string) =>
    api<Course>(`/courses/${id}`, { method: 'PUT', body: data, token }),

  delete: (id: number, token: string) =>
    api(`/courses/${id}`, { method: 'DELETE', token }),

  createModule: (courseId: number, data: { title: string; description?: string; orderIndex?: number }, token: string) =>
    api<Module>(`/courses/${courseId}/modules`, { method: 'POST', body: data, token }),

  updateModule: (courseId: number, moduleId: number, data: Partial<Module>, token: string) =>
    api<Module>(`/courses/${courseId}/modules/${moduleId}`, { method: 'PUT', body: data, token }),

  deleteModule: (courseId: number, moduleId: number, token: string) =>
    api(`/courses/${courseId}/modules/${moduleId}`, { method: 'DELETE', token }),

  reorderModules: (courseId: number, moduleIds: number[], token: string) =>
    api(`/courses/${courseId}/modules/reorder`, { method: 'PUT', body: { moduleIds }, token }),
};

// Organizations endpoints — backend returns direct arrays
export const orgsApi = {
  list: (token: string) =>
    api<Organization[]>('/organizations', { token }),

  get: (id: number, token: string) =>
    api<Organization>(`/organizations/${id}`, { token }),

  members: (id: number, token: string) =>
    api<User[]>(`/organizations/${id}/members`, { token }),

  create: (data: { name: string; type: string; code: string; description?: string }, token: string) =>
    api<Organization>('/organizations', { method: 'POST', body: data, token }),

  update: (id: number, data: Partial<Organization & { isActive?: boolean; description?: string }>, token: string) =>
    api<Organization>(`/organizations/${id}`, { method: 'PUT', body: data, token }),
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

  get: (id: number, token: string) =>
    api<Exam>(`/exams/${id}`, { token }),

  getQuestions: (examId: number, token: string) =>
    api<Question[]>(`/exams/${examId}/questions`, { token }),

  addQuestion: (examId: number, data: {
    text: string;
    type?: string;
    options: { text: string; label: string }[];
    correctOptionId: string;
    explanation?: string;
  }, token: string) =>
    api<Question>(`/exams/${examId}/questions`, { method: 'POST', body: data, token }),

  updateQuestion: (examId: number, questionId: number, data: {
    text?: string;
    type?: string;
    options?: { text: string; label: string }[];
    correctOptionId?: string;
    explanation?: string;
  }, token: string) =>
    api<Question>(`/exams/${examId}/questions/${questionId}`, { method: 'PUT', body: data, token }),

  deleteQuestion: (examId: number, questionId: number, token: string) =>
    api(`/exams/${examId}/questions/${questionId}`, { method: 'DELETE', token }),

  update: (id: number, data: Partial<Exam>, token: string) =>
    api<Exam>(`/exams/${id}`, { method: 'PUT', body: data, token }),

  // Module-level question endpoints
  moduleQuestions: (moduleId: number, token: string) =>
    api<Question[]>(`/exams/module/${moduleId}/questions`, { token }),

  addModuleQuestion: (moduleId: number, data: {
    text: string;
    type?: string;
    options: { text: string; label: string }[];
    correctOptionId: string;
    explanation?: string;
  }, token: string) =>
    api<Question>(`/exams/module/${moduleId}/questions`, { method: 'POST', body: data, token }),
};

// Files endpoints
export const filesApi = {
  upload: async (file: File, courseId: number, moduleId: number | null, token: string) => {
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

  listByCourse: (courseId: number, token: string) =>
    api<FileMetadata[]>(`/files/course/${courseId}`, { token }),

  listByModule: (moduleId: number, token: string) =>
    api<FileMetadata[]>(`/files/module/${moduleId}`, { token }),

  rename: (fileId: number, newName: string, token: string) =>
    api(`/files/${fileId}/rename`, { method: 'PUT', body: { newName }, token }),

  delete: (fileId: number, token: string) =>
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
  id: number;
  courseId: number;
  title: string;
  description: string;
  orderIndex: number;
  pdfUrl?: string;
  contentUrl?: string;
  contentType?: string;
  durationMin?: number;
  progress?: number;
  examId?: number;
  fileCount?: number;
  questionCount?: number;
}

export interface Exam {
  id: number;
  courseId: number;
  moduleId?: number;
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
  id: number;
  examId: number;
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
