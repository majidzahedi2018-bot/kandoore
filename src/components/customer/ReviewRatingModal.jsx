// src/components/customer/ReviewRatingModal.jsx
import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Star, Camera, Check, ThumbsUp, ThumbsDown, Gift, ShieldCheck } from 'lucide-react';
import { reviewsApi, uploadImage } from '../../api/api';
import { PhotoPickerModal } from '../common/PhotoPickerModal';
import { useToast } from '../common/ToastSystem';
export const ReviewRatingModal = ({ isOpen, onClose, order, currentUser, onReviewSuccess }) => {
const { toast } = useToast();
const [ratings, setRatings] = useState({ quality: 5, accuracy: 5, punctuality: 5, behavior: 5 });
  const [comment, setComment] = useState('');
  const [recommend, setRecommend] = useState('yes');
  
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState(null);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const criteriaList = [
    { key: 'quality', label: '۱. کیفیت دوخت و ظرافت کار دست' },
    { key: 'accuracy', label: '۲. تطابق دقیق با اندازه‌ها' },
    { key: 'punctuality', label: '۳. خوش‌قولی و تحویل به‌موقع' },
    { key: 'behavior', label: '۴. برخورد و پاسخگویی خیاط' },
  ];

  const handleStarClick = (key, starIndex) => {
    setRatings(prev => ({ ...prev, [key]: starIndex }));
  };

  const handlePhotoSelected = (file) => {
    setSelectedPhoto(file);
    setPreviewPhotoUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      let uploadedImageUrl = null;
      if (selectedPhoto) {
        const uploadRes = await uploadImage(selectedPhoto, 'reviews', currentUser?.id || 1);
        if (uploadRes.success && uploadRes.url) {
          uploadedImageUrl = uploadRes.url;
        }
      }

      const payload = {
        order_id: order.id,
        user_id: currentUser?.id || 1,
        tailor_user_id: order.tailorUserId || 2,
        design_id: order.designId || null,
        design_title: order.designTitle || '',
        quality: ratings.quality,
        accuracy: ratings.accuracy,
        punctuality: ratings.punctuality,
        behavior: ratings.behavior,
        comment: comment.trim(),
        image_url: uploadedImageUrl,
        recommend: recommend
      };

      const res = await reviewsApi.submitReview(payload);
      setIsSubmitting(false);

         if (res.success) {
     if (onReviewSuccess) onReviewSuccess(res);
     onClose();
   } else {
     toast.error(res.message || 'خطا در ثبت نظر.');
   }
 } catch (e) {
   setIsSubmitting(false);
   toast.error('خطا در ارتباط با سرور');
 }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F8F5EE] flex flex-col justify-between p-0 select-none overflow-hidden max-w-md mx-auto">
      
      {/* هدر */}
      <div className="p-4 bg-white/80 backdrop-blur-md border-b border-[#EADFC7] flex items-center justify-between z-10 shrink-0">
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full khaliji-card-glass flex items-center justify-center text-[#B38F24] border border-[#EADFC7] shadow-sm active:scale-90"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        
        <h1 className="text-base font-black text-[#23201C]">ثبت نظر و امتیاز دوخت</h1>
        <div className="w-10"></div>
      </div>

      {/* فرم */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 pb-28">

        {/* کارت سفارش */}
        <div className="khaliji-card-glass rounded-3xl p-4 border border-[#EADFC7] shadow-sm flex items-center justify-between">
          <div className="space-y-1 text-right flex-1 pr-3">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black border border-emerald-200">
              <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
              <span>سفارش تحویل‌شده #{order.id}</span>
            </div>
            <h2 className="text-xs font-black text-[#23201C] pt-1">{order.designTitle}</h2>
            <span className="text-[10px] text-[#7E7667] font-bold block">خیاط: {order.tailorName}</span>
          </div>

          <div className="w-16 h-20 rounded-2xl overflow-hidden border border-[#D4AF37] shadow-inner shrink-0 bg-[#241A12]">
            {order.designImage && order.designImage.startsWith('http') ? (
              <img src={order.designImage} alt={order.designTitle} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">✨👗</div>
            )}
          </div>
        </div>

        {/* امتیازدهی ۴ معیاره */}
        <div className="khaliji-card-glass rounded-[2rem] p-4 border border-[#EADFC7] shadow-sm space-y-3.5 text-right">
          <span className="text-xs font-black text-[#23201C] block">امتیاز شما به کیفیت خدمات:</span>

          <div className="space-y-3">
            {criteriaList.map((item) => {
              const currentRating = ratings[item.key];
              return (
                <div key={item.key} className="flex items-center justify-between border-b border-[#F8F5EE] pb-2 last:border-none">
                  <div className="flex items-center gap-1 dir-ltr">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleStarClick(item.key, star)}
                        className="p-0.5 active:scale-125 transition-transform"
                      >
                        <Star className={`w-5 h-5 ${star <= currentRating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-[#EADFC7]'}`} />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-[#23201C]">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* آپلود عکس لباس */}
        <div 
          onClick={() => setShowPhotoPicker(true)}
          className={`rounded-3xl p-5 border-2 border-dashed transition-all flex flex-col items-center justify-center text-center space-y-2 cursor-pointer ${
            previewPhotoUrl ? 'border-emerald-500 bg-emerald-50/50' : 'border-[#D4AF37]/80 bg-white/50'
          }`}
        >
          {previewPhotoUrl ? (
            <div className="w-full h-40 rounded-2xl overflow-hidden relative">
              <img src={previewPhotoUrl} alt="لباس دوخته‌شده" className="w-full h-full object-cover" />
              <span className="absolute bottom-2 right-2 px-3 py-1 bg-black/60 text-white rounded-full text-[10px] font-black">تغییر عکس 📷</span>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 text-[#B38F24] flex items-center justify-center text-2xl">
                <Camera className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div>
                <h3 className="text-xs font-black text-[#23201C]">بارگذاری عکس لباس دوخته‌شده (اختیاری)</h3>
                <p className="text-[10px] text-[#7E7667] font-bold mt-0.5">عکس شما در بخش نمونه‌کارهای واقعی خیاط قرار می‌گیرد</p>
              </div>
            </>
          )}
        </div>

        {/* نظر متنی */}
        <div className="khaliji-card-glass rounded-3xl p-4 border border-[#EADFC7] shadow-sm space-y-2 text-right">
          <span className="text-xs font-black text-[#23201C] block">نظر و تجربه شما:</span>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="تجربه خود را از دوخت، تناسب دمپا و کیفیت پارچه بنویسید..."
            className="w-full p-3 rounded-2xl bg-white/70 border border-[#EADFC7] text-xs font-bold text-[#23201C] focus:outline-none focus:bg-white text-right leading-relaxed resize-none"
          />
        </div>

        {/* پیشنهاد به دیگران */}
        <div className="khaliji-card-glass rounded-3xl p-4 border border-[#EADFC7] shadow-sm space-y-2.5 text-center">
          <span className="text-xs font-black text-[#23201C] block">آیا این خیاط را به دیگران پیشنهاد می‌کنید؟</span>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setRecommend('yes')}
              className={`py-2.5 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 ${
                recommend === 'yes' ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-500' : 'bg-white border border-[#EADFC7] text-[#7E7667]'
              }`}
            >
              <span>بله، پیشنهاد می‌کنم</span>
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setRecommend('no')}
              className={`py-2.5 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 ${
                recommend === 'no' ? 'bg-red-50 text-red-800 border-2 border-red-500' : 'bg-white border border-[#EADFC7] text-[#7E7667]'
              }`}
            >
              <span>خیر</span>
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* دکمه ثبت نظر */}
      <div className="p-4 bg-white/95 backdrop-blur-xl border-t border-[#EADFC7] shadow-2xl z-20 space-y-2">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white font-black text-xs shadow-lg shadow-[#D4AF37]/30 flex items-center justify-between px-5 active:scale-95 disabled:opacity-75"
        >
          <Gift className="w-5 h-5 text-white" />
          <span>{isSubmitting ? 'در حال ثبت در دیتابیس...' : 'ثبت نهایی نظر و دریافت ۵۰ امتیاز باشگاه'}</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <PhotoPickerModal
        isOpen={showPhotoPicker}
        onClose={() => setShowPhotoPicker(false)}
        onImageSelected={handlePhotoSelected}
      />

    </div>
  );
};