import React, { useState, useEffect, useRef } from 'react';
import { FilterState, CaseRecord } from '../types';

interface FilterPanelProps {
  isOpen: boolean;
  filters: FilterState;
  cases: CaseRecord[];
  onFilterChange: (key: keyof FilterState, value: any) => void;
  onApply: () => void;
  onReset: () => void;
  searchType?: 'semantic' | 'classic';
  // Кэшированные опции из App.tsx (загружаются один раз при маунте)
  cachedCourts?: string[];
  cachedDocTypes?: string[];
  cachedCategories?: string[];
  loadingFilterOptions?: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  filters,
  cases,
  onFilterChange,
  onApply,
  onReset,
  searchType = 'classic',
  cachedCourts = [],
  cachedDocTypes = [],
  cachedCategories = [],
  loadingFilterOptions = false,
}) => {
  const getOptions = (key: string): string[] => {
    const values = cases
      .map(c => (c.data_json as any)[key])
      .filter((val): val is string => typeof val === 'string' && val.length > 0);
    return Array.from<string>(new Set(values)).sort();
  };

  const courts = searchType === 'semantic' ? cachedCourts : getOptions('court');
  const judges = getOptions('judge');
  const results = searchType === 'semantic' ? cachedDocTypes : getOptions('issue_result');
  const loading = searchType === 'semantic' && loadingFilterOptions;

  return (
    <div className="bg-[#1c1c1e] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl">
      {searchType === 'semantic' && (
        <div className="mb-6 p-3 bg-[#0A84FF]/10 border border-[#0A84FF]/20 rounded-xl">
          <p className="text-xs text-[#86868b]">
            <span className="text-[#0A84FF] font-semibold">Семантический поиск:</span> доступны фильтры по дате, суду, типу документа и категориям
          </p>
        </div>
      )}

      {searchType === 'classic' && (
        <div className="mb-6 p-3 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-xs text-[#86868b]">
            <span className="text-white font-semibold">Поиск в найденном:</span> фильтры применяются к уже найденным результатам без нового запроса
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SearchableSelect
          label="Суд"
          value={filters.court}
          onChange={(v) => onFilterChange('court', v)}
          options={courts}
          loading={loading}
        />

        {searchType === 'classic' && (
          <SearchableSelect
            label="Судья"
            value={filters.judge}
            onChange={(v) => onFilterChange('judge', v)}
            options={judges}
          />
        )}

        <SearchableSelect
          label={searchType === 'semantic' ? 'Тип документа' : 'Результат'}
          value={filters.result}
          onChange={(v) => onFilterChange('result', v)}
          options={results}
          loading={loading}
        />

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

        {searchType === 'semantic' && (
          <SearchableSelect
            label="Категория дела"
            value={filters.category}
            onChange={(v) => onFilterChange('category', v)}
            options={cachedCategories}
            loading={loading}
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="flex flex-col space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-[#86868b] font-semibold pl-1">Дата вынесения</label>
          <div className="grid grid-cols-2 gap-3">
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
          {searchType === 'classic' ? 'Готово' : 'Применить фильтры'}
        </button>
      </div>
    </div>
  );
};

const SearchableSelect = ({
  label,
  value,
  onChange,
  options,
  loading = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  loading?: boolean;
}) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const filtered = options.filter(
    o => !search || o.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col space-y-2" ref={containerRef}>
      <label className="text-[10px] uppercase tracking-widest text-[#86868b] font-semibold pl-1">{label}</label>
      <div className="relative">
        <button
          type="button"
          disabled={loading}
          onClick={() => { if (!loading) setIsOpen(v => !v); }}
          className={`w-full flex items-center justify-between bg-black/30 border text-sm rounded-lg py-2.5 pl-3 pr-8 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            isOpen ? 'border-[#0A84FF] ring-1 ring-[#0A84FF]' : 'border-white/10 hover:border-white/20'
          }`}
        >
          <span className={value ? 'text-white' : 'text-[#6e6e73]'}>
            {loading ? 'Загрузка...' : (value || 'Все')}
          </span>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#86868b]">
            {loading ? (
              <span className="w-4 h-4 border-2 border-[#86868b]/30 border-t-[#86868b] rounded-full animate-spin inline-block" />
            ) : (
              <svg
                width="10" height="6" viewBox="0 0 10 6" fill="none"
                className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              >
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        </button>

        {isOpen && !loading && (
          <div className="absolute z-50 w-full mt-1 bg-[#2c2c2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-2 border-b border-white/5">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск по списку..."
                autoFocus
                onClick={e => e.stopPropagation()}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white text-sm rounded-lg focus:outline-none focus:border-[#0A84FF] placeholder-[#424245]"
              />
            </div>
            <div className="max-h-52 overflow-y-auto py-1">
              <div
                className={`px-3 py-2 text-sm cursor-pointer transition-colors ${!value ? 'text-white bg-white/5' : 'text-[#86868b] hover:bg-white/5 hover:text-white'}`}
                onClick={() => { onChange(''); setIsOpen(false); setSearch(''); }}
              >
                Все
              </div>
              {filtered.length === 0 ? (
                <div className="px-3 py-3 text-sm text-[#424245] italic text-center">Не найдено</div>
              ) : filtered.map(opt => (
                <div
                  key={opt}
                  className={`px-3 py-2 text-sm cursor-pointer transition-colors ${value === opt ? 'text-[#0A84FF] bg-[#0A84FF]/10' : 'text-white hover:bg-white/5'}`}
                  onClick={() => { onChange(opt); setIsOpen(false); setSearch(''); }}
                >
                  {opt}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;
