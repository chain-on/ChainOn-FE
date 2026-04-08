import {
  BaseResponse,
  LoginResponse,
  TokenResponse,
  Notice,
  Item,
  Order,
  Franchise,
  OrderStatusStats,
  OrderStatsResponse,
} from './types';

// 배포 환경에서는 VITE_API_URL을 사용하고, 개발 환경에서는 프록시를 위해 비워둡니다.
const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || '';
  return url.replace(/\/$/, '');
};

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
  const baseUrl = getBaseUrl();
  // 엔드포인트가 /로 시작하면 baseUrl과 합칠 때 중복되지 않도록 처리
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  let response = await fetch(url, {
    ...options,
    credentials: 'include', // 쿠키(refreshToken) 포함을 위해 추가
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  // 401 Unauthorized 에러 발생 시 토큰 재발급 시도
  if (response.status === 401 && !endpoint.includes('/user/login') && !endpoint.includes('/user/reissue')) {
    try {
      // httpOnly 쿠키에 저장된 refreshToken을 사용하므로 별도 인자 불필요
      // api.auth.reissue() 대신 직접 fetch 호출하여 순환 참조 방지
      const reissueResponse = await fetch(`${baseUrl}/user/reissue`, {
        method: 'POST',
        credentials: 'include',
      });

      if (reissueResponse.ok) {
        const reissueData: BaseResponse<TokenResponse> = await reissueResponse.json();
        const reissueResult = reissueData.result;
        
        if (reissueResult && reissueResult.accessToken) {
          localStorage.setItem('token', reissueResult.accessToken);
          
          // 새 토큰으로 원본 요청 재시도
          response = await fetch(url, {
            ...options,
            credentials: 'include',
            headers: {
              ...getHeaders(),
              ...options.headers,
            },
          });
        }
      }
    } catch (err) {
      console.error('Token reissue failed:', err);
    }
  }

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error(`API Error: ${url} returned non-JSON response`, text.substring(0, 100));
    throw new Error(`서버 응답 오류 (${response.status}): 백엔드 연결 확인이 필요합니다.`);
  }

  let data: BaseResponse<T>;
  try {
    data = await response.json();
  } catch (err) {
    console.error(`JSON Parse Error at ${url}:`, err);
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
    reissue: () =>
      request<TokenResponse>('/user/reissue', {
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
    update: (id: number, body: { name: string; price: number }) =>
      request<string>(`/admin/item/${id}`, {
        method: 'PATCH',
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

  // --- Organization Management ---
  org: {
    list: () => request<Franchise[]>('/admin/franchises', { method: 'GET' }),
    createHeadquarter: (body: { name: string; address: string }) =>
      request<Franchise>('/org/parent', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    create: (body: { name: string; address: string; parentId: number }) =>
      request<Franchise>('/org/child', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (id: number, body: { name: string; address: string }) =>
      request<string>(`/org/child/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    delete: (id: number) =>
      request<string>(`/org/child/${id}`, {
        method: 'DELETE',
      }),
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
