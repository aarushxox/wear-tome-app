'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import OnboardingFlow from '@/components/OnboardingFlow';
import CartDrawer from '@/components/CartDrawer';
import { ChevronLeft, ChevronRight, ArrowRight, Eye } from 'lucide-react';

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Hero Slider State
  const [currentSlide, setCurrentSlide] = useState(0);
  const heroSlides = [
    {
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1920&q=80',
      title: 'SILK & CONCRETE',
      sub: 'SEASON DROP 2026',
      desc: 'Japanese structural cuts meet industrial Scandi silhouettes.',
      cta: 'EXPLORE COLLECTION',
    },
    {
      image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1920&q=80',
      title: 'THE MINIMAL AGE',
      sub: 'EDITORIAL SPREAD #11',
      desc: 'Clean grayscale blocks built with heavy luxury knitwear.',
      cta: 'VIEW CATALOG',
    },
  ];

  useEffect(() => {
    // Check if onboarding is completed or user is logged in
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          // If onboarding values are empty, trigger slide-up onboarding wizard
          if (!data.user.gender && !data.user.how_found) {
            setShowOnboarding(true);
          }
          fetchCart();
        }
      });

    // Load trending seeded products
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.products) {
          setProducts(data.products);
        }
      });
  }, []);

  const fetchCart = () => {
    fetch('/api/cart')
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setCartItems(data.items);
        }
      });
  };

  const handleNextSlide = () => {
    setCurrentSlide((s) => (s + 1) % heroSlides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((s) => (s - 1 + heroSlides.length) % heroSlides.length);
  };

  return (
    <>
      {/* Dynamic Navigation Bar */}
      <Navbar
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
      />

      {/* Onboarding Wizard popup */}
      {showOnboarding && (
        <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onCartUpdated={fetchCart}
      />

      <main className="flex-grow bg-black text-white">

        {/* Luxury Hero Slider Section */}
        <section className="relative h-[85vh] w-full overflow-hidden border-b border-[#262626]">
          <div className="absolute inset-0">
            <img
              src={heroSlides[currentSlide].image}
              alt="Hero image"
              className="w-full h-full object-cover opacity-60 transition-all duration-1000 transform scale-105"
            />
            {/* Soft dark radial vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
          </div>

          {/* Slider content */}
          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-20 max-w-7xl mx-auto">
            <div className="max-w-xl space-y-4 animate-fade-in">
              <span className="text-xs tracking-[0.3em] font-semibold text-[#B5B5B5] uppercase">
                {heroSlides[currentSlide].sub}
              </span>
              <h1 className="font-serif-luxury text-4xl md:text-6xl font-bold tracking-tight text-white leading-none">
                {heroSlides[currentSlide].title}
              </h1>
              <p className="text-sm text-[#8A8A8A] max-w-md">
                {heroSlides[currentSlide].desc}
              </p>
              <div className="pt-4">
                <Link href="/shop" className="inline-flex items-center space-x-3 bg-[#F8F6F2] hover:bg-white text-black text-xs font-semibold uppercase tracking-widest px-8 py-4 rounded-full transition-all">
                  <span>{heroSlides[currentSlide].cta}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Slider Controllers */}
          <div className="absolute bottom-10 right-10 flex space-x-3 z-10">
            <button onClick={handlePrevSlide} className="p-3 border border-white/20 rounded-full bg-black/40 hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button onClick={handleNextSlide} className="p-3 border border-white/20 rounded-full bg-black/40 hover:bg-white/10 transition-colors">
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </section>

        {/* Featured Editorial Section (White Space Magazine Inspired) */}
        <section className="py-24 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <span className="text-xs uppercase tracking-widest text-[#B5B5B5] font-semibold">01 / BRAND EDITORIAL</span>
            <h2 className="font-serif-luxury text-3xl md:text-5xl font-semibold leading-tight text-[#F8F6F2]">
              Structured Minimalists for the Modern Wardrobe.
            </h2>
            <p className="text-sm text-[#8A8A8A] leading-relaxed">
              At Wear Tome, we reject drop shipping template culture and colorful noise. Our catalog features high-end fabrics engineered to last, shaped into architectural blocks of grayscale. No neon, no gradients—just pure tailored structures.
            </p>
            <div className="pt-4">
              <Link href="/shop" className="text-xs uppercase tracking-widest text-white border-b border-white pb-1.5 font-bold hover:opacity-80 transition-opacity">
                VIEW JOURNAL LOOKBOOK &rarr;
              </Link>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=80"
              alt="Editorial model"
              className="w-full h-[500px] object-cover rounded-2xl border border-[#262626]"
            />
          </div>
        </section>

        {/* Trending product carousel */}
        <section className="bg-[#0A0A0A] py-20 border-t border-b border-[#262626]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between mb-12">
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-widest text-[#8A8A8A] font-semibold font-sans">02 / TRENDING PIECES</span>
                <h3 className="font-serif-luxury text-2xl md:text-4xl text-white font-bold uppercase">LATEST HOT RELEASES</h3>
              </div>
              <Link href="/shop" className="text-xs text-[#B5B5B5] hover:text-white uppercase tracking-widest font-bold">
                SEE ALL PRODUCTS &rarr;
              </Link>
            </div>

            {/* Product card grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {products.slice(0, 3).map((item) => {
                // Check if has active discount
                let finalPrice = item.price;
                let hasDiscount = false;
                if (item.discount_percent > 0) {
                  finalPrice = item.price * (1 - item.discount_percent / 100);
                  hasDiscount = true;
                }

                return (
                  <div key={item.id} className="group relative flex flex-col space-y-4 bg-black border border-[#262626] rounded-2xl p-4 transition-all duration-300 hover:border-white">
                    {/* Image frame */}
                    <div className="relative w-full h-[400px] overflow-hidden rounded-xl bg-[#111111] border border-[#262626]">
                      {/* Image #1 default */}
                      <img
                        src={item.primaryImage}
                        alt={item.name}
                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0"
                      />
                      {/* Image #2 on hover */}
                      <img
                        src={item.hoverImage}
                        alt={`${item.name} alternate view`}
                        className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      />

                      {/* Trending / Discount badges */}
                      <div className="absolute top-4 left-4 flex flex-col space-y-2">
                        {item.is_trending === 1 && (
                          <span className="bg-white text-black text-[9px] font-bold uppercase px-2.5 py-1 rounded-full tracking-widest">
                            TRENDING
                          </span>
                        )}
                        {hasDiscount && (
                          <span className="bg-[#FF3B30] text-white text-[9px] font-bold uppercase px-2.5 py-1 rounded-full tracking-widest">
                            {item.discount_percent}% OFF
                          </span>
                        )}
                      </div>

                      {/* Quick Add link */}
                      <Link
                        href={`/shop/${item.slug}`}
                        className="absolute bottom-4 right-4 bg-black/85 text-white p-3 rounded-full border border-white/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>

                    {/* Metadata details */}
                    <div className="flex justify-between items-start pt-2">
                      <div className="space-y-1">
                        <Link href={`/shop/${item.slug}`} className="text-xs uppercase tracking-wider font-semibold text-white hover:underline">
                          {item.name}
                        </Link>
                        <p className="text-[10px] text-[#8A8A8A] font-medium uppercase tracking-widest">
                          {item.subcategory} &middot; {item.quality_grade}
                        </p>
                      </div>

                      <div className="text-right flex flex-col">
                        {hasDiscount ? (
                          <>
                            <span className="text-[10px] text-[#8A8A8A] line-through">₹{item.price.toLocaleString()}</span>
                            <span className="text-xs font-bold text-white">₹{finalPrice.toLocaleString()}</span>
                          </>
                        ) : (
                          <span className="text-xs font-bold text-white">₹{item.price.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      </main>

      {/* Luxury Footer */}
      <Footer />
    </>
  );
}
