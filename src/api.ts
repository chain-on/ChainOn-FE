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

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type');
  
  // JSON 응답이 아닌 경우 (HTML 에러 페이지 등)
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error(`API Error: ${endpoint} returned non-JSON response`, text.substring(0, 100));
    throw new Error(`서버 응답 오류 (${response.status}): JSON 형식이 아닙니다.`);
  }

  let data: BaseResponse<T>;
  try {
    data = await response.json();
  } catch (err) {
    console.error(`JSON Parse Error at ${endpoint}:`, err);
    throw new Error('데이터 형식이 올바르지 않습니다.');
  }

  if (!response.ok) {
    throw new Error(data.message || `API Error: ${response.status}`);
  }

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
    getMyOrders: () => request<Order[]>('/order', { method: 'GET' }),
    create: (items: { itemId: number; quantity: number }[]) =>
      request<string>('/order', {
        method: 'POST',
        body: JSON.stringify(items),
      }),

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

  // --- Admin Management ---
  admin: {
    getFranchises: () => request<Franchise[]>('/admin/franchises', { method: 'GET' }),
  },

  // --- Dashboard Statistics ---
  stats: {
    getStatusCounts: () => request<OrderStatusStats>('/admin/order/status', { method: 'GET' }),
    getPeriodicStats: (period: 'daily' | 'weekly' | 'monthly' | 'yearly') =>
      request<OrderStatsResponse>(`/admin/order/stats/${period}`, {
        method: 'GET',
      }),
  },
};
