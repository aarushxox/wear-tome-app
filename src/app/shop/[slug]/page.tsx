'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { ChevronRight, ArrowLeft, Plus, Minus, ShoppingBag, ShieldCheck, RefreshCw, Truck } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ProductDetailsPage() {
  const { slug } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<any>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Interaction State
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [zoomStyle, setZoomStyle] = useState({ display: 'none', backgroundPosition: '0% 0%' });
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (slug) {
      // Load product details
      fetch(`/api/products?slug=${slug}`)
        .then((res) => {
          if (!res.ok) throw new Error('Product not found');
          return res.json();
        })
        .then((data) => {
          setProduct(data.product);
          setGallery(data.gallery || []);

          // Pre-select first size/color if available
          try {
            const sizes = JSON.parse(data.product.sizes || '[]');
            if (sizes.length > 0) setSelectedSize(sizes[0]);
            const colors = JSON.parse(data.product.colors || '[]');
            if (colors.length > 0) setSelectedColor(colors[0]);
          } catch (e) {}
        })
        .catch((err) => {
          console.error(err);
          router.push('/shop');
        });
    }
    fetchCart();
  }, [slug]);

  const fetchCart = () => {
    fetch('/api/cart')
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setCartItems(data.items);
        }
      });
  };

  const handleZoomMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoomStyle({
      display: 'block',
      backgroundPosition: `${x}% ${y}%`,
    });
  };

  const handleZoomLeave = () => {
    setZoomStyle({ display: 'none', backgroundPosition: '0% 0%' });
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAdding(true);

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          quantity,
          size: selectedSize || 'One Size',
          color: selectedColor || 'Default',
        }),
      });

      if (res.ok) {
        // Trigger subtle cart addition celebration confetti
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFFFFF', '#D4AF37'],
        });

        fetchCart();
        setIsCartOpen(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add item to cart.');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <span className="text-xs uppercase tracking-widest text-[#8A8A8A]">LOADING WEAR TOME ARCHIVE...</span>
      </div>
    );
  }

  // Active discount price calculation
  let finalPrice = product.price;
  let hasActiveDiscount = false;
  if (product.discount_percent > 0) {
    const now = new Date();
    const start = product.discount_active_from ? new Date(product.discount_active_from) : null;
    const end = product.discount_active_to ? new Date(product.discount_active_to) : null;
    if ((!start || now >= start) && (!end || now <= end)) {
      finalPrice = product.price * (1 - product.discount_percent / 100);
      hasActiveDiscount = true;
    }
  }

  const sizesArray = JSON.parse(product.sizes || '[]');
  const colorsArray = JSON.parse(product.colors || '[]');
  const activeImageUrl = gallery[activeImageIdx]?.filepath || '/images/placeholder.webp';

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

      <main className="flex-grow bg-[#000000] text-white py-12 px-6">
        <div className="max-w-7xl mx-auto animate-fade-in space-y-12">

          {/* Back button */}
          <button
            onClick={() => router.push('/shop')}
            className="flex items-center space-x-2 text-xs uppercase tracking-widest text-[#8A8A8A] hover:text-white transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK TO ARCHIVE</span>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">

            {/* LEFT SIDE: Interactive Zoom Gallery */}
            <div className="space-y-6">
              <div
                onMouseMove={handleZoomMove}
                onMouseLeave={handleZoomLeave}
                className="relative w-full h-[600px] bg-[#111111] border border-[#262626] rounded-2xl overflow-hidden cursor-zoom-in"
              >
                <img
                  src={activeImageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />

                {/* High fidelity zoom lens */}
                <div
                  className="absolute inset-0 pointer-events-none border border-white/20 bg-no-repeat transition-opacity duration-150"
                  style={{
                    ...zoomStyle,
                    backgroundImage: `url(${activeImageUrl})`,
                    backgroundSize: '200%',
                  }}
                />

                {/* Badges */}
                <div className="absolute top-6 left-6 flex flex-col space-y-2">
                  {product.is_trending === 1 && (
                    <span className="bg-white text-black text-[9px] font-bold uppercase px-3 py-1 rounded-full tracking-widest">
                      TRENDING
                    </span>
                  )}
                  {hasActiveDiscount && (
                    <span className="bg-[#FF3B30] text-white text-[9px] font-bold uppercase px-3 py-1 rounded-full tracking-widest">
                      {product.discount_percent}% OFF
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnails list */}
              {gallery.length > 1 && (
                <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
                  {gallery.map((img, idx) => (
                    <button
                      key={img.filepath}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`relative w-20 h-24 rounded-lg bg-[#111111] overflow-hidden border transition-all ${
                        idx === activeImageIdx ? 'border-white scale-105' : 'border-[#262626] hover:border-[#525252]'
                      }`}
                    >
                      <img src={img.filepath} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT SIDE: Product Configuration details */}
            <div className="flex flex-col justify-between space-y-8">
              <div className="space-y-6">

                {/* Meta details */}
                <div className="space-y-2">
                  <span className="text-xs uppercase tracking-widest text-[#8A8A8A] font-semibold">
                    {product.subcategory} &middot; {product.quality_grade}
                  </span>
                  <h1 className="font-serif-luxury text-3xl md:text-5xl font-bold uppercase tracking-tight text-[#F8F6F2]">
                    {product.name}
                  </h1>
                </div>

                {/* Price block */}
                <div className="flex items-center space-x-4">
                  {hasActiveDiscount ? (
                    <>
                      <span className="text-sm text-[#8A8A8A] line-through">₹{product.price.toLocaleString()}</span>
                      <span className="text-2xl font-bold text-white">₹{finalPrice.toLocaleString()}</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-white">₹{product.price.toLocaleString()}</span>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-[#8A8A8A] leading-relaxed">
                  {product.description}
                </p>

                {/* Color Selector */}
                {colorsArray.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase tracking-widest text-[#B5B5B5] font-semibold">CHOOSE FABRIC COLOR</span>
                    <div className="flex space-x-3">
                      {colorsArray.map((col: string) => {
                        const isSelected = selectedColor === col;
                        return (
                          <button
                            key={col}
                            onClick={() => setSelectedColor(col)}
                            style={{ backgroundColor: col }}
                            className={`w-8 h-8 rounded-full border-2 transition-transform scale-95 hover:scale-100 ${
                              isSelected ? 'border-white ring-2 ring-black/50' : 'border-[#262626]'
                            }`}
                            title={col}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Size Selector */}
                {sizesArray.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase tracking-widest text-[#B5B5B5] font-semibold">SELECT EDITORIAL SIZE</span>
                    <div className="grid grid-cols-4 gap-2.5">
                      {sizesArray.map((sz: string) => {
                        const isSelected = selectedSize === sz;
                        return (
                          <button
                            key={sz}
                            onClick={() => setSelectedSize(sz)}
                            className={`py-3.5 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                              isSelected
                                ? 'bg-[#F8F6F2] text-black border-white font-bold'
                                : 'bg-black border-[#262626] text-white hover:border-[#525252]'
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity and stock section */}
                <div className="flex items-center space-x-6 pt-4">
                  <div className="flex items-center space-x-3 border border-[#262626] rounded-full bg-black px-4 py-2.5">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="text-[#8A8A8A] hover:text-white transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-semibold w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="text-[#8A8A8A] hover:text-white transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Stock Alert */}
                  <div className="text-xs">
                    {product.stock === 0 ? (
                      <span className="text-[#FF3B30] font-bold uppercase tracking-widest">OUT OF STOCK</span>
                    ) : product.stock <= 3 ? (
                      <span className="text-[#FF3B30] font-bold uppercase tracking-widest">
                        LOW STOCK WARNING &middot; ONLY {product.stock} LEFT!
                      </span>
                    ) : (
                      <span className="text-[#8A8A8A] uppercase tracking-widest">
                        AVAILABLE STOCK: {product.stock} ITEMS
                      </span>
                    )}
                  </div>
                </div>

              </div>

              {/* Action purchase bar */}
              <div className="space-y-4 pt-6 border-t border-[#262626]">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0 || isAdding}
                  className={`w-full py-4.5 rounded-full font-semibold flex items-center justify-center space-x-2 text-xs uppercase tracking-widest transition-all scale-95 hover:scale-100 ${
                    product.stock === 0
                      ? 'bg-[#262626] text-[#8A8A8A] cursor-not-allowed'
                      : 'bg-[#F8F6F2] text-black hover:bg-white cursor-pointer'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isAdding ? 'ADDING TO SEWING BAG...' : 'ADD TO BAG'}</span>
                </button>

                {/* High quality brand indicators */}
                <div className="grid grid-cols-3 gap-4 pt-4 text-center text-[10px] text-[#8A8A8A]">
                  <div className="flex flex-col items-center space-y-1.5 p-3 bg-[#0A0A0A] border border-[#262626] rounded-xl">
                    <Truck className="w-4 h-4 text-white" />
                    <span className="font-semibold uppercase text-white">FREE SHIPPING</span>
                    <span>WORLDWIDE DETAILS</span>
                  </div>
                  <div className="flex flex-col items-center space-y-1.5 p-3 bg-[#0A0A0A] border border-[#262626] rounded-xl">
                    <RefreshCw className="w-4 h-4 text-white" />
                    <span className="font-semibold uppercase text-white">30 DAYS RETURNS</span>
                    <span>EASY SERVICE</span>
                  </div>
                  <div className="flex flex-col items-center space-y-1.5 p-3 bg-[#0A0A0A] border border-[#262626] rounded-xl">
                    <ShieldCheck className="w-4 h-4 text-white" />
                    <span className="font-semibold uppercase text-white">SECURE PAYMENT</span>
                    <span>100% ASSURED</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
