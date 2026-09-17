// src/components/common/ImageCropModal.jsx
import React, { useState, useRef } from 'react';
import { Check, X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

export const ImageCropModal = ({ isOpen, imageSrc, onClose, onCropComplete }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef(null);

  if (!isOpen || !imageSrc) return null;

  const handleDone = () => {
    setIsProcessing(true);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;

    const size = 400; // ابعاد استاندارد باکیفیت برای آواتار
    canvas.width = size;
    canvas.height = size;

    if (ctx && img) {
      ctx.imageSmoothingQuality = 'high';
      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);

      const hRatio = img.naturalWidth / img.naturalHeight;
      let drawW = size;
      let drawH = size;
      if (hRatio > 1) {
        drawW = size * hRatio;
      } else {
        drawH = size / hRatio;
      }

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      canvas.toBlob((blob) => {
        setIsProcessing(false);
        if (blob) {
          const croppedFile = new File([blob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });
          onCropComplete(croppedFile);
          onClose();
        }
      }, 'image/jpeg', 0.92);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none" dir="rtl">
      <div className="bg-[#FCFAF6] w-full max-w-sm rounded-[2.5rem] p-5 border-2 border-[#D4AF37] shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between border-b border-[#EADFC7] pb-2">
          <span className="text-xs font-black text-[#23201C]">تنظیم و برش عکس پروفایل</span>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#FAF6ED] flex items-center justify-center text-[#7E7667]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* کادر برش دایره‌ای */}
        <div className="relative w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-[#D4AF37] shadow-2xl bg-black flex items-center justify-center">
          <img
            ref={imgRef}
            src={imageSrc}
            alt="پیش‌نمایش"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transition: 'transform 0.1s ease',
              maxHeight: '100%',
              maxWidth: '100%',
              objectFit: 'cover'
            }}
          />
          <div className="absolute inset-0 rounded-full pointer-events-none ring-1 ring-white/50"></div>
        </div>

        {/* ابزارهای زوم و چرخش */}
        <div className="flex items-center justify-center gap-4 py-1">
          <button
            type="button"
            onClick={() => setScale(prev => Math.max(0.8, prev - 0.15))}
            className="w-10 h-10 rounded-2xl bg-white border border-[#EADFC7] flex items-center justify-center text-[#23201C] shadow-sm active:scale-90"
            title="کوچک‌نمایی"
          >
            <ZoomOut className="w-4 h-4 text-[#B38F24]" />
          </button>

          <button
            type="button"
            onClick={() => setRotation(prev => (prev + 90) % 360)}
            className="w-10 h-10 rounded-2xl bg-white border border-[#EADFC7] flex items-center justify-center text-[#23201C] shadow-sm active:scale-90"
            title="چرخش ۹۰ درجه"
          >
            <RotateCw className="w-4 h-4 text-[#0E8388]" />
          </button>

          <button
            type="button"
            onClick={() => setScale(prev => Math.min(2.5, prev + 0.15))}
            className="w-10 h-10 rounded-2xl bg-white border border-[#EADFC7] flex items-center justify-center text-[#23201C] shadow-sm active:scale-90"
            title="بزرگ‌نمایی"
          >
            <ZoomIn className="w-4 h-4 text-[#B38F24]" />
          </button>
        </div>

        {/* دکمه‌های تایید و انصراف */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="py-3 rounded-2xl bg-[#FAF6ED] border border-[#EADFC7] text-xs font-black text-[#524B40]"
          >
            انصراف
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={handleDone}
            className="py-3 rounded-2xl bg-gradient-to-r from-[#0E352B] to-[#041914] text-white text-xs font-black shadow-lg flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Check className="w-4 h-4 text-[#D4AF37]" />
            <span>{isProcessing ? 'در حال برش...' : 'تأیید و انتخاب'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};