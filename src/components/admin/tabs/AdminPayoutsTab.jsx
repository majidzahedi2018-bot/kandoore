// src/components/admin/tabs/AdminPayoutsTab.jsx
import React, { useState } from 'react';
import { 
  Search, ShieldCheck, Hourglass, Landmark, Copy, Check, 
  X, KeyRound, Phone, MapPin, Store, RotateCcw, AlertCircle
} from 'lucide-react';
import { adminApi } from '../../../api/api';
import { AnimatedNumber } from '../../common/UiKit';
import { useToast } from '../../common/ToastSystem';
export const AdminPayoutsTab = ({ payouts = [], stats = {}, onRefresh }) => {
const { toast } = useToast();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // مودال تایید واریز با کد پیگیری
  const [selectedPayoutForApprove, setSelectedPayoutForApprove] = useState(null);
  const [trackingCode, setTrackingCode] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // مودال رد درخواست
  const [selectedPayoutForReject, setSelectedPayoutForReject] = useState(null);

  // تب‌های ۴گانه فیلتر وضعیت
  const filterTabs = [
    { id: 'all', label: 'همه درخواست‌ها', count: payouts.length },
    { id: 'pending', label: 'در انتظار واریز', count: payouts.filter(p => p.status === 'pending').length, dotColor: 'bg-amber-500' },
    { id: 'approved', label: 'تسویه‌شده', count: payouts.filter(p => p.status === 'approved').length, dotColor: 'bg-emerald-500' },
    { id: 'rejected', label: 'رد شده', count: payouts.filter(p => p.status === 'rejected').length, dotColor: 'bg-red-500' },
  ];

  // فیلتر درخواست‌ها بر اساس تب و متن جستجو
  // محاسبه واقعی مجموع در انتظار واریز و تسویه‌شده از لیست زنده درخواست‌ها
const totalPendingAmount = payouts.filter(p => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0);
const totalPaidAmount = payouts.filter(p => p.status === 'approved').reduce((s, p) => s + (p.amount || 0), 0);
const filteredPayouts = payouts.filter((p) => {
    let matchesTab = true;
    if (selectedFilter === 'pending') matchesTab = p.status === 'pending';
    else if (selectedFilter === 'approved') matchesTab = p.status === 'approved';
    else if (selectedFilter === 'rejected') matchesTab = p.status === 'rejected';

    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      matchesSearch = 
        String(p.id).includes(q) ||
        p.tailorName?.toLowerCase().includes(q) ||
        p.shabaNumber?.toLowerCase().includes(q) ||
        p.trackingCode?.toLowerCase().includes(q);
    }

    return matchesTab && matchesSearch;
  });

  // کپی شماره شبا در کلیپ‌بورد
  const handleCopyShaba = (shaba, id) => {
    navigator.clipboard.writeText(shaba);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // تایید نهایی تسویه با کد پیگیری
  const handleApprove = async (e) => {
    e?.preventDefault();
    if (!selectedPayoutForApprove) return;

    setIsUpdating(true);
    try {
      const res = await adminApi.updatePayoutStatus(
        selectedPayoutForApprove.id, 
        'approved', 
        trackingCode.trim() || 'PAYA-' + Math.floor(10000000 + Math.random() * 90000000)
      );
      setIsUpdating(false);

         if (res.success) {
     if (onRefresh) onRefresh();
     setSelectedPayoutForApprove(null);
     setTrackingCode('');
     toast.success('تسویه‌حساب با موفقیت تایید و ثبت گردید.');
   } else {
     toast.error(res.message || 'خطا در تایید تسویه');
   }
 } catch (e) {
   setIsUpdating(false);
   toast.error('خطا در ارتباط با سرور');
 }
  };

  // رد درخواست تسویه
  const handleReject = async () => {
    if (!selectedPayoutForReject) return;
    setIsUpdating(true);
    try {
      const res = await adminApi.updatePayoutStatus(selectedPayoutForReject.id, 'rejected', 'عدم تطابق شبا');
      setIsUpdating(false);
      if (res.success) {
if (onRefresh) onRefresh();
setSelectedPayoutForReject(null);
toast.success('درخواست تسویه با موفقیت رد شد.');
}
} catch (e) {
setIsUpdating(false);
toast.error('خطا در ارتباط با سرور');
}
  };

  return (
    <div className="space-y-5 text-right select-none">
      
      {/* =========================================================================
          ۱. سه کارت شاخص مالی بالای صفحه (دقیقاً مطابق با تصویر موکاپ)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        
        {/* کارت ۱: موجودی امانی در ضمانت (سبز زمردی تیره) */}
        <div className="rounded-[2.2rem] p-4 sm:p-5 bg-gradient-to-br from-[#0E352B] via-[#092820] to-[#041914] text-white border-2 border-[#D4AF37]/60 shadow-xl flex items-center justify-between">
          <div className="space-y-1 text-right">
            <span className="text-[10px] font-black text-[#FBF5B7] block">موجودی امانی در ضمانت</span>
                     <span className="text-lg sm:text-xl font-black text-[#FCF6BA] block tracking-tight">
           <AnimatedNumber value={stats.totalEscrow || 0} />
         </span>
            <span className="text-[9px] text-white/80 font-bold block">
              تومان ({stats.escrowCount || 0} سفارش در ضمانت)
            </span>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-[#D4AF37]/40 flex items-center justify-center text-3xl shadow-inner shrink-0">
            🛡️
          </div>
        </div>

        {/* کارت ۲: در انتظار واریز بانکی (ساعت شنی متالیک) */}
        <div className="khaliji-card-glass rounded-[2.2rem] p-4 sm:p-5 border-2 border-[#EADFC7] shadow-xl flex items-center justify-between">
          <div className="space-y-1 text-right">
            <span className="text-[10px] font-black text-amber-800 block">در انتظار واریز بانکی</span>
                     <span className="text-lg sm:text-xl font-black text-amber-700 block tracking-tight">
           <AnimatedNumber value={totalPendingAmount} />
         </span>
            <span className="text-[9px] text-[#7E7667] font-bold block">
              تومان ({stats.pendingCount || 0} درخواست)
            </span>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl shadow-inner shrink-0">
            ⏳
          </div>
        </div>

        {/* کارت ۳: تسویه‌شده کل (گاوصندوق زرین) */}
        <div className="khaliji-card-glass rounded-[2.2rem] p-4 sm:p-5 border-2 border-[#EADFC7] shadow-xl flex items-center justify-between">
          <div className="space-y-1 text-right">
                     <span className="text-lg sm:text-xl font-black text-[#23201C] block tracking-tight">
           <AnimatedNumber value={totalPaidAmount} />
         </span>
            <span className="text-[9px] text-[#7E7667] font-bold block">
              تومان ({stats.paidCount || 0} تراکنش موفق)
            </span>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-[#FAF6ED] border border-[#D4AF37]/40 flex items-center justify-center text-3xl shadow-inner shrink-0">
            🏦
          </div>
        </div>

      </div>

      {/* =========================================================================
          ۲. نوار جستجو و فیلترهای وضعیت
          ========================================================================= */}
      <div className="khaliji-card-glass rounded-[2.2rem] p-4 border-2 border-[#EADFC7] shadow-xl space-y-3.5">
        
        {/* نوار جستجو */}
        <div className="flex items-center bg-white/90 rounded-2xl border-2 border-[#EADFC7] focus-within:border-[#D4AF37] shadow-inner px-3.5 py-2">
          <Search className="w-4 h-4 text-[#B38F24] shrink-0 ml-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو با شماره شبا، نام خیاط، کد پیگیری..."
            className="w-full bg-transparent text-xs font-black text-[#23201C] placeholder:text-[#7E7667]/50 focus:outline-none text-right"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-xs text-[#7E7667] mr-1">✕</button>
          )}
        </div>

        {/* تب‌های ۴گانه وضعیت */}
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
          ۳. لیست کارت‌های درخواست تسویه خیاطان (دقیقاً مطابق با تصویر موکاپ)
          ========================================================================= */}
      {filteredPayouts.length > 0 ? (
        <div className="space-y-4">
          {filteredPayouts.map((p) => (
            <div 
              key={p.id}
              className="khaliji-card-glass rounded-[2.5rem] p-5 sm:p-6 border-2 border-[#EADFC7] shadow-xl space-y-4 hover:border-[#D4AF37] transition-all bg-gradient-to-b from-[#FCFAF6] to-[#F8F5EE]"
            >
              
              {/* هدر کارت: کد درخواست، تاریخ و بج وضعیت */}
              <div className="flex items-center justify-between border-b border-[#EADFC7] pb-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                  p.status === 'approved'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : p.status === 'rejected'
                    ? 'bg-red-50 text-red-800 border-red-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  {p.status === 'approved' ? 'تسویه‌شده ✓' : p.status === 'rejected' ? 'رد شده ✕' : 'در انتظار پرداخت'}
                </span>

                <div className="flex items-center gap-2 text-[11px] font-bold text-[#7E7667]">
                  <span>{p.date}</span>
                  <span>•</span>
                  <span className="px-3 py-1 rounded-xl bg-amber-100/60 text-amber-900 font-mono font-black text-xs border border-amber-200">
                    #PAY-{p.id}
                  </span>
                </div>
              </div>

              {/* بخش میانی: مبلغ در راست + مشخصات خیاط و باکس شبا در چپ */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* باکس شماره شبا و نام بانک (با دکمه کپی فوری) */}
                <div className="w-full sm:w-80 bg-[#FAF6ED] p-3.5 rounded-2xl border border-[#EADFC7] flex items-center justify-between shadow-inner">
                  <button
                    type="button"
                    onClick={() => handleCopyShaba(p.shabaNumber, p.id)}
                    className="w-9 h-9 rounded-xl bg-white border border-[#EADFC7] flex items-center justify-center text-[#B38F24] shadow-sm active:scale-90 hover:bg-[#FAF6ED] transition-all shrink-0"
                    title="کپی شماره شبا"
                  >
                    {copiedId === p.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <div className="text-right space-y-0.5 pr-2 flex-1">
                    <span className="text-xs font-black text-[#23201C] block">{p.bankName}</span>
                    <span className="font-mono text-[11px] font-bold text-[#524B40] dir-ltr block text-right tracking-wider">
                      {p.shabaNumber}
                    </span>
                  </div>
                </div>

                {/* مبلغ درخواستی و مشخصات خیاط */}
                <div className="flex-1 text-right space-y-1.5 w-full">
                  <div className="flex items-baseline justify-end gap-1.5">
                    <span className="text-2xl font-black text-emerald-700 tracking-tight">
                      {p.amount.toLocaleString('fa-IR')}
                    </span>
                    <span className="text-xs font-black text-[#7E7667]">تومان</span>
                  </div>

                  <div className="space-y-0.5">
                    <h3 className="text-xs font-black text-[#23201C]">{p.tailorName}</h3>
                    <div className="flex items-center justify-end gap-2 text-[10px] text-[#7E7667] font-bold">
                      <span className="font-mono dir-ltr">{p.tailorPhone}</span>
                      <span>•</span>
                      <span>{p.tailorCity}</span>
                      <MapPin className="w-3 h-3 text-[#B38F24]" />
                    </div>
                  </div>
                </div>

              </div>

              {/* کد پیگیری در صورت پرداخت شدن */}
              {p.trackingCode && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between">
                  <span className="font-mono font-black">{p.trackingCode}</span>
                  <span>کد پیگیری بانکی:</span>
                </div>
              )}

              {/* ردیف دکمه‌های عملیاتی: ثبت واریز + رد درخواست + کپی شبا */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 items-center">
                
                {/* دکمه کپی شماره شبا */}
                <button
                  type="button"
                  onClick={() => handleCopyShaba(p.shabaNumber, p.id)}
                  className="py-3 px-3 rounded-2xl bg-white border border-[#EADFC7] text-[#23201C] text-xs font-black flex items-center justify-center gap-1.5 shadow-sm active:scale-95 hover:bg-[#FAF6ED] transition-all"
                >
                  <Copy className="w-4 h-4 text-[#B38F24]" />
                  <span>{copiedId === p.id ? 'شبا کپی شد ✓' : 'کپی شماره شبا'}</span>
                </button>

                {/* دکمه رد درخواست */}
                {p.status === 'pending' ? (
                  <button
                    type="button"
                    onClick={() => setSelectedPayoutForReject(p)}
                    className="py-3 px-3 rounded-2xl bg-red-50 text-red-600 text-xs font-black border border-red-200 flex items-center justify-center gap-1.5 active:scale-95 hover:bg-red-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                    <span>رد درخواست</span>
                  </button>
                ) : (
                  <div className="py-3 text-center text-[10px] text-[#7E7667] font-bold">
                    عملیات نهایی شده
                  </div>
                )}

                {/* دکمه ثبت واریز و کد پیگیری */}
                {p.status === 'pending' ? (
                  <button
                    type="button"
                    onClick={() => setSelectedPayoutForApprove(p)}
                    className="py-3 px-3 rounded-2xl bg-gradient-to-r from-[#0E352B] to-[#041914] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-[#0E352B]/30 active:scale-95 transition-all border border-white/20"
                  >
                    <KeyRound className="w-4 h-4 text-[#D4AF37]" />
                    <span>ثبت واریز و کد پیگیری</span>
                  </button>
                ) : (
                  <div className="py-3 px-3 rounded-2xl bg-emerald-100/70 text-emerald-800 text-xs font-black text-center border border-emerald-200">
                    واریز به حساب تایید شد ✓
                  </div>
                )}

              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="khaliji-card-glass rounded-[2.5rem] p-12 border-2 border-dashed border-[#D4AF37]/60 text-center space-y-3">
          <span className="text-4xl">💳</span>
          <h3 className="text-sm font-black text-[#23201C]">درخواست تسویه‌ای در این وضعیت وجود ندارد</h3>
          <p className="text-xs text-[#7E7667]">درخواست‌های جدید خیاطان بلافاصله در این بخش قرار می‌گیرد.</p>
        </div>
      )}

      {/* =========================================================================
          ۴. مودال ثبت کد پیگیری و واریز نهایی ساتنا/پایا
          ========================================================================= */}
      {selectedPayoutForApprove && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-5 border border-[#EADFC7] shadow-2xl space-y-4 text-right">
            
            <div className="flex items-center justify-between border-b border-[#F8F5EE] pb-2">
              <span className="text-xs font-black text-[#23201C]">تایید واریز تسویه #{selectedPayoutForApprove.id}</span>
              <button onClick={() => setSelectedPayoutForApprove(null)} className="text-xs text-[#7E7667]">✕</button>
            </div>

            <div className="bg-[#FAF6ED] p-3.5 rounded-2xl text-[11px] space-y-1.5 font-bold">
              <div className="flex justify-between"><span>خیاط:</span><span>{selectedPayoutForApprove.tailorName}</span></div>
              <div className="flex justify-between"><span>مبلغ واریزی:</span><span className="text-emerald-700 font-black">{selectedPayoutForApprove.amount.toLocaleString('fa-IR')} تومان</span></div>
              <div className="flex justify-between"><span>بانک:</span><span>{selectedPayoutForApprove.bankName}</span></div>
              <div className="flex justify-between"><span>شماره شبا:</span><span className="font-mono dir-ltr">{selectedPayoutForApprove.shabaNumber}</span></div>
            </div>

            <form onSubmit={handleApprove} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-[#7E7667] block mb-1">کد پیگیری بانکی (ساتنا / پایا):</label>
                <input
                  type="text"
                  placeholder="مثال: SATNA-84729103"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F5EE] border border-[#EADFC7] text-xs font-mono font-black text-[#23201C] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white font-black text-xs shadow-md active:scale-95 disabled:opacity-50"
              >
                {isUpdating ? 'در حال ثبت...' : 'تایید نهایی و انتقال به تسویه‌شده'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          ۵. مودال تایید رد درخواست تسویه
          ========================================================================= */}
      {selectedPayoutForReject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-5 border border-[#EADFC7] shadow-2xl space-y-4 text-center">
            
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-2xl">
              ⚠️
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-black text-[#23201C]">رد درخواست تسویه حساب؟</h3>
              <p className="text-[11px] text-[#7E7667] leading-relaxed">
                آیا از رد درخواست تسویه به مبلغ {selectedPayoutForReject.amount.toLocaleString('fa-IR')} تومان برای {selectedPayoutForReject.tailorName} اطمینان دارید؟
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPayoutForReject(null)}
                className="py-2.5 rounded-xl bg-[#FAF6ED] text-[#23201C] text-xs font-black border border-[#EADFC7]"
              >
                انصراف
              </button>

              <button
                type="button"
                disabled={isUpdating}
                onClick={handleReject}
                className="py-2.5 rounded-xl bg-red-600 text-white text-xs font-black shadow-md active:scale-95"
              >
                {isUpdating ? 'در حال رد...' : 'بله، رد شود'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};