// src/components/customer/HomeScreen.jsx
import React, { useState, useEffect } from 'react';
import { Bell, Bookmark, ChevronDown, MapPin, ChevronLeft, Flame, Heart, Star, CheckCircle2 } from 'lucide-react';
import { designsApi } from '../../api/api';
import { useToast } from '../common/ToastSystem';
import { useUnreadBadge } from '../common/NotificationEngine';
import { openImageViewer } from '../common/ImageViewerModal';

export const HomeScreen = ({ 
  stories = [], 
  portfolioItems = [], 
  onSelectDesign, 
  onSelectTailor, 
  onBrowseAll, 
  onOpenWishlist, 
  onOpenNotifications, 
  onOpenStory 
}) => {
const { toast } = useToast();
const unreadCount = useUnreadBadge();
const [popularDesigns, setPopularDesigns] = useState(portfolioItems || []);
  const [topTailorsList, setTopTailorsList] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('kandooreh_wishlist');
      return saved ? JSON.parse(saved).map(item => item.id) : [];
    } catch { return []; }
  });

  // دریافت طرح‌های پرطرفدار و ۳ خیاط برتر واقعی بر اساس بیشترین سفارش
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // ۱. طرح‌های پرطرفدار
        const resDesigns = await fetch(`https://kandoore.ir/api/designs.php?popular=1`);
        const dataDesigns = await resDesigns.json();
        if (dataDesigns.success && dataDesigns.designs?.length > 0) {
          setPopularDesigns(dataDesigns.designs);
        } else {
          setPopularDesigns(portfolioItems);
        }

        // ۲. ۳ خیاط برتر بر اساس بیشترین سفارش
        const resTailors = await fetch(`https://kandoore.ir/api/tailor.php?action=top_tailors`);
        const dataTailors = await resTailors.json();
        if (dataTailors.success && dataTailors.tailors) {
          setTopTailorsList(dataTailors.tailors);
        }
      } catch (e) {
        setPopularDesigns(portfolioItems);
      }
    };
    fetchHomeData();
  }, [portfolioItems]);

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
  const [viewedStoryIds, setViewedStoryIds] = useState(() => {
    try {
      const saved = localStorage.getItem('kandooreh_viewed_stories');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // گروه‌بندی استوری‌ها بر اساس خیاط
  const groupedByTailor = (stories || []).reduce((acc, story) => {
    const tailorKey = String(story.userId || story.user_id || story.id);
    if (!acc[tailorKey]) acc[tailorKey] = [];
    acc[tailorKey].push(story);
    return acc;
  }, {});

  const storyGroups = Object.entries(groupedByTailor).map(([tailorId, groupStories]) => {
    const sorted = [...groupStories].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const allViewed = sorted.every(s => viewedStoryIds.includes(s.id));
    return {
      tailorId,
      name: sorted[0].name,
      avatar: sorted[0].image || null,
      latestStory: sorted[0],
      stories: sorted,
      isViewed: allViewed,
    };
  }).sort((a, b) => (b.latestStory.createdAt || 0) - (a.latestStory.createdAt || 0));

  const handleStoryClick = (group) => {
    const newViewed = [...viewedStoryIds];
    group.stories.forEach(s => {
      if (!newViewed.includes(s.id)) newViewed.push(s.id);
    });
    setViewedStoryIds(newViewed);
    localStorage.setItem('kandooreh_viewed_stories', JSON.stringify(newViewed));
    if (onOpenStory) onOpenStory(group.latestStory, group.stories);
  };

  return (
    <div className="pb-32 pt-2 px-4 max-w-md mx-auto select-none space-y-5">
      
      {/* هدر */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={onOpenNotifications}
              className="w-10 h-10 rounded-full khaliji-card-glass flex items-center justify-center text-[#23201C] border border-[#EADFC7] shadow-sm active:scale-90 transition-transform"
            >
                         <Bell className="w-5 h-5 text-[#23201C] animate-bell" />
            </button>
            {unreadCount > 0 && (
<span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
{unreadCount > 9 ? '+۹' : unreadCount.toLocaleString('fa-IR')}
</span>
)}
          </div>

          <button 
            onClick={onOpenWishlist}
            className="w-10 h-10 rounded-full khaliji-card-glass flex items-center justify-center text-[#23201C] border border-[#EADFC7] shadow-sm active:scale-90 transition-transform"
          >
            <Bookmark className="w-5 h-5 text-[#23201C]" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full khaliji-card-glass cursor-pointer border border-[#EADFC7]">
          <ChevronDown className="w-3.5 h-3.5 text-[#7E7667]" />
          <span className="text-xs font-black text-[#23201C]">بندرعباس</span>
          <MapPin className="w-4 h-4 text-[#B38F24]" />
        </div>
      </div>

      {/* استوری‌های زنده ۲۴ ساعته */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{storyGroups.length > 0 ? `زنده (${storyGroups.length})` : 'استوری کارگاه'}</span>
          </div>
          <span className="text-xs font-black text-[#23201C]">استوری‌های زنده خیاطان هرمزگان</span>
        </div>

        {storyGroups.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
            {storyGroups.map((group) => (
                <div
                  key={group.tailorId}
                  onClick={() => handleStoryClick(group)}
                  className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 transition-transform"
                >
                  <div className={group.isViewed ? 'story-ring-viewed' : 'story-ring-unread'}>
                    <div className="w-16 h-16 rounded-full bg-[#FAF6ED] p-0.5 border-2 border-white shadow-inner flex items-center justify-center overflow-hidden">
                      {group.avatar ? (
                        <img src={group.avatar} alt={group.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-[#23201C] to-[#4A3B2C] flex items-center justify-center text-2xl text-white shadow-inner">
                          {group.latestStory?.iconEmoji || '🧕'}
                        </div>
                      )}
                    </div>
                    {group.stories.length > 1 && (
                      <span className="absolute -bottom-0.5 -left-0.5 w-5 h-5 rounded-full bg-[#D4AF37] text-white text-[9px] font-black flex items-center justify-center border-2 border-white shadow-sm">
                        {group.stories.length}
                      </span>
                    )}
                  </div>
                  <span className={`text-[11px] font-black text-center truncate max-w-[75px] ${
                    group.isViewed ? 'text-[#7E7667]' : 'text-[#23201C]'
                  }`}>
                    {group.name}
                  </span>
                </div>
            ))}
          </div>
        ) : (
          <div className="khaliji-card-glass rounded-2xl p-3 border border-[#EADFC7] flex items-center justify-between text-right shadow-sm">
            <div className="text-right flex-1 pr-2">
              <span className="text-[11px] font-black text-[#23201C] block">هنوز استوری فعالی ثبت نشده است ✨</span>
              <span className="text-[9px] text-[#7E7667] font-bold block mt-0.5">خیاطان به زودی از مراحل دوخت استوری می‌گذارند.</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 text-[#B38F24] flex items-center justify-center text-xl shrink-0">
              📸
            </div>
          </div>
        )}
      </div>

      {/* بنر ویژه هفته */}
      <div className="banner-luxury rounded-3xl p-5 relative overflow-hidden text-white flex items-center justify-between shadow-xl">
        <div className="z-10 max-w-[62%] space-y-2 text-right">
          <h3 className="font-black text-base text-[#FBF5B7] drop-shadow-sm leading-snug">
            طرح‌های برگزیده هفته
          </h3>
          <p className="text-[11px] text-white/80 leading-relaxed font-medium">
            سفارش مستقیم از برترین خیاطان هرمزگان
          </p>
          <button 
            type="button"
                     onClick={() => toast.info('✨ جشنواره و بخش طرح‌های برگزیده هفته به زودی و در به‌روزرسانی‌های بعدی کَندوره در دسترس قرار خواهد گرفت.')}
            className="mt-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white text-xs font-black shadow-lg flex items-center gap-1 active:scale-95 transition-transform"
          >
            <span>به زودی ✨</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-24 h-28 rounded-2xl bg-gradient-to-br from-[#2A1F16] via-[#1C150F] to-[#0A0705] border-2 border-[#D4AF37]/60 flex flex-col items-center justify-center text-4xl shadow-2xl shrink-0 p-2 text-center">
          <span className="filter drop-shadow-xl animate-pulse">👑👗</span>
          <span className="text-[9px] text-[#FCF6BA] font-black mt-1">طرح فاخر</span>
        </div>
      </div>

      {/* طرح‌های پرطرفدار واقعی بر اساس بیشترین سفارش */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <button 
            onClick={onBrowseAll}
            className="flex items-center gap-0.5 text-xs font-black text-[#7E7667] hover:text-[#23201C]"
          >
            <span>مشاهده همه</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1.5 text-xs font-black text-[#23201C]">
            <Flame className="w-4 h-4 text-[#C85A32]" />
            <span>طرح‌های پرطرفدار</span>
          </div>
        </div>

        {popularDesigns.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {popularDesigns.map((item) => {
              const isFav = favorites.includes(item.id);
              return (
                <div 
                  key={item.id} 
                  onClick={() => onSelectDesign && onSelectDesign(item)}
                  className="khaliji-card-glass rounded-3xl p-3 w-[155px] shrink-0 flex flex-col justify-between cursor-pointer active:scale-98 transition-transform border border-[#EADFC7]"
                >
                  <div className="w-full h-40 rounded-2xl mb-2.5 bg-gradient-to-br from-[#23201C] to-[#3D2D1E] flex flex-col items-center justify-center relative border border-white/40 shadow-inner overflow-hidden">
                                     {item.image ? (
                   <img src={item.image} alt={item.title} onClick={(e) => { e.stopPropagation(); openImageViewer(item.image, item.title); }} className="w-full h-full object-cover cursor-zoom-in" />
                 ) : (
<span className="text-5xl filter drop-shadow-2xl">✨👗</span>
)}
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(e, item)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500 animate-heart' : 'text-[#7E7667]'}`} />
                    </button>
                  </div>

                  <div className="text-center space-y-1">
                    <h4 className="font-black text-xs text-[#23201C] truncate">{item.title}</h4>
                    <div className="text-xs font-black text-[#0E8388] pt-0.5">
                      از {item.price?.toLocaleString('fa-IR')} تومان
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="khaliji-card-glass rounded-2xl p-4 border border-[#EADFC7] text-center space-y-1">
            <span className="text-xs font-black text-[#23201C] block">طرح‌های جدید به زودی توسط خیاطان قرار می‌گیرند.</span>
          </div>
        )}
      </div>

      {/* ۳ خیاط برتر بر اساس بیشترین تعداد سفارش */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <button 
            onClick={onBrowseAll}
            className="flex items-center gap-0.5 text-xs font-black text-[#7E7667] hover:text-[#23201C]"
          >
            <span>جستجو در خیاطان</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1.5 text-xs font-black text-[#23201C]">
            <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
            <span>خیاطان برتر ({topTailorsList?.length || 0})</span>
          </div>
        </div>

        {topTailorsList.length > 0 ? (
          <div className="space-y-2.5">
            {topTailorsList.map((tailor, index) => (
                         <div 
             key={tailor.id}
             onClick={() => onSelectTailor && onSelectTailor(tailor)}
             style={{ animationDelay: `${index * 90}ms` }}
             className="khaliji-card-glass rounded-[2rem] p-3.5 flex items-center justify-between cursor-pointer active:scale-98 transition-transform border border-[#EADFC7] shadow-sm hover:border-[#D4AF37] animate-rise"
           >
                {/* آمار سمت چپ */}
                <div className="flex items-center gap-2.5 text-center text-[10px] font-black border-l border-[#EADFC7] pl-3">
                  <div>
                    <div className="flex items-center justify-center gap-0.5 text-[#23201C]">
                      <span>{tailor.rating}</span>
                      <Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
                    </div>
                    <span className="text-[8px] text-[#7E7667] block mt-0.5">({tailor.reviews} نظر)</span>
                  </div>
                  <div className="border-r border-[#EADFC7] pr-2.5">
                    <span className="text-[#23201C] block text-xs">{tailor.completedOrders}</span>
                    <span className="text-[8px] text-[#7E7667] block mt-0.5">سفارش</span>
                  </div>
                </div>

                {/* مشخصات خیاط و رتبه */}
                <div className="flex items-center gap-2.5 text-right flex-1 pr-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.5 rounded-md bg-[#D4AF37]/20 text-[#B38F24] text-[9px] font-black">
                        #{index + 1}
                      </span>
                      <h3 className="font-black text-xs text-[#23201C]">{tailor.name}</h3>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                    </div>
                    <span className="text-[10px] text-[#7E7667] font-bold block">{tailor.city}</span>
                  </div>

                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#AA771C] p-0.5 shadow-md flex items-center justify-center shrink-0">
                    <div className="w-full h-full bg-[#FAF6ED] rounded-full flex items-center justify-center text-xl border border-white overflow-hidden">
                      {tailor.avatar ? (
                        <img src={tailor.avatar} alt={tailor.name} className="w-full h-full object-cover" />
                      ) : (
                        '🧕'
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="khaliji-card-glass rounded-2xl p-4 border border-[#EADFC7] text-center space-y-1">
            <span className="text-xs font-black text-[#23201C] block">خیاطان فعال به زودی معرفی می‌شوند.</span>
          </div>
        )}
      </div>

    </div>
  );
};