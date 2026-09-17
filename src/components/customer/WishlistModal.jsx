// src/components/customer/WishlistModal.jsx
import React, { useState, useEffect } from 'react';
import { ChevronRight, SlidersHorizontal, Heart, ChevronLeft } from 'lucide-react';

export const WishlistModal = ({ isOpen, onClose, onSelectDesign, onOpenFilter }) => {
  const [savedItems, setSavedItems] = useState(() => {
    try {
      const saved = localStorage.getItem('kandooreh_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('kandooreh_wishlist');
        if (saved) setSavedItems(JSON.parse(saved));
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRemove = (id, e) => {
    e.stopPropagation();
    const updated = savedItems.filter(item => item.id !== id);
    setSavedItems(updated);
    localStorage.setItem('kandooreh_wishlist', JSON.stringify(updated));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F8F5EE] flex flex-col justify-between p-0 select-none overflow-hidden max-w-md mx-auto">
      <div className="p-4 bg-white/80 backdrop-blur-md border-b border-[#EADFC7] flex items-center justify-between z-10 shrink-0">
        <button onClick={onClose} className="w-10 h-10 rounded-full khaliji-card-glass flex items-center justify-center text-[#B38F24] border border-[#EADFC7] shadow-sm">
          <ChevronRight className="w-5 h-5" />
        </button>
        <h1 className="text-base font-black text-[#23201C]">طرح‌های نشان‌شده ({savedItems.length})</h1>
        <button onClick={onOpenFilter} className="w-10 h-10 rounded-full khaliji-card-glass flex items-center justify-center text-[#23201C] border border-[#EADFC7] shadow-sm">
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 pb-20">
        {savedItems.length === 0 ? (
          <div className="text-center py-16 text-xs font-black text-[#7E7667]">طرحی ذخیره نشده است.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5">
            {savedItems.map((item) => (
              <div key={item.id} className="khaliji-card-glass rounded-3xl p-2.5 flex flex-col justify-between border border-[#EADFC7] shadow-sm">
                <div className={`relative w-full h-44 ${item.colorPreview} rounded-2xl overflow-hidden flex items-center justify-center shadow-inner`}>
                  <span className="text-4xl">{item.iconEmoji}</span>
                  <button onClick={(e) => handleRemove(item.id, e)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-red-500 shadow-sm">
                    <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                  </button>
                </div>

                <div className="pt-2.5 px-1 text-center space-y-1">
                  <h3 className="font-black text-xs text-[#23201C] truncate">{item.title}</h3>
                  <div className="text-xs font-black text-[#0E8388] pt-0.5">{item.price.toLocaleString('fa-IR')} تومان</div>
                  <button
                    onClick={() => { onSelectDesign(item); onClose(); }}
                    className="w-full mt-1 py-2 rounded-xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white text-[11px] font-black shadow-sm flex items-center justify-center gap-1 active:scale-95"
                  >
                    <span>سفارش دوخت</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};