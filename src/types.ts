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
}

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: '신선 프리미엄 닭다리살 (5kg)',
    category: '식자재',
    price: 45000,
    unit: '박스',
    image: 'https://picsum.photos/seed/chicken/400/400',
    stock: 100,
  },
  {
    id: '2',
    name: '특제 마라 소스 (2L)',
    category: '소스/양념',
    price: 18000,
    unit: '통',
    image: 'https://picsum.photos/seed/sauce/400/400',
    stock: 50,
  },
  {
    id: '3',
    name: '친환경 치킨 박스 (500개)',
    category: '포장용품',
    price: 35000,
    unit: '묶음',
    image: 'https://picsum.photos/seed/box/400/400',
    stock: 200,
  },
  {
    id: '4',
    name: '고소한 튀김유 (18L)',
    category: '식자재',
    price: 52000,
    unit: '캔',
    image: 'https://picsum.photos/seed/oil/400/400',
    stock: 30,
  },
  {
    id: '5',
    name: '매콤달콤 양념치킨 소스 (5kg)',
    category: '소스/양념',
    price: 22000,
    unit: '통',
    image: 'https://picsum.photos/seed/sauce2/400/400',
    stock: 45,
  },
  {
    id: '6',
    name: '일회용 나무젓가락 (1000개)',
    category: '포장용품',
    price: 12000,
    unit: '박스',
    image: 'https://picsum.photos/seed/chopsticks/400/400',
    stock: 150,
  },
];
