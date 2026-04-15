import React, { useState, useEffect, useRef } from 'react';
import { FilterState, CaseRecord } from '../types';
import { useTheme } from '../ThemeContext';

interface FilterPanelProps {
  isOpen: boolean;
  filters: FilterState;
  cases: CaseRecord[];
  onFilterChange: (key: keyof FilterState, value: string | boolean) => void;
  onApply: () => void;
  onReset: () => void;
  searchType?: 'semantic' | 'classic';
  hasSemanticResults?: boolean;
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
  hasSemanticResults = false,
  cachedCourts = [],
  cachedDocTypes = [],
  cachedCategories = [],
  loadingFilterOptions = false,
}) => {
  const { t } = useTheme();

  const getOptions = (key: string): string[] => {
    const values = cases
      .map(c => (c.data_json as Record<string, unknown>)[key])
      .filter((val): val is string => typeof val === 'string' && val.length > 0);
    return Array.from<string>(new Set(values)).sort();
  };

  const courts = (searchType === 'semantic' && !hasSemanticResults) ? cachedCourts : getOptions('court');
  const judges = getOptions('judge');
  const results = (searchType === 'semantic' && !hasSemanticResults) ? cachedDocTypes : getOptions('issue_result');
  const loading = searchType === 'semantic' && !hasSemanticResults && loadingFilterOptions;

  return (
    <div className={`${t.filterPanelBg} border ${t.filterPanelBorder} rounded-3xl p-6 md:p-8 shadow-2xl`}>
      {searchType === 'semantic' && hasSemanticResults && (
        <div className={`mb-6 p-3 ${t.filterInfoClsBg} border ${t.filterInfoClsBorder} rounded-xl`}>
          <p className={`text-xs ${t.filterInfoClsText}`}>
            <span className={`${t.filterInfoClsLabel} font-semibold`}>Поиск в найденном:</span> фильтры применяются к {cases.length} найденным результатам без нового семантического запроса
          </p>
        </div>
      )}

      {searchType === 'semantic' && !hasSemanticResults && (
        <div className={`mb-6 p-3 ${t.filterInfoSemBg} border ${t.filterInfoSemBorder} rounded-xl`}>
          <p className={`text-xs ${t.filterInfoSemText}`}>
            <span className={`${t.filterInfoSemAccent} font-semibold`}>Семантический поиск:</span> доступны фильтры по дате, суду, типу документа и категориям
          </p>
        </div>
      )}

      {searchType === 'classic' && (
        <div className={`mb-6 p-3 ${t.filterInfoClsBg} border ${t.filterInfoClsBorder} rounded-xl`}>
          <p className={`text-xs ${t.filterInfoClsText}`}>
            <span className={`${t.filterInfoClsLabel} font-semibold`}>Поиск в найденном:</span> фильтры применяются к уже найденным результатам без нового запроса
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
            <label className={`text-[10px] uppercase tracking-widest ${t.filterFieldLabel} font-semibold pl-1`}>Стороны</label>
            <input
              type="text"
              value={filters.side}
              onChange={(e) => onFilterChange('side', e.target.value)}
              placeholder="Сбербанк..."
              className={`w-full ${t.filterInputBg} border ${t.filterInputBorder} ${t.filterInputText} rounded-lg py-2.5 px-3 text-sm focus:outline-none ${t.filterInputFocusBorder} ${t.filterInputFocusRing} transition-all ${t.filterInputPlaceholder}`}
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
          <label className={`text-[10px] uppercase tracking-widest ${t.filterFieldLabel} font-semibold pl-1`}>Дата вынесения</label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              className={`w-full ${t.filterInputBg} border ${t.filterInputBorder} ${t.filterInputText} rounded-lg py-2.5 px-3 text-sm focus:outline-none ${t.filterInputFocusBorder} transition-all`}
              value={filters.dateIssueFrom}
              onChange={(e) => onFilterChange('dateIssueFrom', e.target.value)}
            />
            <input
              type="date"
              className={`w-full ${t.filterInputBg} border ${t.filterInputBorder} ${t.filterInputText} rounded-lg py-2.5 px-3 text-sm focus:outline-none ${t.filterInputFocusBorder} transition-all`}
              value={filters.dateIssueTo}
              onChange={(e) => onFilterChange('dateIssueTo', e.target.value)}
            />
          </div>
        </div>

        {searchType === 'classic' && (
          <div className="flex flex-col justify-end">
            <label className={`flex items-center space-x-3 cursor-pointer group p-3 rounded-lg ${t.filterHoverBg} transition-colors`}>
              <input
                type="checkbox"
                checked={filters.inForceOnly}
                onChange={(e) => onFilterChange('inForceOnly', e.target.checked)}
                className={`appearance-none w-5 h-5 border ${t.filterCheckboxBorder} rounded ${t.filterCheckboxBg} ${t.filterCheckboxChecked} transition-all cursor-pointer`}
              />
              <span className={`text-sm ${t.filterCheckboxLabel} group-hover:opacity-100 transition-colors`}>Вступило в силу</span>
            </label>
          </div>
        )}
      </div>

      <div className={`flex justify-end items-center mt-8 space-x-4 border-t ${t.filterBorderTop} pt-6`}>
        <button
          onClick={onReset}
          className={`px-4 py-2 text-sm ${t.filterResetText} ${t.filterResetHover} transition-colors font-medium`}
        >
          Сбросить
        </button>
        <button
          onClick={onApply}
          className={`px-6 py-2 ${t.ctaBg} ${t.ctaText} text-sm font-semibold rounded-full ${t.ctaBgHover} transition-colors shadow-lg`}
        >
          {(searchType === 'classic' || hasSemanticResults) ? 'Готово' : 'Применить фильтры'}
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
  const { t } = useTheme();
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
      <label className={`text-[10px] uppercase tracking-widest ${t.filterFieldLabel} font-semibold pl-1`}>{label}</label>
      <div className="relative">
        <button
          type="button"
          disabled={loading}
          onClick={() => { if (!loading) setIsOpen(v => !v); }}
          className={`w-full flex items-center justify-between ${t.selectTriggerBg} border text-sm rounded-lg py-2.5 pl-3 pr-8 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            isOpen
              ? `${t.selectTriggerBorderOpen} ${t.selectTriggerRingOpen}`
              : t.selectTriggerBorderNormal
          }`}
        >
          <span className={value ? t.selectTriggerValueText : t.selectTriggerPlaceholderText}>
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
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </button>

        {isOpen && !loading && (
          <div className={`absolute z-50 w-full mt-1 ${t.selectDropdownBg} border ${t.selectDropdownBorder} rounded-xl shadow-2xl overflow-hidden`}>
            <div className={`p-2 border-b ${t.selectDropdownBorder}`}>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск по списку..."
                autoFocus
                onClick={e => e.stopPropagation()}
                className={`w-full px-3 py-2 ${t.selectSearchInputBg} border ${t.selectSearchInputBorder} ${t.selectSearchText} text-sm rounded-lg focus:outline-none ${t.selectSearchFocusBorder} ${t.selectSearchPlaceholder}`}
              />
            </div>
            <div className="max-h-52 overflow-y-auto py-1">
              <div
                className={`px-3 py-2 text-sm cursor-pointer transition-colors ${!value ? t.selectItemAllActive : t.selectItemAllInactive}`}
                onClick={() => { onChange(''); setIsOpen(false); setSearch(''); }}
              >
                Все
              </div>
              {filtered.length === 0 ? (
                <div className={`px-3 py-3 text-sm ${t.selectItemNotFound} italic text-center`}>Не найдено</div>
              ) : filtered.map(opt => (
                <div
                  key={opt}
                  className={`px-3 py-2 text-sm cursor-pointer transition-colors ${value === opt ? t.selectItemSelected : t.selectItemNormal}`}
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
