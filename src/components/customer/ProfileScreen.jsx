// src/components/customer/ProfileScreen.jsx
import React, { useState, useEffect } from 'react';
import { Settings, Award, Bookmark, ShoppingBag, ChevronLeft, MapPin, Wallet, Heart, ShieldCheck, Headphones, LogOut, Camera, Trash2, ShieldAlert } from 'lucide-react';
import { ordersApi, uploadImage, userApi } from '../../api/api';
import { PhotoPickerModal } from '../common/PhotoPickerModal';
import { ImageCropModal } from '../common/ImageCropModal';
import { DeleteAccountModal } from '../common/DeleteAccountModal';
import { useToast } from '../common/ToastSystem';

export const ProfileScreen = ({
  currentUser,
  onSwitchToTailor,
  onOpenAddresses,
  onOpenWishlist,
  onOpenWallet,
  onOpenSupport,
  onOpenGuarantee,
  onOpenAboutUs,
  onLogout,
  onUpdateUser
}) => {
const { toast, confirmAction } = useToast();
const user = currentUser;
  const [ordersCount, setOrdersCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  
  // استیت‌های آواتار و مودال برش عکس
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || user?.avatarUrl || null);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [rawImageForCrop, setRawImageForCrop] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
// ─── منطقه خطر: مودال حذف/غیرفعال‌سازی حساب ───
const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  const handlePhotoPicked = (file) => {
    if (file) {
      const tempUrl = URL.createObjectURL(file);
      setRawImageForCrop(tempUrl);
      setShowCropModal(true);
    }
  };

  const handleCropFinished = async (croppedFile) => {
    setIsUploading(true);
    try {
      const uploadRes = await uploadImage(croppedFile, 'avatars', user?.id || 1);
      if (uploadRes.success && uploadRes.url) {
        setAvatarUrl(uploadRes.url);
        await userApi.updateAvatar(user?.id || 1, uploadRes.url);
        
        const updated = { ...user, avatar_url: uploadRes.url, avatarUrl: uploadRes.url };
        localStorage.setItem('kandooreh_user', JSON.stringify(updated));
            if (onUpdateUser) onUpdateUser(updated);
    toast.success('عکس پروفایل با موفقیت ثبت شد ✨');
  } else {
    toast.error('خطا در آپلود عکس.');
  }
} catch (e) {
  toast.error('خطا در ذخیره عکس پروفایل.');
} finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAvatar = async (e) => {
e.stopPropagation();
const ok = await confirmAction({
title: 'حذف عکس پروفایل',
message: 'آیا از حذف عکس پروفایل خود اطمینان دارید؟',
confirmLabel: 'بله، حذف شود',
danger: true
});
if (!ok) return;
setAvatarUrl(null);
await userApi.updateAvatar(user?.id || 1, null);
const updated = { ...user, avatar_url: null, avatarUrl: null };
localStorage.setItem('kandooreh_user', JSON.stringify(updated));
if (onUpdateUser) onUpdateUser(updated);
toast.success('عکس پروفایل با موفقیت حذف شد.');
};

  // دریافت آمار کاملاً واقعی سفارش‌ها و نشان‌شده‌ها
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user?.id) return;
      try {
        const res = await ordersApi.getOrders(user.id, false);
        if (res.success && res.orders) {
          setOrdersCount(res.orders.length);
        }
      } catch (e) {
        console.error('Error fetching user orders count:', e);
      }

      try {
        const savedWishlist = localStorage.getItem('kandooreh_wishlist');
        if (savedWishlist) {
          setWishlistCount(JSON.parse(savedWishlist).length);
        } else {
          setWishlistCount(0);
        }
      } catch {
        setWishlistCount(0);
      }
    };

    fetchUserStats();
  }, [user]);

  return (
    <div className="pb-44 pt-2 px-4 max-w-md mx-auto select-none">
      
      {/* هدر */}
      <div className="flex items-center justify-between mb-4">
        <button className="w-10 h-10 rounded-full khaliji-card-glass flex items-center justify-center text-[#23201C] border border-[#EADFC7] shadow-sm">
          <Settings className="w-5 h-5 text-[#23201C]" />
        </button>
        <h1 className="text-xl font-black text-[#23201C] tracking-tight">پروفایل من</h1>
        <div className="w-10"></div>
      </div>

      {/* کارت کاربر با امکان تغییر و حذف عکس پروفایل */}
      <div className="khaliji-card-glass rounded-[2.5rem] p-4 border border-[#EADFC7] shadow-sm mb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5 text-right flex-1 pr-2">
            <h2 className="text-lg font-black text-[#23201C]">{user?.name || 'کاربر کَندوره'}</h2>
            <div className="flex items-center gap-1.5 text-[11px] text-[#7E7667] font-bold">
              <span>{user?.username || '۰۹۱۷۱۲۳۴۵۶۷'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#0E8388]"></span>
              <span>{user?.city || 'بندرعباس'}</span>
            </div>
            <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B38F24] text-white text-[10px] font-black shadow-sm inline-flex items-center gap-1">
              <span>عضو ویژه کَندوره ✨</span>
            </span>
          </div>

          {/* آواتار با قابلیت کلیک، دوربین و حذف عکس */}
          <div className="relative shrink-0">
            <div 
              onClick={() => setShowPhotoPicker(true)}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#D4AF37] via-[#FCF6BA] to-[#AA771C] p-1 shadow-md cursor-pointer active:scale-95 transition-transform"
              title="تغییر عکس پروفایل"
            >
              <div className="w-full h-full rounded-full bg-[#FAF6ED] border-2 border-white flex items-center justify-center text-3xl shadow-inner overflow-hidden">
                {isUploading ? (
                  <span className="text-xs font-black text-[#7E7667]">...</span>
                ) : avatarUrl ? (
                  <img src={avatarUrl} alt="پروفایل" className="w-full h-full object-cover" />
                ) : (
                  '🧕'
                )}
              </div>
            </div>

            {/* دکمه دوربین برای تغییر عکس */}
            <button
              type="button"
              onClick={() => setShowPhotoPicker(true)}
              className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-[#0E8388] text-white border-2 border-white shadow-md flex items-center justify-center active:scale-90"
              title="انتخاب عکس"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>

            {/* دکمه حذف عکس پروفایل (اگر عکس داشته باشد) */}
            {avatarUrl && (
              <button
                type="button"
                onClick={handleDeleteAvatar}
                className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-red-500 text-white border-2 border-white shadow-md flex items-center justify-center active:scale-90"
                title="حذف عکس پروفایل"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* آمار سریع کاملاً واقعی */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <div className="khaliji-card-glass rounded-3xl p-3 flex flex-col items-center justify-center text-center border border-[#EADFC7] shadow-sm">
          <div className="w-8 h-8 rounded-full bg-[#D4AF37]/15 flex items-center justify-center text-[#B38F24] mb-1">
            <Award className="w-4 h-4" />
          </div>
          <span className="text-base font-black text-[#23201C]">{user?.club_points || 0}</span>
          <span className="text-[10px] font-bold text-[#7E7667]">امتیاز باشگاه</span>
        </div>

        <div 
          onClick={onOpenWishlist}
          className="khaliji-card-glass rounded-3xl p-3 flex flex-col items-center justify-center text-center border border-[#EADFC7] shadow-sm cursor-pointer active:scale-95 transition-transform"
        >
          <div className="w-8 h-8 rounded-full bg-[#0E8388]/15 flex items-center justify-center text-[#0E8388] mb-1">
            <Bookmark className="w-4 h-4" />
          </div>
          <span className="text-base font-black text-[#23201C]">{wishlistCount}</span>
          <span className="text-[10px] font-bold text-[#7E7667]">نشان‌شده‌ها</span>
        </div>

        <div className="khaliji-card-glass rounded-3xl p-3 flex flex-col items-center justify-center text-center border border-[#EADFC7] shadow-sm">
          <div className="w-8 h-8 rounded-full bg-[#C85A32]/15 flex items-center justify-center text-[#C85A32] mb-1">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <span className="text-base font-black text-[#23201C]">{ordersCount}</span>
          <span className="text-[10px] font-bold text-[#7E7667]">سفارش‌ها</span>
        </div>
      </div>

      {/* بنر ورود به پنل خیاطان */}
      <div 
        onClick={onSwitchToTailor}
        className="banner-luxury rounded-3xl p-4 mb-4 relative overflow-hidden text-white flex items-center justify-between border-2 border-[#D4AF37]/40 shadow-lg cursor-pointer active:scale-98"
      >
        <div className="space-y-1 text-right z-10 max-w-[65%]">
          <h3 className="font-black text-xs text-[#FBF5B7]">خیاط یا فروشنده پارچه هستید؟</h3>
          <div className="flex items-center gap-1 text-[10px] text-white/80 font-medium">
            <span>ورود به پنل تخصصی کسب‌وکار و کارگاه</span>
            <ChevronLeft className="w-3.5 h-3.5 text-[#D4AF37]" />
          </div>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-[#D4AF37]/40 flex items-center justify-center text-3xl shadow-inner">
          🧵
        </div>
      </div>

      {/* منوها */}
      <div className="space-y-2">
        <div onClick={onOpenAddresses} className="khaliji-card-glass rounded-2xl p-3.5 flex items-center justify-between border border-[#EADFC7] cursor-pointer hover:bg-white/80">
          <ChevronLeft className="w-4 h-4 text-[#7E7667]" />
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-black text-[#23201C]">آدرس‌های من (بندرعباس)</span>
            <div className="w-8 h-8 rounded-xl bg-[#0E8388]/10 text-[#0E8388] flex items-center justify-center"><MapPin className="w-4 h-4" /></div>
          </div>
        </div>

        <div onClick={onOpenWallet} className="khaliji-card-glass rounded-2xl p-3.5 flex items-center justify-between border border-[#EADFC7] cursor-pointer hover:bg-white/80">
          <ChevronLeft className="w-4 h-4 text-[#7E7667]" />
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-black text-[#23201C]">کیف پول و اعتبارات امانی</span>
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 text-[#B38F24] flex items-center justify-center"><Wallet className="w-4 h-4" /></div>
          </div>
        </div>

        <div onClick={onOpenWishlist} className="khaliji-card-glass rounded-2xl p-3.5 flex items-center justify-between border border-[#EADFC7] cursor-pointer hover:bg-white/80">
          <ChevronLeft className="w-4 h-4 text-[#7E7667]" />
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-black text-[#23201C]">علاقه‌مندی‌ها و طرح‌های ذخیره</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center"><Heart className="w-4 h-4" /></div>
          </div>
        </div>

        <div onClick={onOpenGuarantee} className="khaliji-card-glass rounded-2xl p-3.5 flex items-center justify-between border border-[#EADFC7] cursor-pointer hover:bg-white/80">
          <ChevronLeft className="w-4 h-4 text-[#7E7667]" />
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-black text-[#23201C]">ضمانت دوخت و قوانین پرداخت امن</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center"><ShieldCheck className="w-4 h-4" /></div>
          </div>
        </div>

        <div onClick={onOpenAboutUs} className="khaliji-card-glass rounded-2xl p-3.5 flex items-center justify-between border border-[#EADFC7] cursor-pointer hover:bg-white/80">
          <ChevronLeft className="w-4 h-4 text-[#7E7667]" />
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-black text-[#23201C]">درباره کَندوره و داستان اصالت ما</span>
            <div className="w-8 h-8 rounded-xl bg-[#FAF6ED] text-[#B38F24] flex items-center justify-center font-bold">⚜️</div>
          </div>
        </div>

        <div onClick={onOpenSupport} className="khaliji-card-glass rounded-2xl p-3.5 flex items-center justify-between border border-[#EADFC7] cursor-pointer hover:bg-white/80">
          <ChevronLeft className="w-4 h-4 text-[#7E7667]" />
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-black text-[#23201C]">پشتیبانی و گفت‌وگو با کارشناسان</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center"><Headphones className="w-4 h-4" /></div>
          </div>
        </div>

            <div onClick={onLogout} className="khaliji-card-glass rounded-2xl p-3.5 flex items-center justify-between border border-red-100 bg-red-50/40 cursor-pointer hover:bg-red-50">
      <ChevronLeft className="w-4 h-4 text-red-500" />
      <div className="flex items-center gap-2.5">
        <span className="text-xs font-black text-red-600">خروج از حساب کاربری</span>
        <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center"><LogOut className="w-4 h-4" /></div>
      </div>
    </div>
    {/* ─── منطقه خطر: مدیریت و حذف حساب ─── */}
    <div className="pt-3 mt-3 border-t-2 border-dashed border-red-200 space-y-2">
      <div className="flex items-center gap-1.5 px-1">
        <ShieldAlert className="w-4 h-4 text-red-500" />
        <span className="text-[10px] font-black text-red-600">منطقه خطر</span>
      </div>
      <div onClick={() => setShowDeleteAccount(true)} className="rounded-2xl p-3.5 flex items-center justify-between border-2 border-red-200 bg-red-50/60 cursor-pointer hover:bg-red-50 active:scale-[0.98] transition-all">
        <ChevronLeft className="w-4 h-4 text-red-500" />
        <div className="flex items-center gap-2.5">
          <div className="space-y-0.5 text-right">
            <span className="text-xs font-black text-red-600 block">حذف یا غیرفعال‌سازی حساب کاربری</span>
            <span className="text-[9px] font-bold text-red-400 block">غیرفعال‌سازی با حفظ اطلاعات، یا حذف کامل و دائمی</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center"><Trash2 className="w-4 h-4" /></div>
        </div>
      </div>
    </div>
  </div>

      {/* مودال انتخاب عکس از دوربین یا گالری */}
      <PhotoPickerModal
        isOpen={showPhotoPicker}
        onClose={() => setShowPhotoPicker(false)}
        onImageSelected={handlePhotoPicked}
      />

        {/* مودال برش و زوم عکس پروفایل */}
  <ImageCropModal
    isOpen={showCropModal}
    imageSrc={rawImageForCrop}
    onClose={() => setShowCropModal(false)}
    onCropComplete={handleCropFinished}
  />
  {/* مودال منطقه خطر: حذف/غیرفعال‌سازی حساب */}
  <DeleteAccountModal
    isOpen={showDeleteAccount}
    onClose={() => setShowDeleteAccount(false)}
    currentUser={user}
    onDeleted={() => { setShowDeleteAccount(false); onLogout(); }}
  />
</div>
);
};