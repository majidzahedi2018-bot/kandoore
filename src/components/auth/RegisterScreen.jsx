// src/components/auth/RegisterScreen.jsx
import React, { useState, useRef, useEffect } from 'react';
import { User, MapPin, Lock, ChevronDown, ArrowRight, Eye, EyeOff, Check, Sparkles, ShieldCheck, Shirt, Smartphone, KeyRound } from 'lucide-react';
import { API_BASE } from '../../api/api';
import { AuthLayout } from './AuthLayout';
import { HORMOZGAN_CITIES } from '../../data/cities';

// نرمال‌سازی شماره به فرمت کاننیکال 09xxxxxxxxx (پذیرش با/بدون صفر، +98 و 98)
const normalizePhone = (p) => {
let d = String(p).replace(/[۰-۹]/g, (ch) => '۰۱۳۴۵۷۸۹'.indexOf(ch)).replace(/[^0-9]/g, '');
if (d.startsWith('0098')) d = d.slice(4);
else if (d.startsWith('98')) d = d.slice(2);
if (d.startsWith('0')) d = d.slice(1);
if (/^9\d{9}$/.test(d)) return '0' + d;
return null;
};

export const RegisterScreen = ({ onBack, onRegisterSuccess, targetRole = 'customer', defaultPhone = '' }) => {
const [step, setStep] = useState('form'); // 'form' | 'otp'
const [name, setName] = useState('');
const [phone, setPhone] = useState(defaultPhone);
const [city, setCity] = useState('بندرعباس');
const [role, setRole] = useState(targetRole === 'tailor' ? 'tailor' : 'customer');
const [password, setPassword] = useState('');
const [confirmPass, setConfirmPass] = useState('');
const [showPass, setShowPass] = useState(false);
const [agree, setAgree] = useState(false);
const [showCities, setShowCities] = useState(false);
const [code, setCode] = useState('');
const [error, setError] = useState('');
const [isSubmitting, setIsSubmitting] = useState(false);
const cityRef = useRef(null);

// بستن dropdown شهر با کلیک بیرون
useEffect(() => {
const onDoc = (e) => { if (cityRef.current && !cityRef.current.contains(e.target)) setShowCities(false); };
document.addEventListener('mousedown', onDoc);
return () => document.removeEventListener('mousedown', onDoc);
}, []);

// ─── گام ۱: اعتبارسنجی فرم + بررسی نقش تکراری + ارسال کد ───
const handleSendCode = async (e) => {
e?.preventDefault();
setError('');
const trimmedName = name.trim();
if (trimmedName.length < 2 || trimmedName.length > 50) { setError('لطفاً نام و نام خانوادگی معتبر وارد کنید (حداقل ۲ حرف).'); return; }
const normalized = normalizePhone(phone);
if (!normalized) { setError('شماره موبایل معتبر نیست؛ با یا بدون صفر وارد کنید (مثال: ۹۱۷۱۲۳۴۵۶۷).'); return; }
if (!password || password.length < 6) { setError('رمز عبور الزامی است و باید حداقل ۶ کاراکتر باشد.'); return; }
if (confirmPass !== password) { setError('تایید رمز عبور با رمز عبور یکسان نیست.'); return; }
if (!agree) { setError('برای ساخت حساب، پذیرش قوانین کَندوره الزامی است.'); return; }
setIsSubmitting(true);
try {
const chk = await fetch(`${API_BASE}/auth.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check_phone', phone: normalized }) });
const chkData = await chk.json();
const accounts = Array.isArray(chkData.accounts) ? chkData.accounts : (chkData.registered ? [{ role: chkData.role || 'customer' }] : []);
if (accounts.some(a => a.role === role)) {
setIsSubmitting(false);
const roleFa = role === 'tailor' ? 'خیاط' : 'مشتری';
setError(`این شماره قبلاً با نقش «${roleFa}» ثبت شده است؛ وارد شوید یا نقش دیگر را انتخاب کنید.`);
return;
}
setPhone(normalized);
const res = await fetch(`${API_BASE}/auth.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send_otp', phone: normalized }) });
const data = await res.json();
setIsSubmitting(false);
if (data.success) { setCode(''); setStep('otp'); }
else setError(data.message || 'خطا در ارسال پیامک.');
} catch {
setIsSubmitting(false);
setError('خطا در برقراری ارتباط با سرور.');
}
};

// ─── گام ۲: تأیید کد + ساخت حساب با رمز + ورود مستقیم ───
const handleRegister = async (e) => {
e?.preventDefault();
setError('');
if (code.length < 4) { setError('کد تأیید ۴ رقمی را وارد کنید.'); return; }
setIsSubmitting(true);
try {
const res = await fetch(`${API_BASE}/auth.php`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ action: 'register', name: name.trim(), username: phone, password, role, city, code })
});
const data = await res.json();
setIsSubmitting(false);
if (data.success && data.user) {
if (data.token) localStorage.setItem('kandooreh_token', data.token);
onRegisterSuccess(data.user);

} else {
setError(data.message || 'خطا در ساخت حساب.');
}
} catch {
setIsSubmitting(false);
setError('خطا در برقراری ارتباط با سرور.');
}
};

return (
<AuthLayout>
<div className="h-[100dvh] lg:h-auto w-full flex flex-col p-5 lg:p-0 select-none overflow-hidden lg:overflow-visible relative">

  {/* ═══ هدر ثابت ═══ */}
  <div className="pt-2 pb-1 z-20 flex items-center justify-between shrink-0">
    <button type="button" onClick={onBack} className="flex items-center gap-1 px-4 py-2 rounded-2xl bg-white/70 backdrop-blur-md border border-white text-[10px] font-black text-[#23201C] shadow-sm active:scale-95">
      <ArrowRight className="w-4 h-4 text-[#B38F24]" />
      <span>بازگشت به ورود</span>
    </button>
    <span className="text-[9px] font-black text-[#8C6D1F] flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" />ثبت‌نام امن</span>
  </div>

  {/* ═══ عنوان ثابت زیر لوگو + نشانگر دو گام ═══ */}
  <div className="text-center pt-[22vh] lg:pt-0 lg:pb-4 pb-2 space-y-2 z-10 shrink-0">
    <h1 className="text-2xl font-black metallic-gold-text tracking-tight drop-shadow-md">ایجاد حساب کاربری</h1>
    <div className="flex items-center justify-center gap-1.5 text-[9px] font-black text-[#8C6D1F]">
      <span>❖</span>
      <span>{role === 'tailor' ? 'ثبت کارگاه خیاطی و شروع همکاری' : 'شروع سفارش دوخت لباس اصیل هرمزگان'}</span>
      <span>❖</span>
    </div>
    <div className="flex items-center justify-center gap-2 pt-1">
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black border-2 transition-all ${step === 'form' ? 'bg-gradient-to-r from-[#E5C158] to-[#AA771C] text-white border-[#D4AF37] shadow-md' : 'bg-emerald-50 text-emerald-700 border-emerald-300'}`}>
        {step === 'otp' ? <Check className="w-3 h-3 stroke-[3]" /> : <User className="w-3 h-3" />}
        <span>۱. اطلاعات حساب</span>
      </div>
      <span className="w-4 h-[2px] bg-[#D4AF37]/40 rounded-full"></span>
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black border-2 transition-all ${step === 'otp' ? 'bg-gradient-to-r from-[#E5C158] to-[#AA771C] text-white border-[#D4AF37] shadow-md' : 'bg-white/70 text-[#7E7667] border-[#EADFC7]'}`}>
        <Smartphone className="w-3 h-3" />
        <span>۲. تأیید شماره</span>
      </div>
    </div>
  </div>

  {/* ═══ کارت با اسکرول داخلی نامرئی ═══ */}
  <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar lg:overflow-visible z-10">
    {step === 'form' ? (
      <form onSubmit={handleSendCode} className="w-full frost-glass rounded-[2rem] p-4 sm:p-5 space-y-2.5 relative shadow-2xl border border-white/80 text-center mb-3">
        {/* نام کامل */}
        <div className="flex items-center bg-white/80 rounded-2xl border-2 border-[#EADFC7] focus-within:border-[#D4AF37] shadow-inner overflow-hidden">
          <div className="px-2.5 bg-[#FAF6ED] border-l border-[#EADFC7] text-[#B38F24] flex items-center shrink-0"><User className="w-4 h-4" /></div>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="نام و نام خانوادگی (مثلاً سارا محمدی)" className="w-full bg-transparent px-3 py-2.5 text-[13px] font-black text-[#23201C] placeholder:text-[#7E7667]/50 focus:outline-none text-right" />
        </div>
        {/* شماره موبایل */}
        <div dir="ltr" className="flex items-center bg-white/80 rounded-2xl border-2 border-[#EADFC7] focus-within:border-[#D4AF37] shadow-inner overflow-hidden">
          <div className="px-3 py-2.5 bg-[#FAF6ED] border-r border-[#EADFC7] text-[13px] font-black text-[#23201C] flex items-center justify-center shrink-0"><span dir="ltr">+۹۸</span></div>
          <input type="tel" inputMode="numeric" maxLength={15} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="917 123 4567" className="w-full bg-transparent px-3 py-2.5 text-[13px] font-black text-[#23201C] placeholder:text-[#7E7667]/50 focus:outline-none text-left tracking-wider" dir="ltr" />
        </div>
        {/* شهر */}
        <div className="relative" ref={cityRef}>
          <button type="button" onClick={() => setShowCities(v => !v)} className="w-full flex items-center bg-white/80 rounded-2xl border-2 border-[#EADFC7] focus-within:border-[#D4AF37] shadow-inner overflow-hidden px-3 py-2.5">
            <MapPin className="w-4 h-4 text-[#B38F24] shrink-0 ml-2" />
            <span className="flex-1 text-right text-[13px] font-black text-[#23201C]">{city}</span>
            <ChevronDown className={`w-4 h-4 text-[#7E7667] transition-transform ${showCities ? 'rotate-180' : ''}`} />
          </button>
          {showCities && (
            <div className="absolute top-full mt-2 right-0 left-0 z-30 max-h-44 overflow-y-auto no-scrollbar rounded-2xl bg-white/95 backdrop-blur-xl border-2 border-[#D4AF37]/60 shadow-2xl p-1.5">
              {HORMOZGAN_CITIES.map(c => (
                <button key={c.value} type="button" onClick={() => { setCity(c.value); setShowCities(false); }} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-black transition-colors ${city === c.value ? 'bg-[#D4AF37]/15 text-[#8C6D1F]' : 'text-[#23201C] hover:bg-[#FAF6ED]'}`}>
                  <span>{c.label}</span>
                  {city === c.value && <Check className="w-3.5 h-3.5 text-[#B38F24]" />}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* انتخاب نقش */}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setRole('customer')} className={`rounded-2xl border-2 p-2.5 space-y-0.5 transition-all ${role === 'customer' ? 'bg-gradient-to-br from-[#E5C158] to-[#AA771C] border-[#D4AF37] shadow-lg' : 'bg-white/70 border-[#EADFC7]'}`}>
            <User className={`w-4 h-4 mx-auto ${role === 'customer' ? 'text-white' : 'text-[#0E8388]'}`} />
            <span className={`text-[10px] font-black block ${role === 'customer' ? 'text-white' : 'text-[#524B40]'}`}>مشتری هستم</span>
            <span className={`text-[8px] font-bold block ${role === 'customer' ? 'text-white/80' : 'text-[#7E7667]'}`}>سفارش دوخت لباس</span>
          </button>
          <button type="button" onClick={() => setRole('tailor')} className={`rounded-2xl border-2 p-2.5 space-y-0.5 transition-all ${role === 'tailor' ? 'bg-gradient-to-br from-[#E5C158] to-[#AA771C] border-[#D4AF37] shadow-lg' : 'bg-white/70 border-[#EADFC7]'}`}>
            <Shirt className={`w-4 h-4 mx-auto ${role === 'tailor' ? 'text-white' : 'text-[#B38F24]'}`} />
            <span className={`text-[10px] font-black block ${role === 'tailor' ? 'text-white' : 'text-[#524B40]'}`}>خیاط هستم</span>
            <span className={`text-[8px] font-bold block ${role === 'tailor' ? 'text-white/80' : 'text-[#7E7667]'}`}>پذیرش سفارش و درآمد</span>
          </button>
        </div>
        {/* رمز عبور */}
        <div dir="ltr" className="flex items-center bg-white/80 rounded-2xl border-2 border-[#EADFC7] focus-within:border-[#D4AF37] shadow-inner overflow-hidden">
          <div className="px-2.5 bg-[#FAF6ED] border-r border-[#EADFC7] text-[#B38F24] flex items-center shrink-0"><Lock className="w-4 h-4" /></div>
          <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="رمز عبور (حداقل ۶ کاراکتر)" className="w-full bg-transparent px-3 py-2.5 text-[13px] font-black text-[#23201C] placeholder:text-[#7E7667]/50 focus:outline-none text-left" dir="ltr" />
          <button type="button" onClick={() => setShowPass(v => !v)} className="px-2.5 text-[#7E7667]">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
        </div>
        {/* تایید رمز عبور */}
        <div dir="ltr" className="flex items-center bg-white/80 rounded-2xl border-2 border-[#EADFC7] focus-within:border-[#D4AF37] shadow-inner overflow-hidden">
          <div className="px-2.5 bg-[#FAF6ED] border-r border-[#EADFC7] text-[#B38F24] flex items-center shrink-0"><Lock className="w-4 h-4" /></div>
          <input type={showPass ? 'text' : 'password'} value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="تایید رمز عبور" className="w-full bg-transparent px-3 py-2.5 text-[13px] font-black text-[#23201C] placeholder:text-[#7E7667]/50 focus:outline-none text-left" dir="ltr" />
        </div>
        {confirmPass && confirmPass === password && <p className="text-[9px] text-emerald-600 font-bold text-right flex items-center gap-1"><Check className="w-3 h-3" />رمزها یکسان هستند ✔</p>}
        {/* قوانین */}
        <button type="button" onClick={() => setAgree(v => !v)} className="w-full flex items-center gap-2.5 p-2.5 rounded-2xl bg-white/60 border-2 border-[#EADFC7] active:scale-[0.98]">
          <span className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${agree ? 'bg-gradient-to-br from-[#E5C158] to-[#AA771C] border-[#D4AF37]' : 'bg-white border-[#EADFC7]'}`}>
            {agree && <Check className="w-4 h-4 text-white stroke-[3]" />}
          </span>
          <span className="text-[9px] font-black text-[#524B40] text-right leading-relaxed">با <span className="text-[#0E8388] underline">قوانین و حریم خصوصی کَندوره</span> موافقم.</span>
        </button>
        {error && <div className="p-2.5 rounded-xl bg-red-50 text-red-600 text-[10px] font-bold border border-red-200 text-right">{error}</div>}
        <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-75">
          <Smartphone className="w-4 h-4" />
          <span>{isSubmitting ? 'در حال ارسال کد...' : 'ادامه و دریافت کد تأیید'}</span>
        </button>
      </form>
    ) : (
      <form onSubmit={handleRegister} className="w-full frost-glass rounded-[2rem] p-4 sm:p-5 space-y-3 relative shadow-2xl border border-white/80 text-center mb-3">
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2 text-[13px] font-black text-[#23201C]">
            <span className="text-[#D4AF37] text-xs">❖</span>
            <span>تأیید شماره همراه</span>
            <span className="text-[#D4AF37] text-xs">❖</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#7E7667] font-bold">
            <span>کد به شماره <span className="text-[#0E8388] font-black" dir="ltr">{phone}</span> ارسال شد</span>
            <button type="button" onClick={() => { setStep('form'); setError(''); }} className="text-[#0E8388] font-black underline">ویرایش ✏️</button>
          </div>
        </div>
        {error && <div className="p-2.5 rounded-xl bg-red-50 text-red-600 text-[10px] font-bold border border-red-200 text-right">{error}</div>}
        <input type="text" inputMode="numeric" maxLength={4} value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9۰-۹]/g, ''))} placeholder="کد ۴ رقمی" className="w-full bg-white/80 rounded-2xl border-2 border-[#EADFC7] focus:border-[#D4AF37] shadow-inner px-3 py-3 text-center font-black text-xl tracking-[0.5em] text-[#23201C] focus:outline-none" dir="ltr" />
        <button type="button" onClick={handleSendCode} disabled={isSubmitting} className="w-full text-[9px] text-[#7E7667] font-bold underline">
          {isSubmitting ? 'در حال ارسال...' : 'ارسال مجدد کد'}
        </button>
        <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-75">
          <KeyRound className="w-4 h-4" />
          <span>{isSubmitting ? 'در حال ساخت حساب...' : 'ایجاد حساب و ورود مستقیم'}</span>
        </button>
      </form>
    )}
  </div>

  {/* ═══ پانوشت ثابت ═══ */}
  <div className="pb-1 pt-1 text-center z-10 shrink-0">
    <p className="text-[8px] text-[#7E7667] font-bold">اطلاعات شما نزد کَندوره محرمانه می‌ماند ⚜️</p>
  </div>
</div>
</AuthLayout>
);
};