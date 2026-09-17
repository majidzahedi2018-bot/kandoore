// src/components/customer/PublicTailorProfileModal.jsx
import React, { useState, useEffect } from 'react';
import { ChevronRight, Heart, Share2, MapPin, Check, Clock, ShoppingBag, Star, Phone, MessageCircle, Shirt } from 'lucide-react';
import { designsApi } from '../../api/api';
import { openImageViewer } from '../../utils/imageViewer';

export const PublicTailorProfileModal = ({ isOpen, onClose, tailor, onOpenChat, onSelectDesign }) => {
  const [isFollowed, setIsFollowed] = useState(false);
const [tailorDesigns, setTailorDesigns] = useState([]);
// دریافت نمونه‌کارهای فعال این خیاط برای ویترین عمومی
useEffect(() => {
if (!isOpen || !tailor) return;
const fetchDesigns = async () => {
try {
const res = await designsApi.getAll('', tailor.userId || tailor.id);
if (res.success && res.designs) setTailorDesigns(res.designs.filter(d => d.isActive !== false));
} catch (e) {
console.error('Error fetching tailor designs:', e);
}
};
fetchDesigns();
}, [isOpen, tailor]);
if (!isOpen || !tailor) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#F8F5EE] flex flex-col justify-between p-0 select-none overflow-hidden max-w-md mx-auto">
      <div className="p-4 bg-white/80 backdrop-blur-md border-b border-[#EADFC7] flex items-center justify-between z-10 shrink-0">
        <button onClick={onClose} className="w-10 h-10 rounded-full khaliji-card-glass flex items-center justify-center text-[#B38F24] border border-[#EADFC7] shadow-sm">
          <ChevronRight className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsFollowed(!isFollowed)} className="w-10 h-10 rounded-full khaliji-card-glass flex items-center justify-center text-[#23201C] border border-[#EADFC7] shadow-sm">
            <Heart className={`w-5 h-5 ${isFollowed ? 'fill-red-500 text-red-500' : 'text-[#23201C]'}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 pb-28">
        <div className="khaliji-card-glass rounded-[2.5rem] p-5 border-2 border-[#D4AF37]/60 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1 text-right flex-1 pr-2">
              <h1 className="text-base font-black text-[#23201C]">{tailor.name}</h1>
              <div className="flex items-center gap-1 text-[10px] text-[#7E7667] font-bold">
                <MapPin className="w-3.5 h-3.5 text-[#B38F24]" />
                <span>{tailor.city || 'بندرعباس • گلشهر'}</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black border border-emerald-200 inline-flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                <span>کارگاه و خیاط تأییدشده</span>
              </span>
            </div>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#AA771C] p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-[#FAF6ED] rounded-full flex items-center justify-center text-3xl border border-white">🧕</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <a href="tel:07633332211" className="py-3 px-2 rounded-2xl bg-white border border-[#EADFC7] text-[#23201C] text-xs font-black flex items-center justify-center gap-1.5 shadow-sm">
            <Phone className="w-4 h-4 text-[#B38F24]" />
            <span>تماس با کارگاه</span>
          </a>
                <button onClick={onOpenChat} className="py-3 px-2 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md">
        <MessageCircle className="w-4 h-4" />
        <span>چت و مشاوره دوخت</span>
      </button>
      </div>
      {/* ویترین نمونه‌کارهای این کارگاه — کلیک روی تصویر = نمایشگر تمام‌صفحه */}
      {tailorDesigns.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-[#23201C] px-1">
            <Shirt className="w-4 h-4 text-[#B38F24]" />
            <span>نمونه‌کارهای این کارگاه ({tailorDesigns.length.toLocaleString('fa-IR')})</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {tailorDesigns.map((d) => (
              <div key={d.id} className="khaliji-card-glass rounded-2xl p-2 border border-[#EADFC7] shadow-sm space-y-1.5">
                <div className="relative w-full h-32 rounded-xl overflow-hidden bg-gradient-to-br from-[#23201C] to-[#3D2D1E] flex items-center justify-center">
                  {d.image ? (
                    <img src={d.image} alt={d.title} onClick={() => openImageViewer(d.image, d.title)} className="w-full h-full object-cover cursor-zoom-in" />
                  ) : (
                    <span className="text-3xl">✨👗</span>
                  )}
                </div>
                <span className="text-[10px] font-black text-[#23201C] block truncate text-center">{d.title}</span>
                <span className="text-[9px] font-bold text-[#0E8388] block text-center">از {d.price?.toLocaleString('fa-IR')} تومان</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);
};