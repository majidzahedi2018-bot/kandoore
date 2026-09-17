// src/components/landing/AuthGate.jsx
import React, { useState, useEffect } from 'react';
import { X, User, Shirt, Phone, ShieldCheck } from 'lucide-react';

export const AuthGate = ({ isOpen, onClose, initialRole = 'customer', onLoginSuccess, sendOtp, loginWithOtp }) => {
const [role, setRole] = useState(initialRole);
const [step, setStep] = useState('phone');
const [phone, setPhone] = useState('');
const [otp, setOtp] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

useEffect(() => {
if (isOpen) { setRole(initialRole); setStep('phone'); setPhone(''); setOtp(''); setError(''); }
}, [isOpen, initialRole]);

if (!isOpen) return null;

const handleSendOtp = async () => {
if (!/^09\d{9}$/.test(phone)) { setError('شماره موبایل معتبر نیست (مثال: 09171234567)'); return; }
setLoading(true); setError('');
const res = await sendOtp(phone);
setLoading(false);
if (res.success) setStep('otp');
else setError(res.message || 'خطا در ارسال کد تأیید');
};

const handleVerify = async () => {
setLoading(true); setError('');
const res = await loginWithOtp(phone, otp, role);
setLoading(false);
if (res.success) { onLoginSuccess(res.user); onClose(); }
else setError(res.message || 'کد تأیید نادرست است');
};

return (
<div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 select-none">
<div className="bg-[#F8F5EE] w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-5 space-y-4 border border-[#EADFC7] shadow-2xl">
  <div className="w-12 h-1.5 bg-[#EADFC7] rounded-full mx-auto"></div>
  {/* انتخاب نقش */}
  <div className="grid grid-cols-2 gap-2">
    <button onClick={() => setRole('customer')} className={`py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 border-2 transition-all ${role === 'customer' ? 'bg-gradient-to-r from-[#E5C158] to-[#AA771C] text-white border-[#D4AF37]' : 'bg-white text-[#7E7667] border-[#EADFC7]'}`}>
      <User className="w-4 h-4" />ورود به‌عنوان مشتری
    </button>
    <button onClick={() => setRole('tailor')} className={`py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 border-2 transition-all ${role === 'tailor' ? 'bg-gradient-to-r from-[#E5C158] to-[#AA771C] text-white border-[#D4AF37]' : 'bg-white text-[#7E7667] border-[#EADFC7]'}`}>
      <Shirt className="w-4 h-4" />ورود به‌عنوان خیاط
    </button>
  </div>
  {/* شماره موبایل */}
  {step === 'phone' ? (
    <div className="space-y-3 text-right">
      <label className="text-xs font-black text-[#23201C] block">شماره موبایل</label>
      <div className="flex items-center gap-2 khaliji-card-glass rounded-2xl px-4 py-3 border border-[#EADFC7]">
        <Phone className="w-4 h-4 text-[#0E8388]" />
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="۰۹۱۷ ••• ••••" className="flex-1 bg-transparent text-sm font-black text-[#23201C] focus:outline-none text-left" dir="ltr" />
      </div>
      {error && <p className="text-[10px] text-red-600 font-bold">{error}</p>}
      <button onClick={handleSendOtp} disabled={loading} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white text-sm font-black shadow-md disabled:opacity-60">
        {loading ? 'در حال ارسال کد...' : 'دریافت کد تأیید'}
      </button>
    </div>
  ) : (
    <div className="space-y-3 text-right">
      <label className="text-xs font-black text-[#23201C] block">کد تأیید پیامک‌شده به {phone}</label>
      <input type="text" inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="•••••" className="w-full khaliji-card-glass rounded-2xl px-4 py-3 text-center text-lg font-black tracking-[0.5em] text-[#23201C] border border-[#EADFC7] focus:outline-none" dir="ltr" />
      {error && <p className="text-[10px] text-red-600 font-bold">{error}</p>}
      <button onClick={handleVerify} disabled={loading} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#0E8388] to-[#04474A] text-white text-sm font-black shadow-md disabled:opacity-60">
        {loading ? 'در حال تأیید...' : 'ورود به کَندوره'}
      </button>
      <button onClick={() => setStep('phone')} className="w-full text-[10px] text-[#7E7667] font-bold">تغییر شماره موبایل</button>
    </div>
  )}
  <div className="flex items-center justify-between">
    <button onClick={onClose} className="text-[10px] text-[#7E7667] font-bold flex items-center gap-1"><X className="w-3 h-3" />بازگشت به لندینگ</button>
    <span className="text-[9px] text-[#7E7667] font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-[#0E8388]" />ورود شما به معنای پذیرش قوانین کَندوره است</span>
  </div>
</div>
</div>
);
};