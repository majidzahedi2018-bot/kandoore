// src/components/customer/CustomerWalletModal.jsx
import React, { useState, useEffect } from 'react';
import { ChevronRight, Wallet, ShieldCheck, Sparkles } from 'lucide-react';
import { ordersApi } from '../../api/api';
import { AnimatedNumber } from '../common/UiKit';
import { useToast } from '../common/ToastSystem';
export const CustomerWalletModal = ({ isOpen, onClose, currentUser }) => {
const { toast } = useToast();
const [walletData, setWalletData] = useState({
    totalEscrow: 0,
    activeEscrowCount: 0,
    clubPoints: 0,
    activeEscrowOrders: []
  });
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      if (!currentUser?.id) return;
      setLoading(true);
      try {
        const res = await ordersApi.getWalletSummary(currentUser.id);
        if (res.success) {
          setWalletData(res);
        }
      } catch (err) {
        console.error('Error fetching wallet summary:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchWallet();
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleConvertPoints = () => {
    if (!walletData.clubPoints || walletData.clubPoints === 0) return;
    const rewardCash = (walletData.clubPoints / 10) * 1000;
    setBalance(prev => prev + rewardCash);
    setWalletData(prev => ({ ...prev, clubPoints: 0 }));
toast.success(`${rewardCash.toLocaleString('fa-IR')} تومان به عنوان اعتبار دوخت فعال گردید! ✨`);
};

  return (
    <div className="fixed inset-0 z-50 bg-[#F8F5EE] flex flex-col justify-between p-0 select-none overflow-hidden max-w-md mx-auto">
      <div className="p-4 bg-white/80 backdrop-blur-md border-b border-[#EADFC7] flex items-center justify-between z-10 shrink-0">
        <button onClick={onClose} className="w-10 h-10 rounded-full khaliji-card-glass flex items-center justify-center text-[#B38F24] border border-[#EADFC7] shadow-sm">
          <ChevronRight className="w-5 h-5" />
        </button>
        <h1 className="text-base font-black text-[#23201C]">کیف پول و اعتبارات</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 pb-20">
        {loading ? (
          <div className="text-center py-16 text-xs font-black text-[#7E7667]">در حال دریافت اطلاعات مالی...</div>
        ) : (
          <>
            {/* کارت موجودی و وجوه در امانت واقعی */}
            <div className="khaliji-card-glass rounded-[2.5rem] p-5 border-2 border-[#D4AF37] shadow-xl text-center space-y-3">
              <span className="text-xs font-black text-[#7E7667] block">موجودی در دسترس شما</span>
              <div className="flex items-baseline justify-center gap-1.5 py-1">
                 <span className="text-3xl font-black text-[#23201C]"><AnimatedNumber value={balance} /></span>             <span className="text-3xl font-black text-[#23201C]"><AnimatedNumber value={balance} /></span>
                <span className="text-xs font-black text-[#7E7667]">تومان</span>
              </div>
              
              <div className="w-full py-2.5 px-3 rounded-2xl bg-emerald-800 text-[#FBF5B7] text-[10px] font-black border border-[#D4AF37]/50 shadow-md flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>
                  {walletData.totalEscrow > 0 
                    ? `مجموع بیعانه در امانت امن: ${walletData.totalEscrow.toLocaleString('fa-IR')} تومان (${walletData.activeEscrowCount} سفارش در جریان)`
                    : 'در حال حاضر سفارش فعالی با وجه امانی ندارید.'}
                </span>
              </div>
            </div>

            {/* لیست سفارشات دارای وجه در امانت */}
            {walletData.activeEscrowOrders?.length > 0 && (
              <div className="space-y-2 text-right">
                <span className="text-xs font-black text-[#23201C] px-1 block">جزئیات وجوه امانی سفارش‌های جاری:</span>
                <div className="space-y-2">
                  {walletData.activeEscrowOrders.map((ord) => (
                    <div key={ord.orderId} className="khaliji-card-glass rounded-2xl p-3 border border-[#EADFC7] flex items-center justify-between">
                      <div className="text-left space-y-0.5">
                        <span className="text-xs font-black text-emerald-700">{ord.depositAmount.toLocaleString('fa-IR')} تومان</span>
                        <span className="text-[9px] text-[#7E7667] block">بیعانه ۳۰٪ محفوظ</span>
                      </div>
                      <div className="text-right space-y-0.5">
                        <span className="text-xs font-black text-[#23201C]">سفارش #{ord.orderId} • {ord.designTitle}</span>
                        <span className="text-[10px] text-[#7E7667] block font-bold">خیاط: {ord.tailorName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* کارت تبدیل امتیاز باشگاه */}
            <div className="khaliji-card-glass rounded-3xl p-4 border border-[#EADFC7] shadow-sm flex items-center justify-between">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#FCF6BA] p-0.5 flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-[#FAF6ED] rounded-full flex items-center justify-center text-2xl text-[#D4AF37]">⭐</div>
              </div>
              <div className="flex-1 pr-3 text-right space-y-1">
                <h2 className="text-xs font-black text-[#23201C]"><AnimatedNumber value={walletData.clubPoints || 0} /> امتیاز باشگاه کَندوره</h2>
                <p className="text-[10px] text-[#7E7667]">معادل {(((walletData.clubPoints || 0) / 10) * 1000).toLocaleString('fa-IR')} تومان اعتبار دوخت</p>
                <button
                  onClick={handleConvertPoints}
                  disabled={!walletData.clubPoints || walletData.clubPoints === 0}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38F24] text-white text-[10px] font-black shadow-sm flex items-center gap-1 disabled:opacity-50 active:scale-95 transition-transform"
                >
                  <span>تبدیل به موجودی</span>
                  <Sparkles className="w-3 h-3" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};