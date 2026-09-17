import React, { createContext, useContext, useState, useEffect } from 'react';
import { Home, LayoutGrid, ShoppingBag, Ruler, User, FileText, Shirt, Wallet, MessageSquareQuote } from 'lucide-react';

// ایمپورت کامپوننت‌های ماژولار جدید
import { StoryViewerModal } from './components/common/StoryViewerModal';
import { PortfolioWizardModal } from './components/tailor/portfolio/PortfolioWizardModal';
import { StoryCreatorModal } from './components/tailor/StoryCreatorModal';
import { TailorDashboard } from './components/tailor/TailorDashboard';
import { TailorOrders } from './components/tailor/TailorOrders';
import { TailorPortfolio } from './components/tailor/TailorPortfolio';
import { TailorReviews } from './components/tailor/TailorReviews';
import { TailorAccounting } from './components/tailor/TailorAccounting';
import { TailorSettingsModal } from './components/tailor/TailorSettingsModal';
import { MeasurementsScreen } from './components/customer/MeasurementsScreen';
import { OrdersScreen } from './components/customer/OrdersScreen';
import { DesignDetailModal } from './components/customer/DesignDetailModal';
import { CustomizationModal } from './components/customer/CustomizationModal';
import { CheckoutInvoiceModal } from './components/customer/CheckoutInvoiceModal';
import { OrderChatModal } from './components/common/OrderChatModal';
import { ReviewRatingModal } from './components/customer/ReviewRatingModal';
import { AddressManagementModal } from './components/customer/AddressManagementModal';
import { HomeScreen } from './components/customer/HomeScreen';
import { DesignsScreen } from './components/customer/DesignsScreen';
import { ProfileScreen } from './components/customer/ProfileScreen';
import { AuthScreen } from './components/auth/AuthScreen';
import { LandingPage } from './components/landing/LandingPage';
import { AuthGate } from './components/landing/AuthGate';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';

// ایمپورت مودال‌های جانبی
import { SearchFilterModal } from './components/customer/SearchFilterModal';
import { WishlistModal } from './components/customer/WishlistModal';
import { CustomerWalletModal } from './components/customer/CustomerWalletModal';
import { PublicTailorProfileModal } from './components/customer/PublicTailorProfileModal';
import { CustomerSupportModal } from './components/customer/CustomerSupportModal';
import { GuaranteeTermsModal } from './components/customer/GuaranteeTermsModal';
import { NotificationCenterModal } from './components/customer/NotificationCenterModal';
import { AboutUsModal } from './components/common/AboutUsModal';
import { ImageViewerModal } from './components/common/ImageViewerModal';
import { ToastProvider, useToast } from './components/common/ToastSystem';
import { NotificationEngine } from './components/common/NotificationEngine';
import { PresenceHeartbeat } from './components/common/PresenceHeartbeat';
import { usePageMeta } from './hooks/usePageMeta';
import { useBackLayer } from './hooks/useBackLayer';
import { setupCapacitorBackButton } from './utils/capacitorBack';
import { storiesApi, designsApi, ordersApi, chatApi, reviewsApi, addressesApi, authApi } from './api/api';

const API_BASE = 'https://kandoore.ir/api';

/* ==========================================================================
   ۱. کانتکست متصل به دیتابیس MySQL و حافظه ماندگار (استوری ۲۴ ساعته + نمونه‌کارها)
   ========================================================================== */
const AppContext = createContext();

const AppProvider = ({ children }) => {
  // بدون کاربر فیک، مستقیماً از حافظه دستگاه لود می‌شود
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('kandooreh_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [measurements, setMeasurements] = useState({
    title: 'اندازه پیش‌فرض من',
    pantLength: '95',
    ankleCuff: '22',
    cuffHeight: '18',
    waist: '78',
    hip: '98',
  });

  const [stories, setStories] = useState([]);
  const [portfolioItems, setPortfolioItems] = useState([]);

  // دریافت استوری‌های ۲۴ ساعته و طرح‌ها مستقیماً از هاست و دیتابیس
  const fetchStoriesAndDesigns = async () => {
    try {
      const storiesRes = await storiesApi.getLiveStories();
      if (storiesRes.success && storiesRes.stories) {
        setStories(storiesRes.stories);
      }

      const designsRes = await designsApi.getAll();
      if (designsRes.success && designsRes.designs) {
        setPortfolioItems(designsRes.designs);
      }
    } catch (e) {
      console.error('خطا در دریافت داده‌های دیتابیس:', e);
    }
  };

  useEffect(() => {
    fetchStoriesAndDesigns();
  }, []);

  // polling خودکار هر 30 ثانیه برای رفرش استوری‌ها و طرح‌ها
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStoriesAndDesigns();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // رفرش هنگام بازگشت کاربر به اپ (visibility change)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchStoriesAndDesigns();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // بازخوانی مجدد اطلاعات پس از ثبت کار جدید توسط خیاط
  const refreshData = () => {
    fetchStoriesAndDesigns();
  };

  // بارگذاری کاربر و سفارش‌ها
  useEffect(() => {
    const savedUser = localStorage.getItem('kandooreh_user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setUser(u);
      fetchOrders(u.id);
    }
    setLoading(false);
  }, []);

  const fetchOrders = async (userId) => {
try {
const data = await ordersApi.getOrders(userId, false);
if (data.success) setOrders(data.orders);
} catch (e) {
console.error('خطا در دریافت سفارش‌ها:', e);
}
};

  const login = async (username, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username, password })
      });
      const data = await res.json();
      if (data.success) {
try {
if (data.token) localStorage.setItem('kandooreh_token', data.token);
localStorage.setItem('kandooreh_user', JSON.stringify(data.user));
} catch (e) { console.warn('localStorage unavailable:', e); }
setUser(data.user);
fetchOrders(data.user.id);
return { success: true };
}
      return { success: false, message: data.message };
    } catch (e) {
      return { success: false, message: 'خطا در ارتباط با سرور زمپ' };
    }
  };

  const register = async (name, username, password, role) => {
try {
const res = await fetch(`${API_BASE}/auth.php`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ action: 'register', name, username, password, role })
});
const data = await res.json();
if (data.success) {
if (data.token) localStorage.setItem('kandooreh_token', data.token);
setUser(data.user);
localStorage.setItem('kandooreh_user', JSON.stringify(data.user));
return { success: true };
}
return { success: false, message: data.message };
} catch (e) {
return { success: false, message: 'خطا در ارتباط با سرور زمپ' };
}
};

  const logout = () => {
authApi.logout().catch(() => {});
setUser(null);
setOrders([]);
localStorage.removeItem('kandooreh_user');
localStorage.removeItem('kandooreh_token');
};

  const createOrder = async (design) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/orders.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          design_title: design.title,
          tailor_name: design.tailorName,
          amount: design.price
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders(user.id);
      }
    } catch (e) {
      console.error('خطا در ثبت سفارش:', e);
    }
  };

  const saveMeasurements = (newMeas) => {
    setMeasurements(newMeas);
    localStorage.setItem('kandooreh_measurements', JSON.stringify(newMeas));
  };

  const addStory = async (storyData) => {
    try {
      const res = await storiesApi.create(storyData);
      if (res.success) {
        fetchStoriesAndDesigns();
      }
      return res;
    } catch (e) {
      console.error('خطا در انتشار استوری:', e);
      return { success: false, message: 'خطا در انتشار استوری' };
    }
  };

  const addPortfolio = async (designData) => {
    try {
      const res = await designsApi.create(designData);
      if (res.success) {
        fetchStoriesAndDesigns();
      }
      return res;
    } catch (e) {
      console.error('خطا در اضافه کردن نمونه‌کار:', e);
      return { success: false, message: 'خطا در اضافه کردن نمونه‌کار' };
    }
  };

  // ارسال پیامک کد تأیید به سرور
  const sendOtp = async (phone) => {
    try {
      console.log('[OTP] sendOtp called with:', phone);
      const res = await fetch(`${API_BASE}/auth.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_otp', phone })
      });
      const data = await res.json();
      console.log('[OTP] server response:', data);
      return data;
    } catch (e) {
      console.error('[OTP] fetch error:', e);
      return { success: false, message: 'خطا در برقراری ارتباط با سرور' };
    }
  };

 // تأیید کد پیامک و ورود
  const loginWithOtp = async (phone, code, roleIntent) => {
    try {
      const res = await fetch(`${API_BASE}/auth.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_otp', phone, code, role_intent: roleIntent })
      });
      const data = await res.json();
      if (data.success && data.user) {
if (data.token) localStorage.setItem('kandooreh_token', data.token);
setUser(data.user);
localStorage.setItem('kandooreh_user', JSON.stringify(data.user));
fetchOrders(data.user.id);
return { success: true, user: data.user };
}
      return { success: false, message: data.message };
    } catch (e) {
      return { success: false, message: 'خطا در اعتبارسنجی کد پیامک' };
    }
  };

  return (
    <AppContext.Provider value={{
      user, setUser, loading, login, register, logout, orders,
      measurements, saveMeasurements, createOrder,
      stories, addStory, portfolioItems, addPortfolio,
      sendOtp, loginWithOtp, refreshData
    }}>
      {children}
    </AppContext.Provider>
  );
};

const useApp = () => useContext(AppContext);

/* ==========================================================================
   ۷. پوسته اصلی برنامه
   ========================================================================== */
const AppShell = () => {
const { user, setUser, logout, createOrder, stories, portfolioItems, refreshData, sendOtp, loginWithOtp } = useApp();
const { toast } = useToast();
  
  // بررسی خودکار نقش و بررسی حالت ادمین از روی هش آدرس یا حافظه
  const [currentRole, setCurrentRole] = useState(() => {
    try {
      if (window.location.hash === '#admin' || window.location.pathname.includes('/admin')) {
        const adminUser = localStorage.getItem('kandooreh_admin_user');
        return adminUser ? 'admin_dashboard' : 'admin_login';
      }
      const saved = localStorage.getItem('kandooreh_user');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        const u = JSON.parse(saved);
        if (u && u.role) {
          if (u.role === 'admin') return 'admin_dashboard';
          return u.role === 'tailor' ? 'tailor' : 'customer';
        }
      }
    } catch (e) {
      console.error('Error determining initial role:', e);
    }
    return 'auth';
  });

  // استیت‌های تب‌ها و صفحات فرعی (باید قبل از هرگونه return تعریف شوند)
  const [activeTab, setActiveTab] = useState('home');
  const [tailorTab, setTailorTab] = useState('dashboard');
 const [showAddPortfolio, setShowAddPortfolio] = useState(false);
const [editingDesign, setEditingDesign] = useState(null);
  const [showBomScreen, setShowBomScreen] = useState(false);
  const [showOrderChat, setShowOrderChat] = useState(false);
  const [activeChatOrder, setActiveChatOrder] = useState(null);
  const [activePreorder, setActivePreorder] = useState(null);
  const [publicTailor, setPublicTailor] = useState(null);
  const [showSearchFilter, setShowSearchFilter] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [showAddressScreen, setShowAddressScreen] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [showWalletScreen, setShowWalletScreen] = useState(false);
  const [showNotificationsScreen, setShowNotificationsScreen] = useState(false);
  const [showSupportScreen, setShowSupportScreen] = useState(false);
  const [showGuaranteeScreen, setShowGuaranteeScreen] = useState(false);
  const [showAboutUs, setShowAboutUs] = useState(false);
  const [activeStory, setActiveStory] = useState(null);
  const [activeStoryGroup, setActiveStoryGroup] = useState([]);
  const [showTailorSettings, setShowTailorSettings] = useState(false);
  const [showStoryCreator, setShowStoryCreator] = useState(false);

  // استیت‌های فرآیند سفارش مشتری
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [selectedTailor, setSelectedTailor] = useState(null);
  const [showCustomization, setShowCustomization] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [customizationData, setCustomizationData] = useState(null);
  const [appliedFilters, setAppliedFilters] = useState(null);
// استیت نمایش لندینگ یا صفحه ورود زیبای موجود
const [showLanding, setShowLanding] = useState(true);
// ─── سوئیچ حساب: پریفیل شماره + نقش برای صفحه ورود ───
const [authPrefill, setAuthPrefill] = useState(null); // {phone, role}
// ─── مرحله ۲: لایه‌های تاریخ برای دکمه برگشت (مودال‌های خیاط + مشترک + تب‌ها) ───
useBackLayer(showTailorSettings, () => setShowTailorSettings(false));
useBackLayer(showAddPortfolio, () => setShowAddPortfolio(false));
useBackLayer(showStoryCreator, () => setShowStoryCreator(false));
useBackLayer(Boolean(activeStory), () => { setActiveStory(null); setActiveStoryGroup([]); });
useBackLayer(showOrderChat, () => { setShowOrderChat(false); setActiveChatOrder(null); setActivePreorder(null); });
useBackLayer(showNotificationsScreen, () => setShowNotificationsScreen(false));
useBackLayer(showAboutUs, () => setShowAboutUs(false));
useBackLayer(currentRole === 'tailor' && tailorTab !== 'dashboard', () => setTailorTab('dashboard'));
// ─── مرحله ۳: لایه‌های تاریخ پنل مشتری (برگشت مرورگر/گوشی) ───
useBackLayer(currentRole === 'auth' && !user && !showLanding, () => setShowLanding(true));
useBackLayer(Boolean(selectedDesign) && showInvoice, () => setShowInvoice(false));
useBackLayer(Boolean(selectedDesign) && showCustomization && !showInvoice, () => setShowCustomization(false));
useBackLayer(Boolean(selectedDesign) && !showCustomization && !showInvoice, () => { setSelectedDesign(null); setSelectedTailor(null); });
useBackLayer(showSearchFilter, () => setShowSearchFilter(false));
useBackLayer(showWishlist, () => setShowWishlist(false));
useBackLayer(showWalletScreen, () => setShowWalletScreen(false));
useBackLayer(Boolean(publicTailor), () => setPublicTailor(null));
useBackLayer(Boolean(reviewOrder), () => setReviewOrder(null));
useBackLayer(showAddressScreen, () => setShowAddressScreen(false));
useBackLayer(showSupportScreen, () => setShowSupportScreen(false));
useBackLayer(showGuaranteeScreen, () => setShowGuaranteeScreen(false));
useBackLayer(currentRole === 'customer' && activeTab !== 'home', () => setActiveTab('home'));

  // سئوی ماژولار: عنوان و متای هر صفحه بر اساس نقش و تب فعال
usePageMeta(
currentRole === 'tailor'
? { title: 'داشبورد کارگاه خیاط', description: 'مدیریت سفارش‌ها، نمونه‌کارها و تسویه حساب کارگاه خیاطی در کَندوره.', path: '/tailor' }
: currentRole === 'customer'
? { title: activeTab === 'orders' ? 'سفارش‌های من' : activeTab === 'designs' ? 'کاتالوگ طرح‌ها' : 'ویترین کَندوره', description: 'سفارش آنلاین لباس سنتی هرمزگان با پرداخت امانی.', path: `/${activeTab}` }
: { title: 'ورود | ثبت‌نام', description: 'ورود یا ثبت‌نام در کَندوره؛ پلتفرم سفارش آنلاین لباس سنتی هرمزگان.', path: '/' }
);
// ورود موفق کاربر یا خیاط
const handleLoginSuccess = (loggedInUser) => {
if (loggedInUser) {
setUser(loggedInUser);
// ─── بازنشانی ناوبری: ورود همیشه از صفحه اصلی/داشبورد آغاز شود ───
setShowLanding(false);
setAuthPrefill(null);
setActiveTab('home');
setTailorTab('dashboard');
setSelectedDesign(null);
setShowCustomization(false);
setShowInvoice(false);
if (loggedInUser.role === 'admin') {
setCurrentRole('admin_dashboard');
} else if (loggedInUser.role === 'tailor') {
setCurrentRole('tailor');
} else {
setCurrentRole('customer');
}
}
};

  // ورود موفق ادمین
  const handleAdminLoginSuccess = (adminData) => {
    setUser(adminData);
    setCurrentRole('admin_dashboard');
  };

  // خروج از حساب کاربری
  // خروج از حساب کاربری + ثبت آنی خروج (آفلاین شدن همان لحظه)
  const handleLogout = () => {
    if (user?.id) chatApi.goOffline(user.id).catch(() => {});
    logout();
    localStorage.removeItem('kandooreh_admin_token');
    localStorage.removeItem('kandooreh_admin_user');
    window.location.hash = '';
// ─── بازنشانی ناوبری برای جلسه بعد ───
setActiveTab('home');
setTailorTab('dashboard');
setSelectedDesign(null);
setShowCustomization(false);
setShowInvoice(false);
setCurrentRole('auth');
setShowLanding(true);
};
// دیپ‌لینک اعلان‌ها: مسیریابی دقیق و واقعی برای خیاط، مشتری و ادمین
useEffect(() => {
  const handleOpenNotification = (e) => {
    const { category, referenceId } = e.detail || {};
    setShowNotificationsScreen(false);

    // ۱. چت زنده سفارش ➔ باز شدن مستقیم پنجره چت همان سفارش
    if (category === 'چت سفارش') {
      setActiveChatOrder({ id: referenceId });
      setShowOrderChat(true);
      return;
    }

    // ۲. تیکت‌های پشتیبانی ➔ باز شدن مستقیم مرکز پشتیبانی برای خیاط و مشتری
    if (category === 'پیام‌های سیستمی' || category === 'پشتیبانی') {
      setShowSupportScreen(true);
      return;
    }

    // ۳. امور مالی، تسویه و بیعانه
    if (category === 'مالی و بیعانه') {
      if (currentRole === 'tailor') {
        setTailorTab('accounting');
      } else {
        setShowWalletScreen(true);
      }
      return;
    }

    // ۴. وضعیت سفارش‌ها ➔ رفتن به تب سفارش‌ها
    if (currentRole === 'tailor') {
      setTailorTab('orders');
    } else {
      setActiveTab('orders');
    }
  };

  window.addEventListener('kandooreh:open-notification', handleOpenNotification);
  return () => window.removeEventListener('kandooreh:open-notification', handleOpenNotification);
}, [currentRole]);
// ─── مرحله ۴: دکمه برگشت سخت‌افزاری اندروید (Capacitor) ───
useEffect(() => setupCapacitorBackButton(), []);

  // رندر صفحه ورود ادمین
  if (currentRole === 'admin_login') {
    return (
      <AdminLogin
        onLoginSuccess={handleAdminLoginSuccess}
        onBackToApp={() => {
          window.location.hash = '';
          setCurrentRole('auth');
        }}
      />
    );
  }

  // رندر داشبورد مدیریت ادمین
  if (currentRole === 'admin_dashboard') {
const adminData = user || JSON.parse(localStorage.getItem('kandooreh_admin_user') || '{}');
return (
<>
<NotificationEngine userId={adminData?.id} />
<AdminDashboard
adminUser={adminData}
onLogout={handleLogout}
/>
</>
);
}

 // اگر کاربر وارد نشده باشد: اول لندینگ؛ با کلیک روی هر CTA به صفحه ورود زیبای موجود می‌رود
if (currentRole === 'auth' || !user) {
if (showLanding) {
return (
<>
<LandingPage
onOpenAuth={() => setShowLanding(false)}
onOpenAboutUs={() => setShowAboutUs(true)}
/>
{showAboutUs && (
<AboutUsModal
isOpen={showAboutUs}
onClose={() => setShowAboutUs(false)}
onExploreCatalog={() => {
setShowAboutUs(false);
setShowLanding(false);
}}
/>
)}
</>
);
}
return <AuthScreen onLoginSuccess={handleLoginSuccess} initialRole={authPrefill?.role} initialPhone={authPrefill?.phone} />;
}
 

  // ۲. ناوبری پنل مشتری (۵ تب)
  const customerNavItems = [
    { id: 'home', label: 'خانه', icon: Home },
    { id: 'designs', label: 'طرح‌ها', icon: LayoutGrid },
    { id: 'orders', label: 'سفارش‌ها', icon: ShoppingBag },
    { id: 'measurements', label: 'اندازه‌ها', icon: Ruler },
    { id: 'profile', label: 'پروفایل', icon: User },
  ];

  // ۳. ناوبری پنل خیاط (۵ تب)
  const tailorNavItems = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutGrid },
    { id: 'orders', label: 'سفارش‌ها', icon: FileText },
    { id: 'portfolio', label: 'نمونه‌کارها', icon: Shirt },
    { id: 'reviews', label: 'نظرات', icon: MessageSquareQuote },
    { id: 'accounting', label: 'حسابداری', icon: Wallet },
  ];

  return (
<div className="min-h-screen kandooreh-luxury-bg flex">
  <NotificationEngine userId={user?.id} />
{user?.id && <PresenceHeartbeat userId={user.id} />}
<main className="flex-1 min-w-0">
        
        {/* نمایش بخش‌های پنل مشتری */}
        {currentRole === 'customer' && (
          <>
            {activeTab === 'home' && (
              <HomeScreen 
                stories={stories || []}
                portfolioItems={portfolioItems || []}
                onSelectDesign={(design) => setSelectedDesign(design)}
                onSelectTailor={(tailorData) => setPublicTailor(tailorData)}
                onBrowseAll={() => setActiveTab('designs')}
                onOpenWishlist={() => setShowWishlist(true)}
                onOpenNotifications={() => setShowNotificationsScreen(true)}
                onOpenStory={(storyItem, storyGroup) => { 
  setActiveStory(storyItem); 
  setActiveStoryGroup(storyGroup || [storyItem]); 
}}
              />
            )}
            {activeTab === 'designs' && (
              <DesignsScreen 
                portfolioItems={portfolioItems || []}
                onSelectDesign={(design) => setSelectedDesign(design)}
                onBack={() => setActiveTab('home')}
                onOpenSearch={() => setShowSearchFilter(true)}
                activeFilters={appliedFilters}
                onClearFilters={() => setAppliedFilters(null)}
              />
            )}
            {activeTab === 'measurements' && <MeasurementsScreen currentUser={user} />}
            {activeTab === 'orders' && (
              <OrdersScreen 
                currentUser={user}
                onExploreClick={() => setActiveTab('designs')} 
                onOpenChat={(order) => {
                  setActiveChatOrder(order);
                  setShowOrderChat(true);
                }}
                onOpenReview={(orderItem) => setReviewOrder(orderItem)}
              />
            )}
            {activeTab === 'profile' && (
              <ProfileScreen 
                currentUser={user}
                onSwitchToTailor={() => { setAuthPrefill({ phone: user?.username, role: 'tailor' }); setCurrentRole('auth'); setShowLanding(false); }} 
                onOpenAddresses={() => setShowAddressScreen(true)}
                onOpenWishlist={() => setShowWishlist(true)}
                onOpenWallet={() => setShowWalletScreen(true)}
                onOpenSupport={() => setShowSupportScreen(true)}
                onOpenGuarantee={() => setShowGuaranteeScreen(true)}
                onOpenAboutUs={() => setShowAboutUs(true)}
                onLogout={handleLogout}
                onUpdateUser={(updated) => setUser(updated)}
              />
            )}
          </>
        )}

        {/* نمایش بخش‌های پنل خیاط به صورت ماژولار و متصل به دیتابیس */}
        {currentRole === 'tailor' && (
          <>
            {tailorTab === 'dashboard' && (
              <TailorDashboard 
                tailorUser={user}
                onLogout={handleLogout} 
                onOpenSettings={() => setShowTailorSettings(true)}
                onOpenAddPortfolio={() => setShowAddPortfolio(true)}
                onOpenBom={() => setShowBomScreen(true)}
                onOpenNotifications={() => setShowNotificationsScreen(true)}
                onOpenAboutUs={() => setShowAboutUs(true)}
                onOpenStory={(storyItem, storyGroup) => { setActiveStory(storyItem); setActiveStoryGroup(storyGroup || [storyItem]); }}
                onOpenStoryCreator={() => setShowStoryCreator(true)}
                stories={stories}
                onOpenPreorderChat={(thread) => {
                  setActiveChatOrder(null);
                  setActivePreorder({
                    threadKey: thread.threadKey,
                    customerUserId: thread.customerId,
                    customerName: thread.customerName,
                    customerAvatar: thread.customerAvatar || null,
                    customerPhone: thread.customerPhone || '',
                                     tailorUserId: user?.id || 0,
                 tailorName: user?.name || 'کارگاه خیاطی',
                    tailorAvatar: user?.avatarUrl || null,
                    tailorPhone: user?.phone || '',
                    designTitle: 'گفتگوی پیش از سفارش',
                  });
                  setShowOrderChat(true);
                }}
              />
            )}
            {tailorTab === 'orders' && (
              <TailorOrders 
                tailorUser={user} 
                onOpenChat={(order) => {
                  setActiveChatOrder(order);
                  setShowOrderChat(true);
                }} 
              />
            )}
            {tailorTab === 'portfolio' && (
                         <TailorPortfolio 
             tailorUser={user} 
             onOpenAddPortfolio={() => { setEditingDesign(null); setShowAddPortfolio(true); }} 
             onEditDesign={(item) => { setEditingDesign(item); setShowAddPortfolio(true); }} 
           />
            )}
            {tailorTab === 'reviews' && (
              <TailorReviews 
                tailorUser={user} 
              />
            )}
            {tailorTab === 'accounting' && (
              <TailorAccounting 
                tailorUser={user} 
              />
            )}
          </>
        )}

      </main>

      {/* نوار ناوبری پایین صفحه شناور (بر اساس نقش مشتری یا خیاط) */}
      <nav className="fixed bottom-3 left-4 right-4 max-w-md mx-auto bottom-nav-glass rounded-3xl px-3 py-2 z-40">
        <div className="flex items-center justify-around">
          {currentRole === 'customer'
            ? customerNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all ${
                      isActive ? 'text-[#B38F24] font-black scale-105' : 'text-[#7E7667] font-bold'
                    }`}
                  >
                    <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-[#D4AF37]/20 text-[#B38F24]' : ''}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px]">{item.label}</span>
                  </button>
                );
              })
            : tailorNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = tailorTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setTailorTab(item.id)}
                    className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all ${
                      isActive ? 'text-[#B38F24] font-black scale-105' : 'text-[#7E7667] font-bold'
                    }`}
                  >
                    <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-[#D4AF37]/20 text-[#B38F24]' : ''}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px]">{item.label}</span>
                  </button>
                );
              })}
        </div>
      </nav>

      {/* مودال‌های ماژولار فرآیند سفارش مشتری متصل به دیتابیس */}
      {selectedDesign && !showCustomization && !showInvoice && (
        <DesignDetailModal 
          design={selectedDesign} 
          onClose={() => setSelectedDesign(null)} 
       onProceedToCustomization={(tailor) => {
         setSelectedTailor(tailor);
         setShowCustomization(true);
       }}
       onOpenTailorProfile={(t) => {
         setSelectedDesign(null);
         setPublicTailor(t);
       }}
                 onOpenChat={(tailorData, designData) => {
         const tailorId = tailorData?.userId || 0;
         if (!user?.id || !tailorId) { toast.warning('برای شروع گفتگو ابتدا وارد شوید.'); return; }
         setActiveChatOrder(null);
         setActivePreorder({
           threadKey: chatApi.preorderThreadKey(user.id, tailorId),
           customerUserId: user.id,
           customerName: user?.name || 'مشتری کَندوره',
           customerAvatar: user?.avatarUrl || null,
           customerPhone: user?.phone || '',
           tailorUserId: tailorId,
           tailorName: tailorData?.name || 'کارگاه خیاطی',
           tailorAvatar: tailorData?.avatar || null,
           tailorPhone: tailorData?.phone || '',
           designTitle: designData?.title || 'طرح پیش از سفارش',
         });
         setShowOrderChat(true);
       }}
        />
      )}

      {selectedDesign && showCustomization && !showInvoice && (
        <CustomizationModal
          design={selectedDesign}
          tailor={selectedTailor}
          currentUser={user}
          onBack={() => setShowCustomization(false)}
          onProceedToPayment={(data) => {
            setCustomizationData(data);
            setShowInvoice(true);
          }}
        />
      )}

      {selectedDesign && showInvoice && (
        <CheckoutInvoiceModal
          orderData={customizationData}
          currentUser={user}
          onBack={() => setShowInvoice(false)}
          onCompleteSuccess={() => {
            setShowInvoice(false);
            setShowCustomization(false);
            setSelectedDesign(null);
            setSelectedTailor(null);
                     setActiveTab('orders');
         toast.success('سفارش ثبت شد ✅ در انتظار تایید خیاط؛ سپس دکمه «پرداخت بیعانه» در سفارش‌های من فعال می‌شود.');
       }}
        />
      )}
      {/* مودال ثبت نمونه‌کار جدید خیاط با آپلود فیزیکی در هاست */}
        {showAddPortfolio && (
          <PortfolioWizardModal
    isOpen={showAddPortfolio}
    onClose={() => { setShowAddPortfolio(false); setEditingDesign(null); }}
    tailorUser={user}
    editingDesign={editingDesign}
              onPublishSuccess={() => {
      setShowAddPortfolio(false);
      setEditingDesign(null);
      refreshData();
      toast.success('نمونه‌کار شما با موفقیت در کاتالوگ عمومی کَندوره منتشر شد!');
    }}
     />
   )}
      {/* مودال چت و گفت‌وگوی زنده متصل به دیتابیس با امکان ارسال عکس */}
      <OrderChatModal
        isOpen={showOrderChat}
        onClose={() => {
          setShowOrderChat(false);
          setActiveChatOrder(null);
          setActivePreorder(null);
        }}
        orderId={activeChatOrder?.id || ''}
        preorder={activePreorder}
        currentUser={user}
             orderDetails={{
       userId: activeChatOrder?.userId,
       customerUserId: activeChatOrder?.userId,
       tailorUserId: activeChatOrder?.tailorUserId,
       customerAvatar: activeChatOrder?.customerAvatar || null,
       tailorAvatar: activeChatOrder?.tailorAvatar || null,
       designTitle: activeChatOrder?.designTitle || 'طرح سفارش',
       tailorName: activeChatOrder?.tailorName || 'کارگاه خیاطی',
       customerName: activeChatOrder?.customerName || 'مشتری کَندوره',
       customerPhone: activeChatOrder?.customerPhone || '',
       statusText: activeChatOrder?.statusText || 'در حال انجام'
     }}
      />

      {/* مودال ویترین عمومی خیاط */}
      <PublicTailorProfileModal
        isOpen={Boolean(publicTailor)}
        onClose={() => setPublicTailor(null)}
        tailor={publicTailor}
             onOpenChat={() => {
       const t = publicTailor;
       const tailorId = t?.userId || t?.id || 0;
       if (!user?.id || !tailorId) { toast.warning('برای شروع گفتگو ابتدا وارد شوید.'); return; }
       setPublicTailor(null);
       setActiveChatOrder(null);
       setActivePreorder({
         threadKey: chatApi.preorderThreadKey(user.id, tailorId),
         customerUserId: user.id,
         customerName: user?.name || 'مشتری کَندوره',
         customerAvatar: user?.avatarUrl || null,
         customerPhone: user?.phone || '',
         tailorUserId: tailorId,
         tailorName: t?.name || 'کارگاه خیاطی',
         tailorAvatar: t?.avatar || null,
         tailorPhone: t?.phone || '',
         designTitle: 'مشاوره پیش از سفارش',
       });
       setShowOrderChat(true);
     }}
        onSelectDesign={(designItem) => {
          setPublicTailor(null);
          setSelectedDesign(designItem);
        }}
      />

      {/* مودال جستجوی هوشمند و فیلتر پیشرفته */}
      <SearchFilterModal
        isOpen={showSearchFilter}
        onClose={() => setShowSearchFilter(false)}
        onApplyFilters={(filters) => {
          setAppliedFilters(filters);
          setShowSearchFilter(false);
          setActiveTab('designs');
        }}
      />

      {/* مودال ثبت نظر و امتیازدهی چندمعیاره متصل به دیتابیس */}
      {reviewOrder && (
        <ReviewRatingModal
          isOpen={Boolean(reviewOrder)}
          onClose={() => setReviewOrder(null)}
          order={reviewOrder}
          currentUser={user}
                 onReviewSuccess={() => {
         setReviewOrder(null);
         toast.success('با تشکر! نظر ارزشمند شما ثبت شد و ۵۰ امتیاز به باشگاه شما اضافه گردید ✨');
       }}
        />
      )}

      {/* مودال مدیریت آدرس‌های تحویل متصل به دیتابیس */}
      <AddressManagementModal
        isOpen={showAddressScreen}
        onClose={() => setShowAddressScreen(false)}
        currentUser={user}
             onSelectAddress={(selectedAddr) => {
       setShowAddressScreen(false);
       toast.success(`آدرس تحویل «${selectedAddr.title}» با موفقیت انتخاب شد.`);
     }}
      />

      {/* مودال طرح‌های نشان‌شده و علاقه‌مندی‌ها */}
      <WishlistModal
        isOpen={showWishlist}
        onClose={() => setShowWishlist(false)}
        onOpenFilter={() => setShowSearchFilter(true)}
        onSelectDesign={(designItem) => {
          setShowWishlist(false);
          setSelectedDesign(designItem);
        }}
      />

      {/* مودال کیف پول و اعتبارات مشتری */}
      <CustomerWalletModal
        isOpen={showWalletScreen}
        onClose={() => setShowWalletScreen(false)}
        currentUser={user}
      />

      {/* مودال مرکز اعلانات و پیام‌ها */}
      <NotificationCenterModal
        isOpen={showNotificationsScreen}
        onClose={() => setShowNotificationsScreen(false)}
        currentUser={user}
        onNavigateToOrders={() => {
          setShowNotificationsScreen(false);
          if (currentRole === 'customer') {
            setActiveTab('orders');
          } else {
            setTailorTab('orders');
          }
        }}
      />

      {/* مودال مرکز پشتیبانی و راهنما */}
      <CustomerSupportModal
        isOpen={showSupportScreen}
        onClose={() => setShowSupportScreen(false)}
        currentUser={user}
        onOpenLiveChat={() => {
          setShowSupportScreen(false);
          setShowOrderChat(true);
        }}
      />

      {/* مودال ضمانت دوخت و پرداخت امن */}
      <GuaranteeTermsModal
        isOpen={showGuaranteeScreen}
        onClose={() => setShowGuaranteeScreen(false)}
      />

      {/* مودال درباره کَندوره (مطابق تصویر) */}
      <AboutUsModal
        isOpen={showAboutUs}
        onClose={() => setShowAboutUs(false)}
        onExploreCatalog={() => {
          setShowAboutUs(false);
          setActiveTab('designs');
        }}
      />

      {/* مودال تمام‌صفحه نمایش استوری با پشتیبانی از پخش پشت‌سرهم */}
      {activeStory && (
        <StoryViewerModal
          key={activeStory.id || 'active-story-viewer'}
          story={activeStory}
          storiesList={activeStoryGroup.length > 0 ? activeStoryGroup : [activeStory]}
          initialIndex={Math.max(0, activeStoryGroup.findIndex(s => s.id === activeStory.id))}
          isTailor={currentRole === 'tailor'}
          currentUser={user}
          onClose={() => { setActiveStory(null); setActiveStoryGroup([]); }}
                 onDeleteStory={async (storyId) => {
         await storiesApi.delete(storyId, user?.id || 0);
         refreshData();
       }}
          onOrderWork={() => {
            setActiveStory(null);
            setActiveStoryGroup([]);
            setSelectedDesign({
              title: activeStory.storyTitle,
              tailorName: activeStory.name,
              price: activeStory.price || 520000,
            });
          }}
        />
      )}
      {/* مودال استودیو و استوری‌ساز خیاط با ماندگاری ۲۴ ساعته در هاست */}
      {showStoryCreator && (
        <StoryCreatorModal
          isOpen={showStoryCreator}
          onClose={() => setShowStoryCreator(false)}
          tailorUser={user}
          onPublishStory={() => {
            setShowStoryCreator(false);
            refreshData();
          }}
        />
      )}

      {/* مودال تنظیمات کارگاه و پروفایل خیاط (مطابق طرح عکس) */}
      {showTailorSettings && (
            <TailorSettingsModal
      isOpen={showTailorSettings}
      onClose={() => setShowTailorSettings(false)}
      tailorUser={user}
onLogout={handleLogout}
onSwitchToCustomer={() => { setShowTailorSettings(false); setAuthPrefill({ phone: user?.username, role: 'customer' }); setCurrentRole('auth'); setShowLanding(false); }}
onSaveSuccess={(updatedUser) => {
if (updatedUser) setUser(updatedUser);
setShowTailorSettings(false);
refreshData();
}}
/>
)}
{/* نمایشگر سراسری تصویر با زوم/پن (حالت رویدادی، بدون استیت اضافه) */}
<ImageViewerModal />
</div>
);
};

export default function App() {
return (
<AppProvider>
<ToastProvider>
<AppShell />
</ToastProvider>
</AppProvider>
);
}