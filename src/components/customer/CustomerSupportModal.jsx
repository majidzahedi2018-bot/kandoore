// src/components/customer/CustomerSupportModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronRight, ChevronLeft, Plus, Send, Paperclip,
  Clock, Lock, CheckCircle2, MessageSquare, X, Image,
  Calendar, SlidersHorizontal, RefreshCw
} from 'lucide-react';
import { supportApi, uploadImage } from '../../api/api';
import { openImageViewer } from '../common/ImageViewerModal';
import { useToast } from '../common/ToastSystem';

// تبدیل تاریخ میلادی دیتابیس به تاریخ شمسی اصیل
const formatPersianDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const cleanStr = String(dateStr).split(' - ')[0].replace(/-/g, '/');
    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  } catch (e) {
    return dateStr;
  }
};

export const CustomerSupportModal = ({ isOpen, onClose, currentUser }) => {
  const { toast } = useToast();

  const [view, setView] = useState('list'); // 'list' | 'thread'
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'open' | 'answered' | 'closed'

  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);

  // ثبت تیکت جدید
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newAttachedFile, setNewAttachedFile] = useState(null);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // ارسال پیام در چت تیکت
  const [chatReply, setChatReply] = useState('');
  const [replyAttachedFile, setReplyAttachedFile] = useState(null);
  const [isSendingReply, setIsSendingReply] = useState(false);

  const fileInputRef = useRef(null);
  const newFileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // دریافت لیست تیکت‌ها
  const fetchTickets = async () => {
    if (!currentUser?.id) return;
    setLoadingTickets(true);
    try {
      const res = await supportApi.getUserTickets(currentUser.id);
      if (res.success && res.tickets) {
        setTickets(res.tickets);
      }
    } catch (e) {
      console.error('Error fetching tickets:', e);
    } finally {
      setLoadingTickets(false);
    }
  };

  // باز کردن چت تیکت
  const openTicketThread = async (ticket) => {
    setSelectedTicket(ticket);
    setView('thread');
    setLoadingThread(true);
    try {
      const res = await supportApi.getTicketThread(ticket.id);
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
    if (isOpen) {
      setView('list');
      fetchTickets();
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  if (!isOpen) return null;

  // فیلتر تیکت‌ها
  const filteredTickets = tickets.filter(t => {
    if (activeFilter === 'open') return t.status === 'open';
    if (activeFilter === 'answered') return t.status === 'answered';
    if (activeFilter === 'closed') return t.status === 'closed';
    return true;
  });

  // ارسال تیکت جدید
  const handleCreateNewTicket = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim() || isSubmittingNew) return;

    setIsSubmittingNew(true);
    try {
      let attachmentUrl = null;
      if (newAttachedFile) {
        const upRes = await uploadImage(newAttachedFile, 'tickets', currentUser?.id || 1);
        if (upRes.success && upRes.url) attachmentUrl = upRes.url;
      }

      const res = await supportApi.createTicket({
        user_id: currentUser?.id || 1,
        sender_name: currentUser?.name || 'کاربر کَندوره',
        sender_role: currentUser?.role || 'customer',
        subject: newSubject.trim(),
        message: newMessage.trim(),
        attachment_url: attachmentUrl
      });

      if (res.success) {
        toast.success('تیکت شما با موفقیت ثبت شد ✨');
        setNewSubject('');
        setNewMessage('');
        setNewAttachedFile(null);
        setShowNewModal(false);
        fetchTickets();
      } else {
        toast.error(res.message || 'خطا در ثبت تیکت');
      }
    } catch (e) {
      toast.error('خطا در برقراری ارتباط');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // ارسال پیام در چت تیکت
  const handleSendReply = async (e) => {
    e.preventDefault();
    if ((!chatReply.trim() && !replyAttachedFile) || isSendingReply || !selectedTicket) return;

    setIsSendingReply(true);
    try {
      let attachmentUrl = null;
      if (replyAttachedFile) {
        const upRes = await uploadImage(replyAttachedFile, 'tickets', currentUser?.id || 1);
        if (upRes.success && upRes.url) attachmentUrl = upRes.url;
      }

      const res = await supportApi.sendMessage({
        ticket_id: selectedTicket.id,
        user_id: currentUser?.id || 1,
        sender_role: currentUser?.role || 'customer',
        sender_name: currentUser?.name || 'کاربر',
        message: chatReply.trim(),
        attachment_url: attachmentUrl
      });

      if (res.success) {
        setChatReply('');
        setReplyAttachedFile(null);
        const refreshRes = await supportApi.getTicketThread(selectedTicket.id);
        if (refreshRes.success) setThreadMessages(refreshRes.messages || []);
      }
    } catch (e) {
      toast.error('خطا در ارسال پیام');
    } finally {
      setIsSendingReply(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F8F5EE] flex flex-col justify-between p-0 select-none overflow-hidden max-w-md mx-auto shadow-2xl border-x border-[#EADFC7]">

      {/* =========================================================================
          نمای اول: لیست تیکت‌ها (مطابق دقیق تصویر ماکت اول)
          ========================================================================= */}
      {view === 'list' && (
        <>
          {/* هدر بالای صفحه همراه با بنر هنری ساحل هرمزگان، لنج و بادگیر */}
          <div className="relative bg-gradient-to-b from-[#FFFDF8] via-[#FAF3E5] to-[#F8F5EE] border-b border-[#EADFC7] p-4 text-center shrink-0 overflow-hidden">
            
            {/* دکمه خروج شیشه‌ای */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/95 border border-[#EADFC7] shadow-sm flex items-center justify-center text-[#23201C] active:scale-90 z-20"
            >
              <X className="w-5 h-5" />
            </button>

            {/* نشان زرین و نام کَندوره */}
            <div className="flex items-center justify-center gap-2 pt-0.5">
              <span className="text-[#D4AF37] text-xs">❖</span>
              <span className="text-2xl font-black text-[#23201C] tracking-wide">گَـندوره</span>
              <span className="text-[#D4AF37] text-xs">❖</span>
            </div>

            {/* اثر هنری پانورامای ساحل تاریخی هرمزگان با لنج و بادگیر زرین */}
            <div className="my-3 mx-auto w-full h-28 rounded-3xl overflow-hidden relative border-2 border-[#D4AF37]/50 shadow-md bg-gradient-to-r from-[#0C352B] via-[#0E493B] to-[#06241D] flex items-center justify-between px-5 text-white">
              <div className="text-right space-y-1 z-10">
                <span className="text-[10px] font-bold text-[#FFF2BA] block tracking-wide">مرکز پاسخگویی ۲۴ ساعته</span>
                <h2 className="text-sm font-black text-white drop-shadow-md">همراه اصالت و کیفیت سفارش شما</h2>
                <span className="text-[9px] text-white/80 block">پاسخگویی سریع کارشناسان پشتیبانی</span>
              </div>

              {/* وکتور زرین بادبانی لنج سنتی جنوب */}
              <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center shrink-0 shadow-inner z-10">
                <svg viewBox="0 0 24 24" width="30" height="30" stroke="#FBF5B7" strokeWidth="1.5" fill="none">
                  <path d="M2 19C7 21 17 21 22 19L20 15H4L2 19Z" fill="#D4AF37" fillOpacity="0.4" />
                  <path d="M12 3V15" strokeLinecap="round" />
                  <path d="M12 5L18 14H12" fill="#D4AF37" fillOpacity="0.25" />
                  <path d="M12 7L7 13H12" fill="#D4AF37" fillOpacity="0.25" />
                </svg>
              </div>

              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />
            </div>

            {/* تیتر و توضیحات بخش */}
            <div className="space-y-0.5 text-center">
              <h1 className="text-sm font-black text-[#23201C]">مرکز پشتیبانی و تیکت‌ها</h1>
              <p className="text-[11px] text-[#7E7667] font-bold">سوالات، مشکلات و درخواست‌های خود را با ما در میان بگذارید.</p>
            </div>

            {/* نوار فیلترهای کپسولی افقی با آیکون و شمارنده */}
            <div className="flex items-center justify-between gap-1.5 pt-3 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveFilter('all')}
                className={`flex-1 py-2 px-2.5 rounded-2xl text-[11px] font-black transition-all flex items-center justify-center gap-1 shrink-0 ${
                  activeFilter === 'all'
                    ? 'bg-[#0E8388] text-white shadow-md'
                    : 'bg-white/90 border border-[#EADFC7] text-[#7E7667]'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>همه ({tickets.length})</span>
              </button>

              <button
                onClick={() => setActiveFilter('open')}
                className={`flex-1 py-2 px-2 rounded-2xl text-[10px] font-black transition-all flex items-center justify-center gap-1 shrink-0 ${
                  activeFilter === 'open'
                    ? 'bg-[#0E8388] text-white shadow-md'
                    : 'bg-white/90 border border-[#EADFC7] text-[#7E7667]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>در انتظار</span>
              </button>

              <button
                onClick={() => setActiveFilter('answered')}
                className={`flex-1 py-2 px-2 rounded-2xl text-[10px] font-black transition-all flex items-center justify-center gap-1 shrink-0 ${
                  activeFilter === 'answered'
                    ? 'bg-[#0E8388] text-white shadow-md'
                    : 'bg-white/90 border border-[#EADFC7] text-[#7E7667]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>پاسخ داده شده</span>
              </button>

              <button
                onClick={() => setActiveFilter('closed')}
                className={`flex-1 py-2 px-2 rounded-2xl text-[10px] font-black transition-all flex items-center justify-center gap-1 shrink-0 ${
                  activeFilter === 'closed'
                    ? 'bg-[#0E8388] text-white shadow-md'
                    : 'bg-white/90 border border-[#EADFC7] text-[#7E7667]'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>بسته شده</span>
              </button>
            </div>
          </div>

          {/* لیست کارت‌های تیکت (عاجی زرین، با فونت‌های چشم‌نواز و تاریخ شمسی) */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 pb-28">
            {loadingTickets ? (
              <div className="text-center py-16 space-y-2">
                <RefreshCw className="w-6 h-6 text-[#D4AF37] animate-spin mx-auto" />
                <p className="text-xs font-black text-[#7E7667]">در حال دریافت تیکت‌ها...</p>
              </div>
            ) : filteredTickets.length > 0 ? (
              filteredTickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => openTicketThread(t)}
                  className="rounded-[2rem] p-4 bg-gradient-to-b from-[#FFFFFF] to-[#FDFBF7] border-[1.5px] border-[#D4AF37]/50 shadow-[0_8px_25px_rgba(184,134,11,0.07)] hover:border-[#D4AF37] transition-all cursor-pointer text-right relative overflow-hidden active:scale-[0.99]"
                >
                  {/* ردیف اول: بج پرنور وضعیت و شناسه تیکت */}
                  <div className="flex items-center justify-between border-b border-[#F6EFE0] pb-2.5">
                    <span className="px-3 py-1 rounded-full bg-[#FAF5EB] border border-[#D4AF37]/45 text-[10px] font-mono font-black text-[#7E7667]">
                      {t.ticketCode || `#TCK-${t.id}`}
                    </span>

                    <span className={`px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-2xs ${
                      t.status === 'answered'
                        ? 'bg-emerald-500 text-white'
                        : t.status === 'closed'
                        ? 'bg-slate-500 text-white'
                        : 'bg-[#0E8388] text-white'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span>{t.status === 'answered' ? 'پاسخ داده شده' : t.status === 'closed' ? 'بسته شده' : 'در انتظار پاسخ'}</span>
                    </span>
                  </div>

                  {/* موضوع و خلاصه پیام */}
                  <div className="py-2.5 space-y-1">
                    <h3 className="text-xs font-black text-[#23201C]">{t.subject}</h3>
                    <p className="text-[11px] text-[#7E7667] font-bold line-clamp-1 leading-relaxed">
                      {t.lastMessage || t.message}
                    </p>
                  </div>

                  {/* ردیف پایین: تاریخ شمسی + تعداد پیام‌ها + فلش زرین */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-[#F6EFE0] text-[10px] text-[#7E7667] font-bold">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[#23201C]">
                        <Calendar className="w-3.5 h-3.5 text-[#B38F24]" />
                        <span>{formatPersianDate(t.date)}</span>
                      </span>

                      <span className="flex items-center gap-1 text-[#0E8388] font-black">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{t.messagesCount} پیام</span>
                      </span>
                    </div>

                    <div className="w-7 h-7 rounded-full bg-[#FAF5EC] border border-[#EADFC7] flex items-center justify-center text-[#B38F24]">
                      <ChevronLeft className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-14 space-y-2 bg-white/80 rounded-3xl border border-[#EADFC7] p-6">
                <span className="text-3xl block">🎧</span>
                <h4 className="text-xs font-black text-[#23201C]">هیچ تیکتی در این بخش ثبت نشده است</h4>
              </div>
            )}
          </div>

          {/* دکمه شناور طلایی ثبت تیکت جدید (دقیقاً مطابق طرح عکس اول) */}
          <div className="fixed bottom-5 inset-x-0 max-w-md mx-auto px-4 z-20 flex justify-center pointer-events-none">
            <button
              onClick={() => setShowNewModal(true)}
              className="pointer-events-auto px-8 py-3.5 rounded-full text-white font-black text-xs shadow-xl flex items-center gap-2 active:scale-95 transition-transform"
              style={{
                background: 'linear-gradient(135deg, #E5C158 0%, #D4AF37 50%, #AA771C 100%)',
                boxShadow: '0 10px 25px rgba(212, 175, 55, 0.45)'
              }}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>تیکت جدید</span>
            </button>
          </div>
        </>
      )}

      {/* =========================================================================
          نمای دوم: صفحه گفتگوی تعاملی تیکت (Chat Thread View)
          ========================================================================= */}
      {view === 'thread' && selectedTicket && (
        <div className="flex flex-col h-full justify-between">
          
          {/* هدر چت */}
          <div className="p-3.5 bg-white/95 backdrop-blur-md border-b border-[#EADFC7] flex items-center justify-between shrink-0 shadow-sm">
            <button
              onClick={() => { setView('list'); fetchTickets(); }}
              className="w-9 h-9 rounded-full bg-[#FAF6ED] border border-[#EADFC7] flex items-center justify-center text-[#23201C] active:scale-90"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="text-center space-y-0.5">
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-xs font-mono font-black text-[#7E7667]">{selectedTicket.ticketCode}</span>
                <span className="text-[#D4AF37]">❖</span>
              </div>
              <h2 className="text-xs font-black text-[#23201C]">{selectedTicket.subject}</h2>
              <div className="flex items-center justify-center gap-2 pt-0.5 text-[9px] text-[#7E7667]">
                <span className={`px-2 py-0.2 rounded-full font-black ${
                  selectedTicket.status === 'answered' ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800'
                }`}>
                  {selectedTicket.status === 'answered' ? 'پاسخ داده شده' : 'در انتظار پاسخ'}
                </span>
                <span>{formatPersianDate(selectedTicket.date)}</span>
              </div>
            </div>

            <div className="w-9" />
          </div>

          {/* حباب‌های چت (کرم شنی و فیروزه‌ای ملایم با آواتار) */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 text-right">
            {loadingThread ? (
              <div className="text-center py-16 text-xs font-black text-[#7E7667]">در حال بارگذاری گفتگو...</div>
            ) : threadMessages.map((m) => {
              const isUser = m.senderRole !== 'admin';
              return (
                <div key={m.id} className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}>
                  
                  <span className="text-[9px] font-bold text-[#7E7667] px-2 mb-1">
                    {isUser ? 'شما' : (m.senderName || 'پشتیبانی کَندوره')}
                  </span>

                  <div
                    className={`max-w-[85%] rounded-3xl p-3.5 space-y-2 text-xs font-bold leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-b from-[#FAF3E7] to-[#F5ECE0] text-[#23201C] border border-[#EADFC7] rounded-tr-sm shadow-sm'
                        : 'bg-gradient-to-b from-[#EBF7F7] to-[#E2F3F3] text-[#0A3D3F] border border-[#0E8388]/30 rounded-tl-sm shadow-sm'
                    }`}
                  >
                    {m.attachmentUrl && (
                      <div
                        onClick={() => openImageViewer(m.attachmentUrl, 'تصویر پیوست تیکت')}
                        className="rounded-2xl overflow-hidden border border-black/10 cursor-zoom-in max-h-48 shadow-sm"
                      >
                        <img src={m.attachmentUrl} alt="پیوست" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {m.message && <p className="whitespace-pre-wrap">{m.message}</p>}

                    <div className="flex items-center justify-end gap-1 text-[9px] text-[#7E7667]">
                      <span>{m.time}</span>
                      {isUser && <span className="text-[#0E8388]">✓✓</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* کادر پایین ارسال پیام و پیوست تصویر */}
          {selectedTicket.status !== 'closed' ? (
            <form onSubmit={handleSendReply} className="p-3 bg-white/95 backdrop-blur-md border-t border-[#EADFC7] flex items-center gap-2 shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) setReplyAttachedFile(e.target.files[0]); }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  replyAttachedFile ? 'bg-emerald-100 text-emerald-700' : 'bg-[#FAF6ED] text-[#7E7667]'
                }`}
                title="پیوست عکس"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={chatReply}
                  onChange={(e) => setChatReply(e.target.value)}
                  placeholder={replyAttachedFile ? `عکس «${replyAttachedFile.name.slice(0, 15)}...» انتخاب شد` : 'پیام خود را بنویسید...'}
                  className="w-full py-2.5 px-4 rounded-full bg-[#FAF6ED] border border-[#EADFC7] text-xs font-bold text-[#23201C] focus:outline-none text-right"
                />
                {replyAttachedFile && (
                  <button type="button" onClick={() => setReplyAttachedFile(null)} className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 text-xs">
                    ✕
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSendingReply || (!chatReply.trim() && !replyAttachedFile)}
                className="w-10 h-10 rounded-full bg-[#0E8388] text-white flex items-center justify-center shadow-md active:scale-90 disabled:opacity-50 transition-all"
              >
                {isSendingReply ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 -rotate-90" />}
              </button>
            </form>
          ) : (
            <div className="p-3 bg-slate-100 text-slate-600 text-center text-xs font-bold border-t">
              این تیکت بسته شده است.
            </div>
          )}

        </div>
      )}

      {/* مودال ثبت تیکت جدید */}
      {showNewModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0">
          <div className="bg-[#F8F5EE] w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-5 space-y-4 border border-[#EADFC7] shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between border-b border-[#EADFC7] pb-3">
              <button onClick={() => setShowNewModal(false)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#23201C]">
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-sm font-black text-[#23201C]">ثبت تیکت پشتیبانی جدید</h3>
            </div>

            <form onSubmit={handleCreateNewTicket} className="space-y-3 text-right">
              <div>
                <label className="text-[10px] font-black text-[#7E7667] block mb-1">موضوع تیکت:</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="مثال: مشکل در پرداخت، راهنمای اندازه..."
                  className="w-full p-3 rounded-2xl bg-white border border-[#EADFC7] text-xs font-bold text-[#23201C] focus:outline-none text-right"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-[#7E7667] block mb-1">متن پیام:</label>
                <textarea
                  rows={4}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="شرح کامل درخواست یا مشکل خود را بنویسید..."
                  className="w-full p-3 rounded-2xl bg-white border border-[#EADFC7] text-xs font-bold text-[#23201C] focus:outline-none text-right resize-none leading-relaxed"
                />
              </div>

              <div>
                <input
                  ref={newFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) setNewAttachedFile(e.target.files[0]); }}
                />
                <button
                  type="button"
                  onClick={() => newFileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-2xl bg-[#FAF6ED] border border-dashed border-[#D4AF37] text-xs font-black text-[#B38F24] flex items-center justify-center gap-2"
                >
                  <Image className="w-4 h-4" />
                  <span>{newAttachedFile ? `عکس «${newAttachedFile.name.slice(0, 20)}» پیوست شد` : 'پیوست تصویر به تیکت (اختیاری)'}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmittingNew}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white text-xs font-black shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
              >
                {isSubmittingNew ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 -rotate-90" />}
                <span>ارسال تیکت پشتیبانی</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};