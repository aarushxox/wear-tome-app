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

  // Active sub-module view state: 'overview', 'orders', 'users', 'products', 'coupons', 'chat', 'notifications', 'settings'
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

  // 4. Settings & Notifications States
  const [websiteSettings, setWebsiteSettings] = useState<any>({
    'site.name': 'Wear Tome',
    'site.tagline': 'Luxury Streetwear Editorial',
    'site.primary_color': '#0A0A0A',
    'site.primary_font': 'Playfair Display',
    'site.seo_title': 'Wear Tome — High-End Luxury Streetwear Storefront',
  });
  const [systemSettings, setSystemSettings] = useState<any>({
    'ai_enabled': '1',
    'voice_enabled': '1',
    'theme_mode': 'dark',
  });
  const [themePresets, setThemePresets] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // 5. Blogs & Careers States
  const [blogs, setBlogs] = useState<any[]>([]);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [blogForm, setBlogForm] = useState({
    title: '',
    content: '',
    category: 'Design',
    is_published: false,
  });
  const [careers, setCareers] = useState<any[]>([]);
  const [convertingApplicant, setConvertingApplicant] = useState<any>(null);
  const [conversionForm, setConversionForm] = useState({
    employeeRole: 'Sub-admin',
    employeePassword: '',
  });

  // 6. Employees State
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [empForm, setEmpForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Manager',
    permissions: '[]',
  });

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
          loadSettings();
          loadNotifications();
          loadBlogs();
          loadCareers();
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

  const loadSettings = () => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.websiteSettings) setWebsiteSettings(data.websiteSettings);
        if (data.systemSettings) setSystemSettings(data.systemSettings);
        if (data.themePresets) setThemePresets(data.themePresets);
      })
      .catch((err) => console.error('Error loading settings:', err));
  };

  const loadNotifications = () => {
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => {
        if (data.notifications) setNotifications(data.notifications);
        if (data.unreadCount !== undefined) setUnreadCount(data.unreadCount);
      })
      .catch((err) => console.error('Error loading notifications:', err));
  };

  const handleMarkNotificationRead = async (id: number) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        loadNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: empForm.email,
          password: empForm.password,
          name: empForm.name,
          role: empForm.role,
          permissions: JSON.parse(empForm.permissions || '[]'),
        }),
      });
      if (res.ok) {
        setShowEmployeeForm(false);
        setEmpForm({ name: '', email: '', password: '', role: 'Manager', permissions: '[]' });
        loadUsers();
        alert('Employee created successfully!');
        confetti({ particleCount: 50, spread: 45 });
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create employee account.');
      }
    } catch (err) {
      alert('Permissions field must be a valid JSON array of strings!');
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this employee account?')) return;
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadUsers();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete employee account.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadBlogs = () => {
    fetch('/api/blogs')
      .then((res) => res.json())
      .then((data) => {
        if (data.blogs) setBlogs(data.blogs);
      })
      .catch((err) => console.error('Error loading blogs:', err));
  };

  const loadCareers = () => {
    fetch('/api/careers')
      .then((res) => res.json())
      .then((data) => {
        if (data.applications) setCareers(data.applications);
      })
      .catch((err) => console.error('Error loading careers:', err));
  };

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blogForm),
      });
      if (res.ok) {
        setShowBlogForm(false);
        setBlogForm({ title: '', content: '', category: 'Design', is_published: false });
        loadBlogs();
        confetti({ particleCount: 50, spread: 45 });
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create blog post.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBlog = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this publication?')) return;
    try {
      const res = await fetch(`/api/blogs?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadBlogs();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete blog post.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConvertApplicant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingApplicant) return;
    try {
      const res = await fetch('/api/careers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: convertingApplicant.id,
          convertToEmployee: true,
          employeeRole: conversionForm.employeeRole,
          employeePassword: conversionForm.employeePassword,
        }),
      });
      if (res.ok) {
        alert('Applicant converted to Employee successfully!');
        setConvertingApplicant(null);
        setConversionForm({ employeeRole: 'Sub-admin', employeePassword: '' });
        loadCareers();
        loadUsers(); // Refresh users list
        confetti({ particleCount: 100, spread: 60 });
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to convert applicant.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectApplicant = async (id: number) => {
    if (!confirm('Are you sure you want to reject this applicant?')) return;
    try {
      const res = await fetch('/api/careers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'Rejected' }),
      });
      if (res.ok) {
        loadCareers();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to reject applicant.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        loadNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteSettings, systemSettings }),
      });
      if (res.ok) {
        alert('Settings updated successfully!');
        loadSettings();
        confetti({ particleCount: 50, spread: 45 });
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update settings.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadUsers = () => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (data.users) {
          setUsers(data.users);
        }
      });
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
    fetch('/api/coupons')
      .then((res) => res.json())
      .then((data) => {
        if (data.coupons) {
          setCoupons(data.coupons);
        }
      });
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

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...coupForm,
          discount_value: parseFloat(coupForm.discount_value),
          max_redemptions: parseInt(coupForm.max_redemptions),
          per_account_limit: parseInt(coupForm.per_account_limit),
        }),
      });
      if (res.ok) {
        setShowCouponForm(false);
        loadCoupons();
        confetti({ particleCount: 50, spread: 45 });
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to register coupon.');
      }
    } catch (err) {
      console.error(err);
    }
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

  const handleToggleUserSuspension = async (userId: number, currentSuspended: number) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, is_suspended: currentSuspended ? 0 : 1 }),
      });
      if (res.ok) {
        loadUsers();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update user suspension status.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePromoteUserTier = async (userId: number, tier: string) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, promotion_tier: tier }),
      });
      if (res.ok) {
        loadUsers();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update user promotion tier.');
      }
    } catch (err) {
      console.error(err);
    }
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
    { id: 'employees', label: 'EMPLOYEES & TEAM', icon: Percent },
    { id: 'revenue', label: 'REVENUE & MARGINS', icon: Activity },
    { id: 'blogs', label: 'PUBLICATIONS', icon: FileText },
    { id: 'careers', label: 'CAREERS', icon: ShieldAlert },
    { id: 'notifications', label: 'NOTIFICATIONS', icon: Bell },
    { id: 'settings', label: 'SETTINGS', icon: Settings },
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
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all ${
                    isSel
                      ? 'bg-[#F8F6F2] text-black font-bold'
                      : 'text-[#8A8A8A] hover:text-white hover:bg-[#111111]'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className={isSidebarExpanded ? 'inline' : 'hidden'}>{item.label}</span>
                  </div>
                  {item.id === 'notifications' && unreadCount > 0 && isSidebarExpanded && (
                    <span className="bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
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

          {/* ==================== 7. NOTIFICATIONS VIEW ==================== */}
          {activeModule === 'notifications' && (
            <div className="space-y-6 animate-fade-in text-xs">
              <div className="flex justify-between items-center border-b border-[#2A2A2A] pb-6">
                <div>
                  <h2 className="font-serif-luxury text-2xl font-bold uppercase text-white">SYSTEM NOTIFICATIONS</h2>
                  <p className="text-xs text-[#8A8A8A]">Monitor trigger warnings, chat alerts, and low stock status events.</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllNotificationsRead}
                    className="bg-[#F8F6F2] hover:bg-white text-black font-bold uppercase px-4 py-2.5 rounded-full transition-all text-[10px]"
                  >
                    MARK ALL AS READ
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="py-20 text-center text-xs text-[#8A8A8A] uppercase bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl">
                  Your notification inbox is currently empty.
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-6 border rounded-2xl flex justify-between items-start transition-all bg-[#0A0A0A] ${
                        notif.is_read ? 'border-[#2A2A2A] opacity-60' : 'border-white'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="font-bold text-white uppercase text-xs block">{notif.title}</span>
                        <p className="text-[#B5B5B5] leading-relaxed text-xs">{notif.message}</p>
                        <span className="text-[10px] text-[#525252] font-mono block pt-1">{notif.created_at}</span>
                      </div>
                      {!notif.is_read && (
                        <button
                          onClick={() => handleMarkNotificationRead(notif.id)}
                          className="text-[10px] uppercase tracking-widest font-bold border border-[#2A2A2A] rounded-full px-4 py-2 hover:border-white transition-all bg-black"
                        >
                          MARK AS READ
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== 8. SETTINGS VIEW ==================== */}
          {activeModule === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-8 animate-fade-in text-xs">
              <div className="flex justify-between items-center border-b border-[#2A2A2A] pb-6">
                <div>
                  <h2 className="font-serif-luxury text-2xl font-bold uppercase text-white">SYSTEM SETTINGS CONTROL</h2>
                  <p className="text-xs text-[#8A8A8A]">Modify brand identity, active design presets, and core toggles.</p>
                </div>
                <button
                  type="submit"
                  className="bg-[#F8F6F2] hover:bg-white text-black font-bold uppercase px-5 py-3 rounded-full transition-all text-xs flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>SAVE SYSTEM PARAMETERS</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Brand Settings Card */}
                <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-8 space-y-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#B5B5B5] border-b border-[#2A2A2A] pb-2 block">
                    BRAND IDENTITY DETAILS
                  </span>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[#8A8A8A] font-semibold uppercase block">STOREFRONT BRAND NAME</label>
                      <input
                        type="text"
                        value={websiteSettings['site.name'] || ''}
                        onChange={(e) => setWebsiteSettings({ ...websiteSettings, 'site.name': e.target.value })}
                        className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white focus:border-white transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[#8A8A8A] font-semibold uppercase block">BRAND TAGLINE</label>
                      <input
                        type="text"
                        value={websiteSettings['site.tagline'] || ''}
                        onChange={(e) => setWebsiteSettings({ ...websiteSettings, 'site.tagline': e.target.value })}
                        className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white focus:border-white transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[#8A8A8A] font-semibold uppercase block">SEO META TITLE</label>
                      <input
                        type="text"
                        value={websiteSettings['site.seo_title'] || ''}
                        onChange={(e) => setWebsiteSettings({ ...websiteSettings, 'site.seo_title': e.target.value })}
                        className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white focus:border-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* System Toggles Card */}
                <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-8 space-y-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#B5B5B5] border-b border-[#2A2A2A] pb-2 block">
                    CORE SYSTEM ENGINES
                  </span>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-black border border-[#2A2A2A] rounded-xl">
                      <div>
                        <span className="font-bold text-white uppercase block">AI FEATURES INTEGRATION</span>
                        <span className="text-[10px] text-[#8A8A8A]">Enable automated copy generation and smart curation.</span>
                      </div>
                      <select
                        value={systemSettings['ai_enabled'] || '0'}
                        onChange={(e) => setSystemSettings({ ...systemSettings, 'ai_enabled': e.target.value })}
                        className="bg-[#0A0A0A] border border-[#2A2A2A] rounded px-3 py-1.5 outline-none text-white text-[10px] font-bold uppercase"
                      >
                        <option value="1">ENABLED</option>
                        <option value="0">DISABLED</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-black border border-[#2A2A2A] rounded-xl">
                      <div>
                        <span className="font-bold text-white uppercase block">VOICE ENGINE SUPPORT (HINDI)</span>
                        <span className="text-[10px] text-[#8A8A8A]">Activate multilingual vocal synthesis features.</span>
                      </div>
                      <select
                        value={systemSettings['voice_enabled'] || '0'}
                        onChange={(e) => setSystemSettings({ ...systemSettings, 'voice_enabled': e.target.value })}
                        className="bg-[#0A0A0A] border border-[#2A2A2A] rounded px-3 py-1.5 outline-none text-white text-[10px] font-bold uppercase"
                      >
                        <option value="1">ENABLED</option>
                        <option value="0">DISABLED</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-black border border-[#2A2A2A] rounded-xl">
                      <div>
                        <span className="font-bold text-white uppercase block">THEME MODE PREFERENCE</span>
                        <span className="text-[10px] text-[#8A8A8A]">Configure the brand's default interface lighting mode.</span>
                      </div>
                      <select
                        value={systemSettings['theme_mode'] || 'dark'}
                        onChange={(e) => setSystemSettings({ ...systemSettings, 'theme_mode': e.target.value })}
                        className="bg-[#0A0A0A] border border-[#2A2A2A] rounded px-3 py-1.5 outline-none text-white text-[10px] font-bold uppercase"
                      >
                        <option value="dark">DARK MODE</option>
                        <option value="light">LIGHT MODE</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme Preset Selection Card */}
              <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-8 space-y-6">
                <span className="text-xs font-bold uppercase tracking-widest text-[#B5B5B5] border-b border-[#2A2A2A] pb-2 block">
                  BRAND DESIGN PRESETS & TOKENS
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {themePresets.map((preset) => {
                    const isSelected = websiteSettings['site.primary_font'] === preset.tokens.fontFamily;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => {
                          setWebsiteSettings({
                            ...websiteSettings,
                            'site.primary_color': preset.tokens.primaryBackground,
                            'site.primary_font': preset.tokens.fontFamily,
                          });
                        }}
                        className={`p-6 border rounded-xl cursor-pointer transition-all space-y-4 bg-black ${
                          isSelected ? 'border-white ring-1 ring-white' : 'border-[#2A2A2A] hover:border-white'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white uppercase block text-xs">{preset.name}</span>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[9px] text-[#8A8A8A] font-mono">
                          <div>
                            <span className="block text-[8px] text-[#525252]">FONT</span>
                            <span className="text-white truncate block">{preset.tokens.fontFamily}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] text-[#525252]">ACCENT</span>
                            <span className="block w-4 h-4 rounded border border-[#2A2A2A]" style={{ backgroundColor: preset.tokens.accentColor }} />
                          </div>
                          <div>
                            <span className="block text-[8px] text-[#525252]">BG</span>
                            <span className="block w-4 h-4 rounded border border-[#2A2A2A]" style={{ backgroundColor: preset.tokens.primaryBackground }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </form>
          )}

          {/* ==================== 9. PUBLICATIONS/BLOG VIEW ==================== */}
          {activeModule === 'blogs' && (
            <div className="space-y-6 animate-fade-in text-xs">
              <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-6">
                <div>
                  <h2 className="font-serif-luxury text-2xl font-bold uppercase text-white">EDITORIAL PUBLICATIONS</h2>
                  <p className="text-xs text-[#8A8A8A]">Create, edit, publish, or retract brand journal stories and blog posts.</p>
                </div>
                <button
                  onClick={() => setShowBlogForm(!showBlogForm)}
                  className="flex items-center space-x-2 bg-[#F8F6F2] hover:bg-white text-black text-xs font-bold uppercase px-5 py-3 rounded-full transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>NEW JOURNAL POST</span>
                </button>
              </div>

              {showBlogForm && (
                <form onSubmit={handleCreateBlog} className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-8 space-y-6 text-xs">
                  <span className="text-xs uppercase tracking-widest text-[#B5B5B5] font-semibold border-b border-[#2A2A2A] pb-2 block">
                    CREATE JOURNAL PUBLICATION
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[#8A8A8A] font-semibold uppercase block">ARTICLE TITLE</label>
                      <input
                        type="text" required placeholder="e.g. THE ARCHITECTURE OF MODERN SILK"
                        value={blogForm.title} onChange={(e) => setBlogForm({...blogForm, title: e.target.value})}
                        className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white focus:border-white transition-all uppercase"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[#8A8A8A] font-semibold uppercase block">CATEGORY TAG</label>
                      <select
                        value={blogForm.category} onChange={(e) => setBlogForm({...blogForm, category: e.target.value})}
                        className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white focus:border-white transition-all uppercase font-semibold"
                      >
                        <option value="Design">Design</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Operations">Operations</option>
                        <option value="Culture">Culture</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[#8A8A8A] font-semibold uppercase block">ARTICLE CONTENT (MARKDOWN OR PLAIN TEXT)</label>
                    <textarea
                      required rows={8} placeholder="Draft your luxury publication article body details here..."
                      value={blogForm.content} onChange={(e) => setBlogForm({...blogForm, content: e.target.value})}
                      className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white focus:border-white transition-all leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center space-x-6">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox" checked={blogForm.is_published} onChange={(e) => setBlogForm({...blogForm, is_published: e.target.checked})}
                        className="rounded bg-black border-[#2A2A2A] text-white focus:ring-0 w-4 h-4"
                      />
                      <span className="font-semibold uppercase text-white">PUBLISH ARTICLE IMMEDIATELY</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="bg-[#F8F6F2] hover:bg-white text-black px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    SAVE & REGISTER PUBLICATION
                  </button>
                </form>
              )}

              {blogs.length === 0 ? (
                <div className="py-20 text-center text-xs text-[#8A8A8A] uppercase bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl">
                  No editorial publications found.
                </div>
              ) : (
                <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs text-[#B5B5B5]">
                    <thead className="bg-black text-[#8A8A8A] uppercase font-semibold border-b border-[#2A2A2A]">
                      <tr>
                        <th className="p-5">ARTICLE</th>
                        <th className="p-5">CATEGORY</th>
                        <th className="p-5">AUTHOR ID</th>
                        <th className="p-5">STATUS</th>
                        <th className="p-5 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2A2A]">
                      {blogs.map((blog) => (
                        <tr key={blog.id} className="hover:bg-[#111111]/30 transition-colors">
                          <td className="p-5">
                            <span className="font-bold text-white block uppercase">{blog.title}</span>
                            <span className="text-[10px] text-[#8A8A8A] font-mono block mt-0.5">/{blog.slug}</span>
                          </td>
                          <td className="p-5 uppercase font-medium">{blog.category}</td>
                          <td className="p-5 font-mono">ID: {blog.author_id || 'System'}</td>
                          <td className="p-5">
                            <span className={`inline-block font-semibold px-2 py-0.5 rounded text-[8px] uppercase tracking-widest ${
                              blog.is_published ? 'bg-green-500/10 border border-green-500/30 text-green-500' : 'bg-amber-500/10 border border-amber-500/30 text-amber-500'
                            }`}>
                              {blog.is_published ? 'PUBLISHED' : 'DRAFT'}
                            </span>
                          </td>
                          <td className="p-5 text-right">
                            <button
                              onClick={() => handleDeleteBlog(blog.id)}
                              className="text-red-500 hover:underline text-[10px] font-bold uppercase tracking-widest bg-black border border-[#2A2A2A] rounded-full px-4 py-2 hover:border-red-500 transition-all"
                            >
                              DELETE
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ==================== 10. CAREER APPLICATIONS VIEW ==================== */}
          {activeModule === 'careers' && (
            <div className="space-y-6 animate-fade-in text-xs">
              <div className="border-b border-[#2A2A2A] pb-6">
                <h2 className="font-serif-luxury text-2xl font-bold uppercase text-white">CAREER APPLICATIONS INBOX</h2>
                <p className="text-xs text-[#8A8A8A]">Review incoming talent applications, and convert successful applicants into Employees.</p>
              </div>

              {careers.length === 0 ? (
                <div className="py-20 text-center text-xs text-[#8A8A8A] uppercase bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl">
                  No job applications have been submitted yet.
                </div>
              ) : (
                <div className="space-y-6">
                  {careers.map((app) => (
                    <div key={app.id} className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-8 space-y-4">
                      <div className="flex justify-between items-start border-b border-[#2A2A2A] pb-4">
                        <div>
                          <span className="text-[10px] text-[#8A8A8A] uppercase tracking-wider block">APPLICANT DOSSIER</span>
                          <span className="text-lg font-bold text-white uppercase block mt-0.5">{app.name}</span>
                          <span className="text-xs text-[#8A8A8A] block">{app.email} &middot; {app.phone || 'NO PHONE'}</span>
                        </div>
                        <span className={`inline-block font-semibold px-2.5 py-1 rounded text-[10px] uppercase tracking-widest ${
                          app.status === 'Approved' ? 'bg-green-500/10 border border-green-500/30 text-green-500' :
                          app.status === 'Rejected' ? 'bg-red-500/10 border border-red-500/30 text-red-500' :
                          'bg-amber-500/10 border border-amber-500/30 text-amber-500'
                        }`}>
                          {app.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[#B5B5B5]">
                        <div className="space-y-1">
                          <span className="font-bold text-white uppercase block">ROLE INTERESTED IN:</span>
                          <p className="uppercase">{app.role_interest}</p>
                        </div>
                        {app.resume_link && (
                          <div className="space-y-1">
                            <span className="font-bold text-white block">PORTFOLIO / RESUME DOCUMENT:</span>
                            <a href={app.resume_link} target="_blank" rel="noreferrer" className="text-white underline font-mono break-all block">
                              {app.resume_link}
                            </a>
                          </div>
                        )}
                      </div>

                      {app.cover_letter && (
                        <div className="bg-black p-4 border border-[#2A2A2A] rounded-xl space-y-1.5 text-[#B5B5B5]">
                          <span className="font-bold text-white block uppercase">COVER LETTER / MESSAGE:</span>
                          <p className="leading-relaxed whitespace-pre-wrap">{app.cover_letter}</p>
                        </div>
                      )}

                      {app.status === 'Pending' && (
                        <div className="flex space-x-3 pt-2">
                          <button
                            onClick={() => setConvertingApplicant(app)}
                            className="bg-white text-black font-bold uppercase px-5 py-2.5 rounded-full text-[10px] tracking-widest hover:bg-[#F8F6F2] transition-all"
                          >
                            CONVERT TO TEAM MEMBER
                          </button>
                          <button
                            onClick={() => handleRejectApplicant(app.id)}
                            className="bg-black text-red-500 border border-[#2A2A2A] font-bold uppercase px-5 py-2.5 rounded-full text-[10px] tracking-widest hover:border-red-500 transition-all"
                          >
                            REJECT APPLICANT
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Convert Applicant Dialog Modal */}
              {convertingApplicant && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                  <form onSubmit={handleConvertApplicant} className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-8 max-w-md w-full space-y-6">
                    <div className="flex justify-between items-center border-b border-[#2A2A2A] pb-3">
                      <span className="font-serif-luxury font-bold text-lg uppercase text-white">CONVERT TO STAFF</span>
                      <button type="button" onClick={() => setConvertingApplicant(null)} className="text-[#8A8A8A] hover:text-white border border-[#2A2A2A] rounded-full p-1 bg-black">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-[#8A8A8A] leading-relaxed">
                      You are establishing a corporate user account for <span className="text-white font-bold">{convertingApplicant.name}</span> ({convertingApplicant.email}). Select their role and temporary credentials.
                    </p>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[#8A8A8A] font-semibold uppercase block">STAFF AUTHORITY ROLE</label>
                        <select
                          value={conversionForm.employeeRole}
                          onChange={(e) => setConversionForm({ ...conversionForm, employeeRole: e.target.value })}
                          className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white focus:border-white transition-all uppercase font-semibold"
                        >
                          <option value="Sub-admin">Sub-admin</option>
                          <option value="Manager">Manager</option>
                          <option value="Employee">Employee/Staff</option>
                          <option value="Customer Care">Customer Care</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[#8A8A8A] font-semibold uppercase block">TEMPORARY PASSWORD</label>
                        <input
                          type="password" required placeholder="Min 6 characters"
                          value={conversionForm.employeePassword}
                          onChange={(e) => setConversionForm({ ...conversionForm, employeePassword: e.target.value })}
                          className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white focus:border-white transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-white text-black font-bold uppercase px-6 py-3.5 rounded-full text-xs tracking-widest hover:bg-[#F8F6F2] transition-all"
                    >
                      APPROVE & CREATE STAFF PROFILE
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ==================== 11. EMPLOYEES & TEAM VIEW ==================== */}
          {activeModule === 'employees' && (
            <div className="space-y-6 animate-fade-in text-xs">
              <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-6">
                <div>
                  <h2 className="font-serif-luxury text-2xl font-bold uppercase text-white">EMPLOYEE DIRECTORY CONTROL</h2>
                  <p className="text-xs text-[#8A8A8A]">Manage staff authority clearances, permission overrides, or add new employees.</p>
                </div>
                <button
                  onClick={() => setShowEmployeeForm(!showEmployeeForm)}
                  className="flex items-center space-x-2 bg-[#F8F6F2] hover:bg-white text-black text-xs font-bold uppercase px-5 py-3 rounded-full transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>ADD NEW EMPLOYEE</span>
                </button>
              </div>

              {showEmployeeForm && (
                <form onSubmit={handleCreateEmployee} className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-8 space-y-6">
                  <span className="text-xs uppercase tracking-widest text-[#B5B5B5] font-semibold border-b border-[#2A2A2A] pb-2 block">
                    REGISTER CORPORATE TEAM MEMBER
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[#8A8A8A] font-semibold uppercase block">FULL NAME</label>
                      <input
                        type="text" required placeholder="e.g. MARCUS AURELIUS"
                        value={empForm.name} onChange={(e) => setEmpForm({...empForm, name: e.target.value})}
                        className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white focus:border-white transition-all uppercase"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[#8A8A8A] font-semibold uppercase block">EMAIL ADDRESS</label>
                      <input
                        type="email" required placeholder="e.g. marcus@weartome.com"
                        value={empForm.email} onChange={(e) => setEmpForm({...empForm, email: e.target.value})}
                        className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white focus:border-white transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[#8A8A8A] font-semibold uppercase block">TEMPORARY PASSWORD</label>
                      <input
                        type="password" required placeholder="Min 6 characters"
                        value={empForm.password} onChange={(e) => setEmpForm({...empForm, password: e.target.value})}
                        className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white focus:border-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[#8A8A8A] font-semibold uppercase block">STAFF AUTHORITY ROLE</label>
                      <select
                        value={empForm.role} onChange={(e) => setEmpForm({...empForm, role: e.target.value})}
                        className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white focus:border-white transition-all uppercase font-semibold"
                      >
                        <option value="Sub-admin">Sub-admin</option>
                        <option value="Manager">Manager</option>
                        <option value="Employee">Employee/Staff</option>
                        <option value="Customer Care">Customer Care</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[#8A8A8A] font-semibold uppercase block">EXPLICIT PERMISSIONS (JSON ARRAY OF STRINGS)</label>
                      <input
                        type="text" required
                        value={empForm.permissions} onChange={(e) => setEmpForm({...empForm, permissions: e.target.value})}
                        className="w-full bg-black border border-[#2A2A2A] rounded-xl px-4 py-3 outline-none text-white font-mono focus:border-white transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="bg-[#F8F6F2] hover:bg-white text-black px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    REGISTER STAFF ACCOUNT
                  </button>
                </form>
              )}

              <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-[#B5B5B5]">
                  <thead className="bg-black text-[#8A8A8A] uppercase font-semibold border-b border-[#2A2A2A]">
                    <tr>
                      <th className="p-5">STAFF NAME</th>
                      <th className="p-5">EMAIL</th>
                      <th className="p-5">STAFF ROLE</th>
                      <th className="p-5">OVERRIDE PERMISSIONS</th>
                      <th className="p-5 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2A2A]">
                    {users.filter((u: any) => u.role !== 'Customer').map((emp) => (
                      <tr key={emp.id} className="hover:bg-[#111111]/30 transition-colors">
                        <td className="p-5">
                          <span className="font-bold text-white block uppercase">{emp.name}</span>
                          <span className="text-[10px] text-[#8A8A8A] font-mono block mt-0.5">ID: #{emp.id}</span>
                        </td>
                        <td className="p-5 font-mono">{emp.email}</td>
                        <td className="p-5">
                          <span className="bg-[#F8F6F2]/10 border border-[#F8F6F2]/30 text-white font-bold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest">
                            {emp.role}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {(emp.permissions || []).map((perm: string) => (
                              <span key={perm} className="bg-black border border-[#2A2A2A] text-[#8A8A8A] font-mono text-[9px] px-1.5 py-0.5 rounded">
                                {perm}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-5 text-right">
                          {emp.email !== sessionUser.email && (
                            <button
                              onClick={() => handleDeleteEmployee(emp.id)}
                              className="text-red-500 hover:underline text-[10px] font-bold uppercase tracking-widest bg-black border border-[#2A2A2A] rounded-full px-4 py-2 hover:border-red-500 transition-all"
                            >
                              REMOVE
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== 12. REVENUE & MARGINS VIEW ==================== */}
          {activeModule === 'revenue' && (
            <div className="space-y-8 animate-fade-in text-xs">
              <div className="border-b border-[#2A2A2A] pb-6">
                <h2 className="font-serif-luxury text-2xl font-bold uppercase text-white">REVENUE & TRANSACTION LEDGER</h2>
                <p className="text-xs text-[#8A8A8A]">Examine cumulative platform performance performance metrics, gross margins, and order refund logs.</p>
              </div>

              {/* Financial KPI Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-6 space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-semibold block">TOTAL TRANSACTIONS VALUE</span>
                  <span className="text-2xl font-bold block text-white">₹{orders.reduce((acc, o) => acc + o.total_price, 0).toLocaleString()}</span>
                  <span className="text-[9px] text-green-500 block uppercase font-medium">✓ SECURED VOLUMES</span>
                </div>
                <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-6 space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-semibold block">ESTIMATED COGS MARGIN (70%)</span>
                  <span className="text-2xl font-bold block text-white">₹{Math.floor(orders.reduce((acc, o) => acc + o.total_price, 0) * 0.7).toLocaleString()}</span>
                  <span className="text-[9px] text-[#8A8A8A] block uppercase font-medium">REVENUE LESS COST OF GOODS</span>
                </div>
                <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-6 space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-semibold block">TRACKED REFUND LIABILITIES</span>
                  <span className="text-2xl font-bold block text-red-500">₹{orders.filter(o => o.status === 'Cancelled').reduce((acc, o) => acc + o.total_price, 0).toLocaleString()}</span>
                  <span className="text-[9px] text-[#8A8A8A] block uppercase font-medium">TIED TO CANCELLED ORDER ROWS</span>
                </div>
              </div>

              {/* Transaction details ledger */}
              <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-[#2A2A2A] bg-black/10">
                  <span className="text-xs font-bold uppercase tracking-widest text-white">DETAILED PERFORMANCE LEDGER</span>
                </div>
                <table className="w-full text-left text-xs text-[#B5B5B5]">
                  <thead className="bg-black text-[#8A8A8A] uppercase font-semibold border-b border-[#2A2A2A]">
                    <tr>
                      <th className="p-5">TRANSACTION ID</th>
                      <th className="p-5">BILLING RECIPIENT</th>
                      <th className="p-5">PAYMENT METHOD REF</th>
                      <th className="p-5">DISCOUNT SLICE</th>
                      <th className="p-5">TRANSACTION STATUS</th>
                      <th className="p-5 text-right">TOTAL AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2A2A]">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#111111]/30 transition-colors">
                        <td className="p-5 font-mono text-white">TXN-{ord.id}2026</td>
                        <td className="p-5 uppercase font-medium">{ord.customer_name}</td>
                        <td className="p-5 font-mono text-[#8A8A8A]">{ord.payment_ref || 'CARD-TOKEN-SIMULATED'}</td>
                        <td className="p-5 text-red-500 font-mono">-₹{ord.discount_applied.toLocaleString()}</td>
                        <td className="p-5">
                          <span className={`inline-block font-semibold px-2 py-0.5 rounded text-[8px] uppercase tracking-widest ${
                            ord.status === 'Cancelled' ? 'bg-red-500/10 border border-red-500/30 text-red-500' : 'bg-green-500/10 border border-green-500/30 text-green-500'
                          }`}>
                            {ord.status === 'Cancelled' ? 'REFUNDED' : 'PAID/SETTLED'}
                          </span>
                        </td>
                        <td className="p-5 text-right font-bold text-white">₹{ord.total_price.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

    </div>
  );
}
