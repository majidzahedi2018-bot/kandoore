// src/components/auth/ResetPasswordScreen.jsx
import React, { useState } from 'react';
import { ArrowRight, Smartphone, Lock, Eye, EyeOff, KeyRound, ShieldCheck, Check, User, Shirt } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { API_BASE } from '../../api/api';

// نرمال‌سازی شماره به فرمت کاننیکال 09xxxxxxxxx (پذیرش با/بدون صفر، +98 و 98)
const normalizePhone = (p) => {
let d = String(p).replace(/[۰-۹]/g, (ch) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(ch)).replace(/[^0-9]/g, '');
if (d.startsWith('0098')) d = d.slice(4);
else if (d.startsWith('98')) d = d.slice(2);
if (d.startsWith('0')) d = d.slice(1);
if (/^9\d{9}$/.test(d)) return '0' + d;
return null;
};

export const ResetPasswordScreen = ({ onBack, onResetSuccess }) => {
const [step, setStep] = useState('phone'); // 'phone' | 'reset'
const [phone, setPhone] = useState('');
const [code, setCode] = useState('');
const [newPass, setNewPass] = useState('');
const [confirmPass, setConfirmPass] = useState('');
const [showPass, setShowPass] = useState(false);
const [error, setError] = useState('');
const [success, setSuccess] = useState('');
const [isSubmitting, setIsSubmitting] = useState(false);
// ─── مرحله ۴: حساب‌های موجود روی شماره + نقش انتخابی برای بازیابی ───
const [accounts, setAccounts] = useState([]);
const [selectedRole, setSelectedRole] = useState('customer');

// ─── مرحله ۱: بررسی حساب‌های شماره → انتخاب نقش در صورت وجود دو حساب ───
const handleSendCode = async (e) => {
e?.preventDefault();
setError('');
const normalized = normalizePhone(phone);
if (!normalized) { setError('شماره موبایل معتبر نیست؛ با یا بدون صفر وارد کنید (مثال: ۹۱۷۱۲۳۴۵۶۷).'); return; }
setIsSubmitting(true);
try {
const chk = await fetch(`${API_BASE}/auth.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check_phone', phone: normalized }) });
const chkData = await chk.json();
const list = Array.isArray(chkData.accounts) ? chkData.accounts : (chkData.registered ? [{ role: chkData.role || 'customer', hasPassword: !!chkData.hasPassword }] : []);
if (!chkData.success || list.length === 0) { setIsSubmitting(false); setError('کاربری با این شماره یافت نشد؛ ابتدا با «ورود با پیامک» حساب بسازید یا ثبت‌نام کنید.'); return; }
setPhone(normalized);
setAccounts(list);
if (list.length === 1) {
setSelectedRole(list[0].role);
await sendOtpNow(normalized);
} else {
setSelectedRole(list[0].role);
setIsSubmitting(false);
setStep('choose');
}
} catch {
setIsSubmitting(false);
setError('خطا در برقراری ارتباط با سرور.');
}
};
// ─── ارسال کد OTP برای شماره (پس از انتخاب حساب) ───
const sendOtpNow = async (normalized) => {
setIsSubmitting(true);
try {
const res = await fetch(`${API_BASE}/auth.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send_otp', phone: normalized }) });
const data = await res.json();
setIsSubmitting(false);
if (data.success) { setStep('reset'); }
else setError(data.message || 'خطا در ارسال پیامک.');
} catch {
setIsSubmitting(false);
setError('خطا در برقراری ارتباط با سرور.');
}
};
// ─── گام ۲: تطبیق کد + ذخیره رمز جدید ───
const handleReset = async (e) => {
e?.preventDefault();
setError('');
if (!code || code.length < 4) { setError('کد تأیید پیامک‌شده را وارد کنید.'); return; }
if (!newPass || newPass.length < 6) { setError('رمز عبور جدید باید حداقل ۶ کاراکتر باشد.'); return; }
if (confirmPass !== newPass) { setError('تایید رمز عبور با رمز جدید یکسان نیست.'); return; }
setIsSubmitting(true);
try {
const res = await fetch(`${API_BASE}/auth.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reset_password', phone, code, password: newPass, role: selectedRole }) });
const data = await res.json();
setIsSubmitting(false);
if (data.success) {
setSuccess('رمز عبور با موفقیت تغییر کرد؛ حالا با رمز جدید وارد شوید.');
setTimeout(() => onResetSuccess(), 1400);
} else setError(data.message || 'خطا در تغییر رمز عبور.');
} catch {
setIsSubmitting(false);
setError('خطا در برقراری ارتباط با سرور.');
}
};

return (
<AuthLayout>
<div className="h-[100dvh] lg:h-auto w-full flex flex-col p-5 lg:p-0 select-none overflow-hidden lg:overflow-visible relative lg:max-w-md lg:mx-auto">

  {/* ═══ ناحیه ۱: هدر ثابت (بازگشت + نشان امنیت) ═══ */}
  <div className="pt-2 pb-1 z-20 flex items-center justify-between shrink-0">
    <button type="button" onClick={onBack} className="flex items-center gap-1 px-4 py-2 rounded-2xl bg-white/70 backdrop-blur-md border border-white text-[10px] font-black text-[#23201C] shadow-sm active:scale-95">
      <ArrowRight className="w-4 h-4 text-[#B38F24]" />
      <span>بازگشت به ورود</span>
    </button>
    <span className="text-[9px] font-black text-[#8C6D1F] flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" />بازیابی امن رمز</span>
  </div>

  {/* ═══ ناحیه ۲+۳: عنوان در ناحیه امن زیر لوگو + کارت با اسکرول داخلی نامرئی ═══ */}
    <div className="text-center pt-[24vh] lg:pt-0 lg:pb-4 pb-2 space-y-2 z-10 shrink-0">
      <h1 className="text-2xl font-black metallic-gold-text tracking-tight drop-shadow-md">فراموشی رمز عبور</h1>
      <div className="flex items-center justify-center gap-1.5 text-[9px] font-black text-[#8C6D1F]">
        <span>❖</span><span>رمز جدید را با تأیید پیامکی شماره تنظیم کنید</span><span>❖</span>
      </div>
      {/* نشانگر فشرده دو مرحله */}
      <div className="flex items-center justify-center gap-2 pt-1">
        <div className={ `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black border-2 transition-all ${(step === 'phone' || step === 'choose') ? 'bg-gradient-to-r from-[#E5C158] to-[#AA771C] text-white border-[#D4AF37] shadow-md' : 'bg-white/70 text-[#0E8388] border-[#0E8388]/40'}` } >
          <Smartphone className="w-3 h-3" />۱. تأیید شماره
        </div>
        <span className="w-5 h-[2px] bg-[#D4AF37]/50 rounded-full"></span>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black border-2 transition-all ${step === 'reset' ? 'bg-gradient-to-r from-[#E5C158] to-[#AA771C] text-white border-[#D4AF37] shadow-md' : 'bg-white/70 text-[#7E7667] border-[#EADFC7]'}`}>
          <KeyRound className="w-3 h-3" />۲. رمز جدید
        </div>
      </div>
      </div>

  <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar lg:overflow-visible z-10">
    <div className="w-full frost-glass rounded-[2rem] p-4 sm:p-5 space-y-2.5 relative shadow-2xl border border-white/80 text-center mb-3">

      {success ? (
        <div className="space-y-3 py-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
            <Check className="w-7 h-7 text-white stroke-[3]" />
          </div>
          <p className="text-[11px] font-black text-emerald-700">{success}</p>
        </div>
           ) : step === 'choose' ? (
     <div className="space-y-2.5 text-right">
       <p className="text-[10px] text-[#7E7667] font-bold text-center">این شماره دو حساب دارد؛ رمز کدام بازیابی شود؟</p>
       <div className="grid grid-cols-2 gap-2">
         {accounts.map(acc => (
           <button key={acc.role} type="button" onClick={() => setSelectedRole(acc.role)} className={`rounded-2xl border-2 p-3 space-y-1 transition-all text-center ${selectedRole === acc.role ? 'bg-gradient-to-br from-[#E5C158] to-[#AA771C] border-[#D4AF37] shadow-lg' : 'bg-white/70 border-[#EADFC7]'}`}>
             {acc.role === 'tailor' ? <KeyRound className={`w-4 h-4 mx-auto ${selectedRole === acc.role ? 'text-white' : 'text-[#B38F24]'}`} /> : <Smartphone className={`w-4 h-4 mx-auto ${selectedRole === acc.role ? 'text-white' : 'text-[#0E8388]'}`} />}
             <span className={`text-[10px] font-black block ${selectedRole === acc.role ? 'text-white' : 'text-[#524B40]'}`}>{acc.role === 'tailor' ? 'حساب خیاط' : 'حساب مشتری'}</span>
             <span className={`text-[8px] font-bold block ${selectedRole === acc.role ? 'text-white/80' : 'text-[#7E7667]'}`}>{acc.hasPassword ? 'رمز دارد' : 'بدون رمز (تنظیم اولیه)'}</span>
           </button>
         ))}
       </div>
       <button type="button" disabled={isSubmitting} onClick={() => sendOtpNow(phone)} className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-75">
         <Smartphone className="w-4 h-4" />
         <span>{isSubmitting ? 'در حال ارسال کد...' : 'ارسال کد تأیید'}</span>
       </button>
       <button type="button" onClick={() => { setStep('phone'); setError(''); }} className="w-full text-[9px] text-[#7E7667] font-bold">تغییر شماره موبایل</button>
     </div>
   ) : step === 'phone' ? (
     <form onSubmit={handleSendCode} className="space-y-2.5">
          <p className="text-[10px] text-[#7E7667] font-bold">شماره موبایل حساب خود را وارد کنید؛ کد تأیید پیامک می‌شود.</p>
          {error && <div className="p-2.5 rounded-xl bg-red-50 text-red-600 text-[10px] font-bold border border-red-200 text-right">{error}</div>}
          <div dir="ltr" className="flex items-center bg-white/80 rounded-2xl border-2 border-[#EADFC7] focus-within:border-[#D4AF37] shadow-inner overflow-hidden">
            <div className="px-3 py-2.5 bg-[#FAF6ED] border-r border-[#EADFC7] text-[13px] font-black text-[#23201C] flex items-center justify-center shrink-0"><span dir="ltr">+۹۸</span></div>
            <input type="tel" inputMode="numeric" maxLength={15} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="917 123 4567" className="w-full bg-transparent px-3 py-2.5 text-[13px] font-black text-[#23201C] placeholder:text-[#7E7667]/50 focus:outline-none text-left tracking-wider" dir="ltr" />
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-75">
            <Smartphone className="w-4 h-4" />
            <span>{isSubmitting ? 'در حال ارسال کد...' : 'ارسال کد تأیید'}</span>
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset} className="space-y-2.5">
          <p className="text-[10px] text-[#7E7667] font-bold">کد پیامک‌شده به شماره <span className="text-[#0E8388] font-black" dir="ltr">{phone}</span> را همراه با رمز جدید وارد کنید.</p>
          {error && <div className="p-2.5 rounded-xl bg-red-50 text-red-600 text-[10px] font-bold border border-red-200 text-right">{error}</div>}
          <input type="text" inputMode="numeric" maxLength={4} value={code} onChange={(e) => setCode(e.target.value)} placeholder="کد ۴ رقمی" className="w-full bg-white/80 rounded-2xl border-2 border-[#EADFC7] focus:border-[#D4AF37] shadow-inner px-3 py-2.5 text-center font-black text-lg tracking-[0.5em] text-[#23201C] focus:outline-none" dir="ltr" />
          <div dir="ltr" className="flex items-center bg-white/80 rounded-2xl border-2 border-[#EADFC7] focus-within:border-[#D4AF37] shadow-inner overflow-hidden">
            <div className="px-2.5 bg-[#FAF6ED] border-r border-[#EADFC7] text-[#B38F24] flex items-center shrink-0"><Lock className="w-4 h-4" /></div>
            <input type={showPass ? 'text' : 'password'} value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="رمز عبور جدید (حداقل ۶ کاراکتر)" className="w-full bg-transparent px-3 py-2.5 text-[13px] font-black text-[#23201C] placeholder:text-[#7E7667]/50 focus:outline-none text-left" dir="ltr" />
            <button type="button" onClick={() => setShowPass(v => !v)} className="px-2.5 text-[#7E7667]">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
          </div>
          <div dir="ltr" className="flex items-center bg-white/80 rounded-2xl border-2 border-[#EADFC7] focus-within:border-[#D4AF37] shadow-inner overflow-hidden">
            <div className="px-2.5 bg-[#FAF6ED] border-r border-[#EADFC7] text-[#B38F24] flex items-center shrink-0"><Lock className="w-4 h-4" /></div>
            <input type={showPass ? 'text' : 'password'} value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="تایید رمز عبور جدید" className="w-full bg-transparent px-3 py-2.5 text-[13px] font-black text-[#23201C] placeholder:text-[#7E7667]/50 focus:outline-none text-left" dir="ltr" />
          </div>
          {confirmPass && confirmPass === newPass && <p className="text-[9px] text-emerald-600 font-bold text-right flex items-center gap-1"><Check className="w-3 h-3" />رمزها یکسان هستند ✔</p>}
          <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#0E8388] to-[#04474A] text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-75">
            <KeyRound className="w-4 h-4" />
            <span>{isSubmitting ? 'در حال تغییر رمز...' : 'ذخیره رمز جدید'}</span>
          </button>
          <button type="button" onClick={() => { setStep('phone'); setError(''); }} className="w-full text-[9px] text-[#7E7667] font-bold">تغییر شماره موبایل</button>
        </form>
      )}
    </div>
  </div>

  {/* ═══ ناحیه ۴: پانوشت ثابت ═══ */}
  <div className="pb-1 pt-1 text-center z-10 shrink-0">
<p className="text-[8px] text-[#7E7667] font-bold">اگر پیامک دریافت نشد، از «پشتیبانی» داخل اپ راهنمایی بگیرید ⚜️</p>
</div>
</div>
</AuthLayout>
);
};