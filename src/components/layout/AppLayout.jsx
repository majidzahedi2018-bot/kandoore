import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Home, Grid, ShoppingBag, Ruler, User, LogOut, Scissors } from 'lucide-react';

export const AppLayout = ({ children, activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'home', label: 'خانه', icon: Home },
    { id: 'designs', label: 'طرح‌ها', icon: Grid },
    { id: 'orders', label: 'سفارش‌ها', icon: ShoppingBag },
    { id: 'measurements', label: 'اندازه‌ها', icon: Ruler },
    { id: 'profile', label: 'پروفایل', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#F8F5EE] flex">
      {/* سایدبار دسکتاپ */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-l border-[#EADFC7] p-5 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-[#D4AF37] flex items-center justify-center text-[#23201C]">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-lg text-[#23201C]">کَندوره</h1>
            <span className="text-[10px] text-[#7E7667]">پلتفرم تخصصی هرمزگان</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#D4AF37]/15 text-[#23201C] border border-[#D4AF37]/40'
                    : 'text-[#7E7667] hover:bg-[#F8F5EE] hover:text-[#23201C]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#B38F24]' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-[#EADFC7] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold block text-[#23201C]">{user?.name}</span>
            <span className="text-[10px] text-[#7E7667]">{user?.username}</span>
          </div>
          <button onClick={logout} className="p-2 text-red-500 hover:bg-red-50 rounded-xl">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* محتوای صفحات */}
      <main className="flex-1 min-w-0">{children}</main>

      {/* منوی پایین موبایل */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-[#EADFC7] px-3 py-2 z-50">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl ${
                  isActive ? 'text-[#23201C] font-extrabold' : 'text-[#7E7667]'
                }`}
              >
                <div className={`p-1 rounded-xl ${isActive ? 'bg-[#D4AF37]/20 text-[#23201C]' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};