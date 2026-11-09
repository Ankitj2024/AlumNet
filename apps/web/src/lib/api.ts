const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data: T; error?: { message: string; code: string } }> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Retrieve token from localStorage if in client mode as fallback to cookie
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Ensures HTTP-only cookie is sent
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || `HTTP ${res.status}: Request failed`);
    }

    return json;
  } catch (error: any) {
    return {
      success: false,
      data: null as any,
      error: {
        message: error.message || 'Network error occurred',
        code: 'NETWORK_ERROR',
      },
    };
  }
}

export const api = {
  get: async <T = any>(endpoint: string, options: { params?: Record<string, any> } = {}) => {
    let url = endpoint;
    if (options.params) {
      const q = new URLSearchParams();
      Object.entries(options.params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
      });
      const qs = q.toString();
      if (qs) url += `${url.includes('?') ? '&' : '?'}${qs}`;
    }
    const res = await fetchApi<T>(url, { method: 'GET' });
    return { data: res };
  },
  post: async <T = any>(endpoint: string, data?: any) => {
    const res = await fetchApi<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return { data: res };
  },
  put: async <T = any>(endpoint: string, data?: any) => {
    const res = await fetchApi<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    return { data: res };
  },
  patch: async <T = any>(endpoint: string, data?: any) => {
    const res = await fetchApi<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
    return { data: res };
  },
  delete: async <T = any>(endpoint: string) => {
    const res = await fetchApi<T>(endpoint, { method: 'DELETE' });
    return { data: res };
  },
};

