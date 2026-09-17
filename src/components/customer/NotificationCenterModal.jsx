// src/components/customer/NotificationCenterModal.jsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  Bell, CheckCheck, X, ChevronLeft, Shield, Shirt,
  Headphones, SlidersHorizontal, MessageSquare, Sparkles
} from 'lucide-react';
import { notificationsApi } from '../../api/api';
import { openNotificationDeepLink } from '../common/NotificationEngine';

// محاسبه زمان نسبی هوشمند به زبان فارسی (مثال: ۱۰ دقیقه پیش، امروز ۱۴:۳۰، دیروز)
const getRelativeTime = (timeStr) => {
  if (!timeStr) return '';
  try {
    const cleanStr = String(timeStr).replace(/-/g, '/');
    const notifDate = new Date(cleanStr);
    if (isNaN(notifDate.getTime())) return timeStr;

    const now = new Date();
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    // ارقام فارسی
    const toFa = (num) => String(num).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

    if (diffMins < 2) return 'همین الان';
    if (diffMins < 60) return `${toFa(diffMins)} دقیقه پیش`;

    const isToday = now.toDateString() === notifDate.toDateString();
    const timeFormat = notifDate.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      if (diffHours < 6) return `${toFa(diffHours)} ساعت پیش`;
      return `امروز ${timeFormat}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (yesterday.toDateString() === notifDate.toDateString()) {
      return `دیروز ${timeFormat}`;
    }

    return notifDate.toLocaleDateString('fa-IR', { month: 'long', day: 'numeric' });
  } catch {
    return timeStr;
  }
};

// تشخیص اینکه آیا اعلان مربوط به امروز است یا قبل‌تر
const isDateToday = (timeStr) => {
  if (!timeStr) return false;
  try {
    const cleanStr = String(timeStr).replace(/-/g, '/');
    const d = new Date(cleanStr);
    return new Date().toDateString() === d.toDateString();
  } catch {
    return false;
  }
};

export const NotificationCenterModal = ({ isOpen, onClose, currentUser }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'orders' | 'finance' | 'support'

  const load = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const res = await notificationsApi.getByUser(currentUser.id);
      if (res.success) setItems(res.notifications || []);
    } catch (e) {
      console.error('Error loading notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // کلیک روی اعلان و هدایت هوشمند
  const handleClick = (n) => {
    openNotificationDeepLink(n, currentUser?.id);
    setItems(prev => prev.map(x => x.id === n.id ? { ...x, isUnread: false } : x));
    onClose();
  };

  // خواندن همه
  const handleMarkAllRead = async () => {
    if (!currentUser?.id) return;
    await notificationsApi.markAllAsRead(currentUser.id);
    setItems(prev => prev.map(x => ({ ...x, isUnread: false })));
    window.dispatchEvent(new CustomEvent('kandooreh:unread_zero'));
  };

  // نگاشت دسته‌بندی‌ها
  const getCategoryType = (category = '') => {
    if (category.includes('سفارش')) return 'orders';
    if (category.includes('مالی') || category.includes('بیعانه')) return 'finance';
    if (category.includes('سیستمی') || category.includes('پشتیبانی') || category.includes('تیکت')) return 'support';
    return 'orders';
  };

  // فیلتر کردن بر اساس تب انتخاب شده
  const filteredItems = items.filter(item => {
    if (activeCategory === 'all') return true;
    return getCategoryType(item.category) === activeCategory;
  });

  // تفکیک به امروز و قبل‌تر
  const todayItems = filteredItems.filter(item => isDateToday(item.time));
  const earlierItems = filteredItems.filter(item => !isDateToday(item.time));

  const unreadTotal = items.filter(x => x.isUnread).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 select-none">
      <div className="bg-[#F8F5EE] w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-5 space-y-4 border border-[#EADFC7] shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* =========================================================================
            ۱. هدر بالای صفحه (دقیقاً مطابق طرح ماکت تصویر)
            ========================================================================= */}
        <div className="flex items-center justify-between border-b border-[#EADFC7] pb-3 shrink-0">
          
          {/* دکمه خروج شیشه‌ای در سمت چپ */}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/90 border border-[#EADFC7] flex items-center justify-center text-[#23201C] active:scale-90 shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>

          {/* عنوان مرکز اطلاع‌رسانی در وسط */}
          <div className="text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-[#D4AF37]">
              <span className="text-xs">❖</span>
              <span className="text-[10px] font-black tracking-widest uppercase">KANDOOREH</span>
              <span className="text-xs">❖</span>
            </div>
            <h1 className="text-base font-black text-[#23201C]">مرکز اطلاع‌رسانی</h1>
            <p className="text-[10px] text-[#7E7667] font-bold">همه اعلان‌ها و پیام‌های مهم شما در یک نگاه</p>
          </div>

          {/* زنگوله اعلان با بج قرمز پیام‌های نخوانده در سمت راست */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white/90 border border-[#EADFC7] flex items-center justify-center text-[#B38F24] shadow-sm">
              <Bell className="w-5 h-5" />
            </div>
            {unreadTotal > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                {unreadTotal > 9 ? '+۹' : unreadTotal}
              </span>
            )}
          </div>

        </div>

        {/* =========================================================================
            ۲. نوار کپسولی فیلترهای افقی با آیکون‌های متالیک
            ========================================================================= */}
        <div className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar shrink-0 pb-1">
          
          {/* تب همه */}
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex-1 py-2 px-2.5 rounded-2xl text-[11px] font-black transition-all flex items-center justify-center gap-1.5 shrink-0 ${
              activeCategory === 'all'
                ? 'bg-[#0E8388] text-white shadow-md'
                : 'bg-white/90 border border-[#EADFC7] text-[#7E7667]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>همه</span>
          </button>

          {/* تب سفارشات */}
          <button
            onClick={() => setActiveCategory('orders')}
            className={`flex-1 py-2 px-2 rounded-2xl text-[11px] font-black transition-all flex items-center justify-center gap-1.5 shrink-0 ${
              activeCategory === 'orders'
                ? 'bg-[#0E8388] text-white shadow-md'
                : 'bg-white/90 border border-[#EADFC7] text-[#7E7667]'
            }`}
          >
            <Shirt className="w-3.5 h-3.5 text-[#B38F24]" />
            <span>سفارشات</span>
          </button>

          {/* تب اموال و مالی */}
          <button
            onClick={() => setActiveCategory('finance')}
            className={`flex-1 py-2 px-2 rounded-2xl text-[11px] font-black transition-all flex items-center justify-center gap-1.5 shrink-0 ${
              activeCategory === 'finance'
                ? 'bg-[#0E8388] text-white shadow-md'
                : 'bg-white/90 border border-[#EADFC7] text-[#7E7667]'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-[#B38F24]" />
            <span>اموال و مالی</span>
          </button>

          {/* تب پشتیبانی */}
          <button
            onClick={() => setActiveCategory('support')}
            className={`flex-1 py-2 px-2 rounded-2xl text-[11px] font-black transition-all flex items-center justify-center gap-1.5 shrink-0 ${
              activeCategory === 'support'
                ? 'bg-[#0E8388] text-white shadow-md'
                : 'bg-white/90 border border-[#EADFC7] text-[#7E7667]'
            }`}
          >
            <Headphones className="w-3.5 h-3.5 text-[#B38F24]" />
            <span>پشتیبانی</span>
          </button>

        </div>

        {/* =========================================================================
            ۳. محتوای اسکرول‌شونده اعلان‌ها با گروه‌بندی زمانی (امروز / قبل‌تر)
            ========================================================================= */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-0.5">
          {loading ? (
            <div className="text-center py-16 space-y-2">
              <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-black text-[#7E7667]">در حال دریافت اعلان‌ها...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 space-y-3 bg-white/70 rounded-3xl border border-[#EADFC7] p-8">
              <div className="w-12 h-12 rounded-full bg-[#FAF6ED] border border-[#EADFC7] flex items-center justify-center text-2xl mx-auto text-[#B38F24]">
                🔔
              </div>
              <h4 className="text-xs font-black text-[#23201C]">هیچ اعلانی در این دسته وجود ندارد</h4>
              <p className="text-[10px] text-[#7E7667] font-bold">پیام‌ها و تغییرات سفارش شما در این بخش نمایش داده خواهد شد.</p>
            </div>
          ) : (
            <>
              {/* ─── گروه ۱: امروز ─── */}
              {todayItems.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-center gap-2 text-[11px] font-black text-[#B38F24] my-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#D4AF37]/50" />
                    <span>❖ امروز ❖</span>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#D4AF37]/50" />
                  </div>

                  {todayItems.map(n => renderNotificationCard(n, handleClick))}
                </div>
              )}

              {/* ─── گروه ۲: قبل‌تر ─── */}
              {earlierItems.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-center gap-2 text-[11px] font-black text-[#7E7667] my-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#EADFC7]" />
                    <span>❖ قبل‌تر ❖</span>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#EADFC7]" />
                  </div>

                  {earlierItems.map(n => renderNotificationCard(n, handleClick))}
                </div>
              )}
            </>
          )}
        </div>

        {/* =========================================================================
            ۴. دکمه پایین: مشاهده و خواندن همه اعلان‌ها با آیکون زنگوله
            ========================================================================= */}
        <div className="pt-2 border-t border-[#EADFC7] shrink-0">
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="w-full py-3 px-4 rounded-2xl bg-white border border-[#D4AF37]/50 shadow-sm flex items-center justify-between text-xs font-black text-[#23201C] hover:bg-[#FAF6ED] active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center text-[#B38F24]">
                <Bell className="w-4 h-4" />
              </div>
              <span>خواندن همه اعلان‌ها</span>
            </div>
            <ChevronLeft className="w-4 h-4 text-[#B38F24]" />
          </button>
        </div>

      </div>
    </div>
  );
};

// رندر کارت اختصاصی اعلان با مدال زرین برجسته (مطابق طرح ماکت)
function renderNotificationCard(n, onClick) {
  const isFinance = n.category?.includes('مالی') || n.category?.includes('بیعانه');
  const isSupport = n.category?.includes('سیستمی') || n.category?.includes('پشتیبانی') || n.category?.includes('تیکت');

  return (
    <div
      key={n.id}
      onClick={() => onClick(n)}
      className={`rounded-[1.8rem] p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all relative overflow-hidden border-[1.5px] ${
        n.isUnread
          ? 'bg-gradient-to-b from-[#FFFFFF] to-[#FDFBF7] border-[#D4AF37] shadow-md'
          : 'bg-white/80 border-[#EADFC7] hover:bg-white'
      }`}
    >
      {/* سمت چپ: زمان نسبی فارسی + فلش ناوبری */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] text-[#7E7667] font-bold whitespace-nowrap">
          {getRelativeTime(n.time)}
        </span>
        <div className="w-6 h-6 rounded-full bg-[#FAF6ED] border border-[#EADFC7] flex items-center justify-center text-[#B38F24]">
          <ChevronLeft className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* بخش متن در وسط */}
      <div className="flex-1 text-right space-y-1 min-w-0">
        <div className="flex items-center justify-end gap-1.5">
          <h4 className="text-xs font-black text-[#23201C] truncate">{n.title}</h4>
          {n.isUnread && (
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 shadow-sm animate-pulse" />
          )}
        </div>
        <p className="text-[10px] text-[#7E7667] font-bold leading-relaxed line-clamp-2">
          {n.subtext}
        </p>
      </div>

      {/* سمت راست: مدال گرد طلایی برجسته + تگ دسته‌بندی در زیر آن */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <div className="w-12 h-12 rounded-full bg-gradient-to-b from-[#FFFDF7] to-[#F5EAD4] border-1.5 border-[#D4AF37]/60 shadow-sm flex items-center justify-center text-xl">
          {isFinance ? (
            <Shield className="w-5 h-5 text-[#B38F24]" />
          ) : isSupport ? (
            <Headphones className="w-5 h-5 text-[#B38F24]" />
          ) : (
            <Shirt className="w-5 h-5 text-[#B38F24]" />
          )}
        </div>
        <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-[#0E8388]/10 text-[#0E8388] border border-[#0E8388]/20">
          {isFinance ? 'اموال و مالی' : isSupport ? 'پشتیبانی' : 'سفارشات'}
        </span>
      </div>

    </div>
  );
} 