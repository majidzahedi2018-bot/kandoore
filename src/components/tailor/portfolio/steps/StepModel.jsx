// src/components/tailor/portfolio/steps/StepModel.jsx
import React from 'react';
import { Ruler } from 'lucide-react';
import { MODELS_BY_TYPE } from '../../../../data/portfolioTaxonomy';
import { StepTitle, Chip, Field, inputCls } from './ui';
const StepModel = ({ garmentType, value, customValue, onChange, onCustomChange }) => {
  const models = MODELS_BY_TYPE[garmentType] || [];
  const isCustom = value === 'custom' || models.length === 0;
  return (
    <div>
      <StepTitle icon={Ruler} title="مدل و فرم برش" subtitle={models.length ? 'اگر مدل شما در فهرست نیست، مدل سفارشی ثبت کنید' : 'برای این نوع پوشاک، مدل را آزادانه بنویسید'} />
      {models.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {models.map((m) => (
            <Chip key={m} active={value === m} onClick={() => onChange(m)}>{m}</Chip>
          ))}
          <Chip active={value === 'custom'} onClick={() => onChange('custom')} tone="teal">+ مدل سفارشی</Chip>
        </div>
      )}
      {isCustom && (
        <div className="mt-3">
          <Field label="نام مدل سفارشی">
            <input className={inputCls} value={customValue} onChange={(e) => onCustomChange(e.target.value)} placeholder="مثلاً شلوار اشکم با لبه حریر" />
          </Field>
        </div>
      )}
    </div>
  );
};
export default StepModel;