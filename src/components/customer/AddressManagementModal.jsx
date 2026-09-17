// src/components/customer/AddressManagementModal.jsx
import React, { useState, useEffect } from 'react';
import { ChevronRight, Plus, Check, Home, Building, Trash2, Edit3, Lock } from 'lucide-react';
import { addressesApi } from '../../api/api';
import { useToast } from '../common/ToastSystem';
export const AddressManagementModal = ({ isOpen, onClose, currentUser, onSelectAddress }) => {
const { toast, confirmAction } = useToast();
const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newTitle, setNewTitle] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newRecipient, setNewRecipient] = useState(currentUser?.name || 'مریم رضایی');
  const [newPhone, setNewPhone] = useState(currentUser?.username || '09171234567');

  const fetchAddresses = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    const res = await addressesApi.getByUser(currentUser.id);
    if (res.success && res.addresses?.length > 0) {
      setAddresses(res.addresses);
      const def = res.addresses.find(a => a.isDefault) || res.addresses[0];
      setSelectedAddressId(def.id);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) fetchAddresses();
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleDelete = async (id, e) => {
e.stopPropagation();
const ok = await confirmAction({
title: 'حذف آدرس',
message: 'آیا از حذف این آدرس اطمینان دارید؟',
confirmLabel: 'بله، حذف شود',
danger: true
});
if (!ok) return;
setAddresses(prev => prev.filter(a => a.id !== id));
await addressesApi.delete(id, currentUser?.id || 1);
toast.success('آدرس با موفقیت حذف شد.');
};

  const handleAddNew = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAddress.trim()) return;

    const payload = {
      user_id: currentUser?.id || 1,
      title: newTitle,
      full_address: newAddress,
      recipient: newRecipient,
      phone: newPhone,
      type: 'home'
    };

    const res = await addressesApi.create(payload);
    if (res.success) {
      fetchAddresses();
      setShowAddModal(false);
      setNewTitle('');
      setNewAddress('');
    }
  };

  const handleConfirm = () => {
    const chosen = addresses.find(a => a.id === selectedAddressId) || addresses[0];
    if (onSelectAddress && chosen) onSelectAddress(chosen);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F8F5EE] flex flex-col justify-between p-0 select-none overflow-hidden max-w-md mx-auto">
      
      {/* هدر */}
      <div className="p-4 bg-white/80 backdrop-blur-md border-b border-[#EADFC7] flex items-center justify-between z-10 shrink-0">
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full khaliji-card-glass flex items-center justify-center text-[#B38F24] border border-[#EADFC7] shadow-sm active:scale-90"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        
        <h1 className="text-base font-black text-[#23201C]">آدرس‌های تحویل در بندرعباس</h1>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white font-black text-[11px] shadow-md flex items-center gap-1 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>افزودن</span>
        </button>
      </div>

      {/* لیست آدرس‌ها */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 pb-28">
        {loading ? (
          <div className="text-center py-12 text-xs font-black text-[#7E7667]">در حال دریافت آدرس‌ها از سرور...</div>
        ) : addresses.length > 0 ? (
          addresses.map((addr) => {
            const isSelected = selectedAddressId === addr.id;
            return (
              <div
                key={addr.id}
                onClick={() => setSelectedAddressId(addr.id)}
                className={`rounded-[2.5rem] p-5 cursor-pointer transition-all space-y-3 ${
                  isSelected
                    ? 'bg-white border-2 border-[#D4AF37] shadow-xl shadow-[#D4AF37]/15 scale-[1.01]'
                    : 'khaliji-card-glass border border-[#EADFC7]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-[#0E8388] text-white shadow-sm' : 'border-2 border-[#EADFC7]'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-[11px] font-black border bg-[#FAF6ED] text-[#23201C] border-[#EADFC7]">
                      {addr.title} {addr.isDefault && '★'}
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-[#FAF6ED] border border-[#EADFC7] flex items-center justify-center text-xl shadow-inner shrink-0">
                      {addr.type === 'home' ? <Home className="w-5 h-5 text-[#8C3415]" /> : <Building className="w-5 h-5 text-[#B38F24]" />}
                    </div>
                  </div>
                </div>

                <p className="text-xs font-black text-[#23201C] leading-relaxed text-right pt-1">
                  {addr.fullAddress}
                </p>

                <div className="pt-2 border-t border-dashed border-[#EADFC7] flex items-center justify-between text-[10px] text-[#7E7667] font-bold">
                  <span className="font-mono">{addr.phone}</span>
                  <span>گیرنده: {addr.recipient}</span>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={(e) => handleDelete(addr.id, e)}
                    className="py-1.5 px-3 rounded-xl bg-red-50 text-red-600 text-xs font-black flex items-center gap-1 hover:bg-red-100"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-xs font-black text-[#7E7667]">هیچ آدرسی ثبت نشده است.</div>
        )}
      </div>

      {/* دکمه تایید */}
      <div className="p-4 bg-white/95 backdrop-blur-xl border-t border-[#EADFC7] shadow-2xl z-20 space-y-2">
        <button
          onClick={handleConfirm}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white font-black text-xs shadow-lg shadow-[#D4AF37]/30 flex items-center justify-center gap-2 active:scale-95"
        >
          <Check className="w-4 h-4" />
          <span>تأیید و انتخاب این آدرس تحویل</span>
        </button>
      </div>

      {/* مودال افزودن آدرس */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-5 border border-[#EADFC7] shadow-2xl space-y-3.5 text-right">
            <div className="flex items-center justify-between border-b border-[#F8F5EE] pb-2">
              <span className="text-xs font-black text-[#23201C]">افزودن آدرس جدید در بندرعباس</span>
              <button onClick={() => setShowAddModal(false)} className="text-xs text-[#7E7667]">✕</button>
            </div>

            <form onSubmit={handleAddNew} className="space-y-2.5">
              <div>
                <label className="text-[10px] font-bold text-[#7E7667] block mb-1">عنوان (منزل، محل کار):</label>
                <input
                  type="text"
                  placeholder="منزل"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#EADFC7] text-xs font-bold text-[#23201C] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7E7667] block mb-1">نشانی کامل پستی:</label>
                <textarea
                  rows={2}
                  placeholder="بندرعباس، گلشهر، خیابان..."
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#EADFC7] text-xs font-bold text-[#23201C] focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#D4AF37] text-white text-xs font-black shadow-md mt-2"
              >
                ثبت و ذخیره در دیتابیس
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};