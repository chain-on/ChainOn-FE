export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  image: string;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export type UserRole = 'franchise' | 'hq';

export interface Order {
  id: string;
  date: string;
  timestamp: number;
  storeName: string;
  items: CartItem[];
  totalAmount: number;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED';
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  timestamp: number;
  isImportant: boolean;
}

export interface Store {
  id: string;
  name: string;
  owner: string;
  address: string;
  joinDate: string;
  loginId: string;
  password?: string;
}

export const MOCK_PRODUCTS: Product[] = [];
