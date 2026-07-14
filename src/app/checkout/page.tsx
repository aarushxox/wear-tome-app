'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowLeft, CreditCard, Shield, Truck, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CheckoutPage() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Coupon persist state
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  // checkout UI state
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState<any>(null);

  useEffect(() => {
    // Load cart
    fetch('/api/cart')
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setCartItems(data.items);
        }
      });

    // Load persisted coupon if any
    const persistedCode = localStorage.getItem('applied_coupon_code');
    const persistedDiscount = localStorage.getItem('applied_coupon_discount');
    if (persistedCode && persistedDiscount) {
      setCouponCode(persistedCode);
      setDiscountAmount(parseFloat(persistedDiscount));
    }
  }, []);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = Math.max(0, subtotal - discountAmount);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      alert('Please fill in shipping address.');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipping_address: `${name} | ${phone} | ${address}`,
          coupon_code: couponCode || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setOrderComplete(data);

        // Clear local storage coupon
        localStorage.removeItem('applied_coupon_code');
        localStorage.removeItem('applied_coupon_discount');

        // Confetti explosion
        confetti({
          particleCount: 180,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#FFFFFF', '#D4AF37', '#1A1A1A'],
        });
      } else {
        alert(data.error || 'Failed to complete order.');
      }
    } catch (error) {
      console.error('Checkout submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (orderComplete) {
    return (
      <>
        <Navbar cartCount={0} />
        <main className="flex-grow bg-black text-white flex items-center justify-center py-20 px-6 font-sans">
          <div className="max-w-md w-full bg-[#0A0A0A] border border-[#262626] rounded-2xl p-8 text-center space-y-6 animate-fade-in">
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-[#F8F6F2] animate-bounce" />
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-[#8A8A8A] font-semibold">TRANSACTION COMPLETED</span>
              <h1 className="font-serif-luxury text-3xl font-bold uppercase text-white">ORDER CONFIRMED</h1>
              <p className="text-sm text-[#8A8A8A]">
                Your Wear Tome pieces have been successfully acquired. Payment approved and stock reservations secured.
              </p>
            </div>

            {/* Receipt Summary */}
            <div className="bg-black border border-[#262626] rounded-xl p-5 text-left space-y-3 text-xs text-[#B5B5B5]">
              <div className="flex justify-between">
                <span>ORDER ID:</span>
                <span className="text-white font-semibold">#{orderComplete.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span>PAYMENT REFERENCE:</span>
                <span className="text-white font-semibold">{orderComplete.paymentRef}</span>
              </div>
              <div className="flex justify-between">
                <span>AMOUNT CHARGED:</span>
                <span className="text-white font-bold text-sm">₹{orderComplete.totalPrice.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => router.push('/dashboard?tab=orders')}
              className="w-full bg-[#F8F6F2] hover:bg-white text-black py-4 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all"
            >
              TRACK ORDER TIMELINE
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)} />

      <main className="flex-grow bg-[#000000] text-white py-12 px-6">
        <div className="max-w-7xl mx-auto animate-fade-in space-y-8">

          {/* Header */}
          <div className="border-b border-[#262626] pb-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-widest text-[#8A8A8A]">SECURED CHECKOUT</span>
              <h1 className="font-serif-luxury text-3xl md:text-4xl font-bold uppercase tracking-tight">ACQUISITION</h1>
            </div>
            <button onClick={() => router.push('/shop')} className="flex items-center space-x-2 text-xs uppercase tracking-widest text-[#8A8A8A] hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>CONTINUE SHOPPING</span>
            </button>
          </div>

          <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-16">

            {/* LEFT SIDE: Shipping address inputs */}
            <div className="lg:col-span-7 space-y-8">
              <div className="bg-[#0A0A0A] border border-[#262626] rounded-2xl p-8 space-y-6">
                <span className="text-xs uppercase tracking-widest text-[#B5B5B5] font-semibold border-b border-[#262626] pb-2 block">
                  01 / SHIPPING RECIPIENT
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-semibold">FULL LEGAL NAME</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. JANE DOE"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3.5 text-xs outline-none text-white focus:border-white transition-all uppercase"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-semibold">CONTACT PHONE</label>
                    <input
                      type="tel"
                      required
                      placeholder="+81 90 1234 5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3.5 text-xs outline-none text-white focus:border-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-semibold">FULL STREET ADDRESS</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. FLAT 404, MINIMALIST BUILDING, SHIBUYA, TOKYO, JAPAN"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3.5 text-xs outline-none text-white focus:border-white transition-all uppercase"
                  />
                </div>
              </div>

              {/* Payment simulation indicator */}
              <div className="bg-[#0A0A0A] border border-[#262626] rounded-2xl p-8 space-y-6">
                <span className="text-xs uppercase tracking-widest text-[#B5B5B5] font-semibold border-b border-[#262626] pb-2 block">
                  02 / TRANSACTION METHOD
                </span>

                <div className="flex items-center space-x-4 bg-black border border-white/20 p-5 rounded-xl">
                  <CreditCard className="w-6 h-6 text-white" />
                  <div className="flex-grow text-xs">
                    <span className="font-bold uppercase text-white block">WEAR TOME INSTANT DEBIT SYSTEM</span>
                    <span className="text-[#8A8A8A]">Simulated zero-cost checkout for testing. Credit reference token auto-issued on complete.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: Cart Order summary panel */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#0A0A0A] border border-[#262626] rounded-2xl p-6 space-y-6 sticky top-24">
                <span className="text-xs uppercase tracking-widest text-[#B5B5B5] font-semibold border-b border-[#262626] pb-2 block">
                  03 / ORDER BAG SUMMARY
                </span>

                <div className="space-y-4 max-h-[300px] overflow-y-auto scrollbar-hide">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex space-x-4 items-center">
                      <img
                        src={item.primaryImage}
                        alt={item.name}
                        className="w-12 h-16 object-cover bg-black border border-[#262626] rounded-lg"
                      />
                      <div className="flex-grow text-xs space-y-0.5">
                        <span className="font-semibold text-white uppercase block line-clamp-1">{item.name}</span>
                        <div className="flex space-x-2 text-[#8A8A8A]">
                          <span>QTY: {item.quantity}</span>
                          <span>SIZE: {item.size}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#F8F6F2]">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Pricing Summary */}
                <div className="space-y-2 border-t border-[#262626] pt-4 text-xs text-[#8A8A8A]">
                  <div className="flex justify-between">
                    <span>SUBTOTAL:</span>
                    <span className="text-white">₹{subtotal.toLocaleString()}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[#FF3B30]">
                      <span>APPLIED DISCOUNT:</span>
                      <span>-₹{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-[#262626]">
                    <span>FINAL CHARGED AMOUNT:</span>
                    <span className="text-[#F8F6F2]">₹{total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Security checks */}
                <div className="grid grid-cols-2 gap-3 pt-2 text-[9px] text-[#8A8A8A]">
                  <div className="flex items-center space-x-2 p-2.5 bg-black rounded-lg border border-[#262626]">
                    <Shield className="w-3.5 h-3.5 text-white flex-shrink-0" />
                    <span>SECURE 256-BIT ENCRYPTION</span>
                  </div>
                  <div className="flex items-center space-x-2 p-2.5 bg-black rounded-lg border border-[#262626]">
                    <Truck className="w-3.5 h-3.5 text-white flex-shrink-0" />
                    <span>INSURED DELIVERY</span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={cartItems.length === 0 || loading}
                  className="w-full bg-[#F8F6F2] hover:bg-white text-black py-4.5 rounded-full font-semibold text-xs uppercase tracking-widest transition-all scale-95 hover:scale-100 disabled:opacity-50"
                >
                  {loading ? 'RESERVING SEATS...' : 'ACQUIRE PIECES'}
                </button>
              </div>
            </div>

          </form>

        </div>
      </main>

      <Footer />
    </>
  );
}
