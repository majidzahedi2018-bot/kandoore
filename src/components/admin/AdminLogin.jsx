// src/components/admin/AdminLogin.jsx
import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, ShieldCheck, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { adminApi } from '../../api/api';

export const AdminLogin = ({ onLoginSuccess, onBackToApp }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('لطفاً نام کاربری و رمز عبور را وارد کنید.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminApi.login(username.trim(), password.trim());
      setIsSubmitting(false);

      if (res.success && res.admin) {
        localStorage.setItem('kandooreh_admin_token', res.token || 'admin_session_active');
        localStorage.setItem('kandooreh_admin_user', JSON.stringify(res.admin));
        if (onLoginSuccess) onLoginSuccess(res.admin);
      } else {
        setError(res.message || 'اطلاعات وارد شده صحیح نمی‌باشد.');
      }
    } catch (err) {
      setIsSubmitting(false);
      setError('خطا در برقراری ارتباط با سرور.');
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col justify-between p-6 max-w-md mx-auto select-none overflow-x-hidden relative kandooreh-luxury-bg shadow-2xl">
      
      {/* نشان سپر زرین، نام کَندوره و زیرنویس */}
      <div className="text-center pt-8 space-y-3 z-10 shrink-0">
        
        {/* سپر متالیک طلایی با قفل */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-24 h-28 rounded-3xl bg-gradient-to-tr from-[#D4AF37] via-[#FFF5C0] to-[#AA771C] p-1 shadow-2xl flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-b from-[#2A1F16] via-[#1C150F] to-[#0A0705] rounded-[1.3rem] flex flex-col items-center justify-center border border-[#FCF6BA]/40 relative overflow-hidden">
              <span className="text-4xl filter drop-shadow-lg">🛡️</span>
              <div className="absolute inset-0 bg-radial-gold opacity-20 pointer-events-none"></div>
            </div>
          </div>
        </div>

        {/* عنوان کَندوره */}
        <h1 className="text-4xl sm:text-5xl font-black metallic-gold-text tracking-tight drop-shadow-md">
          کَندوره
        </h1>

        {/* زیرنویس سامانه نظارت */}
        <div className="flex items-center justify-center gap-1.5 text-xs font-black text-[#8C6D1F]">
          <span>❖</span>
          <span>سامانه نظارت و مدیریت مرکزی</span>
          <span>❖</span>
        </div>
      </div>

      {/* کارت شیشه‌ای فرم لاگین ادمین */}
      <div className="my-auto py-2 z-10">
        <div className="w-full frost-glass rounded-[2.8rem] p-6 sm:p-7 space-y-4 relative shadow-2xl border border-white/80">
          
          <form onSubmit={handleSubmit} className="space-y-4 text-right">
            
            {error && (
              <div className="p-3 rounded-2xl bg-red-50 text-red-600 text-[11px] font-bold border border-red-200 text-center">
                {error}
              </div>
            )}

            {/* فیلد نام کاربری */}
            <div className="space-y-1">
              <label className="text-xs font-black text-[#23201C] block pr-1">نام کاربری</label>
              <div className="flex items-center bg-white/85 rounded-2xl border-2 border-[#EADFC7] focus-within:border-[#D4AF37] shadow-inner overflow-hidden px-3.5 py-1">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="نام کاربری خود را وارد کنید"
                  className="w-full bg-transparent py-2.5 text-xs font-bold text-[#23201C] placeholder:text-[#7E7667]/50 focus:outline-none text-right"
                />
                <User className="w-4 h-4 text-[#B38F24] shrink-0 ml-2" />
              </div>
            </div>

            {/* فیلد رمز عبور */}
            <div className="space-y-1">
              <label className="text-xs font-black text-[#23201C] block pr-1">رمز عبور</label>
              <div className="flex items-center bg-white/85 rounded-2xl border-2 border-[#EADFC7] focus-within:border-[#D4AF37] shadow-inner overflow-hidden px-3.5 py-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#7E7667] hover:text-[#23201C] focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="رمز عبور خود را وارد کنید"
                  className="w-full bg-transparent py-2.5 px-2 text-xs font-bold text-[#23201C] placeholder:text-[#7E7667]/50 focus:outline-none text-right"
                />
                <Lock className="w-4 h-4 text-[#B38F24] shrink-0 ml-1" />
              </div>
            </div>

            {/* دکمه ورود به پنل مدیریت */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white font-black text-xs shadow-lg shadow-[#D4AF37]/30 flex items-center justify-between px-5 active:scale-95 transition-transform disabled:opacity-75 mt-2"
            >
              <ShieldCheck className="w-5 h-5 text-white" />
              <span>{isSubmitting ? 'در حال ورود به سامانه...' : 'ورود به پنل مدیریت'}</span>
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>

          </form>

        </div>
      </div>

      {/* دکمه بازگشت به اپلیکیشن اصلی کَندوره */}
      <div className="pb-4 text-center z-10">
        <button
          type="button"
          onClick={onBackToApp}
          className="inline-flex items-center gap-1.5 text-xs font-black text-[#B38F24] hover:text-[#23201C] active:scale-95 transition-all"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>بازگشت به اپلیکیشن اصلی کَندوره</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};