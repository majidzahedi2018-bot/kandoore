// src/components/customer/SearchFilterModal.jsx
import React, { useState } from 'react';
import { X, Search, Flame, MapPin, Scissors, Wallet, ShieldCheck, Zap, RotateCcw, ChevronLeft, Check } from 'lucide-react';

export const SearchFilterModal = ({ isOpen, onClose, onApplyFilters }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('بندرعباس');
  const [selectedStitch, setSelectedStitch] = useState('بادله تمام پر');
  const [verifiedOnly, setVerifiedOnly] = useState(true);

  if (!isOpen) return null;

  const cities = ['بندرعباس', 'قشم', 'میناب', 'بندرلنگه'];
  const stitches = ['خوس‌دوزی', 'شک‌بافی', 'بادله تمام پر', 'گلابتون‌دوزی'];

  const handleApply = () => {
    if (onApplyFilters) onApplyFilters({ searchQuery, selectedCity, selectedStitch, verifiedOnly });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F8F5EE] flex flex-col justify-between p-0 select-none overflow-hidden max-w-md mx-auto">
      
      {/* هدر */}
      <div className="p-4 bg-white/80 backdrop-blur-md border-b border-[#EADFC7] flex items-center gap-3 z-10 shrink-0">
        <button onClick={onClose} className="flex flex-col items-center justify-center text-[#7E7667] shrink-0">
          <div className="w-9 h-9 rounded-full khaliji-card-glass flex items-center justify-center border border-[#EADFC7] shadow-sm mb-0.5">
            <X className="w-4 h-4 text-[#23201C]" />
          </div>
          <span className="text-[10px] font-bold">انصراف</span>
        </button>

        <div className="flex-1 flex items-center khaliji-card-glass rounded-2xl px-4 py-3 border-2 border-[#D4AF37]/60 shadow-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در طرح‌ها، خیاطان، پارچه..."
            className="w-full bg-transparent text-xs font-black text-[#23201C] focus:outline-none text-right"
          />
          <Search className="w-4 h-4 text-[#B38F24] mr-2 shrink-0" />
        </div>
      </div>

      {/* فرم فیلتر */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 pb-28">
        
        {/* شهر */}
        <div className="khaliji-card-glass rounded-[2rem] p-4 border border-[#EADFC7] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 text-[#B38F24] flex items-center justify-center"><MapPin className="w-4 h-4" /></div>
            <h3 className="text-xs font-black text-[#23201C]">شهر و منطقه</h3>
          </div>
          <div className="grid grid-cols-4 gap-2 pt-1">
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`py-2 px-1 rounded-2xl text-[11px] font-black flex items-center justify-center gap-1 ${
                  selectedCity === city ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-500' : 'bg-white border border-[#EADFC7] text-[#7E7667]'
                }`}
              >
                {selectedCity === city && <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />}
                <span>{city}</span>
              </button>
            ))}
          </div>
        </div>

        {/* نوع دوخت */}
        <div className="khaliji-card-glass rounded-[2rem] p-4 border border-[#EADFC7] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 text-[#B38F24] flex items-center justify-center"><Scissors className="w-4 h-4" /></div>
            <h3 className="text-xs font-black text-[#23201C]">نوع دوخت سنتی</h3>
          </div>
          <div className="grid grid-cols-4 gap-2 pt-1">
            {stitches.map((stitch) => (
              <button
                key={stitch}
                onClick={() => setSelectedStitch(stitch)}
                className={`py-2 px-1 rounded-2xl text-[10px] font-black flex items-center justify-center gap-1 ${
                  selectedStitch === stitch ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-500' : 'bg-white border border-[#EADFC7] text-[#7E7667]'
                }`}
              >
                {selectedStitch === stitch && <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />}
                <span>{stitch}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* دکمه اعمال */}
      <div className="p-4 bg-white/95 backdrop-blur-xl border-t border-[#EADFC7] flex items-center justify-between shadow-2xl z-20">
        <button
          onClick={handleApply}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C] text-white font-black text-xs shadow-lg flex items-center gap-2 active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>اعمال فیلترها</span>
        </button>

        <button
          onClick={() => { setSearchQuery(''); setSelectedCity('بندرعباس'); }}
          className="flex items-center gap-1.5 text-xs font-black text-[#7E7667]"
        >
          <span>پاک کردن</span>
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};