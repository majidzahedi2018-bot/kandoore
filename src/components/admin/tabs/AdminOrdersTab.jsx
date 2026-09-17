// src/components/admin/tabs/AdminOrdersTab.jsx
import React, { useState } from 'react';
import { 
  Search, Bell, User, Store, Shirt, Ruler, Settings, 
  Check, X, ChevronLeft, Calendar, Clock, RotateCcw,
  CheckCircle2, AlertCircle, KeyRound, Tag, ShieldCheck
} from 'lucide-react';
import { adminApi } from '../../../api/api';
import { useToast } from '../../common/ToastSystem';
import { useUnseenOrders } from '../../../hooks/useUnseenOrders';
export const AdminOrdersTab = ({ orders = [], onRefresh }) => {
const { toast, confirmAction } = useToast();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  // سیستم سفارش‌های دیده‌نشده: بج گوشه تب‌ها + حاشیه چشمک‌زن کارت‌های جدید
const { isUnseen, unseenByTab, markSeen } = useUnseenOrders(orders);
  
  // استیت مودال‌های عملیاتی
  const [selectedOrderForManage, setSelectedOrderForManage] = useState(null);
  const [selectedOrderMeasurements, setSelectedOrderMeasurements] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // تب‌های ۵گانه فیلتر دقیقاً مطابق تصویر موکاپ
const filterTabs = [
{ id: 'all', label: 'همه سفارش‌ها', count: orders.length },
{ id: 'pending', label: 'در انتظار تایید', count: orders.filter(o => o.step === 1).length },
{ id: 'in_progress', label: 'در حال دوخت', count: orders.filter(o => o.step === 2 || o.step === 3 || o.step === 4).length, hasDot: true },
{ id: 'completed', label: 'تحویل شده', count: orders.filter(o => o.step === 5).length },
{ id: 'cancelled', label: 'لغو شده', count: orders.filter(o => o.step === 6).length },
];
// فیلتر سفارش‌ها بر اساس تب و متن جستجو
const filteredOrders = orders.filter((ord) => {
let matchesTab = true;
if (selectedFilter === 'pending') matchesTab = ord.step === 1;
else if (selectedFilter === 'in_progress') matchesTab = ord.step === 2 || ord.step === 3 || ord.step === 4;
else if (selectedFilter === 'completed') matchesTab = ord.step === 5;
else if (selectedFilter === 'cancelled') matchesTab = ord.step === 6;

    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      matchesSearch = 
        ord.id?.toLowerCase().includes(q) ||
        ord.customerName?.toLowerCase().includes(q) ||
        ord.customerPhone?.includes(q) ||
        ord.tailorName?.toLowerCase().includes(q) ||
        ord.designTitle?.toLowerCase().includes(q);
    }

    return matchesTab && matchesSearch;
  });

  // تغییر مرحله سفارش توسط ادمین
  const handleUpdateStep = async (orderId, newStep) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`https://kandoore.ir/api/admin.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_order_step', order_id: orderId, step: newStep })
      });
      const data = await res.json();
      setIsUpdating(false);
      if (data.success) {
if (onRefresh) onRefresh();
setSelectedOrderForManage(null);
toast.success('وضعیت سفارش با موفقیت به‌روزرسانی شد.');
} else {
toast.error(data.message || 'خطا در تغییر وضعیت سفارش');
}
} catch (e) {
setIsUpdating(false);
toast.error('خطا در ارتباط با سرور');
}
  };

  return (
    <div className="space-y-5 text-right select-none">
      
      {/* =========================================================================
          ۱. هدر و فیلترهای بالای صفحه (مطابق تصویر)
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
              placeholder="جستجو با کد سفارش، نام مشتری یا خیاط..."
              className="w-full bg-transparent text-xs font-black text-[#23201C] placeholder:text-[#7E7667]/50 focus:outline-none text-right"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-xs text-[#7E7667] mr-1">✕</button>
            )}
          </div>

          <div className="hidden sm:block text-right">
            <h2 className="text-base font-black text-[#23201C]">مدیریت سفارش‌ها</h2>
            <p className="text-[10px] text-[#7E7667] font-bold">نمایش و مدیریت تمامی سفارش‌های پلتفرم</p>
          </div>
        </div>

        {/* تب‌های ۵گانه فیلتر با استایل دقیق موکاپ */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                 {filterTabs.map((tab) => {
         const isActive = selectedFilter === tab.id;
         const unseen = unseenByTab[tab.id] || 0;
         return (
           <button
             key={tab.id}
             onClick={() => setSelectedFilter(tab.id)}
             className={`relative shrink-0 px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all ${
               isActive
                 ? 'bg-[#0E352B] text-white shadow-lg shadow-[#0E352B]/20 scale-[1.02]'
                 : 'khaliji-card-glass text-[#524B40] border border-[#EADFC7] hover:bg-white'
             }`}
           >
             {/* بج گوشه: تعداد سفارش‌های دیده‌نشدهٔ این تب */}
             {unseen > 0 && (
               <span className="unseen-badge-pulse absolute -top-2 -left-2 min-w-[20px] h-5 px-1.5 rounded-full bg-[#C85A32] text-white text-[9px] font-black flex items-center justify-center border-2 border-[#FCFAF6] shadow-md">
                 {unseen > 9 ? '+۹' : unseen.toLocaleString('fa-IR')}
               </span>
             )}
             {tab.dotColor && (
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#FCF6BA] animate-pulse' : 'bg-emerald-500'}`}></span>
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
          ۲. لیست کارت‌های سفارش (طراحی لوکس دقیقاً مطابق با تصویر)
          ========================================================================= */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
                {filteredOrders.map((ord) => (
         <div 
           key={ord.id}
           onClick={() => { if (isUnseen(ord)) markSeen(ord.id, ord.step); }}
           className={`khaliji-card-glass rounded-[2.5rem] p-5 sm:p-6 border-2 border-[#EADFC7] shadow-xl space-y-4 hover:border-[#D4AF37] transition-all bg-gradient-to-b from-[#FCFAF6] to-[#F8F5EE] ${
             isUnseen(ord) ? 'order-card-unseen cursor-pointer' : ''
           }`}
         >
           {/* ردیف بالا: کد سفارش، تاریخ، ساعت، وضعیت + برچسب جدید */}
           <div className="flex items-center justify-between border-b border-[#EADFC7] pb-3">
             <div className="flex items-center gap-2">
               {isUnseen(ord) && (
                 <span className="unseen-badge-pulse px-2.5 py-1 rounded-full bg-[#C85A32]/10 text-[#C85A32] text-[9px] font-black border border-[#C85A32]/40 flex items-center gap-1">
                   <span className="w-1.5 h-1.5 rounded-full bg-[#C85A32] animate-pulse"></span>
                   جدید
                 </span>
               )}
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black border flex items-center gap-1 ${
                    ord.step === 4 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                      : ord.step === 5
                      ? 'bg-red-50 text-red-800 border-red-300'
                      : ord.step === 1
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{ord.statusText || 'در حال دوخت'}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-bold text-[#7E7667]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#B38F24]" />
                    {ord.date}
                  </span>
                  <span>•</span>
                  <span className="px-3 py-1 rounded-xl bg-[#D4AF37]/20 text-[#B38F24] font-mono font-black text-xs border border-[#D4AF37]/30">
                    #{ord.id}
                  </span>
                </div>
              </div>

              {/* بخش میانی: تصویر پارچه در راست + مشخصات مشتری، خیاط و تگ‌ها در چپ */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* تصویر مستطیلی پارچه/لباس با کادر زرین */}
                <div className="w-full sm:w-40 h-36 rounded-3xl bg-gradient-to-br from-[#1C150F] via-[#2A1F16] to-[#0A0705] p-1 border-2 border-[#D4AF37] shadow-md flex items-center justify-center shrink-0 overflow-hidden relative">
                  <div className="w-full h-full rounded-2xl flex flex-col items-center justify-center text-5xl relative overflow-hidden bg-cover bg-center">
                    <span>✨👗</span>
                  </div>
                </div>

                {/* مشخصات مشتری، خیاط، طرح و تگ‌ها */}
                <div className="flex-1 text-right space-y-2.5 w-full">
                  
                  {/* نام مشتری */}
                  <div className="flex items-center justify-end gap-2 text-xs font-black text-[#23201C]">
                    <span className="font-mono text-[#7E7667] text-[11px]">({ord.customerPhone})</span>
                    <span>{ord.customerName}</span>
                    <span className="text-amber-500">👑</span>
                    <User className="w-4 h-4 text-[#0E8388]" />
                  </div>

                  {/* نام کارگاه خیاطی */}
                  <div className="flex items-center justify-end gap-1.5 text-xs font-black text-[#23201C]">
                    <span>خیاط: {ord.tailorName}</span>
                    <Store className="w-4 h-4 text-[#B38F24]" />
                  </div>

                  {/* مدل لباس */}
                  <div className="flex items-center justify-end gap-1.5 text-xs font-black text-[#0E8388]">
                    <span>مدل: {ord.designTitle}</span>
                    <Shirt className="w-4 h-4" />
                  </div>

                  {/* تگ‌های شخصی‌سازی ۳گانه (رنگ، جنس، نخ) */}
                  <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
                    <span className="px-2.5 py-1 rounded-xl bg-[#FAF6ED] border border-[#EADFC7] text-[10px] font-black text-[#524B40]">
                      نخ: {ord.selectedThread || 'طلایی اصیل'}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-[#FAF6ED] border border-[#EADFC7] text-[10px] font-black text-[#524B40]">
                      جنس: {ord.selectedMaterial || 'کرپ حریر'}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-[#FAF6ED] border border-[#EADFC7] text-[10px] font-black text-[#524B40]">
                      رنگ: {ord.selectedColor || 'مشکی فاخر'}
                    </span>
                  </div>

                </div>

              </div>

              {/* بخش مبالغ مالی شفاف */}
              <div className="bg-[#FAF6ED] p-3 rounded-2xl border border-[#EADFC7] grid grid-cols-2 gap-2 text-center text-xs font-black">
                <div className="text-right pr-2">
                  <span className="text-[10px] text-[#7E7667] font-bold block">بیعانه امانی (۳۰٪ در ضمانت):</span>
                  <span className="text-sm font-black text-emerald-700 block mt-0.5">
                    {(ord.depositAmount || 0).toLocaleString('fa-IR')} تومان
                  </span>
                </div>
                <div className="text-left pl-2 border-r border-[#EADFC7]">
                  <span className="text-[10px] text-[#7E7667] font-bold block">جمع کل مبلغ سفارش:</span>
                  <span className="text-sm font-black text-[#23201C] block mt-0.5">
                    {(ord.amount || 0).toLocaleString('fa-IR')} تومان
                  </span>
                </div>
              </div>

              {/* تایم‌لاین متصل ۴ مرحله‌ای */}
              <div className="bg-white/90 p-3.5 rounded-2xl border border-[#EADFC7]">
                <div className="relative flex items-center justify-between px-4">
                  <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[2px] bg-[#EADFC7] z-0"></div>
                  
                  {[
                    { step: 1, label: 'ثبت' },
                    { step: 2, label: 'تأیید' },
                    { step: 3, label: 'گلابتون‌دوزی' },
                    { step: 4, label: 'تحویل' },
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

              {/* ردیف پایین: کد تحویل محرمانه + دکمه مشاهده اندازه‌ها + دکمه مدیریت سفارش */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 items-center">
                
                {/* باکس کد تحویل */}
                <div className="p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-center space-y-0.5">
                  <span className="text-[9px] font-bold text-amber-800 block">کد تحویل محرمانه:</span>
                  <span className="font-mono font-black text-sm tracking-widest text-[#B38F24] block">
                    {ord.deliveryCode || '۸۴۲۹'}
                  </span>
                </div>

                {/* دکمه مشاهده اندازه‌ها */}
                <button
                  type="button"
                  onClick={() => setSelectedOrderMeasurements(ord)}
                  className="py-3 px-3 rounded-2xl bg-white border border-[#EADFC7] text-[#23201C] text-xs font-black flex items-center justify-center gap-1.5 shadow-sm active:scale-95 hover:bg-[#FAF6ED] transition-all"
                >
                  <Ruler className="w-4 h-4 text-[#B38F24]" />
                  <span>مشاهده اندازه‌ها</span>
                </button>

                {/* دکمه مدیریت سفارش (سبز زمردی) */}
                <button
                  type="button"
                  onClick={() => setSelectedOrderForManage(ord)}
                  className="py-3 px-3 rounded-2xl bg-gradient-to-r from-[#0E352B] to-[#041914] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-[#0E352B]/30 active:scale-95 transition-all border border-white/20"
                >
                  <Settings className="w-4 h-4 text-[#D4AF37]" />
                  <span>مدیریت سفارش</span>
                </button>

              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="khaliji-card-glass rounded-[2.5rem] p-12 border-2 border-dashed border-[#D4AF37]/60 text-center space-y-3">
          <span className="text-4xl">📦</span>
          <h3 className="text-sm font-black text-[#23201C]">سفارشی با این مشخصات یافت نشد</h3>
          <p className="text-xs text-[#7E7667]">می‌توانید فیلترها را تغییر دهید یا عبارت جستجو را پاک کنید.</p>
        </div>
      )}

      {/* =========================================================================
          ۳. مودال مدیریت و تغییر وضعیت سفارش توسط ادمین
          ========================================================================= */}
      {selectedOrderForManage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-5 border border-[#EADFC7] shadow-2xl space-y-4 text-right">
            
            <div className="flex items-center justify-between border-b border-[#F8F5EE] pb-2">
              <span className="text-xs font-black text-[#23201C]">مدیریت سفارش #{selectedOrderForManage.id}</span>
              <button onClick={() => setSelectedOrderForManage(null)} className="text-xs text-[#7E7667]">✕</button>
            </div>

            <div className="bg-[#FAF6ED] p-3 rounded-2xl text-[11px] space-y-1 font-bold">
              <div className="flex justify-between"><span>مشتری:</span><span>{selectedOrderForManage.customerName}</span></div>
              <div className="flex justify-between"><span>خیاط:</span><span>{selectedOrderForManage.tailorName}</span></div>
              <div className="flex justify-between"><span>مبلغ کل:</span><span className="font-black text-[#23201C]">{selectedOrderForManage.amount?.toLocaleString('fa-IR')} تومان</span></div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#7E7667] block">تغییر مرحله یا وضعیت سفارش:</label>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateStep(selectedOrderForManage.id, 2)}
                  className="py-2.5 px-2 rounded-xl bg-[#FAF6ED] text-[#23201C] text-[10px] font-black border border-[#EADFC7] hover:bg-[#D4AF37]/20 active:scale-95"
                >
                  ۲. تایید خیاط
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateStep(selectedOrderForManage.id, 3)}
                  className="py-2.5 px-2 rounded-xl bg-[#FAF6ED] text-[#23201C] text-[10px] font-black border border-[#EADFC7] hover:bg-[#D4AF37]/20 active:scale-95"
                >
                  ۳. در حال دوخت
                </button>
              </div>

              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleUpdateStep(selectedOrderForManage.id, 4)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-md active:scale-95"
              >
                ✓ ۴. تایید تحویل نهایی و تسویه حساب
              </button>

              <button
                type="button"
                disabled={isUpdating}
                             onClick={async () => {
               const ok = await confirmAction({
                 title: 'لغو سفارش',
                 message: 'آیا از لغو این سفارش و بازگشت بیعانه به مشتری اطمینان دارید؟',
                 confirmLabel: 'بله، لغو شود',
                 danger: true
               });
               if (ok) {
                 handleUpdateStep(selectedOrderForManage.id, 5);
               }
             }}
                className="w-full py-2 rounded-xl bg-red-50 text-red-600 text-xs font-black border border-red-200 hover:bg-red-100 active:scale-95"
              >
                ✕ لغو سفارش و عودت بیعانه
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          ۴. مودال مشاهده کامل اندازه‌های متصل به سفارش
          ========================================================================= */}
      {selectedOrderMeasurements && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#F8F5EE] w-full max-w-sm rounded-[2rem] p-5 border border-[#EADFC7] shadow-2xl space-y-4 text-right">
            
            <div className="flex items-center justify-between border-b border-[#EADFC7] pb-2">
              <span className="text-xs font-black text-[#23201C]">
                اندازه‌های سفارش #{selectedOrderMeasurements.id}
              </span>
              <button onClick={() => setSelectedOrderMeasurements(null)} className="text-xs text-[#7E7667]">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-black">
              <div className="bg-white p-3 rounded-2xl border border-[#EADFC7] text-right space-y-0.5">
                <span className="text-[10px] text-[#7E7667] block">دور دمپا (مچ پا):</span>
                <span className="text-sm font-black text-[#C85A32]">
                  {selectedOrderMeasurements.measurements?.ankleCuff || '۲۲'} سانتی‌متر
                </span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-[#EADFC7] text-right space-y-0.5">
                <span className="text-[10px] text-[#7E7667] block">قد دمپای دوزی:</span>
                <span className="text-sm font-black text-[#C85A32]">
                  {selectedOrderMeasurements.measurements?.cuffHeight || '۱۸'} سانتی‌متر
                </span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-[#EADFC7] text-right space-y-0.5">
                <span className="text-[10px] text-[#7E7667] block">قد کل شلوار:</span>
                <span className="text-sm font-black text-[#23201C]">
                  {selectedOrderMeasurements.measurements?.pantLength || '۹۵'} سانتی‌متر
                </span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-[#EADFC7] text-right space-y-0.5">
                <span className="text-[10px] text-[#7E7667] block">قد پیراهن کندوره:</span>
                <span className="text-sm font-black text-[#23201C]">
                  {selectedOrderMeasurements.measurements?.dressLength || '۱۱۵'} سانتی‌متر
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrderMeasurements(null)}
              className="w-full py-2.5 rounded-xl bg-[#0E352B] text-white font-black text-xs shadow-md"
            >
              بستن
            </button>
          </div>
        </div>
      )}

    </div>
  );
};