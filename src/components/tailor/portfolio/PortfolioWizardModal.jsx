// src/components/tailor/portfolio/PortfolioWizardModal.jsx
import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Image as ImageIcon, Shirt, Ruler, Sparkles, Palette, MapPin, PenLine, CheckCircle2, Check } from 'lucide-react';
import { designsApi, uploadImage } from '../../../api/api';
import { useToast } from '../../common/ToastSystem';
import { generateTitle, MODELS_BY_TYPE, ensureCustomGarmentTypes } from '../../../data/portfolioTaxonomy';
import StepImages from './steps/StepImages';
import StepGarment from './steps/StepGarment';
import StepModel from './steps/StepModel';
import StepEmbellishments from './steps/StepEmbellishments';
import StepSpecs from './steps/StepSpecs';
import StepRegion from './steps/StepRegion';
import StepTitleDesc from './steps/StepTitleDesc';
import StepPreview from './steps/StepPreview';

const STEPS = [
  { id: 1, label: 'تصاویر', icon: ImageIcon },
  { id: 2, label: 'پوشاک', icon: Shirt },
  { id: 3, label: 'مدل', icon: Ruler },
  { id: 4, label: 'تزئینات', icon: Sparkles },
  { id: 5, label: 'مشخصات', icon: Palette },
  { id: 6, label: 'منطقه', icon: MapPin },
  { id: 7, label: 'عنوان', icon: PenLine },
  { id: 8, label: 'انتشار', icon: CheckCircle2 },
];

const emptyForm = {
  images: [], garmentType: '', garmentModel: '', customModel: '',
  embellishments: [], fabrics: [], colorName: '', colorHex: '', occasions: [],
  region: '', chadorWrap: '', burqaDecor: '', setPieces: [],
  title: '', titleTouched: false, description: '', price: '480000', days: '۳ تا ۵ روز',
};

export const PortfolioWizardModal = ({ isOpen, onClose, tailorUser, editingDesign = null, onPublishSuccess }) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [pickerOpen, setPickerOpen] = useState(false);
const [publishing, setPublishing] = useState(false);
const [customGarments, setCustomGarments] = useState(() => {
  try { return JSON.parse(localStorage.getItem(`kandooreh_custom_garments_${tailorUser?.id || 0}`) || '[]'); } catch { return []; }
});
useEffect(() => { ensureCustomGarmentTypes(customGarments); }, [customGarments]);
const handleAddCustomGarment = (g) => {
  const next = [...customGarments, g];
  setCustomGarments(next);
  try { localStorage.setItem(`kandooreh_custom_garments_${tailorUser?.id || 0}`, JSON.stringify(next)); } catch {}
  ensureCustomGarmentTypes([g]);
  setForm((f) => ({ ...f, garmentType: g.id, garmentModel: 'custom', customModel: '' }));
};
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  // پریفیل حالت ویرایش
  useEffect(() => {
    if (!isOpen) return;
    if (editingDesign) {
      setForm({
        ...emptyForm,
        images: editingDesign.image ? [{ id: 'cover', file: null, previewUrl: editingDesign.image, url: editingDesign.image }] : [],
        garmentType: editingDesign.garmentType || '',
        garmentModel: editingDesign.garmentModel || '',
        customModel: editingDesign.customModel || '',
        embellishments: editingDesign.embellishments || [],
        fabrics: editingDesign.fabrics || [],
        colorName: editingDesign.colorName || '',
        colorHex: editingDesign.colorHex || '',
        occasions: editingDesign.occasions || [],
        region: editingDesign.region || '',
        chadorWrap: editingDesign.chadorWrap || '',
        burqaDecor: editingDesign.burqaDecor || '',
        setPieces: editingDesign.setPieces || [],
        title: editingDesign.title || '',
        titleTouched: true,
        description: editingDesign.description || '',
        price: editingDesign.price ? String(editingDesign.price) : '480000',
        days: editingDesign.deliveryDays || '۳ تا ۵ روز',
      });
    } else {
      setForm(emptyForm);
    }
    setStep(1);
  }, [isOpen, editingDesign]);

  // عنوان هوشمند زنده
  useEffect(() => {
    if (!form.titleTouched) setForm((f) => ({ ...f, title: generateTitle(f) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.garmentType, form.garmentModel, form.customModel, form.embellishments, form.occasions, form.colorName, form.setPieces, form.titleTouched]);

  const coverUrl = form.images[0]?.previewUrl || form.images[0]?.url || null;

  const validate = (s) => {
switch (s) {
case 1: return form.images.length >= 1 ? true : 'حداقل یک تصویر برای جلد نمونه‌کار الزامی است.';
case 2: return form.garmentType ? true : 'لطفاً نوع پوشاک را انتخاب کنید.';
case 3: {
const modelOk = Boolean(form.garmentModel) && (form.garmentModel !== 'custom' || Boolean((form.customModel || '').trim()));
return modelOk ? true : 'لطفاً یک مدل انتخاب یا ثبت کنید.';
}
case 6:
if (form.garmentType === 'chador' && !form.chadorWrap) return 'شیوه بستن چادر الزامی است.';
if (form.garmentType === 'burqa' && !form.burqaDecor) return 'نوع تزئین برقع الزامی است.';
if (form.garmentType === 'set' && form.setPieces.length === 0) return 'حداقل یک قطعه ست انتخاب کنید.';
return true;
case 7: return form.title.trim() ? true : 'عنوان نمونه‌کار الزامی است.';
default: return true;
}
};

  const goNext = () => {
const ok = validate(step);
if (typeof ok === 'string') { toast.warning(ok); return; }
setStep((s) => Math.min(8, s + 1));
};

  const publish = async () => {
const ok = validate(7);
if (typeof ok === 'string') { toast.warning(ok); setStep(7); return; }
    if (publishing) return;
    setPublishing(true);
    try {
      const uploaded = [];
      for (const im of form.images) {
        if (im.url) { uploaded.push(im.url); continue; }
        const up = await uploadImage(im.file, 'designs', tailorUser?.id || 2);
        if (up.success && up.url) uploaded.push(up.url);
      }
      if (uploaded.length === 0) { toast.error('آپلود تصویر ناموفق بود؛ دوباره تلاش کنید.'); setPublishing(false); return; }
      const cleanPrice = parseInt(String(form.price).replace(/[^0-9]/g, '')) || 0;
      const categoryMap = { pirahan: 'کندوره', shalwar: 'شلوار بندری', chador: 'چادر بندری' };
const isCustomType = customGarments.some((c) => c.id === form.garmentType);
      const payload = {
        user_id: tailorUser?.id || 2,
        title: form.title.trim(),
        category: categoryMap[form.garmentType] || (isCustomType ? form.garmentType : 'بادله و شک'),
        tailor_name: tailorUser?.name || 'کارگاه خیاطی',
        city: tailorUser?.city || 'بندرعباس',
        price: cleanPrice,
        delivery_days: form.days || '۳ تا ۵ روز',
        image_url: uploaded[0],
        extra_images: JSON.stringify(uploaded.slice(1)),
        tags: (form.embellishments || []).join(','),
        garment_type: form.garmentType,
        garment_model: form.garmentModel === 'custom' ? form.customModel.trim() : form.garmentModel,
        embellishments: form.embellishments,
        fabrics: form.fabrics,
        color_name: form.colorName,
        color_hex: form.colorHex,
        occasions: form.occasions,
        region: form.region,
        chador_wrap: form.chadorWrap,
        burqa_decor: form.burqaDecor,
        set_pieces: form.setPieces,
        description: form.description.trim(),
      };
      const res = editingDesign
        ? await designsApi.update({ id: editingDesign.id, ...payload })
        : await designsApi.create(payload);
      setPublishing(false);
      if (res.success) {
        if (onPublishSuccess) onPublishSuccess(res);
        onClose();
      } else {
        toast.error(res.message || 'خطا در انتشار نمونه‌کار');
      }
    } catch (e) {
      setPublishing(false);
      toast.error('خطا در ارتباط با سرور');
    }
  };

  if (!isOpen) return null;
  const StepComponent = [StepImages, StepGarment, StepModel, StepEmbellishments, StepSpecs, StepRegion, StepTitleDesc, StepPreview][step - 1];
  const stepValue = step === 2 ? form.garmentType : step === 3 ? form.garmentModel : step === 4 ? form.embellishments : undefined;
  const stepChange = (v) => {
if (step === 2) {
const hasModels = (MODELS_BY_TYPE[v] || []).length > 0;
set({ garmentType: v, garmentModel: hasModels ? '' : 'custom', customModel: '' });
}
else if (step === 3) set({ garmentModel: v });
else if (step === 4) set({ embellishments: v });
};

  return (
    <div className="fixed inset-0 z-50 bg-[#F8F5EE] flex flex-col p-0 select-none overflow-hidden max-w-md mx-auto">
      {/* هدر */}
      <div className="p-4 bg-white/80 backdrop-blur-md border-b border-[#EADFC7] flex items-center justify-between z-10 shrink-0">
        <button type="button" onClick={onClose} className="w-10 h-10 rounded-full khaliji-card-glass flex items-center justify-center text-[#B38F24] border border-[#EADFC7] shadow-sm active:scale-90">
          <ChevronRight className="w-5 h-5" />
        </button>
        <h1 className="text-base font-black text-[#23201C]">{editingDesign ? 'ویرایش نمونه‌کار' : 'ثبت نمونه‌کار جدید'}</h1>
        <span className="text-[10px] font-black text-[#B38F24] bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-2.5 py-1 rounded-full">{step.toLocaleString('fa-IR')} / ۸</span>
      </div>

      {/* استپر ۸ گامی */}
      <div className="px-4 pt-3 pb-1 shrink-0">
        <div className="flex items-center">
          {STEPS.map((st, i) => {
            const done = step > st.id;
            const active = step === st.id;
            return (
              <React.Fragment key={st.id}>
                <button type="button" onClick={() => done && setStep(st.id)}
                  className={`flex flex-col items-center gap-1 ${done ? 'cursor-pointer' : active ? '' : 'opacity-45'}`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${active ? 'bg-gradient-to-br from-[#E5C158] to-[#AA771C] border-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/30 scale-110' : done ? 'bg-[#0E8388] border-[#0E8388] text-white' : 'bg-white border-[#EADFC7] text-[#7E7667]'}`}>
                    {done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <st.icon className="w-3.5 h-3.5" />}
                  </span>
                  <span className={`text-[8px] font-black ${active ? 'text-[#B38F24]' : 'text-[#7E7667]'}`}>{st.label}</span>
                </button>
                {i < STEPS.length - 1 && <span className={`flex-1 h-[2px] mx-0.5 mb-4 rounded-full ${done ? 'bg-[#0E8388]' : 'bg-[#EADFC7]'}`} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* محتوای گام جاری */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-4 pb-28 space-y-4">
        <StepComponent
          images={form.images}
          setImages={(fn) => setForm((f) => ({ ...f, images: typeof fn === 'function' ? fn(f.images) : fn }))}
          pickerOpen={pickerOpen} setPickerOpen={setPickerOpen}
                 garmentType={form.garmentType}
       customTypes={customGarments}
       onAddCustom={handleAddCustomGarment}
       value={stepValue} onChange={stepChange}
          customValue={form.customModel} onCustomChange={(v) => set({ customModel: v })}
          fabrics={form.fabrics} onFabrics={(v) => set({ fabrics: v })}
          colorName={form.colorName} onColor={(c) => set({ colorName: c.name, colorHex: c.hex })}
          occasions={form.occasions} onOccasions={(v) => set({ occasions: v })}
          region={form.region} onRegion={(v) => set({ region: v })}
          chadorWrap={form.chadorWrap} onChadorWrap={(v) => set({ chadorWrap: v })}
          burqaDecor={form.burqaDecor} onBurqaDecor={(v) => set({ burqaDecor: v })}
          setPieces={form.setPieces} onSetPieces={(v) => set({ setPieces: v })}
          title={form.title} onTitle={(v) => set({ title: v })}
          titleTouched={form.titleTouched} onTitleTouched={(v) => set({ titleTouched: v })}
          description={form.description} onDescription={(v) => set({ description: v })}
          price={form.price} onPrice={(v) => set({ price: v })}
          days={form.days} onDays={(v) => set({ days: v })}
          form={form} coverUrl={coverUrl}
        />
      </div>

      {/* ناوبری پایین */}
      <div className="p-4 bg-white/95 backdrop-blur-xl border-t border-[#EADFC7] shadow-2xl z-20 shrink-0">
        <div className="flex items-center gap-2">
          {step > 1 && (
            <button type="button" onClick={() => setStep((s) => Math.max(1, s - 1))} className="px-4 py-3.5 rounded-2xl bg-white border border-[#EADFC7] text-[#524B40] text-xs font-black flex items-center gap-1 active:scale-95">
              <ChevronRight className="w-4 h-4" /> قبلی
            </button>
          )}
          {step < 8 ? (
            <button type="button" onClick={goNext} className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white font-black text-xs shadow-lg shadow-[#D4AF37]/30 flex items-center justify-center gap-2 active:scale-95">
              مرحله بعد <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" onClick={publish} disabled={publishing} className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#0E8388] to-[#04474A] text-white font-black text-xs shadow-lg shadow-[#0E8388]/30 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70">
              <CheckCircle2 className="w-4 h-4" />
              {publishing ? 'در حال انتشار در کاتالوگ...' : editingDesign ? 'ذخیره تغییرات' : 'انتشار در کاتالوگ عمومی'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};