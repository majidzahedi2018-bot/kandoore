// src/components/customer/DesignsScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Shirt, Search, SlidersHorizontal, Heart, Scissors, X, RotateCcw, Star } from 'lucide-react';
import { designsApi } from '../../api/api';
import { Skeleton } from '../common/UiKit';
import { openImageViewer } from '../common/ImageViewerModal';

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// بخشی از متن که با عبارت جستجو مطابقت دارد را هایلایت می‌کند
const Highlight = ({ text = '', query = '' }) => {
  const q = (query || '').trim();
  if (!q || !text) return text;
  const parts = String(text).split(new RegExp(`(${escapeRegExp(q)})`, 'g'));
  return parts.map((p, i) =>
    p.toLowerCase() === q.toLowerCase()
      ? <mark key={i} className="bg-[#FCF6BA] text-[#23201C] rounded px-0.5 -mx-0.5">{p}</mark>
      : <span key={i}>{p}</span>
  );
};

export const DesignsScreen = ({ portfolioItems = [], onSelectDesign, onBack, onOpenSearch, activeFilters = null, onClearFilters }) => {
  const [selectedFilter, setSelectedFilter] = useState('همه');
const [selectedGarment, setSelectedGarment] = useState('همه');
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [designs, setDesigns] = useState(portfolioItems);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('kandooreh_wishlist');
      return saved ? JSON.parse(saved).map(item => item.id) : [];
    } catch { return []; }
  });
  const requestIdRef = useRef(0);

  const filters = ['همه', 'شلوار بندری', 'کندوره', 'بادله و شک'];
// چیپ‌های نوع پوشاک (فیلتر کلاینت‌ساید، مستقل از API)
const GARMENT_CHIPS = [
  { id: 'همه', label: 'همه' },
  { id: 'pirahan', label: 'پیراهن' },
  { id: 'shalwar', label: 'شلوار' },
  { id: 'chador', label: 'چادر' },
  { id: 'burqa', label: 'برقع' },
  { id: 'set', label: 'ست کامل' },
];
const GARMENT_KEYWORDS = {
  pirahan: ['پیراهن', 'کندوره', 'pirahan'],
  shalwar: ['شلوار', 'shalwar'],
  chador: ['چادر', 'chador'],
  burqa: ['برقع', 'burqa'],
  set: ['ست', 'set'],
};
const matchesGarment = (d, id) => {
if (id === 'همه') return true;
const kws = GARMENT_KEYWORDS[id] || [];
const hay = `${d.garmentType || ''} ${d.category || ''} ${d.title || ''}`;
return kws.some((k) => hay.includes(k));
};
// لیست نهایی قابل نمایش: فیلتر نوع پوشاک روی نتیجهٔ سرور اعمال می‌شود
const visibleDesigns = designs.filter((d) => matchesGarment(d, selectedGarment));
const garmentIcon = (d) => {
  const hay = `${d.garmentType || ''} ${d.category || ''}`;
  if (hay.includes('شلوار')) return '👖';
  if (hay.includes('چادر')) return '🧕';
  if (hay.includes('برقع')) return '🧿';
  if (hay.includes('ست') || hay.includes('set')) return '🎽';
  return '👗';
};

  // عبارت مؤثر جستجو: اول اینپوت اصلی، در غیر این صورت جستجوی فیلتر پیشرفته
  const effectiveQuery = (appliedQuery || activeFilters?.searchQuery || '').trim();

  // جستجوی زنده با تأخیر کوتاه تا هر بار کلیک سرور اذیت نشود
  useEffect(() => {
    const t = setTimeout(() => setAppliedQuery(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const fetchFilteredDesigns = async (category = selectedFilter, q = effectiveQuery) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const res = await designsApi.getAll(category, null, { ...(activeFilters || {}), searchQuery: q });
      if (requestId !== requestIdRef.current) return; // پاسخِ قدیمی را نادیده بگیر
      if (res.success && res.designs) {
        setDesigns(res.designs);
      }
    } catch (e) {
      console.error('Error fetching designs:', e);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredDesigns(selectedFilter, effectiveQuery);
  }, [selectedFilter, appliedQuery, activeFilters, effectiveQuery]);

  const handleFilterClick = (filter) => {
    setSelectedFilter(filter);
  };

  const toggleFavorite = (e, item) => {
    e.stopPropagation();
    let updatedWishlist = [];
    try {
      const saved = localStorage.getItem('kandooreh_wishlist');
      updatedWishlist = saved ? JSON.parse(saved) : [];
    } catch {}

    const exists = updatedWishlist.some(w => w.id === item.id);
    if (exists) {
      updatedWishlist = updatedWishlist.filter(w => w.id !== item.id);
      setFavorites(prev => prev.filter(id => id !== item.id));
    } else {
      updatedWishlist.push(item);
      setFavorites(prev => [...prev, item.id]);
    }
    localStorage.setItem('kandooreh_wishlist', JSON.stringify(updatedWishlist));
  };

  const hasActiveAdvancedFilters = Boolean(activeFilters && (activeFilters?.selectedCity || activeFilters?.selectedStitch));

  return (
    <div className="pb-32 pt-2 px-4 max-w-md mx-auto select-none space-y-4">

      {/* هدر */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full khaliji-card-glass flex items-center justify-center text-[#B38F24] border border-[#EADFC7] shadow-sm"
        >
          <ChevronRight className="w-5 h-5 text-[#B38F24]" />
        </button>

        <h1 className="text-xl font-black text-[#23201C] tracking-tight">طرح‌های اصیل هرمزگان</h1>

        <button className="w-10 h-10 rounded-full khaliji-card-glass flex items-center justify-center text-[#B38F24] border border-[#EADFC7] shadow-sm">
          <Shirt className="w-5 h-5" />
        </button>
      </div>

      {/* جستجوی زنده */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B38F24]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو: نام طرح، خیاط، پارچه..."
            className="w-full pr-11 pl-11 py-3 rounded-2xl khaliji-card-glass border border-[#EADFC7] text-xs font-black text-[#23201C] placeholder:text-[#7E7667]/60 focus:outline-none focus:bg-white focus:border-[#D4AF37] transition-all text-right"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#EADFC7]/60 text-[#7E7667] flex items-center justify-center active:scale-90"
              title="پاک کردن جستجو"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={onOpenSearch}
          className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white flex items-center justify-center shadow-md active:scale-95"
          title="فیلتر پیشرفته"
        >
          <SlidersHorizontal className="w-5 h-5 text-white" />
        </button>
      </div>

         {/* چیپ‌های نوع پوشاک (مطابق ماکاپ) */}
   <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
     {GARMENT_CHIPS.map((chip) => {
       const isActive = selectedGarment === chip.id;
       return (
         <button
           key={chip.id}
           onClick={() => setSelectedGarment(chip.id)}
           className={`shrink-0 px-4 py-2 rounded-2xl text-xs font-black transition-all ${
             isActive
               ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38F24] text-white shadow-md scale-105'
               : 'khaliji-card-glass text-[#7E7667] border border-[#EADFC7]'
           }`}
         >
           {chip.label}
         </button>
       );
     })}
   </div>

      {/* چیپ فیلترهای فعال پیشرفته */}
      {hasActiveAdvancedFilters && (
        <div className="flex items-center justify-between p-2.5 bg-white/90 rounded-2xl border border-[#D4AF37] shadow-sm text-xs font-black">
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 text-[#C85A32] text-[11px] font-bold"
          >
            <RotateCcw className="w-3 h-3" />
            <span>حذف فیلترها</span>
          </button>
          <div className="flex items-center gap-1.5 text-[#23201C] text-[11px]">
            <span>فیلترهای فعال:</span>
            {activeFilters?.selectedCity && <span className="px-2 py-0.5 rounded-lg bg-[#FAF6ED] border border-[#EADFC7]">{activeFilters.selectedCity}</span>}
            {activeFilters?.selectedStitch && <span className="px-2 py-0.5 rounded-lg bg-[#FAF6ED] border border-[#EADFC7]">{activeFilters.selectedStitch}</span>}
          </div>
        </div>
      )}

      {/* وضعیت جستجو */}
      {effectiveQuery && !loading && (
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] text-[#7E7667] font-bold">
            نمایش <b className="text-[#0E8388]">{designs.length.toLocaleString('fa-IR')}</b> نتیجه برای «<span className="text-[#23201C]">{effectiveQuery}</span>»
          </span>
          <button
            onClick={() => setQuery('')}
            className="flex items-center gap-0.5 text-[10px] font-black text-[#C85A32] active:scale-95"
          >
            <X className="w-3 h-3" />
            <span>پاک کردن جستجو</span>
          </button>
        </div>
      )}

      {/* گرید طرح‌ها */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="khaliji-card-glass rounded-3xl p-2.5 border border-[#EADFC7] space-y-2.5">
              <Skeleton className="w-full h-44 !rounded-2xl" />
              <Skeleton className="w-3/4 h-3 mx-auto" />
              <Skeleton className="w-1/2 h-3 mx-auto" />
            </div>
          ))}
        </div>
         ) : visibleDesigns.length > 0 ? (
     <div className="grid grid-cols-2 gap-3.5">
       {visibleDesigns.map((item) => {
            const isFav = favorites.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => onSelectDesign && onSelectDesign(item)}
                className="khaliji-card-glass rounded-3xl p-2.5 flex flex-col justify-between border border-[#EADFC7] shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-98"
              >
                <div className="relative w-full h-44 bg-gradient-to-br from-[#23201C] to-[#3D2D1E] rounded-2xl overflow-hidden flex items-center justify-center shadow-inner border border-white/40">
                  {item.image ? (
                    <img src={item.image} alt={item.title} onClick={(e) => { e.stopPropagation(); openImageViewer(item.image, item.title); }} className="w-full h-full object-cover cursor-zoom-in" />
                  ) : (
                    <span className="text-5xl filter drop-shadow-lg">✨👗</span>
                  )}
                                 {/* نقطه رنگ طرح (چپ بالا) */}
               {item.colorHex && item.colorHex !== 'multi' && (
                 <span className="absolute top-2.5 left-2.5 w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: item.colorHex }} />
               )}
               {item.colorHex === 'multi' && (
                 <span className="absolute top-2.5 left-2.5 w-5 h-5 rounded-full border-2 border-white shadow-sm bg-gradient-to-br from-[#D4AF37] via-[#0E8388] to-[#C85A32]" />
               )}
               {/* بج نوع پوشاک (راست بالا) */}
               <span className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-[#D4AF37] text-white flex items-center justify-center text-base shadow-md border-2 border-white/70">
                 {garmentIcon(item)}
               </span>
               {/* علاقه‌مندی (چپ پایین) */}
               <button
                 onClick={(e) => toggleFavorite(e, item)}
                 className="absolute bottom-2.5 left-2.5 w-7 h-7 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#23201C] shadow-sm active:scale-90"
               >
                 <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-[#23201C]'}`} />
               </button>
                </div>

                <div className="pt-3 px-1 text-center space-y-1.5">
                  <h3 className="font-black text-xs text-[#23201C] truncate">
                    <Highlight text={item.title} query={effectiveQuery} />
                  </h3>
                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#7E7667] font-bold truncate">
                    <span className="truncate"><Highlight text={item.tailorName || 'خیاطی ماهور'} query={effectiveQuery} /></span>
                    <Scissors className="w-3 h-3 text-[#0E8388] shrink-0" />
                  </div>
                             <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-[#7E7667]">
             <Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
             <span>{Number(item.tailorRating || 5).toLocaleString('fa-IR')}</span>
             <span>({Number(item.reviewsCount || 0).toLocaleString('fa-IR')} نظر)</span>
           </div>
           {(item.embellishments?.[0] || item.tags?.[0]) && (
             <span className="inline-block px-2 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#B38F24] text-[9px] font-black">
               {item.embellishments?.[0] || item.tags?.[0]}
             </span>
           )}
           <div className="text-xs font-black text-[#23201C] pt-1 border-t border-[#F8F5EE]">
             از {item.price?.toLocaleString('fa-IR')} تومان
           </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="khaliji-card-glass rounded-3xl p-8 border border-[#EADFC7] text-center space-y-2 my-6">
          <div className="text-4xl">🔍</div>
          <h3 className="text-xs font-black text-[#23201C]">
            {effectiveQuery ? `نتیجه‌ای برای «${effectiveQuery}» یافت نشد` : 'طرحی با این مشخصات یافت نشد'}
          </h3>
          {effectiveQuery && (
            <p className="text-[10px] text-[#7E7667] font-bold">املای عبارت را بررسی کنید یا کوتاه‌تر بنویسید؛ مثلاً «شلوار بندری»، «کندوره» یا نام خیاط.</p>
          )}
        </div>
      )}

    </div>
  );
};