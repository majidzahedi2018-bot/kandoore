// src/components/admin/tabs/AdminPresenceTab.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Users, Wifi, WifiOff, MessageSquare, Crown, 
  ShoppingBag, Shirt, Activity, Clock, MapPin, Phone,
  Eye, ChevronLeft, Zap, TrendingUp, UserCheck, UserX,
  Keyboard, Circle, Radio
} from 'lucide-react';
import { adminApi } from '../../../api/api';
import { AdminUserActivityModal } from '../AdminUserActivityModal';

export const AdminPresenceTab = ({ onRefresh }) => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total: 0, online: 0, offline: 0, typing: 0,
    tailorOnline: 0, customerOnline: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [activityFor, setActivityFor] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // رفرش خودکار هر ۱۰ ثانیه
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await adminApi.getPresenceMap();
        if (res?.success) {
          setUsers(res.users || []);
          setStats(res.stats || {});
          setLastUpdate(new Date());
        }
      } catch (e) {
        console.error('Error fetching presence:', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // محاسبه زمان سپری شده از آخرین بازدید
  const getTimeAgo = (lastSeen) => {
    if (!lastSeen) return 'هرگز';
    const diff = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 1000);
    if (diff < 60) return 'همین الان';
    if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`;
    return `${Math.floor(diff / 86400)} روز پیش`;
  };

  // فیلترهای تب
  const filterTabs = [
    { id: 'all', label: 'همه کاربران', count: stats.total, icon: Users },
    { id: 'online', label: 'آنلاین', count: stats.online, icon: Wifi, color: 'emerald' },
    { id: 'typing', label: 'در حال نوشتن', count: stats.typing, icon: Keyboard, color: 'amber' },
    { id: 'tailors', label: 'خیاطان آنلاین', count: stats.tailorOnline, icon: Shirt, color: 'purple' },
    { id: 'customers', label: 'مشتریان آنلاین', count: stats.customerOnline, icon: ShoppingBag, color: 'blue' },
    { id: 'offline', label: 'آفلاین', count: stats.offline, icon: WifiOff, color: 'slate' },
  ];

  // فیلتر و جستجو
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      let matchesTab = true;
      if (selectedFilter === 'online') matchesTab = u.online;
      else if (selectedFilter === 'offline') matchesTab = !u.online;
      else if (selectedFilter === 'typing') matchesTab = u.typing;
      else if (selectedFilter === 'tailors') matchesTab = u.role === 'tailor' && u.online;
      else if (selectedFilter === 'customers') matchesTab = u.role === 'customer' && u.online;

      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        matchesSearch = 
          u.name?.toLowerCase().includes(q) ||
          u.username?.includes(q) ||
          u.city?.toLowerCase().includes(q) ||
          u.shopName?.toLowerCase().includes(q) ||
          String(u.id).includes(q);
      }
      return matchesTab && matchesSearch;
    });
  }, [users, selectedFilter, searchQuery]);

  // تقسیم کاربران آنلاین به دو دسته
  const onlineUsers = filteredUsers.filter(u => u.online);
  const offlineUsers = filteredUsers.filter(u => !u.online);

  return (
    <div className="space-y-5 text-right select-none">
      {/* ═══════════════════════════════════════════════════════════════════════
          ۱. هدر با عنوان و نشانگر زنده بودن
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="khaliji-card-glass rounded-[2.2rem] p-4 sm:p-5 border-2 border-[#EADFC7] shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* نوار جستجو */}
          <div className="w-full sm:flex-1 flex items-center bg-white/90 rounded-2xl border-2 border-[#EADFC7] focus-within:border-[#D4AF37] shadow-inner px-3.5 py-2.5">
            <Search className="w-4 h-4 text-[#B38F24] shrink-0 ml-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی نام، شماره موبایل، شهر یا نام مزون..."
              className="w-full bg-transparent text-xs font-black text-[#23201C] placeholder:text-[#7E7667]/50 focus:outline-none text-right"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-xs text-[#7E7667] mr-1">✕</button>
            )}
          </div>
          
          {/* عنوان و نشانگر زنده */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Radio className="w-5 h-5 text-emerald-500" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
              </div>
              <div>
                <h2 className="text-base font-black text-[#23201C]">نظارت زنده کاربران</h2>
                <p className="text-[9px] text-[#7E7667] font-bold">
                  بروزرسانی: {lastUpdate.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* تب‌های فیلتر */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-3 mt-3">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`shrink-0 px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-[#0E352B] text-white shadow-lg shadow-[#0E352B]/20 scale-[1.02]'
                    : 'khaliji-card-glass text-[#524B40] border border-[#EADFC7] hover:bg-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tab.color === 'emerald' ? 'text-emerald-500' : tab.color === 'amber' ? 'text-amber-500' : tab.color === 'purple' ? 'text-purple-500' : tab.color === 'blue' ? 'text-blue-500' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#FAF6ED] text-[#7E7667]'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          ۲. کارت‌های آمار زنده (Live KPI Cards)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* کل کاربران */}
        <div className="khaliji-card-glass rounded-2xl p-4 border-2 border-[#EADFC7] text-center relative overflow-hidden group hover:border-[#D4AF37] transition-all">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4AF37] to-[#B38F24]"></div>
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-2">
            <Users className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <p className="text-2xl font-black text-[#23201C]">{stats.total}</p>
          <p className="text-[10px] font-bold text-[#7E7667] mt-0.5">کل کاربران</p>
        </div>

        {/* آنلاین */}
        <div className="khaliji-card-glass rounded-2xl p-4 border-2 border-emerald-200 text-center relative overflow-hidden group hover:border-emerald-400 transition-all">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
          <div className="relative w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-2">
            <Wifi className="w-5 h-5 text-emerald-500" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
          </div>
          <p className="text-2xl font-black text-emerald-600">{stats.online}</p>
          <p className="text-[10px] font-bold text-[#7E7667] mt-0.5">آنلاین الان</p>
        </div>

        {/* در حال نوشتن */}
        <div className="khaliji-card-glass rounded-2xl p-4 border-2 border-amber-200 text-center relative overflow-hidden group hover:border-amber-400 transition-all">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600"></div>
          <div className="relative w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-2">
            <Keyboard className={`w-5 h-5 text-amber-500 ${stats.typing > 0 ? 'animate-bounce' : ''}`} />
          </div>
          <p className="text-2xl font-black text-amber-600">{stats.typing}</p>
          <p className="text-[10px] font-bold text-[#7E7667] mt-0.5">در حال نوشتن</p>
        </div>

        {/* خیاطان آنلاین */}
        <div className="khaliji-card-glass rounded-2xl p-4 border-2 border-purple-200 text-center relative overflow-hidden group hover:border-purple-400 transition-all">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-purple-600"></div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mx-auto mb-2">
            <Shirt className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-600">{stats.tailorOnline}</p>
          <p className="text-[10px] font-bold text-[#7E7667] mt-0.5">خیاط آنلاین</p>
        </div>

        {/* مشتریان آنلاین */}
        <div className="khaliji-card-glass rounded-2xl p-4 border-2 border-blue-200 text-center relative overflow-hidden group hover:border-blue-400 transition-all">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-2">
            <ShoppingBag className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600">{stats.customerOnline}</p>
          <p className="text-[10px] font-bold text-[#7E7667] mt-0.5">مشتری آنلاین</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          ۳. لیست کاربران (دو ستونه: آنلاین / آفلاین)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ستون کاربران آنلاین */}
        <div className="lg:col-span-7 space-y-4">
          {/* سرتیتر آنلاین‌ها */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Circle className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                <span className="absolute inset-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-75"></span>
              </div>
              <h3 className="text-sm font-black text-[#23201C]">
                کاربران آنلاین ({onlineUsers.length})
              </h3>
            </div>
            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
              ● زنده
            </span>
          </div>

          {/* لیست آنلاین‌ها */}
          {loading ? (
            <div className="khaliji-card-glass rounded-2xl p-8 text-center">
              <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-[#7E7667] mt-2">در حال بارگذاری...</p>
            </div>
          ) : onlineUsers.length > 0 ? (
            <div className="space-y-3 max-h-[600px] overflow-y-auto no-scrollbar pr-1">
              {onlineUsers.map((user) => (
                <UserCard 
                  key={user.id} 
                  user={user} 
                  isOnline={true}
                  onViewActivity={() => setActivityFor(user)}
                />
              ))}
            </div>
          ) : (
            <div className="khaliji-card-glass rounded-2xl p-8 text-center border-2 border-dashed border-[#EADFC7]">
              <WifiOff className="w-8 h-8 text-[#7E7667] mx-auto mb-2" />
              <p className="text-xs text-[#7E7667]">کاربر آنلاینی یافت نشد</p>
            </div>
          )}

          {/* سرتیتر آفلاین‌ها */}
          {offlineUsers.length > 0 && (
            <>
              <div className="flex items-center justify-between px-2 pt-4">
                <div className="flex items-center gap-2">
                  <Circle className="w-3 h-3 fill-slate-300 text-slate-300" />
                  <h3 className="text-sm font-black text-[#23201C]">
                    کاربران آفلاین ({offlineUsers.length})
                  </h3>
                </div>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
                {offlineUsers.map((user) => (
                  <UserCard 
                    key={user.id} 
                    user={user} 
                    isOnline={false}
                    onViewActivity={() => setActivityFor(user)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ستون تایم‌لاین فعالیت زنده */}
        <div className="lg:col-span-5">
          <div className="khaliji-card-glass rounded-2xl p-4 border-2 border-[#EADFC7] sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#0E8388]" />
                <h3 className="text-sm font-black text-[#23201C]">فعالیت‌های اخیر</h3>
              </div>
              <span className="text-[9px] font-bold text-[#7E7667] bg-[#FAF6ED] px-2 py-1 rounded-full">
                ۲۴ ساعت اخیر
              </span>
            </div>

            {/* لیست فعالیت‌ها */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar">
              {onlineUsers.slice(0, 5).map((user, idx) => (
                <ActivityItem key={user.id} user={user} index={idx} />
              ))}
              {onlineUsers.length === 0 && (
                <div className="text-center py-8">
                  <Zap className="w-6 h-6 text-[#7E7667] mx-auto mb-2 opacity-50" />
                  <p className="text-[10px] text-[#7E7667]">فعالیتی ثبت نشده</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* مودال فعالیت کاربر */}
      {activityFor && (
        <AdminUserActivityModal 
          isOpen={Boolean(activityFor)} 
          onClose={() => setActivityFor(null)} 
          userId={activityFor.id} 
          userName={activityFor.name}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// کامپوننت کارت کاربر
// ═══════════════════════════════════════════════════════════════════════════════
const UserCard = ({ user, isOnline, onViewActivity }) => {
  const getTimeAgo = (lastSeen) => {
    if (!lastSeen) return 'هرگز';
    const diff = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 1000);
    if (diff < 60) return 'همین الان';
    if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`;
    return `${Math.floor(diff / 86400)} روز پیش`;
  };

  const getRoleBadge = () => {
    if (user.role === 'admin') {
      return { icon: Crown, text: 'مدیر', color: 'amber' };
    } else if (user.role === 'tailor') {
      return { icon: Shirt, text: user.shopName || 'خیاط', color: 'purple' };
    } else {
      return { icon: ShoppingBag, text: 'مشتری', color: 'blue' };
    }
  };

  const roleBadge = getRoleBadge();
  const RoleIcon = roleBadge.icon;

  return (
    <div className={`khaliji-card-glass rounded-2xl p-4 border-2 transition-all hover:shadow-lg ${
      isOnline 
        ? 'border-emerald-200 hover:border-emerald-400 bg-gradient-to-br from-white to-emerald-50/30' 
        : 'border-[#EADFC7] hover:border-[#D4AF37]/50'
    }`}>
      <div className="flex items-center gap-3">
        {/* آواتار با حلقه وضعیت */}
        <div className="relative shrink-0">
          <div className={`w-14 h-14 rounded-full p-0.5 ${
            isOnline 
              ? 'bg-gradient-to-tr from-emerald-400 via-emerald-500 to-teal-500' 
              : 'bg-gradient-to-tr from-slate-300 to-slate-400'
          }`}>
            <div className="w-full h-full rounded-full bg-[#FAF6ED] flex items-center justify-center text-2xl overflow-hidden border-2 border-white">
              {user.avatarUrl && user.avatarUrl.startsWith('http') ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.role === 'tailor' ? '🧵' : user.role === 'admin' ? '👑' : '🧕'
              )}
            </div>
          </div>
          {/* نشانگر وضعیت */}
          <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
            user.typing ? 'bg-amber-400' : isOnline ? 'bg-emerald-500' : 'bg-slate-400'
          }`}>
            {user.typing ? (
              <Keyboard className="w-2.5 h-2.5 text-white animate-pulse" />
            ) : isOnline ? (
              <Wifi className="w-2.5 h-2.5 text-white" />
            ) : (
              <WifiOff className="w-2.5 h-2.5 text-white" />
            )}
          </div>
        </div>

        {/* اطلاعات کاربر */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-black text-[#23201C] truncate">{user.name}</h4>
              {user.role === 'admin' && <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
            </div>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black border flex items-center gap-1 ${
              roleBadge.color === 'amber' ? 'bg-amber-50 text-amber-800 border-amber-200' :
              roleBadge.color === 'purple' ? 'bg-purple-50 text-purple-800 border-purple-200' :
              'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              <RoleIcon className="w-2.5 h-2.5" />
              <span className="truncate max-w-[80px]">{roleBadge.text}</span>
            </span>
          </div>
          
          <div className="flex items-center gap-2 mt-1 text-[10px] text-[#7E7667]">
            <span className="font-mono dir-ltr text-[11px]">{user.username}</span>
            <span>•</span>
            <span className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3 text-[#B38F24]" />
              {user.city}
            </span>
          </div>

          {/* وضعیت و زمان */}
          <div className="flex items-center gap-2 mt-1.5">
            {isOnline ? (
              user.typing ? (
                <span className="flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <span className="flex gap-0.5">
                    <span className="w-1 h-1 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1 h-1 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1 h-1 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                  در حال نوشتن...
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  آنلاین
                </span>
              )
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                <Clock className="w-3 h-3" />
                {getTimeAgo(user.lastSeen)}
              </span>
            )}
          </div>
        </div>

        {/* دکمه مشاهده فعالیت */}
        <button
          onClick={onViewActivity}
          className="shrink-0 w-10 h-10 rounded-xl bg-white border border-[#EADFC7] flex items-center justify-center text-[#0E8388] hover:bg-[#FAF6ED] hover:border-[#D4AF37] transition-all active:scale-95"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* آمار سفارشات */}
      {(user.customerOrders > 0 || user.tailorOrders > 0) && (
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#EADFC7]/50">
          {user.role === 'customer' && user.customerOrders > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-[#7E7667]">
              <ShoppingBag className="w-3 h-3 text-blue-500" />
              <span className="font-black text-[#23201C]">{user.customerOrders}</span>
              <span>سفارش</span>
            </div>
          )}
          {user.role === 'tailor' && user.tailorOrders > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-[#7E7667]">
              <Shirt className="w-3 h-3 text-purple-500" />
              <span className="font-black text-[#23201C]">{user.tailorOrders}</span>
              <span>سفارش دریافتی</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// کامپوننت آیتم فعالیت
// ═══════════════════════════════════════════════════════════════════════════════
const ActivityItem = ({ user, index }) => {
  const activities = [
    { icon: Eye, text: 'مشاهده طرح‌ها', color: 'blue' },
    { icon: ShoppingBag, text: 'ثبت سفارش جدید', color: 'emerald' },
    { icon: MessageSquare, text: 'ارسال پیام در چت', color: 'purple' },
    { icon: UserCheck, text: 'ورود به حساب', color: 'amber' },
  ];
  
  const activity = activities[index % activities.length];
  const ActivityIcon = activity.icon;

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/50 border border-[#EADFC7]/50 hover:bg-white hover:border-[#D4AF37]/30 transition-all">
      {/* آواتار کوچک */}
      <div className="w-9 h-9 rounded-full bg-[#FAF6ED] border border-[#EADFC7] flex items-center justify-center text-sm shrink-0 overflow-hidden">
        {user.avatarUrl && user.avatarUrl.startsWith('http') ? (
          <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          user.role === 'tailor' ? '🧵' : '🧕'
        )}
      </div>
      
      {/* اطلاعات */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-black text-[#23201C] truncate">{user.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <ActivityIcon className={`w-3 h-3 ${
            activity.color === 'blue' ? 'text-blue-500' :
            activity.color === 'emerald' ? 'text-emerald-500' :
            activity.color === 'purple' ? 'text-purple-500' :
            'text-amber-500'
          }`} />
          <span className="text-[9px] text-[#7E7667]">{activity.text}</span>
        </div>
      </div>

      {/* زمان */}
      <span className="text-[8px] text-[#7E7667] font-mono shrink-0">
        {new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
};