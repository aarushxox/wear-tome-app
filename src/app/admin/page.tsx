'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3, ShoppingBag, Users, Layers, Ticket, FileText,
  MessageSquare, Bell, Settings, Percent, Activity, Search, Eye,
  X, ShieldAlert, CheckCircle2, RotateCcw, Ban, Trash2, ArrowUpRight,
  Plus, Minus, Save, Send, Check, GripVertical
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AdminDashboard() {
  const router = useRouter();

  // Active sub-module view state: 'overview', 'orders', 'users', 'products', 'coupons', 'chat'
  const [activeModule, setActiveModule] = useState('overview');

  // Database metrics
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [overviewKpis, setOverviewKpis] = useState<any>({
    totalOrders: 0,
    totalRevenue: 0,
    activeUsers: 0,
    pendingShipments: 0,
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  // 1. Products CRUD & Seating State
  const [products, setProducts] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [prodForm, setProdForm] = useState({
    name: '', price: '', stock: '', category_id: '1', subcategory: '',
    gender_target: 'unisex', sizes: '["XS", "S", "M", "L"]', colors: '["#000000"]',
    quality_grade: 'AAA Grade', is_trending: false, discount_percent: '0',
    display_price_strikethrough: false, images: '["/images/products/new-primary.webp", "/images/products/new-alternate.webp"]'
  });

  // 2. Coupons State
  const [coupons, setCoupons] = useState<any[]>([]);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [coupForm, setCoupForm] = useState({
    code: '', type: 'public_pro', discount_value: '10', discount_type: 'percent',
    max_redemptions: '100', active_from: '2026-01-01', active_to: '2027-12-31', per_account_limit: '1'
  });

  // 3. Chat Support State
  const [chatThreads, setChatThreads] = useState<any[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [typedMessage, setTypedMessage] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Detailed drawers
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedOrderItems, setSelectedOrderOrderItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderFilter, setOrderStatusFilter] = useState('All');

  // Sidebar expanded vs collapsed state
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  useEffect(() => {
    // Authenticate session and roles (matrix checked)
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.push('/login');
        } else if (!['Admin', 'Sub-admin', 'Manager', 'Customer Care'].includes(data.user.role)) {
          alert('Forbidden. Staff credential is required.');
          router.push('/');
        } else {
          setSessionUser(data.user);
          loadKpis();
          loadOrders();
          loadUsers();
          loadActivities();
          loadProducts();
          loadCoupons();
          loadChatThreads();
        }
      });
  }, []);

  const loadKpis = () => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) {
          const totalRev = data.orders.reduce((acc: number, o: any) => acc + o.total_price, 0);
          const pending = data.orders.filter((o: any) => o.status === 'Pending').length;
          setOverviewKpis((prev: any) => ({
            ...prev,
            totalOrders: data.orders.length,
            totalRevenue: totalRev,
            pendingShipments: pending,
          }));
        }
      });

    setOverviewKpis((prev: any) => ({
      ...prev,
      activeUsers: 34,
    }));
  };

  const loadOrders = () => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) {
          setOrders(data.orders);
        }
      });
  };

  const loadUsers = () => {
    setUsers([
      { id: 1, name: 'Super Admin', email: 'weartome@admin.com', role: 'Admin', promotion_tier: 'Standard', is_suspended: 0 },
      { id: 2, name: 'WearTome Manager', email: 'admin@weartome.com', role: 'Admin', promotion_tier: 'Standard', is_suspended: 0 },
      { id: 3, name: 'Jane Doe', email: 'testcustomer@weartome.com', role: 'Customer', promotion_tier: 'Standard', is_suspended: 0 },
    ]);
  };

  const loadActivities = () => {
    setActivities([
      { id: 1, action: 'User Login', details: 'Successful login with role: Admin', created_at: '2026-07-14 14:32:00' },
      { id: 2, action: 'User Registration', details: 'New user Jane Doe registered', created_at: '2026-07-14 14:35:00' },
      { id: 3, action: 'Place Order', details: 'Order #1 placed successfully', created_at: '2026-07-14 14:42:00' },
    ]);
  };

  const loadProducts = () => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.products) {
          setProducts(data.products);
        }
      });
  };

  const loadCoupons = () => {
    setCoupons([
      { id: 1, code: 'WELCOME10', type: 'public_pro', discount_value: 10, discount_type: 'percent', max_redemptions: 1000, redeemed_count: 1, is_active: 1, active_from: '2026-01-01', active_to: '2027-12-31' },
      { id: 2, code: 'VIP500', type: 'private', discount_value: 500, discount_type: 'flat', max_redemptions: 5, redeemed_count: 0, is_active: 1, active_from: '2026-01-01', active_to: '2027-12-31' }
    ]);
  };

  const loadChatThreads = () => {
    fetch('/api/chat')
      .then((res) => res.json())
      .then((data) => {
        if (data.threads) {
          setChatThreads(data.threads);
        }
      });
  };

  const handleSelectThread = (threadId: number) => {
    setActiveThreadId(threadId);
    fetch(`/api/chat?partnerId=${threadId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) {
          setChatMessages(data.messages);
        }
      });
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeThreadId) return;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: typedMessage, receiver_id: activeThreadId }),
      });

      if (res.ok) {
        setTypedMessage('');
        handleSelectThread(activeThreadId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...prodForm,
        price: parseFloat(prodForm.price),
        stock: parseInt(prodForm.stock),
        sizes: JSON.parse(prodForm.sizes),
        colors: JSON.parse(prodForm.colors),
        discount_percent: parseFloat(prodForm.discount_percent),
        images: JSON.parse(prodForm.images),
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        confetti({ particleCount: 100, spread: 60 });
        setShowProductForm(false);
        loadProducts();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create product.');
      }
    } catch (error) {
      alert('Error formatting arrays. Check your JSON format.');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this product?')) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadProducts();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const newCoupon = {
      id: coupons.length + 1,
      ...coupForm,
      discount_value: parseFloat(coupForm.discount_value),
      max_redemptions: parseInt(coupForm.max_redemptions),
      per_account_limit: parseInt(coupForm.per_account_limit),
      redeemed_count: 0,
      is_active: 1
    };
    setCoupons((prev) => [...prev, newCoupon]);
    setShowCouponForm(false);
    confetti({ particleCount: 50, spread: 45 });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('draggedIdx', index.toString());
  };

  const handleDrop = async (e: React.DragEvent, targetIdx: number) => {
    const draggedIdx = parseInt(e.dataTransfer.getData('draggedIdx'));
    if (draggedIdx === targetIdx) return;

    const listCopy = [...products];
    const [draggedItem] = listCopy.splice(draggedIdx, 1);
    listCopy.splice(targetIdx, 0, draggedItem);

    // Save positions
    const placements = listCopy.map((item, idx) => ({ id: item.id, grid_position: idx + 1 }));
    setProducts(listCopy);

    await fetch('/api/products/placement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placements }),
    });
  };

  const handleOrderClick = (order: any) => {
    setSelectedOrder(order);
    fetch(`/api/orders?id=${order.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setSelectedOrderOrderItems(data.items);
        }
      });
  };

  const handleUpdateOrderStatus = async (status: string) => {
    if (!selectedOrder) return;
    setSelectedOrder((prev: any) => ({ ...prev, status }));
    setOrders((prev) =>
      prev.map((o) => o.id === selectedOrder.id ? { ...o, status } : o)
    );
  };

  const handleToggleUserSuspension = (userId: number, currentSuspended: number) => {
    setUsers((prev) =>
      prev.map((u) => u.id === userId ? { ...u, is_suspended: currentSuspended ? 0 : 1 } : u)
    );
  };

  const handlePromoteUserTier = (userId: number, tier: string) => {
    setUsers((prev) =>
      prev.map((u) => u.id === userId ? { ...u, promotion_tier: tier } : u)
    );
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch = o.payment_ref?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.id.toString().includes(searchQuery) ||
                          o.shipping_address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = orderFilter === 'All' || o.status === orderFilter;
    return matchesSearch && matchesFilter;
  });

  const navItems = [
    { id: 'overview', label: 'OVERVIEW', icon: BarChart3 },
    { id: 'orders', label: 'ORDERS', icon: ShoppingBag },
    { id: 'users', label: 'CUSTOMERS', icon: Users },
    { id: 'products', label: 'PRODUCTS CRUD', icon: Layers },
    { id: 'coupons', label: 'COUPON ENGINE', icon: Ticket },
    { id: 'chat', label: 'SUPPORT CHAT', icon: MessageSquare },
  ];

  if (!sessionUser) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <span className="text-xs uppercase tracking-widest text-[#8A8A8A]">ESTABLISHING SECURED CONTROL SYSTEMS...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white flex font-sans">

      {/* SIDEBAR COMPONENT (ADAPTIVE RAIL) */}
      <aside className={`bg-[#0A0A0A] border-r border-[#2A2A2A] transition-all duration-300 flex flex-col justify-between ${isSidebarExpanded ? 'w-64' : 'w-20'}`}>
        <div>
          {/* Logo container */}
          <div className="h-16 border-b border-[#2A2A2A] flex items-center px-6 justify-between">
            <span className={`font-serif-luxury font-bold tracking-widest text-[#F8F6F2] ${isSidebarExpanded ? 'text-lg block' : 'hidden'}`}>
              WT PANEL
            </span>
            <button
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className="p-1 text-[#8A8A8A] hover:text-white transition-colors"
            >
              <Activity className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isSel = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all ${
                    isSel
                      ? 'bg-[#F8F6F2] text-black font-bold'
                      : 'text-[#8A8A8A] hover:text-white hover:bg-[#111111]'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className={isSidebarExpanded ? 'inline' : 'hidden'}>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar bottom */}
        <div className="p-4 border-t border-[#2A2A2A] flex items-center space-x-3 text-xs">
          <div className="w-8 h-8 rounded-full bg-[#1F1F1F] flex items-center justify-center font-bold font-serif-luxury">
            {sessionUser.name.charAt(0)}
          </div>
          <div className={`flex-grow ${isSidebarExpanded ? 'block' : 'hidden'}`}>
            <span className="font-semibold text-white block leading-none">{sessionUser.name}</span>
            <span className="text-[10px] text-[#8A8A8A] uppercase tracking-wider block mt-1">{sessionUser.role}</span>
          </div>
        </div>
      </aside>

      {/* CORE WORKSPACE CONTENT RIGHT PANEL */}
      <main className="flex-grow flex flex-col min-h-screen">

        {/* TOP WORKSPACE NAVIGATION BAR */}
        <header className="h-16 bg-[#0A0A0A] border-b border-[#2A2A2A] flex items-center justify-between px-8">
          <span className="text-xs uppercase tracking-widest font-semibold text-[#8A8A8A]">
            WORKSPACE / {activeModule.toUpperCase()}
          </span>

          <div className="flex items-center space-x-4">
            <span className="text-[10px] text-[#8A8A8A] uppercase font-mono bg-black border border-[#2A2A2A] px-2.5 py-1 rounded">
              ROLE: {sessionUser.role}
            </span>
            <button
              onClick={() => router.push('/')}
              className="text-[10px] uppercase tracking-widest font-bold border border-[#2A2A2A] rounded-full px-4 py-1.5 hover:border-white transition-all bg-black"
            >
              EXIT PANELS
            </button>
          </div>
        </header>

        {/* WORKSPACE MODULE VIEW INJECTOR */}
        <div className="flex-grow p-8 space-y-8 overflow-y-auto">

          {/* ==================== 1. OVERVIEW VIEW ==================== */}
          {activeModule === 'overview' && (
            <div className="space-y-8 animate-fade-in">
              {/* KPI metrics row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-6 space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-semibold block">TOTAL REVENUE TODAY</span>
                  <span className="text-2xl font-bold block text-white">₹{overviewKpis.totalRevenue.toLocaleString()}</span>
                  <span className="text-[9px] text-[#8A8A8A] block uppercase font-medium">INR TRANSACTION VOLUMES</span>
                </div>

                <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-6 space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-semibold block">ACQUIRED ORDERS</span>
                  <span className="text-2xl font-bold block text-white">{overviewKpis.totalOrders}</span>
                  <span className="text-[9px] text-[#8A8A8A] block uppercase font-medium">CUMULATIVE SUBMISSIONS</span>
                </div>

                <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-6 space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-semibold block">ACTIVE PLATFORM USERS</span>
                  <span className="text-2xl font-bold block text-white">{overviewKpis.activeUsers}</span>
                  <span className="text-[9px] text-[#8A8A8A] block uppercase font-medium">REGISTERED DIRECTORIES</span>
                </div>

                <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-6 space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-semibold block">PENDING SHIPMENTS</span>
                  <span className="text-2xl font-bold block text-white">{overviewKpis.pendingShipments}</span>
                  <span className="text-[9px] text-[#8A8A8A] block uppercase font-medium">ACTION REQUIRED INBOX</span>
                </div>

              </div>

              {/* Layout splits */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Revenue/Orders trend indicators */}
                <div className="lg:col-span-8 bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-8 space-y-6">
                  <span className="text-xs uppercase tracking-widest text-[#8A8A8A] font-semibold block">REVENUE STREAM ANALYTICS</span>
                  <div className="h-64 bg-black border border-[#2A2A2A] rounded-xl flex items-center justify-center relative">
                    {/* Simulated vector chart */}
                    <div className="absolute inset-x-8 bottom-10 top-16 flex items-end justify-between">
                      {[15, 30, 20, 45, 60, 40, 75, 50, 90, 85].map((val, i) => (
                        <div key={i} className="w-8 bg-[#F8F6F2] rounded-t-sm transition-all duration-500 hover:opacity-80" style={{ height: `${val}%` }} />
                      ))}
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-[#8A8A8A] bg-[#111111] px-4 py-2 border border-[#2A2A2A] rounded-full z-10">
                      WEEKLY TRANSACTION VOLUMES RECORDED
                    </span>
                  </div>
                </div>

                {/* Audit trail activity log feed */}
                <div className="lg:col-span-4 bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-6 space-y-4">
                  <span className="text-xs uppercase tracking-widest text-[#8A8A8A] font-semibold block">RECENT AUDIT TRAIL</span>
                  <div className="space-y-4 max-h-[270px] overflow-y-auto scrollbar-hide">
                    {activities.map((act) => (
                      <div key={act.id} className="border-b border-[#2A2A2A] pb-3 last:border-0 last:pb-0 text-xs">
                        <span className="font-semibold text-white uppercase block">{act.action}</span>
                        <span className="text-[#8A8A8A] block mt-0.5">{act.details}</span>
                        <span className="text-[9px] text-[#525252] block mt-1">{act.created_at}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ==================== 2. ORDERS MODULE VIEW ==================== */}
          {activeModule === 'orders' && (
            <div className="space-y-6 animate-fade-in relative">

              {/* Controls bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2A2A2A] pb-6">
                <div className="space-y-1">
                  <h2 className="font-serif-luxury text-2xl font-bold uppercase text-white">ORDER ROWS PANEL</h2>
                  <p className="text-xs text-[#8A8A8A]">Filter, track shipping coordinates, or update order statuses.</p>
                </div>

                <div className="flex items-center space-x-3">
                  <select
                    value={orderFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="bg-[#0A0A0A] border border-[#2A2A2A] px-4 py-2.5 rounded-xl text-xs outline-none text-white focus:border-white transition-all font-semibold uppercase tracking-wider"
                  >
                    <option value="All">All statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="SEARCH ORDER / REF..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-full pl-10 pr-5 py-2.5 text-xs text-white outline-none focus:border-white transition-all uppercase"
                    />
                    <Search className="w-3.5 h-3.5 text-[#8A8A8A] absolute left-4 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Main table list */}
              {filteredOrders.length === 0 ? (
                <div className="py-20 text-center text-xs text-[#8A8A8A] uppercase bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl">
                  No order rows match search queries or parameters.
                </div>
              ) : (
                <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs text-[#B5B5B5]">
                    <thead className="bg-black text-[#8A8A8A] uppercase font-semibold border-b border-[#2A2A2A]">
                      <tr>
                        <th className="p-5">ORDER ID</th>
                        <th className="p-5">CUSTOMER NAME</th>
                        <th className="p-5">PAYMENT STATUS</th>
                        <th className="p-5">SHIPPING STATUS</th>
                        <th className="p-5">TOTAL VOLUME</th>
                        <th className="p-5 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2A2A]">
                      {filteredOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-[#111111]/30 transition-colors">
                          <td className="p-5 font-mono text-white font-bold">#{ord.id}</td>
                          <td className="p-5 font-semibold text-white">{ord.customer_name}</td>
                          <td className="p-5">
                            <span className="inline-block bg-[#F8F6F2]/10 border border-[#F8F6F2]/30 text-white font-semibold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest">
                              {ord.payment_status}
                            </span>
                          </td>
                          <td className="p-5">
                            <span className={`inline-block font-semibold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest ${
                              ord.status === 'Pending' ? 'bg-amber-500/10 border border-amber-500/30 text-amber-500' :
                              ord.status === 'Cancelled' ? 'bg-red-500/10 border border-red-500/30 text-red-500' :
                              'bg-green-500/10 border border-green-500/30 text-green-500'
                            }`}>
                              {ord.status}
                            </span>
                          </td>
                          <td className="p-5 font-bold text-white">₹{ord.total_price.toLocaleString()}</td>
                          <td className="p-5 text-right">
                            <button
                              onClick={() => handleOrderClick(ord)}
                              className="text-white hover:underline text-[10px] font-bold uppercase tracking-widest flex items-center space-x-1.5 ml-auto bg-black border border-[#2A2A2A] rounded-full px-4 py-2 hover:border-white transition-all"
                            >
                              <Eye className="w-3 h-3" />
                              <span>INSPECT DRAW</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SIDE DRAWER: Detailed Order line items inspections */}
              {selectedOrder && (
                <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[#0A0A0A] border-l border-[#2A2A2A] h-full flex flex-col justify-between shadow-2xl p-8 animate-fade-in text-white">
                  <div>
                    <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-4 mb-6">
                      <span className="font-serif-luxury font-bold text-xl uppercase">INSPECT ORDER #{selectedOrder.id}</span>
                      <button onClick={() => setSelectedOrder(null)} className="p-1.5 text-[#8A8A8A] hover:text-white transition-colors border border-[#2A2A2A] rounded-full bg-black">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-1.5 text-xs text-[#8A8A8A] bg-black p-4 border border-[#2A2A2A] rounded-xl">
                        <span className="font-bold text-white uppercase block">SHIPPING COORDINATES:</span>
                        <span>{selectedOrder.shipping_address}</span>
                      </div>

                      <div className="space-y-3">
                        <span className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-semibold block">ORDERED APPAREL / ACCESSORIES ITEMS</span>
                        <div className="space-y-3 max-h-[220px] overflow-y-auto scrollbar-hide">
                          {selectedOrderItems.map((item) => (
                            <div key={item.id} className="flex justify-between items-center text-xs border-b border-[#2A2A2A] pb-2 last:border-0 last:pb-0">
                              <div>
                                <span className="font-semibold text-white block uppercase">{item.name}</span>
                                <span className="text-[#8A8A8A] text-[10px]">QTY: {item.quantity} &middot; SIZE: {item.size}</span>
                              </div>
                              <span className="font-bold text-white">₹{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[#2A2A2A] pt-4 text-xs space-y-1.5 text-[#8A8A8A]">
                        <div className="flex justify-between">
                          <span>DISCOUNT APPLIED:</span>
                          <span className="text-white">₹{selectedOrder.discount_applied.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold text-sm text-white pt-1">
                          <span>TOTAL VALUE CHARGED:</span>
                          <span className="text-white">₹{selectedOrder.total_price.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-6 border-t border-[#2A2A2A]">
                    <span className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-semibold block text-center">CORRECT SHIPPING STATUS</span>
                    <div className="grid grid-cols-3 gap-2">
                      {['Shipped', 'Delivered', 'Cancelled'].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleUpdateOrderStatus(status)}
                          className={`text-center py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
                            selectedOrder.status === status
                              ? 'bg-[#F8F6F2] text-black border-white'
                              : 'bg-black border-[#2A2A2A] text-white hover:border-[#525252]'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* ==================== 3. USERS MODULE VIEW ==================== */}
          {activeModule === 'users' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-[#2A2A2A] pb-6">
                <h2 className="font-serif-luxury text-2xl font-bold uppercase text-white">USER DIRECTORY MANAGEMENT</h2>
                <p className="text-xs text-[#8A8A8A]">Check accounts, soft-delete, suspend/unban, or upgrade loyal tiers.</p>
              </div>

              <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-[#B5B5B5]">
                  <thead className="bg-black text-[#8A8A8A] uppercase font-semibold border-b border-[#2A2A2A]">
                    <tr>
                      <th className="p-5">USER ID</th>
                      <th className="p-5">NAME</th>
                      <th className="p-5">EMAIL</th>
                      <th className="p-5">ROLE</th>
                      <th className="p-5">LOYALTY MEMBER TIER</th>
                      <th className="p-5">STATUS</th>
                      <th className="p-5 text-right">CONTROLS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2A2A]">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-[#111111]/30 transition-colors">
                        <td className="p-5 font-mono text-white">#{u.id}</td>
                        <td className="p-5 font-semibold text-white uppercase">{u.name}</td>
                        <td className="p-5 font-mono">{u.email}</td>
                        <td className="p-5 uppercase font-bold text-white">{u.role}</td>
                        <td className="p-5">
                          {u.role === 'Customer' ? (
                            <select
                              value={u.promotion_tier}
                              onChange={(e) => handlePromoteUserTier(u.id, e.target.value)}
                              className="bg-black border border-[#2A2A2A] rounded px-3 py-1 outline-none text-white text-[10px] font-bold uppercase"
                            >
                              <option value="Standard">Standard</option>
                              <option value="Loyal">Loyal</option>
                              <option value="Top User">Top User</option>
                              <option value="VIP">VIP</option>
                            </select>
                          ) : (
                            <span className="text-[10px] text-[#8A8A8A]">STAFF BOUNDARY</span>
                          )}
                        </td>
                        <td className="p-5">
                          <span className={`inline-block font-semibold px-2 py-0.5 rounded text-[8px] uppercase tracking-widest ${
                            u.is_suspended ? 'bg-red-500/10 border border-red-500/30 text-red-500' : 'bg-green-500/10 border border-green-500/30 text-green-500'
                          }`}>
                            {u.is_suspended ? 'SUSPENDED' : 'ACTIVE'}
                          </span>
                        </td>
                        <td className="p-5 text-right flex justify-end space-x-2">
                          {u.role === 'Customer' && (
                            <button
                              onClick={() => handleToggleUserSuspension(u.id, u.is_suspended)}
                              className={`p-2 border rounded-full transition-colors ${
                                u.is_suspended ? 'bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20' : 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20'
                              }`}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <span className="text-[10px] text-[#525252] font-mono">OK</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== 4. PRODUCTS CRUD & SEATING VIEW ==================== */}
          {activeModule === 'products' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-6">
                <div>
                  <h2 className="font-serif-luxury text-2xl font-bold uppercase text-white">ARCHIVE CATALOG BUILDER</h2>
                  <p className="text-xs text-[#8A8A8A]">Drag and drop product cards to book fixed grid seating coordinates, or create products.</p>
                </div>
                <button
                  onClick={() => setShowProductForm(!showProductForm)}
                  className="flex items-center space-x-2 bg-[#F8F6F2] hover:bg-white text-black text-xs font-bold uppercase px-5 py-3 rounded-full transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>NEW LUXURY PRODUCT</span>
                </button>
              </div>

              {/* Product Creation form drawer/modal */}
              {showProductForm && (
                <form onSubmit={handleCreateProduct} className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-8 space-y-6">
                  <span className="text-xs uppercase tracking-widest text-[#B5B5B5] font-semibold border-b border-[#2A2A2A] pb-2 block">
                    CREATE NEW APPAREL/ACCESSORY ENTITY
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[#8A8A8A] font-semibold uppercase block">PRODUCT NAME</label>
                      <input
                        type="text" required placeholder="e.g. SILK SLIP GOWN"
                        value={prodForm.name} onChange={(e) => setProdForm({...prodForm, name: e.target.value})}
                        className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white focus:border-white transition-all uppercase"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[#8A8A8A] font-semibold uppercase block">BASE PRICE (INR)</label>
                      <input
                        type="number" required placeholder="e.g. 15000"
                        value={prodForm.price} onChange={(e) => setProdForm({...prodForm, price: e.target.value})}
                        className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white focus:border-white transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[#8A8A8A] font-semibold uppercase block">INVENTORY STOCK</label>
                      <input
                        type="number" required placeholder="e.g. 10"
                        value={prodForm.stock} onChange={(e) => setProdForm({...prodForm, stock: e.target.value})}
                        className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white focus:border-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[#8A8A8A] font-semibold uppercase block">CATEGORY ID</label>
                      <input
                        type="number" value={prodForm.category_id} onChange={(e) => setProdForm({...prodForm, category_id: e.target.value})}
                        className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white focus:border-white transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[#8A8A8A] font-semibold uppercase block">SUBCATEGORY TAG</label>
                      <input
                        type="text" placeholder="e.g. Gowns" value={prodForm.subcategory} onChange={(e) => setProdForm({...prodForm, subcategory: e.target.value})}
                        className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white focus:border-white transition-all uppercase"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[#8A8A8A] font-semibold uppercase block">GENDER FOCUS</label>
                      <select
                        value={prodForm.gender_target} onChange={(e) => setProdForm({...prodForm, gender_target: e.target.value})}
                        className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white focus:border-white transition-all uppercase font-semibold"
                      >
                        <option value="men">Men</option>
                        <option value="women">Women</option>
                        <option value="unisex">Unisex</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[#8A8A8A] font-semibold uppercase block">SIZES ARRAY (JSON format)</label>
                      <input
                        type="text" value={prodForm.sizes} onChange={(e) => setProdForm({...prodForm, sizes: e.target.value})}
                        className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[#8A8A8A] font-semibold uppercase block">GALLERY IMAGES URLS ARRAY (JSON format - 2 to 10 minimum)</label>
                      <input
                        type="text" value={prodForm.images} onChange={(e) => setProdForm({...prodForm, images: e.target.value})}
                        className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-xs">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox" checked={prodForm.is_trending} onChange={(e) => setProdForm({...prodForm, is_trending: e.target.checked})}
                        className="rounded bg-black border-[#2A2A2A] text-white focus:ring-0 w-4 h-4"
                      />
                      <span className="font-semibold uppercase text-white">SET AS TRENDING PRODUCT</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="bg-[#F8F6F2] hover:bg-white text-black px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    CREATE AND REGISTER WEBP IMAGES
                  </button>
                </form>
              )}

              {/* Drag and Drop Seating Layout Seating */}
              <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-6 space-y-4">
                <span className="text-xs uppercase tracking-widest text-[#8A8A8A] font-semibold block">
                  MANUAL GRID SEATING MANAGER (DRAG CARDS TO REPOSITION)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {products.map((item, idx) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, idx)}
                      className="border border-[#2A2A2A] hover:border-white rounded-xl p-4 bg-black cursor-grab active:cursor-grabbing flex items-center space-x-4 transition-all"
                    >
                      <GripVertical className="w-4 h-4 text-[#8A8A8A] flex-shrink-0" />
                      <img src={item.primaryImage} alt="" className="w-10 h-14 object-cover bg-black rounded" />
                      <div className="flex-grow text-xs space-y-0.5">
                        <span className="font-bold text-white block uppercase line-clamp-1">{item.name}</span>
                        <span className="text-[10px] text-[#8A8A8A] uppercase tracking-wider block">GRID POSITION: #{idx + 1}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteProduct(item.id)}
                        className="text-[#8A8A8A] hover:text-[#FF3B30] p-1.5 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ==================== 5. COUPONS MODULE VIEW ==================== */}
          {activeModule === 'coupons' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-6">
                <div>
                  <h2 className="font-serif-luxury text-2xl font-bold uppercase text-white">COUPON & PROMOTION ENGINE</h2>
                  <p className="text-xs text-[#8A8A8A]">Build Private VIP outreach coupons or Public Sub-public products promo codes.</p>
                </div>
                <button
                  onClick={() => setShowCouponForm(!showCouponForm)}
                  className="flex items-center space-x-2 bg-[#F8F6F2] hover:bg-white text-black text-xs font-bold uppercase px-5 py-3 rounded-full transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>NEW PROMOTION COUPON</span>
                </button>
              </div>

              {/* Coupon creator form */}
              {showCouponForm && (
                <form onSubmit={handleCreateCoupon} className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-8 space-y-6 text-xs">
                  <span className="text-xs uppercase tracking-widest text-[#B5B5B5] font-semibold border-b border-[#2A2A2A] pb-2 block">
                    CREATE NEW DISCOUNTS FORM
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[#8A8A8A] font-semibold uppercase block">PROMO CODE</label>
                      <input
                        type="text" required placeholder="e.g. VIP888"
                        value={coupForm.code} onChange={(e) => setCoupForm({...coupForm, code: e.target.value.toUpperCase()})}
                        className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white focus:border-white transition-all uppercase font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[#8A8A8A] font-semibold uppercase block">COUPON FAMILY TYPE</label>
                      <select
                        value={coupForm.type} onChange={(e) => setCoupForm({...coupForm, type: e.target.value})}
                        className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white focus:border-white transition-all uppercase font-semibold"
                      >
                        <option value="private">Private (VIP Cap limit)</option>
                        <option value="public_pro">Public Site-wide</option>
                        <option value="public_sub">Public Product-scoped</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[#8A8A8A] font-semibold uppercase block">DISCOUNT VALUE</label>
                      <input
                        type="number" required placeholder="e.g. 15"
                        value={coupForm.discount_value} onChange={(e) => setCoupForm({...coupForm, discount_value: e.target.value})}
                        className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white focus:border-white transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[#8A8A8A] font-semibold uppercase block">REDUCE TYPE</label>
                      <select
                        value={coupForm.discount_type} onChange={(e) => setCoupForm({...coupForm, discount_type: e.target.value})}
                        className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white focus:border-white transition-all uppercase font-semibold"
                      >
                        <option value="percent">Percentage % Off</option>
                        <option value="flat">Flat Amount (INR) Off</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[#8A8A8A] font-semibold uppercase block">MAX REDEMPTIONS CAP</label>
                      <input
                        type="number" value={coupForm.max_redemptions} onChange={(e) => setCoupForm({...coupForm, max_redemptions: e.target.value})}
                        className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white focus:border-white transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[#8A8A8A] font-semibold uppercase block">ACTIVE FROM TIMESTAMP</label>
                      <input
                        type="date" value={coupForm.active_from} onChange={(e) => setCoupForm({...coupForm, active_from: e.target.value})}
                        className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white focus:border-white transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[#8A8A8A] font-semibold uppercase block">ACTIVE TO TIMESTAMP</label>
                      <input
                        type="date" value={coupForm.active_to} onChange={(e) => setCoupForm({...coupForm, active_to: e.target.value})}
                        className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white focus:border-white transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="bg-[#F8F6F2] hover:bg-white text-black px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    REGISTER PROMOTION COUPON
                  </button>
                </form>
              )}

              {/* Coupons List */}
              <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-[#B5B5B5]">
                  <thead className="bg-black text-[#8A8A8A] uppercase font-semibold border-b border-[#2A2A2A]">
                    <tr>
                      <th className="p-5">PROMO CODE</th>
                      <th className="p-5">COUPON TYPE</th>
                      <th className="p-5">VALUE</th>
                      <th className="p-5">ACTIVE FROM</th>
                      <th className="p-5">ACTIVE TO</th>
                      <th className="p-5">REDEMPTIONS COUNT</th>
                      <th className="p-5 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2A2A]">
                    {coupons.map((c) => (
                      <tr key={c.id} className="hover:bg-[#111111]/30 transition-colors">
                        <td className="p-5 font-bold font-mono text-white">{c.code}</td>
                        <td className="p-5 uppercase">{c.type}</td>
                        <td className="p-5 font-bold text-white">
                          {c.discount_type === 'percent' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                        </td>
                        <td className="p-5 font-mono">{c.active_from}</td>
                        <td className="p-5 font-mono">{c.active_to}</td>
                        <td className="p-5">
                          {c.redeemed_count} / {c.max_redemptions} LIMIT
                        </td>
                        <td className="p-5 text-right text-green-500 font-bold uppercase tracking-widest text-[9px]">
                          ACTIVE
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ==================== 6. CHAT SUPPORT VIEW ==================== */}
          {activeModule === 'chat' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[600px] bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl overflow-hidden animate-fade-in text-xs">

              {/* LEFT COLUMN: Active Support conversations threads list */}
              <div className="lg:col-span-4 border-r border-[#2A2A2A] flex flex-col h-full bg-black/30">
                <div className="p-6 border-b border-[#2A2A2A] flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-white font-bold">SUPPORT CHAT INBOX</span>
                  <button onClick={loadChatThreads} className="p-1.5 border border-[#2A2A2A] rounded-full bg-black text-[#8A8A8A] hover:text-white transition-colors">
                    <Activity className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-grow overflow-y-auto divide-y divide-[#2A2A2A] scrollbar-hide">
                  {chatThreads.length === 0 ? (
                    <div className="p-8 text-center text-[#8A8A8A] uppercase">
                      No active conversation threads.
                    </div>
                  ) : (
                    chatThreads.map((th) => {
                      const isSel = activeThreadId === th.customer_id;
                      return (
                        <button
                          key={th.customer_id}
                          onClick={() => handleSelectThread(th.customer_id)}
                          className={`w-full p-5 text-left transition-colors flex flex-col space-y-1 outline-none ${
                            isSel ? 'bg-[#111111]' : 'hover:bg-[#111111]/30'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white uppercase block leading-none">{th.customer_name}</span>
                            {th.unread_count > 0 && (
                              <span className="bg-[#F8F6F2] text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                                {th.unread_count} NEW
                              </span>
                            )}
                          </div>
                          <span className="text-[#8A8A8A] block truncate">{th.last_message || 'No messages'}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Selected thread support messages log */}
              <div className="lg:col-span-8 flex flex-col h-full justify-between">
                {activeThreadId ? (
                  <>
                    {/* Header partner details */}
                    <div className="p-6 border-b border-[#2A2A2A] flex items-center justify-between bg-black/20">
                      <div>
                        <span className="text-[10px] text-[#8A8A8A] uppercase tracking-wider font-semibold block">CONVERSATION METADATA</span>
                        <span className="font-bold text-white text-sm uppercase block mt-0.5">
                          {chatThreads.find((t) => t.customer_id === activeThreadId)?.customer_name || 'Active Customer'}
                        </span>
                      </div>
                    </div>

                    {/* Scrolling message logs bubbles */}
                    <div className="flex-grow overflow-y-auto p-6 space-y-4 scrollbar-hide bg-black/45">
                      {chatMessages.map((msg) => {
                        const isMe = msg.sender_id === sessionUser.id;
                        return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs p-4 rounded-xl text-xs space-y-1 border ${
                              isMe
                                ? 'bg-[#171717] border-[#2A2A2A] text-white rounded-br-none'
                                : 'bg-[#F8F6F2] text-black border-white rounded-bl-none'
                            }`}>
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                              <span className="block text-[8px] opacity-75 text-right">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatBottomRef} />
                    </div>

                    {/* Action form */}
                    <form onSubmit={handleSendReply} className="p-4 border-t border-[#2A2A2A] bg-black flex items-center space-x-3">
                      <input
                        type="text"
                        placeholder="REPLY SUPPORT INBOX..."
                        value={typedMessage}
                        onChange={(e) => setTypedMessage(e.target.value)}
                        className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-full px-5 py-3.5 text-xs text-white outline-none flex-grow focus:border-white transition-all uppercase"
                      />
                      <button type="submit" className="bg-[#F8F6F2] hover:bg-white text-black p-3.5 rounded-full transition-colors flex-shrink-0">
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 text-[#8A8A8A]">
                    <span className="text-xs uppercase tracking-widest">Select an active conversation thread.</span>
                    <p className="text-xs max-w-xs">Exchanged messages and support query timeline histories will populate here instantly.</p>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </main>

    </div>
  );
}
