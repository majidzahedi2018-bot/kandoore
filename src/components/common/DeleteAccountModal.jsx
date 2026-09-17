// src/components/common/DeleteAccountModal.jsx
import React, { useState } from 'react';
import { X, ShieldAlert, Database, Trash2, Smartphone, ChevronRight, Check, AlertTriangle, Lock, UserX } from 'lucide-react';
import { API_BASE } from '../../api/api';
import { useToast } from '../common/ToastSystem';

/* ─────────────────────────────────────────────────────────────
مودال حذف/غیرفعال‌سازی حساب کاربری — ویزارد سه‌گامی ایمن
گام ۱: انتخاب محدوده (غیرفعال‌سازی با حفظ اطلاعات | حذف کامل)
گام ۲: تأیید هویت با کد پیامکی
گام ۳: تأیید نهایی (با چک‌باکس آگاهی برای حذف کامل)
───────────────────────────────────────────────────────────── */
export const DeleteAccountModal = ({ isOpen, onClose, currentUser, onDeleted }) => {
const { toast } = useToast();
const [step, setStep] = useState(1); // 1 scope | 2 otp | 3 confirm
const [scope, setScope] = useState('deactivate'); // 'deactivate' | 'delete'
const [code, setCode] = useState('');
const [agree, setAgree] = useState(false);
const [error, setError] = useState('');
const [isSending, setIsSending] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);
const [codeSent, setCodeSent] = useState(false);

const phone = currentUser?.username || '';

const resetAll = () => {
setStep(1); setScope('deactivate'); setCode(''); setAgree(false);
setError(''); setCodeSent(false); setIsSending(false); setIsSubmitting(false);
};

if (!isOpen) return null;

const handleClose = () => { resetAll(); onClose(); };
const goBack = () => { setError(''); setStep(s => Math.max(1, s - 1)); };

// ─── گام ۲: ارسال کد تأیید به شماره حساب ───
const handleSendCode = async () => {
setError('');
if (!phone) { setError('شماره موبایل حساب یافت نشد.'); return; }
setIsSending(true);
try {
const res = await fetch(`${API_BASE}/auth.php`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ action: 'send_otp', phone })
});
const data = await res.json();
setIsSending(false);
if (data.success) { setCodeSent(true); toast.success('کد تأیید به شماره شما پیامک شد.'); }
else setError(data.message || 'خطا در ارسال پیامک.');
} catch {
setIsSending(false);
setError('خطا در برقراری ارتباط با سرور.');
}
};

// ─── گام ۳: اجرای نهایی (غیرفعال‌سازی یا حذف کامل) ───
const handleFinal = async () => {
setError('');
if (code.length < 4) { setError('کد تأیید ۴ رقمی را وارد کنید.'); return; }
if (scope === 'delete' && !agree) { setError('برای حذف کامل، ابتدا تأییدیه آگاهی از حذف دائم را علامت بزنید.'); return; }
setIsSubmitting(true);
try {
const res = await fetch(`${API_BASE}/auth.php`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
action: scope === 'delete' ? 'delete_account' : 'deactivate_account',
user_id: currentUser?.id,
phone,
code
})
});
const data = await res.json();
setIsSubmitting(false);
if (data.success) {
toast.success(scope === 'delete' ? 'حساب شما و همه اطلاعات آن برای همیشه حذف شد.' : 'حساب شما غیرفعال شد؛ اطلاعات شما محفوظ است و با ورود مجدد فعال می‌شود.');
resetAll();
if (onDeleted) onDeleted();
} else {
setError(data.message || 'خطا در انجام عملیات.');
}
} catch {
setIsSubmitting(false);
setError('خطا در برقراری ارتباط با سرور.');
}
};

const stepTitles = ['انتخاب محدوده', 'تأیید هویت', 'تأیید نهایی'];

return (
<div dir="rtl" className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-[3px] flex items-end sm:items-center justify-center p-0 sm:p-6">
<div className="w-full max-w-md bg-[#FBF7EF] rounded-t-[2.5rem] sm:rounded-[2.5rem] border-2 border-[#D4AF37]/60 shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">

  {/* ═══ هدر: عنوان + بستن ═══ */}
  <div className="p-4 bg-white/80 backdrop-blur-md border-b border-[#EADFC7] flex items-center justify-between shrink-0">
    <button type="button" onClick={handleClose} className="w-10 h-10 rounded-full bg-white border border-[#EADFC7] flex items-center justify-center text-[#7E7667] shadow-sm active:scale-90">
      <X className="w-5 h-5" />
    </button>
    <div className="flex items-center gap-2">
      <span className="text-[#D4AF37] text-xs">❖</span>
      <h1 className="text-sm font-black text-[#23201C]">مدیریت و حذف حساب کاربری</h1>
      <span className="text-[#D4AF37] text-xs">❖</span>
    </div>
    <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
      <ShieldAlert className="w-5 h-5 text-red-500" />
    </div>
  </div>

  {/* ═══ نشانگر سه گام ═══ */}
  <div className="px-4 pt-3 pb-1 flex items-center justify-center gap-2 shrink-0">
    {[1, 2, 3].map(s => (
      <React.Fragment key={s}>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black border-2 transition-all ${step === s ? 'bg-gradient-to-r from-[#E5C158] to-[#AA771C] text-white border-[#D4AF37] shadow-md' : step > s ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white/70 text-[#7E7667] border-[#EADFC7]'}`}>
          {step > s ? <Check className="w-3 h-3 stroke-[3]" /> : <span>{s.toLocaleString('fa-IR')}</span>}
          <span>{stepTitles[s - 1]}</span>
        </div>
        {s < 3 && <span className="w-4 h-[2px] bg-[#D4AF37]/40 rounded-full"></span>}
      </React.Fragment>
    ))}
  </div>

  {/* ═══ محتوای اسکرول‌شونده گام‌ها ═══ */}
  <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
    {error && <div className="p-2.5 rounded-xl bg-red-50 text-red-600 text-[10px] font-bold border border-red-200 text-right">{error}</div>}

    {/* ─── گام ۱: انتخاب محدوده ─── */}
    {step === 1 && (
      <>
        <button type="button" onClick={() => setScope('deactivate')} className={`w-full text-right rounded-[1.8rem] border-2 p-4 space-y-1.5 transition-all ${scope === 'deactivate' ? 'bg-[#0E8388]/10 border-[#0E8388] shadow-md' : 'bg-white border-[#EADFC7]'}`}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-black text-[#0E8388]">
              <UserX className="w-4 h-4" />غیرفعال‌سازی حساب (پیشنهادی)
            </span>
            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${scope === 'deactivate' ? 'bg-[#0E8388] border-[#0E8388]' : 'bg-white border-[#EADFC7]'}`}>
              {scope === 'deactivate' && <Check className="w-3 h-3 text-white stroke-[3]" />}
            </span>
          </div>
          <p className="text-[10px] text-[#524B40] font-bold leading-relaxed">حساب موقتاً بسته می‌شود؛ سفارش‌ها، چت‌ها، نظرات و امتیازها <span className="text-[#0E8388]">محفوظ می‌مانند</span> و با ورود مجدد به‌صورت خودکار فعال می‌شوید.</p>
        </button>
        <button type="button" onClick={() => setScope('delete')} className={`w-full text-right rounded-[1.8rem] border-2 p-4 space-y-1.5 transition-all ${scope === 'delete' ? 'bg-red-50 border-red-500 shadow-md' : 'bg-white border-[#EADFC7]'}`}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-black text-red-600">
              <Trash2 className="w-4 h-4" />حذف کامل و دائمی
            </span>
            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${scope === 'delete' ? 'bg-red-500 border-red-500' : 'bg-white border-[#EADFC7]'}`}>
              {scope === 'delete' && <Check className="w-3 h-3 text-white stroke-[3]" />}
            </span>
          </div>
          <p className="text-[10px] text-[#524B40] font-bold leading-relaxed">همه‌چیز برای همیشه پاک می‌شود: سفارش‌ها، چت‌ها، نظرات، استوری‌ها، نمونه‌کارها و امتیاز باشگاه. <span className="text-red-600">این عمل قابل بازگشت نیست.</span></p>
        </button>
        <button type="button" onClick={() => { setError(''); setStep(2); }} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95">
          <ChevronRight className="w-4 h-4 rotate-180" />
          <span>ادامه</span>
        </button>
      </>
    )}

    {/* ─── گام ۲: تأیید هویت با کد پیامکی ─── */}
    {step === 2 && (
      <>
        <div className="khaliji-card-glass rounded-[1.8rem] p-4 border border-[#EADFC7] space-y-2.5 text-right">
          <div className="flex items-center gap-1.5 text-[11px] font-black text-[#23201C]">
            <Smartphone className="w-4 h-4 text-[#0E8388]" />
            <span>تأیید هویت با کد پیامکی</span>
          </div>
          <p className="text-[10px] text-[#7E7667] font-bold leading-relaxed">برای امنیت حساب، کد ۴ رقمی به شماره <span className="text-[#0E8388] font-black" dir="ltr">{phone}</span> ارسال می‌شود.</p>
          {!codeSent ? (
            <button type="button" onClick={handleSendCode} disabled={isSending} className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#0E8388] to-[#04474A] text-white text-xs font-black shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-75">
              <Smartphone className="w-4 h-4" />
              <span>{isSending ? 'در حال ارسال...' : 'ارسال کد تأیید'}</span>
            </button>
          ) : (
            <>
              <input type="text" inputMode="numeric" maxLength={4} value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9۰-۹]/g, ''))} placeholder="کد ۴ رقمی" className="w-full bg-white rounded-2xl border-2 border-[#EADFC7] focus:border-[#D4AF37] px-3 py-3 text-center font-black text-xl tracking-[0.5em] text-[#23201C] focus:outline-none" dir="ltr" />
              <button type="button" onClick={handleSendCode} disabled={isSending} className="w-full text-[9px] text-[#7E7667] font-bold underline">
                {isSending ? 'در حال ارسال...' : 'ارسال مجدد کد'}
              </button>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => { setError(''); setStep(3); }} disabled={!codeSent || code.length < 4} className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
            <span>ادامه</span>
          </button>
          <button type="button" onClick={goBack} className="px-5 py-3.5 rounded-2xl bg-white border border-[#EADFC7] text-[#7E7667] text-xs font-black active:scale-95">
            بازگشت
          </button>
        </div>
      </>
    )}

    {/* ─── گام ۳: تأیید نهایی ─── */}
    {step === 3 && (
      <>
        <div className={`rounded-[1.8rem] border-2 p-4 space-y-2 text-right ${scope === 'delete' ? 'bg-red-50 border-red-300' : 'bg-[#0E8388]/10 border-[#0E8388]/40'}`}>
          <div className={`flex items-center gap-1.5 text-[11px] font-black ${scope === 'delete' ? 'text-red-600' : 'text-[#0E8388]'}`}>
            {scope === 'delete' ? <Trash2 className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
            <span>{scope === 'delete' ? 'حذف کامل و دائمی حساب' : 'غیرفعال‌سازی موقت حساب'}</span>
          </div>
          {scope === 'delete' ? (
            <ul className="space-y-1 text-[10px] text-[#524B40] font-bold list-disc pr-4">
              <li>سفارش‌ها و تاریخچه چت‌ها حذف می‌شوند</li>
              <li>نظرات، استوری‌ها و نمونه‌کارها پاک می‌شوند</li>
              <li>امتیاز باشگاه و کیف پول از بین می‌رود</li>
              <li>امکان بازگشت وجود ندارد</li>
            </ul>
          ) : (
            <p className="text-[10px] text-[#524B40] font-bold leading-relaxed">اطلاعات شما محفوظ می‌ماند و با ورود مجدد، حساب به‌صورت خودکار فعال می‌شود.</p>
          )}
        </div>
        {scope === 'delete' && (
          <button type="button" onClick={() => setAgree(v => !v)} className="w-full flex items-center gap-2.5 p-3 rounded-2xl bg-white border-2 border-red-200 active:scale-[0.98]">
            <span className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${agree ? 'bg-red-500 border-red-500' : 'bg-white border-[#EADFC7]'}`}>
              {agree && <Check className="w-4 h-4 text-white stroke-[3]" />}
            </span>
            <span className="text-[10px] font-black text-[#524B40] text-right leading-relaxed">می‌دانم این عمل <span className="text-red-600">قابل بازگشت نیست</span> و همه اطلاعاتم برای همیشه حذف می‌شود.</span>
          </button>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={handleFinal} disabled={isSubmitting || (scope === 'delete' && !agree)} className={`flex-1 py-3.5 rounded-2xl text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 ${scope === 'delete' ? 'bg-gradient-to-r from-red-500 to-red-700' : 'bg-gradient-to-r from-[#0E8388] to-[#04474A]'}`}>
            {scope === 'delete' ? <Trash2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>{isSubmitting ? 'در حال پردازش...' : scope === 'delete' ? 'حذف دائمی حساب' : 'غیرفعال‌سازی حساب'}</span>
          </button>
          <button type="button" onClick={goBack} className="px-5 py-3.5 rounded-2xl bg-white border border-[#EADFC7] text-[#7E7667] text-xs font-black active:scale-95">
            بازگشت
          </button>
        </div>
      </>
    )}
  </div>

  {/* ═══ پانوشت اعتماد ═══ */}
  <div className="p-3 bg-white/80 border-t border-[#EADFC7] text-center shrink-0">
    <p className="text-[8px] text-[#7E7667] font-bold">این عملیات فقط با کد تأیید شماره شما انجام می‌شود ⚜️</p>
  </div>
</div>
</div>
);
};