// src/components/admin/tabs/AdminOnlineTab.jsx
import React, { useState, useEffect } from 'react';
import { Radio, Shirt, ShoppingBag, Wifi, Clock, RefreshCw } from 'lucide-react';
import { adminApi } from '../../../api/api';

const faTime = (iso) => iso ? new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tehran' }) : '';

export const AdminOnlineTab = ({ onRefresh }) => {
  const [presence, setPresence] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const load = async () => {
    try {
      const [pRes, tRes, cRes] = await Promise.all([
        adminApi.getPresenceMap(),
        adminApi.getAllTailors(),
        adminApi.getAllCustomers(),
      ]);
      if (pRes?.success) setPresence(pRes.presence || {});
      const tailors = (tRes?.tailors || []).map(t => ({ userId: t.userId, name: t.name, role: 'tailor', sub: t.city || 'بندرعباس', avatar: t.avatar }));
      const customers = (cRes?.customers || []).map(c => ({ userId: c.id, name: c.name, role: 'customer', sub: c.city || 'بندرعباس', avatar: null }));
      setUsers([...tailors, ...customers]);
      setLastUpdate(new Date());
    } catch (e) { console.error('online load', e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); const iv = setInterval(load, 20000); return () => clearInterval(iv); }, []);

  const online = users.filter(u => presence[u.userId]?.online);
  const onlineTailors = online.filter(u => u.role === 'tailor');
  const onlineCustomers = online.filter(u => u.role === 'customer');

  const Card = ({ u }) => (
    <div className="khaliji-card-glass rounded-2xl p-3.5 border border-[#EADFC7] flex items-center gap-3">
      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#AA771C] p-0.5 shrink-0">
        <div className="w-full h-full rounded-full bg-[#FAF6ED] flex items-center justify-center text-lg border border-white overflow-hidden">
          {u.avatar && String(u.avatar).startsWith('http') ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : (u.role === 'tailor' ? '🧵' : '🧕')}
        </div>
      </div>
      <div className="flex-1 min-w-0 text-right">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black text-[#23201C] truncate">{u.name}</span>
          {u.role === 'tailor' ? <Shirt className="w-3.5 h-3.5 text-[#0E8388]" /> : <ShoppingBag className="w-3.5 h-3.5 text-[#B38F24]" />}
        </div>
        <span className="text-[10px] text-[#7E7667] font-bold block truncate">{u.sub}</span>
      </div>
      <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black border border-emerald-200 shrink-0">
        <Wifi className="w-3 h-3" /> آنلاین
      </span>
    </div>
  );

  return (
    <div className="space-y-5 text-right select-none">
      <div className="khaliji-card-glass rounded-[2.2rem] p-4 sm:p-5 border-2 border-[#EADFC7] shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-[#0E8388]" />
          <h2 className="text-base font-black text-[#23201C]">کاربران آنلاین</h2>
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200">{online.length} آنلاین</span>
        </div>
        <button onClick={load} className="w-10 h-10 rounded-2xl bg-white border border-[#EADFC7] flex items-center justify-center text-[#B38F24] active:scale-90">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-3">
          <h3 className="text-sm font-black text-[#0E8388] flex items-center gap-1"><Shirt className="w-4 h-4" /> خیاطان آنلاین ({onlineTailors.length})</h3>
          {onlineTailors.length ? onlineTailors.map(u => <Card key={u.userId} u={u} />) : <div className="khaliji-card-glass rounded-2xl p-6 text-center text-xs text-[#7E7667]">خیاط آنلاینی نیست.</div>}
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-black text-[#B38F24] flex items-center gap-1"><ShoppingBag className="w-4 h-4" /> مشتریان آنلاین ({onlineCustomers.length})</h3>
          {onlineCustomers.length ? onlineCustomers.map(u => <Card key={u.userId} u={u} />) : <div className="khaliji-card-glass rounded-2xl p-6 text-center text-xs text-[#7E7667]">مشتری آنلاینی نیست.</div>}
        </div>
      </div>
    </div>
  );
};