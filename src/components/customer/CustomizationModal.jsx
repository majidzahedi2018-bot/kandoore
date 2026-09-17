// src/components/customer/CustomizationModal.jsx
import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle2, Scissors, Check, Ruler, User, ShieldCheck, Wallet } from 'lucide-react';
import { measurementsApi } from '../../api/api';

export const CustomizationModal = ({ design, tailor, currentUser, onBack, onProceedToPayment }) => {
  const [fabricMode, setFabricMode] = useState('tailor'); // 'tailor' | 'customer'
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedMaterial, setSelectedMaterial] = useState('crepe');
  const [selectedThread, setSelectedThread] = useState('gold');
  
  // پروفایل‌های اندازه کاربر از دیتابیس
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState(null);

  useEffect(() => {
    const loadProfiles = async () => {
      if (!currentUser?.id) return;
      try {
        const res = await measurementsApi.getByUser(currentUser.id);
        if (res.success && res.profiles?.length > 0) {
          setProfiles(res.profiles);
          const def = res.profiles.find(p => p.isDefault) || res.profiles[0];
          setSelectedProfileId(def.id);
        }
      } catch (err) {
        console.error('Error fetching measurements:', err);
      }
    };
    loadProfiles();
  }, [currentUser]);

  const fabricColors = [
    { id: 0, name: 'مشکی فاخر', bg: 'bg-gradient-to-br from-[#23201C] to-[#0A0A0A]' },
    { id: 1, name: 'آبی پترولی / فیروزه‌ای', bg: 'bg-gradient-to-br from-[#0E8388] to-[#05484B]' },
    { id: 2, name: 'سبز یشمی', bg: 'bg-gradient-to-br from-[#2D5A27] to-[#163513]' },
    { id: 3, name: 'سفالی جنوب', bg: 'bg-gradient-to-br from-[#C85A32] to-[#8C3415]' },
    { id: 4, name: 'کرم ابریشمی', bg: 'bg-gradient-to-br from-[#FAF6ED] to-[#E5D7B7]' },
  ];

  const baseSewingPrice = tailor?.price || design?.price || 480000;
  const fabricCost = fabricMode === 'tailor' ? 220000 : 0;
  const totalPrice = baseSewingPrice + fabricCost;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 select-none overflow-hidden">
      <div className="bg-[#F8F5EE] w-full max-w-md h-[100dvh] sm:h-[94vh] sm:rounded-[2.5rem] flex flex-col justify-between overflow-hidden shadow-2xl border border-[#EADFC7]">
        
        {/* هدر */}
        <div className="p-4 bg-white/80 backdrop-blur-md border-b border-[#EADFC7] flex items-center justify-between z-10 shrink-0">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full khaliji-card-glass flex items-center justify-center text-[#B38F24] border border-[#EADFC7] shadow-sm active:scale-90 transition-transform"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-[#D4AF37] text-xs">❖</span>
              <h1 className="text-lg font-black text-[#23201C] tracking-tight">شخصی‌سازی سفارش</h1>
              <span className="text-[#D4AF37] text-xs">❖</span>
            </div>
            <div className="mt-1 inline-flex items-center px-3 py-0.5 rounded-full bg-[#0E8388]/10 text-[#0E8388] text-[10px] font-extrabold border border-[#0E8388]/20">
              مرحله ۲ از ۳ • انتخاب پارچه و اندازه
            </div>
          </div>

          <div className="w-10"></div>
        </div>

        {/* فرم شخصی‌سازی */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 pb-28">

          {/* کارت خلاصه */}
          <div className="khaliji-card-glass rounded-3xl p-3 flex items-center justify-between border border-[#EADFC7] shadow-sm">
            <div className="space-y-1 text-right flex-1 pr-2">
              <h2 className="text-sm font-black text-[#23201C]">{design?.title}</h2>
              <div className="flex items-center gap-1 text-[11px] text-[#0E8388] font-black">
                <span>خیاط: {tailor?.name} ({tailor?.tailorInCharge})</span>
                <CheckCircle2 className="w-3 h-3 text-[#D4AF37]" />
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[#7E7667] font-bold">
                <Scissors className="w-3 h-3 text-[#B38F24]" />
                <span>دستمزد دوخت: {baseSewingPrice.toLocaleString('fa-IR')} تومان</span>
              </div>
            </div>

            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#D4AF37] shadow-md shrink-0 bg-[#241A12]">
              {design?.image && (
                <img src={design.image} alt={design?.title} className="w-full h-full object-cover" />
              )}
            </div>
          </div>

          {/* وضعیت تامین پارچه */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-xs font-black text-[#23201C]">
              <span className="text-[#D4AF37]">❖</span>
              <span>وضعیت تأمین پارچه</span>
              <span className="text-[#D4AF37]">❖</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div 
                onClick={() => setFabricMode('tailor')}
                className={`rounded-3xl p-3.5 flex flex-col items-center justify-between text-center cursor-pointer transition-all ${
                  fabricMode === 'tailor'
                    ? 'bg-white border-2 border-[#D4AF37] shadow-md shadow-[#D4AF37]/15'
                    : 'khaliji-card-glass border border-[#EADFC7]'
                }`}
              >
                <div className="w-full flex justify-start">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    fabricMode === 'tailor' ? 'bg-[#D4AF37] text-white' : 'border border-[#EADFC7]'
                  }`}>
                    {fabricMode === 'tailor' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
                <div className="my-1.5 text-2xl">📜</div>
                <div>
                  <span className="text-xs font-black text-[#23201C] block">تأمین پارچه توسط خیاط</span>
                  <span className="text-[10px] font-extrabold text-[#C85A32] mt-0.5 block">(+ ۲۲۰٬۰۰۰ تومان)</span>
                </div>
              </div>

              <div 
                onClick={() => setFabricMode('customer')}
                className={`rounded-3xl p-3.5 flex flex-col items-center justify-between text-center cursor-pointer transition-all ${
                  fabricMode === 'customer'
                    ? 'bg-white border-2 border-[#D4AF37] shadow-md shadow-[#D4AF37]/15'
                    : 'khaliji-card-glass border border-[#EADFC7]'
                }`}
              >
                <div className="w-full flex justify-start">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    fabricMode === 'customer' ? 'bg-[#D4AF37] text-white' : 'border border-[#EADFC7]'
                  }`}>
                    {fabricMode === 'customer' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
                <div className="my-1.5 text-2xl">📦</div>
                <div>
                  <span className="text-xs font-black text-[#23201C] block">پارچه را خودم تحویل می‌دهم</span>
                  <span className="text-[10px] text-[#7E7667] font-bold mt-0.5 block">(فقط دستمزد دوخت)</span>
                </div>
              </div>
            </div>
          </div>

          {/* رنگ و جنس پارچه */}
          {fabricMode === 'tailor' && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-black text-[#23201C]">
                <span className="text-[#D4AF37]">❖</span>
                <span>انتخاب رنگ و جنس پارچه</span>
                <span className="text-[#D4AF37]">❖</span>
              </div>

              <div className="flex items-center justify-center gap-3 py-1">
                {fabricColors.map((color) => {
                  const isSelected = selectedColor === color.id;
                  return (
                    <button
                      key={color.id}
                      onClick={() => setSelectedColor(color.id)}
                      className={`w-12 h-12 rounded-full ${color.bg} shadow-md transition-transform relative ${
                        isSelected ? 'scale-110 ring-4 ring-[#D4AF37] ring-offset-2 ring-offset-[#F8F5EE]' : 'hover:scale-105'
                      }`}
                      title={color.name}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center text-white text-xs">✓</div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { id: 'crepe', title: 'کرپ حریر اعلا' },
                  { id: 'satin', title: 'ساتن ابریشم' },
                  { id: 'linen', title: 'لینن سنتی' },
                ].map((mat) => {
                  const isSelected = selectedMaterial === mat.id;
                  return (
                    <button
                      key={mat.id}
                      onClick={() => setSelectedMaterial(mat.id)}
                      className={`py-2 px-1 rounded-2xl text-[11px] font-black flex items-center justify-center gap-1 transition-all ${
                        isSelected 
                          ? 'bg-[#D4AF37]/25 text-[#23201C] border-2 border-[#D4AF37]' 
                          : 'khaliji-card-glass text-[#7E7667] border border-[#EADFC7]'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-[#B38F24]" />}
                      <span>{mat.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* رنگ گلابتون */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-center gap-1.5 text-xs font-black text-[#23201C]">
              <span className="text-[#D4AF37]">❖</span>
              <span>رنگ گلابتون‌دوزی</span>
              <span className="text-[#D4AF37]">❖</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'gold', title: 'طلایی اصیل ✨' },
                { id: 'silver', title: 'زری نقره‌ای' },
                { id: 'rainbow', title: 'هفت‌رنگ سنتی 🌈' },
              ].map((thread) => {
                const isSelected = selectedThread === thread.id;
                return (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThread(thread.id)}
                    className={`py-2.5 px-2 rounded-2xl text-[10px] font-black flex items-center justify-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-[#D4AF37]/25 text-[#23201C] border-2 border-[#D4AF37]'
                        : 'khaliji-card-glass text-[#7E7667] border border-[#EADFC7]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-[#B38F24]" />}
                    <span>{thread.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ضمانت */}
          <div className="rounded-2xl p-2.5 bg-emerald-50 border border-emerald-200 flex items-center justify-center gap-2 text-emerald-800 text-[10px] font-extrabold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>پرداخت امانی: هزینه تا تأیید برش پارچه نزد کَندوره به امانت می‌ماند</span>
          </div>

        </div>

        {/* دکمه پیش‌فاکتور */}
        <div className="p-4 bg-white/95 backdrop-blur-xl border-t border-[#EADFC7] flex items-center justify-between shadow-2xl z-20">
          <div className="space-y-0.5 text-right">
            <span className="text-[10px] text-[#7E7667] font-bold block">مبلغ کل سفارش:</span>
            <div className="flex items-center gap-1">
              <Wallet className="w-4 h-4 text-[#B38F24]" />
              <span className="text-base font-black text-[#23201C]">
                {totalPrice.toLocaleString('fa-IR')} تومان
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              const colorObj = fabricColors.find(c => c.id === selectedColor);
              const materialTitles = { crepe: 'کرپ حریر اعلا', satin: 'ساتن ابریشم', linen: 'لینن سنتی' };
              const threadTitles = { gold: 'طلایی اصیل', silver: 'زری نقره‌ای', rainbow: 'هفت‌رنگ سنتی' };

              onProceedToPayment({
                design,
                tailor,
                fabricMode,
                selectedColor: colorObj ? colorObj.name : 'مشکی فاخر',
                selectedMaterial: materialTitles[selectedMaterial] || 'کرپ حریر اعلا',
                selectedThread: threadTitles[selectedThread] || 'طلایی اصیل',
                measurementProfileId: selectedProfileId || 1,
                totalPrice
              });
            }}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white font-black text-xs shadow-lg shadow-[#D4AF37]/30 flex items-center gap-2 active:scale-95 transition-transform"
          >
            <span>پیش‌فاکتور و پرداخت امن</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};