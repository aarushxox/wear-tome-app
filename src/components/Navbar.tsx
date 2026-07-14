'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Heart, User, MessageCircle, LogOut } from 'lucide-react';

interface NavbarProps {
  cartCount?: number;
  wishlistCount?: number;
  onCartClick?: () => void;
}

export default function Navbar({ cartCount = 0, wishlistCount = 0, onCartClick }: NavbarProps) {
  const [user, setUser] = useState<any>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    // Fetch user session
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
          setUnreadNotifications(data.unreadNotificationsCount || 0);
        }
      })
      .catch((err) => console.error('Session load error:', err));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#262626]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left Links */}
        <nav className="hidden md:flex items-center space-x-8 text-xs uppercase tracking-widest font-medium text-[#B5B5B5]">
          <Link href="/shop" className="hover:text-white transition-colors duration-200">Shop All</Link>
          <Link href="/shop?gender=men" className="hover:text-white transition-colors duration-200">Men</Link>
          <Link href="/shop?gender=women" className="hover:text-white transition-colors duration-200">Women</Link>
          <Link href="/shop?gender=unisex" className="hover:text-white transition-colors duration-200">Unisex</Link>
        </nav>

        {/* Brand Logo - Playfair Display Serif */}
        <Link href="/" className="font-serif-luxury text-xl md:text-2xl font-bold tracking-widest text-[#F8F6F2] hover:opacity-90 transition-opacity">
          WEAR TOME
        </Link>

        {/* Right Controls */}
        <div className="flex items-center space-x-6 text-white">
          {user ? (
            <div className="flex items-center space-x-6">
              {/* Profile Link */}
              <Link href="/dashboard" className="flex items-center space-x-1 text-xs uppercase tracking-widest font-medium text-[#B5B5B5] hover:text-white transition-colors duration-200">
                <User className="w-4 h-4" />
                <span className="hidden md:inline">{user.name.split(' ')[0]}</span>
              </Link>

              {/* Support Chat link */}
              <Link href="/dashboard?tab=chat" className="relative p-1 hover:opacity-85 transition-opacity">
                <MessageCircle className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-black text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full scale-90">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </Link>

              {/* Wishlist Link */}
              <Link href="/dashboard?tab=wishlist" className="p-1 hover:opacity-85 transition-opacity relative">
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-black text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full scale-90">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Persistent Cart Clicker */}
              <button onClick={onCartClick} className="p-1 hover:opacity-85 transition-opacity relative">
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-black text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full scale-90">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Logout button */}
              <button onClick={handleLogout} className="p-1 text-[#8A8A8A] hover:text-[#FF3B30] transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-xs uppercase tracking-widest font-medium text-[#B5B5B5] hover:text-white transition-colors">
                Login
              </Link>
              <Link href="/login?tab=signup" className="text-xs uppercase tracking-widest font-medium bg-[#F8F6F2] text-black px-4 py-2 rounded-full hover:bg-white transition-all scale-95 hover:scale-100">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
