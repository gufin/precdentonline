import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SearchIcon, ChevronDown, FilterIcon } from './components/Icons';
import { fetchTotalCount, searchCases, semanticSearch, fetchAvailableCourts, fetchAvailableDocTypes, fetchAvailableCategories } from './services/api';
import { CaseRecord, FilterState, SortOption } from './types';
import ResultCard from './components/ResultCard';
import FilterPanel from './components/FilterPanel';
import Modal from './components/Modal';
import { ThemeProvider, useTheme } from './ThemeContext';

const COURT_SEARCH_PARAM_NAMES = [
  'court',
  'courtName',
  'court_name',
  'selectedCourt',
];

const DEFAULT_TRUSTED_EMBED_MESSAGE_ORIGINS = [
  'https://allcourts.you-right.ru',
];

type EmbedMessageCommand = 'openFilters' | 'setCourtName';

type ParsedEmbedMessage = {
  type: EmbedMessageCommand;
  courtName: string | null;
};

type InitialEmbedParams = {
  requestedFiltersOpen: boolean;
  courtName: string | null;
};

const TRUSTED_EMBED_MESSAGE_ORIGINS = new Set([
  ...DEFAULT_TRUSTED_EMBED_MESSAGE_ORIGINS,
  ...((import.meta.env.VITE_ALLOWED_EMBED_ORIGINS as string | undefined) || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean),
]);

const normalizeCourtName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[«»"']/g, '')
    .replace(/[.,()]/g, ' ')
    .replace(/\s+/g, ' ');

const firstString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return null;
};

const getCourtNameFromPayload = (record: Record<string, unknown>) => {
  const directCourtName = firstString(
    record.court,
    record.courtName,
    record.court_name,
    record.selectedCourt,
    record.name
  );

  if (directCourtName) {
    return directCourtName;
  }

  const nestedCourt = record.court ?? record.selectedCourt;
  if (nestedCourt && typeof nestedCourt === 'object') {
    const nestedRecord = nestedCourt as Record<string, unknown>;
    return firstString(nestedRecord.name, nestedRecord.title, nestedRecord.courtName);
  }

  return null;
};

const getCourtNameFromSearch = (search: string) => {
  const params = new URLSearchParams(search);
  for (const paramName of COURT_SEARCH_PARAM_NAMES) {
    const value = params.get(paramName);
    if (value?.trim()) {
      return value.trim();
    }
  }
  return null;
};

const getInitialEmbedParams = (search: string): InitialEmbedParams => {
  const params = new URLSearchParams(search);
  return {
    requestedFiltersOpen: params.get('embed') === 'true' && params.get('openFilters') === '1',
    courtName: getCourtNameFromSearch(search),
  };
};

const getEmbedMessage = (data: unknown): ParsedEmbedMessage | null => {
  let payload = data;

  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      return null;
    }
  }

  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const type = record.type;
  if (type !== 'openFilters' && type !== 'setCourtName') {
    return null;
  }

  return {
    type,
    courtName: getCourtNameFromPayload(record),
  };
};

const resolveCourtName = (incomingCourtName: string, availableCourts: string[]) => {
  const trimmedCourtName = incomingCourtName.trim();
  if (!trimmedCourtName || availableCourts.length === 0) {
    return trimmedCourtName;
  }

  const normalizedIncomingCourtName = normalizeCourtName(trimmedCourtName);

  return (
    availableCourts.find(court => normalizeCourtName(court) === normalizedIncomingCourtName) ||
    availableCourts.find(court => {
      const normalizedCourt = normalizeCourtName(court);
      return normalizedCourt.includes(normalizedIncomingCourtName) || normalizedIncomingCourtName.includes(normalizedCourt);
    }) ||
    trimmedCourtName
  );
};

const AppContent: React.FC = () => {
  const { t, isEmbed, isAllCourtsEmbed } = useTheme();
  const initialEmbedParams = useMemo(() => getInitialEmbedParams(window.location.search), []);

  // State
  const [query, setQuery] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [totalCount, setTotalCount] = useState<string>('—');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<'semantic' | 'classic'>('semantic');

  // Data State
  const [allCases, setAllCases] = useState<CaseRecord[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);

  // UI State
  const [filtersOpen, setFiltersOpen] = useState(initialEmbedParams.requestedFiltersOpen);
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  // Cached filter options for semantic search (loaded once on mount)
  const [cachedCourts, setCachedCourts] = useState<string[]>([]);
  const [cachedDocTypes, setCachedDocTypes] = useState<string[]>([]);
  const [cachedCategories, setCachedCategories] = useState<string[]>([]);
  const [loadingFilterOptions, setLoadingFilterOptions] = useState(false);
  const [incomingCourtName, setIncomingCourtName] = useState<string | null>(initialEmbedParams.courtName);
  const [embedUiReady, setEmbedUiReady] = useState(false);
  const [filtersMaxHeight, setFiltersMaxHeight] = useState(0);
  const [filtersAllowOverflow, setFiltersAllowOverflow] = useState(false);
  const lastAppliedIncomingCourtRef = useRef('');
  const pendingFiltersOpenRef = useRef(initialEmbedParams.requestedFiltersOpen);
  const filtersContentRef = useRef<HTMLDivElement>(null);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    court: '', judge: '', category: '', result: '', level: '', side: '',
    dateIssueFrom: '', dateIssueTo: '', dateEntryFrom: '', dateEntryTo: '',
    inForceOnly: false
  });

  // Initialization
  useEffect(() => {
    fetchTotalCount()
      .then(setTotalCount)
      .catch(() => setTotalCount('—'));

    setLoadingFilterOptions(true);
    Promise.all([
      fetchAvailableCourts(),
      fetchAvailableDocTypes(),
      fetchAvailableCategories(),
    ])
      .then(([courts, docTypes, categories]) => {
        setCachedCourts(courts);
        setCachedDocTypes(docTypes);
        setCachedCategories(categories);
      })
      .finally(() => setLoadingFilterOptions(false));
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => setEmbedUiReady(true));
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const updateFiltersLayout = () => {
    const nextHeight = filtersContentRef.current?.scrollHeight ?? 0;
    setFiltersMaxHeight(prev => (prev === nextHeight ? prev : nextHeight));
  };

  const openFiltersPanel = () => {
    pendingFiltersOpenRef.current = false;
    setFiltersAllowOverflow(false);
    setFiltersOpen(prev => (prev ? prev : true));
  };

  const hasSemanticResults = searchType === 'semantic' && allCases.length > 0;

  // AllCourts iframe integration: prefill the semantic search court filter.
  useEffect(() => {
    if (!incomingCourtName) return;

    const resolvedCourtName = resolveCourtName(incomingCourtName, cachedCourts);
    if (!resolvedCourtName) return;

    setSearchType('semantic');
    setFilters(prev => {
      const lastAppliedCourt = lastAppliedIncomingCourtRef.current;
      if (lastAppliedCourt && prev.court && prev.court !== lastAppliedCourt) {
        return prev;
      }

      lastAppliedIncomingCourtRef.current = resolvedCourtName;
      if (prev.court === resolvedCourtName) {
        return prev;
      }

      return { ...prev, court: resolvedCourtName };
    });
  }, [cachedCourts, incomingCourtName]);

  useEffect(() => {
    if (!isEmbed) {
      return;
    }

    const handleEmbedMessage = (event: MessageEvent) => {
      if (!TRUSTED_EMBED_MESSAGE_ORIGINS.has(event.origin)) {
        return;
      }

      const message = getEmbedMessage(event.data);
      if (!message) {
        return;
      }

      if (message.courtName) {
        setIncomingCourtName(message.courtName);
      }

      if (message.type === 'openFilters') {
        pendingFiltersOpenRef.current = true;
        if (embedUiReady) {
          openFiltersPanel();
        }
      }
    };

    window.addEventListener('message', handleEmbedMessage);
    return () => window.removeEventListener('message', handleEmbedMessage);
  }, [embedUiReady, isEmbed]);

  useEffect(() => {
    if (!isEmbed || !embedUiReady || !pendingFiltersOpenRef.current) {
      return;
    }

    openFiltersPanel();
  }, [embedUiReady, isEmbed, loadingFilterOptions, searchType]);

  useEffect(() => {
    if (!filtersOpen) {
      setFiltersAllowOverflow(false);
      setFiltersMaxHeight(0);
      return;
    }

    updateFiltersLayout();

    const rafId = window.requestAnimationFrame(() => {
      updateFiltersLayout();
    });

    const observer = typeof ResizeObserver === 'undefined' || !filtersContentRef.current
      ? null
      : new ResizeObserver(() => {
          updateFiltersLayout();
        });

    if (observer && filtersContentRef.current) {
      observer.observe(filtersContentRef.current);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      observer?.disconnect();
    };
  }, [filtersOpen, loadingFilterOptions, searchType, hasSemanticResults, filters.court, filters.result, filters.category]);

  // Embed mode setup: apply html class for scrollbar override, hide Bitrix24
  useEffect(() => {
    if (isEmbed) {
      document.documentElement.classList.add('theme-light');
    }
    if (isAllCourtsEmbed) {
      document.documentElement.classList.add('theme-allcourts');
    }
    return () => {
      document.documentElement.classList.remove('theme-light');
      document.documentElement.classList.remove('theme-allcourts');
    };
  }, [isEmbed, isAllCourtsEmbed]);

  // Handlers
  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();

    setLoading(true);
    setError(null);
    setAllCases([]);
    setPage(1);

    try {
      if (searchType === 'semantic') {
        if (!query.trim()) {
          setError('Для семантического поиска необходимо ввести текстовый запрос');
          setLoading(false);
          return;
        }

        const searchFilters: Record<string, unknown> = {
          date_from: filters.dateIssueFrom || undefined,
          date_to: filters.dateIssueTo || undefined,
          court: filters.court || undefined,
          doctype: filters.result || undefined,
        };

        if (filters.category && filters.category.trim()) {
          searchFilters.categories = [filters.category.trim()];
        }

        const cleanFilters = Object.fromEntries(
          Object.entries(searchFilters).filter(([, v]) => {
            if (v === undefined || v === '') return false;
            if (Array.isArray(v) && v.length === 0) return false;
            return true;
          })
        ) as Record<string, unknown>;

        const results = await semanticSearch({
          query: query.trim(),
          limit: 100,
          min_score: 0.5,
          filters: Object.keys(cleanFilters).length > 0 ? cleanFilters : null,
        });
        setAllCases(results);
        setError(null);
      } else {
        if (!query.trim() && !caseNumber.trim()) {
          setError('Введите текст запроса или номер дела');
          setLoading(false);
          return;
        }

        const results = await searchCases(query.trim(), caseNumber.trim());
        setAllCases(results);
        setError(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при выполнении поиска';
      setError(errorMessage);
      setAllCases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      court: '', judge: '', category: '', result: '', level: '', side: '',
      dateIssueFrom: '', dateIssueTo: '', dateEntryFrom: '', dateEntryTo: '',
      inForceOnly: false
    });
  };

  // Derived Data (Filtering & Sorting)
  const processedData = useMemo(() => {
    let data = [...allCases];

    data = data.filter(item => {
      const j = item.data_json;

      if (searchType === 'classic') {
        if (filters.court && j.court !== filters.court) return false;
        if (filters.judge && j.judge !== filters.judge) return false;
        if (filters.result && j.issue_result !== filters.result) return false;

        if (filters.side) {
          const sideStr = JSON.stringify(j.sides ?? '').toLowerCase();
          if (!sideStr.includes(filters.side.toLowerCase())) return false;
        }

        if (filters.dateIssueFrom || filters.dateIssueTo) {
          const raw = j.date_issue ?? '';
          const parts = raw.split('.');
          const iso = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : '';
          if (iso) {
            if (filters.dateIssueFrom && iso < filters.dateIssueFrom) return false;
            if (filters.dateIssueTo && iso > filters.dateIssueTo) return false;
          }
        }

        if (filters.inForceOnly && !j.date_of_entry) return false;
      } else {
        // Semantic: все фильтры применяются на клиенте к уже загруженным результатам
        if (filters.court && j.court !== filters.court) return false;
        if (filters.result && j.issue_result !== filters.result) return false;
        if (filters.category && !(j.case_category_2 || '').toLowerCase().includes(filters.category.toLowerCase())) return false;

        if (filters.dateIssueFrom || filters.dateIssueTo) {
          const raw = j.date_issue ?? '';
          const parts = raw.split('.');
          const iso = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : '';
          if (iso) {
            if (filters.dateIssueFrom && iso < filters.dateIssueFrom) return false;
            if (filters.dateIssueTo && iso > filters.dateIssueTo) return false;
          }
        }

        if (filters.judge && j.judge !== filters.judge) return false;
        if (filters.side) {
          const sideStr = JSON.stringify(j.sides ?? '').toLowerCase();
          if (!sideStr.includes(filters.side.toLowerCase())) return false;
        }
      }

      return true;
    });

    data.sort((a, b) => {
      if (a.semanticData && b.semanticData && sortOption === 'date_desc') {
        const dateA = a.data_json.date_issue?.split('.').reverse().join('') || '';
        const dateB = b.data_json.date_issue?.split('.').reverse().join('') || '';
        return dateB.localeCompare(dateA);
      }

      const dateA = a.data_json.date_issue?.split('.').reverse().join('') || '';
      const dateB = b.data_json.date_issue?.split('.').reverse().join('') || '';

      if (sortOption === 'date_desc') return dateB.localeCompare(dateA);
      if (sortOption === 'date_asc') return dateA.localeCompare(dateB);
      if (sortOption === 'court_asc') return (a.data_json.court || '').localeCompare(b.data_json.court || '');
      return 0;
    });

    return data;
  }, [allCases, filters, sortOption, searchType]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return processedData.slice(start, start + PAGE_SIZE);
  }, [processedData, page]);

  return (
    <div className={`min-h-screen ${t.pageBg} ${t.pageText} ${t.selection} font-sans antialiased`}>

      {/* --- HEADER / SEARCH --- */}
      <header className={`${isEmbed ? '' : 'sticky top-0 z-40'} ${t.headerBg} transition-colors duration-500`}>
        <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 ${isAllCourtsEmbed ? 'py-5' : isEmbed ? 'py-4 pt-6' : 'py-4'}`}>

          {/* Branding row — hidden in embed mode */}
          {!isEmbed && (
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => window.location.reload()}>
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-black font-semibold font-serif text-lg shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-transform duration-500 group-hover:scale-105">
                  П
                </div>
                <div className="flex flex-col">
                  <h1 className="font-semibold text-lg tracking-tight text-white leading-none">Прецедент</h1>
                  <span className={`text-[10px] uppercase tracking-wide ${t.statsLabelText} mt-0.5`}>Поиск практики</span>
                </div>
              </div>

              <div className={`hidden md:flex items-center space-x-8 text-xs font-medium ${t.statsLabelText}`}>
                <div className="text-right">
                  <div className={`uppercase tracking-widest text-[10px] ${t.statsLabelText}`}>База данных</div>
                  <div className={`${t.statsValueText} text-sm`}>{totalCount}</div>
                </div>
                <div className={`w-px h-6 ${t.statsDividerBg}`} />
                <div className="text-right">
                  <div className={`uppercase tracking-widest text-[10px] ${t.statsLabelText}`}>Найдено</div>
                  <div className={`${t.statsValueText} text-sm`}>{loading ? '...' : processedData.length}</div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSearch} className="relative w-full max-w-3xl mx-auto">

            {/* Search type toggle */}
            <div className="flex flex-col items-center mb-4 space-y-2">
              <div className={`inline-flex ${t.toggleContainerBg} rounded-full p-1 border ${t.toggleContainerBorder}`}>
                <button
                  type="button"
                  onClick={() => {
                    setSearchType('semantic');
                    setError(null);
                    setAllCases([]);
                    setFiltersOpen(false);
                    setCaseNumber('');
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    searchType === 'semantic' ? t.toggleActive : t.toggleInactive
                  }`}
                >
                  Семантический поиск
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchType('classic');
                    setError(null);
                    setAllCases([]);
                    setFiltersOpen(false);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    searchType === 'classic' ? t.toggleActive : t.toggleInactive
                  }`}
                >
                  Классический поиск
                </button>
              </div>
              {searchType === 'semantic' && (
                <p className={`text-xs ${t.toggleHintText} text-center max-w-md`}>
                  Умный поиск по смыслу — находит релевантные решения даже без точных совпадений
                </p>
              )}
              {searchType === 'classic' && (
                <p className={`text-xs ${t.toggleHintText} text-center max-w-md`}>
                  Традиционный поиск по ключевым словам и номерам дел.
                </p>
              )}
            </div>

            <div className={`flex flex-col md:flex-row ${t.searchFormBg} rounded-2xl md:rounded-full p-2 border ${t.searchFormBorder} ${t.searchFormFocusRing} transition-all duration-300 shadow-2xl`}>

              <div className={`flex-grow relative border-b md:border-b-0 md:border-r ${t.searchDividerBorder}`}>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchType === 'semantic' ? 'Текстовый запрос (например: контрагент не оплатил поставку)' : 'Ключевые слова'}
                  className={`w-full h-12 px-6 bg-transparent ${t.inputText} ${t.inputPlaceholder} focus:outline-none rounded-t-xl md:rounded-l-full`}
                />
              </div>

              {searchType === 'classic' && (
                <div className={`w-full md:w-1/3 relative border-b md:border-b-0 md:border-r ${t.searchDividerBorder}`}>
                  <input
                    type="text"
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                    placeholder="Номер дела"
                    className={`w-full h-12 px-6 bg-transparent ${t.inputText} ${t.inputPlaceholder} focus:outline-none`}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`${t.ctaBg} ${t.ctaText} px-6 h-12 rounded-xl md:rounded-full font-medium ${t.ctaBgHover} disabled:opacity-50 transition-all duration-200 flex items-center justify-center space-x-2 mt-2 md:mt-0 md:ml-2 shadow-lg`}
              >
                {loading ? (
                  <span className={`w-4 h-4 border-2 ${t.ctaSpinner} rounded-full animate-spin`} />
                ) : (
                  <>
                    <span>Найти</span>
                    <SearchIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {(searchType === 'semantic' || allCases.length > 0) && (
              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className={`flex items-center space-x-1.5 text-xs font-medium tracking-wide transition-all duration-300 px-4 py-1.5 rounded-full ${filtersOpen ? t.filterToggleActive : t.filterToggleClosed}`}
                >
                  <FilterIcon className="w-3 h-3" />
                  <span>{hasSemanticResults || searchType === 'classic' ? 'Искать в найденном' : 'Фильтры поиска'}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${filtersOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
          </form>

        </div>
      </header>

      {/* --- FILTERS --- */}
      <div
        className={`${filtersAllowOverflow ? 'overflow-visible' : 'overflow-hidden'} transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${filtersOpen ? 'opacity-100' : 'opacity-0'}`}
        style={{ maxHeight: filtersOpen ? `${filtersMaxHeight}px` : '0px' }}
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget || event.propertyName !== 'max-height') {
            return;
          }

          if (filtersOpen) {
            updateFiltersLayout();
            setFiltersAllowOverflow(true);
          }
        }}
      >
        <div ref={filtersContentRef} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-2">
          <FilterPanel
            isOpen={filtersOpen}
            filters={filters}
            cases={allCases}
            onFilterChange={handleFilterChange}
            onApply={hasSemanticResults || searchType === 'classic' ? () => setFiltersOpen(false) : () => handleSearch()}
            onReset={handleResetFilters}
            searchType={searchType}
            hasSemanticResults={hasSemanticResults}
            cachedCourts={cachedCourts}
            cachedDocTypes={cachedDocTypes}
            cachedCategories={cachedCategories}
            loadingFilterOptions={loadingFilterOptions}
          />
        </div>
      </div>

      {/* --- RESULTS --- */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[60vh]">

        {/* Results Toolbar */}
        {allCases.length > 0 && (
          <div className="flex justify-between items-center mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <p className={`text-sm ${t.resultsCountText}`}>
              Показано {paginatedData.length} из {processedData.length} документов
            </p>
            <div className="flex items-center space-x-3">
              <span className={`text-xs font-medium ${t.sortLabelText}`}>Сортировка</span>
              <div className="relative group">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className={`appearance-none ${t.sortBg} text-sm ${t.sortText} pl-4 pr-8 py-1.5 rounded-lg border ${t.sortBorder} ${t.sortHoverBorder} focus:outline-none ${t.sortFocusBorder} transition-colors cursor-pointer`}
                >
                  <option value="date_desc">Сначала новые</option>
                  <option value="date_asc">Сначала старые</option>
                  <option value="court_asc">По суду (А-Я)</option>
                </select>
                <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 ${t.resultsCountText} pointer-events-none`} />
              </div>
            </div>
          </div>
        )}

        {/* State: Empty */}
        {!loading && allCases.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in duration-700">
            <div className={`w-16 h-16 ${t.emptyIconBg} rounded-3xl flex items-center justify-center mb-6 shadow-2xl border ${t.cardBorder}`}>
              <SearchIcon className={`w-6 h-6 ${t.emptyIconColor}`} />
            </div>
            <h3 className={`text-2xl font-semibold ${t.emptyTitleText} tracking-tight`}>Начните поиск</h3>
            <p className={`${t.emptyDescText} mt-3 max-w-sm`}>Используйте ключевые слова, номера дел или расширенные фильтры для поиска по базе.</p>
          </div>
        )}

        {/* State: Error */}
        {error && (
          <div className="p-5 bg-red-900/20 border border-red-500/30 text-red-200 rounded-2xl backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <div className="font-semibold mb-2 text-red-100">Ошибка {searchType === 'semantic' ? 'семантического' : ''} поиска</div>
                <div className="text-sm leading-relaxed mb-3">{error}</div>
                {error.includes('недоступен') && searchType === 'semantic' && (
                  <div className="mt-3 pt-3 border-t border-red-500/20">
                    <div className="text-xs text-red-300/80 mb-2">
                      <strong>Что делать:</strong>
                    </div>
                    <ul className="text-xs text-red-300/70 space-y-1 list-disc list-inside">
                      <li>Убедитесь, что сервис семантического поиска запущен</li>
                      <li>Проверьте настройки подключения в конфигурации</li>
                      <li>Или переключитесь на <button
                        onClick={() => { setSearchType('classic'); setError(null); }}
                        className="underline hover:text-red-100 font-medium"
                      >классический поиск</button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {paginatedData.map((item) => (
            <ResultCard
              key={item.id || item.case_number}
              data={item}
              query={query}
              onClick={() => setSelectedCase(item)}
            />
          ))}
        </div>

        {/* Pagination */}
        {processedData.length > PAGE_SIZE && (
          <div className="flex justify-center mt-16 space-x-4">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className={`px-6 py-2.5 rounded-full ${t.paginBtnBg} border ${t.paginBtnBorder} text-sm font-medium ${t.paginBtnText} ${t.paginBtnHover} disabled:opacity-30 transition-all`}
            >
              Назад
            </button>
            <div className={`flex items-center text-sm font-medium ${t.paginCurrentText}`}>
              {page} <span className={`mx-2 ${t.paginDividerText}`}>/</span> {Math.ceil(processedData.length / PAGE_SIZE)}
            </div>
            <button
              disabled={page * PAGE_SIZE >= processedData.length}
              onClick={() => setPage(p => p + 1)}
              className={`px-6 py-2.5 rounded-full ${t.paginBtnBg} border ${t.paginBtnBorder} text-sm font-medium ${t.paginBtnText} ${t.paginBtnHover} disabled:opacity-30 transition-all`}
            >
              Вперед
            </button>
          </div>
        )}
      </main>

      {/* --- SEO CONTENT SECTION — hidden in embed mode --- */}
      {!isEmbed && (
        <section className={`border-t ${t.seoBorderTop} ${t.seoBg}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="prose prose-invert prose-lg max-w-none">
              <h1 className={`text-[2.6rem] font-bold ${t.seoH1Text} tracking-tight mb-8 leading-tight`}>
                Поиск и анализ судебной практики — онлайн-сервис с ИИ
              </h1>

              <p className={`text-lg ${t.seoBodyText} leading-relaxed mb-12`}>
                Ищете судебную практику для работы? Наш сервис — это профессиональный инструмент для юристов. Он дает доступ к экспертно подобранной базе судебных решений по гражданским, административным и уголовным делам. Вы тратите минуты вместо часов на рутинный поиск.
              </p>

              <h2 className={`text-[2rem] font-semibold ${t.seoH1Text} tracking-tight mb-6 mt-16`}>
                Где и как найти судебную практику? Крупнейший онлайн-банк дел
              </h2>

              <p className={`text-lg ${t.seoBodyText} leading-relaxed mb-6`}>
                Проблема не в отсутствии информации, а в умении ее найти и применить. Наш архив — это свод более 30 000 проверенных судебных актов в одном месте. Вам больше не нужно открывать десятки вкладок в браузере.
              </p>

              <p className={`text-lg ${t.seoBodyText} leading-relaxed mb-4`}>
                <strong className={`${t.seoStrongText} font-semibold`}>Самый полный архив судебных актов в одном месте</strong><br />
                Мы агрегируем решения судов общей юрисдикции, включая практику Верховного Суда РФ. База постоянно обновляется — вы видите актуальную картину и изменения в судебных подходах.
              </p>

              <p className={`text-lg ${t.seoBodyText} leading-relaxed mb-12`}>
                <strong className={`${t.seoStrongText} font-semibold`}>Два мощных способа поиска: семантический и классический</strong><br />
                Вы можете искать по смыслу. Сформулируйте запрос так, как думаете: «взыскание убытков при расторжении договора». Искусственный интеллект (ИИ) поймет контекст и найдет релевантные дела.
              </p>

              <h2 className={`text-[2rem] font-semibold ${t.seoH1Text} tracking-tight mb-6 mt-16`}>
                Глубокий анализ судебной практики и решений
              </h2>

              <p className={`text-lg ${t.seoBodyText} leading-relaxed mb-6`}>
                Найти дело — это половина задачи. Вторая половина — понять, как его использовать в своей ситуации.
              </p>

              <h2 className={`text-[2rem] font-semibold ${t.seoH1Text} tracking-tight mb-6 mt-16`}>
                Специальный поиск и картотека дел с точными фильтрами
              </h2>

              <ul className={`text-lg ${t.seoBodyText} leading-relaxed mb-12 space-y-2 list-disc list-inside ml-4`}>
                <li>Суд: выберите конкретную инстанцию или регион.</li>
                <li>Судья: найдите все дела по фамилии судьи.</li>
                <li>Результат: фильтруйте по удовлетворенным/отклоненным искам.</li>
                <li>Стороны дела: ищите по названию компании или ФИО участника.</li>
                <li>Дата: укажите диапазон, чтобы найти свежие или исторические прецеденты.</li>
              </ul>

              <h2 className={`text-[2rem] font-semibold ${t.seoH1Text} tracking-tight mb-6 mt-16`}>
                Ключевые преимущества нашей справочно-правовой системы (СПС)
              </h2>

              <ol className={`text-lg ${t.seoBodyText} leading-relaxed mb-12 space-y-3 list-decimal list-inside ml-4`}>
                <li>Углубленный анализ правовой практики.</li>
                <li>Актуальная база с изменениями в одном месте.</li>
                <li>Быстрый поиск прецедентов и нормативных актов.</li>
                <li>Проверка гипотез и эффективная подготовка.</li>
                <li>Работайте откуда угодно.</li>
              </ol>

              <p className={`text-lg ${t.seoBodyText} leading-relaxed`}>
                Используйте онлайн-сервис по самой полной базе, чтобы находить, анализировать и побеждать.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* --- FOOTER — hidden in embed mode --- */}
      {!isEmbed && (
        <footer className={`border-t ${t.footerBorderTop} mt-auto py-12 ${t.footerBg}`}>
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className={`text-[11px] ${t.footerText} uppercase tracking-widest`}>
              © {new Date().getFullYear()} Прецедент • Юрайт
            </p>
          </div>
        </footer>
      )}

      {/* --- MODAL --- */}
      <Modal
        data={selectedCase}
        onClose={() => setSelectedCase(null)}
        query={query}
      />

    </div>
  );
};

const App: React.FC = () => (
  <ThemeProvider>
    <AppContent />
  </ThemeProvider>
);

export default App;
