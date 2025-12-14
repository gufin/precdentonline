import React from 'react';
import { FilterState, CaseRecord } from '../types';

interface FilterPanelProps {
  isOpen: boolean;
  filters: FilterState;
  cases: CaseRecord[];
  onFilterChange: (key: keyof FilterState, value: any) => void;
  onApply: () => void;
  onReset: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  filters,
  cases,
  onFilterChange,
  onApply,
  onReset
}) => {
  const getOptions = (key: string): string[] => {
    const values = cases
      .map(c => (c.data_json as any)[key])
      .filter((val): val is string => typeof val === 'string' && val.length > 0);
    return Array.from<string>(new Set(values)).sort();
  };

  const courts = getOptions('court');
  const judges = getOptions('judge');
  const results = getOptions('issue_result');

  return (
    <div className="bg-[#1c1c1e] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        
        <FilterSelect 
          label="Суд" 
          value={filters.court} 
          onChange={(v) => onFilterChange('court', v)} 
          options={courts} 
        />
        
        <FilterSelect 
          label="Судья" 
          value={filters.judge} 
          onChange={(v) => onFilterChange('judge', v)} 
          options={judges} 
        />

        <FilterSelect 
          label="Результат" 
          value={filters.result} 
          onChange={(v) => onFilterChange('result', v)} 
          options={results} 
        />
        
        <div className="flex flex-col space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-[#86868b] font-semibold pl-1">Стороны</label>
          <input 
            type="text" 
            value={filters.side}
            onChange={(e) => onFilterChange('side', e.target.value)}
            placeholder="Сбербанк..."
            className="w-full bg-black/30 border border-white/10 text-white rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] transition-all placeholder-[#424245]"
          />
        </div>

        <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-4">
           <div className="flex flex-col space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-[#86868b] font-semibold pl-1">Дата вынесения</label>
              <div className="flex space-x-2">
                <input 
                  type="date" 
                  className="w-full bg-black/30 border border-white/10 text-white rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#0A84FF] transition-all"
                  value={filters.dateIssueFrom}
                  onChange={(e) => onFilterChange('dateIssueFrom', e.target.value)}
                />
                <input 
                  type="date" 
                  className="w-full bg-black/30 border border-white/10 text-white rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#0A84FF] transition-all"
                  value={filters.dateIssueTo}
                  onChange={(e) => onFilterChange('dateIssueTo', e.target.value)}
                />
              </div>
           </div>
           <div className="flex flex-col justify-end space-y-2 pb-1">
              <label className="flex items-center space-x-3 cursor-pointer group p-2 rounded-lg hover:bg-white/5 transition-colors">
                <input 
                  type="checkbox" 
                  checked={filters.inForceOnly}
                  onChange={(e) => onFilterChange('inForceOnly', e.target.checked)}
                  className="appearance-none w-5 h-5 border border-white/20 rounded bg-black/30 checked:bg-[#0A84FF] checked:border-[#0A84FF] transition-all"
                />
                <span className="text-sm text-[#d1d1d6] group-hover:text-white transition-colors">Вступило в силу</span>
              </label>
           </div>
        </div>
      </div>

      <div className="flex justify-end items-center mt-8 space-x-4 border-t border-white/5 pt-6">
        <button 
          onClick={onReset}
          className="px-4 py-2 text-sm text-[#86868b] hover:text-white transition-colors font-medium"
        >
          Сбросить
        </button>
        <button 
          onClick={onApply}
          className="px-6 py-2 bg-white text-black text-sm font-semibold rounded-full hover:bg-[#f5f5f7] transition-colors shadow-lg shadow-white/5"
        >
          Применить фильтры
        </button>
      </div>
    </div>
  );
};

const FilterSelect = ({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: string[] }) => (
  <div className="flex flex-col space-y-2">
    <label className="text-[10px] uppercase tracking-widest text-[#86868b] font-semibold pl-1">{label}</label>
    <div className="relative">
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-black/30 border border-white/10 text-white rounded-lg py-2.5 pl-3 pr-8 text-sm focus:outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] transition-all"
      >
        <option value="">Все</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#86868b]">
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  </div>
);

export default FilterPanel;