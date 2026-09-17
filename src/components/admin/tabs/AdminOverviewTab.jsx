// src/components/admin/tabs/AdminOverviewTab.jsx
import React from 'react';
import {
Wallet, ShieldCheck, ShoppingBag, Users, Clock,
Settings, UserCheck, Shield, ChevronLeft
} from 'lucide-react';
import { AnimatedNumber } from '../../common/UiKit';

export const AdminOverviewTab = ({ stats, orders, onSelectTab }) => {
  return (
    <div className="space-y-5 text-right">
      
      {/* =========================================================================
          ۱. کارت‌های ۴گانه شاخص‌های کلیدی (کاملاً مطابق چیدمان و رنگ موکاپ)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* کارت ۱: بیعانه امانی فعال (کارت سبز تیره زمردی) */}
        <div className="rounded-[2.2rem] p-5 bg-gradient-to-br from-[#0E352B] via-[#092820] to-[#041914] text-white border-2 border-[#D4AF37]/60 shadow-xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-[#FCF6BA] bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
              موجودی در ضمانت
            </span>
            <div className="flex items-center gap-1.5 text-[#FBF5B7]">
              <span className="text-xs font-black">بیعانه امانی فعال</span>
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            </div>
          </div>
          <div>
                     <span className="text-2xl font-black text-[#FCF6BA] tracking-tight block">
           <AnimatedNumber value={stats.totalEscrow || 0} />
         </span>
            <span className="text-[10px] text-white/80 font-bold mt-0.5 block">تومان نزد کَندوره</span>
          </div>
        </div>

        {/* کارت ۲: گردش مالی کل (کارت شنی-طلایی روشن) */}
        <div className="khaliji-card-glass rounded-[2.2rem] p-5 border-2 border-[#EADFC7] shadow-xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              کل تراکنش‌ها
            </span>
            <div className="flex items-center gap-1.5 text-[#23201C]">
              <span className="text-xs font-black">گردش مالی کل</span>
              <Wallet className="w-4 h-4 text-[#B38F24]" />
            </div>
          </div>
          <div>
                     <span className="text-2xl font-black text-[#23201C] tracking-tight block">
           <AnimatedNumber value={stats.totalVolume || 0} />
         </span>
            <span className="text-[10px] text-[#7E7667] font-bold mt-0.5 block">تومان تراکنش موفق</span>
          </div>
        </div>

        {/* کارت ۳: خیاطان فعال و تاییدشده */}
        <div className="khaliji-card-glass rounded-[2.2rem] p-5 border-2 border-[#EADFC7] shadow-xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              خیاطان مستر
            </span>
            <div className="flex items-center gap-1.5 text-[#23201C]">
              <span className="text-xs font-black">خیاطان تاییدشده</span>
              <Users className="w-4 h-4 text-[#C85A32]" />
            </div>
          </div>
          <div>
                     <span className="text-2xl font-black text-[#23201C] tracking-tight block">
           <AnimatedNumber value={stats.totalTailors || 0} />
         </span>
            <span className="text-[10px] text-[#7E7667] font-bold mt-0.5 block">کارگاه فعال در هرمزگان</span>
          </div>
        </div>

        {/* کارت ۴: سفارش‌های در حال دوخت */}
        <div className="khaliji-card-glass rounded-[2.2rem] p-5 border-2 border-[#EADFC7] shadow-xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-[#0E8388] bg-[#0E8388]/10 px-2.5 py-0.5 rounded-full border border-[#0E8388]/20">
              سفارش‌های فعال
            </span>
            <div className="flex items-center gap-1.5 text-[#23201C]">
              <span className="text-xs font-black">در حال دوخت</span>
              <ShoppingBag className="w-4 h-4 text-[#0E8388]" />
            </div>
          </div>
          <div>
                     <span className="text-2xl font-black text-[#23201C] tracking-tight block">
           <AnimatedNumber value={stats.activeOrders || 0} />
         </span>
            <span className="text-[10px] text-[#7E7667] font-bold mt-0.5 block">سفارش در نوبت کارگاه</span>
          </div>
        </div>

      </div>

      {/* =========================================================================
          ۲. جریان زنده سفارش‌ها (با تایم‌لاین دایره‌ای متصل دقیقاً مطابق موکاپ)
          ========================================================================= */}
      <div className="khaliji-card-glass rounded-[2.5rem] p-5 sm:p-6 border-2 border-[#EADFC7] shadow-xl space-y-4">
        
        <div className="flex items-center justify-between border-b border-[#EADFC7] pb-3">
          <button 
            onClick={() => onSelectTab('orders')}
            className="flex items-center gap-1 text-xs font-black text-[#0E8388] hover:text-[#23201C]"
          >
            <span>مشاهده همه</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#B38F24]" />
            <h3 className="text-sm font-black text-[#23201C]">جریان زنده سفارش‌ها</h3>
          </div>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.slice(0, 3).map((ord) => (
              <div key={ord.id} className="bg-white/80 rounded-3xl p-4 border border-[#EADFC7] space-y-3.5 shadow-sm">
                
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#7E7667]">{ord.date}</span>
                  <div className="space-y-0.5 text-right">
                    <span className="text-xs font-black text-[#23201C]">سفارش #{ord.id}</span>
                    <div className="flex items-center justify-end gap-2 text-[10px] text-[#7E7667] font-bold">
                      <span>مشتری: {ord.customerName}</span>
                      <span>•</span>
                      <span>خیاط: {ord.tailorName}</span>
                    </div>
                  </div>
                </div>

                {/* تایم‌لاین خطی ۴ مرحله‌ای با دایره‌های متصل */}
                <div className="bg-[#FAF6ED] p-3 rounded-2xl border border-[#EADFC7]">
                  <div className="relative flex items-center justify-between px-4">
                    <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[2px] bg-[#EADFC7] z-0"></div>
                    
                    {[
                      { step: 1, label: 'ثبت سفارش' },
                      { step: 2, label: 'تأیید خیاط' },
                      { step: 3, label: 'در حال دوخت' },
                      { step: 4, label: 'ارسال' },
                    ].map((st) => {
                      const isDone = ord.step >= st.step;
                      const isCurrent = ord.step === st.step;
                      return (
                        <div key={st.step} className="relative z-10 flex flex-col items-center gap-1">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                            isCurrent
                              ? 'bg-[#0E8388] text-white ring-4 ring-[#0E8388]/20 shadow-md scale-110'
                              : isDone
                              ? 'bg-[#D4AF37] text-white shadow-sm'
                              : 'bg-white border-2 border-[#EADFC7] text-[#7E7667]'
                          }`}>
                            {isDone ? '✓' : st.step}
                          </div>
                          <span className={`text-[8px] font-black ${isCurrent ? 'text-[#0E8388]' : isDone ? 'text-[#23201C]' : 'text-[#7E7667]'}`}>
                            {st.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs font-black text-[#7E7667]">
            هنوز سفارشی در دیتابیس ثبت نشده است.
          </div>
        )}
      </div>

      {/* =========================================================================
          ۳. دسترسی سریع ۴گانه مدیریت (مطابق تصویر)
          ========================================================================= */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-center gap-1.5 text-xs font-black text-[#23201C]">
          <span className="text-[#D4AF37]">❖</span>
          <span>دسترسی سریع</span>
          <span className="text-[#D4AF37]">❖</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button 
            onClick={() => onSelectTab('settings')}
            className="khaliji-card-glass rounded-3xl p-4 flex flex-col items-center justify-center text-center gap-1.5 shadow-md active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#B38F24]">
              <Settings className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-[#23201C]">تنظیمات سیستم</span>
            <span className="text-[8px] font-bold text-[#7E7667]">تنظیمات پلتفرم</span>
          </button>

          <button 
            onClick={() => onSelectTab('tailors')}
            className="khaliji-card-glass rounded-3xl p-4 flex flex-col items-center justify-center text-center gap-1.5 shadow-md active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#0E8388]/10 border border-[#0E8388]/20 flex items-center justify-center text-[#0E8388]">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-[#23201C]">مدیریت خیاطان</span>
            <span className="text-[8px] font-bold text-[#7E7667]">تایید و مدیریت</span>
          </button>

          <button 
            onClick={() => onSelectTab('payouts')}
            className="khaliji-card-glass rounded-3xl p-4 flex flex-col items-center justify-center text-center gap-1.5 shadow-md active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#B38F24]">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-[#23201C]">درخواست تسویه</span>
            <span className="text-[8px] font-bold text-[#7E7667]">پرداخت به خیاطان</span>
          </button>

          <button 
            onClick={() => onSelectTab('reports')}
            className="khaliji-card-glass rounded-3xl p-4 flex flex-col items-center justify-center text-center gap-1.5 shadow-md active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-[#23201C]">گزارش مالی</span>
            <span className="text-[8px] font-bold text-[#7E7667]">مشاهده آمار مالی</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          ۴. بنر تیره امنیت و اعتماد (انتهای صفحه)
          ========================================================================= */}
      <div className="rounded-[2.2rem] p-4 bg-gradient-to-r from-[#0E352B] via-[#092820] to-[#041914] text-white border-2 border-[#D4AF37]/60 shadow-xl flex items-center justify-between">
        <div className="space-y-0.5 text-right">
          <div className="flex items-center gap-1.5 text-xs font-black text-[#FBF5B7]">
            <Shield className="w-4 h-4 text-[#D4AF37]" />
            <span>امنیت و اعتماد در کَندوره</span>
          </div>
          <p className="text-[10px] text-white/80 font-bold">
            تمام تراکنش‌ها تحت حفاظت و نظارت کامل سیستم امانی انجام می‌شود.
          </p>
        </div>
        
        <div className="px-3.5 py-1.5 rounded-xl bg-white/10 text-[#FCF6BA] text-[10px] font-black border border-white/20 shrink-0">
          گزارش سلامت سیستم
        </div>
      </div>

      {/* فوتر حقوق پلتفرم */}
      <div className="text-center py-2 text-[10px] font-black text-[#8C6D1F]">
        <span>⚜️ کَندوره © ۱۴۰۳ - تمامی حقوق محفوظ است.</span>
      </div>

    </div>
  );
};