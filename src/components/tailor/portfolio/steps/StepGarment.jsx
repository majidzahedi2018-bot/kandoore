// src/components/tailor/portfolio/steps/StepGarment.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Shirt, Plus, X } from 'lucide-react';
import { GARMENT_TYPES } from '../../../../data/portfolioTaxonomy';
import { resolveGarmentVisual } from '../../../../data/garmentVisuals';
import { StepTitle } from './ui';

const LS_KEY = 'kandooreh_custom_garments';

// خواندن امن انواع سفارشی از localStorage
const readCustom = () => {
  try {
    const list = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch { return []; }
};

// تصویر واقعی از رجیستری؛ در نبود یا خطا، ایموجی
const GarmentTileMedia = ({ type }) => {
  const [failed, setFailed] = useState(false);
  const visual = resolveGarmentVisual(type.label, type.id);
  if (visual && visual.src && !failed) {
    return (
      <span className="w-11 h-11 rounded-xl overflow-hidden bg-[#FAF6ED] border border-[#EADFC7] shrink-0">
        <img src={visual.src} alt={visual.alt || type.label} loading="lazy" onError={() => setFailed(true)} className="w-full h-full object-cover" />
      </span>
    );
  }
  return <span className="text-2xl leading-none">{type.icon || '🧵'}</span>;
};

const StepGarment = ({ value, onChange }) => {
  const [customTypes, setCustomTypes] = useState(readCustom); // فقط یک‌بار اولیه‌سازی
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newEmoji, setNewEmoji] = useState('🧵');
  const submittingRef = useRef(false); // 🛡️ گارد ضد سابمیت دوبل

  // همگام‌سازی زنده اگر از تب دیگری localStorage تغییر کرد
  useEffect(() => {
    const onStorage = (e) => { if (e.key === LS_KEY) setCustomTypes(readCustom()); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persist = (next) => {
    setCustomTypes(next);
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
  };

  const submitAdd = (e) => {
    e?.preventDefault();
    if (submittingRef.current) return;          // ❌ جلوگیری از فراخوانی دوم
    const label = newLabel.trim();
    if (!label) return;
    const id = `custom_${label}`;
    if (customTypes.some((c) => c.id === id)) { // 🛡️ حذف تکراری: قبلاً هست → فقط انتخابش کن
      onChange(id);
      setShowAdd(false);
      setNewLabel('');
      return;
    }
    submittingRef.current = true;
    persist([...customTypes, { id, label, icon: newEmoji }]);
    onChange(id);
    setNewLabel(''); setNewEmoji('🧵'); setShowAdd(false);
    setTimeout(() => { submittingRef.current = false; }, 400);
  };

  const removeCustom = (id) => {
    persist(customTypes.filter((c) => c.id !== id));
    if (value === id) onChange('');
  };

  return (
    <div>
      <StepTitle icon={Shirt} title="نوع پوشاک" subtitle="گزینه‌های مرحله بعد بر اساس این انتخاب ساخته می‌شوند" />
      <div className="grid grid-cols-3 gap-2">
        {GARMENT_TYPES.map((t) => (
          <button key={t.id} type="button" onClick={() => onChange(t.id)}
            className={`rounded-2xl border-2 p-2.5 flex flex-col items-center gap-1 transition-all ${value === t.id ? 'bg-gradient-to-br from-[#E5C158] to-[#AA771C] border-[#D4AF37] shadow-lg shadow-[#D4AF37]/25 scale-[1.03]' : 'bg-white/80 border-[#EADFC7]'}`}>
            <GarmentTileMedia type={t} />
            <span className={`text-[9px] font-black text-center leading-4 ${value === t.id ? 'text-white' : 'text-[#524B40]'}`}>{t.label}</span>
          </button>
        ))}
        {customTypes.map((c) => (
          <div key={c.id} className="relative">
            <button type="button" onClick={() => onChange(c.id)}
              className={`w-full rounded-2xl border-2 p-2.5 flex flex-col items-center gap-1 transition-all ${value === c.id ? 'bg-gradient-to-br from-[#E5C158] to-[#AA771C] border-[#D4AF37] shadow-lg shadow-[#D4AF37]/25 scale-[1.03]' : 'bg-white/80 border-[#EADFC7]'}`}>
              <GarmentTileMedia type={c} />
              <span className={`text-[9px] font-black text-center leading-4 ${value === c.id ? 'text-white' : 'text-[#524B40]'}`}>{c.label}</span>
            </button>
            <button type="button" onClick={() => removeCustom(c.id)}
              className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm"
              title="حذف این نوع">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setShowAdd(true)}
          className="rounded-2xl border-2 border-dashed border-[#D4AF37]/60 bg-[#FAF6ED]/60 p-2.5 flex flex-col items-center gap-1 transition-all hover:border-[#D4AF37]">
          <span className="w-11 h-11 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center">
            <Plus className="w-5 h-5 text-[#B38F24]" />
          </span>
          <span className="text-[9px] font-black text-center leading-4 text-[#B38F24]">سایر / نوع جدید</span>
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0">
          <form onSubmit={submitAdd} className="bg-[#F8F5EE] w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-5 space-y-4 border border-[#EADFC7] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EADFC7] pb-3">
              <button type="button" onClick={() => setShowAdd(false)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#23201C]"><X className="w-4 h-4" /></button>
              <h3 className="text-sm font-black text-[#23201C]">نوع پوشاک جدید</h3>
            </div>
            <div>
              <label className="text-[10px] font-black text-[#7E7667] block mb-1">نام نوع:</label>
              <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="مثلاً: شلوار دامادی، پیراهن مجلسی..." className="w-full p-3 rounded-2xl bg-white border border-[#EADFC7] text-xs font-bold text-[#23201C] focus:outline-none text-right" />
            </div>
            <div>
              <label className="text-[10px] font-black text-[#7E7667] block mb-1">آیکون:</label>
              <div className="flex flex-wrap gap-1.5">
                {['🧵','👗','👖','🧕','🎽','','🥻','👘'].map((em) => (
                  <button key={em} type="button" onClick={() => setNewEmoji(em)} className={`w-9 h-9 rounded-xl border text-lg flex items-center justify-center ${newEmoji === em ? 'border-[#D4AF37] bg-[#D4AF37]/15' : 'border-[#EADFC7] bg-white'}`}>{em}</button>
                ))}
              </div>
            </div>
            <button type="submit" className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white text-xs font-black shadow-md">افزودن و انتخاب</button>
          </form>
        </div>
      )}
    </div>
  );
};
export default StepGarment;