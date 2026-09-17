// src/components/customer/GuaranteeTermsModal.jsx
import React from 'react';
import { ChevronRight, ShieldCheck, Ruler, Lock, Award } from 'lucide-react';

export const GuaranteeTermsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#F8F5EE] flex flex-col justify-between p-0 select-none overflow-hidden max-w-md mx-auto">
      <div className="p-4 bg-white/80 backdrop-blur-md border-b border-[#EADFC7] flex items-center justify-between z-10 shrink-0">
        <button onClick={onClose} className="w-10 h-10 rounded-full khaliji-card-glass flex items-center justify-center text-[#B38F24] border border-[#EADFC7] shadow-sm">
          <ChevronRight className="w-5 h-5" />
        </button>
        <h1 className="text-base font-black text-[#23201C]">ضمانت دوخت و پرداخت امانی</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 pb-28">
        <div className="rounded-[2.5rem] p-5 bg-gradient-to-br from-[#FFFDF7] to-[#FDF8EB] border-2 border-[#D4AF37] shadow-xl text-right space-y-2">
          <span className="text-xs font-black text-[#B38F24]">کارت گارانتی طلایی کَندوره</span>
          <h2 className="text-2xl font-black metallic-gold-text">ضمانت ۱۰۰٪ تطابق اندازه</h2>
          <p className="text-[10px] text-[#7E7667] leading-relaxed font-bold">
            در صورت هرگونه مغایرت با دفترچه اندازه‌ها، اصلاح کامل لباس رایگان است.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-black text-[#524B40]">
          <div className="khaliji-card-glass p-3 rounded-2xl border border-[#EADFC7]">
            <Ruler className="w-5 h-5 text-[#B38F24] mx-auto mb-1" />
            <span>گارانتی اندازه</span>
          </div>
          <div className="khaliji-card-glass p-3 rounded-2xl border border-[#EADFC7]">
            <ShieldCheck className="w-5 h-5 text-[#0E8388] mx-auto mb-1" />
            <span>پرداخت امانی</span>
          </div>
          <div className="khaliji-card-glass p-3 rounded-2xl border border-[#EADFC7]">
            <Award className="w-5 h-5 text-[#C85A32] mx-auto mb-1" />
            <span>خیاطان مجاز</span>
          </div>
        </div>
      </div>
    </div>
  );
};