// src/components/common/AboutUsModal.jsx
import React from 'react';
import { ChevronRight, ShieldCheck, Ruler, Truck, Heart, ShoppingBag, Users, MapPin, Phone, CheckCircle2, ChevronLeft } from 'lucide-react';

export const AboutUsModal = ({ isOpen, onClose, onExploreCatalog }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#F8F5EE] flex flex-col justify-between p-0 select-none overflow-hidden max-w-md mx-auto">
      
      {/* ۱. هدر بالای صفحه */}
      <div className="p-4 bg-white/80 backdrop-blur-md border-b border-[#EADFC7] flex items-center justify-between z-10 shrink-0">
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full khaliji-card-glass flex items-center justify-center text-[#B38F24] border border-[#EADFC7] shadow-sm active:scale-90 transition-transform"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-[#D4AF37] text-xs">❖</span>
          <h1 className="text-base font-black text-[#23201C]">درباره کَندوره</h1>
          <span className="text-[#D4AF37] text-xs">❖</span>
        </div>

        <div className="w-10"></div>
      </div>

      {/* ۲. محتوای اسکرول‌شونده (مطابق تصویر) */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 pb-28">

        {/* بنر هیرو با موتیف سوزن زرین و گلابتون */}
        <div className="rounded-[2.5rem] p-5 bg-gradient-to-br from-[#FFFDF7] via-[#FAF3E3] to-[#F5E7C8] border-2 border-[#D4AF37] shadow-xl relative overflow-hidden text-center space-y-3">
          
          {/* نشان سوزن زرین و گلابتون */}
          <div className="relative inline-flex items-center justify-center pt-1">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#E5C158] via-[#D4AF37] to-[#AA771C] p-1 shadow-lg">
              <div className="w-full h-full bg-[#FAF6ED] rounded-full flex items-center justify-center text-4xl shadow-inner border border-white">
                🪡
              </div>
            </div>
            <div className="absolute -top-1 -right-1 text-xl">✨</div>
          </div>

          {/* کادر طلایی تیتر روایت اصالت */}
          <div className="p-3 rounded-2xl bg-black/75 backdrop-blur-md border border-[#D4AF37] text-white shadow-xl space-y-1">
            <h2 className="text-sm font-black text-[#FCF6BA] leading-snug drop-shadow-md">
              روایت اصالت و هنر دست بانوان هرمزگان
            </h2>
            <p className="text-[10px] text-white/90 leading-relaxed font-bold">
              کَندوره پلی است میان هنر اصیل دوخت‌های سنتی جنوب و دنیای مدرن امروز؛ برای حفظ فرهنگ، حمایت از بانوان هنرمند و تحویل لباسی که با عشق دوخته شده.
            </p>
          </div>
        </div>

        {/* تیتر چهار ستون اعتماد */}
        <div className="text-center pt-1">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[#D4AF37] text-xs">❖</span>
            <h3 className="text-xs font-black text-[#23201C]">چهار ستون اعتماد کَندوره</h3>
            <span className="text-[#D4AF37] text-xs">❖</span>
          </div>
        </div>

        {/* ۴ ستون اعتماد (گرید ۲×۲ مطابق عکس) */}
        <div className="grid grid-cols-2 gap-3">
          
          {/* کارت ۱: گارانتی ۱۰۰٪ اندازه */}
          <div className="khaliji-card-glass rounded-3xl p-3.5 flex flex-col items-center justify-between text-center border border-[#EADFC7] shadow-sm space-y-1.5">
            <div className="w-11 h-11 rounded-2xl bg-[#0E8388] text-white flex items-center justify-center text-xl shadow-md">
              <Ruler className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-xs font-black text-[#23201C]">گارانتی ۱۰۰٪ اندازه</h4>
            <p className="text-[9px] text-[#7E7667] font-bold leading-tight">
              ضمانت اندازه دقیق یا اصلاح رایگان در صورت نیاز
            </p>
          </div>

          {/* کارت ۲: پرداخت امانی ۳۰/۷۰ */}
          <div className="khaliji-card-glass rounded-3xl p-3.5 flex flex-col items-center justify-between text-center border border-[#EADFC7] shadow-sm space-y-1.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#E5C158] to-[#D4AF37] text-white flex items-center justify-center text-xl shadow-md">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-xs font-black text-[#23201C]">پرداخت امانی ۳۰/۷۰</h4>
            <p className="text-[9px] text-[#7E7667] font-bold leading-tight">
              پرداخت امن و منصفانه؛ ۷۰٪ بعد از تحویل و رضایت شما
            </p>
          </div>

          {/* کارت ۳: ارسال اختصاصی و بیمه */}
          <div className="khaliji-card-glass rounded-3xl p-3.5 flex flex-col items-center justify-between text-center border border-[#EADFC7] shadow-sm space-y-1.5">
            <div className="w-11 h-11 rounded-2xl bg-[#0E8388]/20 text-[#0E8388] flex items-center justify-center text-xl border border-[#0E8388]/30">
              <Truck className="w-5 h-5 text-[#0E8388]" />
            </div>
            <h4 className="text-xs font-black text-[#23201C]">ارسال اختصاصی و بیمه</h4>
            <p className="text-[9px] text-[#7E7667] font-bold leading-tight">
              ارسال سریع، بسته‌بندی شکیل و بیمه تا درب منزل شما
            </p>
          </div>

          {/* کارت ۴: حمایت از بانوان هنرمند */}
          <div className="khaliji-card-glass rounded-3xl p-3.5 flex flex-col items-center justify-between text-center border border-[#EADFC7] shadow-sm space-y-1.5">
            <div className="w-11 h-11 rounded-2xl bg-[#C85A32]/20 text-[#C85A32] flex items-center justify-center text-xl border border-[#C85A32]/30">
              <span>🧵</span>
            </div>
            <h4 className="text-xs font-black text-[#C85A32]">حمایت از بانوان هنرمند</h4>
            <p className="text-[9px] text-[#7E7667] font-bold leading-tight">
              توسعه اشتغال پایدار و حمایت مستقیم از خیاطان هرمزگان
            </p>
          </div>

        </div>

        {/* تیتر آمار در یک نگاه */}
        <div className="text-center pt-1">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[#D4AF37] text-xs">❖</span>
            <h3 className="text-xs font-black text-[#23201C]">تأثیر کَندوره در یک نگاه</h3>
            <span className="text-[#D4AF37] text-xs">❖</span>
          </div>
        </div>

        {/* ۳ کارت آمار دستاوردها */}
        <div className="grid grid-cols-3 gap-2 text-center">
          
          <div className="khaliji-card-glass rounded-3xl p-3 flex flex-col items-center justify-between border border-[#EADFC7] shadow-sm">
            <Heart className="w-5 h-5 text-[#0E8388] fill-[#0E8388] mb-1" />
            <span className="text-base font-black text-[#23201C]">۹۸٪</span>
            <span className="text-[9px] font-bold text-[#7E7667]">رضایت مشتریان از کیفیت و خدمات</span>
          </div>

          <div className="khaliji-card-glass rounded-3xl p-3 flex flex-col items-center justify-between border border-[#EADFC7] shadow-sm">
            <ShoppingBag className="w-5 h-5 text-[#B38F24] mb-1" />
            <span className="text-base font-black text-[#C85A32]">۳٬۵۰۰+</span>
            <span className="text-[9px] font-bold text-[#7E7667]">سفارش موفق با رضایت مشتریان</span>
          </div>

          <div className="khaliji-card-glass rounded-3xl p-3 flex flex-col items-center justify-between border border-[#EADFC7] shadow-sm">
            <Users className="w-5 h-5 text-[#0E8388] mb-1" />
            <span className="text-base font-black text-[#0E8388]">۱۰۰+</span>
            <span className="text-[9px] font-bold text-[#7E7667]">خیاط تأییدشده در سراسر هرمزگان</span>
          </div>

        </div>

        {/* کارت دفتر مرکزی و راه‌های ارتباطی */}
        <div className="khaliji-card-glass rounded-[2rem] p-4 border border-[#EADFC7] shadow-sm space-y-3 text-right">
          <div className="text-center border-b border-[#F8F5EE] pb-2">
            <span className="text-xs font-black text-[#23201C]">❖ دفتر مرکزی و راه‌های ارتباطی ❖</span>
          </div>

          <div className="flex items-start gap-2 text-xs font-bold text-[#23201C] leading-relaxed">
            <MapPin className="w-4 h-4 text-[#B38F24] shrink-0 mt-0.5" />
            <span>هرمزگان، بندرعباس، خیابان امام خمینی، مجتمع تجاری خلیج فارس، طبقه ۳، واحد ۱۲</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2 rounded-xl bg-white/90 border border-[#EADFC7] flex items-center justify-between text-right">
              <div>
                <span className="text-[10px] font-black text-[#23201C] block">پلتفرم تأییدشده</span>
                <span className="text-[8px] text-[#7E7667] font-bold">تحت نظارت و با ضمانت</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>

            <a href="tel:07633332211" className="p-2 rounded-xl bg-white/90 border border-[#EADFC7] flex items-center justify-between text-right">
              <div>
                <span className="text-[10px] font-mono font-black text-[#23201C] block dir-ltr">۰۷۶-۳۳۳۳۲۲۱۱</span>
                <span className="text-[8px] text-[#7E7667] font-bold">پاسخگویی ۹ صبح تا ۹ شب</span>
              </div>
              <Phone className="w-4 h-4 text-[#0E8388]" />
            </a>
          </div>
        </div>

      </div>

      {/* ۳. دکمه چسبان فیروزه‌ای و طلایی پایین صفحه */}
      <div className="p-4 bg-white/95 backdrop-blur-xl border-t border-[#EADFC7] shadow-2xl z-20">
        <button
          onClick={() => {
            onClose();
            if (onExploreCatalog) onExploreCatalog();
          }}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0E8388] via-[#0A6B6F] to-[#04474A] text-white font-black text-xs shadow-lg shadow-[#0E8388]/30 flex items-center justify-between px-5 active:scale-95 transition-transform border border-white/20"
        >
          <span className="text-sm">⚜️</span>
          <span>مشاهده کاتالوگ و طرح‌های اصیل</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};