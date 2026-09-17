// src/components/customer/CheckoutInvoiceModal.jsx
import React, { useState, useEffect } from 'react';
import { ChevronRight, Truck, Store, ShieldCheck, FileText, MapPin } from 'lucide-react';
import { ordersApi, addressesApi } from '../../api/api';
import { useToast } from '../common/ToastSystem';

export const CheckoutInvoiceModal = ({ orderData, currentUser, onBack, onCompleteSuccess }) => {
const { toast } = useToast();
const [deliveryMethod, setDeliveryMethod] = useState('courier'); // 'courier' | 'pickup'
const [deliveryAddress, setDeliveryAddress] = useState('');
const [isRegistering, setIsRegistering] = useState(false);

// دریافت آدرس پیش‌فرض مشتری از دیتابیس
useEffect(() => {
const fetchDefaultAddress = async () => {
if (!currentUser?.id) return;
try {
const res = await addressesApi.getByUser(currentUser.id);
if (res.success && res.addresses?.length > 0) {
const def = res.addresses.find(a => a.isDefault) || res.addresses[0];
setDeliveryAddress(`${def.fullAddress} (گیرنده: ${def.recipient} - ${def.phone})`);
}
} catch (e) {
console.error('Error fetching default address:', e);
}
};
fetchDefaultAddress();
}, [currentUser]);

const amount = orderData?.totalPrice || orderData?.price || orderData?.amount || 480000;
const deposit = Math.round(amount * 0.3);
const remaining = amount - deposit;

// ثبت سفارش WITHOUT پرداخت (جریان جدید: اول تایید خیاط، بعد بیعانه)
const handleRegister = async () => {
if (isRegistering) return;
setIsRegistering(true);
try {
const payload = {
user_id: currentUser?.id || 1,
tailor_user_id: orderData?.tailor?.userId || orderData?.tailor?.id || orderData?.design?.userId || 2,
tailor_name: orderData?.tailor?.name || orderData?.design?.tailorName || 'کارگاه خیاطی هرمزگان',
design_title: orderData?.design?.title || orderData?.title || 'کندوره زری‌بافی',
design_id: orderData?.design?.id || null,
design_image: (orderData?.design?.colorPreview && orderData.design.colorPreview.startsWith('http')) ? orderData.design.colorPreview : (orderData?.design?.image || null),
amount,
deposit,
delivery_method: deliveryMethod,
delivery_address: deliveryMethod === 'courier' ? (deliveryAddress || 'آدرس ثبت نشده') : 'تحویل حضوری در کارگاه',
fabric_mode: orderData?.fabricMode || 'tailor',
selected_color: orderData?.selectedColor || null,
selected_material: orderData?.selectedMaterial || null,
selected_thread: orderData?.selectedThread || null,
measurement_profile_id: orderData?.measurementProfileId || null
};
const res = await ordersApi.createOrder(payload);
setIsRegistering(false);
if (res.success) {
toast.success('سفارش ثبت شد ✅ در انتظار تایید خیاط؛ سپس دکمه «پرداخت بیعانه» در سفارش‌های من فعال می‌شود.');
if (onCompleteSuccess) onCompleteSuccess(res);
} else {
toast.error(res.message || 'خطا در ثبت سفارش در سرور');
}
} catch (e) {
setIsRegistering(false);
toast.error('خطا در برقراری ارتباط با سرور');
}
};

return (
<div className="fixed inset-0 z-50 bg-[#F8F5EE] flex flex-col justify-between p-0 select-none overflow-hidden max-w-md mx-auto">
  {/* هدر */}
  <div className="p-4 bg-white/80 backdrop-blur-md border-b border-[#EADFC7] flex items-center justify-between z-10 shrink-0">
    <button onClick={onBack} className="w-10 h-10 rounded-full khaliji-card-glass flex items-center justify-center text-[#B38F24] border border-[#EADFC7] shadow-sm active:scale-90">
      <ChevronRight className="w-5 h-5" />
    </button>
    <h1 className="text-base font-black text-[#23201C]">پیش‌فاکتور و ثبت سفارش</h1>
    <div className="w-10 h-10 rounded-full flex items-center justify-center text-[#B38F24] text-xl">🧾</div>
  </div>

  <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 pb-28">
    {/* کارت طرح */}
    <div className="khaliji-card-glass rounded-3xl p-4 border border-[#EADFC7] shadow-sm flex items-center justify-between">
      <div className="space-y-1 text-right flex-1 pr-3">
        <h2 className="text-xs font-black text-[#23201C]">{orderData?.design?.title || orderData?.title || 'کندوره زری‌بافی'}</h2>
<span className="text-[10px] text-[#7E7667] font-bold block">خیاط: {orderData?.tailor?.name || orderData?.design?.tailorName || 'کارگاه هرمزگان'}</span>
      </div>
      <div className="w-16 h-20 rounded-2xl bg-gradient-to-br from-[#23201C] to-[#3D2D1E] flex items-center justify-center text-3xl border border-[#D4AF37] shadow-inner shrink-0">✨👗</div>
    </div>

    {/* صورتحساب */}
    <div className="khaliji-card-glass rounded-3xl p-4 border border-[#EADFC7] shadow-sm space-y-2.5 text-right">
      <div className="flex items-center justify-end gap-1.5 text-xs font-black text-[#23201C] border-b border-[#F8F5EE] pb-2">
        <span>صورتحساب سفارش</span>
        <FileText className="w-4 h-4 text-[#B38F24]" />
      </div>
      <div className="flex justify-between text-xs font-bold text-[#524B40]"><span>مبلغ کل دوخت:</span><span className="font-black text-[#23201C]">{amount.toLocaleString('fa-IR')} تومان</span></div>
      <div className="flex justify-between text-xs font-bold text-[#524B40]"><span>بیعانه ۳۰٪ (پس از تایید خیاط):</span><span className="font-black text-emerald-700">{deposit.toLocaleString('fa-IR')} تومان</span></div>
      <div className="flex justify-between text-xs font-bold text-[#524B40]"><span>مانده پس از تحویل:</span><span className="font-black text-[#23201C]">{remaining.toLocaleString('fa-IR')} تومان</span></div>
    </div>

    {/* نحوه تحویل */}
    <div className="khaliji-card-glass rounded-3xl p-4 border border-[#EADFC7] shadow-sm space-y-3 text-right">
      <span className="text-xs font-black text-[#23201C] block">نحوه تحویل سفارش:</span>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setDeliveryMethod('courier')}
          className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${deliveryMethod === 'courier' ? 'border-[#0E8388] bg-[#0E8388]/10' : 'border-[#EADFC7] bg-white'}`}>
          <Truck className={`w-5 h-5 ${deliveryMethod === 'courier' ? 'text-[#0E8388]' : 'text-[#7E7667]'}`} />
          <span className="text-[10px] font-black text-[#23201C]">پیک اختصاصی</span>
        </button>
        <button type="button" onClick={() => setDeliveryMethod('pickup')}
          className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${deliveryMethod === 'pickup' ? 'border-[#B38F24] bg-[#D4AF37]/10' : 'border-[#EADFC7] bg-white'}`}>
          <Store className={`w-5 h-5 ${deliveryMethod === 'pickup' ? 'text-[#B38F24]' : 'text-[#7E7667]'}`} />
          <span className="text-[10px] font-black text-[#23201C]">تحویل حضوری</span>
        </button>
      </div>
      {deliveryMethod === 'courier' && (
        <div className="p-2.5 rounded-xl bg-[#0E8388]/5 border border-[#0E8388]/20 flex items-start gap-1.5 text-right">
          <MapPin className="w-3.5 h-3.5 text-[#0E8388] shrink-0 mt-0.5" />
          <span className="text-[10px] text-[#0E8388] font-bold leading-relaxed">{deliveryAddress || 'آدرسی ثبت نشده است؛ از پروفایل > آدرس‌های من اقدام کنید.'}</span>
        </div>
      )}
    </div>

    {/* بنر جریان جدید امن */}
    <div className="rounded-3xl p-4 bg-gradient-to-r from-[#0E352B] via-[#092820] to-[#041914] border-2 border-[#D4AF37]/60 shadow-xl text-white space-y-1.5 text-right">
      <div className="flex items-center gap-1.5 text-xs font-black text-[#FBF5B7]">
        <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
        <span>روال جدید سفارش امن کَندوره:</span>
      </div>
      <p className="text-[10px] text-white/85 font-bold leading-relaxed">
        ۱) ثبت سفارش (بدون پرداخت) → ۲) تایید خیاط → ۳) پرداخت بیعانه ۳۰٪ در «سفارش‌های من» → ۴) دوخت و تحویل. بیعانه شما تا تحویل نهایی در حساب امانی محفوظ می‌ماند.
      </p>
    </div>
  </div>

  {/* دکمه ثبت سفارش بدون پرداخت */}
  <div className="p-4 bg-white/95 backdrop-blur-xl border-t border-[#EADFC7] shadow-2xl z-20">
    <button
      onClick={handleRegister}
      disabled={isRegistering}
      className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white font-black text-xs shadow-lg shadow-[#D4AF37]/30 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-75"
    >
      <ShieldCheck className="w-5 h-5" />
      <span>{isRegistering ? 'در حال ثبت سفارش...' : 'ثبت سفارش (در انتظار تایید خیاط)'}</span>
    </button>
  </div>
</div>
);
};