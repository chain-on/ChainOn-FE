import {
  BaseResponse,
  LoginResponse,
  Notice,
  Item,
  Order,
  Franchise,
  OrderStatusStats,
  OrderStatsResponse,
} from './types';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  // Check if response is empty (e.g. 204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  const data: BaseResponse<T> = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `API Error: ${response.status}`);
  }

  // Backends often return the actual data inside 'result'
  return data.result;
}

export const api = {
  // --- Auth ---
  auth: {
    login: (body: any) =>
      request<LoginResponse>('/user/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    signup: (body: any, isAdmin = false) =>
      request<string>(isAdmin ? '/user/signup/admin' : '/user/signup/user', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    logout: () =>
      request<string>('/user/logout', {
        method: 'POST',
      }),
  },

  // --- Notice ---
  notice: {
    list: () => request<Notice[]>('/notice', { method: 'GET' }),
    create: (body: { title: string; content: string; isUrgent: boolean }) =>
      request<string>('/admin/notice', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    delete: (id: number) =>
      request<string>(`/admin/notice/${id}`, {
        method: 'DELETE',
      }),
  },

  // --- Item ---
  item: {
    list: () => request<Item[]>('/item', { method: 'GET' }),
    create: (body: { name: string; price: number }) =>
      request<string>('/admin/item', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    delete: (id: number) =>
      request<string>(`/admin/item/${id}`, {
        method: 'DELETE',
      }),
  },

  // --- Order ---
  order: {
    // User
    getMyOrders: () => request<Order[]>('/order', { method: 'GET' }),
    create: (items: { itemId: number; quantity: number }[]) =>
      request<string>('/order', {
        method: 'POST',
        body: JSON.stringify(items),
      }),

    // Admin
    getAllOrders: () => request<Order[]>('/admin/order', { method: 'GET' }),
    updateStatus: (orderId: number) =>
      request<string>(`/admin/order/status/${orderId}`, {
        method: 'PATCH',
      }),
    delete: (orderId: number) =>
      request<string>(`/admin/order/${orderId}`, {
        method: 'DELETE',
      }),
  },

  // --- Admin/Franchise Management ---
  admin: {
    getFranchises: () => request<Franchise[]>('/admin/franchises', { method: 'GET' }),
    updateFranchise: (orgId: number, body: any) =>
      request<string>(`/admin/franchises/${orgId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    deleteFranchise: (orgId: number) =>
      request<string>(`/admin/franchises/${orgId}`, {
        method: 'DELETE',
      }),
    createOrg: (body: { name: string; address: string; parentId?: number }, type: 'parent' | 'child') =>
      request<string>(`/org/${type}`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },

  // --- Dashboard Statistics ---
  stats: {
    getStatusCounts: () => request<OrderStatusStats>('/admin/order/status', { method: 'GET' }),
    getPeriodicStats: (period: 'daily' | 'weekly' | 'monthly' | 'yearly') =>
      request<OrderStatsResponse>(`/admin/order/stats/${period}`, {
        method: 'GET',
      }),
    getRecentOrders: () => request<any[]>('/admin/recent', { method: 'GET' }),
  },
};
