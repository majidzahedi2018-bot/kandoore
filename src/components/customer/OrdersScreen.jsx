// src/components/customer/OrdersScreen.jsx
import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Check, Hourglass, FileText, MessageCircle, ShieldCheck, CreditCard, X } from 'lucide-react';
import { ordersApi, chatApi } from '../../api/api';
import { useToast } from '../common/ToastSystem';
export const OrdersScreen = ({ currentUser, onExploreClick, onOpenChat, onOpenReview }) => {
const { toast } = useToast();
const [activeSegment, setActiveSegment] = useState('active'); // 'active' | 'archive'
const [orders, setOrders] = useState([]);
const [loading, setLoading] = useState(true);
const [showInvoiceModal, setShowInvoiceModal] = useState(null);
// مودال پرداخت بیعانه (جریان جدید امن)
const [payingOrder, setPayingOrder] = useState(null);
const [isPayingDeposit, setIsPayingDeposit] = useState(false);
const [unreadCounts, setUnreadCounts] = useState({});

// دریافت تعداد پیام‌های نخوانده per سفارش هر ۱۵ ثانیه
useEffect(() => {
  if (!currentUser?.id) return;
  const load = async () => {
    try {
      const res = await chatApi.getUnreadCounts(currentUser.id);
      if (res.success && res.counts) setUnreadCounts(res.counts);
    } catch {}
  };
  load();
  const iv = setInterval(load, 15000);
  return () => clearInterval(iv);
}, [currentUser?.id]);

  const trackingSteps = [
{ id: 1, title: 'ثبت سفارش', status: 'completed', badge: 'تکمیل شد' },
{ id: 2, title: 'تأیید خیاط و پرداخت بیعانه', status: 'current', badge: 'در حال انجام' },
{ id: 3, title: 'دوخت و گلابتون‌دوزی', status: 'pending', badge: 'در انتظار' },
{ id: 4, title: 'کنترل کیفیت و آماده تحویل', status: 'pending', badge: 'در انتظار' },
{ id: 5, title: 'تحویل و تسویه با کد محرمانه', status: 'pending', badge: 'در انتظار' },
];
// پرداخت بیعانه (مرحله ۲ → ۳)
const handlePayDeposit = async () => {
if (!payingOrder || isPayingDeposit) return;
setIsPayingDeposit(true);
const res = await ordersApi.payDeposit(payingOrder.id, currentUser?.id || 1);
setIsPayingDeposit(false);
if (res.success) {
setOrders(prev => prev.map(o => o.id === payingOrder.id ? { ...o, step: 3, statusText: res.status_text || 'بیعانه دریافت شد — در حال دوخت' } : o));
toast.success('بیعانه پرداخت شد؛ سفارش شما وارد نوبت دوخت شد. 🧵');
setPayingOrder(null);
} else {
toast.error(res.message || 'خطا در پرداخت بیعانه');
}
};

// دریافت سفارش‌ها از دیتابیس MySQL — بی‌صدا؛ loading فقط در بار اول
  const fetchCustomerOrders = async (initial = false) => {
    if (!currentUser?.id) return;
    if (initial) setLoading(true);
    try {
      const res = await ordersApi.getOrders(currentUser.id, false);
      if (res.success && res.orders) {
        setOrders(res.orders);
      }
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      if (initial) setLoading(false);
    }
  };

  useEffect(() => {
  fetchCustomerOrders(true);
  }, [currentUser]);

// به‌روزرسانی خودکار وضعیت سفارش‌ها (مثلاً پس از تأیید خیاط) بی‌صدا: هر ۱۵ ثانیه + روی فوکوس/بازگشت به تب
useEffect(() => {
  if (!currentUser?.id) return;
  fetchCustomerOrders();
  const iv = setInterval(fetchCustomerOrders, 15000);
  const onFocus = () => fetchCustomerOrders();
  const onVisibility = () => {
    if (document.visibilityState === 'visible') fetchCustomerOrders();
  };
  window.addEventListener('focus', onFocus);
  document.addEventListener('visibilitychange', onVisibility);
  return () => {
    clearInterval(iv);
    window.removeEventListener('focus', onFocus);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}, [currentUser?.id]);

// وقتی پیام جدیدی خوانده می‌شود (پس از باز شدن چت)، بج را ریفرش کن
const refreshUnread = async () => {
  if (!currentUser?.id) return;
  try {
    const res = await chatApi.getUnreadCounts(currentUser.id);
    if (res.success && res.counts) setUnreadCounts(res.counts);
  } catch {}
};
// هر بار که این اسکرین فوکوس می‌شود، بج را به‌روز کن
useEffect(() => {
  const onFocus = () => refreshUnread();
  window.addEventListener('focus', onFocus);
  return () => window.removeEventListener('focus', onFocus);
}, [currentUser?.id]);

  const activeOrders = orders.filter(o => o.step < 5 && o.step !== 6);
const completedOrders = orders.filter(o => o.step >= 5);
const cancelledOrders = orders.filter(o => o.step === 6);

  return (
    <div className="pb-32 pt-2 px-4 max-w-md mx-auto select-none">
      
      {/* هدر */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-1.5 mb-0.5">
          <span className="text-[#D4AF37] text-sm">⚜️</span>
        </div>
        <h1 className="text-xl font-black text-[#23201C] tracking-tight">سفارش‌های من</h1>
      </div>

      {/* تب‌های جاری / آرشیو */}
      <div className="flex items-center justify-center p-1 rounded-2xl bg-[#EADFC7]/50 border border-[#EADFC7] mb-5">
        <button
          onClick={() => setActiveSegment('active')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
            activeSegment === 'active'
              ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38F24] text-white shadow-md shadow-[#D4AF37]/20 scale-[1.02]'
              : 'text-[#7E7667] hover:text-[#23201C]'
          }`}
        >
          جاری و در حال دوخت ({activeOrders.length})
        </button>
        <button
          onClick={() => setActiveSegment('archive')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
            activeSegment === 'archive'
              ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38F24] text-white shadow-md shadow-[#D4AF37]/20 scale-[1.02]'
              : 'text-[#7E7667] hover:text-[#23201C]'
          }`}
        >
          تحویل‌شده و آرشیو ({completedOrders.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs font-black text-[#7E7667]">در حال دریافت اطلاعات سفارش‌ها...</div>
      ) : activeSegment === 'active' ? (
        <div className="space-y-4">
          {activeOrders.length > 0 ? (
            activeOrders.map((order) => (
              <div key={order.id} className="khaliji-card-glass rounded-[2.5rem] p-4 border border-[#EADFC7] shadow-sm space-y-4">
                
                <div className="flex items-center justify-between border-b border-[#F8F5EE] pb-3">
                  <span className="px-3 py-1 rounded-full bg-[#D4AF37]/20 text-[#B38F24] text-[11px] font-black border border-[#D4AF37]/30 flex items-center gap-1">
                    <span>⏳</span>
                    <span>{order.statusText}</span>
                  </span>
                  <span className="text-xs font-black text-[#23201C]">کد سفارش: #{order.id}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1.5 text-right">
                    <h2 className="text-base font-black text-[#23201C]">{order.designTitle}</h2>
                    
                    <div className="flex items-center gap-1 text-[11px] text-[#7E7667] font-bold">
                      <MapPin className="w-3.5 h-3.5 text-[#B38F24]" />
                      <span>خیاط: {order.tailorName}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-[#0E8388] font-black">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>تاریخ ثبت: {order.date}</span>
                    </div>
                  </div>

                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#23201C] to-[#3D2D1E] flex items-center justify-center text-4xl border-2 border-[#D4AF37] shadow-md shrink-0 overflow-hidden">
                    {order.designImage && order.designImage.startsWith('http') ? (
                      <img src={order.designImage} alt={order.designTitle} className="w-full h-full object-cover" />
                    ) : (
                      '✨👗'
                    )}
                  </div>
                </div>

                {/* تایم‌لاین مراحل */}
                <div className="bg-[#F8F5EE]/80 rounded-3xl p-3.5 border border-[#EADFC7]/80 space-y-3 relative overflow-hidden">
                  <div className="absolute top-7 bottom-7 right-7 w-[2px] bg-[#EADFC7]"></div>

                  {trackingSteps.map((step) => {
                    const isCompleted = step.id < order.step;
                    const isCurrent = step.id === order.step;
                    const isPending = step.id > order.step;

                    return (
                      <div 
                        key={step.id}
                        className={`flex items-center justify-between p-2 rounded-2xl transition-all relative z-10 ${
                          isCurrent ? 'bg-white border-2 border-[#D4AF37] shadow-sm' : ''
                        }`}
                      >
                        <div className="text-[10px] font-black">
                          {isCompleted && <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">تکمیل شد</span>}
                          {isCurrent && (
                            <div className="w-7 h-7 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center text-[#B38F24]">
                              <Hourglass className="w-4 h-4 animate-spin" />
                            </div>
                          )}
                          {isPending && <span className="text-[#7E7667]/60">در انتظار</span>}
                        </div>

                        <span className={`text-xs font-black flex-1 pr-3 text-right ${
                          isCurrent ? 'text-[#23201C]' : isCompleted ? 'text-[#524B40]' : 'text-[#7E7667]/70'
                        }`}>
                          {step.title}
                        </span>

                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isCompleted ? 'bg-emerald-600 text-white' : isCurrent ? 'bg-[#D4AF37] text-white ring-4 ring-[#D4AF37]/20' : 'bg-[#EADFC7] text-[#7E7667]'
                          }`}>
                            {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            {isCurrent && <div className="w-2 h-2 rounded-full bg-white"></div>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                             {/* جریان جدید: بنر انتظار تایید خیاط در مرحله ۱ */}
             {order.step === 1 && (
               <div className="rounded-2xl p-3 bg-amber-50 border border-amber-200 text-[10px] font-black text-amber-800 flex items-center gap-2">
                 <Hourglass className="w-4 h-4 animate-spin" />
                 <span>سفارش شما در انتظار تایید خیاط است؛ پس از تایید، دکمه پرداخت بیعانه فعال می‌شود.</span>
               </div>
             )}
             {/* جریان جدید: دکمه پرداخت بیعانه در مرحله ۲ */}
             {order.step === 2 && (order.depositStatus === 'unpaid' || !order.depositStatus) && (
               <button
                 onClick={() => setPayingOrder(order)}
                 className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#0E8388] to-[#04474A] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-[#0E8388]/25 active:scale-95 transition-transform"
               >
                 <CreditCard className="w-4 h-4" />
                 <span>پرداخت بیعانه ۳۰٪ ({(order.depositAmount || 0).toLocaleString('fa-IR')} تومان)</span>
               </button>
             )}
             {/* دکمه‌های پیش‌فاکتور و چت */}
             <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => setShowInvoiceModal(order)}
                    className="khaliji-card-glass rounded-2xl py-3 px-2 flex items-center justify-center gap-1.5 text-xs font-black text-[#23201C] border border-[#EADFC7] active:scale-95 transition-transform"
                  >
                    <FileText className="w-4 h-4 text-[#B38F24]" />
                    <span>مشاهده پیش‌فاکتور امانی</span>
                  </button>

                  <button
  onClick={() => onOpenChat && onOpenChat(order)}
  className="khaliji-card-glass rounded-2xl py-3 px-2 flex items-center justify-center gap-1.5 text-xs font-black text-[#23201C] border border-[#EADFC7] active:scale-95 transition-transform relative"
>
  <div className="relative">
    <MessageCircle className="w-4 h-4 text-[#B38F24]" />
    {(unreadCounts[order.id] || 0) > 0 && (
      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white shadow-sm">
        {unreadCounts[order.id] > 9 ? '+۹' : unreadCounts[order.id].toLocaleString('fa-IR')}
      </span>
    )}
  </div>
  <span>گفت‌وگو با خیاط</span>
</button>
                </div>

                             {/* کارت کد تحویل محرمانه (فقط پس از پرداخت بیعانه) */}
             {order.step >= 3 && (
             <div className="rounded-3xl p-4 bg-gradient-to-br from-[#12382D] to-[#0A201A] text-white border-2 border-[#D4AF37]/50 shadow-xl flex items-center justify-between relative overflow-hidden">
                  <div className="space-y-1 text-right z-10 max-w-[70%]">
                    <div className="flex items-center gap-1.5 text-xs font-black text-[#FBF5B7]">
                      <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                      <span>کد تحویل محرمانه شما:</span>
                    </div>
                    <div className="text-2xl font-black font-mono tracking-widest text-[#FCF6BA] py-0.5">
                      {order.deliveryCode}
                    </div>
                    <p className="text-[10px] text-white/80 leading-relaxed font-medium">
                      پس از تحویل لباس و تأیید تطابق اندازه، این کد را به خیاط ارائه دهید.
                    </p>
                  </div>

                                 <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#AA771C] p-0.5 shadow-lg flex items-center justify-center">
                 <div className="w-full h-full bg-[#12382D] rounded-2xl flex items-center justify-center text-2xl">
                   🛡️
                 </div>
               </div>
             </div>
             )}
           </div>
         ))
          ) : (
            <div className="khaliji-card-glass rounded-[2.5rem] p-8 border border-[#EADFC7] text-center space-y-3">
              <div className="text-5xl">👗✨</div>
              <h3 className="text-xs font-black text-[#23201C]">هیچ سفارش در حال دوختی ندارید</h3>
              <p className="text-[10px] text-[#7E7667]">می‌توانید از کاتالوگ طرح‌ها، مدل دلخواه خود را سفارش دهید.</p>
              <button
                onClick={onExploreClick}
                className="py-2.5 px-6 rounded-2xl bg-[#D4AF37] text-white font-black text-xs shadow-md"
              >
                مشاهده طرح‌ها و ثبت سفارش
              </button>
            </div>
          )}
        </div>
      ) : (
        /* تب تحویل‌شده */
        <div className="space-y-3">
          {completedOrders.length > 0 ? (
            completedOrders.map((item) => (
              <div 
                key={item.id} 
                onClick={() => onOpenReview && onOpenReview(item)}
                className="khaliji-card-glass rounded-3xl p-3 border border-[#EADFC7] flex items-center gap-3 cursor-pointer active:scale-98 transition-transform hover:border-[#D4AF37]"
              >
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#D4AF37]/40 bg-[#241A12] shadow-inner shrink-0">
                  {item.designImage && item.designImage.startsWith('http') ? (
                    <img src={item.designImage} alt={item.designTitle} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">✨👗</div>
                  )}
                </div>
                <div className="flex-1 text-right space-y-1">
                  <span className="text-[10px] text-[#7E7667] block">کد: #{item.id} • {item.date}</span>
                  <h3 className="text-xs font-black text-[#23201C]">{item.designTitle}</h3>
                  <span className="text-[10px] text-[#0E8388] font-bold block">خیاط: {item.tailorName}</span>
                </div>
                <div className="text-left space-y-1.5">
                  <span className="text-xs font-black text-[#C85A32] block">{item.amount?.toLocaleString('fa-IR')} تومان</span>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38F24] text-white shadow-sm inline-flex items-center gap-1">
                    <span>⭐ ثبت نظر</span>
                  </span>
                </div>
              </div>
            ))
          ) : (
                     <div className="khaliji-card-glass rounded-3xl p-8 border border-[#EADFC7] text-center space-y-2">
           <div className="text-4xl">📜</div>
           <h3 className="text-xs font-black text-[#23201C]">هنوز سفارشی تحویل داده نشده است</h3>
         </div>
       )}
       {/* سفارش‌های رد/لغو شده (جریان جدید) */}
{cancelledOrders.map((item) => (
          <div key={item.id} className="khaliji-card-glass rounded-3xl p-3 border border-red-200 bg-red-50/40 flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-red-200/60 bg-[#241A12] shadow-inner shrink-0">
              {item.designImage && item.designImage.startsWith('http') ? (
                <img src={item.designImage} alt={item.designTitle} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">✨👗</div>
              )}
            </div>
            <div className="flex-1 text-right space-y-1">
              <span className="text-[10px] text-[#7E7667] block">کد: #{item.id} • {item.date}</span>
              <h3 className="text-xs font-black text-[#23201C]">{item.designTitle}</h3>
              <span className="text-[10px] text-red-600 font-black block">❌ رد/لغو شده — بدون پرداخت بیعانه</span>
            </div>
            <span className="text-xs font-black text-[#C85A32]">{item.amount?.toLocaleString('fa-IR')} تومان</span>
          </div>
        ))}
     </div>
   )}

      {/* مودال پیش‌فاکتور امانی */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 border border-[#EADFC7] shadow-2xl space-y-4 text-center">
            <h3 className="text-sm font-black text-[#23201C]">رسید پرداخت بیعانه امانی سفارش #{showInvoiceModal.id}</h3>
            <div className="bg-[#F8F5EE] p-3.5 rounded-2xl text-xs space-y-2 text-right font-bold text-[#524B40]">
              <div className="flex justify-between"><span>مبلغ کل سفارش:</span><span className="font-black text-[#23201C]">{showInvoiceModal.amount?.toLocaleString('fa-IR')} تومان</span></div>
              <div className="flex justify-between"><span>بیعانه پرداختی (۳۰٪):</span><span className="text-emerald-700 font-black">{showInvoiceModal.depositAmount?.toLocaleString('fa-IR')} تومان</span></div>
              <div className="flex justify-between"><span>مانده پس از تحویل:</span><span>{showInvoiceModal.remainingAmount?.toLocaleString('fa-IR')} تومان</span></div>
            </div>
                     <button onClick={() => setShowInvoiceModal(null)} className="w-full py-2.5 rounded-xl bg-[#23201C] text-white text-xs font-black">بستن</button>
       </div>
     </div>
   )}
   {/* مودال پرداخت بیعانه (مرحله ۲ جریان جدید) */}
   {payingOrder && (
     <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
       <div className="bg-white w-full max-w-sm rounded-3xl p-5 border border-[#EADFC7] shadow-2xl space-y-4 text-right">
         <div className="flex items-center justify-between border-b border-[#F8F5EE] pb-2">
           <span className="text-xs font-black text-[#23201C]">پرداخت بیعانه امانی — سفارش #{payingOrder.id}</span>
           <button onClick={() => setPayingOrder(null)} className="text-xs text-[#7E7667]"><X className="w-4 h-4" /></button>
         </div>
         <div className="bg-[#F8F5EE] p-3.5 rounded-2xl text-xs space-y-2 font-bold text-[#524B40]">
           <div className="flex justify-between"><span>طرح:</span><span className="font-black text-[#23201C]">{payingOrder.designTitle}</span></div>
           <div className="flex justify-between"><span>خیاط:</span><span>{payingOrder.tailorName}</span></div>
           <div className="flex justify-between"><span>مبلغ کل سفارش:</span><span>{(payingOrder.amount || 0).toLocaleString('fa-IR')} تومان</span></div>
           <div className="flex justify-between border-t border-[#EADFC7] pt-2"><span>بیعانه قابل پرداخت (۳۰٪):</span><span className="text-emerald-700 font-black">{(payingOrder.depositAmount || 0).toLocaleString('fa-IR')} تومان</span></div>
         </div>
         <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200 flex items-center gap-1.5">
           <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
           <span>پرداخت شما در حساب امانی کَندوره محفوظ می‌ماند و تنها پس از تحویل برای خیاط آزاد می‌شود.</span>
         </div>
         <button
           onClick={handlePayDeposit}
           disabled={isPayingDeposit}
           className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#0E8388] to-[#04474A] text-white font-black text-xs shadow-md active:scale-95 disabled:opacity-60"
         >
           {isPayingDeposit ? 'در حال اتصال به درگاه پرداخت...' : 'تأیید و پرداخت بیعانه'}
         </button>
       </div>
     </div>
   )}
 </div>
);
};