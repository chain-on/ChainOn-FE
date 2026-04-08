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
  Box,
  BarChart3,
  Truck,
  Calendar,
  TrendingUp,
  Megaphone,
  Settings,
  Download,
  Store as StoreIcon,
  Edit2,
  Trash2,
  LogOut,
  Lock,
  Mail,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import * as XLSX from 'xlsx';
import { 
  Item, 
  Order, 
  UserRole, 
  Notice, 
  Franchise, 
  OrderStatusStats,
  OrderStatsResponse
} from './types';
import { api } from './api';

const ProductIcon = () => <Box size={24} />;

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('FRANCHISE_USER');
  const [userInfo, setUserInfo] = useState<{ name: string; organization: string; orgId: number } | null>(null);
  const [loginForm, setLoginForm] = useState({ id: '', password: '' });
  const [activeTab, setActiveTab] = useState<'shop' | 'orders' | 'notices' | 'hq_dashboard' | 'hq_orders' | 'hq_system'>('shop');
  const [systemTab, setSystemTab] = useState<'products' | 'notices' | 'stores'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHqSignup, setShowHqSignup] = useState(false);
  const [hqSignupForm, setHqSignupForm] = useState({
    name: '',
    address: '',
    adminName: '',
    adminId: '',
    adminPassword: ''
  });
  
  // API Data States
  const [products, setProducts] = useState<Item[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [stores, setStores] = useState<Franchise[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStatusStats | null>(null);
  const [periodicStats, setPeriodicStats] = useState<OrderStatsResponse | null>(null);

  const [cart, setCart] = useState<(Item & { quantity: number })[]>([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '' });
  const [newNotice, setNewNotice] = useState({ title: '', content: '', isUrgent: false });
  const [newStore, setNewStore] = useState({ name: '', address: '', userId: '', password: '', ownerName: '' });
  const [editingStore, setEditingStore] = useState<Franchise | null>(null);
  const [editingProduct, setEditingProduct] = useState<Item | null>(null);
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [orderFilter, setOrderFilter] = useState<'all' | 'active'>('all');

  // --- Session Restoration ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedRole = localStorage.getItem('userRole') as UserRole;
    const savedName = localStorage.getItem('userName');
    const savedOrg = localStorage.getItem('userOrg');
    const savedOrgId = localStorage.getItem('userOrgId');

    if (token && savedRole && savedName) {
      setUserRole(savedRole);
      setUserInfo({ 
        name: savedName, 
        organization: savedOrg || '', 
        orgId: savedOrgId ? parseInt(savedOrgId) : 0 
      });
      setIsLoggedIn(true);
    }
  }, []);

  // --- Initial Data Fetch ---
  useEffect(() => {
    if (isLoggedIn) {
      loadInitialData();
    }
  }, [isLoggedIn, userRole]);

  const loadInitialData = async () => {
    try {
      const [prodList, noticeList] = await Promise.all([
        api.item.list().catch(() => []),
        api.notice.list().catch(() => [])
      ]);
      setProducts(prodList || []);
      setNotices(noticeList || []);

      if (userRole === 'HQ_ADMIN') {
        const [orderList, franchiseList, statusStats] = await Promise.all([
          api.order.getAllOrders().catch(() => []),
          api.org.list().catch(() => []),
          api.stats.getStatusCounts().catch(() => null)
        ]);
        setOrders(orderList || []);
        setStores(franchiseList || []);
        setStats(statusStats);
        loadPeriodicStats(statsPeriod);
      } else {
        const myOrders = await api.order.getMyOrders().catch(() => []);
        setOrders(myOrders || []);
      }
    } catch (error) {
      console.error('Data loading error:', error);
    }
  };

  const loadPeriodicStats = async (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    try {
      const data = await api.stats.getPeriodicStats(period).catch(() => null);
      setPeriodicStats(data);
    } catch (error) {
      console.error('Stats loading error:', error);
    }
  };

  useEffect(() => {
    if (isLoggedIn && userRole === 'HQ_ADMIN') {
      loadPeriodicStats(statsPeriod);
    }
  }, [statsPeriod]);

  // Sync tab with role
  useEffect(() => {
    if (isLoggedIn) {
      setActiveTab(userRole === 'HQ_ADMIN' ? 'hq_dashboard' : 'shop');
    }
  }, [userRole, isLoggedIn]);

  // --- Handlers ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await api.auth.login(loginForm);
      // 백엔드 응답 필드명이 다를 수 있으므로 다양한 가능성 체크 (orgId, organizationId, id 등)
      // nullish coalescing (??) 사용
      const orgId = result.orgId ?? (result as any).organizationId ?? (result as any).id ?? 0;
      
      localStorage.setItem('token', result.tokenResponse.accessToken);
      localStorage.setItem('userRole', result.tokenResponse.role);
      localStorage.setItem('userName', result.name);
      localStorage.setItem('userOrg', result.organization || '');
      localStorage.setItem('userOrgId', orgId.toString());
      
      setUserRole(result.tokenResponse.role);
      setUserInfo({ 
        name: result.name, 
        organization: result.organization || '', 
        orgId: orgId 
      });
      setIsLoggedIn(true);
    } catch (error: any) {
      alert(error.message || '로그인에 실패했습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout().catch(() => {});
    } catch (e) {}
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userOrg');
    localStorage.removeItem('userOrgId');
    setIsLoggedIn(false);
    setUserInfo(null);
    setCart([]);
    setOrders([]);
  };

  const handleHqSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hqSignupForm.name || !hqSignupForm.adminId || !hqSignupForm.adminPassword) {
      alert('본사 이름, 아이디, 비밀번호는 필수입니다.');
      return;
    }
    try {
      const hqOrg = await api.org.createHeadquarter({
        name: hqSignupForm.name,
        address: hqSignupForm.address
      });

      await api.auth.signup({
        loginId: hqSignupForm.adminId,
        password: hqSignupForm.adminPassword,
        name: hqSignupForm.adminName || hqSignupForm.name,
        organizationId: hqOrg.orgId
      }, true);

      alert('본사 및 어드민 계정이 등록되었습니다. 로그인해주세요.');
      setShowHqSignup(false);
      setLoginForm({ id: hqSignupForm.adminId, password: hqSignupForm.adminPassword });
    } catch (error: any) {
      alert(error.message || '등록에 실패했습니다.');
    }
  };

  const addToCart = (product: Item) => {
    setCart(prev => {
      const existing = prev.find(item => item.ItemId === product.ItemId);
      if (existing) {
        return prev.map(item => 
          item.ItemId === product.ItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.ItemId === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    try {
      await api.order.create(cart.map(item => ({ itemId: item.ItemId, quantity: item.quantity })));
      setCart([]);
      setIsCartOpen(false);
      setShowOrderSuccess(true);
      setTimeout(() => setShowOrderSuccess(false), 3000);
      const myOrders = await api.order.getMyOrders().catch(() => []);
      setOrders(myOrders || []);
    } catch (error: any) {
      alert(error.message || '주문에 실패했습니다.');
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) return;
    try {
      await api.item.create({ name: newProduct.name, price: parseInt(newProduct.price) });
      setNewProduct({ name: '', price: '' });
      const list = await api.item.list();
      setProducts(list || []);
    } catch (error: any) { alert(error.message); }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct || !editingProduct.name || !editingProduct.price) return;
    try {
      await api.item.update(editingProduct.ItemId, { name: editingProduct.name, price: editingProduct.price });
      setEditingProduct(null);
      const list = await api.item.list();
      setProducts(list || []);
    } catch (error: any) { alert(error.message); }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('품목을 삭제하시겠습니까?')) return;
    try {
      await api.item.delete(id);
      setProducts(products.filter(p => p.ItemId !== id));
    } catch (error: any) { alert(error.message); }
  };

  const handleAddNotice = async () => {
    if (!newNotice.title || !newNotice.content) return;
    try {
      await api.notice.create({ ...newNotice });
      setNewNotice({ title: '', content: '', isUrgent: false });
      const list = await api.notice.list();
      setNotices(list || []);
    } catch (error: any) { alert(error.message); }
  };

  const handleDeleteNotice = async (id: number) => {
    if (!confirm('공지사항을 삭제하시겠습니까?')) return;
    try {
      await api.notice.delete(id);
      setNotices(notices.filter(n => n.id !== id));
    } catch (error: any) { alert(error.message); }
  };

  const handleAddStore = async () => {
    if (!newStore.name || !newStore.userId || !newStore.password) {
      alert('가맹점 이름, ID, 비밀번호는 필수입니다.');
      return;
    }
    // orgId가 0일 수도 있으므로 null/undefined만 체크
    if (userInfo?.orgId === undefined || userInfo?.orgId === null) {
      alert('로그인 정보에 조직 ID가 없습니다. 다시 로그인해주세요.');
      return;
    }
    try {
      const createdOrg = await api.org.create({ 
        name: newStore.name, 
        address: newStore.address, 
        parentId: userInfo.orgId 
      });
      
      await api.auth.signup({
        loginId: newStore.userId,
        password: newStore.password,
        name: newStore.ownerName || newStore.name,
        organizationId: createdOrg.orgId
      });
      alert('가맹점이 등록되었습니다.');
      setNewStore({ name: '', address: '', userId: '', password: '', ownerName: '' });
      const list = await api.org.list();
      setStores(list || []);
    } catch (error: any) { alert(error.message); }
  };

  const handleUpdateStore = async () => {
    if (!editingStore || !editingStore.name) return;
    try {
      await api.org.update(editingStore.orgId, { name: editingStore.name, address: editingStore.address });
      alert('가맹점 정보가 수정되었습니다.');
      setEditingStore(null);
      const list = await api.org.list();
      setStores(list || []);
    } catch (error: any) { alert(error.message); }
  };

  const handleDeleteStore = async (id: number) => {
    if (!confirm('가맹점을 삭제하시겠습니까?')) return;
    try {
      await api.org.delete(id);
      setStores(stores.filter(s => s.orgId !== id));
    } catch (error: any) { alert(error.message); }
  };

  const handleExportToExcel = () => {
    const ordersToExport = userRole === 'HQ_ADMIN' ? filteredOrders : orders;
    if (!ordersToExport || ordersToExport.length === 0) {
      alert('내보낼 주문 내역이 없습니다.');
      return;
    }

    const exportData = ordersToExport.flatMap(order => 
      order.items.map(item => ({
        '주문번호': `#ORD-${order.orderId}`,
        '가맹점': order.organizationName,
        '상태': order.status === 'PENDING' ? '승인 대기' : order.status === 'APPROVED' ? '배송 준비' : '처리 완료',
        '주문일시': order.createdAt ? new Date(order.createdAt).toLocaleString() : '-',
        '상품명': item.name,
        '단가': item.price,
        '수량': item.quantity,
        '금액': item.price * item.quantity,
        '총합계': order.totalPrice
      }))
    );

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "주문내역");
    XLSX.writeFile(workbook, `주문내역_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const updateOrderStatus = async (orderId: number) => {
    try {
      await api.order.updateStatus(orderId);
      const [orderList, statusStats] = await Promise.all([
        api.order.getAllOrders().catch(() => []),
        api.stats.getStatusCounts().catch(() => null)
      ]);
      setOrders(orderList || []);
      setStats(statusStats);
    } catch (error: any) { alert(error.message); }
  };

  // --- Memoized Values ---
  const filteredProducts = useMemo(() => {
    return (products || []).filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredOrders = useMemo(() => {
    const baseOrders = Array.isArray(orders) ? orders : [];
    let result = baseOrders;
    if (orderFilter === 'active') {
      result = result.filter(o => o.status === 'PENDING' || o.status === 'APPROVED');
    }
    if (searchQuery) {
      result = result.filter(o => 
        o.orderId?.toString().includes(searchQuery) || 
        o.organizationName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [orders, orderFilter, searchQuery]);

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-brand-gray flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white rounded-3xl danggeun-shadow p-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="mx-auto flex justify-center">
              <img src="/logo.png" alt="로고" className="w-24 h-auto rounded-2xl danggeun-shadow" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight pt-2">체인ON본부</h1>
            <p className="text-gray-400 text-sm font-medium">가맹점 및 본사 통합 관리 솔루션</p>
          </div>

          {showHqSignup ? (
            <form onSubmit={handleHqSignup} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 ml-1">본사 정보</label>
                  <input type="text" placeholder="본사 이름" className="w-full px-4 py-4 bg-gray-50 rounded-2xl border-none outline-none text-sm font-medium focus:ring-2 focus:ring-brand-red/10 transition-all" value={hqSignupForm.name} onChange={(e) => setHqSignupForm({ ...hqSignupForm, name: e.target.value })} />
                  <input type="text" placeholder="본사 주소" className="w-full px-4 py-4 bg-gray-50 rounded-2xl border-none outline-none text-sm font-medium focus:ring-2 focus:ring-brand-red/10 transition-all" value={hqSignupForm.address} onChange={(e) => setHqSignupForm({ ...hqSignupForm, address: e.target.value })} />
                </div>
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <label className="text-xs font-bold text-gray-500 ml-1">관리자 계정</label>
                  <input type="text" placeholder="관리자 이름" className="w-full px-4 py-4 bg-gray-50 rounded-2xl border-none outline-none text-sm font-medium focus:ring-2 focus:ring-brand-red/10 transition-all" value={hqSignupForm.adminName} onChange={(e) => setHqSignupForm({ ...hqSignupForm, adminName: e.target.value })} />
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="아이디" className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none outline-none text-sm font-medium focus:ring-2 focus:ring-brand-red/10 transition-all" value={hqSignupForm.adminId} onChange={(e) => setHqSignupForm({ ...hqSignupForm, adminId: e.target.value })} />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="password" placeholder="비밀번호" className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none outline-none text-sm font-medium focus:ring-2 focus:ring-brand-red/10 transition-all" value={hqSignupForm.adminPassword} onChange={(e) => setHqSignupForm({ ...hqSignupForm, adminPassword: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="pt-4 space-y-3">
                <button type="submit" className="w-full py-4 bg-brand-red text-white font-bold rounded-2xl hover:bg-brand-red/90 transition-all shadow-lg shadow-brand-red/20 active:scale-[0.98]">본사 등록하기</button>
                <button type="button" onClick={() => setShowHqSignup(false)} className="w-full py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-[0.98]">돌아가기</button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 ml-1">아이디</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="아이디" className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none outline-none text-sm font-medium focus:ring-2 focus:ring-brand-red/10 transition-all" value={loginForm.id} onChange={(e) => setLoginForm({ ...loginForm, id: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 ml-1">비밀번호</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="password" placeholder="비밀번호" className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none outline-none text-sm font-medium focus:ring-2 focus:ring-brand-red/10 transition-all" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-brand-red text-white font-bold rounded-2xl hover:bg-brand-red/90 transition-all shadow-lg shadow-brand-red/20 active:scale-[0.98]">로그인</button>
              </form>
              
              <div className="text-center">
                <button 
                  onClick={() => setShowHqSignup(true)}
                  className="text-sm font-bold text-gray-400 hover:text-brand-red transition-colors flex items-center justify-center gap-1 mx-auto"
                >
                  본사 계정이 필요하신가요? <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-gray pb-20 md:pb-0 font-sans text-brand-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="로고" className="w-8 h-8 rounded-lg object-cover" />
          <h1 className="text-lg font-bold tracking-tight">체인ON본부</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleLogout} className="p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors flex items-center gap-1">
            <LogOut size={20} /><span className="text-xs font-bold hidden sm:inline">로그아웃</span>
          </button>
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-gray-100">
            <div className="text-right">
              <p className="text-xs text-gray-500 font-bold">
                {userRole === 'HQ_ADMIN' 
                  ? '본사 관리자' 
                  : userInfo?.organization || '가맹점'}
              </p>
              <p className="text-sm font-semibold">{userInfo?.name || '사용자'}님</p>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${userRole === 'HQ_ADMIN' ? 'bg-brand-black text-white' : 'bg-brand-yellow text-brand-black'}`}>
              <User size={18} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6">
        {/* Franchise View */}
        {userRole === 'FRANCHISE_USER' && (
          <>
            {activeTab === 'shop' && (
              <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="text" placeholder="필요한 물품을 검색해보세요" className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border-none danggeun-shadow outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(filteredProducts || []).map(product => {
                    const cartItem = cart.find(item => item.ItemId === product.ItemId);
                    return (
                      <div key={product.ItemId} className="bg-white rounded-2xl p-4 flex gap-4 items-center danggeun-shadow border-2 border-transparent hover:border-brand-red/10 transition-all">
                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 text-gray-400">
                          <ProductIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-800 truncate">{product.name}</h3>
                          <p className="text-sm font-bold text-gray-900">{product.price.toLocaleString()}원</p>
                        </div>
                        <button onClick={() => addToCart(product)} className={`w-10 h-10 rounded-xl flex items-center justify-center ${cartItem ? 'bg-brand-red text-white' : 'bg-brand-yellow text-brand-black'}`}>
                          <Plus size={20} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">내 주문 내역</h2>
                  <button 
                    onClick={handleExportToExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition-colors"
                  >
                    <Download size={14} />
                    엑셀 저장
                  </button>
                </div>
                {!orders || orders.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center text-gray-400 danggeun-shadow">주문 내역이 없습니다.</div>
                ) : (
                  orders.map(order => (
                    <div key={order.orderId} className="bg-white rounded-2xl p-5 danggeun-shadow space-y-4">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-xs text-gray-400">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}</p>
                          <h3 className="font-bold">#ORD-{order.orderId}</h3>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          order.status === 'PENDING' ? 'bg-brand-yellow/20 text-brand-black' : 
                          order.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {order.status === 'PENDING' ? '승인 대기' : 
                           order.status === 'APPROVED' ? '배송 준비' : '처리 완료'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {order.items?.map(item => (
                          <div key={item.id} className="flex justify-between text-sm text-gray-600">
                            <span>{item.name} x {item.quantity}</span>
                            <span>{(item.price * item.quantity).toLocaleString()}원</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t font-bold flex justify-between">
                        <span>총 합계</span>
                        <span>{(order.totalPrice || 0).toLocaleString()}원</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            {activeTab === 'notices' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">공지사항</h2>
                {(notices || []).map(notice => (
                  <div key={notice.id} className={`bg-white rounded-2xl p-5 danggeun-shadow space-y-2 border-l-4 ${notice.isUrgent ? 'border-brand-red' : 'border-transparent'}`}>
                    <div className="flex items-center gap-2">
                      {notice.isUrgent && <span className="bg-brand-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded">긴급</span>}
                      <span className="text-xs text-gray-400">{notice.createdAt ? new Date(notice.createdAt).toLocaleDateString() : '-'}</span>
                    </div>
                    <h3 className="font-bold text-lg">{notice.title}</h3>
                    <p className="text-sm text-gray-600">{notice.content}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* HQ View */}
        {userRole === 'HQ_ADMIN' && (
          <div className="space-y-6">
            {activeTab === 'hq_dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-3xl danggeun-shadow space-y-4 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-4">처리 현황</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500 font-bold">승인 대기</p>
                          <p className="text-2xl font-black text-brand-red">{stats?.pending || 0}<span className="text-xs ml-1">건</span></p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500 font-bold">배송 준비</p>
                          <p className="text-2xl font-black text-brand-black">{stats?.approved || 0}<span className="text-xs ml-1">건</span></p>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setOrderFilter('active');
                        setActiveTab('hq_orders');
                      }}
                      className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-brand-red text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
                    >
                      주문 처리하러 가기 <ChevronRight size={14} />
                    </button>
                  </div>
                  <div className="bg-white p-6 rounded-3xl danggeun-shadow space-y-4">
                    <h3 className="font-bold text-xs uppercase text-gray-400">최근 주문</h3>
                    <div className="space-y-2 text-xs">
                      {(orders || []).slice(0, 3).map(o => (
                        <div key={o.orderId} className="flex justify-between p-2.5 bg-gray-50 rounded-xl">
                          <span className="font-bold text-brand-red truncate max-w-[120px]">{o.organizationName}</span>
                          <span className="font-bold">{(o.totalPrice || 0).toLocaleString()}원</span>
                        </div>
                      ))}
                      {(!orders || orders.length === 0) && <p className="text-center py-4 text-gray-400">최근 주문이 없습니다.</p>}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 매출 추이 차트 */}
                  <div className="bg-white p-6 rounded-2xl danggeun-shadow">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <BarChart3 size={20} className="text-brand-red" /> 매출 추이
                      </h3>
                      <div className="flex bg-gray-100 p-1 rounded-lg">
                        {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(p => (
                          <button key={p} onClick={() => setStatsPeriod(p)} className={`px-3 py-1 text-[10px] font-bold rounded-md ${statsPeriod === p ? 'bg-white text-brand-red shadow-sm' : 'text-gray-400'}`}>
                            {p === 'daily' ? '일' : p === 'weekly' ? '주' : p === 'monthly' ? '월' : '년'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={periodicStats?.trends || []}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                          <XAxis dataKey="date" hide />
                          <YAxis hide />
                          <Tooltip />
                          <Area type="monotone" dataKey="revenue" stroke="#FF0000" fill="#FF000022" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 지점 매출 랭킹 복구 */}
                  <div className="bg-white p-6 rounded-2xl danggeun-shadow space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <TrendingUp size={20} className="text-brand-red" /> 지점 매출 랭킹
                      </h3>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">{statsPeriod} TOP 5</span>
                    </div>
                    <div className="space-y-4">
                      {!periodicStats?.ranks || periodicStats.ranks.length === 0 ? (
                        <div className="h-[200px] flex items-center justify-center text-gray-400 text-xs font-bold">데이터가 없습니다.</div>
                      ) : (
                        periodicStats.ranks.map((item, idx) => (
                          <div key={item.orgName} className="flex items-center gap-4">
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                              idx === 0 ? 'bg-brand-yellow text-brand-black' : 
                              idx === 1 ? 'bg-gray-200 text-gray-600' : 
                              idx === 2 ? 'bg-orange-100 text-orange-600' : 'text-gray-400'
                            }`}>
                              {idx + 1}
                            </span>
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-bold">{item.orgName}</span>
                                <span className="text-sm font-bold">{item.revenue.toLocaleString()}원</span>
                              </div>
                              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(item.revenue / periodicStats.ranks[0].revenue) * 100}%` }}
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
            )}
            {activeTab === 'hq_orders' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">전체 주문 관리</h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleExportToExcel}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition-colors"
                    >
                      <Download size={14} />
                      엑셀 저장
                    </button>
                    <button onClick={() => { setOrderFilter('all'); setActiveTab('hq_orders'); }} className={`px-4 py-2 rounded-xl text-xs font-bold ${orderFilter === 'all' ? 'bg-brand-black text-white' : 'bg-white text-gray-500 border'}`}>전체</button>
                    <button onClick={() => { setOrderFilter('active'); setActiveTab('hq_orders'); }} className={`px-4 py-2 rounded-xl text-xs font-bold ${orderFilter === 'active' ? 'bg-brand-red text-white' : 'bg-white text-gray-500 border'}`}>진행중</button>
                  </div>
                </div>
                {(!filteredOrders || filteredOrders.length === 0) ? (
                  <div className="bg-white rounded-2xl p-12 text-center text-gray-400 danggeun-shadow">해당하는 주문이 없습니다.</div>
                ) : (
                  filteredOrders.map(order => (
                    <div key={order.orderId} className="bg-white rounded-2xl p-5 danggeun-shadow space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs font-bold text-brand-red">{order.organizationName}</p>
                            <span className="text-[10px] text-gray-400">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}</span>
                          </div>
                          <h3 className="font-bold">#ORD-{order.orderId}</h3>
                        </div>
                        <div className="flex gap-2">
                          {order.status === 'PENDING' && (
                            <button onClick={() => updateOrderStatus(order.orderId)} className="px-4 py-2 bg-brand-yellow text-brand-black text-xs font-bold rounded-xl">주문 승인</button>
                          )}
                          {order.status === 'APPROVED' && (
                            <button onClick={() => updateOrderStatus(order.orderId)} className="px-4 py-2 bg-green-500 text-white text-xs font-bold rounded-xl">배송 완료</button>
                          )}
                          <span className={`px-3 py-2 rounded-xl text-[10px] font-bold ${
                            order.status === 'PENDING' ? 'bg-gray-100 text-gray-400' : 
                            order.status === 'APPROVED' ? 'bg-blue-50 text-blue-500' :
                            'bg-green-50 text-green-500'
                          }`}>
                            {order.status === 'PENDING' ? '승인 대기' : order.status === 'APPROVED' ? '배송 준비' : '처리 완료'}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl space-y-2">
                        {order.items?.map(item => (
                          <div key={item.id} className="flex justify-between">
                            <span>{item.name}</span>
                            <span className="font-bold">{item.quantity}개</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-brand-red text-lg">{(order.totalPrice || 0).toLocaleString()}원</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            {activeTab === 'hq_system' && (
              <div className="space-y-6">
                <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                  {(['products', 'notices', 'stores'] as const).map(tab => (
                    <button key={tab} onClick={() => setSystemTab(tab)} className={`px-4 py-2 text-xs font-bold rounded-lg ${systemTab === tab ? 'bg-white text-brand-red shadow-sm' : 'text-gray-400'}`}>
                      {tab === 'products' ? '품목' : tab === 'notices' ? '공지' : '가맹점'}
                    </button>
                  ))}
                </div>
                {systemTab === 'products' && (
                  <div className="space-y-4">
                    <div className="bg-white p-6 rounded-2xl danggeun-shadow space-y-4">
                      <h3 className="font-bold text-sm">새 품목 추가</h3>
                      <div className="flex gap-2">
                        <input type="text" placeholder="상품명" className="flex-1 px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                        <input type="number" placeholder="가격" className="w-32 px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                        <button onClick={handleAddProduct} className="px-6 bg-brand-red text-white font-bold rounded-xl">추가</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(products || []).map(p => (
                        <div key={p.ItemId} className="bg-white p-4 rounded-2xl danggeun-shadow flex justify-between items-center group">
                          {editingProduct?.ItemId === p.ItemId ? (
                            <div className="flex-1 flex gap-2 items-center">
                              <input 
                                type="text" 
                                className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm outline-none border border-brand-red/20" 
                                value={editingProduct.name} 
                                onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} 
                              />
                              <input 
                                type="number" 
                                className="w-24 px-3 py-2 bg-gray-50 rounded-lg text-sm outline-none border border-brand-red/20" 
                                value={editingProduct.price} 
                                onChange={e => setEditingProduct({...editingProduct, price: parseInt(e.target.value)})} 
                              />
                              <button onClick={handleUpdateProduct} className="p-2 text-brand-red hover:bg-brand-red/5 rounded-lg"><CheckCircle2 size={18} /></button>
                              <button onClick={() => setEditingProduct(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
                            </div>
                          ) : (
                            <>
                              <div>
                                <h4 className="font-bold">{p.name}</h4>
                                <p className="text-sm text-gray-500">{p.price.toLocaleString()}원</p>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditingProduct(p)} className="p-2 text-gray-400 hover:text-brand-black hover:bg-gray-100 rounded-lg"><Edit2 size={16} /></button>
                                <button onClick={() => handleDeleteProduct(p.ItemId)} className="p-2 text-gray-400 hover:text-brand-red hover:bg-gray-100 rounded-lg"><Trash2 size={16} /></button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {systemTab === 'notices' && (
                  <div className="space-y-4">
                    <div className="bg-white p-6 rounded-2xl danggeun-shadow space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-brand-black">새 공지 등록</h3>
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded text-brand-red border-gray-300 focus:ring-brand-red accent-brand-red"
                            checked={newNotice.isUrgent}
                            onChange={e => setNewNotice({...newNotice, isUrgent: e.target.checked})}
                          />
                          <span className={`text-xs font-bold transition-colors ${newNotice.isUrgent ? 'text-brand-red' : 'text-gray-400'}`}>긴급 공지</span>
                        </label>
                      </div>
                      <input type="text" placeholder="제목" className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none" value={newNotice.title} onChange={e => setNewNotice({...newNotice, title: e.target.value})} />
                      <textarea placeholder="내용" className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none h-24" value={newNotice.content} onChange={e => setNewNotice({...newNotice, content: e.target.value})} />
                      <button onClick={handleAddNotice} className="w-full py-3 bg-brand-red text-white font-bold rounded-xl">공지 등록</button>
                    </div>
                    {(notices || []).map(n => (
                      <div key={n.id} className={`bg-white p-5 rounded-2xl danggeun-shadow relative border-l-4 ${n.isUrgent ? 'border-brand-red' : 'border-transparent'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {n.isUrgent && <span className="bg-brand-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded">긴급</span>}
                          <span className="text-xs text-gray-400">{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : '-'}</span>
                        </div>
                        <h3 className="font-bold">{n.title}</h3>
                        <p className="text-sm text-gray-500">{n.content}</p>
                        <button onClick={() => handleDeleteNotice(n.id)} className="absolute top-4 right-4 text-gray-300 hover:text-brand-red"><X size={18} /></button>
                      </div>
                    ))}
                  </div>
                )}
                {systemTab === 'stores' && (
                  <div className="space-y-4">
                    {editingStore ? (
                      <div className="bg-white p-6 rounded-2xl danggeun-shadow space-y-4 border-2 border-brand-red/20">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-sm text-brand-red">가맹점 정보 수정</h3>
                          <button onClick={() => setEditingStore(null)} className="text-gray-400"><X size={18} /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" placeholder="가맹점 이름" className="px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-1 ring-brand-red" value={editingStore.name} onChange={e => setEditingStore({...editingStore, name: e.target.value})} />
                          <input type="text" placeholder="주소" className="px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-1 ring-brand-red" value={editingStore.address} onChange={e => setEditingStore({...editingStore, address: e.target.value})} />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingStore(null)} className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl">취소</button>
                          <button onClick={handleUpdateStore} className="flex-[2] py-3 bg-brand-red text-white font-bold rounded-xl">수정 완료</button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white p-6 rounded-2xl danggeun-shadow space-y-4">
                        <h3 className="font-bold text-sm">새 가맹점 등록</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" placeholder="가맹점 이름" className="px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none" value={newStore.name} onChange={e => setNewStore({...newStore, name: e.target.value})} />
                          <input type="text" placeholder="주소" className="px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none" value={newStore.address} onChange={e => setNewStore({...newStore, address: e.target.value})} />
                          <input type="text" placeholder="관리자 ID" className="px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none" value={newStore.userId} onChange={e => setNewStore({...newStore, userId: e.target.value})} />
                          <input type="password" placeholder="비밀번호" className="px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none" value={newStore.password} onChange={e => setNewStore({...newStore, password: e.target.value})} />
                          <input type="text" placeholder="점주 이름" className="col-span-2 px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none" value={newStore.ownerName} onChange={e => setNewStore({...newStore, ownerName: e.target.value})} />
                        </div>
                        <button onClick={handleAddStore} className="w-full py-3 bg-brand-red text-white font-bold rounded-xl">가맹점 등록</button>
                      </div>
                    )}
                    {(stores || []).map(s => (
                      <div key={s.orgId} className="bg-white p-5 rounded-2xl danggeun-shadow flex justify-between items-center group relative">
                        <div>
                          <h3 className="font-bold">{s.name}</h3>
                          <p className="text-xs text-gray-500">{s.address}</p>
                          <p className="text-[10px] text-gray-400 mt-1">관리자: {s.userName}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingStore(s)} className="text-gray-300 hover:text-brand-black transition-colors"><Settings size={18} /></button>
                          <button onClick={() => handleDeleteStore(s.orgId)} className="text-gray-300 hover:text-brand-red transition-colors"><X size={18} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-3 flex justify-around md:hidden z-40">
        {userRole === 'FRANCHISE_USER' ? (
          <>
            <button onClick={() => setActiveTab('shop')} className={activeTab === 'shop' ? 'text-brand-red' : 'text-gray-400'}><Package /><span className="text-[10px] block font-bold">발주</span></button>
            <button onClick={() => setActiveTab('orders')} className={activeTab === 'orders' ? 'text-brand-red' : 'text-gray-400'}><History /><span className="text-[10px] block font-bold">내역</span></button>
            <button onClick={() => setActiveTab('notices')} className={activeTab === 'notices' ? 'text-brand-red' : 'text-gray-400'}><Bell /><span className="text-[10px] block font-bold">공지</span></button>
          </>
        ) : (
          <>
            <button onClick={() => setActiveTab('hq_dashboard')} className={activeTab === 'hq_dashboard' ? 'text-brand-red' : 'text-gray-400'}><BarChart3 /><span className="text-[10px] block font-bold">홈</span></button>
            <button onClick={() => { setOrderFilter('all'); setActiveTab('hq_orders'); }} className={activeTab === 'hq_orders' ? 'text-brand-red' : 'text-gray-400'}><Truck /><span className="text-[10px] block font-bold">주문</span></button>
            <button onClick={() => setActiveTab('hq_system')} className={activeTab === 'hq_system' ? 'text-brand-red' : 'text-gray-400'}><Settings /><span className="text-[10px] block font-bold">관리</span></button>
          </>
        )}
      </nav>

      <div className="hidden md:flex fixed left-6 top-1/2 -translate-y-1/2 flex-col gap-4 z-30">
        {userRole === 'FRANCHISE_USER' ? (
          <>
            <button onClick={() => setActiveTab('shop')} className={`w-12 h-12 rounded-xl flex items-center justify-center danggeun-shadow transition-all ${activeTab === 'shop' ? 'bg-brand-red text-white' : 'bg-white text-gray-400'}`}><Package /></button>
            <button onClick={() => setActiveTab('orders')} className={`w-12 h-12 rounded-xl flex items-center justify-center danggeun-shadow transition-all ${activeTab === 'orders' ? 'bg-brand-red text-white' : 'bg-white text-gray-400'}`}><History /></button>
            <button onClick={() => setActiveTab('notices')} className={`w-12 h-12 rounded-xl flex items-center justify-center danggeun-shadow transition-all ${activeTab === 'notices' ? 'bg-brand-red text-white' : 'bg-white text-gray-400'}`}><Bell /></button>
          </>
        ) : (
          <>
            <button onClick={() => setActiveTab('hq_dashboard')} className={`w-12 h-12 rounded-xl flex items-center justify-center danggeun-shadow transition-all ${activeTab === 'hq_dashboard' ? 'bg-brand-red text-white' : 'bg-white text-gray-400'}`}><BarChart3 /></button>
            <button onClick={() => { setOrderFilter('all'); setActiveTab('hq_orders'); }} className={`w-12 h-12 rounded-xl flex items-center justify-center danggeun-shadow transition-all ${activeTab === 'hq_orders' ? 'bg-brand-red text-white' : 'bg-white text-gray-400'}`}><Truck /></button>
            <button onClick={() => setActiveTab('hq_system')} className={`w-12 h-12 rounded-xl flex items-center justify-center danggeun-shadow transition-all ${activeTab === 'hq_system' ? 'bg-brand-red text-white' : 'bg-white text-gray-400'}`}><Settings /></button>
          </>
        )}
      </div>

      {userRole === 'FRANCHISE_USER' && (
        <button onClick={() => setIsCartOpen(true)} className="fixed bottom-24 right-6 w-14 h-14 bg-brand-black text-white rounded-full flex items-center justify-center shadow-xl z-40">
          <ShoppingCart />{cartCount > 0 && <span className="absolute -top-1 -right-1 bg-brand-red text-[10px] px-1.5 py-0.5 rounded-full border border-white">{cartCount}</span>}
        </button>
      )}

      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black/40 z-50" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 bottom-0 w-80 bg-white z-50 flex flex-col p-6 shadow-2xl text-brand-black">
              <div className="flex justify-between items-center mb-6"><h2 className="font-bold text-lg">장바구니 <span className="text-brand-red">{cartCount}</span></h2><button onClick={() => setIsCartOpen(false)}><X /></button></div>
              <div className="flex-1 overflow-auto space-y-4 pr-1">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2"><ShoppingCart size={40} className="opacity-20" /><p>비어있습니다.</p></div>
                ) : (
                  cart.map(item => (
                    <div key={item.ItemId} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                      <div><p className="font-bold text-sm">{item.name}</p><p className="text-xs text-brand-red font-bold">{item.price.toLocaleString()}원</p></div>
                      <div className="flex items-center gap-3 bg-white rounded-lg px-2 py-1 shadow-sm"><button onClick={() => updateQuantity(item.ItemId, -1)} className="p-1 text-gray-400"><Minus size={12} /></button><span className="text-xs font-bold w-4 text-center">{item.quantity}</span><button onClick={() => updateQuantity(item.ItemId, 1)} className="p-1 text-brand-red"><Plus size={12} /></button></div>
                    </div>
                  ))
                )}
              </div>
              <div className="pt-6 border-t space-y-4">
                <div className="flex justify-between font-bold text-lg"><span>총 합계</span><span className="text-brand-red">{cartTotal.toLocaleString()}원</span></div>
                <button onClick={handlePlaceOrder} disabled={cart.length === 0} className="w-full py-4 bg-brand-red disabled:bg-gray-200 text-white font-bold rounded-xl shadow-lg shadow-brand-red/20">발주 신청하기</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOrderSuccess && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-brand-black text-white px-6 py-3 rounded-full flex items-center gap-3 z-[100] shadow-xl">
            <CheckCircle2 className="text-brand-yellow" size={20} />
            <span className="font-bold text-sm">주문이 정상적으로 등록되었습니다!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
