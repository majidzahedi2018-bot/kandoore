// src/components/landing/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Star, MapPin, ShieldCheck, Lock, ShoppingBag, Shirt, 
  Award, MessageCircle, Send, Scissors, User, Wallet, FileText, 
  BadgeCheck, Truck, Sparkles, Gem, Download, Smartphone, Bell, CheckCircle2
} from 'lucide-react';
import { designsApi, tailorApi } from '../../api/api';
import { SITE_CONFIG } from '../../config/siteConfig';

/* ═══ پترن اسلیمی طلایی (SVG داخلی) ═══ */
const PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cpath d='M28 4l5.5 18.5L52 28l-18.5 5.5L28 52l-5.5-18.5L4 28l18.5-5.5z' fill='%23D4AF37' fill-opacity='0.07'/%3E%3C/svg%3E")`;
const PATTERN_DARK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cpath d='M28 4l5.5 18.5L52 28l-18.5 5.5L28 52l-5.5-18.5L4 28l18.5-5.5z' fill='%23F5D67A' fill-opacity='0.06'/%3E%3C/svg%3E")`;

const InstagramIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

/* ═══ آیکون ربات اندروید ═══ */
const AndroidIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993 0 .5511-.4483.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4114 13.8533 8.12 12 8.12s-3.5902.2914-5.1368.8306L4.8409 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396"/>
  </svg>
);

/* ═══ دیوایدر تزئینی ═══ */
const Ornament = ({ children }) => (
  <div className="flex items-center justify-center gap-3 mb-7">
    <span className="h-[2px] w-14 bg-gradient-to-l from-[#D4AF37]/80 to-transparent rounded-full"></span>
    <span className="text-[#D4AF37]">❖</span>
    <h3 className="text-lg md:text-2xl font-black text-[#23201C]">{children}</h3>
    <span className="text-[#D4AF37]">❖</span>
    <span className="h-[2px] w-14 bg-gradient-to-r from-[#D4AF37]/80 to-transparent rounded-full"></span>
  </div>
);

export const LandingPage = ({ onOpenAuth, onOpenAboutUs }) => {
  const [designs, setDesigns] = useState([]);
  const [tailors, setTailors] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const d = await designsApi.getAll();
        if (d.success) setDesigns((d.designs || []).slice(0, 4));
        const t = await tailorApi.getTopTailors();
        if (t.success) setTailors((t.tailors || []).slice(0, 3));
      } catch {}
    };
    load();
  }, []);

  const imgOf = (d) => (d.image && String(d.image).startsWith('http')) ? d.image : null;
  const heroImage = designs.map(imgOf).find(Boolean) || null;
  const rateOf = (d) => (parseFloat(d.rating) > 0 ? Number(d.rating).toFixed(1) : '۴٫۹');
  const crafts = ['گلابتوندوزی', 'بادلهدوزی', 'خوسدوزی', 'شکبافی', 'زریبافی', 'کرپ و حریر اعلا', 'ضمانت امانی', 'تحویل اختصاصی'];

  const apkUrl = SITE_CONFIG.apkDownloadUrl || '/kandooreh.apk';

  return (
    <div dir="rtl" className="min-h-screen relative overflow-hidden bg-[#F6EFE3] text-[#23201C] select-none">
      <style>{`
        @keyframes kShine{0%{transform:translateX(180%)}100%{transform:translateX(-180%)}}
        @keyframes kFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes kMarquee{from{transform:translateX(-50%)}to{transform:translateX(0)}}
        @keyframes kGlow{0%,100%{box-shadow:0 0 18px 2px rgba(212,175,55,.35)}50%{box-shadow:0 0 34px 8px rgba(212,175,55,.6)}}
        .k-shine{position:relative;overflow:hidden}
        .k-shine::after{content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.55) 50%,transparent 60%);transform:translateX(180%);animation:kShine 3.4s infinite}
        .k-float{animation:kFloat 5.5s ease-in-out infinite}
        .k-marquee{animation:kMarquee 26s linear infinite}
        .k-glow{animation:kGlow 3s ease-in-out infinite}
      `}</style>

      {/* ═══ هاله‌های نور و بافت سراسری ═══ */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: PATTERN }}></div>
      <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-[#D4AF37]/15 blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-[#0E8388]/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[11rem] leading-none text-[#D4AF37]/8 pointer-events-none">⚜️</div>

      <div className="max-w-md md:max-w-4xl lg:max-w-6xl mx-auto px-4 relative">

        {/* ═══ ۱. هیرو با قاب محرابی ═══ */}
        <section className="pt-10 md:pt-16 pb-8">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="space-y-5 text-center md:text-right order-1">
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <span className="text-[#D4AF37] text-2xl k-float inline-block">⚜️</span>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-[#F5D67A] via-[#D4AF37] to-[#8C6D1F] drop-shadow-sm">کَندوره</h1>
                <span className="text-[#D4AF37] text-2xl k-float inline-block" style={{ animationDelay: '1s' }}>⚜️</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-black leading-snug">اصالت در دوخت،<br className="hidden md:block" /> اعتماد در پرداخت</h2>
              <div className="h-[3px] w-28 mx-auto md:mx-0 rounded-full bg-gradient-to-l from-[#D4AF37] via-[#D4AF37]/50 to-transparent"></div>
              <p className="text-xs md:text-sm text-[#7E7667] font-bold leading-relaxed">پلتفرم سفارش آنلاین لباس سنتی هرمزگان با ضمانت امانی</p>
              
              {/* دکمه‌های اصلی و دکمه دانلود APK */}
              <div className="space-y-2.5 pt-1">
                <button onClick={onOpenAuth} className="k-shine w-full py-3.5 md:py-4 rounded-2xl bg-gradient-to-l from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white text-sm font-black shadow-xl shadow-[#D4AF37]/40 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                  <ShoppingBag className="w-4 h-4" /><span>ثبت سفارش آنلاین</span>
                </button>
                
                <div className="grid grid-cols-2 gap-2.5">
                  <button onClick={onOpenAuth} className="w-full py-3 rounded-2xl bg-white/85 backdrop-blur border-2 border-[#0E8388] text-[#0E8388] text-xs md:text-sm font-black flex items-center justify-center gap-1.5 active:scale-95 transition-transform hover:bg-[#0E8388] hover:text-white">
                    <Shirt className="w-4 h-4" /><span>عضویت خیاطان</span>
                  </button>
                  
                  {/* دکمه دانلود مستقیم APK در هیرو */}
                  <a 
                    href={apkUrl} 
                    download="kandooreh.apk" 
                    className="w-full py-3 rounded-2xl bg-[#0E352B] border border-[#D4AF37]/60 text-[#FBF5B7] text-xs md:text-sm font-black flex items-center justify-center gap-1.5 active:scale-95 transition-transform hover:bg-[#154639] shadow-md hover:shadow-lg"
                  >
                    <AndroidIcon className="w-4 h-4 text-[#D4AF37]" />
                    <span>دانلود اپلیکیشن</span>
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-4 pt-1 text-[10px] font-black text-[#524B40]">
                <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-[#0E8388]" />پرداخت امانی</span>
                <span className="flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5 text-[#0E8388]" />خیاطان تأییدشده</span>
                <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-[#0E8388]" />تحویل اختصاصی</span>
              </div>
            </div>

            {/* قاب محرابی */}
            <div className="order-2 relative flex justify-center">
              <div className="k-float relative">
                <div className="relative w-64 md:w-80 h-80 md:h-[26rem] rounded-t-[10rem] rounded-b-[2.5rem] border-[3px] border-[#D4AF37] bg-[#1C150F] overflow-hidden shadow-2xl shadow-[#D4AF37]/40">
                  <div className="absolute inset-0" style={{ backgroundImage: PATTERN_DARK }}></div>
                  {heroImage ? (
                    <img src={heroImage} alt="کندوره زریبافی" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-8xl drop-shadow-2xl">👗</div>
                  )}
                  <div className="absolute inset-2 rounded-t-[9rem] rounded-b-[2rem] border border-[#D4AF37]/40 pointer-events-none"></div>
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                </div>
                <div className="absolute -top-3 right-6 px-3.5 py-2 rounded-2xl bg-white border-2 border-[#D4AF37] shadow-lg text-[10px] font-black flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />ضمانت امانی
                </div>
                <div className="absolute -bottom-3 left-6 px-3.5 py-2 rounded-2xl bg-[#0E352B] border border-[#D4AF37]/60 shadow-lg text-[10px] font-black text-[#FBF5B7] flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-[#D4AF37]" />+۱۲۰ سفارش موفق
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ ۲. نوار متحرک هنرهای دوزی ═══ */}
        <div className="relative py-3 -mx-4 bg-gradient-to-l from-[#0E352B] via-[#092820] to-[#0E352B] border-y border-[#D4AF37]/40 overflow-hidden" dir="ltr">
          <div className="k-marquee flex w-max gap-8" dir="rtl">
            {[...crafts, ...crafts].map((c, i) => (
              <span key={i} className="flex items-center gap-8 text-[11px] font-black text-[#FBF5B7] whitespace-nowrap">
                <span>{c}</span><span className="text-[#D4AF37]">✦</span>
              </span>
            ))}
          </div>
        </div>

        {/* ═══ ۳. چگونه کار میکند ═══ */}
        <section className="py-10">
          <div className="khaliji-card-glass rounded-[2.5rem] p-6 md:p-8 border border-[#EADFC7] shadow-lg space-y-7 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: PATTERN }}></div>
            <Ornament>چگونه کار میکند؟</Ornament>
            <div className="flex items-start justify-between relative">
              <div className="absolute top-10 right-10 left-10 h-[2px] bg-gradient-to-l from-[#D4AF37]/60 via-[#D4AF37]/25 to-[#D4AF37]/60 hidden md:block"></div>
              {[
                { n: '۱', t: 'ثبت سفارش', i: FileText },
                { n: '۲', t: 'تایید خیاط', i: User },
                { n: '۳', t: 'پرداخت بیعانه', i: Wallet },
                { n: '۴', t: 'دوخت', i: Scissors },
                { n: '۵', t: 'تحویل با کد', i: Lock },
              ].map((s, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2.5 flex-1 relative group cursor-default">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E5C158] to-[#AA771C] text-white text-[11px] font-black flex items-center justify-center shadow-md z-10 group-hover:scale-110 transition-transform">{s.n}</div>
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white border-2 border-[#D4AF37]/60 flex items-center justify-center shadow-sm group-hover:shadow-xl group-hover:border-[#D4AF37] transition-all">
                    <s.i className="w-6 h-6 text-[#B38F24]" />
                  </div>
                  <span className="text-[10px] md:text-xs font-black text-[#524B40]">{s.t}</span>
                </div>
              ))}
            </div>
            <div className="k-shine rounded-2xl p-4 bg-gradient-to-l from-[#0E352B] to-[#041914] border border-[#D4AF37]/50 flex items-center gap-3 relative overflow-hidden">
              <ShieldCheck className="w-6 h-6 text-[#D4AF37] shrink-0" />
              <span className="text-[11px] md:text-sm font-black text-[#FBF5B7]">پرداخت امانی تا تحویل نهایی — بیعانه شما تا رضایت کامل، محفوظ میماند</span>
            </div>
          </div>
        </section>

        {/* ═══ ۴. طرحهای شاخص ═══ */}
        <section className="py-6">
          <Ornament>طرحهای شاخص</Ornament>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-5">
            {designs.map((d) => (
              <div key={d.id} onClick={onOpenAuth} className="group relative rounded-[1.8rem] bg-white/80 backdrop-blur border border-[#D4AF37]/50 p-2.5 cursor-pointer active:scale-95 hover:shadow-2xl hover:shadow-[#D4AF37]/25 hover:-translate-y-1 transition-all space-y-2">
                <div className="relative w-full h-40 md:h-48 rounded-[1.4rem] overflow-hidden bg-gradient-to-br from-[#23201C] to-[#3D2D1E]">
                  <div className="absolute inset-0" style={{ backgroundImage: PATTERN_DARK }}></div>
                  {imgOf(d) ? (
                    <img src={imgOf(d)} alt={d.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-6xl drop-shadow-2xl">✨👗</div>
                  )}
                  <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-[#0E352B]/90 backdrop-blur border border-[#D4AF37]/60 text-[9px] font-black text-[#FBF5B7] flex items-center gap-1">
                    <Gem className="w-3 h-3 text-[#D4AF37]" />{d.category || 'کندوره'}
                  </div>
                </div>
                <h4 className="text-[11px] md:text-xs font-black truncate px-1">{d.title}</h4>
                <div className="flex items-center justify-between px-1 pb-1">
                  <span className="text-[10px] md:text-xs font-black text-[#0E8388]">{(d.price || 0).toLocaleString('fa-IR')} تومان</span>
                  <span className="flex items-center gap-1 text-[9px] font-black text-[#7E7667]">{rateOf(d)}<Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" /></span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ ۵. خیاطان برتر ═══ */}
        <section className="py-8">
          <Ornament>خیاطان برتر</Ornament>
          <div className="grid md:grid-cols-3 gap-4 md:gap-5">
            {tailors.map((t, i) => (
              <div key={t.userId || t.id} onClick={onOpenAuth} className="relative rounded-[2rem] bg-white/80 backdrop-blur border border-[#D4AF37]/50 p-4 pt-5 cursor-pointer active:scale-95 hover:shadow-2xl hover:shadow-[#D4AF37]/25 hover:-translate-y-1 transition-all">
                <span className="absolute -top-3 right-6 px-3 py-1.5 rounded-xl bg-gradient-to-br from-[#E5C158] to-[#AA771C] text-white text-[10px] font-black shadow-lg">رتبه #{i + 1}</span>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-[#0E8388] via-[#D4AF37] to-[#FFF5C0] shadow-md shrink-0">
                    <div className="w-full h-full rounded-full bg-[#FAF6ED] border-2 border-white flex items-center justify-center text-2xl overflow-hidden">
                      {t.avatar ? <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" /> : '🧕'}
                    </div>
                  </div>
                  <div className="flex-1 text-right space-y-1">
                    <h4 className="text-xs md:text-sm font-black flex items-center gap-1">{t.name}<BadgeCheck className="w-4 h-4 text-emerald-600" /></h4>
                    <span className="text-[10px] text-[#7E7667] font-bold flex items-center gap-1"><MapPin className="w-3 h-3" />{t.city}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="rounded-xl bg-[#FAF6ED] border border-[#D4AF37]/40 p-2 text-center">
                    <span className="text-xs font-black flex items-center justify-center gap-1">{rateOf(t)}<Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" /></span>
                    <span className="text-[8px] text-[#7E7667] font-bold block mt-0.5">امتیاز</span>
                  </div>
                  <div className="rounded-xl bg-[#FAF6ED] border border-[#D4AF37]/40 p-2 text-center">
                    <span className="text-xs font-black text-[#0E8388]">{t.completedOrders}</span>
                    <span className="text-[8px] text-[#7E7667] font-bold block mt-0.5">سفارش</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ ۶. اعتماد و ضمانت ═══ */}
        <section className="py-8">
          <div className="relative rounded-[2.5rem] p-7 md:p-9 bg-gradient-to-l from-[#0E352B] via-[#092820] to-[#041914] border-2 border-[#D4AF37]/60 shadow-2xl space-y-6 text-right overflow-hidden">
            <div className="absolute inset-0" style={{ backgroundImage: PATTERN_DARK }}></div>
            <div className="absolute -left-8 -bottom-8 text-9xl opacity-10">⚜️</div>
            <div className="flex items-center gap-4 relative">
              <div className="k-glow w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#AA771C] flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6 text-[#041914]" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-black text-[#FBF5B7]">پرداخت شما امن</h3>
                <p className="text-[11px] md:text-xs text-white/80 font-bold leading-relaxed mt-1">بیعانه تا تحویل نهایی در حساب امانی کَندوره محفوظ میماند.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2.5 md:gap-4 relative">
              <div className="rounded-2xl p-3.5 bg-white/5 border border-[#D4AF37]/30 backdrop-blur text-center space-y-1.5 hover:bg-white/10 transition-colors"><ShoppingBag className="w-5 h-5 text-[#D4AF37] mx-auto" /><span className="text-[10px] md:text-xs font-black text-white block">+۱۲۰ سفارش</span></div>
              <div className="rounded-2xl p-3.5 bg-white/5 border border-[#D4AF37]/30 backdrop-blur text-center space-y-1.5 hover:bg-white/10 transition-colors"><Shirt className="w-5 h-5 text-[#D4AF37] mx-auto" /><span className="text-[10px] md:text-xs font-black text-white block">۳ خیاط فعال</span></div>
              <div className="rounded-2xl p-3.5 bg-white/5 border border-[#D4AF37]/30 backdrop-blur text-center space-y-1.5 hover:bg-white/10 transition-colors"><Award className="w-5 h-5 text-[#D4AF37] mx-auto" /><span className="text-[10px] md:text-xs font-black text-white block">۹۸٪ رضایت</span></div>
            </div>
          </div>
        </section>

        {/* ═══ ۷. بنر اختصاصی دانلود اپلیکیشن موبایل (بخش جدید) ═══ */}
        <section className="py-8">
          <div className="relative rounded-[2.5rem] p-7 md:p-10 bg-gradient-to-br from-[#1C150F] via-[#2D2116] to-[#120D09] border-2 border-[#D4AF37]/60 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: PATTERN_DARK }}></div>
            <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-[#D4AF37]/15 blur-3xl pointer-events-none"></div>

            <div className="grid md:grid-cols-12 gap-8 items-center relative z-10">
              {/* متن و توضیحات */}
              <div className="md:col-span-7 text-center md:text-right space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#F5D67A] text-[11px] font-black">
                  <AndroidIcon className="w-4 h-4" />
                  <span>نسخه اختصاصی اندروید ({SITE_CONFIG.apkVersion || '۱.۰.۰'})</span>
                </div>
                
                <h3 className="text-2xl md:text-3xl font-black text-white leading-tight">
                  اپلیکیشن کَندوره همیشه همراه شما
                </h3>
                
                <p className="text-xs md:text-sm text-[#D8CFBF] font-medium leading-relaxed">
                  با نصب اپلیکیشن اندروید، به سادگی سفارش‌های خود را مدیریت کنید، مراحل دوخت را به صورت زنده دنبال نمایید و بدون واسطه با خیاطان گفتگو کنید.
                </p>

                {/* ویژگی‌های کلیدی اپلیکیشن */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-right">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#FBF5B7]">
                    <CheckCircle2 className="w-4 h-4 text-[#0E8388] shrink-0" />
                    <span>دریافت لحظه‌ای وضعیت سفارش و دوخت</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#FBF5B7]">
                    <CheckCircle2 className="w-4 h-4 text-[#0E8388] shrink-0" />
                    <span>چت و ارسال عکس مستقیم با خیاط</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#FBF5B7]">
                    <CheckCircle2 className="w-4 h-4 text-[#0E8388] shrink-0" />
                    <span>دفترچه اندازه اختصاصی ذخیره‌شده</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#FBF5B7]">
                    <CheckCircle2 className="w-4 h-4 text-[#0E8388] shrink-0" />
                    <span>سرعت بالا و مصرف اینترنت نیم‌بها</span>
                  </div>
                </div>

                {/* دکمه بزرگ دانلود فایل نصبی */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
                  <a
                    href={apkUrl}
                    download="kandooreh.apk"
                    className="k-shine inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#F5D67A] via-[#D4AF37] to-[#AA771C] text-[#1C150F] font-black text-sm shadow-xl shadow-[#D4AF37]/30 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
                  >
                    <Download className="w-5 h-5" />
                    <span>دانلود مستقیم فایل نصبی (APK)</span>
                  </a>
                  <span className="text-[11px] text-[#A69C89] font-bold">حجم تقریبی: ~۱۵ مگابایت</span>
                </div>
              </div>

              {/* المان گرافیکی موبایل */}
              <div className="md:col-span-5 flex justify-center order-first md:order-last">
                <div className="relative w-44 md:w-52 h-72 md:h-84 rounded-[2.5rem] p-3 bg-gradient-to-b from-[#2F271D] to-[#17120D] border-2 border-[#D4AF37]/70 shadow-2xl k-float">
                  <div className="w-full h-full rounded-[2rem] bg-[#0E352B] p-4 flex flex-col items-center justify-between border border-[#D4AF37]/30 text-center">
                    <div className="w-12 h-1 bg-[#D4AF37]/40 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#F5D67A] to-[#AA771C] flex items-center justify-center text-2xl shadow-lg">
                        ⚜️
                      </div>
                      <h5 className="text-xs font-black text-[#FBF5B7]">کَندوره موبایل</h5>
                      <p className="text-[9px] text-white/70 font-medium">سفارش آسان و مستقیم</p>
                    </div>
                    <div className="w-full py-1.5 rounded-xl bg-white/10 border border-[#D4AF37]/30 text-[9px] font-black text-[#F5D67A]">
                      نسخه ویژه خریداران و خیاطان
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ ۸. بنر عضویت خیاطان ═══ */}
        <section className="py-6">
          <div className="k-shine relative rounded-[2.5rem] p-7 md:p-9 bg-gradient-to-l from-[#E5C158] via-[#D4AF37] to-[#AA771C] shadow-2xl shadow-[#D4AF37]/40 space-y-3 text-right overflow-hidden">
            <div className="absolute inset-0" style={{ backgroundImage: PATTERN_DARK }}></div>
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-8xl opacity-40 k-float hidden md:block">🪡</div>
            <h3 className="text-lg md:text-2xl font-black text-white drop-shadow-sm relative">کارگاه خود را در کَندوره ثبت کنید</h3>
            <p className="text-[11px] md:text-sm text-white/90 font-bold relative">درآمد واقعی، تسویه شفاف، بدون هزینه اولیه</p>
            <button onClick={onOpenAuth} className="relative px-7 py-3.5 rounded-2xl bg-white text-[#0E8388] text-xs md:text-sm font-black shadow-lg active:scale-95 transition-transform hover:shadow-2xl">عضویت به‌عنوان خیاط</button>
          </div>
        </section>

        {/* ═══ ۹. فوتر ═══ */}
        <footer className="relative mt-6 pt-12 pb-7 bg-[#23201C] text-right space-y-7 rounded-t-[3rem] -mx-4 px-6 md:px-12 overflow-hidden">
          <div className="absolute inset-0" style={{ backgroundImage: PATTERN_DARK }}></div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2"><span className="text-[#D4AF37] text-xl">⚜️</span><span className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-b from-[#F5D67A] to-[#D4AF37]">کَندوره</span></div>
              <p className="text-[10px] md:text-xs text-white/70 font-bold leading-relaxed">اصالت در دوخت، اعتماد در پرداخت</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[10px] md:text-xs text-white/80 font-bold">
              <button onClick={() => (onOpenAboutUs ? onOpenAboutUs() : onOpenAuth())} className="hover:text-[#D4AF37] transition-colors">درباره ما</button>
              <button onClick={onOpenAuth} className="hover:text-[#D4AF37] transition-colors">پشتیبانی</button>
              <button onClick={onOpenAuth} className="hover:text-[#D4AF37] transition-colors">قوانین و حریم خصوصی</button>
              <a href={apkUrl} download="kandooreh.apk" className="text-[#F5D67A] hover:underline flex items-center gap-1 font-black">
                <AndroidIcon className="w-3.5 h-3.5" />
                <span>دانلود اپلیکیشن</span>
              </a>
            </div>
            <div className="flex items-center gap-2.5 md:justify-end">
              <span className="w-10 h-10 rounded-full border border-[#D4AF37]/50 flex items-center justify-center cursor-pointer hover:bg-[#D4AF37]/15 hover:scale-110 transition-all"><InstagramIcon className="w-4 h-4 text-[#D4AF37]" /></span>
              <span className="w-10 h-10 rounded-full border border-[#D4AF37]/50 flex items-center justify-center cursor-pointer hover:bg-[#D4AF37]/15 hover:scale-110 transition-all"><MessageCircle className="w-4 h-4 text-[#D4AF37]" /></span>
              <span className="w-10 h-10 rounded-full border border-[#D4AF37]/50 flex items-center justify-center cursor-pointer hover:bg-[#D4AF37]/15 hover:scale-110 transition-all"><Send className="w-4 h-4 text-[#D4AF37]" /></span>
            </div>
          </div>
          <div className="flex items-center gap-3 relative">
            <span className="h-[1px] flex-1 bg-white/10"></span>
            <span className="text-[#D4AF37] text-xs">❖</span>
            <span className="h-[1px] flex-1 bg-white/10"></span>
          </div>
          <p className="text-[9px] md:text-[10px] text-white/50 font-bold text-center relative">© ۱۴۰۵ کَندوره — تمامی حقوق محفوظ است</p>
        </footer>

      </div>
    </div>
  );
};