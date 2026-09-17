// src/components/admin/tabs/AdminSupportTab.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Search, MessageSquare, CheckCircle2, Clock, Lock, Send,
  Paperclip, Phone, User, ExternalLink, RefreshCw, X, Image
} from 'lucide-react';
import { supportApi, uploadImage, adminApi } from '../../../api/api';
import { openImageViewer } from '../../common/ImageViewerModal';
import { useToast } from '../../common/ToastSystem';

export const AdminSupportTab = ({ onRefresh }) => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'open' | 'answered' | 'closed'

  // تیکت انتخاب شده برای نمایش در پنل چت سمت چپ
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);

  // پاسخ ادمین
  const [replyText, setReplyText] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // لود تمام تیکت‌های پشتیبانی
  const fetchAllTickets = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSupportTickets();
      if (res.success && res.tickets) {
        setTickets(res.tickets);
        // انتخاب اولین تیکت به صورت پیش‌فرض
        if (!selectedTicket && res.tickets.length > 0) {
          loadTicketThread(res.tickets[0].id);
        }
      }
    } catch (e) {
      console.error('Error fetching admin tickets:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketThread = async (ticketId) => {
    setLoadingThread(true);
    try {
      const res = await supportApi.getTicketThread(ticketId);
      if (res.success) {
        setSelectedTicket(res.ticket);
        setThreadMessages(res.messages || []);
      }
    } catch (e) {
      toast.error('خطا در بارگذاری گفتگو');
    } finally {
      setLoadingThread(false);
    }
  };

  useEffect(() => {
    fetchAllTickets();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  // ارسال پاسخ ادمین
  const handleSendAdminReply = async (e) => {
    e?.preventDefault();
    if ((!replyText.trim() && !attachedFile) || isSending || !selectedTicket) return;

    setIsSending(true);
    try {
      let attachmentUrl = null;
      if (attachedFile) {
        const upRes = await uploadImage(attachedFile, 'tickets', 9);
        if (upRes.success && upRes.url) attachmentUrl = upRes.url;
      }

      const res = await supportApi.sendMessage({
        ticket_id: selectedTicket.id,
        user_id: 9, // شناسه کاربری ادمین
        sender_role: 'admin',
        sender_name: 'مدیریت کَندوره',
        message: replyText.trim(),
        attachment_url: attachmentUrl
      });

      if (res.success) {
        setReplyText('');
        setAttachedFile(null);
        toast.success('پاسخ برای کاربر ارسال شد ✓');
        // تازه‌سازی چت
        loadTicketThread(selectedTicket.id);
        fetchAllTickets();
      } else {
        toast.error(res.message || 'خطا در ارسال پاسخ');
      }
    } catch (e) {
      toast.error('خطا در ارسال پاسخ');
    } finally {
      setIsSending(false);
    }
  };

  // بستن تیکت توسط ادمین
  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    try {
      const adminUser = JSON.parse(localStorage.getItem('kandooreh_admin_user') || '{}');
const res = await supportApi.closeTicket(selectedTicket.id, adminUser.id || 9);
      if (res.success) {
        toast.success('تیکت بسته شد.');
        loadTicketThread(selectedTicket.id);
        fetchAllTickets();
      }
    } catch (e) {
      toast.error('خطا در تغییر وضعیت تیکت');
    }
  };

  // فیلتر و جستجو
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = (t.subject || '').includes(searchQuery) ||
                          (t.userName || '').includes(searchQuery) ||
                          (t.userPhone || '').includes(searchQuery) ||
                          String(t.id).includes(searchQuery);
    if (!matchesSearch) return false;
    if (statusFilter === 'open') return t.status === 'open';
    if (statusFilter === 'answered') return t.status === 'answered';
    if (statusFilter === 'closed') return t.status === 'closed';
    return true;
  });

  // شمارنده‌ها
  const countOpen = tickets.filter(t => t.status === 'open').length;
  const countAnswered = tickets.filter(t => t.status === 'answered').length;
  const countClosed = tickets.filter(t => t.status === 'closed').length;

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-start select-none" dir="rtl">
      
      {/* =========================================================================
          پنل سمت راست: لیست تیکت‌ها با فیلتر و سرچ (۵ ستون از ۱۲ ستون)
          ========================================================================= */}
      <div className="lg:col-span-5 khaliji-card-glass rounded-3xl p-4 border border-[#EADFC7] shadow-sm space-y-3.5">
        
        {/* نوار سرچ */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در تیکت‌ها، نام کاربر..."
            className="w-full py-2.5 pr-10 pl-4 rounded-2xl bg-white border border-[#EADFC7] text-xs font-bold text-[#23201C] focus:outline-none text-right"
          />
          <Search className="w-4 h-4 text-[#7E7667] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* پیل‌های فیلتر وضعیت */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`py-1.5 px-3 rounded-xl text-[11px] font-black transition-all flex items-center gap-1 shrink-0 ${
              statusFilter === 'all' ? 'bg-[#0E8388] text-white shadow-sm' : 'bg-white text-[#7E7667] border border-[#EADFC7]'
            }`}
          >
            <span>همه</span>
            <span className="text-[10px] font-mono">({tickets.length})</span>
          </button>

          <button
            onClick={() => setStatusFilter('open')}
            className={`py-1.5 px-2.5 rounded-xl text-[11px] font-black transition-all flex items-center gap-1 shrink-0 ${
              statusFilter === 'open' ? 'bg-[#0E8388] text-white shadow-sm' : 'bg-white text-[#7E7667] border border-[#EADFC7]'
            }`}
          >
            <span>در انتظار</span>
            <span className="text-[10px] font-mono">({countOpen})</span>
          </button>

          <button
            onClick={() => setStatusFilter('answered')}
            className={`py-1.5 px-2.5 rounded-xl text-[11px] font-black transition-all flex items-center gap-1 shrink-0 ${
              statusFilter === 'answered' ? 'bg-[#0E8388] text-white shadow-sm' : 'bg-white text-[#7E7667] border border-[#EADFC7]'
            }`}
          >
            <span>پاسخ داده شده</span>
            <span className="text-[10px] font-mono">({countAnswered})</span>
          </button>

          <button
            onClick={() => setStatusFilter('closed')}
            className={`py-1.5 px-2.5 rounded-xl text-[11px] font-black transition-all flex items-center gap-1 shrink-0 ${
              statusFilter === 'closed' ? 'bg-[#0E8388] text-white shadow-sm' : 'bg-white text-[#7E7667] border border-[#EADFC7]'
            }`}
          >
            <span>بسته شده</span>
            <span className="text-[10px] font-mono">({countClosed})</span>
          </button>
        </div>

        {/* لیست آیتم‌های تیکت */}
        <div className="space-y-2.5 max-h-[600px] overflow-y-auto no-scrollbar pr-1">
          {loading ? (
            <div className="text-center py-12 text-xs font-black text-[#7E7667]">در حال بارگذاری...</div>
          ) : filteredTickets.length > 0 ? (
            filteredTickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => loadTicketThread(t.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-right space-y-2 ${
                    isSelected
                      ? 'bg-white border-2 border-[#D4AF37] shadow-md scale-[1.01]'
                      : 'bg-white/80 border-[#EADFC7] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-black text-[#7E7667]">
                      #TCK-{t.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                      t.status === 'answered'
                        ? 'bg-emerald-50 text-emerald-800'
                        : t.status === 'closed'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-amber-50 text-amber-800'
                    }`}>
                      {t.status === 'answered' ? 'پاسخ داده شده' : t.status === 'closed' ? 'بسته شده' : 'در انتظار پاسخ'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#FAF6ED] border border-[#EADFC7] flex items-center justify-center text-xs shrink-0 overflow-hidden">
                      {t.userAvatar ? <img src={t.userAvatar} alt="" className="w-full h-full object-cover" /> : '👤'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[#23201C] truncate">{t.userName || 'کاربر'}</span>
                        <span className="text-[9px] text-[#0E8388] font-bold">{t.userRole === 'tailor' ? 'خیاط' : 'مشتری'}</span>
                      </div>
                      <h4 className="text-[11px] font-bold text-[#524B40] truncate mt-0.5">{t.subject}</h4>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-xs font-black text-[#7E7667]">تیکتی یافت نشد.</div>
          )}
        </div>

      </div>

      {/* =========================================================================
          پنل سمت چپ: صفحه چت تیکت و اطلاعات کاربر (۷ ستون از ۱۲ ستون)
          ========================================================================= */}
      <div className="lg:col-span-7 khaliji-card-glass rounded-3xl p-5 border border-[#EADFC7] shadow-sm flex flex-col h-[680px] justify-between text-right">
        
        {selectedTicket ? (
          <>
            {/* هدر بالای چت: مشخصات کاربر، شماره سفارش و دکمه بستن */}
            <div className="border-b border-[#EADFC7] pb-3.5 space-y-2.5 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black text-[#7E7667]">#TCK-{selectedTicket.id}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    selectedTicket.status === 'answered'
                      ? 'bg-emerald-50 text-emerald-800'
                      : selectedTicket.status === 'closed'
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-amber-50 text-amber-800'
                  }`}>
                    {selectedTicket.status === 'answered' ? 'پاسخ داده شده' : selectedTicket.status === 'closed' ? 'بسته شده' : 'در انتظار پاسخ'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTicket.userPhone && (
                    <a
                      href={`tel:${selectedTicket.userPhone}`}
                      className="px-3 py-1 rounded-xl bg-white border border-[#EADFC7] text-[11px] font-black text-[#0E8388] flex items-center gap-1 hover:bg-emerald-50"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>تماس با کاربر</span>
                    </a>
                  )}
                  {selectedTicket.status !== 'closed' && (
                    <button
                      onClick={handleCloseTicket}
                      className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black flex items-center gap-1"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>بستن تیکت</span>
                    </button>
                  )}
                </div>
              </div>

              {/* کارت هویتی کاربر و موضوع */}
              <div className="bg-white/80 p-3 rounded-2xl border border-[#EADFC7] flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black text-[#23201C]">{selectedTicket.subject}</h3>
                  <p className="text-[11px] text-[#7E7667] font-bold">
                    {selectedTicket.userName} ({selectedTicket.userPhone}) • {selectedTicket.userRole === 'tailor' ? 'کارگاه خیاطی' : 'مشتری'}
                  </p>
                </div>
                {selectedTicket.orderId && (
                  <span className="px-2.5 py-1 rounded-xl bg-[#FAF6ED] border border-[#D4AF37]/40 text-[10px] font-mono font-black text-[#B38F24]">
                    سفارش #{selectedTicket.orderId}
                  </span>
                )}
              </div>
            </div>

            {/* بدنه چت پیام‌ها */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3">
              {loadingThread ? (
                <div className="text-center py-12 text-xs font-black text-[#7E7667]">در حال بارگذاری گفتگو...</div>
              ) : threadMessages.map((m) => {
                const isAdmin = m.senderRole === 'admin';
                return (
                  <div key={m.id} className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}>
                    <span className="text-[9px] font-bold text-[#7E7667] px-2 mb-1">
                      {isAdmin ? 'مدیریت کَندوره' : (m.senderName || 'کاربر')}
                    </span>
                    <div className={`max-w-[80%] rounded-3xl p-3.5 space-y-2 ${
                      isAdmin ? 'chat-bubble-support rounded-tr-sm' : 'chat-bubble-user rounded-tl-sm'
                    }`}>
                      {m.attachmentUrl && (
                        <div
                          onClick={() => openImageViewer(m.attachmentUrl, 'پیوست تیکت')}
                          className="rounded-2xl overflow-hidden border border-black/10 cursor-zoom-in max-h-48"
                        >
                          <img src={m.attachmentUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      {m.message && <p className="text-xs font-bold leading-relaxed text-[#23201C] whitespace-pre-wrap">{m.message}</p>}
                      <span className="text-[9px] text-[#7E7667] block text-left">{m.time}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* کادر ارسال پاسخ ادمین */}
            <form onSubmit={handleSendAdminReply} className="pt-3 border-t border-[#EADFC7] space-y-2 shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) setAttachedFile(e.target.files[0]); }}
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-colors ${
                    attachedFile ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-white border-[#EADFC7] text-[#7E7667]'
                  }`}
                  title="پیوست عکس"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={attachedFile ? `عکس «${attachedFile.name.slice(0, 20)}» انتخاب شد...` : 'پاسخ مدیریت را بنویسید...'}
                  className="flex-1 py-3 px-4 rounded-2xl bg-white border border-[#EADFC7] text-xs font-bold text-[#23201C] focus:outline-none text-right"
                />

                <button
                  type="submit"
                  disabled={isSending || (!replyText.trim() && !attachedFile)}
                  className="px-5 py-3 rounded-2xl bg-[#0E8388] text-white text-xs font-black shadow-md flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 -rotate-90" />}
                  <span>ارسال پاسخ</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="m-auto text-center py-20 text-xs font-black text-[#7E7667] space-y-2">
            <span className="text-4xl block">🎧</span>
            <p>یک تیکت را از لیست سمت راست انتخاب کنید تا گفتگوی آن نمایش داده شود.</p>
          </div>
        )}

      </div>

    </div>
  );
};