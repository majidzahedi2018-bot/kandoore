// src/components/customer/DesignDetailModal.jsx
import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Heart, Share2, Scissors, Shirt, Calendar, CheckCircle2, Star, Truck, Tag, ShoppingBag, MapPin, Phone, MessageCircle, MessageSquareQuote } from 'lucide-react';
import { tailorApi, reviewsApi } from '../../api/api';
import { openImageViewer } from '../common/ImageViewerModal';

const faNum = (n) => (n === undefined || n === null ? '' : Number(n).toLocaleString('fa-IR'));
const formatFaDate = (d) => {
  if (!d) return '';
  try {
    const date = new Date(d.replace(' ', 'T'));
    return date.toLocaleDateString('fa-IR');
  } catch {
    return '';
  }
};

const StarsRow = ({ value = 5, size = 'w-3.5 h-3.5' }) => {
  const v = Math.max(0, Math.min(5, Math.round(Number(value) || 5)));
  return (
    <div className="flex items-center gap-0.5 dir-ltr">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${size} ${i <= v ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-[#EADFC7]'}`} />
      ))}
    </div>
  );
};

const SpecChip = ({ label, value }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF6ED] border border-[#EADFC7] text-[10px] font-black text-[#524B40]">
    <span className="text-[#B38F24]">{label}:</span>
    <span>{value}</span>
  </span>
);
export const DesignDetailModal = ({ design, onClose, onProceedToCustomization, onOpenChat, onOpenTailorProfile }) => {
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isFav, setIsFav] = useState(true);
const [imgIdx, setImgIdx] = useState(0);
const gallery = [design?.image, ...(design?.extraImages || [])].filter(Boolean);

  const ownerTailor = profile
    ? {
        userId: design.userId,
        name: profile.shopName || design.tailorName || 'کارگاه خیاطی',
        tailorInCharge: profile.tailorInCharge || 'مدیر کارگاه',
        city: profile.city || 'بندرعباس',
        address: profile.address || '',
        phone: profile.phone || '',
        specialties: Array.isArray(profile.specialties) ? profile.specialties : [],
        bio: profile.bio || '',
        rating: profile.rating || '4.9',
        reviewsCount: profile.reviewsCount || 0,
        price: design.price || 480000,
        deliveryDays: design.deliveryDays || '۳ تا ۵ روز',
        avatar: profile.avatarUrl || null,
        isAcceptingOrders: profile.isAcceptingOrders !== false
      }
    : {
        userId: design.userId,
        name: design.tailorName || 'کارگاه خیاطی',
        tailorInCharge: 'مدیر کارگاه',
        city: design.city || 'بندرعباس',
        address: '',
        phone: '',
        specialties: [],
        bio: '',
        rating: '4.9',
        reviewsCount: 0,
        price: design.price || 480000,
        deliveryDays: design.deliveryDays || '۳ تا ۵ روز',
        avatar: null,
        isAcceptingOrders: true
      };

  useEffect(() => {
    let cancelled = false;
    const loadAll = async () => {
      setReviewsLoading(true);
      try {
        if (design) {
          const pRes = await tailorApi.getFullProfile(design.userId);
          if (!cancelled && pRes.success && pRes.profile) setProfile(pRes.profile);
        }
      } catch (e) {
        console.error('Error fetching tailor profile:', e);
      }
      try {
        if (design) {
          const rRes = await reviewsApi.getByDesign(design.id, design.title);
          if (!cancelled && rRes.success && rRes.reviews) {
            setReviews([...rRes.reviews].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0)));
          }
        }
      } catch (e) {
        console.error('Error fetching reviews:', e);
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    };
    if (design) loadAll();
    return () => { cancelled = true; };
  }, [design]);

  if (!design) return null;

  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 2);
  const avgOfReviews = reviews.length
    ? (reviews.reduce((s, r) => s + (Number(r.avg_rating) || 0), 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 select-none overflow-hidden">
      <div className="bg-[#F8F5EE] w-full max-w-md h-[100dvh] sm:h-[92vh] sm:rounded-[2.5rem] flex flex-col justify-between overflow-hidden shadow-2xl border border-[#EADFC7]">

        <div className="flex-1 overflow-y-auto no-scrollbar pb-24">

          {/* بنر تصویر طرح */}
          <div className="relative h-96 w-full bg-gradient-to-b from-[#241A12] to-[#3D2D1E] overflow-hidden flex items-center justify-center">
            {design.image ? (
                         <img
             src={gallery[imgIdx] || design.image}
             alt={design.title}
             onClick={() => openImageViewer({
               src: gallery[imgIdx] || design.image,
                  title: design.title || 'جزئیات طرح و دوخت',
                  subtitle: design.category ? `کَندوره ${design.category}` : 'کَندوره اصیل زری‌بافی',
                  tailorName: ownerTailor.name,
                  tailorUserId: ownerTailor.userId
                })}
                className="w-full h-full object-cover cursor-zoom-in transition-transform duration-500 hover:scale-105"
              />
            ) : (
              <div className="text-8xl filter drop-shadow-2xl opacity-90 animate-pulse">
                {design.iconEmoji || '✨👗'}
              </div>
            )}

            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center text-[#23201C] border border-white/80 shadow-md active:scale-90 transition-transform"
              >
                <ChevronRight className="w-5 h-5 text-[#B38F24]" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFav(!isFav)}
                  className="w-10 h-10 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center text-[#23201C] border border-white/80 shadow-md active:scale-90 transition-transform"
                >
                  <Heart className={`w-5 h-5 ${isFav ? 'fill-red-500 text-red-500' : 'text-[#23201C]'}`} />
                </button>
                <button className="w-10 h-10 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center text-[#23201C] border border-white/80 shadow-md active:scale-90 transition-transform">
                  <Share2 className="w-4 h-4 text-[#23201C]" />
                </button>
              </div>
            </div>

                     <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-[#FBF5B7] text-xs font-black px-3 py-1.5 rounded-full border border-[#D4AF37]/50 flex items-center gap-1.5 shadow-lg">
           <span>⚜️</span>
           <span>طرح اصیل هرمزگان</span>
         </div>
         {gallery.length > 1 && (
           <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full border border-white/30 z-10">
             {(imgIdx + 1).toLocaleString('fa-IR')} / {gallery.length.toLocaleString('fa-IR')}
           </div>
         )}
       </div>

                 {/* ردیف تامبنیل‌های گالری */}
       {gallery.length > 1 && (
         <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pt-3">
           {gallery.map((src, i) => (
             <button
               key={i}
               onClick={() => setImgIdx(i)}
               className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 ${i === imgIdx ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/40' : 'border-[#EADFC7] opacity-70'}`}
             >
               <img src={src} alt="" className="w-full h-full object-cover" />
             </button>
           ))}
         </div>
       )}

          {/* مشخصات اصلی */}
          <div className="p-4 space-y-4">
            <div className="text-center pt-1">
              <div className="flex items-center justify-center gap-2">
                <span className="text-[#D4AF37] text-sm">❖</span>
                <h1 className="text-2xl font-black text-[#23201C] tracking-tight">
                  {design.title}
                </h1>
                <span className="text-[#D4AF37] text-sm">❖</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="khaliji-card-glass rounded-2xl p-2.5 flex flex-col items-center text-center border border-[#EADFC7]">
                <div className="w-8 h-8 rounded-full bg-[#D4AF37]/15 flex items-center justify-center text-[#B38F24] mb-1.5">
                  <Scissors className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-[#7E7667] font-bold">دوخت:</span>
                <span className="text-xs font-black text-[#23201C] mt-0.5">{design.category || 'بادله و شک'}</span>
              </div>

              <div className="khaliji-card-glass rounded-2xl p-2.5 flex flex-col items-center text-center border border-[#EADFC7]">
                <div className="w-8 h-8 rounded-full bg-[#D4AF37]/15 flex items-center justify-center text-[#B38F24] mb-1.5">
                  <Shirt className="w-4 h-4" />
                </div>
             <span className="text-[10px] text-[#7E7667] font-bold">پارچه:</span>
             <span className="text-xs font-black text-[#23201C] mt-0.5">{(design.fabrics?.length ? design.fabrics.join('، ') : 'کرپ / حریر')}</span>
              </div>

              <div className="khaliji-card-glass rounded-2xl p-2.5 flex flex-col items-center text-center border border-[#EADFC7]">
                <div className="w-8 h-8 rounded-full bg-[#D4AF37]/15 flex items-center justify-center text-[#B38F24] mb-1.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-[#7E7667] font-bold">زمان دوخت:</span>
                <span className="text-xs font-black text-[#23201C] mt-0.5">{ownerTailor.deliveryDays}</span>
              </div>
            </div>

                     {/* شناسنامهٔ طرح (چیپ‌های تاکسونومی) */}
         <div className="khaliji-card-glass rounded-2xl p-3 border border-[#EADFC7] space-y-2">
           <div className="flex items-center gap-1.5">
             <span className="text-[#D4AF37] text-xs">❖</span>
             <span className="text-[11px] font-black text-[#23201C]">شناسنامهٔ طرح</span>
           </div>
           <div className="flex flex-wrap gap-1.5">
             {design.garmentModel && <SpecChip label="مدل برش" value={design.garmentModel} />}
             {design.embellishments?.length > 0 && <SpecChip label="تزئینات" value={design.embellishments.join('، ')} />}
             {design.occasions?.length > 0 && <SpecChip label="مناسبت" value={design.occasions.join('، ')} />}
             {design.region && <SpecChip label="منطقه" value={design.region} />}
             {design.setPieces?.length > 0 && <SpecChip label="اجزای ست" value={design.setPieces.join('، ')} />}
             {design.chadorWrap && <SpecChip label="چادرپیچ" value={design.chadorWrap} />}
             {design.burqaDecor && <SpecChip label="برقع" value={design.burqaDecor} />}
             {design.colorName && (
               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF6ED] border border-[#EADFC7] text-[10px] font-black text-[#524B40]">
                 <span className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: design.colorHex && design.colorHex !== 'multi' ? design.colorHex : '#D4AF37' }} />
                 <span>{design.colorName}</span>
               </span>
             )}
           </div>
         </div>

            {/* کارت تنها خیاطِ صاحب طرح */}
            <div className="pt-2">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-[#D4AF37] text-xs">◈</span>
                <h2 className="text-xs font-black text-[#23201C]">خیاطِ این طرح</h2>
              </div>

              <div className="rounded-3xl p-4 bg-white border-2 border-[#D4AF37] shadow-md shadow-[#D4AF37]/15 space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#AA771C] p-0.5 shadow-md shrink-0">
                    <div className="w-full h-full rounded-full bg-[#FAF6ED] flex items-center justify-center overflow-hidden border border-white">
                      {ownerTailor.avatar && ownerTailor.avatar.startsWith('http') ? (
                        <img src={ownerTailor.avatar} alt={ownerTailor.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">🧵</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-[#23201C]">{ownerTailor.name}</span>
                      <CheckCircle2 className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]/20" />
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#7E7667]">
                      <span className="text-[#23201C]">{ownerTailor.tailorInCharge}</span>
                      {Number(ownerTailor.reviewsCount) > 0 && <span>• ({faNum(ownerTailor.reviewsCount)} نظر)</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StarsRow value={ownerTailor.rating} />
                      <span className="text-[10px] font-black text-[#23201C]">{faNum(ownerTailor.rating)}</span>
                    </div>
                  </div>
                  {ownerTailor.isAcceptingOrders ? (
                    <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[9px] font-black border border-emerald-200 shrink-0">
                      پذیرای سفارش
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full bg-red-50 text-red-700 text-[9px] font-black border border-red-200 shrink-0">
                      عدم پذیرش
                    </span>
                  )}
                </div>

                {onOpenTailorProfile && (
               <button
                 onClick={() => onOpenTailorProfile(ownerTailor)}
                 className="w-full py-2.5 rounded-2xl bg-[#FAF6ED] border border-[#EADFC7] text-[#0E8388] text-[11px] font-black flex items-center justify-center gap-1.5 active:scale-95"
               >
                 <ShoppingBag className="w-3.5 h-3.5" />
                 <span>مشاهدهٔ ویترین کارگاه</span>
               </button>
             )}
             <div className="flex items-center justify-between border-t border-[#F8F5EE] pt-3 text-[11px]">
                  <div className="flex items-center gap-1 text-[#7E7667] font-bold">
                    <Truck className="w-3.5 h-3.5" />
                    <span>تحویل: {ownerTailor.deliveryDays}</span>
                  </div>
                  <div className="flex items-center gap-1 font-black text-[#23201C]">
                    <Tag className="w-3.5 h-3.5 text-[#B38F24]" />
                    <span>از {faNum(ownerTailor.price)} تومان</span>
                  </div>
                </div>
              </div>
            </div>

            {/* مشخصات کامل کارگاه: آدرس، تخصص‌ها و گفتگو قبل از سفارش */}
            <div className="rounded-3xl p-4 khaliji-card-glass border border-[#EADFC7] space-y-3.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[#0E8388] text-xs">◈</span>
                <h2 className="text-xs font-black text-[#23201C]">مشخصات کارگاه {ownerTailor.name}</h2>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#0E8388]/10 text-[#0E8388] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="text-right space-y-0.5 flex-1">
                    <span className="text-[10px] text-[#7E7667] font-bold block">نشانی کارگاه</span>
                    <span className="text-[11px] font-black text-[#23201C] leading-relaxed block">
                      {ownerTailor.city}{ownerTailor.address ? ` — ${ownerTailor.address}` : ''}
                    </span>
                  </div>
                </div>

                {ownerTailor.phone && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 text-[#B38F24] flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="text-right space-y-0.5 flex-1">
                      <span className="text-[10px] text-[#7E7667] font-bold block">تلفن تماس</span>
                      <a href={`tel:${ownerTailor.phone}`} className="text-[11px] font-black text-[#0E8388] font-mono block dir-ltr text-left">{ownerTailor.phone}</a>
                    </div>
                  </div>
                )}

                {ownerTailor.specialties.length > 0 && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#C85A32]/10 text-[#C85A32] flex items-center justify-center shrink-0">
                      <Scissors className="w-4 h-4" />
                    </div>
                    <div className="text-right space-y-1 flex-1">
                      <span className="text-[10px] text-[#7E7667] font-bold block">تخصص‌های دوخت</span>
                      <div className="flex flex-wrap gap-1.5">
                        {ownerTailor.specialties.map((s, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-full bg-[#FAF6ED] border border-[#EADFC7] text-[10px] font-black text-[#524B40]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {ownerTailor.bio && (
                  <p className="text-[11px] leading-relaxed text-[#7E7667] font-bold bg-[#FAF6ED] rounded-2xl p-3 border border-[#EADFC7]/70">{ownerTailor.bio}</p>
                )}
              </div>

              <button
                onClick={() => onOpenChat && onOpenChat(ownerTailor, design)}
                className="w-full py-3 rounded-2xl bg-gradient-to-l from-[#0E8388] to-[#04474A] text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-[#0E8388]/25 active:scale-95 transition-transform"
              >
                <MessageCircle className="w-4 h-4" />
                <span>گفتگو با خیاط (پیش از سفارش)</span>
              </button>
            </div>

            {/* بخش نظرات مشتریان — سبک کامنت اینستاگرام */}
            <div className="rounded-3xl p-4 bg-white border border-[#EADFC7] shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <MessageSquareQuote className="w-4 h-4 text-[#D4AF37]" />
                  <h2 className="text-xs font-black text-[#23201C]">نظرات مشتریان</h2>
                  {reviews.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#B38F24] text-[10px] font-black border border-[#D4AF37]/30">
                      {faNum(reviews.length)}
                    </span>
                  )}
                </div>
                {avgOfReviews && (
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-black text-[#23201C]">{faNum(avgOfReviews)}</span>
                    <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                  </div>
                )}
              </div>

              {reviewsLoading ? (
                <div className="space-y-3 py-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex gap-3 items-start animate-pulse">
                      <div className="w-9 h-9 rounded-full bg-[#EADFC7]"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-1/3 bg-[#EADFC7] rounded-full"></div>
                        <div className="h-3 w-2/3 bg-[#F8F5EE] rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <div className="text-3xl">💬</div>
                  <p className="text-[11px] font-black text-[#7E7667]">هنوز نظری ثبت نشده است</p>
                  <p className="text-[10px] font-bold text-[#B38F24]">پس از تحویل سفارش، اولین نظر را برای این خیاط بنویسید</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-[#F8F5EE]">
                    {visibleReviews.map((r) => (
                      <div key={r.id} className="py-3.5 first:pt-1 last:pb-1">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#AA771C] p-0.5 shrink-0">
                            <div className="w-full h-full rounded-full bg-[#FAF6ED] flex items-center justify-center overflow-hidden border border-white">
                              {r.customer_avatar && r.customer_avatar.startsWith('http') ? (
                                <img src={r.customer_avatar} alt={r.customer_name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-base">🧕</span>
                              )}
                            </div>
                          </div>

                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-[#23201C]">{r.customer_name || 'مشتری کندوره'}</span>
                              <span className="text-[9px] font-bold text-[#B38F24]">{formatFaDate(r.created_at)}</span>
                            </div>
                            <StarsRow value={r.avg_rating} size="w-3 h-3" />

                            {r.comment && (
                              <p className="text-[11px] font-bold text-[#524B40] leading-relaxed">{r.comment}</p>
                            )}
                            {r.image_url && (
                              <div className="w-24 h-24 rounded-2xl overflow-hidden border border-[#EADFC7] shadow-inner">
                                <img src={r.image_url} alt="عکس لباس دوخته‌شده" className="w-full h-full object-cover" />
                              </div>
                            )}
                            {r.recommend === 'yes' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[9px] font-black border border-emerald-200">
                                ✓ این خیاط را پیشنهاد می‌کند
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {reviews.length > 2 && (
                    <button
                      onClick={() => setShowAllReviews(!showAllReviews)}
                      className="w-full mt-2 py-2.5 rounded-2xl bg-[#FAF6ED] border border-[#EADFC7] text-[11px] font-black text-[#0E8388] active:scale-95 transition-transform"
                    >
                      {showAllReviews ? `بستن نظرات (${faNum(reviews.length)})` : `مشاهده همهٔ ${faNum(reviews.length)} نظر`}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* ملزومات BOM */}
            <div className="rounded-2xl p-3.5 bg-[#0E8388]/10 border border-[#0E8388]/25 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-black text-[#0E8388] block">ملزومات مصرفی (BOM):</span>
                <p className="text-xs font-black text-[#23201C]">
                  {design.description || '۲٫۵ متر پارچه • ۶ متر شک • ۲ عدد نخ گلابتون'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/80 border border-[#0E8388]/30 flex items-center justify-center text-[#0E8388]">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>

          </div>
        </div>

        {/* دکمه پایین */}
        <div className="p-4 bg-white/90 backdrop-blur-xl border-t border-[#EADFC7] flex items-center justify-between shadow-2xl">
          <div className="space-y-0.5">
            <span className="text-[10px] text-[#7E7667] font-bold block">دستمزد دوخت:</span>
            <div className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-[#B38F24]" />
              <span className="text-sm font-black text-[#23201C]">
                از {faNum(ownerTailor.price)} تومان
              </span>
            </div>
          </div>

          <button
            onClick={() => onProceedToCustomization(ownerTailor)}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white font-black text-xs shadow-lg shadow-[#D4AF37]/30 flex items-center gap-2 active:scale-95 transition-transform"
          >
            <span>شخصی‌سازی و ثبت سفارش</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};