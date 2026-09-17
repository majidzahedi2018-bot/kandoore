// src/components/common/GarmentVisual.jsx
import React, { useState, useEffect, useRef } from 'react';
import { resolveGarmentVisual } from '../../data/garmentVisuals';

export const GarmentVisual = ({ name = '', garmentKey = null, className = '', fallbackEmoji = '📏' }) => {
  const visual = resolveGarmentVisual(name, garmentKey);
  const src = visual?.src || null;
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);

  // با تغییر تصویر: ریست + بررسی فوری اینکه تصویر از قبل در کش لود شده
  useEffect(() => {
    setFailed(false);
    setLoaded(false);
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) setLoaded(true);
  }, [src]);

  // رف‌کالبک: برای تصویر کش‌شده‌ای که قبل از اتصال onLoad کامل شده است
  const setImgRef = (el) => {
    imgRef.current = el;
    if (el && el.complete && el.naturalWidth > 0) setLoaded(true);
  };

  // تصویر نداریم یا خطا داد → فال‌بک ایموجی
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <span className="text-6xl filter drop-shadow-md">{visual?.emoji || fallbackEmoji}</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-[#EADFC7]/60" />}
      <img
        ref={setImgRef}
        src={src}
        alt={visual?.alt || name}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};