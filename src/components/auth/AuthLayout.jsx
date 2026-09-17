// src/components/auth/AuthLayout.jsx
import React from 'react';
import authBg from '../../assets/auth-bg.png';
import { ShieldCheck, BadgeCheck, Truck, Star } from 'lucide-react';

// پترن اسلیمی طلایی برای پس‌زمینه پنل فرم در دسکتاپ
const PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cpath d='M28 4l5.5 18.5L52 28l-18.5 5.5L28 52l-5.5-18.5L4 28l18.5-5.5z' fill='%23D4AF37' fill-opacity='0.07'/%3E%3C/svg%3E")`;

// شل رسپانسیو مشترک صفحات احراز هویت (ورود / ثبت‌نام / بازیابی رمز)
// موبایل و تبلت: پس‌زمینه تمام‌عرض + ستون مرکزی (همان طراحی فعلی)
// دسکتاپ (lg+): اسپلیت‌اسکرین — پنل برند (راست) + پنل فرم (چپ)
export const AuthLayout = ({ children }) => {
return (
<div className="min-h-[100dvh] w-full relative bg-[#F3EDE3] lg:grid lg:grid-cols-2">

  {/* ═══ پنل برند (فقط دسکتاپ) ═══ */}
  <div className="hidden lg:block relative overflow-hidden">
    <img src={authBg} alt="کَندوره — پوشاک اصیل هرمزگان" className="absolute inset-0 w-full h-full object-cover object-top" />
    <div className="absolute inset-0 bg-gradient-to-t from-[#041914]/85 via-[#041914]/25 to-transparent" />
    <div className="relative z-10 h-full flex flex-col justify-end gap-5 p-12 text-right">
      <div className="flex items-center gap-3">
        <span className="text-[#D4AF37] text-4xl">⚜️</span>
        <h1 className="text-5xl font-black metallic-gold-text tracking-tight drop-shadow-md">کَندوره</h1>
      </div>
      <p className="text-sm font-black text-[#FBF5B7] leading-relaxed">اصالت در دوخت، اعتماد در پرداخت — پلتفرم تخصصی پوشاک اصیل هرمزگان</p>
      <div className="flex items-center gap-3 text-[11px] font-black text-white">
        <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/10 border border-[#D4AF37]/50 backdrop-blur"><ShieldCheck className="w-4 h-4 text-[#D4AF37]" />پرداخت امانی</span>
        <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/10 border border-[#D4AF37]/50 backdrop-blur"><BadgeCheck className="w-4 h-4 text-[#D4AF37]" />خیاطان تأییدشده</span>
        <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/10 border border-[#D4AF37]/50 backdrop-blur"><Truck className="w-4 h-4 text-[#D4AF37]" />تحویل اختصاصی</span>
      </div>
      <div className="flex items-center gap-6 text-[11px] font-black text-[#FBF5B7] border-t border-white/15 pt-4">
        <span>+۱۲۰ سفارش موفق</span>
        <span>۹۸٪ رضایت مشتریان</span>
        <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />۴٫۹ امتیاز</span>
      </div>
    </div>
  </div>

  {/* ═══ پنل فرم (همه بریک‌پوینت‌ها) ═══ */}
  <div className="relative flex flex-col min-h-[100dvh]">
    {/* پس‌زمینه موبایل/تبلت: تصویر تمام‌عرض | دسکتاپ: کرم + پترن */}
    <div className="absolute inset-0 lg:hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${authBg})` }}></div>
    <div className="absolute inset-0 hidden lg:block bg-[#F6EFE3]" style={{ backgroundImage: PATTERN }}></div>
    <div className="relative z-10 flex-1 flex flex-col w-full max-w-md mx-auto lg:max-w-xl lg:justify-center lg:py-8">
      {children}
    </div>
  </div>

</div>
);
};