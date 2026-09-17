// src/components/common/PhotoPickerModal.jsx
import React, { useRef } from 'react';
import { X, ChevronLeft, Lightbulb } from 'lucide-react';

export const PhotoPickerModal = ({ isOpen, onClose, onImageSelected }) => {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onImageSelected(file);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 select-none overflow-hidden max-w-md mx-auto">
      <div className="bg-[#FDFBF7] w-full rounded-t-[2.8rem] sm:rounded-[2.8rem] p-6 space-y-4 border border-[#EADFC7] shadow-2xl animate-in slide-in-from-bottom duration-200">
        
        <div className="w-12 h-1.5 bg-[#EADFC7] rounded-full mx-auto -mt-1 mb-2"></div>

        <div className="flex items-center justify-between border-b border-[#F8F5EE] pb-3">
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#7E7667] border border-[#EADFC7] shadow-sm active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="text-right">
            <h3 className="text-sm font-black text-[#23201C]">
              انتخاب تصویر (دوربین یا گالری)
            </h3>
            <div className="flex items-center justify-end gap-1 mt-0.5 opacity-60">
              <span className="h-[1px] w-4 bg-[#D4AF37]"></span>
              <span className="text-[8px] text-[#D4AF37]">◈</span>
              <span className="h-[1px] w-4 bg-[#D4AF37]"></span>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          {/* عکس‌برداری با دوربین */}
          <div 
            onClick={() => cameraInputRef.current && cameraInputRef.current.click()}
            className="khaliji-card-glass rounded-[2rem] p-4 border-2 border-[#D4AF37]/60 shadow-md flex items-center justify-between cursor-pointer active:scale-98 transition-all hover:border-[#D4AF37]"
          >
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#B38F24] border border-[#EADFC7] shadow-sm">
              <ChevronLeft className="w-4 h-4" />
            </div>

            <div className="text-right flex-1 pr-3 space-y-0.5">
              <h4 className="text-xs font-black text-[#23201C]">عکس‌برداری مستقیم با دوربین</h4>
              <span className="text-[10px] text-[#7E7667] font-bold block">
                عکاسی فوری از دوخت و کار دست روی میز کارگاه
              </span>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E5C158] via-[#D4AF37] to-[#AA771C] p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#FAF6ED] rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white">
                📸
              </div>
            </div>

            <input 
              ref={cameraInputRef} 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              onChange={handleFileChange} 
            />
          </div>

          {/* انتخاب از گالری */}
          <div 
            onClick={() => galleryInputRef.current && galleryInputRef.current.click()}
            className="khaliji-card-glass rounded-[2rem] p-4 border border-[#EADFC7] shadow-sm flex items-center justify-between cursor-pointer active:scale-98 transition-all hover:border-[#0E8388]"
          >
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#0E8388] border border-[#EADFC7] shadow-sm">
              <ChevronLeft className="w-4 h-4" />
            </div>

            <div className="text-right flex-1 pr-3 space-y-0.5">
              <h4 className="text-xs font-black text-[#23201C]">انتخاب از گالری تصاویر</h4>
              <span className="text-[10px] text-[#7E7667] font-bold block">
                آپلود عکس‌های ذخیره‌شده در گوشی
              </span>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0E8388] to-[#043C3E] p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#FAF6ED] rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white">
                🖼️
              </div>
            </div>

            <input 
              ref={galleryInputRef} 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange} 
            />
          </div>
        </div>

        <div className="khaliji-card-glass rounded-2xl p-3 border border-[#EADFC7] flex items-center justify-between text-right">
          <div className="text-right flex-1 pr-2">
            <span className="text-[10px] font-black text-[#0E8388] ml-1">نکته:</span>
            <span className="text-[10px] text-[#524B40] font-bold">
              تصاویر به طور خودکار فشرده و بهینه‌سازی می‌شوند.
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#0E8388] text-white flex items-center justify-center shadow-sm shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
        </div>

      </div>
    </div>
  );
};