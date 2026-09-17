// src/components/common/StoryViewerModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
X, Eye, Heart, Send, ChevronUp, ChevronDown, Trash2,
Lock, Check, Clock, User, ChevronLeft, ZoomIn
} from 'lucide-react';
import { API_BASE } from '../../api/api';
import { useToast } from './ToastSystem';
import { useBackLayer } from '../../hooks/useBackLayer';
import { openImageViewer } from '../../utils/imageViewer';

// محاسبه زمان نسبی به زبان فارسی (مثال: ۲ دقیقه پیش، ۵ دقیقه پیش)
const formatStoryTime = (timestamp) => {
  if (!timestamp) return 'همین الان';
  const ts = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
  const diffMs = Date.now() - ts;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  const toFa = (n) => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

  if (diffMins < 2) return 'همین الان';
  if (diffMins < 60) return `${toFa(diffMins)} دقیقه پیش`;
  if (diffHours < 24) return `${toFa(diffHours)} ساعت پیش`;
  return '۱ روز پیش';
};

export const StoryViewerModal = ({
  storiesList = [],
  initialIndex = 0,
  story,
  onClose,
  onOpenChat,
  onOrderWork,
  onDeleteStory,
  isTailor = false,
  currentUser = null
}) => {
  const { toast, confirmAction } = useToast();

  // 🛡️ گارد اختصاصی: فیلتر قطعی استوری‌ها تا فقط استوری‌های همین خیاط خاص در اسلایدر باشند
  const activeTailorId = String(story?.userId || story?.user_id || '');
  const rawList = storiesList && storiesList.length > 0 ? storiesList : (story ? [story] : []);
  const playlist = activeTailorId 
    ? rawList.filter(s => String(s.userId || s.user_id || '') === activeTailorId)
    : rawList;

  const safeInitialIndex = Math.max(0, Math.min(initialIndex, Math.max(0, playlist.length - 1)));

  const [currentIndex, setCurrentIndex] = useState(safeInitialIndex);

  // ۱. تعریف فوری و اول استوری فعال و مالکیت (جلوگیری قطعی از خطای Cannot access 'R' before initialization)
  const currentStory = playlist[currentIndex] || playlist[0] || story;
  const isOwner = isTailor || Boolean(
    currentUser?.id && currentStory && (
      (currentStory.userId && currentStory.userId === currentUser.id) ||
      (currentStory.user_id && currentStory.user_id === currentUser.id)
    )
  );

  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [quickMessage, setQuickMessage] = useState('');
  const [viewCount, setViewCount] = useState(0);

  // کشوی آمار و بینندگان برای خیاط (Swipe-up Drawer)
  const [showViewersDrawer, setShowViewersDrawer] = useState(false);
  const [viewersList, setViewersList] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);

  // کشیدن به پایین برای بستن (Swipe Down to Dismiss)
  const [dragDismissY, setDragDismissY] = useState(0);
const touchStartY = useRef(null);
const touchStartX = useRef(null);
const lastTouchEndRef = useRef(0);
// حالت فوکوس (مکث): مثل واتساپ همهٔ رابط کاربری پنهان می‌شود و فقط عکس می‌ماند
const [focusMode, setFocusMode] = useState(false);

  // لود وضعیت اولیه لایک و تعداد آن (اکنون currentStory کاملاً در دسترس است)
  useEffect(() => {
    if (currentStory) {
      setIsLiked(Boolean(currentStory.isLiked));
      setLikeCount(currentStory.likes || 0);
    }
  }, [currentStory?.id]);

  // عملیات لایک کردن آنی با ثبت در دیتابیس
  const handleToggleLike = async (e) => {
    e?.stopPropagation();
    if (!currentUser?.id || !currentStory?.id) return;

    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikeCount(prev => nextState ? prev + 1 : Math.max(0, prev - 1));

    try {
      const res = await fetch(`${API_BASE}/stories.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like', story_id: currentStory.id, user_id: currentUser.id })
      });
      const data = await res.json();
      if (data.success) {
        setIsLiked(Boolean(data.liked));
        setLikeCount(data.likes);
      }
    } catch (e) {
      setIsLiked(!nextState);
      setLikeCount(prev => !nextState ? prev + 1 : Math.max(0, prev - 1));
    }
  };

  useBackLayer(showViewersDrawer, () => setShowViewersDrawer(false));
  useBackLayer(!showViewersDrawer && Boolean(currentStory), onClose);

  // ثبت بازدید توسط سایر کاربران
  useEffect(() => {
    if (!currentStory || !currentUser) return;
    setViewCount(currentStory.views || 0);

    if (isOwner) return;

    const trackView = async () => {
      try {
        const res = await fetch(`${API_BASE}/stories.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'view', story_id: currentStory.id, user_id: currentUser.id }),
        });
        const data = await res.json();
        if (data.success && typeof data.views === 'number') {
          setViewCount(data.views);
        }
      } catch {}
    };
    trackView();
  }, [currentStory?.id, currentUser?.id]);

  // دریافت لیست بینندگان استوری برای خیاط
  const fetchViewers = async () => {
    if (!currentStory?.id || !isOwner) return;
    setLoadingViewers(true);
    try {
      const res = await fetch(`${API_BASE}/stories.php?action=viewers&story_id=${currentStory.id}`);
      const data = await res.json();
      if (data.success && data.viewers) {
        setViewersList(data.viewers);
      }
    } catch (e) {
      console.error('Error fetching story viewers:', e);
    } finally {
      setLoadingViewers(false);
    }
  };

  const openViewersDrawer = () => {
    setIsPaused(true);
    setShowViewersDrawer(true);
    fetchViewers();
  };

  const closeViewersDrawer = () => {
    setShowViewersDrawer(false);
    setIsPaused(false);
  };

  useEffect(() => {
setCurrentIndex(safeInitialIndex);
setProgress(0);
setShowViewersDrawer(false);
setFocusMode(false);
setIsPaused(false);
}, [safeInitialIndex]);

  // تایمر ۵ ثانیه‌ای پروگرس‌بار
  useEffect(() => {
    if (!currentStory || isPaused || showViewersDrawer) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < playlist.length - 1) {
            setCurrentIndex((idx) => idx + 1);
            return 0;
          } else {
            clearInterval(timer);
            if (onClose) onClose();
            return 100;
          }
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, showViewersDrawer, playlist.length, currentStory, onClose]);

  useEffect(() => {
    setProgress(0);
    setIsLiked(false);
    setQuickMessage('');
  }, [currentIndex]);

  if (!currentStory) return null;

  const storyImg = currentStory.image || currentStory.workImage;

  // جابجایی بین استوری‌ها
  const handleNextStory = (e) => {
    e?.stopPropagation();
    if (currentIndex < playlist.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      if (onClose) onClose();
    }
  };

  const handlePrevStory = (e) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // ارسال پیام سریع به چت خیاط
  const handleSendQuickReply = (e) => {
    e?.preventDefault();
    if (!quickMessage.trim()) return;
    toast.success('پیام شما برای خیاط ارسال شد ✓');
    setQuickMessage('');
    if (onOpenChat) onOpenChat();
  };

  // حذف استوری توسط خیاط
  const handleDeleteStory = async (e) => {
    e?.stopPropagation();
    const ok = await confirmAction({
      title: 'حذف استوری',
      message: 'آیا از حذف این استوری از ویترین اطمینان دارید؟',
      confirmLabel: 'بله، حذف شود',
      danger: true
    });
    if (!ok) return;

    if (onDeleteStory) onDeleteStory(currentStory.id);
    if (onClose) onClose();
  };

  // رویدادهای لمسی برای Swipe Down و کشیدن به بالا
  // مکث/فوکوس: با ضربه روی مرکز، کل UI پنهان و فقط عکس می‌ماند
const toggleFocus = () => {
setFocusMode((f) => {
const next = !f;
setIsPaused(next);
return next;
});
};
// ناوبری یا مکث بر اساس ناحیهٔ ضربه (چپ / مرکز / راست)
const handleTap = (x, target) => {
if (target && target.closest && target.closest('button, a, input, form')) return; // دکمه‌ها کار خودشان را بکنند
const w = window.innerWidth || 360;
if (!focusMode && x < w / 3) { handleNextStory(); }
else if (!focusMode && x > (2 * w) / 3) { handlePrevStory(); }
else { toggleFocus(); }
};
const onTouchStart = (e) => {
touchStartY.current = e.touches[0].clientY;
touchStartX.current = e.touches[0].clientX;
setDragDismissY(0);
};
const onTouchMove = (e) => {
if (touchStartY.current === null) return;
const dy = e.touches[0].clientY - touchStartY.current;
if (dy > 0) setDragDismissY(dy); // کشیدن به پایین
};
const onTouchEnd = (e) => {
lastTouchEndRef.current = Date.now();
if (touchStartY.current !== null) {
const dy = e.changedTouches[0].clientY - touchStartY.current;
const dx = e.changedTouches[0].clientX - (touchStartX.current ?? 0);
if (dy > 100) {
if (onClose) onClose();
touchStartY.current = null; touchStartX.current = null; setDragDismissY(0);
return;
}
if (isOwner && dy < -60) {
openViewersDrawer();
} else if (Math.abs(dy) < 10 && Math.abs(dx) < 10) {
handleTap(e.changedTouches[0].clientX, e.target);
}
}
touchStartY.current = null;
touchStartX.current = null;
setDragDismissY(0);
};
// کلیک ماوس (دسکتاپ)؛ اگر بلافاصله بعد از لمس باشد نادیده گرفته می‌شود
const onClickContainer = (e) => {
if (Date.now() - lastTouchEndRef.current < 500) return;
handleTap(e.clientX, e.target);
};

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-0 select-none overflow-hidden max-w-md mx-auto">
      <div
        onTouchStart={onTouchStart}
onTouchMove={onTouchMove}
onTouchEnd={onTouchEnd}
onClick={onClickContainer}
        style={{
          transform: `translateY(${dragDismissY}px)`,
          opacity: Math.max(0.4, 1 - dragDismissY / 300),
          transition: dragDismissY === 0 ? 'transform 250ms ease-out' : 'none'
        }}
        className="w-full h-full relative flex flex-col justify-between p-4 text-white overflow-hidden"
      >
        {/* =========================================================================
            ۱. پس‌زمینه تصویر (Full-Bleed Ambient Blur) - بدون نوارهای مشکی مرده
            ========================================================================= */}
        {storyImg ? (
          <>
            {/* لایه پشت: تصویر بلورین هماهنگ با رنگ لباس */}
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-40 scale-125 z-0"
              style={{ backgroundImage: `url(${storyImg})` }}
            />
            {/* لایه رو: عکس واضح و کامل بدون برش */}
            <img
              src={storyImg}
              alt="استوری"
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
          </>
        ) : (
          <div className={`absolute inset-0 w-full h-full ${currentStory.bgGradient || 'bg-gradient-to-b from-[#0B251E] via-[#061814] to-[#020A08]'} z-0`} />
        )}

        {/* سایه‌های ملایم بالا و پایین برای خوانایی کنترل‌ها */}
             <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/75 via-black/30 to-transparent pointer-events-none z-10 ${focusMode ? 'hidden' : ''}`} />
     <div className={`absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none z-10 ${focusMode ? 'hidden' : ''}`} />

        {/* =========================================================================
            ۲. نوار پیشرفت بالا و هدر استوری
            ========================================================================= */}
             <div className={`relative z-30 space-y-3 ${focusMode ? 'hidden' : ''}`}>
       {/* سگمنت‌های نوار پیشرفت */}
          <div className="w-full flex items-center gap-1.5">
            {playlist.map((s, idx) => (
              <div key={s.id || idx} className="flex-1 bg-white/30 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-[#D4AF37] h-full transition-all duration-75 ease-linear"
                  style={{
                    width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* هدر استوری (پروفایل خیاط + نام و زمان + دکمه خروج) */}
          <div className="flex items-center justify-between">
            
            {/* سمت چپ: دکمه بستن */}
            <button
              onClick={(e) => { e.stopPropagation(); if (onClose) onClose(); }}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>

            {/* سمت راست: نشان خیاط با رینگ زرین و نام کارگاه */}
            <div className="flex items-center gap-2.5 text-right">
              <div>
                <div className="flex items-center justify-end gap-1">
                  <span className="text-xs font-black text-white">{currentStory.name || 'کارگاه خیاطی'}</span>
                </div>
                <span className="text-[10px] text-white/80 font-bold block mt-0.5">
                  بندرعباس • {formatStoryTime(currentStory.createdAt)}
                </span>
              </div>

              <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#0E8388] via-[#D4AF37] to-[#FFF5C0] shadow-md shrink-0">
                <div className="w-full h-full bg-[#FAF6ED] rounded-full flex items-center justify-center text-lg overflow-hidden border border-white">
                  🧕
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* لایه متن روی عکس (در صورت وجود) */}
        {currentStory.storyTitle && (
          <div className="relative z-20 my-auto text-center px-4 pointer-events-none">
            <div className="inline-block px-5 py-2.5 rounded-2xl bg-black/60 backdrop-blur-md border border-[#D4AF37]/60 shadow-2xl">
              <p className="text-sm sm:text-base font-black text-white leading-relaxed drop-shadow-md">
                {currentStory.storyTitle}
              </p>
            </div>
          </div>
        )}

        {/* =========================================================================
            ۳. پایین استوری: تفکیک دقیق نمای مشتری و نمای خیاط (مطابق دو گوشی تصویر)
            ========================================================================= */}
             <div className={`relative z-30 pt-2 ${focusMode ? 'hidden' : ''}`}>
       {!isOwner ? (
            /* ─── گوشی سمت چپ: نمای مشتری (پیام سریع + دکمه سفارش این مدل) ─── */
            <div className="space-y-2.5">
              <form onSubmit={handleSendQuickReply} className="flex items-center gap-2">
                             <div className="flex-1"></div>

                <button
                  type="button"
                  onClick={handleToggleLike}
                  className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all shrink-0 active:scale-125 ${
                    isLiked
                      ? 'bg-gradient-to-tr from-rose-600 to-pink-500 border-rose-400 text-white shadow-lg shadow-rose-500/40'
                      : 'bg-black/50 border-white/35 text-white hover:bg-white/10'
                  }`}
                  title={isLiked ? 'پسندیده‌اید' : 'پسندیدن این استوری'}
                >
                  <Heart className={`w-5 h-5 transition-transform ${isLiked ? 'fill-white scale-110' : ''}`} />
                </button>
              </form>

              {/* دکمه طلایی ثبت سفارش این مدل (دقیقاً مطابق طرح عکس) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onClose) onClose();
                  if (onOrderWork) onOrderWork();
                }}
                className="w-full py-4 rounded-full text-[#1C150F] font-black text-xs shadow-2xl flex items-center justify-center gap-2 active:scale-98 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #E5C158 0%, #D4AF37 50%, #AA771C 100%)',
                  boxShadow: '0 8px 30px rgba(212, 175, 55, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.4)'
                }}
              >
                <span>ثبت سفارش این مدل</span>
                <Lock className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* ─── گوشی سمت راست: نمای خیاط (دکمه بینندگان و کشوی سوایپ به بالا) ─── */
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                {/* دکمه باز کردن کشوی بینندگان و لایک‌های استوری */}
                <button
                  type="button"
                  onClick={openViewersDrawer}
                  className="flex-1 py-3 px-4 rounded-full bg-black/60 backdrop-blur-xl border border-[#D4AF37]/60 text-[#FCF6BA] text-xs font-black flex items-center justify-between shadow-xl active:scale-95 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4 text-[#0E8388]" />
                      <span>{viewCount.toLocaleString('fa-IR')}</span>
                    </div>
                    <div className="flex items-center gap-1 text-rose-400">
                      <Heart className="w-3.5 h-3.5 fill-rose-500" />
                      <span>{likeCount.toLocaleString('fa-IR')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-white/80 font-bold">
                    <span>بینندگان و لایک‌ها</span>
                    <ChevronUp className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                </button>

                {/* دکمه حذف استوری */}
                <button
                  type="button"
                  onClick={handleDeleteStory}
                  className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 flex items-center justify-center active:scale-90 transition-transform shrink-0"
                  title="حذف این استوری"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* راهنمای کشیدن به بالا */}
              <p className="text-center text-[10px] text-white/60 font-bold pointer-events-none">
                برای مشاهده آمار و بینندگان، انگشت خود را به بالا بکشید
              </p>
            </div>
          )}
        </div>

             {/* دکمهٔ بزرگ‌نمایی در حالت فوکوس (دقیقاً مثل نمایشگر نمونه‌کارها) */}
     {focusMode && storyImg && (
       <button
         type="button"
         onClick={(e) => { e.stopPropagation(); openImageViewer(storyImg, currentStory.storyTitle || currentStory.name || 'استوری کَندوره'); }}
         className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-11 h-11 rounded-full bg-black/45 backdrop-blur-md border border-white/25 text-white flex items-center justify-center active:scale-90"
         title="بزرگ‌نمایی تصویر"
       >
         <ZoomIn className="w-5 h-5" />
       </button>
     )}
         {/* =========================================================================
      ۴. کشوی اختصاصی بازدیدکنندگان استوری برای خیاط (Swipe-up Drawer)
      ========================================================================= */}
  {showViewersDrawer && (
       <div 
         onClick={closeViewersDrawer}
         className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-0 cursor-pointer"
       >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-[#FAF7F0] w-full max-w-md rounded-t-[2.5rem] p-5 space-y-4 border-t-2 border-[#D4AF37]/50 shadow-2xl text-[#23201C] max-h-[75vh] flex flex-col animate-in slide-in-from-bottom duration-250 cursor-default"
            >
              
              {/* هندل کشو و هدر */}
              <div className="space-y-2 shrink-0">
                <div className="w-12 h-1 bg-[#EADFC7] rounded-full mx-auto" />

                <div className="flex items-center justify-between border-b border-[#EADFC7] pb-3">
                  <button
                    onClick={closeViewersDrawer}
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#23201C] shadow-sm active:scale-90"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[11px] font-mono font-black text-[#0E8388] bg-[#0E8388]/10 px-2.5 py-0.5 rounded-full border border-[#0E8388]/20">
                      <span>{viewCount.toLocaleString('fa-IR')}</span>
                      <Eye className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-sm font-black text-[#23201C]">بازدیدکنندگان استوری</h3>
                  </div>
                </div>
              </div>

              {/* لیست بینندگان (آواتار، نام، زمان نسبی - بدون دکمه پیام) */}
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5 pr-0.5">
                {loadingViewers ? (
                  <div className="text-center py-12 text-xs font-black text-[#7E7667]">در حال دریافت لیست بینندگان...</div>
                ) : viewersList.length > 0 ? (
                  viewersList.map((v) => (
                    <div
                      key={v.id}
                      className="p-3 rounded-2xl bg-white border border-[#EADFC7] flex items-center justify-between shadow-2xs text-right"
                    >
                      {/* سمت چپ: زمان بازدید به فارسی */}
                      <span className="text-[10px] text-[#7E7667] font-bold">
                        {formatStoryTime(v.viewedAt)}
                      </span>

                      {/* سمت راست: آواتار با نشان قلب و نام مشتری */}
                      <div className="flex items-center gap-2.5">
                        <div className="text-right">
                          <span className="text-xs font-black text-[#23201C] block">{v.name}</span>
                          {v.hasLiked && (
                            <span className="text-[9px] font-bold text-rose-600 flex items-center justify-end gap-0.5">
                              <span>پسندید</span>
                              <Heart className="w-2.5 h-2.5 fill-rose-500" />
                            </span>
                          )}
                        </div>
                        <div className="relative w-10 h-10 rounded-full bg-[#FAF6ED] border border-[#D4AF37]/50 flex items-center justify-center overflow-hidden text-base shadow-sm shrink-0">
                          {v.avatar ? (
                            <img src={v.avatar} alt={v.name} className="w-full h-full object-cover" />
                          ) : (
                            '👤'
                          )}
                          {v.hasLiked && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-rose-500 rounded-full border border-white flex items-center justify-center shadow-xs">
                              <Heart className="w-2.5 h-2.5 fill-white text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 space-y-2">
                    <span className="text-3xl block">👁️</span>
                    <p className="text-xs font-black text-[#7E7667]">هنوز کاربری این استوری را مشاهده نکرده است.</p>
                  </div>
                )}
              </div>

              {/* کپسول‌های ۳‌گانه آمار پایین کشو (بازدید، لایک، زمان) */}
              <div className="pt-2 border-t border-[#EADFC7] grid grid-cols-3 gap-2 text-center text-xs font-black shrink-0">
                <div className="bg-white p-2.5 rounded-2xl border border-[#EADFC7] space-y-0.5">
                  <span className="text-sm font-black text-[#0E8388] block">{viewCount.toLocaleString('fa-IR')}</span>
                  <span className="text-[9px] text-[#7E7667] font-bold">بازدید کل</span>
                </div>

                <div className="bg-white p-2.5 rounded-2xl border border-[#EADFC7] space-y-0.5">
                  <span className="text-sm font-black text-rose-600 block">{likeCount.toLocaleString('fa-IR')}</span>
                  <span className="text-[9px] text-[#7E7667] font-bold">پسندیده‌ها</span>
                </div>

                <div className="bg-white p-2.5 rounded-2xl border border-[#EADFC7] space-y-0.5">
                  <span className="text-sm font-black text-[#B38F24] block">۲۴ ساعت</span>
                  <span className="text-[9px] text-[#7E7667] font-bold">اعتبار</span>
                </div>
              </div>

                     </div>
       </div>
  )}
   </div>
 </div>
);
};