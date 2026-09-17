// src/components/common/NotificationEngine.jsx
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { notificationsApi } from '../../api/api';

const isNative = () => Boolean(window.Capacitor?.isNativePlatform?.());
const getLocalNotifications = () => {
  if (!isNative()) return null;
  try { return window.Capacitor.Plugins?.LocalNotifications || null; } catch { return null; }
};

/* ─── هوک سراسری: تعداد اعلان‌های نخوانده برای بج ─── */
export const useUnreadBadge = () => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const handler = (e) => setCount(e.detail?.count || 0);
    const decrementHandler = () => setCount(prev => Math.max(0, prev - 1));
    const zeroHandler = () => setCount(0);

    window.addEventListener('kandooreh:unread', handler);
    window.addEventListener('kandooreh:unread_decrement', decrementHandler);
    window.addEventListener('kandooreh:unread_zero', zeroHandler);

    return () => {
      window.removeEventListener('kandooreh:unread', handler);
      window.removeEventListener('kandooreh:unread_decrement', decrementHandler);
      window.removeEventListener('kandooreh:unread_zero', zeroHandler);
    };
  }, []);
  return count;
};

/* ─── درخواست مجوز اعلان (بومی در APK / وب در مرورگر) ─── */
export const requestNotificationPermission = async () => {
  const LN = getLocalNotifications();
  if (LN) {
    try {
      const res = await LN.requestPermissions();
      return res?.display === 'granted';
    } catch { return false; }
  }
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const p = await Notification.requestPermission();
    return p === 'granted';
  }
  return false;
};

/* ─── دیپ‌لینک هوشمند: ثبت آنی خوانده‌شدن، کسر از بج زنگوله و هدایت ─── */
export const openNotificationDeepLink = (n, userId) => {
  if (n?.id && userId) {
    // ۱. ارسال به سرور
    notificationsApi.markRead(n.id, userId);
    // ۲. کسر آنی عدد روی زنگوله در فرانت‌اند بدون تأخیر
    window.dispatchEvent(new CustomEvent('kandooreh:unread_decrement'));
  }
  // ۳. هدایت به صفحه مقصد
  window.dispatchEvent(new CustomEvent('kandooreh:open-notification', {
    detail: {
      id: n.id,
      actionType: n.actionType,
      referenceId: n.referenceId,
      category: n.category,
      title: n.title
    }
  }));
};

/* ─── نمایش اعلان: Tray بومی در APK، وب در مرورگر ─── */
const showSystemNotification = async (n) => {
  const title = `${n.iconEmoji || '🔔'} ${n.title}`;
  const body = n.subtext || n.message || '';
  const LN = getLocalNotifications();
  if (LN) {
    try {
      await LN.schedule({
        notifications: [{
          id: (Number(n.id) % 100000) + 1,
          title, body,
          extra: { actionType: n.actionType, referenceId: n.referenceId, category: n.category },
        }],
      });
      return;
    } catch {}
  }
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification(title, { body, tag: `kandooreh-${n.id}` }); } catch {}
  }
};

/* ─── موتور اعلان: polling + بنر بالای صفحه + اعلان سیستمی ─── */
export const NotificationEngine = ({ userId }) => {
  const [banner, setBanner] = useState(null);
  const lastMaxIdRef = useRef(null);
  const firstLoadRef = useRef(true);

  // ضربه روی اعلان بومی در Tray → دیپ‌لینک به صفحه مربوطه
  useEffect(() => {
    const LN = getLocalNotifications();
    if (!LN) return;
    const handler = (e) => {
      const extra = e?.notification?.extra || {};
      window.dispatchEvent(new CustomEvent('kandooreh:open-notification', { detail: extra }));
    };
    LN.addListener('localNotificationActionPerformed', handler);
    return () => { try { LN.removeAllListeners(); } catch {} };
  }, []);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    const poll = async () => {
      try {
        const res = await notificationsApi.getByUser(userId);
        if (!alive || !res.success) return;
        const items = res.notifications || [];
        const unread = items.filter(n => n.isUnread).length;
        window.dispatchEvent(new CustomEvent('kandooreh:unread', { detail: { count: unread } }));
        const maxId = items.length ? Math.max(...items.map(n => n.id)) : 0;
        if (firstLoadRef.current) {
          lastMaxIdRef.current = maxId;
          firstLoadRef.current = false;
        } else if (maxId > lastMaxIdRef.current) {
          const fresh = items.filter(n => n.id > lastMaxIdRef.current);
          lastMaxIdRef.current = maxId;
          const latest = fresh[0];
          if (latest) {
            setBanner(latest);
            setTimeout(() => setBanner(null), 6000);
            showSystemNotification(latest);
          }
        }
      } catch {}
    };
    poll();
    const iv = setInterval(poll, 25000);
    return () => { alive = false; clearInterval(iv); };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const key = `kandooreh_notif_perm_${userId}`;
    if (!localStorage.getItem(key)) {
      requestNotificationPermission().then(g => { if (g) localStorage.setItem(key, '1'); });
    }
  }, [userId]);

  if (!banner) return null;
  return (
    <div className="fixed top-3 left-4 right-4 max-w-md mx-auto z-[80]">
      <div
        onClick={() => { openNotificationDeepLink(banner, userId); setBanner(null); }}
        className="khaliji-card-glass rounded-3xl p-3.5 border-2 border-[#D4AF37] shadow-2xl bg-white/95 backdrop-blur-xl flex items-center gap-3 text-right cursor-pointer active:scale-[0.98] transition-transform"
      >
        <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-xl shrink-0">
          {banner.iconEmoji || '🔔'}
        </div>
        <div className="flex-1 space-y-0.5">
          <h4 className="text-[11px] font-black text-[#23201C]">{banner.title}</h4>
          <p className="text-[10px] text-[#7E7667] font-bold leading-relaxed line-clamp-2">{banner.subtext}</p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); setBanner(null); }} className="text-[#7E7667] shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};