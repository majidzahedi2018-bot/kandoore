// src/components/common/ImageViewerModal.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Download, Share2, ZoomIn, ZoomOut, MessageCircle, RefreshCw } from 'lucide-react';
import { useBackLayer } from '../../hooks/useBackLayer';

// helper سراسری
export const openImageViewer = (payload, title = '', subtitle = '') => {
  if (!payload) return;
  const detail = typeof payload === 'object' && payload.src
    ? payload
    : { src: payload, title, subtitle };
  window.dispatchEvent(new CustomEvent('kandooreh:open-image', { detail }));
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export const ImageViewerModal = ({ imageUrl, caption, onClose }) => {
  const isGlobal = imageUrl === undefined;
  const [evt, setEvt] = useState(null);

  useEffect(() => {
    if (!isGlobal) return undefined;
    const onOpen = (e) => setEvt(e.detail || null);
    window.addEventListener('kandooreh:open-image', onOpen);
    return () => window.removeEventListener('kandooreh:open-image', onOpen);
  }, [isGlobal]);

  const src = isGlobal ? evt?.src : imageUrl;
  const cap = isGlobal ? (evt?.title || 'جزئیات طرح و دوخت') : (caption || 'جزئیات طرح و دوخت');
  const subCap = isGlobal ? (evt?.subtitle || 'کَندوره اصیل زری‌بافی') : 'کَندوره اصیل زری‌بافی';

  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragDismissY, setDragDismissY] = useState(0);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const pointers = useRef(new Map());
  const pinchDist = useRef(0);
  const lastPos = useRef({ x: 0, y: 0 });
  const downPos = useRef({ x: 0, y: 0 });
  const dragRef = useRef(false);
  const movedRef = useRef(false);
  const multiRef = useRef(false);
  const lastTap = useRef(0);
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2600);
  };

  const reset = useCallback(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
    setDragDismissY(0);
  }, []);

  useEffect(() => {
    reset();
  }, [src, reset]);

  useEffect(() => {
    if (!src) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [src]);

  const close = useCallback(() => {
    if (isGlobal) setEvt(null);
    if (onClose) onClose();
  }, [isGlobal, onClose]);

  // لایه برگشت پایدار (دقیقاً ۱ بار رجیستر می‌شود)
  useBackLayer(Boolean(src), close);

  const clampPos = useCallback((p, s) => {
    const limitX = Math.max(0, (window.innerWidth * (s - 1)) / 2);
    const limitY = Math.max(0, (window.innerHeight * (s - 1)) / 2);
    return { x: clamp(p.x, -limitX, limitX), y: clamp(p.y, -limitY, limitY) };
  }, []);

  const toggleZoom = () => {
    if (scale > 1) {
      reset();
    } else {
      setScale(2.4);
      setPos({ x: 0, y: 0 });
    }
  };

  // کلیدهای میانبر دسکتاپ
  useEffect(() => {
    if (!src) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === '+' || e.key === '=') setScale((s) => clamp(s * 1.25, 1, 5));
      else if (e.key === '-' || e.key === '_') setScale((s) => clamp(s * 0.8, 1, 5));
      else if (e.key === '0') reset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [src, close, reset]);

  // ذخیره و دانلود مستقیم تصویر (بدون باز شدن پنجره Share ویندوز)
  const handleSave = async () => {
    if (!src || saving) return;
    setSaving(true);

    const downloadUrl = `https://kandoore.ir/api/download.php?url=${encodeURIComponent(src)}`;
    const isCapacitor = Boolean(window?.Capacitor?.isNativePlatform?.() || window?.Capacitor);

    // ۱. اگر داخل اپلیکیشن اندروید است، مستقیماً به دانلود منیجر نیتیو گوشی می‌سپارد
    if (isCapacitor) {
      window.location.href = downloadUrl;
      setSaving(false);
      return;
    }

    // ۲. در نسخه تحت وب (ویندوز، مک، لینوکس و مرورگر موبایل): دانلود مستقیم فایل به پوشه Downloads
    showToast('در حال دانلود تصویر...');
    try {
      let blob = null;
      try {
        const res = await fetch(src, { mode: 'cors' });
        if (res.ok) blob = await res.blob();
      } catch (e) {}

      if (!blob) {
        const res = await fetch(downloadUrl);
        if (!res.ok) throw new Error('دانلود ناموفق');
        blob = await res.blob();
      }

      const fileName = `kandooreh-${Date.now()}.jpg`;
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      showToast('تصویر با موفقیت در سیستم ذخیره شد 📥');
    } catch (err) {
      // در صورت بروز هرگونه خطای CORS، به لینک مستقیم فورس‌دانلود هاست هدایت می‌کند
      window.location.href = downloadUrl;
      showToast('دانلود تصویر آغاز شد 📥');
    } finally {
      setSaving(false);
    }
  };

  // اشتراک‌گذاری
  const handleShare = async () => {
    if (!src) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: cap,
          text: `${cap} - ${subCap}`,
          url: window.location.href
        });
      } catch (e) {}
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast('لینک تصویر کپی شد 📋');
      } catch (e) {
        showToast('اشتراک‌گذاری پشتیبانی نمی‌شود');
      }
    }
  };

  // باز کردن چت یا ارتباط با خیاط
  const handleChat = () => {
    close();
    window.dispatchEvent(new CustomEvent('kandooreh:open-tailor-chat', {
      detail: {
        tailorName: evt?.tailorName || 'کارگاه خیاطی',
        tailorUserId: evt?.tailorUserId || 2,
        designTitle: cap
      }
    }));
  };

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // رویدادهای لمسی با پشتیبانی از Swipe Down to Dismiss
  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      lastPos.current = { x: e.clientX, y: e.clientY };
      downPos.current = { x: e.clientX, y: e.clientY };
      movedRef.current = false;
      multiRef.current = false;
      dragRef.current = true;
    } else if (pointers.current.size === 2) {
      const [p1, p2] = [...pointers.current.values()];
      pinchDist.current = dist(p1, p2);
      dragRef.current = false;
      multiRef.current = true;
    }
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const [p1, p2] = [...pointers.current.values()];
      const d = dist(p1, p2);
      if (pinchDist.current > 0) {
        const factor = d / pinchDist.current;
        pinchDist.current = d;
        setScale((s) => clamp(s * factor, 1, 5));
      }
    } else if (pointers.current.size === 1 && dragRef.current) {
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };

      if (Math.hypot(e.clientX - downPos.current.x, e.clientY - downPos.current.y) > 8) {
        movedRef.current = true;
      }

      if (scale > 1) {
        setPos((p) => clampPos({ x: p.x + dx, y: p.y + dy }, scale));
      } else {
        // جسچر کشیدن به پایین برای بستن (Swipe Down to Dismiss)
        const totalDy = e.clientY - downPos.current.y;
        if (totalDy > 0) {
          setDragDismissY(totalDy);
        }
      }
    }
  };

  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchDist.current = 0;
    if (pointers.current.size === 1) {
      const [p] = [...pointers.current.values()];
      lastPos.current = { x: p.x, y: p.y };
      dragRef.current = true;
    }

    if (pointers.current.size === 0) {
      dragRef.current = false;

      // اگر کاربر به پایین کشیده باشد:
      if (scale === 1 && dragDismissY > 110) {
        close();
        return;
      }
      setDragDismissY(0);

      // دابل‌تپ
      if (!multiRef.current && !movedRef.current) {
        const now = Date.now();
        if (now - lastTap.current < 280) {
          lastTap.current = 0;
          toggleZoom();
        } else {
          lastTap.current = now;
        }
      }
      multiRef.current = false;
      movedRef.current = false;
    }
  };

  if (!src) return null;

  const dismissProgress = Math.min(1, dragDismissY / 240);
  const backdropOpacity = 1 - dismissProgress * 0.7;

  return (
    <div 
      className="fixed inset-0 z-[95] select-none overflow-hidden transition-colors duration-200"
      style={{
        backgroundColor: `rgba(13, 11, 10, ${backdropOpacity})`
      }}
    >
      {/* هاله نور اتمسفریک طلایی در عمق پس‌زمینه */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.09)_0%,transparent_75%)]" />

      {/* ناحیه تعاملی تصویر با قابلیت زوم و پن */}
      <div
        className="absolute inset-0 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={(e) => setScale((s) => clamp(s * (e.deltaY < 0 ? 1.15 : 0.88), 1, 5))}
      >
        <div
          style={{
            transform: `translate(${pos.x}px, ${pos.y + dragDismissY}px) scale(${scale * (1 - dismissProgress * 0.2)})`,
            transition: dragRef.current ? 'none' : 'transform 220ms cubic-bezier(0.2, 0.9, 0.3, 1)'
          }}
          className="w-full h-full flex items-center justify-center p-2"
        >
          <img
            src={src}
            alt={cap}
            draggable={false}
            className="max-w-full max-h-[85vh] w-auto h-auto object-contain pointer-events-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
          />
        </div>
      </div>

      {/* نوار بالا: دکمه ضربدر شیشه‌ای + تیتر سلطنتی با خط دیوایدر زرین */}
      <div 
        className="absolute top-0 inset-x-0 z-20 pt-6 pb-8 px-5 flex items-start justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-opacity duration-200"
        style={{ opacity: 1 - dismissProgress }}
      >
        {/* دکمه خروج گرد شیشه‌ای مطابق تصویر */}
        <button
          type="button"
          onClick={close}
          aria-label="بستن"
          className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-xl flex items-center justify-center text-white/90 shadow-xl active:scale-90 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* تیتر و نشان زرین وسط */}
        <div className="flex flex-col items-center text-center mt-0.5">
          <h1 className="text-base sm:text-lg font-black text-[#F7E7CE] tracking-tight drop-shadow-md">
            {cap}
          </h1>
          <span className="text-[11px] font-bold text-[#D4AF37] mt-0.5 tracking-wide opacity-90">
            {subCap}
          </span>
          {/* خط تزئینی دیوایدر زرین */}
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <div className="h-[1px] w-10 bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-[#D4AF37]" />
            <span className="text-[#D4AF37] text-[9px]">❖</span>
            <div className="h-[1px] w-10 bg-gradient-to-l from-transparent via-[#D4AF37]/60 to-[#D4AF37]" />
          </div>
        </div>

        {/* فضای خالی قرینه برای حفظ تقارن وسط‌چین */}
        <div className="w-11 h-11" />
      </div>

      {/* داک شیشه‌ای شناور پایین (Floating Action Pill) دقیقاً مطابق طرح عکس */}
      <div 
        className="absolute bottom-6 inset-x-0 z-20 flex flex-col items-center px-4 transition-all duration-200 pointer-events-none"
        style={{ opacity: 1 - dismissProgress, transform: `translateY(${dragDismissY * 0.4}px)` }}
      >
        <div className="pointer-events-auto w-full max-w-sm h-16 rounded-full bg-[#161311]/80 backdrop-blur-2xl border border-[#D4AF37]/35 shadow-[0_12px_40px_rgba(0,0,0,0.7)] flex items-center justify-around px-3">
          
          {/* ۱. دکمه دانلود */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-[#EADFC7] hover:text-[#D4AF37] active:scale-90 transition-transform"
          >
            {saving ? (
              <RefreshCw className="w-5 h-5 text-[#D4AF37] animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span className="text-[10px] font-black">دانلود</span>
          </button>

          <div className="w-px h-6 bg-white/10" />

          {/* ۲. دکمه اشتراک‌گذاری */}
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-[#EADFC7] hover:text-[#D4AF37] active:scale-90 transition-transform"
          >
            <Share2 className="w-5 h-5" />
            <span className="text-[10px] font-black">اشتراک‌گذاری</span>
          </button>

          <div className="w-px h-6 bg-white/10" />

          {/* ۳. دکمه بزرگ‌نمایی / بازنشانی */}
          <button
            type="button"
            onClick={toggleZoom}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-[#EADFC7] hover:text-[#D4AF37] active:scale-90 transition-transform"
          >
            {scale > 1 ? <ZoomOut className="w-5 h-5 text-[#D4AF37]" /> : <ZoomIn className="w-5 h-5" />}
            <span className="text-[10px] font-black">{scale > 1 ? 'اندازه اصلی' : 'بزرگ‌نمایی'}</span>
          </button>

          <div className="w-px h-6 bg-white/10" />

          {/* ۴. دکمه گفت‌وگو با خیاط */}
          <button
            type="button"
            onClick={handleChat}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-[#EADFC7] hover:text-[#D4AF37] active:scale-90 transition-transform"
          >
            <MessageCircle className="w-5 h-5 text-[#0E8388]" />
            <span className="text-[10px] font-black text-[#0E8388]">گفت‌وگو با خیاط</span>
          </button>

        </div>

        {/* خط راهنمای پایین (Home Indicator کشیده و ظریف) */}
        <div className="w-28 h-1 bg-[#D4AF37]/40 rounded-full mt-3 opacity-80" />
      </div>

      {/* توست بازخورد عملیات */}
      {toastMsg && (
        <div className="absolute bottom-28 inset-x-0 z-30 flex justify-center pointer-events-none animate-fade-in">
          <div className="px-5 py-2.5 rounded-full bg-[#1E1A17]/95 border border-[#D4AF37]/40 text-[#F7E7CE] text-xs font-black shadow-2xl backdrop-blur-xl">
            {toastMsg}
          </div>
        </div>
      )}
    </div>
  );
};