// src/components/admin/AdminUserActivityModal.jsx
import React, { useEffect, useState } from 'react';
import { X, LogIn, LogOut, Activity } from 'lucide-react';
import { adminApi } from '../../api/api';

const fmt = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(d);
  const time = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tehran' }).format(d);
  return `${date} • ${time}`;
};

export const AdminUserActivityModal = ({ isOpen, onClose, userId, userName, onSeen }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!isOpen || !userId) return;
    setLoading(true);
    adminApi.getUserActivity(userId)
      .then(res => {
        if (res?.success) {
          setItems(res.activities || []);
          if (onSeen) onSeen(userId, res.activities?.[0]?.id || 0);
        }
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [isOpen, userId]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[2rem] p-5 border border-[#EADFC7] shadow-2xl space-y-4 text-right max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-[#F8F5EE] pb-2 shrink-0">
          <span className="text-xs font-black text-[#23201C] flex items-center gap-1"><Activity className="w-4 h-4 text-[#0E8388]" /> تحلیل ورود/خروج: {userName}</span>
          <button onClick={onClose} className="text-xs text-[#7E7667]">✕</button>
        </div>
        <div className="overflow-y-auto no-scrollbar space-y-2 pr-1">
          {loading ? <p className="text-[11px] text-[#7E7667] text-center py-6">در حال بارگذاری...</p>
          : items.length === 0 ? <p className="text-[11px] text-[#7E7667] text-center py-6">فعالیتی ثبت نشده است.</p>
          : items.map(a => (
            <div key={a.id} className="flex items-center justify-between bg-[#FAF6ED] border border-[#EADFC7] rounded-2xl p-2.5">
              <span className={`flex items-center gap-1.5 text-[11px] font-black ${a.event_type === 'login' ? 'text-emerald-700' : a.event_type === 'logout' ? 'text-red-600' : 'text-[#B38F24]'}`}>
                {a.event_type === 'login' ? <LogIn className="w-3.5 h-3.5" /> : a.event_type === 'logout' ? <LogOut className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                <span>{a.event_type === 'login' ? 'ورود' : a.event_type === 'logout' ? 'خروج' : a.event_type}</span>
              </span>
              <span className="text-[10px] text-[#7E7667] font-bold">{fmt(a.created_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};