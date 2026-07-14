'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <span className="text-xs uppercase tracking-widest text-[#8A8A8A]">LOADING SECURED CONSOLE...</span>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab state: 'login' or 'signup'
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(
    (searchParams.get('tab') as 'login' | 'signup') || 'login'
  );

  // Forms inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Reset inputs and errors on tab swap
    setError(null);
    setEmail('');
    setPassword('');
    setName('');
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = activeTab === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const payload = activeTab === 'login'
      ? { email, password }
      : { email, password, name };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        // Redirection logic
        if (data.user.role === 'Admin' || data.user.role === 'Sub-admin' || data.user.role === 'Manager') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        setError(data.error || 'Authenticating failed. Please check credentials.');
      }
    } catch (err) {
      console.error('Authentication Error:', err);
      setError('A connection issue occurred. Please check network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-[#0A0A0A] border border-[#262626] rounded-2xl p-8 space-y-8 animate-fade-in relative overflow-hidden">

        {/* Editorial Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="font-serif-luxury text-3xl font-bold tracking-[0.2em] text-[#F8F6F2] hover:opacity-90">
            WEAR TOME
          </Link>
          <p className="text-[10px] text-[#8A8A8A] uppercase tracking-widest font-semibold">
            LUXURY MINIMALIST APPAREL SYSTEM
          </p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 bg-black border border-[#262626] rounded-full p-1">
          <button
            onClick={() => setActiveTab('login')}
            className={`py-2.5 rounded-full text-xs font-semibold uppercase tracking-widest transition-all ${
              activeTab === 'login' ? 'bg-[#F8F6F2] text-black font-bold' : 'text-[#8A8A8A] hover:text-white'
            }`}
          >
            LOGIN
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`py-2.5 rounded-full text-xs font-semibold uppercase tracking-widest transition-all ${
              activeTab === 'signup' ? 'bg-[#F8F6F2] text-black font-bold' : 'text-[#8A8A8A] hover:text-white'
            }`}
          >
            SIGN UP
          </button>
        </div>

        {/* Form panel */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <p className="text-xs text-[#FF3B30] text-center bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-xl py-3 px-4 font-semibold uppercase tracking-wide">
              {error}
            </p>
          )}

          {activeTab === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-semibold">FULL LEGAL NAME</label>
              <input
                type="text"
                required
                placeholder="e.g. JANE DOE"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3.5 text-sm outline-none text-white focus:border-white transition-all uppercase"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-semibold">EMAIL ADDRESS</label>
            <input
              type="email"
              required
              placeholder="e.g. CUSTOMER@WEARTOME.COM"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3.5 text-sm outline-none text-white focus:border-white transition-all uppercase"
            />
          </div>

          <div className="space-y-1.5 relative">
            <label className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-semibold">SECURE PASSWORD</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-[#262626] rounded-xl pl-4 pr-12 py-3.5 text-sm outline-none text-white focus:border-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-[#8A8A8A] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Trigger button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F8F6F2] hover:bg-white text-black py-4 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all scale-95 hover:scale-100 disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING PIECES...' : activeTab === 'login' ? 'PROCEED TO ACCOUNT' : 'SUBMIT REGISTRATION'}
          </button>
        </form>

        {/* Credentials hints helpful for testing */}
        <div className="pt-4 border-t border-[#262626] text-center space-y-1.5 text-[10px] text-[#8A8A8A]">
          <span className="font-semibold text-white uppercase block">TEST SEEDED ACCOUNTS</span>
          <p>Admin Login: weartome@admin.com / weartomeadmin@17</p>
          <p>Customer Login: testcustomer@weartome.com / customerpass123</p>
        </div>

      </div>
    </main>
  );
}
