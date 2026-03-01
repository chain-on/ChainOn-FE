/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Package, 
  History, 
  ChevronRight, 
  Plus, 
  Minus, 
  X, 
  CheckCircle2,
  Bell,
  User,
  Menu,
  AlertCircle,
  Box,
  Droplets,
  ShoppingBag,
  MoreHorizontal,
  BarChart3,
  Truck,
  ArrowLeft,
  Calendar,
  TrendingUp,
  Megaphone,
  PlusCircle,
  Settings,
  Store as StoreIcon,
  Edit2,
  Trash2,
  LogOut,
  Lock,
  Mail,
  Link2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import * as XLSX from 'xlsx';
import { Product, CartItem, Order, MOCK_PRODUCTS, UserRole, Notice, Store } from './types';

const ProductIcon = () => <Box size={24} />;

// Mock data for analytics
const MOCK_STATS = {
  daily: [],
  weekly: [],
  monthly: [],
  yearly: [],
  rankings: {
    daily: [],
    weekly: [],
    monthly: [],
    yearly: [],
  }
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('franchise');
  const [loginForm, setLoginForm] = useState({ id: '', password: '' });
  const [activeTab, setActiveTab] = useState<'shop' | 'orders' | 'notices' | 'hq_dashboard' | 'hq_orders' | 'hq_system'>('shop');
  const [systemTab, setSystemTab] = useState<'products' | 'notices' | 'stores'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [notices, setNotices] = useState<Notice[]>([
    {
      id: 'notice-1',
      title: '가맹점 발주 가이드 안내',
      content: '새로운 발주 시스템 이용 방법입니다. 매주 월요일 오전 10시까지 발주를 완료해 주세요.',
      date: '2024-03-01',
      timestamp: Date.now(),
      isImportant: true
    }
  ]);
  const [stores, setStores] = useState<Store[]>([
    { 
      id: 'test-store-1', 
      name: '강남역삼점', 
      owner: '김철수', 
      address: '서울시 강남구 테헤란로 123', 
      joinDate: '2024-01-01', 
      loginId: 'store', 
      password: '1234' 
    }
  ]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '' });
  const [newNotice, setNewNotice] = useState({ title: '', content: '', isImportant: false });
  const [newStore, setNewStore] = useState({ name: '', owner: '', address: '', loginId: '', password: '' });
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'ORD-TEST001',
      date: '2024년 3월 1일',
      timestamp: Date.now() - 86400000,
      storeName: '강남역삼점',
      items: [
        { id: '1', name: '원두 (다크 블렌드)', category: '커피', price: 25000, unit: '1kg', image: '', stock: 100, quantity: 2 }
      ],
      totalAmount: 50000,
      status: 'pending'
    }
  ]);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState(false);
  const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
  const [selectedOrderToEdit, setSelectedOrderToEdit] = useState<Order | null>(null);
  const [manualOrderData, setManualOrderData] = useState<{ storeName: string; items: CartItem[] }>({
    storeName: '',
    items: []
  });
  const [manualOrderSearchQuery, setManualOrderSearchQuery] = useState('');
  const [statsPeriod, setStatsPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [orderFilter, setOrderFilter] = useState<'all' | 'active'>('all');
  const [orderPeriod, setOrderPeriod] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  // Sync tab with role
  useEffect(() => {
    if (userRole === 'hq') {
      setActiveTab('hq_dashboard');
    } else {
      setActiveTab('shop');
    }
  }, [userRole]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      return p.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [products, searchQuery]);

  // Cart logic
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    
    const newOrder: Order = {
      id: `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
      timestamp: Date.now(),
      storeName: '강남역삼점',
      items: [...cart],
      totalAmount: cartTotal,
      status: 'pending'
    };

    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    setIsCartOpen(false);
    setShowOrderSuccess(true);
    setTimeout(() => setShowOrderSuccess(false), 3000);
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) return;
    const product: Product = {
      id: Math.random().toString(36).substr(2, 9),
      name: newProduct.name,
      price: parseInt(newProduct.price),
      category: '기타',
      unit: '개',
      image: 'https://picsum.photos/seed/new/400/400',
      stock: 0
    };
    setProducts([...products, product]);
    setNewProduct({ name: '', price: '' });
  };

  const handleAddNotice = () => {
    if (!newNotice.title || !newNotice.content) return;
    const notice: Notice = {
      id: Math.random().toString(36).substr(2, 9),
      title: newNotice.title,
      content: newNotice.content,
      date: new Date().toLocaleDateString('ko-KR'),
      timestamp: Date.now(),
      isImportant: newNotice.isImportant
    };
    setNotices([notice, ...notices]);
    setNewNotice({ title: '', content: '', isImportant: false });
  };

  const handleAddStore = () => {
    if (!newStore.name || !newStore.owner || !newStore.loginId || !newStore.password) {
      alert('가맹점명, 점주명, 아이디, 비밀번호는 필수입니다.');
      return;
    }
    const store: Store = {
      id: Math.random().toString(36).substr(2, 9),
      ...newStore,
      joinDate: new Date().toLocaleDateString('ko-KR')
    };
    setStores([...stores, store]);
    setNewStore({ name: '', owner: '', address: '', loginId: '', password: '' });
  };

  const handleUpdateStore = () => {
    if (!editingStoreId || !newStore.name || !newStore.owner || !newStore.loginId) return;
    setStores(stores.map(s => s.id === editingStoreId ? { ...s, ...newStore } : s));
    setNewStore({ name: '', owner: '', address: '', loginId: '', password: '' });
    setEditingStoreId(null);
  };

  const handleDeleteStore = (id: string) => {
    setStores(stores.filter(s => s.id !== id));
  };

  const handleManualOrder = () => {
    if (!manualOrderData.storeName || manualOrderData.items.length === 0) {
      alert('가맹점과 품목을 선택해주세요.');
      return;
    }

    const totalAmount = manualOrderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const newOrder: Order = {
      id: `HQ-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      date: new Date().toLocaleDateString('ko-KR'),
      timestamp: Date.now(),
      storeName: manualOrderData.storeName,
      items: manualOrderData.items,
      totalAmount,
      status: 'pending'
    };

    setOrders(prev => [newOrder, ...prev]);
    setIsManualOrderModalOpen(false);
    setManualOrderData({ storeName: '', items: [] });
    setManualOrderSearchQuery('');
    
    // Show success toast
    setShowOrderSuccess(true);
    setTimeout(() => setShowOrderSuccess(false), 3000);
  };

  const handleCancelOrder = (orderId: string) => {
    if (confirm('정말로 이 주문을 취소하시겠습니까?')) {
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: 'cancelled' } : order
      ));
    }
  };

  const handleUpdateOrderItems = (orderId: string, items: CartItem[]) => {
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, items, totalAmount } : order
    ));
    setIsEditOrderModalOpen(false);
    setSelectedOrderToEdit(null);
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status } : order
    ));
  };

  const hqStats = useMemo(() => {
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const processingCount = orders.filter(o => o.status === 'processing').length;
    const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    return { pendingCount, processingCount, totalSales };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let result = orders;

    if (orderFilter === 'active') {
      result = result.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).getTime();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfThisYear = new Date(now.getFullYear(), 0, 1).getTime();

    if (orderPeriod === 'daily') {
      result = result.filter(o => o.timestamp >= startOfToday);
    } else if (orderPeriod === 'weekly') {
      result = result.filter(o => o.timestamp >= startOfThisWeek);
    } else if (orderPeriod === 'monthly') {
      result = result.filter(o => o.timestamp >= startOfThisMonth);
    } else if (orderPeriod === 'yearly') {
      result = result.filter(o => o.timestamp >= startOfThisYear);
    }

    if (dateRange.start) {
      const start = new Date(dateRange.start).getTime();
      result = result.filter(o => o.timestamp >= start);
    }
    if (dateRange.end) {
      const end = new Date(dateRange.end).setHours(23, 59, 59, 999);
      result = result.filter(o => o.timestamp <= end);
    }

    if (searchQuery) {
      result = result.filter(o => 
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
        o.storeName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return result;
  }, [orders, orderFilter, orderPeriod, dateRange, searchQuery]);

  const exportToExcel = () => {
    if (orders.length === 0) return;

    const data = orders.flatMap(order => 
      order.items.map(item => ({
        '주문번호': order.id,
        '날짜': order.date,
        '가맹점명': order.storeName,
        '상품명': item.name,
        '수량': item.quantity,
        '단가': item.price,
        '합계': item.price * item.quantity,
        '상태': order.status === 'pending' ? '승인대기' : 
                order.status === 'processing' ? '주문승인' : '배송완료'
      }))
    );

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "주문내역");
    XLSX.writeFile(workbook, `주문내역_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.id === 'hq' && loginForm.password === '1234') {
      setUserRole('hq');
      setIsLoggedIn(true);
    } else if (loginForm.id === 'store' && loginForm.password === '1234') {
      setUserRole('franchise');
      setIsLoggedIn(true);
    } else {
      alert('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  const fillTestAccount = (role: UserRole) => {
    if (role === 'hq') {
      setLoginForm({ id: 'hq', password: '1234' });
    } else {
      setLoginForm({ id: 'store', password: '1234' });
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-brand-gray flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-3xl danggeun-shadow p-8 space-y-8"
        >
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-brand-red rounded-2xl flex items-center justify-center text-white mx-auto danggeun-shadow">
              <Link2 size={32} strokeWidth={3} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight pt-4">체인ON본부</h1>
            <p className="text-gray-400 text-sm font-medium">가맹점 및 본사 통합 관리 솔루션</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 ml-1">아이디</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="아이디를 입력하세요"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none outline-none text-sm font-medium focus:ring-2 focus:ring-brand-red/10 transition-all"
                  value={loginForm.id}
                  onChange={(e) => setLoginForm({ ...loginForm, id: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 ml-1">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="password" 
                  placeholder="비밀번호를 입력하세요"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none outline-none text-sm font-medium focus:ring-2 focus:ring-brand-red/10 transition-all"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-brand-red text-white font-bold rounded-2xl hover:bg-brand-red/90 transition-all shadow-lg shadow-brand-red/20 active:scale-[0.98]"
            >
              로그인
            </button>
          </form>

          <div className="space-y-3 pt-4">
            <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">테스트 계정 바로가기</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => fillTestAccount('franchise')}
                className="py-3 px-4 bg-brand-yellow/10 text-brand-black border border-brand-yellow/20 rounded-xl text-xs font-bold hover:bg-brand-yellow/20 transition-all"
              >
                가맹점 테스트
              </button>
              <button 
                onClick={() => fillTestAccount('hq')}
                className="py-3 px-4 bg-brand-black text-white rounded-xl text-xs font-bold hover:bg-brand-black/90 transition-all"
              >
                본사 테스트
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-gray pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center text-white">
            <Link2 size={18} strokeWidth={3} />
          </div>
          <h1 className="text-lg font-bold tracking-tight">체인ON본부</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setIsLoggedIn(false);
              setLoginForm({ id: '', password: '' });
              setActiveTab(userRole === 'hq' ? 'hq_dashboard' : 'shop');
              setSystemTab('products');
            }}
            className="p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors flex items-center gap-1"
            title="로그아웃"
          >
            <LogOut size={20} />
            <span className="text-xs font-bold hidden sm:inline">로그아웃</span>
          </button>
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-gray-100">
            <div className="text-right">
              <p className="text-xs text-gray-500">{userRole === 'hq' ? '본사 관리자' : '강남역삼점'}</p>
              <p className="text-sm font-semibold">{userRole === 'hq' ? '운영팀장님' : '김사장님'}</p>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${userRole === 'hq' ? 'bg-brand-black text-white' : 'bg-brand-yellow text-brand-black'}`}>
              <User size={18} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6">
        {/* Franchise View */}
        {userRole === 'franchise' && (
          <>
            {activeTab === 'shop' ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="필요한 물품을 검색해보세요"
                      className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border-none danggeun-shadow focus:ring-2 focus:ring-brand-red/20 transition-all outline-none"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center space-y-4 danggeun-shadow">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                      <Search size={32} />
                    </div>
                    <p className="text-gray-500">
                      {searchQuery ? '검색 결과가 없습니다.' : '등록된 품목이 없습니다.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map(product => {
                      const cartItem = cart.find(item => item.id === product.id);
                      const isInCart = !!cartItem;

                      return (
                        <motion.div 
                          layout
                          key={product.id}
                          className={`bg-white rounded-2xl overflow-hidden danggeun-shadow group border-2 transition-all ${
                            isInCart ? 'border-brand-red/20' : 'border-transparent'
                          }`}
                        >
                          <div className="p-4 flex gap-4 items-center">
                            <div className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 ${
                              isInCart ? 'bg-brand-red/10 text-brand-red' : 'bg-gray-100 text-gray-400'
                            }`}>
                              <ProductIcon />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {isInCart && (
                                  <span className="flex items-center gap-0.5 text-[10px] font-bold text-brand-red bg-brand-red/10 px-1.5 py-0.5 rounded">
                                    <CheckCircle2 size={10} /> 담김 {cartItem.quantity}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-bold text-gray-800 truncate">{product.name}</h3>
                              <p className="text-sm font-bold text-gray-900">{product.price.toLocaleString()}원</p>
                            </div>
                            <button 
                              onClick={() => addToCart(product)}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                                isInCart 
                                  ? 'bg-brand-red text-white' 
                                  : 'bg-brand-yellow text-brand-black hover:bg-brand-yellow/90'
                              }`}
                            >
                              <Plus size={20} />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : activeTab === 'orders' ? (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">주문 내역</h2>
                {orders.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center space-y-4 danggeun-shadow">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                      <History size={32} />
                    </div>
                    <p className="text-gray-500">아직 주문 내역이 없습니다.</p>
                    <button onClick={() => setActiveTab('shop')} className="text-brand-red font-bold hover:underline">물품 보러가기</button>
                  </div>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="bg-white rounded-2xl p-5 danggeun-shadow space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">{order.date}</p>
                          <h3 className="font-bold text-lg">{order.id}</h3>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          order.status === 'pending' ? 'bg-brand-yellow/20 text-brand-black' : 
                          order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {order.status === 'pending' ? '승인대기' : 
                           order.status === 'processing' ? '주문승인' : '배송완료'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {order.items.slice(0, 2).map(item => (
                          <div key={item.id} className="flex justify-between text-sm text-gray-600">
                            <span>{item.name} x {item.quantity}</span>
                            <span>{(item.price * item.quantity).toLocaleString()}원</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                        <p className="font-bold">총 {order.totalAmount.toLocaleString()}원</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : activeTab === 'notices' ? (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">공지사항</h2>
                <div className="space-y-4">
                  {notices.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center space-y-4 danggeun-shadow">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                        <Bell size={32} />
                      </div>
                      <p className="text-gray-500">등록된 공지사항이 없습니다.</p>
                    </div>
                  ) : (
                    notices.map(notice => (
                      <div key={notice.id} className="bg-white rounded-2xl p-5 danggeun-shadow space-y-2 border-l-4 border-transparent hover:border-brand-red transition-all">
                        <div className="flex items-center gap-2">
                          {notice.isImportant && (
                            <span className="bg-brand-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded">중요</span>
                          )}
                          <span className="text-xs text-gray-400">{notice.date}</span>
                        </div>
                        <h3 className="font-bold text-lg">{notice.title}</h3>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{notice.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </>
        )}

        {/* HQ View */}
        {userRole === 'hq' && (
          <div className="space-y-6">
            {activeTab === 'hq_dashboard' ? (
              <div className="space-y-6">
                {/* Top Grid - Bento Style */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Processing Status - Enhanced */}
                  <div className="bg-white p-6 rounded-3xl danggeun-shadow space-y-4 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">처리 현황</p>
                      <span className="px-2 py-0.5 bg-brand-red/10 text-brand-red text-[10px] font-bold rounded-full">실시간</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 font-bold">승인 대기</p>
                        <p className="text-2xl font-black text-brand-red">{hqStats.pendingCount}<span className="text-xs ml-1">건</span></p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 font-bold">배송 준비</p>
                        <p className="text-2xl font-black text-brand-black">{hqStats.processingCount}<span className="text-xs ml-1">건</span></p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button 
                        onClick={() => { setOrderFilter('active'); setActiveTab('hq_orders'); }} 
                        className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-brand-red text-[10px] font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                      >
                        주문 처리하러 가기 <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Recent Orders Summary */}
                  <div className="bg-white p-6 rounded-3xl danggeun-shadow space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400">최근 주문</h3>
                      <button 
                        onClick={() => { setOrderFilter('all'); setActiveTab('hq_orders'); }}
                        className="text-[10px] font-bold text-brand-red hover:underline"
                      >
                        더보기
                      </button>
                    </div>
                    <div className="space-y-2">
                      {orders.length === 0 ? (
                        <p className="text-center py-4 text-gray-400 text-[10px]">최근 주문이 없습니다.</p>
                      ) : (
                        orders.slice(0, 4).map(order => (
                          <div key={order.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 transition-all">
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-brand-red truncate">{order.storeName}</p>
                              <p className="text-[11px] font-bold text-gray-800 truncate">{order.items[0].name}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[11px] font-black">{order.totalAmount.toLocaleString()}원</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Analytics Chart (Smaller) */}
                  <div className="bg-white p-6 rounded-2xl danggeun-shadow space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <BarChart3 size={20} className="text-brand-red" /> 매출 추이
                      </h3>
                      <div className="flex bg-gray-100 p-1 rounded-lg">
                        {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(p => (
                          <button 
                            key={p}
                            onClick={() => setStatsPeriod(p)}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${statsPeriod === p ? 'bg-white shadow-sm text-brand-red' : 'text-gray-400'}`}
                          >
                            {p === 'daily' ? '일간' : p === 'weekly' ? '주간' : p === 'monthly' ? '월간' : '연간'}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="h-[200px] w-full flex items-center justify-center">
                      {MOCK_STATS[statsPeriod].length === 0 ? (
                        <p className="text-gray-400 text-xs font-bold">데이터가 없습니다.</p>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={MOCK_STATS[statsPeriod]}>
                            <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FF0000" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#FF0000" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#999'}} />
                            <YAxis hide />
                            <Tooltip 
                              contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                              formatter={(value: number) => [`${value.toLocaleString()}원`, '매출']}
                            />
                            <Area type="monotone" dataKey="value" stroke="#FF0000" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Store Sales Ranking */}
                  <div className="bg-white p-6 rounded-2xl danggeun-shadow space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <TrendingUp size={20} className="text-brand-red" /> 지점 매출 랭킹
                      </h3>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">{statsPeriod} TOP 5</span>
                    </div>
                    <div className="space-y-4">
                      {MOCK_STATS.rankings[statsPeriod].length === 0 ? (
                        <div className="h-[200px] flex items-center justify-center text-gray-400 text-xs font-bold">
                          데이터가 없습니다.
                        </div>
                      ) : (
                        MOCK_STATS.rankings[statsPeriod].map((item, idx) => (
                          <div key={item.name} className="flex items-center gap-4">
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                              idx === 0 ? 'bg-brand-yellow text-brand-black' : 
                              idx === 1 ? 'bg-gray-200 text-gray-600' : 
                              idx === 2 ? 'bg-orange-100 text-orange-600' : 'text-gray-400'
                            }`}>
                              {idx + 1}
                            </span>
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-bold">{item.name}</span>
                                <span className="text-sm font-bold">{item.value.toLocaleString()}원</span>
                              </div>
                              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(item.value / MOCK_STATS.rankings[statsPeriod][0].value) * 100}%` }}
                                  className={`h-full rounded-full ${idx === 0 ? 'bg-brand-red' : 'bg-brand-black'}`}
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'hq_orders' ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h2 className="text-xl font-bold">전체 주문 관리</h2>
                      {orderFilter === 'active' && (
                        <span className="px-2 py-1 bg-brand-red/10 text-brand-red text-[10px] font-bold rounded flex items-center gap-1">
                          처리 중인 주문만 보기
                          <button onClick={() => setOrderFilter('all')} className="hover:text-brand-black"><X size={12} /></button>
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setIsManualOrderModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-black text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-all"
                      >
                        <Plus size={14} /> 수동 주문 등록
                      </button>
                      <button 
                        onClick={exportToExcel}
                        disabled={orders.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 disabled:bg-gray-300 transition-all"
                      >
                        엑셀 저장
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl danggeun-shadow space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex bg-gray-100 p-1 rounded-lg">
                        {(['all', 'daily', 'weekly', 'monthly', 'yearly'] as const).map(p => (
                          <button 
                            key={p}
                            onClick={() => setOrderPeriod(p)}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${orderPeriod === p ? 'bg-white shadow-sm text-brand-red' : 'text-gray-400'}`}
                          >
                            {p === 'all' ? '전체' : p === 'daily' ? '일간' : p === 'weekly' ? '주간' : p === 'monthly' ? '월간' : '연간'}
                          </button>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                          <Calendar size={14} className="text-gray-400" />
                          <input 
                            type="date" 
                            className="bg-transparent text-[10px] font-bold outline-none"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                          />
                          <span className="text-gray-300">~</span>
                          <input 
                            type="date" 
                            className="bg-transparent text-[10px] font-bold outline-none"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                          />
                          {(dateRange.start || dateRange.end) && (
                            <button onClick={() => setDateRange({ start: '', end: '' })} className="text-gray-400 hover:text-brand-red"><X size={12} /></button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="주문번호 또는 지점명으로 검색"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs font-medium focus:ring-2 focus:ring-brand-red/10 transition-all outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center text-gray-400 danggeun-shadow">
                    {orderFilter === 'active' ? '처리 중인 주문이 없습니다.' : '들어온 주문이 없습니다.'}
                  </div>
                ) : (
                  filteredOrders.map(order => (
                    <div key={order.id} className="bg-white rounded-2xl p-5 danggeun-shadow space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-brand-red">{order.storeName}</span>
                            <span className="text-[10px] text-gray-400">{order.date}</span>
                          </div>
                          <h3 className="font-bold text-lg">{order.id}</h3>
                        </div>
                        <div className="flex gap-2">
                          {order.status === 'pending' && (
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'processing')}
                              className="px-4 py-2 bg-brand-yellow text-brand-black text-xs font-bold rounded-xl hover:scale-105 transition-all flex items-center gap-2"
                            >
                              <CheckCircle2 size={14} /> 주문 승인
                            </button>
                          )}
                          {order.status === 'processing' && (
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'delivered')}
                              className="px-4 py-2 bg-green-500 text-white text-xs font-bold rounded-xl hover:scale-105 transition-all flex items-center gap-2"
                            >
                              <CheckCircle2 size={14} /> 배송 완료
                            </button>
                          )}
                          {order.status === 'delivered' && (
                            <span className="px-4 py-2 bg-gray-100 text-gray-400 text-xs font-bold rounded-xl">처리 완료</span>
                          )}
                          {order.status === 'cancelled' && (
                            <span className="px-4 py-2 bg-red-50 text-red-400 text-xs font-bold rounded-xl">주문 취소됨</span>
                          )}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                        {order.items.map(item => (
                          <div key={item.id} className="flex justify-between text-xs">
                            <span className="text-gray-600">{item.name}</span>
                            <span className="font-bold">{item.quantity}개</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <div className="flex items-center gap-4">
                          <p className="font-bold text-brand-red">{order.totalAmount.toLocaleString()}원</p>
                          {order.status !== 'cancelled' && order.status !== 'delivered' && (
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => { setSelectedOrderToEdit(order); setIsEditOrderModalOpen(true); }}
                                className="text-[10px] font-bold text-gray-400 hover:text-brand-black flex items-center gap-1"
                              >
                                <Edit2 size={12} /> 수량 수정
                              </button>
                              <button 
                                onClick={() => handleCancelOrder(order.id)}
                                className="text-[10px] font-bold text-gray-400 hover:text-brand-red flex items-center gap-1"
                              >
                                <Trash2 size={12} /> 주문 취소
                              </button>
                            </div>
                          )}
                        </div>
                        <button className="text-[10px] font-bold text-gray-400 hover:text-brand-black">상세 내역 보기</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : activeTab === 'hq_system' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">시스템 관리</h2>
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    {(['products', 'notices', 'stores'] as const).map(tab => (
                      <button 
                        key={tab}
                        onClick={() => setSystemTab(tab)}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${systemTab === tab ? 'bg-white shadow-sm text-brand-red' : 'text-gray-400'}`}
                      >
                        {tab === 'products' ? '품목' : tab === 'notices' ? '공지' : '가맹점'}
                      </button>
                    ))}
                  </div>
                </div>

                {systemTab === 'products' ? (
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl danggeun-shadow space-y-4">
                      <h3 className="font-bold text-sm">새 품목 추가</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input 
                          type="text" 
                          placeholder="상품명"
                          className="px-4 py-3 bg-gray-50 rounded-xl border-none outline-none text-sm"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        />
                        <input 
                          type="number" 
                          placeholder="가격"
                          className="px-4 py-3 bg-gray-50 rounded-xl border-none outline-none text-sm"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        />
                      </div>
                      <button 
                        onClick={handleAddProduct}
                        className="w-full py-3 bg-brand-red text-white font-bold rounded-xl hover:bg-brand-red/90 transition-all"
                      >
                        추가하기
                      </button>
                    </div>

                    {products.length === 0 ? (
                      <div className="bg-white rounded-2xl p-12 text-center text-gray-400 danggeun-shadow">
                        등록된 품목이 없습니다.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {products.map(product => (
                          <div key={product.id} className="bg-white p-4 rounded-2xl danggeun-shadow flex justify-between items-center">
                            <div>
                              <p className="font-bold text-gray-800">{product.name}</p>
                              <p className="text-sm text-gray-500">{product.price.toLocaleString()}원</p>
                            </div>
                            <button 
                              onClick={() => setProducts(products.filter(p => p.id !== product.id))}
                              className="p-2 text-gray-400 hover:text-brand-red transition-colors"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : systemTab === 'notices' ? (
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl danggeun-shadow space-y-4">
                      <h3 className="font-bold text-sm">새 공지사항 등록</h3>
                      <input 
                        type="text" 
                        placeholder="제목"
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none text-sm"
                        value={newNotice.title}
                        onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                      />
                      <textarea 
                        placeholder="내용"
                        rows={4}
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none text-sm resize-none"
                        value={newNotice.content}
                        onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                      />
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 accent-brand-red"
                          checked={newNotice.isImportant}
                          onChange={(e) => setNewNotice({ ...newNotice, isImportant: e.target.checked })}
                        />
                        <span className="text-xs font-bold text-gray-600">중요 공지로 설정</span>
                      </label>
                      <button 
                        onClick={handleAddNotice}
                        className="w-full py-3 bg-brand-red text-white font-bold rounded-xl hover:bg-brand-red/90 transition-all"
                      >
                        등록하기
                      </button>
                    </div>

                    {notices.length === 0 ? (
                      <div className="bg-white rounded-2xl p-12 text-center text-gray-400 danggeun-shadow">
                        등록된 공지사항이 없습니다.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {notices.map(notice => (
                          <div key={notice.id} className="bg-white p-5 rounded-2xl danggeun-shadow space-y-2 relative group">
                            <div className="flex items-center gap-2">
                              {notice.isImportant && (
                                <span className="bg-brand-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded">중요</span>
                              )}
                              <span className="text-xs text-gray-400">{notice.date}</span>
                            </div>
                            <h3 className="font-bold text-lg">{notice.title}</h3>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{notice.content}</p>
                            <button 
                              onClick={() => setNotices(notices.filter(n => n.id !== notice.id))}
                              className="absolute top-4 right-4 p-2 text-gray-300 hover:text-brand-red opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl danggeun-shadow space-y-4">
                      <h3 className="font-bold text-sm">{editingStoreId ? '가맹점 정보 수정' : '새 가맹점 추가'}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input 
                          type="text" 
                          placeholder="가맹점명"
                          className="px-4 py-3 bg-gray-50 rounded-xl border-none outline-none text-sm"
                          value={newStore.name}
                          onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                        />
                        <input 
                          type="text" 
                          placeholder="점주명"
                          className="px-4 py-3 bg-gray-50 rounded-xl border-none outline-none text-sm"
                          value={newStore.owner}
                          onChange={(e) => setNewStore({ ...newStore, owner: e.target.value })}
                        />
                        <input 
                          type="text" 
                          placeholder="주소"
                          className="px-4 py-3 bg-gray-50 rounded-xl border-none outline-none text-sm"
                          value={newStore.address}
                          onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                        />
                        <input 
                          type="text" 
                          placeholder="아이디"
                          className="px-4 py-3 bg-gray-50 rounded-xl border-none outline-none text-sm"
                          value={newStore.loginId}
                          onChange={(e) => setNewStore({ ...newStore, loginId: e.target.value })}
                        />
                        <input 
                          type="password" 
                          placeholder={editingStoreId ? "비밀번호 (변경 시 입력)" : "비밀번호"}
                          className="px-4 py-3 bg-gray-50 rounded-xl border-none outline-none text-sm"
                          value={newStore.password}
                          onChange={(e) => setNewStore({ ...newStore, password: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-2">
                        {editingStoreId && (
                          <button 
                            onClick={() => {
                              setEditingStoreId(null);
                              setNewStore({ name: '', owner: '', address: '', loginId: '', password: '' });
                            }}
                            className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all"
                          >
                            취소
                          </button>
                        )}
                        <button 
                          onClick={editingStoreId ? handleUpdateStore : handleAddStore}
                          className="flex-[2] py-3 bg-brand-red text-white font-bold rounded-xl hover:bg-brand-red/90 transition-all"
                        >
                          {editingStoreId ? '수정 완료' : '추가하기'}
                        </button>
                      </div>
                    </div>

                    {stores.length === 0 ? (
                      <div className="bg-white rounded-2xl p-12 text-center text-gray-400 danggeun-shadow">
                        등록된 가맹점이 없습니다.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {stores.map(store => (
                          <div key={store.id} className="bg-white p-5 rounded-2xl danggeun-shadow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-brand-red/10 text-brand-red rounded-xl flex items-center justify-center">
                                <StoreIcon size={24} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-lg">{store.name}</h4>
                                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold">{store.joinDate} 가입</span>
                                </div>
                                <p className="text-sm text-gray-500">{store.owner} 점주</p>
                                <p className="text-xs text-gray-400">{store.address}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                              <button 
                                onClick={() => {
                                  setEditingStoreId(store.id);
                                  setNewStore({ 
                                    name: store.name, 
                                    owner: store.owner, 
                                    address: store.address, 
                                    loginId: store.loginId, 
                                    password: '' 
                                  });
                                }}
                                className="flex-1 sm:flex-none p-2 text-gray-400 hover:text-blue-500 transition-colors"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                onClick={() => handleDeleteStore(store.id)}
                                className="flex-1 sm:flex-none p-2 text-gray-400 hover:text-brand-red transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-around items-center z-40">
        {userRole === 'franchise' ? (
          <>
            <button onClick={() => setActiveTab('shop')} className={`flex flex-col items-center gap-1 ${activeTab === 'shop' ? 'text-brand-red' : 'text-gray-400'}`}>
              <Package size={24} />
              <span className="text-[10px] font-bold">발주하기</span>
            </button>
            <button onClick={() => setActiveTab('orders')} className={`flex flex-col items-center gap-1 ${activeTab === 'orders' ? 'text-brand-red' : 'text-gray-400'}`}>
              <History size={24} />
              <span className="text-[10px] font-bold">주문내역</span>
            </button>
            <button onClick={() => setActiveTab('notices')} className={`flex flex-col items-center gap-1 ${activeTab === 'notices' ? 'text-brand-red' : 'text-gray-400'}`}>
              <Megaphone size={24} />
              <span className="text-[10px] font-bold">공지사항</span>
            </button>
            <button 
              onClick={() => {
                setIsLoggedIn(false);
                setLoginForm({ id: '', password: '' });
              }} 
              className="flex flex-col items-center gap-1 text-gray-400"
            >
              <LogOut size={24} />
              <span className="text-[10px] font-bold">로그아웃</span>
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setActiveTab('hq_dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'hq_dashboard' ? 'text-brand-red' : 'text-gray-400'}`}>
              <BarChart3 size={24} />
              <span className="text-[10px] font-bold">대시보드</span>
            </button>
            <button onClick={() => { setOrderFilter('all'); setActiveTab('hq_orders'); }} className={`flex flex-col items-center gap-1 ${activeTab === 'hq_orders' ? 'text-brand-red' : 'text-gray-400'}`}>
              <Truck size={24} />
              <span className="text-[10px] font-bold">주문관리</span>
            </button>
            <button onClick={() => setActiveTab('hq_system')} className={`flex flex-col items-center gap-1 ${activeTab === 'hq_system' ? 'text-brand-red' : 'text-gray-400'}`}>
              <Settings size={24} />
              <span className="text-[10px] font-bold">시스템관리</span>
            </button>
            <button 
              onClick={() => {
                setIsLoggedIn(false);
                setLoginForm({ id: '', password: '' });
              }} 
              className="flex flex-col items-center gap-1 text-gray-400"
            >
              <LogOut size={24} />
              <span className="text-[10px] font-bold">로그아웃</span>
            </button>
          </>
        )}
      </nav>

      {/* Desktop Sidebar Nav */}
      <div className="hidden md:block fixed left-6 top-1/2 -translate-y-1/2 space-y-4 z-30">
        {userRole === 'franchise' ? (
          <>
            <button onClick={() => setActiveTab('shop')} className={`w-14 h-14 rounded-2xl flex items-center justify-center danggeun-shadow transition-all ${activeTab === 'shop' ? 'bg-brand-red text-white scale-110' : 'bg-white text-gray-400 hover:text-brand-black'}`}>
              <Package size={24} />
            </button>
            <button onClick={() => setActiveTab('orders')} className={`w-14 h-14 rounded-2xl flex items-center justify-center danggeun-shadow transition-all ${activeTab === 'orders' ? 'bg-brand-red text-white scale-110' : 'bg-white text-gray-400 hover:text-brand-black'}`}>
              <History size={24} />
            </button>
            <button onClick={() => setActiveTab('notices')} className={`w-14 h-14 rounded-2xl flex items-center justify-center danggeun-shadow transition-all ${activeTab === 'notices' ? 'bg-brand-red text-white scale-110' : 'bg-white text-gray-400 hover:text-brand-black'}`}>
              <Megaphone size={24} />
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setActiveTab('hq_dashboard')} className={`w-14 h-14 rounded-2xl flex items-center justify-center danggeun-shadow transition-all ${activeTab === 'hq_dashboard' ? 'bg-brand-red text-white scale-110' : 'bg-white text-gray-400 hover:text-brand-black'}`}>
              <BarChart3 size={24} />
            </button>
            <button onClick={() => { setOrderFilter('all'); setActiveTab('hq_orders'); }} className={`w-14 h-14 rounded-2xl flex items-center justify-center danggeun-shadow transition-all ${activeTab === 'hq_orders' ? 'bg-brand-red text-white scale-110' : 'bg-white text-gray-400 hover:text-brand-black'}`}>
              <Truck size={24} />
            </button>
            <button onClick={() => setActiveTab('hq_system')} className={`w-14 h-14 rounded-2xl flex items-center justify-center danggeun-shadow transition-all ${activeTab === 'hq_system' ? 'bg-brand-red text-white scale-110' : 'bg-white text-gray-400 hover:text-brand-black'}`}>
              <Settings size={24} />
            </button>
          </>
        )}
      </div>

      {/* Floating Cart Button (Franchise Only) */}
      {userRole === 'franchise' && (
        <button 
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-16 h-16 bg-brand-black text-white rounded-full flex items-center justify-center danggeun-shadow hover:scale-105 transition-transform z-40"
        >
          <ShoppingCart size={28} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-brand-red text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
              {cartCount}
            </span>
          )}
        </button>
      )}

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-50 flex flex-col shadow-2xl">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">장바구니 <span className="text-brand-red">{cartCount}</span></h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                    <ShoppingCart size={48} className="opacity-20" />
                    <p>장바구니가 비어있습니다.</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 text-gray-400">
                        <ProductIcon />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="font-bold text-gray-800">{item.name}</h4>
                        <p className="text-sm text-gray-500">{item.price.toLocaleString()}원</p>
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-3 bg-brand-gray rounded-lg px-2 py-1">
                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-brand-red transition-colors"><Minus size={14} /></button>
                            <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-brand-red transition-colors"><Plus size={14} /></button>
                          </div>
                          <p className="font-bold">{(item.price * item.quantity).toLocaleString()}원</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-6 bg-gray-50 space-y-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>총 주문 금액</span>
                  <span className="text-brand-red">{cartTotal.toLocaleString()}원</span>
                </div>
                <button onClick={() => setIsConfirmModalOpen(true)} disabled={cart.length === 0} className="w-full py-4 bg-brand-red disabled:bg-gray-300 text-white font-bold rounded-2xl shadow-lg shadow-brand-red/20 hover:scale-[1.02] active:scale-95 transition-all">발주 신청하기</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isConfirmModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsConfirmModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-3xl p-6 z-[80] shadow-2xl space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center mx-auto"><AlertCircle size={32} /></div>
                <h3 className="text-xl font-bold">발주를 확정하시겠습니까?</h3>
                <p className="text-gray-500 text-sm">신청 후에는 품목 변경이 어려울 수 있습니다.</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">총 품목</span>
                  <span className="font-bold">{cartCount}개</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">총 결제 금액</span>
                  <span className="font-bold text-brand-red">{cartTotal.toLocaleString()}원</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setIsConfirmModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">취소</button>
                <button onClick={() => { setIsConfirmModalOpen(false); handlePlaceOrder(); }} className="flex-1 py-3 bg-brand-red text-white font-bold rounded-xl shadow-lg shadow-brand-red/20 hover:bg-red-600 transition-colors">확인</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Manual Order Modal */}
      <AnimatePresence>
        {isManualOrderModalOpen && (
          <React.Fragment key="manual-order-modal-fragment">
            <motion.div 
              key="manual-order-backdrop"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => {
                setIsManualOrderModalOpen(false);
                setManualOrderSearchQuery('');
              }} 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]" 
            />
            <motion.div 
              key="manual-order-content"
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-lg bg-white rounded-3xl p-6 z-[80] shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">수동 주문 등록</h3>
                <button 
                  onClick={() => {
                    setIsManualOrderModalOpen(false);
                    setManualOrderSearchQuery('');
                  }} 
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">가맹점 선택</label>
                  <select 
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none text-sm font-medium"
                    value={manualOrderData.storeName}
                    onChange={(e) => setManualOrderData({ ...manualOrderData, storeName: e.target.value })}
                  >
                    <option value="">가맹점을 선택하세요</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.name}>{store.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-500">품목 추가</label>
                    <div className="relative w-40">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                      <input 
                        type="text" 
                        placeholder="품목 검색"
                        className="w-full pl-7 pr-2 py-1.5 bg-gray-50 rounded-lg text-[10px] font-medium outline-none focus:ring-1 focus:ring-brand-red/20 transition-all"
                        value={manualOrderSearchQuery}
                        onChange={(e) => setManualOrderSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-1">
                    {products
                      .filter(p => p.name.toLowerCase().includes(manualOrderSearchQuery.toLowerCase()))
                      .map(product => {
                        const existingItem = manualOrderData.items.find(i => i.id === product.id);
                        return (
                          <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <span className="text-xs font-bold">{product.name}</span>
                            <div className="flex items-center gap-3">
                              {existingItem ? (
                                <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1 shadow-sm">
                                  <button 
                                    onClick={() => {
                                      const newItems = existingItem.quantity > 1 
                                        ? manualOrderData.items.map(i => i.id === product.id ? { ...i, quantity: i.quantity - 1 } : i)
                                        : manualOrderData.items.filter(i => i.id !== product.id);
                                      setManualOrderData({ ...manualOrderData, items: newItems });
                                    }}
                                    className="p-1 text-brand-red"
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span className="text-xs font-bold w-4 text-center">{existingItem.quantity}</span>
                                  <button 
                                    onClick={() => {
                                      const newItems = manualOrderData.items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
                                      setManualOrderData({ ...manualOrderData, items: newItems });
                                    }}
                                    className="p-1 text-brand-red"
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => setManualOrderData({ ...manualOrderData, items: [...manualOrderData.items, { ...product, quantity: 1 }] })}
                                  className="px-3 py-1 bg-brand-red text-white text-[10px] font-bold rounded-lg"
                                >
                                  추가
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    {products.filter(p => p.name.toLowerCase().includes(manualOrderSearchQuery.toLowerCase())).length === 0 && (
                      <p className="text-center py-4 text-gray-400 text-[10px]">검색 결과가 없습니다.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-gray-500">총 주문 금액</span>
                  <span className="text-lg font-black text-brand-red">
                    {manualOrderData.items.reduce((sum, i) => sum + i.price * i.quantity, 0).toLocaleString()}원
                  </span>
                </div>
                <button 
                  onClick={handleManualOrder}
                  disabled={!manualOrderData.storeName || manualOrderData.items.length === 0}
                  className="w-full py-4 bg-brand-red text-white font-bold rounded-2xl shadow-lg shadow-brand-red/20 hover:scale-[1.02] active:scale-95 transition-all disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  주문 등록 완료
                </button>
              </div>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>

      {/* Edit Order Modal */}
      <AnimatePresence>
        {isEditOrderModalOpen && selectedOrderToEdit && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditOrderModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-sm bg-white rounded-3xl p-6 z-[80] shadow-2xl space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">주문 수량 수정</h3>
                <button onClick={() => setIsEditOrderModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
              </div>
              
              <div className="space-y-4 max-h-64 overflow-y-auto p-1">
                {selectedOrderToEdit.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-400">{item.price.toLocaleString()}원</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white rounded-lg px-2 py-1 shadow-sm">
                      <button 
                        onClick={() => {
                          const newItems = item.quantity > 1 
                            ? selectedOrderToEdit.items.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i)
                            : selectedOrderToEdit.items.filter(i => i.id !== item.id);
                          setSelectedOrderToEdit({ ...selectedOrderToEdit, items: newItems });
                        }}
                        className="p-1 text-brand-red"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => {
                          const newItems = selectedOrderToEdit.items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
                          setSelectedOrderToEdit({ ...selectedOrderToEdit, items: newItems });
                        }}
                        className="p-1 text-brand-red"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-gray-500">수정 후 총 금액</span>
                  <span className="text-lg font-black text-brand-red">
                    {selectedOrderToEdit.items.reduce((sum, i) => sum + i.price * i.quantity, 0).toLocaleString()}원
                  </span>
                </div>
                <button 
                  onClick={() => handleUpdateOrderItems(selectedOrderToEdit.id, selectedOrderToEdit.items)}
                  className="w-full py-4 bg-brand-red text-white font-bold rounded-2xl shadow-lg shadow-brand-red/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  수정 완료
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {showOrderSuccess && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 50, opacity: 0 }} 
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-brand-black text-white px-6 py-3 rounded-full flex items-center gap-3 z-[100] shadow-xl"
          >
            <CheckCircle2 className="text-brand-yellow" size={20} />
            <span className="font-bold">주문이 정상적으로 등록되었습니다!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
