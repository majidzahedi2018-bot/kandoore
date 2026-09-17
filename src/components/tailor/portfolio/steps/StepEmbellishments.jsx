// src/components/tailor/portfolio/steps/StepEmbellishments.jsx
import React from 'react';
import { Sparkles } from 'lucide-react';
import { EMBELLISHMENTS } from '../../../../data/portfolioTaxonomy';
import { StepTitle, Chip } from './ui';

const StepEmbellishments = ({ value, onChange }) => {
  const toggle = (item) => {
    if (item === 'بدون تزئین') { onChange(value.includes('بدون تزئین') ? [] : ['بدون تزئین']); return; }
    const base = value.filter((v) => v !== 'بدون تزئین');
    onChange(base.includes(item) ? base.filter((v) => v !== item) : [...base, item]);
  };
  return (
    <div>
      <StepTitle icon={Sparkles} title="تزئینات و هنرهای سنتی" subtitle="چندانتخابی؛ مثلاً گلابتون‌دوزی + شک + نوار‌دوزی" />
      <div className="flex flex-wrap gap-2">
        {EMBELLISHMENTS.map((e) => (
          <Chip key={e} active={value.includes(e)} onClick={() => toggle(e)} tone="teal">{e}</Chip>
        ))}
      </div>
    </div>
  );
};
export default StepEmbellishments;