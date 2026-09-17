// src/components/admin/tabs/AdminTransactionsTab.jsx
import React, { useState, useEffect } from 'react';
import { 
  Search, TrendingUp, Landmark, Crown, ArrowLeft, ArrowRight,
  Copy, Check, FileText, Download, Calendar, Bell, Eye, X, CheckCircle2
} from 'lucide-react';
import { adminApi } from '../../../api/api';
import { Skeleton, AnimatedNumber } from '../../common/UiKit';
import { useToast } from '../../common/ToastSystem';
export const AdminTransactionsTab = ({ onSelectOrderDetails }) => {
const { toast } = useToast();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalInflow: 0,
    inflowCount: 0,
    totalPayouts: 0,
    payoutCount: 0,
    totalCommission: 0,
  });
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // مودال رسید دیجیتال تراکنش
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getTransactions();
      if (res.success) {
        setTransactions(res.transactions || []);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // فیلترهای ۴گانه نوع تراکنش دقیقاً مطابق موکاپ
  const filterTabs = [
    { id: 'all', label: 'همه تراکنش‌ها', count: transactions.length },
    { id: 'customer_deposit', label: 'واریز بیعانه مشتری', count: transactions.filter(t => t.type === 'customer_deposit').length, dotColor: 'bg-emerald-500' },
    { id: 'tailor_payout', label: 'تسویه به خیاط', count: transactions.filter(t => t.type === 'tailor_payout').length, dotColor: 'bg-amber-500' },
    { id: 'refund', label: 'استرداد وجه', count: transactions.filter(t => t.type === 'refund').length, dotColor: 'bg-red-500' },
  ];

  // فیلتر بر اساس تب و متن جستجو
  const filteredTransactions = transactions.filter((t) => {
    let matchesTab = true;
    if (selectedFilter !== 'all') matchesTab = t.type === selectedFilter;

    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      matchesSearch = 
        t.id?.toLowerCase().includes(q) ||
        t.orderId?.toLowerCase().includes(q) ||
        t.title?.toLowerCase().includes(q) ||
        t.fromParty?.toLowerCase().includes(q) ||
        t.toParty?.toLowerCase().includes(q) ||
        t.referenceNum?.includes(q);
    }

    return matchesTab && matchesSearch;
  });

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-5 text-right select-none">
      
      {/* =========================================================================
          ۱. هدر و کارت‌های ۳گانه شاخص مالی (دقیقاً مطابق با تصویر موکاپ)
          ========================================================================= */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <button 
                     onClick={() => toast.info('گزارش جامع اکسل و خروجی حسابداری به زودی در دسترس قرار می‌گیرد.')}
            className="w-10 h-10 rounded-2xl bg-white border border-[#EADFC7] shadow-sm flex items-center justify-center text-[#B38F24] active:scale-95"
            title="دانلود خروجی حسابداری"
          >
            <Download className="w-4 h-4" />
          </button>
          <button 
            onClick={fetchTransactions}
            className="w-10 h-10 rounded-2xl bg-white border border-[#EADFC7] shadow-sm flex items-center justify-center text-[#B38F24] active:scale-95"
            title="به‌روزرسانی"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>

        <div className="text-right">
          <h2 className="text-base font-black text-[#23201C]">تراکنش‌ها و دفتر کل مالی</h2>
          <p className="text-[10px] text-[#7E7667] font-bold">گزارش لحظه‌ای تمام ورودی‌ها، خروجی‌ها و کارمزد پلتفرم</p>
        </div>
      </div>

      {/* سه کارت خلاصه شاخص‌های حسابداری */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        
        {/* کارت ۱: درآمد کارمزد کَندوره (کارت سبز تیره زمردی) */}
        <div className="rounded-[2.2rem] p-4 sm:p-5 bg-gradient-to-br from-[#0E352B] via-[#092820] to-[#041914] text-white border-2 border-[#D4AF37]/60 shadow-xl flex items-center justify-between">
          <div className="space-y-1 text-right">
            <span className="text-[10px] font-black text-[#FBF5B7] block">درآمد کارمزد کَندوره</span>
                     <span className="text-lg sm:text-xl font-black text-[#FCF6BA] block tracking-tight">
           <AnimatedNumber value={stats.totalCommission || 0} />
         </span>
            <span className="text-[9px] text-white/80 font-bold block">
              تومان (سهم پلتفرم)
            </span>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-[#D4AF37]/40 flex items-center justify-center text-3xl shadow-inner shrink-0">
            👑
          </div>
        </div>

        {/* کارت ۲: کل تسویه به خیاطان (کارت گاوصندوق زرین) */}
        <div className="khaliji-card-glass rounded-[2.2rem] p-4 sm:p-5 border-2 border-[#EADFC7] shadow-xl flex items-center justify-between">
          <div className="space-y-1 text-right">
            <span className="text-[10px] font-black text-[#23201C] block">کل تسویه به خیاطان</span>
                     <span className="text-lg sm:text-xl font-black text-[#23201C] block tracking-tight">
           <AnimatedNumber value={stats.totalPayouts || 0} />
         </span>
            <span className="text-[9px] text-[#7E7667] font-bold block">
              تومان ({stats.payoutCount || 0} تراکنش واریزی)
            </span>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-[#FAF6ED] border border-[#D4AF37]/40 flex items-center justify-center text-3xl shadow-inner shrink-0">
            🏦
          </div>
        </div>

        {/* کارت ۳: کل ورودی بیعانه‌ها (شاخص صعودی سبز) */}
        <div className="khaliji-card-glass rounded-[2.2rem] p-4 sm:p-5 border-2 border-[#EADFC7] shadow-xl flex items-center justify-between">
          <div className="space-y-1 text-right">
            <span className="text-[10px] font-black text-emerald-800 block">کل ورودی بیعانه‌ها</span>
                     <span className="text-lg sm:text-xl font-black text-emerald-700 block tracking-tight">
           <AnimatedNumber value={stats.totalInflow || 0} />
         </span>
            <span className="text-[9px] text-[#7E7667] font-bold block">
              تومان ({stats.inflowCount || 0} تراکنش بیعانه)
            </span>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-3xl shadow-inner shrink-0 text-emerald-700">
            <TrendingUp className="w-7 h-7" />
          </div>
        </div>

      </div>

      {/* =========================================================================
          ۲. نوار جستجو و فیلترهای ۴گانه
          ========================================================================= */}
      <div className="khaliji-card-glass rounded-[2.2rem] p-4 border-2 border-[#EADFC7] shadow-xl space-y-3.5">
        
        {/* نوار جستجو */}
        <div className="flex items-center bg-white/90 rounded-2xl border-2 border-[#EADFC7] focus-within:border-[#D4AF37] shadow-inner px-3.5 py-2">
          <Search className="w-4 h-4 text-[#B38F24] shrink-0 ml-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو با شناسه تراکنش، کد سفارش، شماره پیگیری..."
            className="w-full bg-transparent text-xs font-black text-[#23201C] placeholder:text-[#7E7667]/50 focus:outline-none text-right"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-xs text-[#7E7667] mr-1">✕</button>
          )}
        </div>

        {/* فیلترهای نوع تراکنش */}
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
          ۳. لیست کارت‌های تراکنش (دقیقاً مطابق با تصویر موکاپ)
          ========================================================================= */}
         {loading ? (
     <div className="space-y-4">
       {[...Array(3)].map((_, i) => (
         <div key={i} className="khaliji-card-glass rounded-[2.5rem] p-5 border-2 border-[#EADFC7] shadow-xl space-y-4">
           <div className="flex items-center justify-between">
             <Skeleton className="w-24 h-6 !rounded-full" />
             <Skeleton className="w-32 h-5 !rounded-full" />
           </div>
           <Skeleton className="w-full h-5" />
           <Skeleton className="w-full h-16 !rounded-2xl" />
           <div className="grid grid-cols-2 gap-2.5">
             <Skeleton className="w-full h-11 !rounded-2xl" />
             <Skeleton className="w-full h-11 !rounded-2xl" />
           </div>
         </div>
       ))}
     </div>
   ) : filteredTransactions.length > 0 ? (
        <div className="space-y-4">
          {filteredTransactions.map((tx) => (
            <div 
              key={tx.id}
              className="khaliji-card-glass rounded-[2.5rem] p-5 sm:p-6 border-2 border-[#EADFC7] shadow-xl space-y-4 hover:border-[#D4AF37] transition-all bg-gradient-to-b from-[#FCFAF6] to-[#F8F5EE]"
            >
              
              {/* هدر کارت: کد تراکنش، تاریخ و بج وضعیت موفق */}
              <div className="flex items-center justify-between border-b border-[#EADFC7] pb-3">
                <span className="px-3 py-1 rounded-full text-[10px] font-black border bg-emerald-50 text-emerald-800 border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{tx.status}</span>
                </span>

                <div className="flex items-center gap-2 text-[11px] font-bold text-[#7E7667]">
                  <span>{tx.date}</span>
                  <span>•</span>
                  <span className="px-3 py-1 rounded-xl bg-amber-100/60 text-amber-900 font-mono font-black text-xs border border-amber-200">
                    #{tx.id}
                  </span>
                </div>
              </div>

              {/* ردیف میانی: مبلغ و شرح تراکنش */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-right">
                <p className="text-xs font-black text-[#23201C] leading-relaxed flex-1">
                  {tx.title}
                </p>

                <div className="flex items-baseline gap-1 self-end sm:self-center">
                  <span className={`text-xl font-black tracking-tight ${
                    tx.isCredit ? 'text-emerald-700' : 'text-[#C85A32]'
                  }`}>
                    {tx.isCredit ? '+ ' : '- '}{tx.amount.toLocaleString('fa-IR')}
                  </span>
                  <span className="text-xs font-black text-[#7E7667]">تومان</span>
                </div>
              </div>

              {/* باکس طرفین انتقال وجه با فلش */}
              <div className="bg-[#FAF6ED] p-3.5 rounded-2xl border border-[#EADFC7] flex items-center justify-between text-center text-xs font-black">
                
                {/* مبدأ */}
                <div className="flex-1 space-y-0.5 text-right pr-2">
                  <span className="text-[9px] text-[#7E7667] font-bold block">مبدأ انتقال:</span>
                  <span className="text-xs text-[#23201C] block">{tx.fromParty}</span>
                </div>

                {/* فلش انتقال */}
                <div className="w-8 h-8 rounded-full bg-white border border-[#EADFC7] flex items-center justify-center text-[#B38F24] shadow-sm shrink-0">
                  <ArrowLeft className="w-4 h-4" />
                </div>

                {/* مقصد */}
                <div className="flex-1 space-y-0.5 text-left pl-2">
                  <span className="text-[9px] text-[#7E7667] font-bold block">مقصد انتقال:</span>
                  <span className="text-xs text-[#23201C] block">{tx.toParty}</span>
                </div>

              </div>

              {/* شماره ارجاع بانکی با دکمه کپی */}
              <div className="flex items-center justify-between text-[11px] font-bold text-[#7E7667] px-1">
                <button
                  type="button"
                  onClick={() => handleCopy(tx.referenceNum, tx.id)}
                  className="flex items-center gap-1 text-[#B38F24] hover:text-[#23201C] active:scale-90"
                >
                  {copiedId === tx.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="font-mono text-xs">{tx.referenceNum}</span>
                </button>
                <span>شماره ارجاع شاپرک / سند بانکی:</span>
              </div>

              {/* دکمه‌های اقدام پایین کارت: مشاهده جزییات سفارش + رسید دیجیتال */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedTxForReceipt(tx)}
                  className="py-3 px-3 rounded-2xl bg-white border border-[#EADFC7] text-[#23201C] text-xs font-black flex items-center justify-center gap-1.5 shadow-sm active:scale-95 hover:bg-[#FAF6ED] transition-all"
                >
                  <FileText className="w-4 h-4 text-[#B38F24]" />
                  <span>رسید دیجیتال</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectOrderDetails && onSelectOrderDetails(tx.orderId)}
                  className="py-3 px-3 rounded-2xl bg-gradient-to-r from-[#0E352B] to-[#041914] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-[#0E352B]/30 active:scale-95 transition-all border border-white/20"
                >
                  <Eye className="w-4 h-4 text-[#D4AF37]" />
                  <span>مشاهده جزئیات سفارش</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="khaliji-card-glass rounded-[2.5rem] p-12 border-2 border-dashed border-[#D4AF37]/60 text-center space-y-3">
          <span className="text-4xl">🧾</span>
          <h3 className="text-sm font-black text-[#23201C]">تراکنشی در این دسته‌بندی یافت نشد</h3>
          <p className="text-xs text-[#7E7667]">می‌توانید عبارت جستجو را تغییر دهید.</p>
        </div>
      )}

      {/* =========================================================================
          ۴. مودال رسید دیجیتال رسمی تراکنش
          ========================================================================= */}
      {selectedTxForReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 border-2 border-[#D4AF37] shadow-2xl space-y-4 text-right">
            
            <div className="text-center space-y-1 pb-3 border-b border-[#F8F5EE]">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 text-2xl">
                ✓
              </div>
              <h3 className="text-sm font-black text-[#23201C]">رسید دیجیتال تراکنش مالی</h3>
              <p className="text-[10px] font-mono text-[#7E7667]">#{selectedTxForReceipt.id}</p>
            </div>

            <div className="bg-[#FAF6ED] p-4 rounded-2xl space-y-2 text-xs font-bold text-[#524B40]">
              <div className="flex justify-between"><span>مبلغ تراکنش:</span><span className="text-sm font-black text-[#23201C]">{selectedTxForReceipt.amount.toLocaleString('fa-IR')} تومان</span></div>
              <div className="flex justify-between"><span>وضعیت سند:</span><span className="text-emerald-700 font-black">موفق و تایید شده ✓</span></div>
              <div className="flex justify-between"><span>مبدأ:</span><span>{selectedTxForReceipt.fromParty}</span></div>
              <div className="flex justify-between"><span>مقصد:</span><span>{selectedTxForReceipt.toParty}</span></div>
              <div className="flex justify-between"><span>شماره ارجاع:</span><span className="font-mono">{selectedTxForReceipt.referenceNum}</span></div>
              <div className="flex justify-between"><span>تاریخ و ساعت:</span><span>{selectedTxForReceipt.date}</span></div>
            </div>

            <button
              onClick={() => setSelectedTxForReceipt(null)}
              className="w-full py-3 rounded-2xl bg-[#0E352B] text-white font-black text-xs shadow-md"
            >
              بستن رسید
            </button>
          </div>
        </div>
      )}

    </div>
  );
};