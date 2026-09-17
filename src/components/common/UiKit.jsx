// src/components/common/UiKit.jsx
import React, { useEffect, useRef, useState } from 'react';

/* ─────────────────────────────────────────────────────────────
   ۱) Skeleton: بلوک جای‌گیر درخشان (shimmer) برای حالت لودینگ
───────────────────────────────────────────────────────────── */
export const Skeleton = ({ className = '' }) => (
  <div className={`skeleton-shimmer ${className}`}></div>
);

/* ─────────────────────────────────────────────────────────────
   ۲) AnimatedNumber: شمارنده متحرک اعداد با ارقام فارسی
───────────────────────────────────────────────────────────── */
export const AnimatedNumber = ({ value = 0, duration = 900, className = '', suffix = '' }) => {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);
  const frameRef = useRef(null);

  useEffect(() => {
    const from = prevRef.current;
    const to = Number(value) || 0;
    if (from === to) { setDisplay(to); return; }
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = to;
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return (
    <span className={className}>
      {display.toLocaleString('fa-IR')}{suffix}
    </span>
  );
};