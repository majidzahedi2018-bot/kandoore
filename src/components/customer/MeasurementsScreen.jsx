// src/components/customer/MeasurementsScreen.jsx
import React, { useState, useEffect } from 'react';
import {
Ruler, Plus, Trash2, CloudUpload, X, Sparkles,
Scissors, Shirt, CheckCircle2, RefreshCw, ChevronRight
} from 'lucide-react';
import { measurementsApi } from '../../api/api';
import { useToast } from '../common/ToastSystem';
import { GarmentVisual } from '../common/GarmentVisual';
import { useBackLayer } from '../../hooks/useBackLayer';

// ─── تبدیل ارقام به فارسی / انگلیسی ───
const FA = '۰۱۲۳۴۵۶۷۸۹';
const toFa = (v) => String(v ?? '').replace(/\d/g, (d) => FA[+d]);
const toEn = (v) =>
  String(v ?? '')
    .replace(/[۰-۹]/g, (d) => String(FA.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

// فیلدهای پیش‌فرض برای دفترچه‌های قدیمی که fields_json ندارند
const LEGACY_FIELDS = (p) => [
  { label: 'دور دمپا (مچ پا)', value: p.ankleCuff ?? '22' },
  { label: 'قد دمپای دوزی', value: p.cuffHeight ?? '18' },
  { label: 'قد کل شلوار', value: p.pantLength ?? '95' },
  { label: 'دور باسن', value: p.hip ?? '98' },
  { label: 'قد پیراهن', value: p.dressLength ?? '115' },
  { label: 'عرض سرشانه', value: p.shoulder ?? '40' },
  { label: 'دور سینه', value: p.chest ?? '92' },
  { label: 'قد آستین', value: p.sleeve ?? '58' },
];

// نرمال‌سازی هر پروفایل به شکل { id, name, isDefault, fields[] }
const normalize = (p) => ({
  id: p.id,
  name: p.name || 'دفترچه بدون نام',
  isDefault: !!p.isDefault,
  fields:
    Array.isArray(p.fields) && p.fields.length
      ? p.fields.map((f) => ({ label: f.label || '', value: f.value ?? '' }))
      : LEGACY_FIELDS(p),
});

// ایموجی هر تب بر اساس نام
const tabEmoji = (name) => {
  const n = String(name || '');
  if (n.includes('شلوار')) return '👖';
  if (n.includes('پیراهن') || n.includes('کندوره')) return '👗';
  return '📏';
};

export const MeasurementsScreen = ({ currentUser }) => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newFields, setNewFields] = useState([{ label: '', value: '' }]);

  // بارگذاری دفترچه‌ها از دیتابیس
  const load = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const res = await measurementsApi.getByUser(currentUser.id);
      if (res.success && res.profiles) {
        const list = res.profiles.map(normalize);
        setProfiles(list);
        setActiveId((prev) => (list.some((p) => p.id === prev) ? prev : list[0]?.id ?? null));
      }
    } catch (e) {
      console.error('Error fetching measurements:', e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [currentUser?.id]);

  const active = profiles.find((p) => p.id === activeId) || null;
  useBackLayer(showAdd, () => setShowAdd(false));

  // تغییر مقدار یک فیلد در تب فعال
  const setFieldValue = (idx, val) => {
    setProfiles((ps) =>
      ps.map((p) =>
        p.id === activeId
          ? { ...p, fields: p.fields.map((f, i) => (i === idx ? { ...f, value: val } : f)) }
          : p
      )
    );
  };

  // ذخیرهٔ واقعی ابری
  const handleSave = async () => {
    if (!active || saving) return;
    setSaving(true);
    try {
      const fields = active.fields.map((f) => ({ label: f.label, value: toEn(f.value) }));
      const res = await measurementsApi.save({
        id: active.id,
        user_id: currentUser.id,
        name: active.name,
        fields,
      });
      if (res.success) {
        toast.success('اندازه‌ها با موفقیت در فضای ابری ذخیره شد ☁️');
        await load();
      } else {
        toast.error(res.message || 'خطا در ذخیره اندازه‌ها');
      }
    } catch (e) {
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setSaving(false);
    }
  };

  // ساخت دفترچه/تب جدید با فیلدهای دلخواه
  const handleCreate = async () => {
    const name = newName.trim();
    const fields = newFields
      .filter((f) => f.label.trim())
      .map((f) => ({ label: f.label.trim(), value: toEn(f.value) }));
    if (!name || !fields.length) {
      toast.warning('نام دفترچه و حداقل یک اندازه الزامی است.');
      return;
    }
    try {
      const res = await measurementsApi.createProfile(currentUser.id, name, fields);
      if (res.success) {
        toast.success('دفترچه جدید ساخته شد ✨');
        setShowAdd(false);
        setNewName('');
        setNewFields([{ label: '', value: '' }]);
        await load();
        if (res.id) setActiveId(res.id);
      } else {
        toast.error(res.message || 'خطا در ساخت دفترچه');
      }
    } catch (e) {
      toast.error('خطا در ارتباط با سرور');
    }
  };

  // حذف دفترچه (با تأیید)
  const handleDelete = async (p) => {
    if (!window.confirm(`دفترچه «${p.name}» برای همیشه حذف شود؟`)) return;
    try {
      const res = await measurementsApi.deleteProfile(p.id, currentUser.id);
      if (res.success) {
        toast.success('دفترچه حذف شد');
        await load();
      } else {
        toast.error(res.message || 'خطا در حذف');
      }
    } catch (e) {
      toast.error('خطا در ارتباط با سرور');
    }
  };

  if (loading) {
    return (
      <div className="pb-32 pt-10 text-center space-y-3">
        <RefreshCw className="w-7 h-7 text-[#D4AF37] animate-spin mx-auto" />
        <p className="text-xs font-black text-[#7E7667]">در حال دریافت دفترچه‌های اندازه...</p>
      </div>
    );
  }

  return (
    <div className="pb-32 pt-2 px-4 max-w-md mx-auto select-none space-y-4">
      {/* هدر */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Ruler className="w-5 h-5 text-[#B38F24]" />
          <h1 className="text-lg font-black text-[#23201C]">دفترچه اندازه‌های من</h1>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>تب جدید</span>
        </button>
      </div>

      {/* تب‌های پویای دفترچه‌ها */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {profiles.map((p) => {
          const isActive = p.id === activeId;
          return (
            <button
              key={p.id}
              onClick={() => setActiveId(p.id)}
              className={`shrink-0 px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white shadow-md scale-[1.02]'
                  : 'khaliji-card-glass text-[#7E7667] border border-[#EADFC7]'
              }`}
            >
              <span>{tabEmoji(p.name)}</span>
              <span>{p.name}</span>
              {p.isDefault && <Sparkles className="w-3 h-3" />}
            </button>
          );
        })}
      </div>

      {/* کارت راهنمای تصویری تب فعال */}
      {active && (
        <div className="khaliji-card-glass rounded-[2.5rem] p-4 border border-[#EADFC7] shadow-sm">
          <div className="flex items-center justify-between">
                       <div className="w-[42%] h-40 bg-[#FAF7F0] rounded-3xl border border-[#EADFC7] relative shadow-inner overflow-hidden">
             <GarmentVisual
               name={active.name}
               className="absolute inset-0"
               fallbackEmoji={tabEmoji(active.name)}
             />
             <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-white/85 backdrop-blur-sm border border-[#D4AF37]/40 text-[9px] font-black text-[#B38F24] shadow-sm z-10 whitespace-nowrap">
               {active.name}
             </div>
           </div>
            <div className="w-[54%] space-y-2 text-right pr-1">
              {active.fields.slice(0, 4).map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#0E8388] text-white flex items-center justify-center text-xs font-black shrink-0">
                    {toFa(i + 1)}
                  </div>
                  <span className="text-xs font-black text-[#23201C] truncate">{f.label}</span>
                </div>
              ))}
              {active.fields.length > 4 && (
                <span className="text-[10px] text-[#7E7667] font-bold block">
                  و {toFa(active.fields.length - 4)} اندازه دیگر...
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* اینپوت‌های اندازه تب فعال */}
      {active && (
        <div className="grid grid-cols-2 gap-3">
          {active.fields.map((f, i) => (
            <div key={i} className="khaliji-card-glass rounded-3xl p-3.5 border border-[#EADFC7] shadow-sm space-y-2 text-right">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#7E7667] font-bold">cm</span>
                <span className="text-xs font-black text-[#23201C] truncate">{f.label}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-2xl">{i % 2 === 0 ? '📐' : '✨'}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={toFa(f.value)}
                  onChange={(e) => setFieldValue(i, e.target.value)}
                  className="w-20 text-center font-black text-2xl bg-transparent text-[#23201C] focus:outline-none border-b-2 border-[#D4AF37]"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* دکمه ذخیره ابری */}
      {active && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 active:scale-98 disabled:opacity-60"
        >
          {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CloudUpload className="w-5 h-5" />}
          <span>{saving ? 'در حال ذخیره...' : 'ذخیره و به‌روزرسانی ابری اندازه‌ها'}</span>
        </button>
      )}

      {/* حذف دفترچه فعال */}
      {active && !active.isDefault && (
        <button
          onClick={() => handleDelete(active)}
          className="w-full py-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-black flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Trash2 className="w-4 h-4" />
          <span>حذف این دفترچه</span>
        </button>
      )}

      {/* مودال ساخت تب جدید با فیلدهای دلخواه */}
        {showAdd && (
    <div className="fixed inset-0 z-[60] bg-[#F8F5EE] flex flex-col justify-between p-0 select-none overflow-hidden max-w-md mx-auto shadow-2xl border-x border-[#EADFC7]">
      {/* هدر با دکمه برگشت، هم‌سطح بقیهٔ مودال‌ها */}
      <div className="p-4 bg-white/80 backdrop-blur-md border-b border-[#EADFC7] flex items-center justify-between z-10 shrink-0">
        <button
          onClick={() => setShowAdd(false)}
          className="w-10 h-10 rounded-full khaliji-card-glass flex items-center justify-center text-[#B38F24] border border-[#EADFC7] shadow-sm active:scale-90"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-black text-[#23201C]">ساخت دفترچه / تب جدید</h1>
        <div className="w-10" />
      </div>
      {/* محتوای اسکرول‌شونده */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 pb-28">
            <div>
              <label className="text-[10px] font-black text-[#7E7667] block mb-1">نام دفترچه (مثلاً: شلوار دامادی، پیراهن مجلسی):</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="نام لباس یا دفترچه..."
                className="w-full p-3 rounded-2xl bg-white border border-[#EADFC7] text-xs font-bold text-[#23201C] focus:outline-none text-right"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#7E7667] block">اندازه‌ها (نام + مقدار):</label>
              {newFields.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={f.label}
                    onChange={(e) => setNewFields((fs) => fs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                    placeholder={`نام اندازه ${toFa(i + 1)} (مثلاً دور کمر)`}
                    className="flex-1 p-2.5 rounded-xl bg-white border border-[#EADFC7] text-xs font-bold focus:outline-none text-right"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={toFa(f.value)}
                    onChange={(e) => setNewFields((fs) => fs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                    placeholder="cm"
                    className="w-16 p-2.5 rounded-xl bg-white border border-[#EADFC7] text-xs font-black text-center focus:outline-none"
                  />
                  <button onClick={() => setNewFields((fs) => fs.filter((_, j) => j !== i))} className="text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setNewFields((fs) => [...fs, { label: '', value: '' }])}
                className="w-full py-2 rounded-xl bg-[#FAF6ED] border border-dashed border-[#D4AF37] text-[#B38F24] text-xs font-black flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن اندازه دیگر</span>
              </button>
            </div>
                  </div>
      {/* فوتر ثابت با دکمه ساخت، بالای ناوبری و بدون هم‌پوشانی */}
      <div className="p-4 bg-white/95 backdrop-blur-xl border-t border-[#EADFC7] shadow-2xl z-20 shrink-0">
        <button
          onClick={handleCreate}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white text-xs font-black shadow-md flex items-center justify-center gap-2 active:scale-95"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>ساخت دفترچه</span>
        </button>
      </div>
    </div>
  )}
    </div>
  );
};