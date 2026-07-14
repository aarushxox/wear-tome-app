import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] border-t border-[#262626] py-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-sm text-[#A0A0A0]">

        {/* Brand Block */}
        <div className="flex flex-col space-y-4">
          <span className="font-serif-luxury text-white text-xl font-bold tracking-widest">WEAR TOME</span>
          <p className="text-xs text-[#8A8A8A] leading-relaxed max-w-xs">
            A premium architectural, minimalistic luxury streetwear universe combining Tokyo and Scandinavian styling. Designed in 2026.
          </p>
        </div>

        {/* Collections links */}
        <div className="flex flex-col space-y-3">
          <span className="text-white text-xs uppercase tracking-widest font-semibold">COLLECTIONS</span>
          <Link href="/shop" className="hover:text-white text-xs transition-colors">Shop All</Link>
          <Link href="/shop?gender=men" className="hover:text-white text-xs transition-colors">Men's Editorial</Link>
          <Link href="/shop?gender=women" className="hover:text-white text-xs transition-colors">Women's Gowns</Link>
          <Link href="/shop?is_trending=1" className="hover:text-white text-xs transition-colors">Trending Drops</Link>
        </div>

        {/* Support links */}
        <div className="flex flex-col space-y-3">
          <span className="text-white text-xs uppercase tracking-widest font-semibold">SUPPORT</span>
          <Link href="/dashboard?tab=chat" className="hover:text-white text-xs transition-colors">Customer Care Chat</Link>
          <Link href="/careers" className="hover:text-white text-xs transition-colors">Careers / Team Join</Link>
          <span className="text-xs text-[#8A8A8A]">Local DB Host: SQLite v3</span>
        </div>

        {/* Newsletter Signup */}
        <div className="flex flex-col space-y-3">
          <span className="text-white text-xs uppercase tracking-widest font-semibold">THE JOURNAL</span>
          <p className="text-xs text-[#8A8A8A]">Subscribe to receive notification details about private drops and early coupon accesses.</p>
          <div className="flex items-center border border-[#262626] rounded-full overflow-hidden bg-black p-1">
            <input
              type="email"
              placeholder="ENTER EMAIL"
              className="bg-transparent border-0 outline-none text-xs text-white px-3 py-1.5 flex-grow"
            />
            <button className="bg-[#F8F6F2] hover:bg-white text-black text-xs font-semibold px-4 py-1.5 rounded-full transition-all">
              JOIN
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-[#262626] mt-12 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-[#8A8A8A]">
        <span>&copy; 2026 WEAR TOME. ALL RIGHTS RESERVED.</span>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <span className="hover:text-white cursor-pointer transition-colors">PRIVACY POLICY</span>
          <span className="hover:text-white cursor-pointer transition-colors">TERMS OF SERVICE</span>
        </div>
      </div>
    </footer>
  );
}
