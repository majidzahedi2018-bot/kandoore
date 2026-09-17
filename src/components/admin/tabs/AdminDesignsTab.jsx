// src/components/admin/tabs/AdminDesignsTab.jsx
import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Crown, Store, Sparkles, Clock, 
  Trash2, Edit3, Check, X, Tag, Scissors, Eye, Layers
} from 'lucide-react';
import { designsApi, adminApi } from '../../../api/api';
import { Skeleton, AnimatedNumber } from '../../common/UiKit';
import { useToast } from '../../common/ToastSystem';
export const AdminDesignsTab = ({ onRefresh }) => {
const { toast, confirmAction } = useToast();
  const [designs, setDesigns] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('همه');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // استیت مودال ویرایش طرح
  const [editingDesign, setEditingDesign] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDays, setEditDays] = useState('');
  const [editBom, setEditBom] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // استیت مودال افزودن طرح شاخص توسط ادمین
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('کندوره');
  const [newPrice, setNewPrice] = useState('۵۲۰٬۰۰۰');
  const [newDays, setNewDays] = useState('۳ تا ۵ روز');
  const [newBom, setNewBom] = useState('۲٫۵ متر پارچه کرپ • ۶ متر شک • ۲ عدد نخ گلابتون');

  // استیت فعال/غیرفعال بودن محلی کارت‌ها در کاتالوگ
  const [activeStatusMap, setActiveStatusMap] = useState({});

  const fetchDesigns = async () => {
    setLoading(true);
    try {
      const res = await designsApi.getAll('', null, { showAll: true });
      if (res.success && res.designs) {
        setDesigns(res.designs);
      }
    } catch (e) {
      console.error('Error fetching designs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigns();
  }, []);

  const categories = ['همه طرح‌ها', 'پیراهن کندوره', 'شلوار بندری', 'بادله و شک'];

  // فیلتر کردن طرح‌ها
  const filteredDesigns = designs.filter((d) => {
    let matchesCategory = true;
    if (selectedCategory === 'پیراهن کندوره') matchesCategory = d.category === 'کندوره' || d.title.includes('کندوره');
    else if (selectedCategory === 'شلوار بندری') matchesCategory = d.category === 'شلوار بندری' || d.title.includes('شلوار');
    else if (selectedCategory === 'بادله و شک') matchesCategory = d.category === 'بادله و شک' || d.title.includes('بادله');

    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      matchesSearch = 
        d.title?.toLowerCase().includes(q) ||
        d.tailorName?.toLowerCase().includes(q) ||
        d.category?.toLowerCase().includes(q);
    }

    return matchesCategory && matchesSearch;
  });

  // تاگل کردن وضعیت فعال در کاتالوگ
  const handleToggleActive = (id) => {
    setActiveStatusMap(prev => ({
      ...prev,
      [id]: prev[id] !== undefined ? !prev[id] : false
    }));
  };

  // حذف طرح
  const handleDelete = async (id, userId) => {
const ok = await confirmAction({
title: 'حذف طرح از کاتالوگ',
message: 'آیا از حذف این طرح از کاتالوگ اطمینان دارید؟',
confirmLabel: 'بله، حذف شود',
danger: true
});
if (!ok) return;
setDesigns(prev => prev.filter(item => item.id !== id));
await designsApi.delete(id, userId || 2);
if (onRefresh) onRefresh();
toast.success('طرح با موفقیت از کاتالوگ حذف شد.');
};

  // باز کردن مودال ویرایش
  const handleOpenEdit = (design) => {
    setEditingDesign(design);
    setEditTitle(design.title || '');
    setEditPrice(String(design.price || ''));
    setEditDays(design.deliveryDays || '۳ تا ۵ روز');
    setEditBom(design.description || '');
  };

  // ذخیره ویرایش
  const handleSaveEdit = async (e) => {
    e?.preventDefault();
    if (!editingDesign) return;

    setIsSaving(true);
    const cleanPrice = parseInt(String(editPrice).replace(/[^0-9]/g, '')) || 500000;
    const res = await adminApi.updateDesign({
      id: editingDesign.id,
      title: editTitle.trim(),
      price: cleanPrice,
      delivery_days: editDays.trim(),
      materials_bom: editBom.trim()
    });
    setIsSaving(false);

    if (res.success) {
      setDesigns(prev => prev.map(d => d.id === editingDesign.id ? {
        ...d,
        title: editTitle.trim(),
        price: cleanPrice,
        deliveryDays: editDays.trim(),
        description: editBom.trim()
      } : d));
         setEditingDesign(null);
   toast.success('تغییرات طرح با موفقیت ذخیره شد.');
 }
};

  // ثبت طرح شاخص جدید
  const handleCreateAdminDesign = async (e) => {
    e?.preventDefault();
    if (!newTitle.trim()) return;

    setIsSaving(true);
    const cleanPrice = parseInt(String(newPrice).replace(/[^0-9]/g, '')) || 520000;
    const res = await adminApi.createAdminDesign({
      title: newTitle.trim(),
      category: newCategory,
      price: cleanPrice,
      delivery_days: newDays.trim(),
      materials_bom: newBom.trim()
    });
    setIsSaving(false);

    if (res.success) {
         fetchDesigns();
   setShowAddModal(false);
   setNewTitle('');
   toast.success('طرح شاخص جدید به کاتالوگ اضافه شد.');
 }
};

  const featuredDesign = designs.length > 0 ? designs[0] : null;

  return (
    <div className="space-y-5 text-right select-none">
      
      {/* =========================================================================
          ۱. سه کارت شاخص بالای صفحه (دقیقاً مطابق با تصویر موکاپ)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        
        {/* کارت ۱: طرح‌های جدید کارگاه‌ها */}
        <div className="khaliji-card-glass rounded-[2.2rem] p-4 sm:p-5 border-2 border-[#EADFC7] shadow-xl flex items-center justify-between">
          <div className="space-y-1 text-right">
                     <span className="text-[10px] font-black text-amber-800 block">طرح‌های جدید کارگاه‌ها</span>
         <span className="text-2xl font-black text-[#23201C] block tracking-tight">
           <AnimatedNumber value={designs.length} />
         </span>
            <span className="text-[9px] text-[#7E7667] font-bold block">
              طرح در انتظار بررسی
            </span>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl shadow-inner shrink-0">
            🏬
          </div>
        </div>

        {/* کارت ۲: طرح فاخر این هفته (کارت سبز زمردی تیره) */}
        <div className="rounded-[2.2rem] p-4 sm:p-5 bg-gradient-to-br from-[#0E352B] via-[#092820] to-[#041914] text-white border-2 border-[#D4AF37]/60 shadow-xl flex items-center justify-between">
          <div className="space-y-1 text-right">
            <span className="text-[10px] font-black text-[#FBF5B7] block">طرح فاخر این هفته</span>
            <span className="text-sm font-black text-[#FCF6BA] block truncate max-w-[170px]">
              {featuredDesign?.title || 'کندوره زری‌بافی خلیج'}
            </span>
            <span className="text-[9px] text-white/80 font-bold block">
              {featuredDesign?.tailorName || 'مزون ماهور'} - {featuredDesign?.tailorCity || 'بندرعباس'}
            </span>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-[#D4AF37]/40 flex items-center justify-center text-3xl shadow-inner shrink-0">
            👑
          </div>
        </div>

        {/* کارت ۳: کل طرح‌های فعال کاتالوگ */}
        <div className="khaliji-card-glass rounded-[2.2rem] p-4 sm:p-5 border-2 border-[#EADFC7] shadow-xl flex items-center justify-between">
          <div className="space-y-1 text-right">
                     <span className="text-[10px] font-black text-[#23201C] block">کل طرح‌ها، فعال کاتالوگ</span>
         <span className="text-2xl font-black text-[#23201C] block tracking-tight">
           <AnimatedNumber value={designs.length} />
         </span>
            <span className="text-[9px] text-[#7E7667] font-bold block">
              طرح فعال
            </span>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-[#FAF6ED] border border-[#D4AF37]/40 flex items-center justify-center text-3xl shadow-inner shrink-0">
            👗
          </div>
        </div>

      </div>

      {/* =========================================================================
          ۲. نوار جستجو، دکمه افزودن طرح شاخص و فیلترهای دسته‌بندی
          ========================================================================= */}
      <div className="khaliji-card-glass rounded-[2.2rem] p-4 sm:p-5 border-2 border-[#EADFC7] shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="w-full sm:flex-1 flex items-center bg-white/90 rounded-2xl border-2 border-[#EADFC7] focus-within:border-[#D4AF37] shadow-inner px-3.5 py-2">
            <Search className="w-4 h-4 text-[#B38F24] shrink-0 ml-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی طرح، خیاط، مدل شلوار، نوع دوخت..."
              className="w-full bg-transparent text-xs font-black text-[#23201C] placeholder:text-[#7E7667]/50 focus:outline-none text-right"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-xs text-[#7E7667] mr-1">✕</button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-transform shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>افزودن طرح شاخص</span>
          </button>
        </div>

        {/* تب‌های دسته‌بندی */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => {
            const isActive = selectedCategory === (cat === 'همه طرح‌ها' ? 'همه' : cat);
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === 'همه طرح‌ها' ? 'همه' : cat)}
                className={`shrink-0 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
                  isActive
                    ? 'bg-[#0E352B] text-white shadow-lg shadow-[#0E352B]/20 scale-[1.02]'
                    : 'khaliji-card-glass text-[#524B40] border border-[#EADFC7] hover:bg-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

      </div>

      {/* =========================================================================
          ۳. گرید کارت‌های نمونه‌کار (دقیقاً مطابق موکاپ ۲ ستونه دسکتاپ و ۱ ستونه موبایل)
          ========================================================================= */}
         {loading ? (
     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
       {[...Array(4)].map((_, i) => (
         <div key={i} className="khaliji-card-glass rounded-[2.5rem] p-5 border-2 border-[#EADFC7] shadow-xl space-y-3">
           <div className="flex gap-3">
             <Skeleton className="w-28 h-36 !rounded-2xl" />
             <div className="flex-1 space-y-2">
               <Skeleton className="w-full h-5" />
               <Skeleton className="w-2/3 h-4" />
               <Skeleton className="w-1/2 h-4" />
             </div>
           </div>
           <Skeleton className="w-full h-8 !rounded-xl" />
         </div>
       ))}
     </div>
   ) : filteredDesigns.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredDesigns.map((d) => {
            const isActive = activeStatusMap[d.id] !== false; // پیش‌فرض فعال
            return (
              <div 
                key={d.id}
                className="khaliji-card-glass rounded-[2.5rem] p-5 border-2 border-[#EADFC7] shadow-xl space-y-4 hover:border-[#D4AF37] transition-all bg-gradient-to-b from-[#FCFAF6] to-[#F8F5EE] flex flex-col justify-between"
              >
                
                <div className="flex items-start justify-between gap-3">
                  
                  {/* عکس قدی و باکیفیت پارچه با کادر طلایی */}
                  <div className="w-28 h-36 rounded-2xl bg-gradient-to-br from-[#1C150F] via-[#2A1F16] to-[#0A0705] p-1 border-2 border-[#D4AF37] shadow-md flex items-center justify-center shrink-0 overflow-hidden relative">
                    {d.image ? (
                      <img src={d.image} alt={d.title} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <span className="text-4xl">✨👗</span>
                    )}
                  </div>

                  {/* مشخصات مدل و خیاط */}
                  <div className="flex-1 text-right space-y-1.5">
                    <h3 className="text-sm font-black text-[#23201C]">{d.title}</h3>
                    <div className="text-[11px] text-[#7E7667] font-bold">
                      <span>{d.tailorName || 'کارگاه کَندوره'}</span>
                      <span> - </span>
                      <span>{d.tailorCity || 'بندرعباس'}</span>
                    </div>

                    <div className="flex items-center justify-end gap-3 text-[11px] font-black pt-1">
                      <span className="flex items-center gap-1 text-[#7E7667]">
                        <Clock className="w-3.5 h-3.5 text-[#B38F24]" />
                        <span>{d.deliveryDays || '۳ تا ۵ روزه'}</span>
                      </span>
                      <span>•</span>
                      <span className="text-emerald-700">
                        {(d.price || 0).toLocaleString('fa-IR')} تومان
                      </span>
                    </div>

                    {/* ملزومات BOM */}
                    <p className="text-[10px] text-[#524B40] font-bold leading-relaxed bg-[#FAF6ED] p-2 rounded-xl border border-[#EADFC7] mt-1">
                      {d.description || '۲٫۵ متر پارچه کرپ • ۶ متر شک • ۲ عدد نخ گلابتون'}
                    </p>
                  </div>

                </div>

                {/* تگ‌های ویژگی‌ها */}
                <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
                  {['گلابتون‌دوزی اعلا', 'شک ۶ سانت', 'کرپ فاخر'].map((tag, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-0.5 rounded-lg bg-white border border-[#EADFC7] text-[9px] font-black text-[#524B40]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* ردیف عملیاتی پایین: سوئیچ فعال/غیرفعال + دکمه ویرایش + دکمه حذف */}
                <div className="flex items-center justify-between pt-2 border-t border-[#EADFC7]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(d.id, d.userId)}
                      className="w-9 h-9 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center active:scale-90 hover:bg-red-100 transition-all"
                      title="حذف طرح"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(d)}
                      className="w-9 h-9 rounded-xl bg-white border border-[#EADFC7] text-[#B38F24] flex items-center justify-center active:scale-90 hover:bg-[#FAF6ED] transition-all"
                      title="ویرایش مشخصات"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* سوئیچ فعال در کاتالوگ عمومی */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-[#23201C]">
                      {isActive ? 'فعال در کاتالوگ عمومی' : 'غیرفعال و پنهان'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(d.id)}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${isActive ? 'bg-[#0E8388]' : 'bg-[#EADFC7]'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${isActive ? 'translate-x-0' : '-translate-x-5'}`}></div>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="khaliji-card-glass rounded-[2.5rem] p-12 border-2 border-dashed border-[#D4AF37]/60 text-center space-y-3">
          <span className="text-4xl">👗</span>
          <h3 className="text-sm font-black text-[#23201C]">طرحی در این دسته‌بندی یافت نشد</h3>
        </div>
      )}

      {/* =========================================================================
          ۴. مودال ویرایش مشخصات طرح
          ========================================================================= */}
      {editingDesign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-5 border border-[#EADFC7] shadow-2xl space-y-3.5 text-right">
            
            <div className="flex items-center justify-between border-b border-[#F8F5EE] pb-2">
              <span className="text-xs font-black text-[#23201C]">ویرایش طرح #{editingDesign.id}</span>
              <button onClick={() => setEditingDesign(null)} className="text-xs text-[#7E7667]">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-[#7E7667] block mb-1">عنوان مدل لباس:</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#EADFC7] text-xs font-black text-[#23201C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-[#7E7667] block mb-1">دستمزد (تومان):</label>
                  <input
                    type="text"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#EADFC7] text-xs font-black text-[#23201C]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#7E7667] block mb-1">مدت زمان دوخت:</label>
                  <input
                    type="text"
                    value={editDays}
                    onChange={(e) => setEditDays(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#EADFC7] text-xs font-black text-[#23201C]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7E7667] block mb-1">ملزومات مصرفی (BOM):</label>
                <textarea
                  rows={2}
                  value={editBom}
                  onChange={(e) => setEditBom(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#EADFC7] text-xs font-bold text-[#23201C] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white font-black text-xs shadow-md active:scale-95 disabled:opacity-50"
              >
                {isSaving ? 'در حال ذخیره...' : 'ذخیره تغییرات در دیتابیس'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          ۵. مودال افزودن طرح شاخص جدید توسط مدیریت
          ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-5 border border-[#EADFC7] shadow-2xl space-y-3.5 text-right">
            
            <div className="flex items-center justify-between border-b border-[#F8F5EE] pb-2">
              <span className="text-xs font-black text-[#23201C]">افزودن طرح شاخص مدیریت</span>
              <button onClick={() => setShowAddModal(false)} className="text-xs text-[#7E7667]">✕</button>
            </div>

            <form onSubmit={handleCreateAdminDesign} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-[#7E7667] block mb-1">عنوان طرح:</label>
                <input
                  type="text"
                  placeholder="مثال: کندوره مجلسی نگین‌دار"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#EADFC7] text-xs font-black text-[#23201C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-[#7E7667] block mb-1">دسته‌بندی:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#EADFC7] text-xs font-bold text-[#23201C]"
                  >
                    <option value="کندوره">کندوره</option>
                    <option value="شلوار بندری">شلوار بندری</option>
                    <option value="بادله و شک">بادله و شک</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#7E7667] block mb-1">دستمزد (تومان):</label>
                  <input
                    type="text"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#EADFC7] text-xs font-black text-[#23201C]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7E7667] block mb-1">ملزومات مصرفی (BOM):</label>
                <textarea
                  rows={2}
                  value={newBom}
                  onChange={(e) => setNewBom(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#EADFC7] text-xs font-bold text-[#23201C] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white font-black text-xs shadow-md active:scale-95 disabled:opacity-50"
              >
                {isSaving ? 'در حال انتشار...' : 'انتشار مستقیم در کاتالوگ عمومی'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};