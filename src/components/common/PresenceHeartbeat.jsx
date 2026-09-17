// src/components/common/PresenceHeartbeat.jsx
import { useEffect, useRef } from 'react';
import { chatApi } from '../../api/api';
/**
 * کامپوننت سراسری ثبت حضور هوشمند کاربر (هر ۳۰ ثانیه):
 * - فقط وقتی اپ/تب در پیش‌زمینه و قابل مشاهده است heartbeat می‌فرستد → «آنلاین»
 * - به محض رفتن به پس‌زمینه، تب دیگر، یا خروج از حساب → اعلام آفلاین آنی
 * - در اندروید (Capacitor) با رویداد appStateChange هماهنگ است
 * کافی است یک‌بار در App.jsx mount شود: {user?.id && <PresenceHeartbeat userId={user.id} />}
 */
const isNative = () => Boolean(window?.Capacitor?.isNativePlatform?.());
const isForegroundWeb = () =>
  typeof document === 'undefined' || document.visibilityState === 'visible';

export const PresenceHeartbeat = ({ userId }) => {
  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const foregroundRef = useRef(true);

  useEffect(() => {
    if (!userId) return undefined;
    // ۱) ضربان اولیه فقط اگر واقعاً در پیش‌زمینه هستیم
    if (!isNative() && isForegroundWeb()) chatApi.heartbeat(userId, true).catch(() => {});
    // ۲) ضربان دوره‌ای هر ۳۰ ثانیه، فقط در پیش‌زمینه
    const interval = setInterval(() => {
      if (foregroundRef.current && (isNative() || isForegroundWeb())) {
        chatApi.heartbeat(userId, true).catch(() => {});
      }
    }, 30000);
    // ۳) وب/موبایل‌بروزر: پس‌زمینه → آفلاین آنی | برگشت به پیش‌زمینه → آنلاین آنی
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        foregroundRef.current = true;
        chatApi.heartbeat(userId, true).catch(() => {});
      } else {
        foregroundRef.current = false;
        chatApi.goOffline(userId);
      }
    };
    const onPageHide = () => {
      foregroundRef.current = false;
      chatApi.goOffline(userId);
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    // ۴) اندروید (Capacitor): رویداد واقعی پیش‌زمینه/پیش‌زمینه
        let removeAppState = null;
    try {
      if (isNative() && window.Capacitor?.Plugins?.App?.addListener) {
        const maybePromise = window.Capacitor.Plugins.App.addListener('appStateChange', (state) => {
          foregroundRef.current = Boolean(state?.isActive);
          if (state?.isActive) chatApi.heartbeat(userIdRef.current, true).catch(() => {});
          else chatApi.goOffline(userIdRef.current);
        });
        if (maybePromise && typeof maybePromise.then === 'function') {
          maybePromise.then((handle) => { removeAppState = () => handle?.remove?.(); }).catch(() => {});
        }
      }
    } catch (e) { /* بدون افزونهٔ App هم نباید کرش کنیم */ }
    // ۵) خروج از کامپوننت (logout یا تعویض کاربر) → ثبت خروج آنی
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      if (removeAppState) removeAppState();
      chatApi.goOffline(userIdRef.current);
    };
  }, [userId]);

  return null;
};