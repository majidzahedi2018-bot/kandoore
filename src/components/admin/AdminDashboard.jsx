// src/components/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { RotateCcw, Bell } from 'lucide-react';
import { useUnreadBadge } from '../common/NotificationEngine';
import { adminApi } from '../../api/api';
import { useBackLayer } from '../../hooks/useBackLayer';
import { AdminSidebar } from './AdminSidebar';
import { AdminOverviewTab } from './tabs/AdminOverviewTab';
import { AdminOrdersTab } from './tabs/AdminOrdersTab';
import { AdminTailorsTab } from './tabs/AdminTailorsTab';
import { AdminCustomersTab } from './tabs/AdminCustomersTab';
import { AdminPayoutsTab } from './tabs/AdminPayoutsTab';
import { AdminTransactionsTab } from './tabs/AdminTransactionsTab';
import { AdminDesignsTab } from './tabs/AdminDesignsTab';
import { AdminSupportTab } from './tabs/AdminSupportTab';
import { AdminOnlineTab } from './tabs/AdminOnlineTab';
import { AdminPresenceTab } from './tabs/AdminPresenceTab';

export const AdminDashboard = ({ adminUser, onLogout }) => {
const unreadCount = useUnreadBadge();
const [activeTab, setActiveTab] = useState('overview');
// ─── مرحله ۴: دکمه برگشت مرورگر/گوشی در پنل ادمین → بازگشت به تب «نمای کلی» ───
useBackLayer(activeTab !== 'overview', () => setActiveTab('overview'));
  const [stats, setStats] = useState({
    totalVolume: 0,
    totalEscrow: 0,
    totalReleased: 0,
    totalOrders: 0,
    activeOrders: 0,
    totalCustomers: 0,
    totalTailors: 0,
    totalDesigns: 0,
  });

  const [orders, setOrders] = useState([]);
  const [tailors, setTailors] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payouts, setPayouts] = useState([]);
const [onlineCount, setOnlineCount] = useState(0);
const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const resStats = await adminApi.getStats();
      if (resStats?.success && resStats?.stats) setStats(resStats.stats);

      const resOrders = await adminApi.getAllOrders();
      if (resOrders?.success && resOrders?.orders) setOrders(resOrders.orders);

      const resTailors = await adminApi.getAllTailors();
      if (resTailors?.success && resTailors?.tailors) setTailors(resTailors.tailors);

      const resCustomers = await adminApi.getAllCustomers();
      if (resCustomers?.success && resCustomers?.customers) setCustomers(resCustomers.customers);

          const resPayouts = await adminApi.getPayoutRequests();
  if (resPayouts?.success && resPayouts?.payouts) setPayouts(resPayouts.payouts);
  const resPresence = await adminApi.getPresenceMap();
  if (resPresence?.success) setOnlineCount(resPresence.stats?.online || 0);
} catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
fetchDashboardData();
}, []);
// دیپ‌لینک اعلان‌های ادمین
useEffect(() => {
const h = (e) => {
const c = e.detail?.category;
if (c === 'مالی و بیعانه') setActiveTab('payouts');
else if (c === 'پیام‌های سیستمی') setActiveTab('support');
else setActiveTab('orders');
};
window.addEventListener('kandooreh:open-notification', h);
return () => window.removeEventListener('kandooreh:open-notification', h);
}, []);

  return (
    <div className="min-h-screen kandooreh-luxury-bg select-none flex justify-center p-3 sm:p-6" dir="rtl">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 items-start">
        
        {/* سایدبار ماژولار با تمام منوهای عکس */}
        <AdminSidebar 
  activeTab={activeTab}
  onSelectTab={setActiveTab}
  adminUser={adminUser}
  onLogout={onLogout}
       counts={{
     orders: stats.activeOrders || 0,
     tailors: tailors.length,
     payouts: payouts.filter(p => p.status === 'pending').length,
     online: onlineCount
   }}
/>

        {/* محتوای اصلی داشبورد */}
        <main className="flex-1 w-full space-y-4">
          
          {/* نوار عنوان هدر با دکمه رفرش */}
          <div className="khaliji-card-glass rounded-3xl p-4 border border-[#EADFC7] flex items-center justify-between shadow-sm">
<div className="flex items-center gap-2">
<button 
onClick={fetchDashboardData}
title="به‌روزرسانی داده‌ها"
className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#B38F24] border border-[#EADFC7] shadow-sm active:scale-90 transition-transform"
>
<RotateCcw className="w-4 h-4" />
</button>
<div className="relative">
<button title="اعلان‌ها" className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#23201C] border border-[#EADFC7] shadow-sm">
<Bell className="w-4 h-4" />
</button>
{unreadCount > 0 && (
<span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
{unreadCount > 9 ? '+۹' : unreadCount.toLocaleString('fa-IR')}
</span>
)}
</div>
</div>
            
            <div className="text-right">
              <h2 className="text-sm font-black text-[#23201C]">
                {activeTab === 'overview' && 'داشبورد نظارت و آمار زنده'}
                {activeTab === 'orders' && 'مدیریت و مانیتورینگ سفارش‌ها'}
                {activeTab === 'tailors' && 'لیست و وضعیت خیاطان'}
                {activeTab === 'payouts' && 'درخواست‌های تسویه‌حساب بانکی'}
                {activeTab !== 'overview' && activeTab !== 'orders' && activeTab !== 'tailors' && activeTab !== 'payouts' && 'سامانه مدیریت کَندوره'}
              </h2>
              <span className="text-[10px] text-[#7E7667] font-bold">بروزرسانی زنده از دیتابیس MySQL</span>
            </div>
          </div>

          {/* رندر ماژولار تب فعال */}
          {activeTab === 'overview' && (
            <AdminOverviewTab 
              stats={stats}
              orders={orders}
              onSelectTab={setActiveTab}
            />
          )}

          {activeTab === 'orders' && (
            <AdminOrdersTab 
              orders={orders}
              onRefresh={fetchDashboardData}
            />
          )}

          {activeTab === 'tailors' && (
            <AdminTailorsTab 
              tailors={tailors}
              onRefresh={fetchDashboardData}
            />
          )}

          {activeTab === 'customers' && (
            <AdminCustomersTab 
              customers={customers}
              onSelectCustomerOrders={(phone) => {
                setActiveTab('orders');
              }}
            />
          )}

          {activeTab === 'payouts' && (
            <AdminPayoutsTab 
              payouts={payouts}
              stats={stats}
              onRefresh={fetchDashboardData}
            />
          )}

          {activeTab === 'transactions' && (
            <AdminTransactionsTab 
              onSelectOrderDetails={(orderId) => {
                setActiveTab('orders');
              }}
            />
          )}

          {activeTab === 'content' && (
            <AdminDesignsTab 
              onRefresh={fetchDashboardData}
            />
          )}

                 {activeTab === 'support' && (
         <AdminSupportTab 
           onRefresh={fetchDashboardData}
         />
       )}
       {activeTab === 'online' && (
         <AdminOnlineTab 
           onRefresh={fetchDashboardData}
         />
       )}

          {activeTab === 'presence' && (
  <AdminPresenceTab 
    onRefresh={fetchDashboardData}
  />
)}

          {/* تب‌هایی که در گام بعدی با تصویر جداگانه ساخته خواهند شد */}
                 {activeTab !== 'overview' && activeTab !== 'orders' && activeTab !== 'tailors' && activeTab !== 'customers' && activeTab !== 'online' && activeTab !== 'payouts' && activeTab !== 'transactions' && activeTab !== 'content' && activeTab !== 'support' && (
         <div className="khaliji-card-glass rounded-[2.5rem] p-12 border-2 border-dashed border-[#D4AF37]/60 text-center space-y-3">
              <span className="text-4xl">🎨</span>
              <h3 className="text-sm font-black text-[#23201C]">این صفحه در گام بعدی طراحی خواهد شد</h3>
              <p className="text-xs text-[#7E7667]">ابتدا تصویر آن را می‌سازیم و سپس به صورت یک ماژول مجزا کدنویسی می‌کنیم.</p>
              <button
                onClick={() => setActiveTab('overview')}
                className="px-5 py-2.5 bg-[#0E352B] text-white rounded-2xl text-xs font-black shadow-md"
              >
                بازگشت به داشبورد اصلی
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};