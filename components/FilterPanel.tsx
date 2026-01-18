import React, { useState, useEffect } from 'react';
import { FilterState, CaseRecord } from '../types';
import { fetchAvailableCourts, fetchAvailableDocTypes, fetchAvailableCategories } from '../services/api';

interface FilterPanelProps {
  isOpen: boolean;
  filters: FilterState;
  cases: CaseRecord[];
  onFilterChange: (key: keyof FilterState, value: any) => void;
  onApply: () => void;
  onReset: () => void;
  searchType?: 'semantic' | 'classic';
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  filters,
  cases,
  onFilterChange,
  onApply,
  onReset,
  searchType = 'classic'
}) => {
  // Состояния для хранения доступных значений из API
  const [availableCourts, setAvailableCourts] = useState<string[]>([]);
  const [availableDocTypes, setAvailableDocTypes] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  // Загружаем доступные значения фильтров при монтировании и при смене типа поиска
  useEffect(() => {
    if (searchType === 'semantic') {
      setLoadingFilters(true);
      Promise.all([
        fetchAvailableCourts(),
        fetchAvailableDocTypes(),
        fetchAvailableCategories()
      ])
        .then(([courts, docTypes, categories]) => {
          setAvailableCourts(courts);
          setAvailableDocTypes(docTypes);
          setAvailableCategories(categories);
        })
        .finally(() => setLoadingFilters(false));
    }
  }, [searchType]);

  const getOptions = (key: string): string[] => {
    const values = cases
      .map(c => (c.data_json as any)[key])
      .filter((val): val is string => typeof val === 'string' && val.length > 0);
    return Array.from<string>(new Set(values)).sort();
  };

  // Для классического поиска берем значения из текущих результатов
  const courts = searchType === 'semantic' ? availableCourts : getOptions('court');
  const judges = getOptions('judge');
  const results = searchType === 'semantic' ? availableDocTypes : getOptions('issue_result');

  return (
    <div className="bg-[#1c1c1e] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl">
      {/* Показываем подсказку для семантического поиска */}
      {searchType === 'semantic' && (
        <div className="mb-6 p-3 bg-[#0A84FF]/10 border border-[#0A84FF]/20 rounded-xl">
          <p className="text-xs text-[#86868b]">
            <span className="text-[#0A84FF] font-semibold">Семантический поиск:</span> доступны фильтры по дате, суду, типу документа и категориям
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <FilterSelect 
          label="Суд" 
          value={filters.court} 
          onChange={(v) => onFilterChange('court', v)} 
          options={courts}
          loading={searchType === 'semantic' && loadingFilters}
        />
        
        {/* Судья - только для классического поиска */}
        {searchType === 'classic' && (
          <FilterSelect 
            label="Судья" 
            value={filters.judge} 
            onChange={(v) => onFilterChange('judge', v)} 
            options={judges} 
          />
        )}

        <FilterSelect 
          label={searchType === 'semantic' ? 'Тип документа' : 'Результат'}
          value={filters.result} 
          onChange={(v) => onFilterChange('result', v)} 
          options={results}
          loading={searchType === 'semantic' && loadingFilters}
        />
        
        {/* Стороны - только для классического поиска */}
        {searchType === 'classic' && (
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
        )}

        {/* Категория дела - для семантического поиска */}
        {searchType === 'semantic' && (
          <FilterSelect 
            label="Категория дела" 
            value={filters.category} 
            onChange={(v) => onFilterChange('category', v)} 
            options={availableCategories}
            loading={loadingFilters}
          />
        )}
      </div>

      {/* Вторая строка для дат */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="flex flex-col space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-[#86868b] font-semibold pl-1">Дата вынесения</label>
          <div className="grid grid-cols-2 gap-3">
            <input 
              type="date" 
              className="w-full bg-black/30 border border-white/10 text-white rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#0A84FF] transition-all"
              value={filters.dateIssueFrom}
              onChange={(e) => onFilterChange('dateIssueFrom', e.target.value)}
              placeholder="От"
            />
            <input 
              type="date" 
              className="w-full bg-black/30 border border-white/10 text-white rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#0A84FF] transition-all"
              value={filters.dateIssueTo}
              onChange={(e) => onFilterChange('dateIssueTo', e.target.value)}
              placeholder="До"
            />
          </div>
        </div>
        
        {/* Чекбокс "Вступило в силу" - только для классического поиска */}
        {searchType === 'classic' && (
          <div className="flex flex-col justify-end">
            <label className="flex items-center space-x-3 cursor-pointer group p-3 rounded-lg hover:bg-white/5 transition-colors">
              <input 
                type="checkbox" 
                checked={filters.inForceOnly}
                onChange={(e) => onFilterChange('inForceOnly', e.target.checked)}
                className="appearance-none w-5 h-5 border border-white/20 rounded bg-black/30 checked:bg-[#0A84FF] checked:border-[#0A84FF] transition-all cursor-pointer"
              />
              <span className="text-sm text-[#d1d1d6] group-hover:text-white transition-colors">Вступило в силу</span>
            </label>
          </div>
        )}
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

const FilterSelect = ({ 
  label, 
  value, 
  onChange, 
  options, 
  loading = false 
}: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  options: string[];
  loading?: boolean;
}) => (
  <div className="flex flex-col space-y-2">
    <label className="text-[10px] uppercase tracking-widest text-[#86868b] font-semibold pl-1">{label}</label>
    <div className="relative">
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="w-full appearance-none bg-black/30 border border-white/10 text-white rounded-lg py-2.5 pl-3 pr-8 text-sm focus:outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">{loading ? 'Загрузка...' : 'Все'}</option>
        {!loading && options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#86868b]">
        {loading ? (
          <span className="w-4 h-4 border-2 border-[#86868b]/30 border-t-[#86868b] rounded-full animate-spin inline-block" />
        ) : (
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
    </div>
  </div>
);

export default FilterPanel;