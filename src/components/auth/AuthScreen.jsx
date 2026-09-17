// src/components/auth/AuthScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Store, User, Check, ChevronLeft, Sparkles, Smartphone, KeyRound, Lock, Eye, EyeOff } from 'lucide-react';
import { API_BASE } from '../../api/api';
import { RegisterScreen } from './RegisterScreen';
import { ResetPasswordScreen } from './ResetPasswordScreen';
import { AuthLayout } from './AuthLayout';
import { useBackLayer } from '../../hooks/useBackLayer';


export const AuthScreen = ({ onLoginSuccess, initialRole, initialPhone }) => {
const [step, setStep] = useState('phone'); // 'phone' | 'otp'
const [view, setView] = useState('login'); // 'login' | 'register' | 'reset'
const [targetRole, setTargetRole] = useState(initialRole === 'tailor' ? 'tailor' : 'customer'); // 'customer' | 'tailor'
// مرحله ۳: دکمه برگشت مرورگر/گوشی
useBackLayer(view === 'register', () => { setView('login'); setError(''); });
useBackLayer(view === 'reset', () => { setView('login'); setError(''); });
useBackLayer(step === 'otp' && view === 'login', () => { setStep('phone'); setError(''); });
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || '');
  const [otpCode, setOtpCode] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(120);
  const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState('');
// ─── مرحله ۲: روش ورود (پیامک / رمز عبور) + فیلدهای ورود با رمز ───
const [loginMethod, setLoginMethod] = useState('otp'); // 'otp' | 'password'
const [passUsername, setPassUsername] = useState(initialPhone || '');
const [passPassword, setPassPassword] = useState('');
const [showLoginPass, setShowLoginPass] = useState(false);
// (لایه برگشت OTP بالاتر ثبت شده؛ از ثبت تکراری جلوگیری شد)

  // استیت نمایش راهنمای شناور خیاط (در هر بار ورود به صفحه لاگین فعال است)
  const [showTailorGuide, setShowTailorGuide] = useState(true);

  const dismissTailorGuide = () => {
    setShowTailorGuide(false);
  };

  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const otpCodeRef = useRef(otpCode);
  const phoneRef = useRef(phoneNumber);
  const roleRef = useRef(targetRole);
  const submittingRef = useRef(false);

  otpCodeRef.current = otpCode;
  phoneRef.current = phoneNumber;
  roleRef.current = targetRole;

  // تایمر معکوس پیامک
  useEffect(() => {
    let interval = null;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // فوکوس خودکار روی اولین باکس سمت چپ
  useEffect(() => {
    if (step === 'otp') {
      submittingRef.current = false;
      setTimeout(() => {
        otpRefs[0].current?.focus();
      }, 200);
    }
  }, [step]);

 // نرمال‌سازی شماره به فرمت کاننیکال 09xxxxxxxxx (پذیرش با/بدون صفر، +98 و 98)
const normalizePhone = (p) => {
let d = String(p).replace(/[۰-۹]/g, (ch) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(ch)).replace(/[^0-9]/g, '');
if (d.startsWith('0098')) d = d.slice(4);
else if (d.startsWith('98')) d = d.slice(2);
if (d.startsWith('0')) d = d.slice(1);
if (/^9\d{9}$/.test(d)) return '0' + d;
return null;
};

  const formatTimer = () => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes < 10 ? '۰' : ''}${minutes.toLocaleString('fa-IR')}:${seconds < 10 ? '۰' : ''}${seconds.toLocaleString('fa-IR')}`;
  };

  // ارسال شماره به سرور و درخواست پیامک
  const handlePhoneSubmit = async (e) => {
    e?.preventDefault();
    setError('');

    const normalized = normalizePhone(phoneNumber);
 if (!normalized) {
   setError('شماره موبایل معتبر نیست؛ با یا بدون صفر وارد کنید (مثال: ۹۱۷۱۲۳۴۵۶۷ یا ۰۹۱۷۱۲۳۴۵۶۷).');
   return;
 }
 setPhoneNumber(normalized);
 setPhoneNumber(normalized); // ذخیره فرمت کاننیکال برای نمایش و ارسال
 setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_otp', phone: normalized })
      });
      const data = await res.json();
      setIsSubmitting(false);

      if (data.success) {
        setStep('otp');
        setTimer(120);
        setOtpCode(['', '', '', '']);
      } else {
        setError(data.message || 'خطا در ارسال پیامک.');
      }
    } catch (err) {
      setIsSubmitting(false);
      setError('خطا در برقراری ارتباط با سرور.');
    }
  };

  // ─── مرحله ۲: ورود با نام کاربری (=شماره موبایل) + رمز عبور — جایگزین امن وقتی پیامک کار نمی‌کند ───
const handlePasswordLogin = async (e) => {
e?.preventDefault();
setError('');
const normalized = normalizePhone(passUsername);
if (!normalized) { setError('نام کاربری باید شماره موبایل معتبر باشد (مثال: ۰۹۱۷۱۲۳۴۵۶۷).'); return; }
if (!passPassword) { setError('رمز عبور را وارد کنید.'); return; }
setIsSubmitting(true);
try {
const res = await fetch(`${API_BASE}/auth.php`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ action: 'login', username: normalized, password: passPassword, role_intent: roleRef.current })
});
const data = await res.json();
setIsSubmitting(false);
if (data.success && data.user) {
if (data.token) localStorage.setItem('kandooreh_token', data.token);
localStorage.setItem('kandooreh_user', JSON.stringify(data.user));
if (onLoginSuccess) onLoginSuccess(data.user);

} else {
setError(data.message || 'نام کاربری یا رمز عبور اشتباه است.');
}
} catch (err) {
setIsSubmitting(false);
setError('خطا در برقراری ارتباط با سرور.');
}
};
const toEnDigit = (s) => String(s).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));

  // ارسال کد پیامک برای ورود
  const submitOtp = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError('');
    const code = otpCodeRef.current.join('');
    if (code.length < 4) { submittingRef.current = false; return; }

    setIsSubmitting(true);
     const normalized = normalizePhone(phoneRef.current) || phoneRef.current;

    try {
      const res = await fetch(`${API_BASE}/auth.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({ 
        action: 'verify_otp', 
 phone: normalized, 
 code: code, 
 role_intent: roleRef.current
  })
      });
      const data = await res.json();
      submittingRef.current = false;
      setIsSubmitting(false);

               if (data.success && data.user) {
if (data.token) localStorage.setItem('kandooreh_token', data.token);
localStorage.setItem('kandooreh_user', JSON.stringify(data.user));
if (onLoginSuccess) onLoginSuccess(data.user);

} else {
        setError(data.message || 'کد وارد شده صحیح نمی‌باشد.');
      }
    } catch (err) {
      submittingRef.current = false;
      setIsSubmitting(false);
      setError('خطا در اعتبارسنجی کد پیامک.');
    }
  };

  const handleOtpChange = (index, value) => {
    if (submittingRef.current) return;
    const cleanVal = toEnDigit(value).replace(/[^0-9]/g, '');

    // اگر کاربر کد را یکجا Paste کرد
    if (cleanVal.length > 1) {
      const digits = cleanVal.slice(0, 4).split('');
      const newOtp = ['', '', '', ''];
      digits.forEach((d, idx) => { newOtp[idx] = d; });
      setOtpCode(newOtp);
      otpCodeRef.current = newOtp;
      const lastIdx = Math.min(digits.length, 4) - 1;
      otpRefs[lastIdx].current?.focus();
      if (digits.length >= 4) {
        setTimeout(() => submitOtp(), 50);
      }
      return;
    }

    const newOtp = [...otpCode];
    newOtp[index] = cleanVal ? cleanVal.slice(-1) : '';
    setOtpCode(newOtp);
    otpCodeRef.current = newOtp;

    if (cleanVal) {
      if (index < 3) {
        otpRefs[index + 1].current?.focus();
      } else {
        setTimeout(() => submitOtp(), 50);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (submittingRef.current) return;
    if (e.key === 'Backspace') {
      if (!otpCode[index] && index > 0) {
        otpRefs[index - 1].current?.focus();
        const newOtp = [...otpCode];
        newOtp[index - 1] = '';
        setOtpCode(newOtp);
      }
    }
  };

  // ─── فراموشی رمز: صفحه بازیابی رمز با OTP (ماژول مجزا) ───
if (view === 'reset') {
return (
<ResetPasswordScreen
onBack={() => { setView('login'); setError(''); }}
onResetSuccess={() => { setView('login'); setError(''); setStep('phone'); }}
/>
);
}
// مرحله ۳: فرم ثبت‌نام کامل (ماژول مجزا)
if (view === 'register') {
return (
<RegisterScreen
targetRole={targetRole}
defaultPhone={phoneNumber}
onBack={() => { setView('login'); setError(''); }}
onRegisterSuccess={(newUser) => {
localStorage.setItem('kandooreh_user', JSON.stringify(newUser));
if (onLoginSuccess) onLoginSuccess(newUser);
}}
/>
);
}
return (
<AuthLayout>
<div className="flex-1 lg:flex-initial w-full flex flex-col justify-between p-6 lg:p-0 select-none overflow-x-hidden relative">
      {/* لوگو و نام کَندوره */}
      <div className="text-center pt-[22vh] lg:pt-0 lg:pb-4 space-y-1 z-10 shrink-0">
        <h1 className="text-4xl sm:text-5xl font-black metallic-gold-text tracking-tight drop-shadow-md">کَندوره</h1>
        <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-black text-[#8C6D1F]">
          <span>❖</span>
          <span>پلتفرم تخصصی پوشاک اصیل هرمزگان</span>
          <span>❖</span>
        </div>
      </div>

      {/* کارت شیشه‌ای فرم ورود */}
      <div className="my-auto py-2 z-10">
        <div className="w-full frost-glass rounded-[2.8rem] p-6 sm:p-7 space-y-4 relative shadow-2xl border border-white/80">
          
          {step === 'phone' ? (
            <form onSubmit={(e) => { loginMethod === 'password' ? handlePasswordLogin(e) : handlePhoneSubmit(e); }} className="space-y-4 text-center">
{/* ─── مرحله ۲: سوییچر لوکس روش ورود ─── */}
<div className="flex rounded-2xl bg-white/60 border-2 border-[#EADFC7] p-1 gap-1">
<button type="button" onClick={() => { setLoginMethod('otp'); setError(''); }} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 transition-all ${loginMethod === 'otp' ? 'bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white shadow-md' : 'text-[#7E7667] hover:bg-white'}`}>
<Smartphone className="w-3.5 h-3.5" />ورود با پیامک
</button>
<button type="button" onClick={() => { setLoginMethod('password'); setError(''); }} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 transition-all ${loginMethod === 'password' ? 'bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white shadow-md' : 'text-[#7E7667] hover:bg-white'}`}>
<KeyRound className="w-3.5 h-3.5" />ورود با رمز عبور
</button>
</div>
{loginMethod === 'otp' && (<>
<div>
<div className="flex items-center justify-center gap-2 text-base font-black text-[#23201C]">
                  <span className="text-[#D4AF37] text-xs">❖</span>
                                  <span>{targetRole === 'tailor' ? 'ورود خیاطان' : 'ورود مشتریان'}</span>
                  <span className="text-[#D4AF37] text-xs">❖</span>
                </div>
                <p className="text-[11px] text-[#7E7667] font-bold mt-1">
                  {targetRole === 'tailor' 
                    ? 'جهت دسترسی به کارتابل سفارش‌ها و پنل خیاطی، شماره خود را وارد کنید'
                    : 'برای مشاهده طرح‌ها و ثبت سفارش دوخت، شماره موبایل خود را وارد کنید'}
                </p>
              </div>

              {error && <div className="p-2.5 rounded-xl bg-red-50 text-red-600 text-[10px] font-bold border border-red-200">{error}</div>}

                                   <div dir="ltr" className="flex items-center bg-white/80 rounded-2xl border-2 border-[#EADFC7] focus-within:border-[#D4AF37] shadow-inner overflow-hidden">
             <div className="px-3.5 py-3 bg-[#FAF6ED] border-r border-[#EADFC7] text-sm font-black text-[#23201C] flex items-center justify-center shrink-0"><span dir="ltr">+۹۸</span></div>
             <input
               type="tel"
               inputMode="numeric"
               maxLength={15}
               value={phoneNumber}
               onChange={(e) => setPhoneNumber(e.target.value)}
               placeholder="917 123 4567"
               className="w-full bg-transparent px-3 py-3 text-sm font-black text-[#23201C] placeholder:text-[#7E7667]/50 focus:outline-none text-left tracking-wider"
               dir="ltr"
             />
           </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-75"
              >
                                          <span>{isSubmitting ? 'در حال ارسال پیامک...' : 'دریافت کد تأیید پیامکی'}</span>
        </button>
</>)}
{loginMethod === 'password' && (
<div className="space-y-4 text-center">
<div>
<div className="flex items-center justify-center gap-2 text-base font-black text-[#23201C]">
<span className="text-[#D4AF37] text-xs">❖</span>
<span>ورود با نام کاربری و رمز</span>
<span className="text-[#D4AF37] text-xs">❖</span>
</div>
<p className="text-[11px] text-[#7E7667] font-bold mt-1">نام کاربری همان شماره موبایل ثبت‌شده است؛ بدون نیاز به پیامک</p>
</div>
{error && <div className="p-2.5 rounded-xl bg-red-50 text-red-600 text-[10px] font-bold border border-red-200">{error}</div>}
<div dir="ltr" className="flex items-center bg-white/80 rounded-2xl border-2 border-[#EADFC7] focus-within:border-[#D4AF37] shadow-inner overflow-hidden">
<div className="px-3 bg-[#FAF6ED] border-r border-[#EADFC7] text-[#B38F24] flex items-center shrink-0"><User className="w-4 h-4" /></div>
<input
type="tel"
inputMode="numeric"
maxLength={15}
value={passUsername}
onChange={(e) => setPassUsername(e.target.value)}
placeholder="0917 123 4567"
className="w-full bg-transparent px-3 py-3 text-sm font-black text-[#23201C] placeholder:text-[#7E7667]/50 focus:outline-none text-left tracking-wider"
dir="ltr"
/>
</div>
<div dir="ltr" className="flex items-center bg-white/80 rounded-2xl border-2 border-[#EADFC7] focus-within:border-[#D4AF37] shadow-inner overflow-hidden">
<div className="px-3 bg-[#FAF6ED] border-r border-[#EADFC7] text-[#B38F24] flex items-center shrink-0"><Lock className="w-4 h-4" /></div>
<input
type={showLoginPass ? 'text' : 'password'}
value={passPassword}
onChange={(e) => setPassPassword(e.target.value)}
placeholder="رمز عبور"
className="w-full bg-transparent px-3 py-3 text-sm font-black text-[#23201C] placeholder:text-[#7E7667]/50 focus:outline-none text-left"
dir="ltr"
/>
<button type="button" onClick={() => setShowLoginPass(v => !v)} className="px-3 text-[#7E7667]">{showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
</div>
<button type="button" onClick={() => { setView('reset'); setError(''); }} className="text-[10px] font-black text-[#0E8388] underline hover:text-[#04474A]">
رمز عبور را فراموش کرده‌اید؟
</button>
<button
type="submit"
disabled={isSubmitting}
className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#0E8388] to-[#04474A] text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-75"
>
<KeyRound className="w-4 h-4" />
<span>{isSubmitting ? 'در حال بررسی...' : 'ورود به پنل'}</span>
</button>
<button
type="button"
onClick={() => { setView('register'); setError(''); }}
className="w-full py-3 rounded-2xl bg-white/70 backdrop-blur-md border border-white text-[#23201C] font-black text-[11px] shadow-sm flex items-center justify-center gap-2 active:scale-95 hover:bg-white"
>
<Sparkles className="w-4 h-4 text-[#B38F24]" />
<span>ثبت‌نام حساب جدید</span>
</button>
</div>
)}
</form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); submitOtp(); }} className="space-y-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-2 text-base font-black text-[#23201C]">
                  <span className="text-[#D4AF37] text-xs">❖</span>
                  <span>تأیید شماره همراه</span>
                  <span className="text-[#D4AF37] text-xs">❖</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#7E7667] font-bold mt-1">
                  <span>کد به شماره {phoneNumber} ارسال شد</span>
                  <button 
                    type="button"
                    onClick={() => { setStep('phone'); setError(''); }}
                    className="text-[#0E8388] font-black underline mr-1"
                  >
                    ویرایش ✏️
                  </button>
                </div>
              </div>

              {error && <div className="p-2.5 rounded-xl bg-red-50 text-red-600 text-[10px] font-bold border border-red-200">{error}</div>}

              {/* باکس‌های کد ۴ رقمی چپ‌به‌راست */}
              <div dir="ltr" style={{ direction: 'ltr' }} className="flex flex-row items-center justify-center gap-2.5 py-2">
                {[0, 1, 2, 3].map((idx) => (
                  <input
                    key={idx}
                    ref={otpRefs[idx]}
                    id={`auth-otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    dir="ltr"
                    style={{ direction: 'ltr', textAlign: 'center' }}
                    value={otpCode[idx]}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onFocus={(e) => e.target.select()}
                    disabled={isSubmitting}
                    className="w-12 h-14 sm:w-13 sm:h-15 rounded-2xl bg-white border-2 border-[#D4AF37]/80 text-center font-black text-2xl font-mono text-[#23201C] focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/25 shadow-md outline-none transition-all disabled:opacity-50"
                  />
                ))}
              </div>

              <div className="text-[11px] font-bold text-[#7E7667]">
                {timer > 0 ? <span>ارسال مجدد کد تا ({formatTimer()})</span> : <button type="button" onClick={handlePhoneSubmit} className="text-[#B38F24] font-black underline">ارسال مجدد پیامک</button>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-75"
              >
                <span>{isSubmitting ? 'در حال بررسی...' : 'تأیید و ورود به کَندوره'}</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* کارت راهنمای شناور خیاطان (Coachmark) */}
      {showTailorGuide && targetRole === 'customer' && step === 'phone' && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] flex flex-col justify-end p-6 pb-20 max-w-md mx-auto animate-in fade-in duration-300">
          <div className="relative w-full rounded-[2.2rem] p-5 pb-6 bg-white/95 backdrop-blur-xl border-2 border-[#D4AF37] shadow-2xl text-center space-y-3 mb-3 animate-in slide-in-from-bottom-5 duration-300">
            
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-gradient-to-tr from-[#D4AF37] via-[#FFF5C0] to-[#AA771C] p-0.5 shadow-lg">
              <div className="w-full h-full bg-[#FAF6ED] rounded-full flex items-center justify-center text-2xl border border-white">
                🧵
              </div>
            </div>

            <div className="pt-4 space-y-1">
              <h3 className="text-sm font-black text-[#B38F24] flex items-center justify-center gap-1">
                <span>✨</span>
                <span>خیاط یا صاحب مزون هستید؟</span>
                <span>✨</span>
              </h3>
              <p className="text-[11px] text-[#524B40] font-bold leading-relaxed px-2">
                برای مدیریت سفارش‌ها، کارگاه و دریافت دستمزد، ابتدا از این بخش وارد پنل خیاطان شوید.
              </p>
            </div>

            <button
              type="button"
              onClick={dismissTailorGuide}
              className="px-6 py-2 rounded-full bg-[#0E8388] text-white text-xs font-black shadow-md shadow-[#0E8388]/30 inline-flex items-center gap-1.5 active:scale-95 hover:bg-[#0b6c70]"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>متوجه شدم</span>
            </button>

            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[12px] border-t-[#D4AF37]"></div>
          </div>
        </div>
      )}

      {/* دکمه پایین با هاله نورانی (Spotlight Glow) */}
      <div className="space-y-2.5 pb-2 text-center relative z-50">
        <button
          onClick={() => { 
            dismissTailorGuide();
            setTargetRole(targetRole === 'customer' ? 'tailor' : 'customer'); 
            setStep('phone'); 
            setError(''); 
          }}
          className={`mx-auto px-6 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-black transition-all ${
            showTailorGuide && targetRole === 'customer' && step === 'phone'
              ? 'bg-white border-2 border-[#D4AF37] text-[#23201C] ring-4 ring-[#D4AF37]/50 shadow-[0_0_30px_rgba(212,175,55,0.9)] scale-105'
              : 'bg-white/70 backdrop-blur-md border border-white text-[#23201C] shadow-sm hover:bg-white active:scale-95'
          }`}
        >
          {targetRole === 'customer' ? <Store className="w-4 h-4 text-[#0E8388]" /> : <User className="w-4 h-4 text-[#B38F24]" />}
                 <span>{targetRole === 'customer' ? 'ورود خیاطان' : 'ورود مشتریان'}</span>
          <ChevronLeft className="w-4 h-4 text-[#B38F24]" />
             </button>
   </div>
 </div>
</AuthLayout>
);
};