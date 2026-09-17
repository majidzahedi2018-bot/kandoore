// src/components/tailor/portfolio/steps/StepImages.jsx
import React from 'react';
import { Camera, Star, X, Plus } from 'lucide-react';
import { PhotoPickerModal } from '../../../common/PhotoPickerModal';
import { StepTitle } from './ui';

const StepImages = ({ images, setImages, pickerOpen, setPickerOpen }) => {
  const handlePicked = (file) => {
    const previewUrl = URL.createObjectURL(file);
    setImages((prev) => [...prev, { id: Date.now() + Math.random(), file, previewUrl, url: null }]);
  };
  const remove = (id) => setImages((prev) => prev.filter((im) => im.id !== id));
  const makeCover = (id) => setImages((prev) => {
    const target = prev.find((im) => im.id === id);
    if (!target) return prev;
    return [target, ...prev.filter((im) => im.id !== id)];
  });
  return (
    <div>
      <StepTitle icon={Camera} title="تصاویر نمونه‌کار" subtitle="تصویر اول = جلد کاتالوگ؛ عکس جزئیات و دوخت اختیاری" />
      <div className="grid grid-cols-3 gap-2">
        {images.map((im, idx) => (
          <div key={im.id} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-[#EADFC7] bg-[#241A12]">
            <img src={im.previewUrl || im.url} alt="" className="w-full h-full object-cover" />
            {idx === 0 ? (
              <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full bg-[#D4AF37] text-white text-[8px] font-black flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-white" />جلد</span>
            ) : (
              <button type="button" onClick={() => makeCover(im.id)} className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full bg-white/85 text-[8px] font-black text-[#B38F24]">انتخاب جلد</button>
            )}
            <button type="button" onClick={() => remove(im.id)} className="absolute bottom-1 left-1 w-6 h-6 rounded-full bg-black/55 text-white flex items-center justify-center"><X className="w-3 h-3" /></button>
          </div>
        ))}
        <button type="button" onClick={() => setPickerOpen(true)} className="aspect-square rounded-2xl border-2 border-dashed border-[#D4AF37]/70 bg-[#D4AF37]/5 text-[#B38F24] flex flex-col items-center justify-center gap-1 active:scale-95">
          <Plus className="w-5 h-5" />
          <span className="text-[9px] font-black">افزودن تصویر</span>
        </button>
      </div>
      <PhotoPickerModal isOpen={pickerOpen} onClose={() => setPickerOpen(false)} onImageSelected={handlePicked} />
    </div>
  );
};
export default StepImages;