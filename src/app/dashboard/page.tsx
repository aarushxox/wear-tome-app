'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { User, ShoppingBag, MessageCircle, Heart, CheckCircle2, ArrowRight, RefreshCw, Send, Check } from 'lucide-react';

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <span className="text-xs uppercase tracking-widest text-[#8A8A8A]">GETTING SECURED CREDENTIAL CONSOLE...</span>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Tab state: 'profile', 'orders', 'chat', 'wishlist'
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'profile');

  // Customer Data State
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Chat Sub-state
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [typedMessage, setTypedMessage] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Edit profile state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [password, setPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  useEffect(() => {
    // Authenticate and load session
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.push('/login');
        } else {
          setCustomer(data.user);
          setEditName(data.user.name);
          setEditPhone(data.user.phone || '');
          setEditAddress(data.user.category_pref || ''); // Use category_pref as temporary address fallback
          fetchCart();
          fetchOrders();
          fetchChatMessages();
          loadWishlist();
        }
      });
  }, []);

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToChatBottom();
    }
  }, [activeTab, chatMessages]);

  const fetchCart = () => {
    fetch('/api/cart')
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setCartItems(data.items);
        }
      });
  };

  const fetchOrders = () => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) {
          setOrders(data.orders);
        }
      });
  };

  const fetchChatMessages = () => {
    fetch('/api/chat')
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) {
          setChatMessages(data.messages);
        }
      });
  };

  const loadWishlist = () => {
    // We can maintain a local mock wishlist or fetch
    setWishlist([
      { id: 2, name: 'Golden Hour Watch', price: 45000, subcategory: 'Watches', image: '/images/products/golden-hour-watch-primary.webp' }
    ]);
  };

  const scrollToChatBottom = () => {
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    try {
      // Simulate/perform profile updates on user
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender: customer.gender,
          how_found: customer.how_found,
          style_pref: editPhone, // Temporary mappings
          category_pref: editAddress,
        }),
      });

      if (res.ok) {
        setProfileMessage('Your profile metadata has been successfully updated.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: typedMessage }),
      });

      if (res.ok) {
        setTypedMessage('');
        fetchChatMessages();
      }
    } catch (error) {
      console.error('Error sending support message:', error);
    }
  };

  if (!customer) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <span className="text-xs uppercase tracking-widest text-[#8A8A8A]">GETTING SECURED CREDENTIAL CONSOLE...</span>
      </div>
    );
  }

  return (
    <>
      <Navbar
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onCartUpdated={fetchCart}
      />

      <main className="flex-grow bg-black text-white py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 animate-fade-in">

          {/* LEFT SIDE: Vertical Dashboard Nav Tab Selectors */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-[#0A0A0A] border border-[#262626] rounded-2xl p-6 space-y-6">

              <div className="space-y-1.5 border-b border-[#262626] pb-4">
                <span className="text-xs text-[#8A8A8A] font-semibold uppercase tracking-wider block">CUSTOMER LEVEL</span>
                <span className="font-serif-luxury font-bold text-lg text-white block">{customer.name.toUpperCase()}</span>
                <span className="inline-block text-[9px] bg-[#F8F6F2] text-black font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {customer.promotion_tier} MEMBER
                </span>
              </div>

              {/* Navigation Tabs */}
              <div className="flex flex-col space-y-1.5">
                {[
                  { id: 'profile', label: 'MY PROFILE', icon: User },
                  { id: 'orders', label: 'MY ORDERS', icon: ShoppingBag },
                  { id: 'chat', label: 'SUPPORT CHAT', icon: MessageCircle },
                  { id: 'wishlist', label: 'MY WISHLIST', icon: Heart },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isSel = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        router.push(`/dashboard?tab=${tab.id}`);
                      }}
                      className={`flex items-center space-x-3.5 text-left px-4 py-3.5 rounded-xl border text-xs font-semibold uppercase tracking-widest transition-all duration-150 ${
                        isSel
                          ? 'bg-[#F8F6F2] text-black border-white font-bold'
                          : 'bg-black border-transparent text-[#8A8A8A] hover:text-white hover:bg-[#111111]'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

            </div>
          </div>

          {/* RIGHT SIDE: Interactive Content Section Panels */}
          <div className="lg:col-span-9">

            {/* 1. PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="bg-[#0A0A0A] border border-[#262626] rounded-2xl p-8 space-y-6">
                <div className="border-b border-[#262626] pb-4">
                  <span className="text-xs uppercase tracking-widest text-[#8A8A8A] font-semibold">01 / SECURITY PRESET</span>
                  <h2 className="font-serif-luxury text-2xl md:text-3xl font-bold uppercase text-white mt-1">PERSONAL DETAILS</h2>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  {profileMessage && (
                    <p className="text-xs text-black bg-[#F8F6F2] border border-white py-3 px-4 rounded-xl font-semibold uppercase tracking-wide flex items-center space-x-2">
                      <Check className="w-4 h-4" />
                      <span>{profileMessage}</span>
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-semibold">FULL LEGAL NAME</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3.5 text-xs outline-none text-white focus:border-white transition-all uppercase"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-semibold">EMAIL ADDRESS</label>
                      <input
                        type="email"
                        disabled
                        value={customer.email}
                        className="w-full bg-[#111111] border border-[#262626] rounded-xl px-4 py-3.5 text-xs outline-none text-[#8A8A8A] cursor-not-allowed uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-semibold">CONTACT PHONE</label>
                      <input
                        type="text"
                        placeholder="ENTER CONTACT PHONE"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3.5 text-xs outline-none text-white focus:border-white transition-all uppercase"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-semibold">PASSWORD CORRECTION</label>
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3.5 text-xs outline-none text-white focus:border-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-semibold">SAVED SHIPPING ADDRESS</label>
                    <textarea
                      rows={3}
                      placeholder="ENTER SHIPPING ADDRESS DETAILS FOR FASTER ORDER ACQUISITIONS"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3.5 text-xs outline-none text-white focus:border-white transition-all uppercase"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-[#F8F6F2] hover:bg-white text-black px-8 py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest transition-all scale-95 hover:scale-100"
                  >
                    SAVE PROFILE DETAILS
                  </button>
                </form>
              </div>
            )}

            {/* 2. ORDERS TRACKING TAB */}
            {activeTab === 'orders' && (
              <div className="bg-[#0A0A0A] border border-[#262626] rounded-2xl p-8 space-y-6">
                <div className="border-b border-[#262626] pb-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-[#8A8A8A] font-semibold">02 / ORDER SEATS</span>
                    <h2 className="font-serif-luxury text-2xl md:text-3xl font-bold uppercase text-white mt-1">ACQUISITION HISTORY</h2>
                  </div>
                  <button onClick={fetchOrders} className="p-2 border border-[#262626] rounded-full bg-black hover:bg-[#111111] transition-colors">
                    <RefreshCw className="w-4 h-4 text-white" />
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="py-16 text-center space-y-4">
                    <span className="text-xs uppercase tracking-widest text-[#8A8A8A]">No order rows found for your account.</span>
                    <button onClick={() => router.push('/shop')} className="text-xs bg-[#F8F6F2] text-black px-6 py-2.5 rounded-full font-semibold">
                      BROWSE ALL PRODUCTS
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => {
                      // Status timeline index
                      const states = ['Pending', 'Shipped', 'Out for Delivery', 'Delivered'];
                      let currentIdx = states.indexOf(order.status);
                      if (currentIdx === -1) currentIdx = 0; // fallback

                      return (
                        <div key={order.id} className="border border-[#262626] rounded-2xl bg-black p-6 space-y-6">

                          {/* Order top details */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#262626] pb-4 space-y-2 md:space-y-0 text-xs">
                            <div className="space-y-1">
                              <span className="font-bold text-white uppercase block">ORDER ROW ID: #{order.id}</span>
                              <span className="text-[#8A8A8A] block">Placed: {new Date(order.created_at).toLocaleString()}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[#8A8A8A] block">TOTAL PRICE:</span>
                              <span className="font-bold text-white block">₹{order.total_price.toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Order visual tracking timeline */}
                          <div className="space-y-4">
                            <span className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-semibold block">TRACKING TIMELINE DETAILS</span>

                            <div className="grid grid-cols-4 gap-2 relative">
                              {states.map((st, idx) => {
                                const isPassed = idx <= currentIdx;
                                const isCurrent = idx === currentIdx;
                                return (
                                  <div key={st} className="flex flex-col items-center text-center space-y-2">
                                    <div className={`h-1.5 w-full rounded-full ${isPassed ? 'bg-[#F8F6F2]' : 'bg-[#262626]'}`} />
                                    <span className={`text-[9px] uppercase tracking-widest font-semibold ${isCurrent ? 'text-white' : isPassed ? 'text-[#B5B5B5]' : 'text-[#8A8A8A]'}`}>
                                      {st}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Address details */}
                          <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-4 text-xs text-[#8A8A8A]">
                            <span className="font-semibold text-white uppercase block mb-1">SHIPPING COORDINATES:</span>
                            <span>{order.shipping_address}</span>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 3. CUSTOMER SUPPORT LIVE CHAT TAB */}
            {activeTab === 'chat' && (
              <div className="bg-[#0A0A0A] border border-[#262626] rounded-2xl h-[550px] flex flex-col justify-between overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-[#262626] flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-[#8A8A8A] font-semibold">03 / CONVERSATION</span>
                    <h2 className="font-serif-luxury text-xl font-bold uppercase text-white mt-1">CUSTOMER SUPPORT INBOX</h2>
                  </div>
                  <button onClick={fetchChatMessages} className="p-2 border border-[#262626] rounded-full bg-black hover:bg-[#111111] transition-colors">
                    <RefreshCw className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>

                {/* Message list scrolling panel */}
                <div className="flex-grow overflow-y-auto p-6 space-y-4 scrollbar-hide bg-black/40">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                      <span className="text-xs uppercase tracking-widest text-[#8A8A8A]">No messages exchanged yet.</span>
                      <p className="text-xs text-[#8A8A8A] max-w-xs">Raise any product, delivery, or custom tailoring queries. Our support staff is online.</p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMe = msg.sender_id === customer.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs p-4 rounded-xl text-xs space-y-1.5 border ${
                            isMe
                              ? 'bg-[#171717] border-[#262626] text-white rounded-br-none'
                              : 'bg-[#F8F6F2] text-black border-white rounded-bl-none'
                          }`}>
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            <span className="block text-[8px] opacity-75 text-right">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Sender action form footer */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-[#262626] bg-black flex items-center space-x-3">
                  <input
                    type="text"
                    placeholder="TYPE SECURED INBOX QUERY..."
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                    className="bg-[#0A0A0A] border border-[#262626] rounded-full px-5 py-3.5 text-xs text-white outline-none flex-grow focus:border-white transition-all uppercase"
                  />
                  <button type="submit" className="bg-[#F8F6F2] hover:bg-white text-black p-3.5 rounded-full transition-colors flex-shrink-0">
                    <Send className="w-4 h-4" />
                  </button>
                </form>

              </div>
            )}

            {/* 4. WISHLIST TAB */}
            {activeTab === 'wishlist' && (
              <div className="bg-[#0A0A0A] border border-[#262626] rounded-2xl p-8 space-y-6">
                <div className="border-b border-[#262626] pb-4">
                  <span className="text-xs uppercase tracking-widest text-[#8A8A8A] font-semibold">04 / BOOKMARKS</span>
                  <h2 className="font-serif-luxury text-2xl md:text-3xl font-bold uppercase text-white mt-1">SAVED PIECES</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {wishlist.map((item) => (
                    <div key={item.id} className="border border-[#262626] rounded-xl p-4 bg-black space-y-3 relative group">
                      <img src={item.image} alt={item.name} className="w-full h-44 object-cover bg-[#111111] rounded-lg" />
                      <div className="space-y-0.5 text-xs">
                        <span className="font-bold text-white uppercase block line-clamp-1">{item.name}</span>
                        <span className="text-[#8A8A8A] uppercase tracking-widest text-[9px] block">{item.subcategory}</span>
                        <span className="text-white font-semibold block mt-1">₹{item.price.toLocaleString()}</span>
                      </div>
                      <button
                        onClick={() => router.push(`/shop/golden-hour-watch`)}
                        className="w-full mt-2 bg-[#F8F6F2] hover:bg-white text-black py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                      >
                        VIEW DETAIL
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
