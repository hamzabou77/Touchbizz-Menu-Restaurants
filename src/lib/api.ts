import { PublicMenuData, Restaurant, Category, MenuItem, User, LanguageCode } from '../types';

const TOKEN_KEY = 'touchbizz_auth_token';
const USER_KEY = 'touchbizz_auth_user';

export function normalizeRestaurant(r: any): Restaurant {
  if (!r) return r;
  let languages: LanguageCode[] = ['fr', 'ar', 'en'];
  if (Array.isArray(r.languages) && r.languages.length > 0) {
    languages = r.languages;
  } else if (typeof r.languages === 'string') {
    try {
      const parsed = JSON.parse(r.languages);
      if (Array.isArray(parsed) && parsed.length > 0) {
        languages = parsed;
      }
    } catch {}
  }
  return {
    ...r,
    languages,
    is_published: Boolean(r.is_published),
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/public/')) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    if (!window.location.pathname.startsWith('/r/')) {
      window.location.href = '/login';
    }
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Erreur serveur (${response.status})`);
  }

  return data as T;
}

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setAuth(token: string, user: User) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getCurrentUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      const user = JSON.parse(raw);
      if (user && (user.email === 'admin@touchbizz.ma' || user.name === 'Admin TouchBizz')) {
        const updatedUser: User = {
          ...user,
          email: 'boalyhamza@gmail.com',
          name: 'Hamza Boaly',
        };
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        return updatedUser;
      }
      return user;
    } catch {
      return null;
    }
  },

  request,

  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setAuth(res.token, res.user);
    return res;
  },

  async getMe(): Promise<{ user: User }> {
    const res = await request<{ user: User }>('/api/auth/me');
    if (res?.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    }
    return res;
  },

  // Public Menu (No Auth)
  async getPublicMenu(slug: string): Promise<PublicMenuData> {
    const res = await request<PublicMenuData>(`/api/public/menu/${slug}`);
    if (res?.restaurant) {
      res.restaurant = normalizeRestaurant(res.restaurant);
    }
    return res;
  },

  // Restaurants
  async getRestaurants(): Promise<Restaurant[]> {
    const list = await request<Restaurant[]>('/api/restaurants');
    return Array.isArray(list) ? list.map(normalizeRestaurant) : [];
  },

  async getRestaurant(id: string): Promise<Restaurant> {
    const rest = await request<Restaurant>(`/api/restaurants/${id}`);
    return normalizeRestaurant(rest);
  },

  async createRestaurant(data: Partial<Restaurant>): Promise<Restaurant> {
    const rest = await request<Restaurant>('/api/restaurants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return normalizeRestaurant(rest);
  },

  async updateRestaurant(id: string, data: Partial<Restaurant>): Promise<Restaurant> {
    const rest = await request<Restaurant>(`/api/restaurants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return normalizeRestaurant(rest);
  },

  async togglePublishRestaurant(id: string): Promise<{ is_published: boolean }> {
    return request<{ is_published: boolean }>(`/api/restaurants/${id}/toggle-publish`, {
      method: 'POST',
    });
  },

  async deleteRestaurant(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/restaurants/${id}`, {
      method: 'DELETE',
    });
  },

  async getRestaurantQr(id: string): Promise<{
    publicUrl: string;
    qrDataUrl: string;
    qrSvg: string;
    restaurantName: string;
    slug: string;
  }> {
    return request(`/api/restaurants/${id}/qr`);
  },

  // Categories
  async getCategories(restaurantId: string): Promise<Category[]> {
    return request<Category[]>(`/api/restaurants/${restaurantId}/categories`);
  },

  async createCategory(restaurantId: string, data: Partial<Category>): Promise<Category> {
    return request<Category>(`/api/restaurants/${restaurantId}/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    return request<Category>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async reorderCategories(restaurantId: string, orderedIds: string[]): Promise<void> {
    await request(`/api/restaurants/${restaurantId}/categories/reorder`, {
      method: 'POST',
      body: JSON.stringify({ orderedIds }),
    });
  },

  async deleteCategory(id: string): Promise<void> {
    await request(`/api/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Menu Items
  async getMenuItems(restaurantId: string, categoryId?: string): Promise<MenuItem[]> {
    const url = categoryId
      ? `/api/restaurants/${restaurantId}/items?category_id=${categoryId}`
      : `/api/restaurants/${restaurantId}/items`;
    return request<MenuItem[]>(url);
  },

  async createMenuItem(restaurantId: string, data: Partial<MenuItem>): Promise<MenuItem> {
    return request<MenuItem>(`/api/restaurants/${restaurantId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateMenuItem(id: string, data: Partial<MenuItem>): Promise<MenuItem> {
    return request<MenuItem>(`/api/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async toggleItemAvailability(id: string): Promise<{ id: string; is_available: boolean }> {
    return request<{ id: string; is_available: boolean }>(`/api/items/${id}/toggle-availability`, {
      method: 'POST',
    });
  },

  async reorderMenuItems(restaurantId: string, orderedIds: string[]): Promise<void> {
    await request(`/api/restaurants/${restaurantId}/items/reorder`, {
      method: 'POST',
      body: JSON.stringify({ orderedIds }),
    });
  },

  async deleteMenuItem(id: string): Promise<void> {
    await request(`/api/items/${id}`, {
      method: 'DELETE',
    });
  },

  // Upload image
  async uploadImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('image', file);
    return request<{ url: string }>('/api/upload', {
      method: 'POST',
      body: formData,
    });
  },
};
