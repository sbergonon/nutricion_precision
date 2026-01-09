
import React, { useState } from 'react';
import { Language } from '../types';
import { getTranslation } from '../i18n';

interface Props {
  label: string;
  items: string[];
  placeholder: string;
  onUpdate: (items: string[]) => void;
  language: Language;
  renderExtra?: (item: string, index: number) => React.ReactNode;
}

const DynamicListInput: React.FC<Props> = ({ label, items, placeholder, onUpdate, language, renderExtra }) => {
  const t = getTranslation(language);
  const [current, setCurrent] = useState('');

  const addItem = () => {
    if (current.trim() && !items.includes(current.trim())) {
      onUpdate([...items, current.trim()]);
      setCurrent('');
    }
  };

  const removeItem = (idx: number) => {
    onUpdate(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
        />
        <button
          type="button"
          onClick={addItem}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
        >
          {t.btn_add}
        </button>
      </div>
      <div className="flex flex-col gap-2 mt-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-1 p-2 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">
                {item}
                <button type="button" onClick={() => removeItem(idx)} className="hover:text-emerald-900 font-bold ml-1">×</button>
              </span>
              {renderExtra && renderExtra(item, idx)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DynamicListInput;
