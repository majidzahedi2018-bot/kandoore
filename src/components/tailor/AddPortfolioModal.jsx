// src/components/tailor/AddPortfolioModal.jsx
import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Camera, BookOpen, Clock, Coins, Calendar, Gem, Check, ChevronDown, Edit3 } from 'lucide-react';
import { PhotoPickerModal } from '../common/PhotoPickerModal';
import { uploadImage, designsApi } from '../../api/api';
import { useToast } from '../common/ToastSystem';

const DESIGN_OPTIONS = [
'مدل بادلهٔ خلیج (شلوار بندری)',
'کندوره زری‌بافی (کرپ مشکی)',
'شلوار بندری مدل نگین',
'کندوره گلابتون‌دوزی خلیجی',
'چادر بندری گلابتون'
];
const AVAILABLE_TAGS = ['گلابتون‌دوزی اعلا', 'بادله تمام پر', 'شک ۶ سانت', 'دوخت با چرخ سنتی'];

export const AddPortfolioModal = ({ isOpen, onClose, tailorUser, onPublishSuccess, editingDesign = null }) => {
const { toast } = useToast();
const isEdit = Boolean(editingDesign);
const [selectedDesign, setSelectedDesign] = useState(DESIGN_OPTIONS[0]);
const [price, setPrice] = useState('۴۸۰٬۰۰۰');
const [days, setDays] = useState('۳ تا ۵ روز');
const [selectedTags, setSelectedTags] = useState(['گلابتون‌دوزی اعلا']);
const [selectedFile, setSelectedFile] = useState(null);
const [previewUrl, setPreviewUrl] = useState(null);
const [existingImage, setExistingImage] = useState(null);
const [showPhotoPicker, setShowPhotoPicker] = useState(false);
const [isPublishing, setIsPublishing] = useState(false);

// پریفیل کامل فرم در حالت ویرایش / ریست در حالت ثبت
useEffect(() => {
if (!isOpen) return;
if (editingDesign) {
setSelectedDesign(editingDesign.title || DESIGN_OPTIONS[0]);
setPrice(String(editingDesign.price || ''));
setDays(editingDesign.deliveryDays || '۳ تا ۵ روز');
setSelectedTags(Array.isArray(editingDesign.tags) && editingDesign.tags.length ? editingDesign.tags : ['گلابتون‌دوزی اعلا']);
setExistingImage(editingDesign.image || null);
} else {
setSelectedDesign(DESIGN_OPTIONS[0]);
setPrice('۴۸۰٬۰۰۰');
setDays('۳ تا ۵ روز');
setSelectedTags(['گلابتون‌دوزی اعلا']);
setExistingImage(null);
}
setPreviewUrl(null);
setSelectedFile(null);
}, [isOpen, editingDesign]);

if (!isOpen) return null;
const toggleTag = (tag) => {
if (selectedTags.includes(tag)) setSelectedTags(selectedTags.filter(t => t !== tag));
else setSelectedTags([...selectedTags, tag]);
};
const handleImageSelected = (file) => {
setSelectedFile(file);
setPreviewUrl(URL.createObjectURL(file));
};
const handlePublish = async () => {
setIsPublishing(true);
try {
let finalImageUrl = isEdit ? (existingImage || 'bg-[#0E8388]') : 'bg-[#0E8388]';
if (selectedFile) {
const uploadRes = await uploadImage(selectedFile, 'designs', tailorUser?.id || 2);
if (uploadRes.success && uploadRes.url) finalImageUrl = uploadRes.url;
else { toast.error('⚠️ خطا در آپلود عکس: ' + (uploadRes.message || 'لطفاً دوباره تلاش کنید.')); setIsPublishing(false); return; }
}
const rawPrice = parseInt(String(price).replace(/[^0-9۰-۹]/g, '')) || 0;
const category = selectedDesign.includes('شلوار') ? 'شلوار بندری' : selectedDesign.includes('کندوره') ? 'کندوره' : selectedDesign.includes('چادر') ? 'چادر بندری' : 'بادله و شک';
if (isEdit) {
const res = await designsApi.update({
id: editingDesign.id,
user_id: tailorUser?.id || 2,
title: selectedDesign,
category,
price: rawPrice,
delivery_days: days,
image_url: finalImageUrl,
tags: selectedTags
});
setIsPublishing(false);
if (res.success) {
if (onPublishSuccess) onPublishSuccess(res);
onClose();
} else toast.error(res.message || 'خطا در ذخیره تغییرات');
} else {
const res = await designsApi.create({
user_id: tailorUser?.id || 2,
title: selectedDesign,
category,
tailor_name: tailorUser?.name || 'خیاطی ماهور',
city: tailorUser?.city || 'بندرعباس',
price: rawPrice,
delivery_days: days,
image_url: finalImageUrl,
tags: selectedTags
});
setIsPublishing(false);
if (res.success) {
if (onPublishSuccess) onPublishSuccess(res);
onClose();
} else toast.error(res.message || 'خطا در ثبت نمونه‌کار');
}
} catch (e) {
setIsPublishing(false);
toast.error('خطا در ارتباط با سرور');
}
};
const shownImage = previewUrl || existingImage;
return (
<div className="fixed inset-0 z-50 bg-[#F8F5EE] flex flex-col justify-between p-0 select-none overflow-hidden max-w-md mx-auto">
  {/* هدر */}
  <div className="p-4 bg-white/80 backdrop-blur-md border-b border-[#EADFC7] flex items-center justify-between z-10 shrink-0">
    <button onClick={onClose} className="w-10 h-10 rounded-full khaliji-card-glass flex items-center justify-center text-[#B38F24] border border-[#EADFC7] shadow-sm active:scale-90 transition-transform">
      <ChevronRight className="w-5 h-5" />
    </button>
    <h1 className="text-base font-black text-[#23201C] tracking-tight">
      {isEdit ? `ویرایش نمونه‌کار #${editingDesign.id}` : 'ثبت نمونه‌کار جدید در هاست'}
    </h1>
    <div className="w-10 h-10 rounded-full flex items-center justify-center text-[#B38F24] text-xl">{isEdit ? <Edit3 className="w-5 h-5" /> : <div className="w-10"></div>}</div>
  </div>
  {/* فرم */}
  <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 pb-28">
    {/* باکس انتخاب/تغییر عکس */}
    <div onClick={() => setShowPhotoPicker(true)} className="rounded-3xl p-6 border-2 border-dashed border-[#D4AF37] bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center text-center space-y-2.5 cursor-pointer active:scale-98 transition-transform shadow-sm hover:bg-white relative overflow-hidden">
      {shownImage ? (
        <div className="w-full h-48 rounded-2xl overflow-hidden relative shadow-md">
          <img src={shownImage} alt="پیش‌نمایش" className="w-full h-full object-cover" />
          <div className="absolute bottom-2 right-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-black">تغییر تصویر 📷</div>
        </div>
      ) : (
        <>
          <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/15 text-[#B38F24] flex items-center justify-center text-3xl shadow-inner border border-[#D4AF37]/30">
            <Camera className="w-8 h-8 stroke-[1.8]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#23201C]">بارگذاری تصویر واقعی کارگاه</h3>
            <p className="text-[10px] text-[#7E7667] font-bold mt-1 leading-relaxed">لمس کنید برای عکاسی با دوربین یا انتخاب از گالری</p>
          </div>
        </>
      )}
    </div>
    {/* انتخاب طرح */}
    <div className="space-y-1.5 text-right">
      <div className="flex items-center gap-1.5 text-xs font-black text-[#23201C] px-1">
        <BookOpen className="w-4 h-4 text-[#B38F24]" />
        <span>عنوان و مدل لباس</span>
      </div>
      <div className="relative">
        <select value={selectedDesign} onChange={(e) => setSelectedDesign(e.target.value)} className="w-full khaliji-card-glass rounded-2xl px-4 py-3 text-xs font-black text-[#23201C] border border-[#EADFC7] focus:outline-none appearance-none cursor-pointer text-right pr-4 pl-10">
          {isEdit && !DESIGN_OPTIONS.includes(selectedDesign) && <option value={selectedDesign}>{selectedDesign}</option>}
          {DESIGN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#7E7667]"><ChevronDown className="w-4 h-4" /></div>
      </div>
    </div>
    {/* دستمزد و زمان */}
    <div className="space-y-1.5 text-right">
      <div className="flex items-center gap-1.5 text-xs font-black text-[#23201C] px-1">
        <Clock className="w-4 h-4 text-[#B38F24]" />
        <span>دستمزد و زمان تحویل</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="khaliji-card-glass rounded-2xl p-3 border border-[#EADFC7] space-y-1 text-right">
          <span className="text-[10px] text-[#7E7667] font-bold block">دستمزد پیشنهادی شما</span>
          <div className="flex items-center justify-between pt-1 border-t border-[#F8F5EE]">
            <Coins className="w-4 h-4 text-[#B38F24]" />
            <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="۴۸۰,۰۰۰ تومان" className="w-full bg-transparent text-xs font-black text-[#23201C] text-left focus:outline-none pr-2" />
          </div>
        </div>
        <div className="khaliji-card-glass rounded-2xl p-3 border border-[#EADFC7] space-y-1 text-right">
          <span className="text-[10px] text-[#7E7667] font-bold block">مدت آماده‌سازی</span>
          <div className="flex items-center justify-between pt-1 border-t border-[#F8F5EE]">
            <Calendar className="w-4 h-4 text-[#B38F24]" />
            <input type="text" value={days} onChange={(e) => setDays(e.target.value)} placeholder="۳ تا ۵ روز" className="w-full bg-transparent text-xs font-black text-[#23201C] text-left focus:outline-none pr-2" />
          </div>
        </div>
      </div>
    </div>
    {/* ویژگی‌ها */}
    <div className="space-y-2 text-right pt-1">
      <div className="flex items-center gap-1.5 text-xs font-black text-[#23201C] px-1">
        <Gem className="w-4 h-4 text-[#B38F24]" />
        <span>ویژگی‌های دوخت</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_TAGS.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button key={tag} type="button" onClick={() => toggleTag(tag)} className={`px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all ${isSelected ? 'bg-[#0E8388] text-white shadow-md shadow-[#0E8388]/20 scale-105' : 'khaliji-card-glass text-[#7E7667] border border-[#EADFC7]'}`}>
              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              <span>{tag}</span>
            </button>
          );
        })}
      </div>
    </div>
  </div>
  {/* دکمه ذخیره/انتشار */}
  <div className="p-4 bg-white/95 backdrop-blur-xl border-t border-[#EADFC7] shadow-2xl z-20">
    <button onClick={handlePublish} disabled={isPublishing} className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white font-black text-xs shadow-lg shadow-[#D4AF37]/30 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-75">
      <span>{isPublishing ? (isEdit ? 'در حال ذخیره تغییرات...' : 'در حال آپلود و انتشار در دیتابیس...') : (isEdit ? 'ذخیره تغییرات' : 'انتشار در کاتالوگ عمومی کَندوره')}</span>
      <ChevronLeft className="w-4 h-4" />
    </button>
  </div>
  <PhotoPickerModal isOpen={showPhotoPicker} onClose={() => setShowPhotoPicker(false)} onImageSelected={handleImageSelected} />
</div>
);
};