// src/components/common/OrderChatModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Phone, Pin, Send, Camera, X, Check, CheckCheck, Reply, Copy, Trash2, ZoomIn, ZoomOut, RotateCw, Download, Share2, Shirt } from 'lucide-react';
import { chatApi, uploadImage, storiesApi, designsApi } from '../../api/api';
import { PhotoPickerModal } from './PhotoPickerModal';
import { ImageCropModal } from './ImageCropModal';
import { useToast } from './ToastSystem';

const getPersianDateLabel = (ts) => {
if (!ts) return '';
const d = new Date(ts * 1000);
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
if (msgDay.getTime() === today.getTime()) return 'امروز';
if (msgDay.getTime() === yesterday.getTime()) return 'دیروز';
return d.toLocaleDateString('fa-IR');
};
const presenceLabel = (online, lastSeen) => {
if (online) return 'آنلاین';
if (!lastSeen) return '';
const d = new Date(lastSeen);
const diffMin = Math.floor((Date.now() - d) / 60000);
if (diffMin < 1) return 'همین الان آنلاین بود';
if (diffMin < 60) return `آخرین بازدید ${diffMin.toLocaleString('fa-IR')} دقیقه پیش`;
if (diffMin < 1440) return `آخرین بازدید ${Math.floor(diffMin / 60).toLocaleString('fa-IR')} ساعت پیش`;
return `آخرین بازدید ${d.toLocaleDateString('fa-IR')}`;
};

export const OrderChatModal = ({ isOpen, onClose, orderId = '', currentUser, orderDetails, preorder }) => {
const { toast } = useToast();
const [messages, setMessages] = useState([]);
const [inputText, setInputText] = useState('');
const [showPhotoPicker, setShowPhotoPicker] = useState(false);
const [isSending, setIsSending] = useState(false);
const [peerOnline, setPeerOnline] = useState(false);
const [peerLastSeen, setPeerLastSeen] = useState(null);
const [replyTo, setReplyTo] = useState(null);
const [menuFor, setMenuFor] = useState(null);
const [viewer, setViewer] = useState(null);
const [vScale, setVScale] = useState(1);
const [vRot, setVRot] = useState(0);
const [caption, setCaption] = useState(null);
const [showCrop, setShowCrop] = useState(false);
const messagesEndRef = useRef(null);
const lastKnownIdRef = useRef(0);
const isTailor = currentUser?.role === 'tailor';
// ─── حالت گفتگوی پیش از سفارش (قبل از ثبت سفارش بین مشتری و خیاط) ───
const preorderMode = Boolean(preorder);
const preorderThreadKey = preorderMode
  ? (preorder?.threadKey || chatApi.preorderThreadKey(preorder?.customerUserId, preorder?.tailorUserId))
  : '';
const activeThreadKey = preorderMode ? preorderThreadKey : orderId;
const activePeerId = preorderMode
? (isTailor ? (preorder?.customerUserId || 0) : (preorder?.tailorUserId || 0))
: (isTailor ? (orderDetails?.userId || orderDetails?.customerUserId || 0) : (orderDetails?.tailorUserId || 0));
const peerUserId = activePeerId;
const chatPartnerName = preorderMode
  ? (isTailor ? (preorder?.customerName || 'مشتری') : (preorder?.tailorName || 'خیاط'))
  : (isTailor ? (orderDetails?.customerName || 'مشتری') : (orderDetails?.tailorName || 'خیاط'));
const chatPartnerAvatar = preorderMode
  ? (isTailor ? (preorder?.customerAvatar || null) : (preorder?.tailorAvatar || null))
  : (isTailor ? (orderDetails?.customerAvatar || null) : (orderDetails?.tailorAvatar || null));
const peerPhone = preorderMode
  ? (isTailor ? preorder?.customerPhone : preorder?.tailorPhone)
  : orderDetails?.customerPhone;

const fetchMessages = async (isFirstLoad = false) => {
if (!activeThreadKey) return;
const afterId = isFirstLoad ? 0 : lastKnownIdRef.current;
const res = await chatApi.getMessages(activeThreadKey, afterId, peerUserId);
if (res.success && res.messages) {
if (isFirstLoad) {
setMessages(res.messages);
lastKnownIdRef.current = res.messages.length ? Math.max(...res.messages.map(m => m.id)) : 0;
} else if (res.messages.length) {
setMessages(prev => {
const ex = new Set(prev.map(m => m.id));
return [...prev, ...res.messages.filter(m => !ex.has(m.id))];
});
lastKnownIdRef.current = Math.max(lastKnownIdRef.current, ...res.messages.map(m => m.id));
}
setPeerOnline(Boolean(res.peerOnline));
setPeerLastSeen(res.peerLastSeen || null);
}
};
useEffect(() => {
if (!isOpen || !currentUser?.id) return;
fetchMessages(true);
chatApi.markRead(activeThreadKey, currentUser.id);
chatApi.heartbeat(currentUser.id);
    const p = setInterval(() => fetchMessages(false), 7000);
    const h = setInterval(() => {
      // ثبت حضور فقط وقتی تب/اپ در پیش‌زمینه است؛ وگرنه همان لحظه آفلاین می‌ماند
      if (document.visibilityState === 'visible') chatApi.heartbeat(currentUser.id, true);
    }, 60000);
    return () => { clearInterval(p); clearInterval(h); };
}, [isOpen, activeThreadKey, currentUser?.id, peerUserId]);
useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
if (!isOpen) return null;
// قطع امنیتی: بدون سفارش واقعی یا رشتهٔ پیش‌سفارش، چت باز نمی‌شود (جلوگیری از رشتهٔ شبح)
if (!activeThreadKey) return null;

const buildPayload = (message, imageUrl) => ({
order_id: activeThreadKey,
sender_id: currentUser?.id || 1,
sender_role: isTailor ? 'tailor' : 'customer',
message, image_url: imageUrl,
peer_id: peerUserId,
reply_to_id: replyTo?.id || null
});
const handleSendMessage = async (e) => {
e?.preventDefault();
if (!inputText.trim() || isSending) return;
const text = inputText.trim();
setInputText(''); setIsSending(true);
try {
  const res = await chatApi.sendMessage(buildPayload(text, null));
  if (res.success) {
    await fetchMessages(false);
    chatApi.heartbeat(currentUser.id);
    setReplyTo(null);
  } else {
    toast.error(res.message || 'خطا در ارسال پیام');
  }
} catch (err) {
  toast.error('خطا در برقراری ارتباط با سرور');
  setInputText(text);
} finally {
  setIsSending(false);
}
};
const handlePhotoSelected = (file) => setCaption({ file, preview: URL.createObjectURL(file), text: '' });
const handleSendCaption = async () => {
if (!caption || isSending) return;
setIsSending(true);
try {
  const up = await uploadImage(caption.file, 'chat', currentUser?.id || 1);
  if (up.success && up.url) {
    const res = await chatApi.sendMessage(buildPayload(caption.text.trim(), up.url));
    if (res.success) { await fetchMessages(false); setCaption(null); setReplyTo(null); }
    else toast.error('خطا در ارسال تصویر');
  } else toast.error('خطا در بارگذاری تصویر');
} catch (err) {
  toast.error('خطا در برقراری ارتباط با سرور');
} finally {
  setIsSending(false);
}
};
const handleDelete = async (msg, mode) => {
setMenuFor(null);
const res = await chatApi.deleteMessage(msg.id, mode, isTailor ? 'tailor' : 'customer', currentUser?.id || 0);
if (res.success) { toast.success(mode === 'all' ? 'پیام برای همه حذف شد.' : 'پیام برای شما حذف شد.'); await fetchMessages(true); }
else toast.error(res.message || 'خطا در حذف پیام');
};
const handleCopy = (msg) => { setMenuFor(null); if (msg.message) { navigator.clipboard?.writeText(msg.message); toast.success('متن پیام کپی شد.'); } };
const handleSendToStory = async (url) => {
if (!currentUser?.id) { toast.error('ابتدا وارد حساب شوید.'); return; }
const res = await storiesApi.create({ user_id: currentUser.id, name: currentUser?.name || 'کارگاه خیاطی', storyTitle: null, desc: null, image: url, iconEmoji: '🪡', bgGradient: 'bg-gradient-to-b from-[#1C150F] via-[#2A1F16] to-[#0A0705]' });
if (res.success) { toast.success('تصویر به استوری ارسال شد ✨'); setViewer(null); } else toast.error(res.message || 'خطا در ارسال استوری');
};
const handleAddToPortfolio = async (url) => {
if (!currentUser?.id) { toast.error('ابتدا وارد حساب شوید.'); return; }
const res = await designsApi.create({ user_id: currentUser.id, title: 'طرح جدید کارگاه', category: 'کندوره', tailor_name: currentUser?.name || 'خیاطی', city: 'بندرعباس',  price: 480000, delivery_days: '۳ تا ۵ روز', image_url: url, tags: '' });
if (res.success) { toast.success('تصویر به عنوان نمونه‌کار ثبت شد 👗'); setViewer(null); } else toast.error(res.message || 'خطا در ثبت نمونه‌کار');
};

const messagesWithSeparators = [];
let lastLabel = '';
messages.forEach(m => {
const l = getPersianDateLabel(m.ts);
if (l && l !== lastLabel) { messagesWithSeparators.push({ type: 'sep', label: l }); lastLabel = l; }
messagesWithSeparators.push({ type: 'msg', data: m });
});

return (
<div className="fixed inset-0 z-50 bg-[#F8F5EE] flex flex-col justify-between p-0 select-none overflow-hidden max-w-md mx-auto">
  {/* هدر */}
  <div className="p-3.5 bg-white/85 backdrop-blur-md border-b border-[#EADFC7] flex items-center justify-between z-10 shrink-0">
    <div className="flex items-center gap-1.5">
      <button onClick={onClose} className="w-9 h-9 rounded-full khaliji-card-glass flex items-center justify-center text-[#B38F24] border border-[#EADFC7] shadow-sm active:scale-90"><ChevronRight className="w-5 h-5" /></button>
      <a href={`tel:${peerPhone || '09171234567'}`} className="w-9 h-9 rounded-full khaliji-card-glass flex items-center justify-center text-[#B38F24] border border-[#EADFC7] shadow-sm"><Phone className="w-4 h-4" /></a>
    </div>
    <div className="flex items-center gap-2.5 text-right flex-1 px-2">
      <div className="space-y-0.5">
        <h2 className="text-xs font-black text-[#23201C]">{chatPartnerName}</h2>
        <div className="flex items-center gap-1 text-[10px] font-bold">
          <span className={`w-1.5 h-1.5 rounded-full ${peerOnline ? 'bg-emerald-500 animate-pulse' : 'bg-[#7E7667]'}`}></span>
          <span className={peerOnline ? 'text-emerald-700' : 'text-[#7E7667]'}>{peerOnline ? 'آنلاین' : presenceLabel(peerOnline, peerLastSeen) || 'گفت‌وگوی سفارش'}</span>
        </div>
      </div>
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#AA771C] p-0.5 shadow-md shrink-0">
        <div className="w-full h-full bg-[#FAF6ED] rounded-full flex items-center justify-center overflow-hidden border border-white">
          {chatPartnerAvatar ? <img src={chatPartnerAvatar} alt={chatPartnerName} className="w-full h-full object-cover" /> : <span className="text-lg">{isTailor ? '🧕' : '🧵'}</span>}
        </div>
      </div>
    </div>
    <div className="w-9"></div>
  </div>
  {/* نوار سفارش / گفتگوی پیش از سفارش */}
  <div className="px-4 pt-3 pb-1">
    <div className="khaliji-card-glass rounded-3xl p-3 border-2 border-[#D4AF37]/50 shadow-sm flex items-center justify-between">
      <Pin className="w-4 h-4 text-[#D4AF37] -rotate-45" />
      <div className="flex-1 px-3 text-right space-y-1">
        {preorderMode ? (
          <>
            <div className="flex items-center gap-1 text-xs font-black text-[#23201C]">
              <span>گفتگوی پیش از سفارش</span>
              <span className="text-[#B38F24]">•</span>
              <span>{isTailor ? (preorder?.customerName || 'مشتری') : (preorder?.tailorName || 'خیاط')}</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0E8388]/10 text-[#0E8388] text-[10px] font-black border border-[#0E8388]/25">
              <span>⚜️</span><span>قبل از ثبت سفارش — مشاوره آزادانه</span>
            </span>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1 text-xs font-black text-[#23201C]"><span>سفارش #{activeThreadKey} • {orderDetails?.designTitle || 'کندوره'}</span></div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#B38F24] text-[10px] font-black border border-[#D4AF37]/30"><span>⏳</span><span>{orderDetails?.statusText || 'در حال انجام'}</span></div>
          </>
        )}
      </div>
      <div className="w-14 h-16 rounded-2xl bg-gradient-to-br from-[#23201C] to-[#3D2D1E] flex items-center justify-center text-2xl border border-[#D4AF37] shadow-inner shrink-0">✨👗</div>
    </div>
  </div>
  {/* فید پیام‌ها */}
  <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
    {messagesWithSeparators.length === 0 && (
      <div className="flex items-center justify-center gap-2 my-4">
        <span className="h-[1px] w-8 bg-[#EADFC7]"></span>
        <span className="px-3 py-1 rounded-full bg-[#EADFC7]/60 text-[#7E7667] text-[10px] font-black border border-[#EADFC7]">هنوز پیامی در این سفارش نیست</span>
        <span className="h-[1px] w-8 bg-[#EADFC7]"></span>
      </div>
    )}
    {messagesWithSeparators.map((item, idx) => {
      if (item.type === 'sep') return (
        <div key={`s${idx}`} className="flex items-center justify-center gap-2 my-2">
          <span className="h-[1px] w-8 bg-[#EADFC7]"></span>
          <span className="px-3 py-1 rounded-full bg-[#EADFC7]/60 text-[#7E7667] text-[10px] font-black border border-[#EADFC7]">{item.label}</span>
          <span className="h-[1px] w-8 bg-[#EADFC7]"></span>
        </div>
      );
      const msg = item.data;
      const mine = msg.senderId === currentUser?.id;
      return (
        <div key={msg.id} className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
          {!mine && (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#AA771C] p-0.5 shadow-sm shrink-0 mb-1">
              <div className="w-full h-full bg-[#FAF6ED] rounded-full flex items-center justify-center overflow-hidden">
                {msg.senderAvatar ? <img src={msg.senderAvatar} alt="" className="w-full h-full object-cover" /> : <span className="text-xs">{isTailor ? '🧕' : '🧵'}</span>}
              </div>
            </div>
          )}
          <div className="max-w-[80%] space-y-1">
            <div onClick={() => setMenuFor(menuFor === msg.id ? null : msg.id)}
              className={`rounded-3xl p-3 space-y-1.5 text-right shadow-sm cursor-pointer ${mine ? 'bg-gradient-to-br from-[#FCF6BA]/95 via-[#F3E5AB]/95 to-[#EADFC7]/95 border border-[#D4AF37]/50' : 'bg-white border border-[#EADFC7]'}`}>
              {msg.deleted ? (
                <p className="text-[11px] font-bold text-[#7E7667] italic flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> این پیام حذف شد</p>
              ) : (
                <>
                  {msg.replyTo && (
                    <div className="rounded-xl bg-black/5 border-r-4 border-[#0E8388] p-2 mb-1 text-[10px] font-bold text-[#524B40]">
                      <span className="text-[#0E8388] block">{msg.replyTo.senderName}</span>
                      {msg.replyTo.imageUrl ? <span>📷 تصویر</span> : <span>{msg.replyTo.message}</span>}
                    </div>
                  )}
                  {msg.message && <p className="text-xs font-bold leading-relaxed">{msg.message}</p>}
                  {msg.imageUrl && (
                    <div onClick={(e) => { e.stopPropagation(); setViewer({ url: msg.imageUrl }); setVScale(1); setVRot(0); }} className="rounded-2xl overflow-hidden border border-[#D4AF37]/40 shadow-inner bg-black/10 cursor-zoom-in">
                      <img src={msg.imageUrl} alt="پیوست" className="w-full max-h-56 object-cover rounded-xl" />
                    </div>
                  )}
                </>
              )}
              <div className="flex items-center justify-end gap-1 text-[9px] text-[#7E7667] pt-0.5 font-bold">
                <span>{msg.time}</span>
                {mine && (msg.readAt ? <CheckCheck className="w-3.5 h-3.5 text-[#0E8388] stroke-[2.5]" /> : <Check className="w-3.5 h-3.5 text-[#7E7667] stroke-[2.5]" />)}
              </div>
            </div>
            {menuFor === msg.id && !msg.deleted && (
              <div className="flex items-center gap-1 bg-white border border-[#EADFC7] rounded-2xl p-1 shadow-sm">
                <button onClick={() => { setReplyTo(msg); setMenuFor(null); }} className="w-8 h-8 rounded-xl bg-[#0E8388]/10 text-[#0E8388] flex items-center justify-center active:scale-90"><Reply className="w-4 h-4" /></button>
                {msg.message && <button onClick={() => handleCopy(msg)} className="w-8 h-8 rounded-xl bg-[#EADFC7]/40 text-[#7E7667] flex items-center justify-center active:scale-90"><Copy className="w-4 h-4" /></button>}
                <button onClick={() => handleDelete(msg, 'me')} className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center active:scale-90"><Trash2 className="w-4 h-4" /></button>
                {mine && <button onClick={() => handleDelete(msg, 'all')} className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center active:scale-90"><Trash2 className="w-4 h-4" /><span className="text-[8px] font-black">همه</span></button>}
              </div>
            )}
          </div>
        </div>
      );
    })}
    <div ref={messagesEndRef} />
  </div>
  {/* نوار پاسخ */}
  {replyTo && (
    <div className="px-3 pb-1 bg-white/95 border-t border-[#EADFC7] flex items-center gap-2">
      <Reply className="w-4 h-4 text-[#0E8388] shrink-0" />
      <div className="flex-1 text-[10px] font-bold text-[#524B40] border-r-2 border-[#0E8388] pr-2 truncate">پاسخ به: {replyTo.message || '📷 تصویر'}</div>
      <button onClick={() => setReplyTo(null)} className="text-[#7E7667]"><X className="w-4 h-4" /></button>
    </div>
  )}
  {/* نوار ارسال */}
  <div className="p-3 bg-white/95 backdrop-blur-xl border-t border-[#EADFC7] shadow-2xl z-20">
    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
      <button type="submit" disabled={isSending} className="w-11 h-11 rounded-full bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white flex items-center justify-center shadow-md shadow-[#D4AF37]/30 active:scale-90 shrink-0 disabled:opacity-50"><Send className="w-5 h-5 -rotate-90 stroke-[2.2]" /></button>
      <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="پیام خود را بنویسید..." className="flex-1 bg-[#F8F5EE] rounded-full px-4 py-2.5 text-xs font-black text-[#23201C] placeholder:text-[#7E7667]/60 border border-[#EADFC7] focus:outline-none focus:bg-white text-right" />
      <button type="button" onClick={() => setShowPhotoPicker(true)} className="w-10 h-10 rounded-full khaliji-card-glass border border-[#EADFC7] text-[#B38F24] flex items-center justify-center shadow-sm active:scale-90 shrink-0"><Camera className="w-5 h-5" /></button>
    </form>
  </div>
  {/* مودال کپشن+برش عکس */}
  {caption && (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-4 border border-[#EADFC7] shadow-2xl space-y-3">
        <div className="flex items-center justify-between"><span className="text-xs font-black text-[#23201C]">ارسال تصویر با کپشن</span><button onClick={() => setCaption(null)} className="text-[#7E7667]"><X className="w-4 h-4" /></button></div>
        <img src={caption.preview} alt="پیش‌نمایش" className="w-full h-44 object-cover rounded-2xl border border-[#EADFC7]" />
        <input type="text" value={caption.text} onChange={(e) => setCaption(p => ({ ...p, text: e.target.value }))} placeholder="کپشن اختیاری بنویسید..." className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#EADFC7] text-xs font-bold" />
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setShowCrop(true)} className="py-2 rounded-xl bg-[#EADFC7]/40 text-[#7E7667] text-[10px] font-black flex items-center justify-center gap-1"><RotateCw className="w-3.5 h-3.5" />برش/چرخش</button>
          <button onClick={() => setCaption(null)} className="py-2 rounded-xl bg-[#FAF6ED] text-[#524B40] text-[10px] font-black">انصراف</button>
          <button onClick={handleSendCaption} disabled={isSending} className="py-2 rounded-xl bg-gradient-to-r from-[#0E8388] to-[#04474A] text-white text-[10px] font-black disabled:opacity-50">ارسال</button>
        </div>
      </div>
    </div>
  )}
  {/* ویور تمام‌صفحه */}
  {viewer && (
    <div className="fixed inset-0 z-[70] bg-black/95 flex flex-col justify-between">
      <div className="p-4 flex items-center justify-between">
        <button onClick={() => setViewer(null)} className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center active:scale-90"><X className="w-5 h-5" /></button>
        <span className="text-xs font-bold text-white/90">مشاهده تصویر</span>
        <a href={viewer.url} download target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center active:scale-90"><Download className="w-5 h-5" /></a>
      </div>
      <div className="flex-1 flex items-center justify-center overflow-hidden px-2">
        <img src={viewer.url} alt="تصویر" className="max-w-full max-h-full object-contain transition-transform duration-150" style={{ transform: `scale(${vScale}) rotate(${vRot}deg)` }} />
      </div>
      <div className="p-4 bg-black/70 backdrop-blur-md flex items-center justify-center gap-2 flex-wrap">
        <button onClick={() => setVScale(s => Math.max(0.5, s - 0.25))} className="w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center active:scale-90"><ZoomOut className="w-5 h-5" /></button>
        <button onClick={() => setVScale(s => Math.min(3, s + 0.25))} className="w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center active:scale-90"><ZoomIn className="w-5 h-5" /></button>
        <button onClick={() => setVRot(r => r + 90)} className="w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center active:scale-90"><RotateCw className="w-5 h-5" /></button>
        {isTailor && <button onClick={() => handleSendToStory(viewer.url)} className="px-4 h-11 rounded-full bg-[#0E8388] text-white text-xs font-black flex items-center gap-1.5 active:scale-95"><Share2 className="w-4 h-4" />استوری</button>}
        {isTailor && <button onClick={() => handleAddToPortfolio(viewer.url)} className="px-4 h-11 rounded-full bg-[#D4AF37] text-white text-xs font-black flex items-center gap-1.5 active:scale-95"><Shirt className="w-4 h-4" />نمونه‌کار</button>}
      </div>
    </div>
  )}
  <PhotoPickerModal isOpen={showPhotoPicker} onClose={() => setShowPhotoPicker(false)} onImageSelected={handlePhotoSelected} />
  <ImageCropModal isOpen={showCrop} imageSrc={caption?.preview} onClose={() => setShowCrop(false)} onCropComplete={(f) => { setCaption(p => ({ ...p, file: f, preview: URL.createObjectURL(f) })); setShowCrop(false); }} />
</div>
);
};