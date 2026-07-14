'use client';

import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCartUpdated: () => void;
  cartItems: any[];
}

export default function CartDrawer({ isOpen, onClose, onCartUpdated, cartItems }: CartDrawerProps) {
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Compute subtotal
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = Math.max(0, subtotal - discountAmount);

  const handleUpdateQty = async (id: number, newQty: number) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, quantity: newQty }),
      });
      if (res.ok) {
        onCartUpdated();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update quantity.');
      }
    } catch (error) {
      console.error('Update qty error:', error);
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      const res = await fetch(`/api/cart?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onCartUpdated();
      }
    } catch (error) {
      console.error('Delete item error:', error);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponError(null);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, cartItems }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setDiscountAmount(data.discount_amount);
        setAppliedCoupon(data.code);
        setCouponError(null);
        // Persist coupon details in localStorage for checkout mapping
        localStorage.setItem('applied_coupon_code', data.code);
        localStorage.setItem('applied_coupon_discount', data.discount_amount.toString());
      } else {
        setCouponError(data.error || 'Invalid coupon code.');
        setDiscountAmount(0);
        setAppliedCoupon(null);
      }
    } catch (error) {
      console.error('Coupon apply error:', error);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode('');
    setCouponError(null);
    localStorage.removeItem('applied_coupon_code');
    localStorage.removeItem('applied_coupon_discount');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-[#0A0A0A] border-l border-[#262626] h-full flex flex-col justify-between shadow-2xl z-10 animate-fade-in text-white">

        {/* Header */}
        <div className="p-6 border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-white" />
            <span className="font-serif-luxury font-bold text-lg tracking-widest uppercase">YOUR CART</span>
            <span className="text-xs text-[#8A8A8A] font-sans">({cartItems.length} items)</span>
          </div>
          <button onClick={onClose} className="p-2 text-[#8A8A8A] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Item list */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <span className="text-xs uppercase tracking-widest text-[#8A8A8A]">Your cart is currently empty.</span>
              <button onClick={onClose} className="text-xs bg-[#F8F6F2] text-black px-6 py-2.5 rounded-full font-semibold hover:bg-white transition-all">
                CONTINUE SHOPPING
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="flex space-x-4 border-b border-[#262626] pb-6 last:border-0 last:pb-0">
                <img
                  src={item.primaryImage}
                  alt={item.name}
                  className="w-20 h-24 object-cover bg-[#171717] rounded-lg border border-[#262626]"
                />
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-xs uppercase tracking-wider font-semibold line-clamp-1 text-white">{item.name}</span>
                      <button onClick={() => handleDeleteItem(item.id)} className="text-[#8A8A8A] hover:text-[#FF3B30] transition-colors p-0.5">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex space-x-3 text-[10px] text-[#8A8A8A] mt-1">
                      <span>SIZE: {item.size}</span>
                      <span>COLOR: {item.color}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity Selector */}
                    <div className="flex items-center space-x-2 border border-[#262626] rounded-full bg-black px-2 py-1">
                      <button
                        onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                        className="text-[#8A8A8A] hover:text-white p-0.5 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-semibold px-1 min-w-[15px] text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                        className="text-[#8A8A8A] hover:text-white p-0.5 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price details */}
                    <div className="text-right flex flex-col">
                      {item.discounted ? (
                        <>
                          <span className="text-[10px] text-[#8A8A8A] line-through">₹{(item.originalPrice * item.quantity).toLocaleString()}</span>
                          <span className="text-xs font-bold text-[#F8F6F2]">₹{(item.price * item.quantity).toLocaleString()}</span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-[#F8F6F2]">₹{(item.price * item.quantity).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer summary details */}
        {cartItems.length > 0 && (
          <div className="p-6 border-t border-[#262626] bg-[#0A0A0A] space-y-4">

            {/* Coupon input field */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-semibold">APPLY PROMOTION / COUPON</span>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-[#171717] px-4 py-2 rounded-full border border-[#262626] text-xs">
                  <span className="text-white font-semibold">COUPON APPLIED: {appliedCoupon}</span>
                  <button onClick={handleRemoveCoupon} className="text-[#FF3B30] text-[10px] font-bold uppercase hover:underline">
                    REMOVE
                  </button>
                </div>
              ) : (
                <div className="flex items-center border border-[#262626] rounded-full overflow-hidden bg-black p-1">
                  <input
                    type="text"
                    placeholder="ENTER CODE (e.g. WELCOME10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="bg-transparent border-0 outline-none text-xs text-white px-3 py-1.5 flex-grow uppercase"
                  />
                  <button onClick={handleApplyCoupon} className="bg-[#F8F6F2] hover:bg-white text-black text-xs font-semibold px-4 py-1.5 rounded-full transition-all">
                    APPLY
                  </button>
                </div>
              )}
              {couponError && <p className="text-[10px] text-[#FF3B30]">{couponError}</p>}
            </div>

            {/* Calculations summaries */}
            <div className="space-y-2 pt-2 border-t border-[#262626]">
              <div className="flex justify-between text-xs text-[#8A8A8A]">
                <span>SUBTOTAL:</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-xs text-[#FF3B30]">
                  <span>DISCOUNT:</span>
                  <span>-₹{discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-white pt-1">
                <span>ESTIMATED TOTAL:</span>
                <span className="text-white">₹{total.toLocaleString()}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <a
              href="/checkout"
              className="w-full bg-[#F8F6F2] hover:bg-white text-black py-4 rounded-full font-semibold flex items-center justify-center space-x-2 text-xs uppercase tracking-widest transition-all scale-95 hover:scale-100"
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
