'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { SlidersHorizontal, ChevronDown, Check, X, Eye } from 'lucide-react';
import Link from 'next/link';

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <span className="text-xs uppercase tracking-widest text-[#8A8A8A]">LOADING COLLECTION GRAPH...</span>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filters State
  const [selectedGender, setSelectedGender] = useState(searchParams.get('gender') || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchCart();
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedGender, selectedCategory, selectedSize]);

  const loadCategories = () => {
    // Mock or load categories
    setCategories([
      { id: 1, name: 'Apparel' },
      { id: 2, name: 'Accessories' }
    ]);
  };

  const loadProducts = () => {
    let url = `/api/products?`;
    if (selectedGender) url += `gender_target=${selectedGender}&`;
    if (selectedCategory) url += `category_id=${selectedCategory}&`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.products) {
          let filtered = data.products;
          if (selectedSize) {
            filtered = data.products.filter((p: any) => {
              try {
                const sizesArray = JSON.parse(p.sizes || '[]');
                return sizesArray.includes(selectedSize);
              } catch (e) {
                return false;
              }
            });
          }
          setProducts(filtered);
        }
      });
  };

  const fetchCart = () => {
    fetch('/api/cart')
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setCartItems(data.items);
        }
      });
  };

  const handleResetFilters = () => {
    setSelectedGender('');
    setSelectedCategory('');
    setSelectedSize('');
    router.push('/shop');
  };

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
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">

          {/* Top Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#262626] pb-6 space-y-4 md:space-y-0">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-[#8A8A8A]">SHOP THE ARCHIVE</span>
              <h1 className="font-serif-luxury text-3xl md:text-5xl font-bold uppercase tracking-tight">ALL PIECES</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center space-x-2 border border-[#262626] rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-widest hover:border-white transition-all bg-black"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>FILTERS</span>
              </button>
              {(selectedGender || selectedCategory || selectedSize) && (
                <button onClick={handleResetFilters} className="text-xs text-[#FF3B30] hover:underline font-bold uppercase">
                  CLEAR FILTERS
                </button>
              )}
            </div>
          </div>

          {/* Filtering Drawer Grid (Collapsible inline drawer) */}
          {isFilterOpen && (
            <div className="bg-[#0A0A0A] border border-[#262626] rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Gender target filter */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-semibold">GENDER TARGET</span>
                <div className="flex flex-col space-y-2">
                  {['men', 'women', 'unisex'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setSelectedGender(g === selectedGender ? '' : g)}
                      className={`flex items-center justify-between text-xs px-4 py-3 rounded-xl border text-left uppercase font-semibold ${
                        selectedGender === g ? 'bg-[#F8F6F2] text-black border-white' : 'bg-black border-[#262626] text-white hover:border-[#525252]'
                      }`}
                    >
                      <span>{g}</span>
                      {selectedGender === g && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category filter */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-semibold">COLLECTIONS / CATEGORIES</span>
                <div className="flex flex-col space-y-2">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(selectedCategory === c.id.toString() ? '' : c.id.toString())}
                      className={`flex items-center justify-between text-xs px-4 py-3 rounded-xl border text-left uppercase font-semibold ${
                        selectedCategory === c.id.toString() ? 'bg-[#F8F6F2] text-black border-white' : 'bg-black border-[#262626] text-white hover:border-[#525252]'
                      }`}
                    >
                      <span>{c.name}</span>
                      {selectedCategory === c.id.toString() && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size filter */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-semibold">FILTER BY SIZES</span>
                <div className="grid grid-cols-4 gap-2">
                  {['XS', 'S', 'M', 'L', 'XL', 'One Size'].map((sz) => {
                    const isSel = selectedSize === sz;
                    return (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(isSel ? '' : sz)}
                        className={`text-center py-2.5 rounded-lg border text-xs font-semibold ${
                          isSel ? 'bg-[#F8F6F2] text-black border-white' : 'bg-black border-[#262626] text-white hover:border-[#525252]'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Catalog grid */}
          {products.length === 0 ? (
            <div className="py-24 text-center space-y-4">
              <span className="text-xs uppercase tracking-widest text-[#8A8A8A]">No products match the selected archive filters.</span>
              <button onClick={handleResetFilters} className="text-xs bg-[#F8F6F2] text-black px-6 py-2.5 rounded-full font-semibold">
                RESET FILTERS
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              {products.map((item) => {
                let finalPrice = item.price;
                let hasDiscount = false;
                if (item.discount_percent > 0) {
                  finalPrice = item.price * (1 - item.discount_percent / 100);
                  hasDiscount = true;
                }

                return (
                  <div key={item.id} className="group relative flex flex-col space-y-4 bg-[#0A0A0A] border border-[#262626] rounded-2xl p-4 transition-all duration-300 hover:border-white">
                    {/* Image container frame */}
                    <div className="relative w-full h-[360px] overflow-hidden rounded-xl bg-[#111111] border border-[#262626]">
                      <img
                        src={item.primaryImage}
                        alt={item.name}
                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0"
                      />
                      <img
                        src={item.hoverImage}
                        alt={`${item.name} alternate`}
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

                      {/* Detail overlay link */}
                      <a
                        href={`/shop/${item.slug}`}
                        className="absolute bottom-4 right-4 bg-black/85 text-white p-3 rounded-full border border-white/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    </div>

                    {/* Metadata detail block */}
                    <div className="flex justify-between items-start pt-1">
                      <div className="space-y-1">
                        <a href={`/shop/${item.slug}`} className="text-xs uppercase tracking-wider font-semibold text-white hover:underline">
                          {item.name}
                        </a>
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
          )}

        </div>
      </main>

      <Footer />
    </>
  );
}
