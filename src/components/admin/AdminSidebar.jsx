// src/components/admin/AdminSidebar.jsx
import React from 'react';
import {
LayoutDashboard, ShoppingBag, Users, UserCheck, Wallet,
Receipt, BarChart2, Settings, FileText, Bell, Headphones,
LogOut, Crown, ChevronLeft, Radio
} from 'lucide-react';

export const AdminSidebar = ({ activeTab, onSelectTab, adminUser, onLogout, counts = {} }) => {
  const menuItems = [
    { id: 'overview', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'orders', label: 'سفارش‌ها', icon: ShoppingBag, count: counts.orders },
    { id: 'tailors', label: 'خیاطان', icon: Users, count: counts.tailors },
    { id: 'customers', label: 'مشتریان', icon: UserCheck },
    { id: 'presence', label: 'کاربران آنلاین', icon: Radio, count: counts.online }, 
    { id: 'payouts', label: 'تسویه حساب', icon: Wallet, count: counts.payouts },
    { id: 'transactions', label: 'تراکنش‌ها', icon: Receipt },
    { id: 'reports', label: 'گزارش‌ها', icon: BarChart2 },
    { id: 'settings', label: 'تنظیمات', icon: Settings },
    { id: 'content', label: 'مدیریت محتوا', icon: FileText },
    { id: 'notifications', label: 'اعلان‌ها', icon: Bell, count: 3 },
    { id: 'support', label: 'پشتیبانی', icon: Headphones },
  ];

  return (
    <aside className="w-full lg:w-72 bg-[#FCFAF6] border-2 border-[#EADFC7] rounded-[2.5rem] p-5 flex flex-col justify-between shadow-xl space-y-4 shrink-0">
      
      <div className="space-y-4">
        {/* لوگوی زرین کَندوره با موتیف اسلیمی */}
        <div className="text-center space-y-1 pb-3 border-b border-[#EADFC7]">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-[#D4AF37] via-[#FFF5C0] to-[#AA771C] p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-[#FAF6ED] rounded-2xl flex items-center justify-center text-2xl border border-white">
              🪡
            </div>
          </div>
          <h1 className="text-2xl font-black metallic-gold-text tracking-tight">کَندوره</h1>
          <p className="text-[9px] font-bold text-[#7E7667]">پلتفرم تخصصی پوشاک اصیل هرمزگان</p>
        </div>

        {/* کارت هویت مدیر */}
        <div className="p-2.5 rounded-2xl bg-[#F8F5EE] border border-[#EADFC7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#AA771C] p-0.5 shadow-sm">
              <div className="w-full h-full bg-[#23201C] rounded-full flex items-center justify-center text-sm text-white border border-white">
                👑
              </div>
            </div>
            <div className="text-right space-y-0.5">
              <h3 className="text-xs font-black text-[#23201C]">{adminUser?.name || 'مدیریت مرکزی'}</h3>
              <span className="text-[9px] font-bold text-[#7E7667] block">مدیر کل سیستم</span>
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>

        {/* منوهای عمودی سایدبار دقیقاً مطابق عکس */}
        <nav className="space-y-1 max-h-[46vh] overflow-y-auto no-scrollbar pr-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full py-2.5 px-3.5 rounded-2xl text-xs font-black flex items-center justify-between transition-all ${
                  isActive
                    ? 'bg-[#0E352B] text-white shadow-md shadow-[#0E352B]/20 scale-[1.02]'
                    : 'text-[#524B40] hover:bg-white/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                            {item.count !== undefined && item.count !== null && item.count > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[9px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#EADFC7] text-[#23201C]'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* بخش پایین سایدبار: بنر پلن ویژه و دکمه خروج */}
      <div className="space-y-2 pt-2 border-t border-[#EADFC7]">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-[#FFFDF7] to-[#FDF8EB] border border-[#D4AF37] text-center space-y-1.5 shadow-sm">
          <div className="flex items-center justify-center gap-1 text-[#B38F24]">
            <Crown className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black">سامانه مدیریت کَندوره</span>
          </div>
          <p className="text-[8px] text-[#7E7667] font-bold">دسترسی به تمام ابزارهای نظارتی</p>
        </div>

        <button
          onClick={onLogout}
          className="w-full py-2.5 px-3 rounded-2xl text-xs font-black text-red-600 hover:bg-red-50 flex items-center justify-center gap-2 transition-all border border-red-100"
        >
          <LogOut className="w-4 h-4" />
          <span>خروج از مدیریت</span>
        </button>
      </div>

    </aside>
  );
};