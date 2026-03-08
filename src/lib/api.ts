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
};

// Organizations endpoints — backend returns direct arrays
export const orgsApi = {
  list: (token: string) =>
    api<Organization[]>('/organizations', { token }),

  get: (id: number, token: string) =>
    api<Organization>(`/organizations/${id}`, { token }),

  members: (id: number, token: string) =>
    api<User[]>(`/organizations/${id}/members`, { token }),
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
  progress?: number;
}

export interface Organization {
  id: number;
  name: string;
  type: string;
  code: string;
  logoUrl?: string;
  memberCount?: number;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  organizationId: number;
  authorName: string;
  createdAt: string;
}
