const API_BASE = '/api';

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
    throw new Error(error.error?.message || 'Request failed');
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiRequest<{ user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    apiRequest<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    }),

  getMe: () => apiRequest<{ user: any }>('/auth/me'),

  // Articles (public)
  getArticles: (params?: { page?: number; limit?: number; language?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.language) searchParams.set('language', params.language);
    return apiRequest<{ articles: any[]; pagination: any }>(
      `/articles?${searchParams.toString()}`
    );
  },

  getArticle: (slug: string) =>
    apiRequest<{ article: any }>(`/articles/${slug}`),

  // Admin articles
  getAdminArticles: (params?: { status?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    return apiRequest<{ articles: any[]; pagination: any }>(
      `/admin/articles?${searchParams.toString()}`
    );
  },

  getAdminArticle: (id: string) =>
    apiRequest<{ article: any }>(`/admin/articles/${id}`),

  createArticle: (data: any) =>
    apiRequest<{ article: any }>('/admin/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateArticle: (id: string, data: any) =>
    apiRequest<{ article: any }>(`/admin/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteArticle: (id: string) =>
    apiRequest<{ success: boolean }>(`/admin/articles/${id}`, {
      method: 'DELETE',
    }),

  publishArticle: (id: string) =>
    apiRequest<{ article: any }>(`/admin/articles/${id}/publish`, {
      method: 'POST',
    }),

  regenerateArticle: (id: string) =>
    apiRequest<{ article: any }>(`/admin/articles/${id}/regenerate`, {
      method: 'POST',
    }),

  // Settings
  getSettings: (category?: string) => {
    const searchParams = category ? `?category=${category}` : '';
    return apiRequest<{ settings: Record<string, any> }>(`/admin/settings${searchParams}`);
  },

  updateSettings: (settings: Record<string, any>) =>
    apiRequest<{ success: boolean }>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    }),

  // AI
  generateArticle: (params: { topic: string; keywords?: string[]; language?: string }) =>
    apiRequest<{ article: any }>('/admin/ai/generate-article', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  // Dashboard
  getDashboardStats: () =>
    apiRequest<{ stats: any }>('/admin/dashboard/stats'),

  // Setup
  getSetupStatus: () =>
    apiRequest<{ setupComplete: boolean }>('/setup/status'),

  completeSetup: (data: any) =>
    apiRequest<{ success: boolean }>('/setup/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Public settings
  getPublicSettings: () =>
    apiRequest<{ settings: Record<string, any> }>('/settings/public'),

  // Homepage config
  getHomepageConfig: () =>
    apiRequest<{ config: any }>('/homepage/config'),

  // Upload logo
  uploadLogo: async (file: File): Promise<{ success: boolean; url: string }> => {
    const formData = new FormData();
    formData.append('logo', file);
    
    const response = await fetch('/api/admin/upload/logo', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Upload failed' } }));
      throw new Error(error.error?.message || 'Upload failed');
    }

    return response.json();
  },

  // Upload article image
  uploadArticleImage: async (file: File): Promise<{ success: boolean; url: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'article-image');
    
    const response = await fetch('/api/admin/upload/article-image', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Upload failed' } }));
      throw new Error(error.error?.message || 'Upload failed');
    }

    return response.json();
  },

  // Internal API request method (for special cases)
  apiRequest: apiRequest,
};

