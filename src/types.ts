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
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
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

export const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: '원두 (다크 블렌드)', category: '커피', price: 25000, unit: '1kg', image: '', stock: 100 },
  { id: '2', name: '우유 (멸균)', category: '유제품', price: 18000, unit: '1L x 12', image: '', stock: 50 },
  { id: '3', name: '종이컵 (12oz)', category: '소모품', price: 45000, unit: '1000ea', image: '', stock: 200 },
];
