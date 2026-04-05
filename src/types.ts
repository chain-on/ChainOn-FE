export interface BaseResponse<T> {
  timestamp: string;
  code: string;
  message: string;
  result: T;
}

export type UserRole = 'HQ_ADMIN' | 'FRANCHISE_USER';

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  role: UserRole;
}

export interface LoginResponse {
  name: string;
  organization: string;
  tokenResponse: TokenResponse;
}

export interface Notice {
  id: number;
  title: string;
  content: string;
  isUrgent: boolean;
  createdAt: string;
}

export interface Item {
  ItemId: number;
  name: string;
  price: number;
}

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  orderId: number;
  organizationName: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
  totalPrice: number;
}

export interface Franchise {
  orgId: number;
  name: string;
  address: string;
  userName: string;
  createdAt: string;
}

export interface OrderStatusStats {
  pending: number;
  approved: number;
}

export interface OrderTrend {
  date: string;
  revenue: number;
}

export interface OrderRank {
  ranking: number;
  orgName: string;
  revenue: number;
}

export interface OrderStatsResponse {
  trends: OrderTrend[];
  ranks: OrderRank[];
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  organization?: string;
}
