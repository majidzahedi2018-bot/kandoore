// src/components/admin/tabs/AdminTailorsTab.jsx
import React, { useState, useEffect } from 'react';
import {
Search, Users, Star, Phone, Landmark, CheckCircle2,
AlertCircle, Eye, ChevronLeft, Store, Clock, MapPin,
User, Check, X, ShieldAlert, Sparkles, Tag, Activity, Wifi, WifiOff
} from 'lucide-react';
import { adminApi } from '../../../api/api';
import { AdminUserActivityModal } from '../AdminUserActivityModal';

export const AdminTailorsTab = ({ tailors = [], onRefresh }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // استیت مودال مشاهده نمونه‌کارهای خیاط
  const [selectedTailorForPortfolio, setSelectedTailorForPortfolio] = useState(null);
const [tailorDesigns, setTailorDesigns] = useState([]);
const [loadingDesigns, setLoadingDesigns] = useState(false);
// ─── حضور زنده + عضو جدید + تحلیل ورود/خروج (الگوی تب مشتریان) ───
const [presenceMap, setPresenceMap] = useState({});
const [activityFor, setActivityFor] = useState(null);
const [seenMembers, setSeenMembers] = useState(() => { try { return JSON.parse(localStorage.getItem('kandooreh_admin_seen_members_tailors')) || {}; } catch { return {}; } });
const [seenAct, setSeenAct] = useState(() => { try { return JSON.parse(localStorage.getItem('kandooreh_admin_seen_activity_tailors')) || {}; } catch { return {}; } });
const [latestAct, setLatestAct] = useState({});
useEffect(() => {
const load = async () => { try { const r = await adminApi.getPresenceMap(); if (r?.success) setPresenceMap(r.presence || {}); } catch {} };
load(); const iv = setInterval(load, 20000); return () => clearInterval(iv);
}, []);
useEffect(() => {
tailors.forEach(async (t) => { try { const r = await adminApi.getUserActivity(t.userId); if (r?.success) setLatestAct(p => ({ ...p, [t.userId]: r.activities?.[0]?.id || 0 })); } catch {} });
}, [tailors]);
const isOnline = (id) => Boolean(presenceMap?.[id]?.online);
const isNewMember = (t) => t.createdAt && (Date.now() - new Date(t.createdAt).getTime() < 7*24*3600*1000) && !seenMembers[t.userId];
const markSeen = (id) => setSeenMembers(p => { const n = { ...p, [id]: true }; localStorage.setItem('kandooreh_admin_seen_members_tailors', JSON.stringify(n)); return n; });
const hasUnseenAct = (id) => (latestAct[id] || 0) > 0 && (seenAct[id] || 0) < (latestAct[id] || 0);
const markActSeen = (id, lid) => setSeenAct(p => { const n = { ...p, [id]: lid }; localStorage.setItem('kandooreh_admin_seen_activity_tailors', JSON.stringify(n)); return n; });
const faDate = (iso) => iso ? new Date(iso).toLocaleDateString('fa-IR', { dateStyle: 'medium', timeZone: 'Asia/Tehran' }) : '';
const faTime = (iso) => iso ? new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tehran' }) : '';

  // تب‌های ۴گانه فیلتر دقیقاً مطابق تصویر
  const filterTabs = [
    { id: 'all', label: 'همه خیاطان', count: tailors.length },
    { id: 'verified', label: 'تایید شده و فعال', count: tailors.filter(t => t.isVerified && t.isAccepting).length, dotColor: 'bg-emerald-500' },
    { id: 'pending', label: 'در انتظار تایید', count: tailors.filter(t => !t.isVerified).length, dotColor: 'bg-amber-500' },
    { id: 'inactive', label: 'غیرفعال', count: tailors.filter(t => !t.isAccepting).length, dotColor: 'bg-slate-400' },
  ];

  // فیلتر خیاطان بر اساس تب و متن جستجو
  const filteredTailors = tailors.filter((t) => {
    let matchesTab = true;
    if (selectedFilter === 'verified') matchesTab = t.isVerified && t.isAccepting;
    else if (selectedFilter === 'pending') matchesTab = !t.isVerified;
    else if (selectedFilter === 'inactive') matchesTab = !t.isAccepting;

    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      matchesSearch = 
        t.name?.toLowerCase().includes(q) ||
        t.tailorInCharge?.toLowerCase().includes(q) ||
        t.city?.toLowerCase().includes(q) ||
        t.phone?.includes(q);
    }

    return matchesTab && matchesSearch;
  });

  // تاگل کردن وضعیت تایید هویت خیاط
  const handleToggleVerification = async (userId, currentVerified) => {
    const nextState = !currentVerified;
    await adminApi.toggleTailorVerification(userId, nextState);
    if (onRefresh) onRefresh();
  };

  // باز کردن مودال نمونه‌کارهای خیاط
  const handleViewPortfolio = async (tailor) => {
    setSelectedTailorForPortfolio(tailor);
    setLoadingDesigns(true);
    try {
      const res = await adminApi.getTailorDesigns(tailor.userId);
      if (res.success && res.designs) {
        setTailorDesigns(res.designs);
      } else {
        setTailorDesigns([]);
      }
    } catch (e) {
      console.error('Error fetching tailor designs:', e);
      setTailorDesigns([]);
    } finally {
      setLoadingDesigns(false);
    }
  };

  return (
    <div className="space-y-5 text-right select-none">
      
      {/* =========================================================================
          ۱. هدر و نوار فیلترهای بالای صفحه (مطابق تصویر)
          ========================================================================= */}
      <div className="khaliji-card-glass rounded-[2.2rem] p-4 sm:p-5 border-2 border-[#EADFC7] shadow-xl space-y-4">
        
        {/* نوار جستجو و عنوان */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="w-full sm:flex-1 flex items-center bg-white/90 rounded-2xl border-2 border-[#EADFC7] focus-within:border-[#D4AF37] shadow-inner px-3.5 py-2.5">
            <Search className="w-4 h-4 text-[#B38F24] shrink-0 ml-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی نام مزون، خیاط، شهر یا شماره تماس..."
              className="w-full bg-transparent text-xs font-black text-[#23201C] placeholder:text-[#7E7667]/50 focus:outline-none text-right"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-xs text-[#7E7667] mr-1">✕</button>
            )}
          </div>

          <div className="hidden sm:block text-right">
            <h2 className="text-base font-black text-[#23201C]">مدیریت خیاطان و کارگاه‌ها</h2>
            <p className="text-[10px] text-[#7E7667] font-bold">صفحه اصلی / مدیریت کاربران / خیاطان</p>
          </div>
        </div>

        {/* تب‌های ۴گانه فیلتر */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {filterTabs.map((tab) => {
            const isActive = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`shrink-0 px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-[#0E352B] text-white shadow-lg shadow-[#0E352B]/20 scale-[1.02]'
                    : 'khaliji-card-glass text-[#524B40] border border-[#EADFC7] hover:bg-white'
                }`}
              >
                {tab.dotColor && (
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#FCF6BA] animate-pulse' : tab.dotColor}`}></span>
                )}
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#FAF6ED] text-[#7E7667]'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* =========================================================================
          ۲. لیست کارت‌های خیاطان (طراحی لوکس شیشه‌ای با مرز طلایی دقیقاً مثل موکاپ)
          ========================================================================= */}
      {filteredTailors.length > 0 ? (
        <div className="space-y-4">
                 {filteredTailors.map((t) => (
         <div 
           key={t.userId}
           onClick={() => { if (isNewMember(t)) markSeen(t.userId); }}
           className={`khaliji-card-glass rounded-[2.5rem] p-5 sm:p-6 border-2 shadow-xl space-y-4 hover:border-[#D4AF37] transition-all bg-gradient-to-b from-[#FCFAF6] to-[#F8F5EE] ${isNewMember(t) ? 'order-card-unseen cursor-pointer border-[#D4AF37]' : 'border-[#EADFC7]'}`}
         >
              
              {/* بخش هدر کارت: لوگوی گرد کارگاه در راست + نام و مشخصات در چپ */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* لوگوی گرد کارگاه با حاشیه طلایی */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#D4AF37] via-[#FCF6BA] to-[#AA771C] p-1 shadow-md flex items-center justify-center shrink-0">
                  <div className="w-full h-full bg-[#FAF6ED] rounded-full flex items-center justify-center text-3xl border-2 border-white overflow-hidden">
                    {t.avatar && typeof t.avatar === 'string' && t.avatar.startsWith('http') ? (
                      <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                    ) : (
                      '🧕'
                    )}
                  </div>
                </div>

                {/* مشخصات مزون و خیاط */}
                             <div className="flex-1 text-right space-y-1 w-full">
               <div className="flex items-center justify-end gap-2">
                 {isNewMember(t) && (
                   <span className="unseen-badge-pulse px-2 py-0.5 rounded-full bg-[#C85A32]/10 text-[#C85A32] text-[9px] font-black border border-[#C85A32]/40 flex items-center gap-1">
                     <span className="w-1.5 h-1.5 rounded-full bg-[#C85A32] animate-pulse"></span>
                     عضو جدید
                   </span>
                 )}
                 <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border flex items-center gap-1 ${isOnline(t.userId) ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                   {isOnline(t.userId) ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                   {isOnline(t.userId) ? 'آنلاین' : 'آفلاین'}
                 </span>
                 <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${
                   t.isVerified 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      <CheckCircle2 className={`w-3 h-3 ${t.isVerified ? 'text-emerald-600' : 'text-amber-600'}`} />
                      <span>{t.isVerified ? 'تایید شده' : 'در انتظار تایید'}</span>
                    </span>

                    <h3 className="text-base font-black text-[#23201C]">
                      {t.name} - {t.tailorInCharge}
                    </h3>
                  </div>

                                 <div className="flex items-center justify-end gap-1.5 text-xs text-[#7E7667] font-bold">
                 <span>{t.city || 'بندرعباس • گلشهر'}</span>
                 <MapPin className="w-3.5 h-3.5 text-[#B38F24]" />
                 <span>•</span>
                 <span className="text-[10px] text-[#B38F24] font-bold">{faDate(t.createdAt)} • {faTime(t.createdAt)}</span>
               </div>
                </div>

              </div>

              {/* باکس ۳ستونه شاخص‌های عملکردی و بانکی (مطابق موکاپ) */}
              <div className="bg-[#FAF6ED] p-3.5 rounded-2xl border border-[#EADFC7] grid grid-cols-1 sm:grid-cols-3 gap-3 text-center items-center text-xs font-black">
                
                {/* امتیاز و نظرات */}
                <div className="flex flex-col items-center justify-center space-y-0.5 border-b sm:border-b-0 sm:border-l border-[#EADFC7] pb-2 sm:pb-0">
                  <div className="flex items-center gap-1 text-[#23201C] text-sm">
                    <span>{t.rating || '۵٫۰'}</span>
                    <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                  </div>
                  <span className="text-[10px] text-[#7E7667] font-bold">
                    {t.reviews || 0} نظر ثبت‌شده
                  </span>
                </div>

                {/* تعداد سفارش‌های موفق */}
                <div className="flex flex-col items-center justify-center space-y-0.5 border-b sm:border-b-0 sm:border-l border-[#EADFC7] pb-2 sm:pb-0">
                  <span className="text-sm font-black text-[#23201C]">
                    {t.ordersCount || 0}
                  </span>
                  <span className="text-[10px] text-[#7E7667] font-bold">
                    سفارش موفق
                  </span>
                </div>

                {/* تلفن تماس و شماره شبا */}
                <div className="flex flex-col items-center justify-center space-y-0.5">
                  <span className="font-mono text-[#23201C] text-xs dir-ltr">
                    {t.phone || '۰۹۱۷۰۰۰۰۰۰۰'}
                  </span>
                  <span className="font-mono text-[9px] text-[#7E7667] dir-ltr truncate max-w-[170px]">
                    {t.shabaNumber || 'IR7201700000001234567890'}
                  </span>
                </div>

              </div>

              {/* تگ‌های تخصص‌های کار دست */}
              <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
                {['بادله‌دوزی اعلا', 'شک‌بافی ۶ سانت', 'گلابتون‌دوزی فاخر', 'دوخت سنتی'].map((tag, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-white border border-[#EADFC7] text-[10px] font-black text-[#524B40] shadow-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* ردیف دکمه‌های عملیاتی: سوئیچ تایید هویت + مشاهده نمونه‌کار + تماس و مدیریت */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 items-center">
                
                {/* سوئیچ تاگل تایید هویت خیاط */}
                <div className="p-2.5 rounded-2xl bg-white border border-[#EADFC7] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleToggleVerification(t.userId, t.isVerified)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${t.isVerified ? 'bg-[#0E8388]' : 'bg-[#EADFC7]'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${t.isVerified ? 'translate-x-0' : '-translate-x-5'}`}></div>
                  </button>
                  <span className="text-xs font-black text-[#23201C]">
                    {t.isVerified ? 'تایید هویت شده' : 'در انتظار بررسی'}
                  </span>
                </div>

                {/* دکمه مشاهده نمونه‌کارها */}
                <button
                  type="button"
                  onClick={() => handleViewPortfolio(t)}
                  className="py-3 px-3 rounded-2xl bg-white border border-[#EADFC7] text-[#23201C] text-xs font-black flex items-center justify-center gap-1.5 shadow-sm active:scale-95 hover:bg-[#FAF6ED] transition-all"
                >
                  <Eye className="w-4 h-4 text-[#B38F24]" />
                  <span>مشاهده نمونه‌کارها</span>
                </button>

                {/* دکمه تماس و مدیریت کارگاه */}
                <a
                  href={`tel:${t.phone || '07633332211'}`}
                  className="py-3 px-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B38F24] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-[#D4AF37]/25 active:scale-95 transition-all"
                >
                                 <Phone className="w-4 h-4" />
               <span>تماس با کارگاه</span>
             </a>
           </div>
           {/* دکمه تحلیل ورود/خروج با بج فعالیت دیده‌نشده */}
           <button
             type="button"
             onClick={(e) => { e.stopPropagation(); setActivityFor(t); }}
             className="relative w-full py-3 px-3 rounded-2xl bg-white border border-[#EADFC7] text-[#23201C] text-xs font-black flex items-center justify-center gap-1.5 shadow-sm active:scale-95 hover:bg-[#FAF6ED] transition-all"
           >
             {hasUnseenAct(t.userId) && <span className="unseen-badge-pulse absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-[#C85A32] rounded-full border border-white"></span>}
             <Activity className="w-4 h-4 text-[#0E8388]" />
             <span>تحلیل ورود/خروج</span>
           </button>
         </div>
       ))}
        </div>
      ) : (
        <div className="khaliji-card-glass rounded-[2.5rem] p-12 border-2 border-dashed border-[#D4AF37]/60 text-center space-y-3">
          <span className="text-4xl">🧕</span>
          <h3 className="text-sm font-black text-[#23201C]">خیاطی با این مشخصات یافت نشد</h3>
          <p className="text-xs text-[#7E7667]">می‌توانید عبارت جستجو را پاک کنید یا فیلتر دیگری را انتخاب نمایید.</p>
        </div>
      )}

      {/* =========================================================================
          ۳. مودال مشاهده کاتالوگ نمونه‌کارهای اختصاصی خیاط
          ========================================================================= */}
      {selectedTailorForPortfolio && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#F8F5EE] w-full max-w-lg max-h-[85vh] rounded-[2.5rem] p-5 border border-[#EADFC7] shadow-2xl flex flex-col justify-between overflow-hidden text-right">
            
            <div className="flex items-center justify-between border-b border-[#EADFC7] pb-3 shrink-0">
              <span className="text-xs font-black text-[#23201C]">
                نمونه‌کارهای {selectedTailorForPortfolio.name} ({tailorDesigns.length})
              </span>
              <button onClick={() => setSelectedTailorForPortfolio(null)} className="text-xs text-[#7E7667]">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-3 space-y-3">
              {loadingDesigns ? (
                <div className="text-center py-10 text-xs font-black text-[#7E7667]">در حال دریافت نمونه‌کارها...</div>
              ) : tailorDesigns.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {tailorDesigns.map((d) => (
                    <div key={d.id} className="bg-white p-3 rounded-2xl border border-[#EADFC7] space-y-2 text-center shadow-sm">
                      <div className="w-full h-28 rounded-xl bg-gradient-to-br from-[#1C150F] to-[#2A1F16] flex items-center justify-center text-3xl overflow-hidden">
                        {d.image ? (
                          <img src={d.image} alt={d.title} className="w-full h-full object-cover" />
                        ) : (
                          '✨👗'
                        )}
                      </div>
                      <h4 className="text-xs font-black text-[#23201C] truncate">{d.title}</h4>
                      <span className="text-[11px] font-black text-[#0E8388] block">
                        {(d.price || 0).toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-xs font-black text-[#7E7667]">
                  هنوز نمونه‌کاری توسط این خیاط ثبت نشده است.
                </div>
              )}
            </div>

                     <button
           onClick={() => setSelectedTailorForPortfolio(null)}
           className="w-full py-3 rounded-2xl bg-[#0E352B] text-white font-black text-xs shadow-md shrink-0"
         >
           بستن
         </button>
       </div>
     </div>
   )}
   {activityFor && (
     <AdminUserActivityModal isOpen={Boolean(activityFor)} onClose={() => setActivityFor(null)} userId={activityFor.userId} userName={activityFor.name} onSeen={(id, lid) => markActSeen(id, lid)} />
   )}
 </div>
);
};