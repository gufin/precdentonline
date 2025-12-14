import React, { useState, useEffect, useMemo } from 'react';
import { SearchIcon, ChevronDown, FilterIcon } from './components/Icons';
import { fetchTotalCount, searchCases } from './services/api';
import { CaseRecord, FilterState, SortOption } from './types';
import ResultCard from './components/ResultCard';
import FilterPanel from './components/FilterPanel';
import Modal from './components/Modal';

const App: React.FC = () => {
  // State
  const [query, setQuery] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [totalCount, setTotalCount] = useState<string>('—');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data State
  const [allCases, setAllCases] = useState<CaseRecord[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  
  // UI State
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

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
      .catch((err) => {
        // Тихая обработка - просто показываем дефолт
        setTotalCount('—');
      });
  }, []);

  // Handlers
  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query && !caseNumber) return;

    setLoading(true);
    setError(null);
    setAllCases([]);
    setPage(1);

    try {
      const results = await searchCases(query, caseNumber);
      setAllCases(results);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при выполнении поиска';
      setError(errorMessage);
      setAllCases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
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

    // 1. Filter
    data = data.filter(item => {
      const j = item.data_json;
      if (filters.court && j.court !== filters.court) return false;
      if (filters.judge && j.judge !== filters.judge) return false;
      if (filters.result && j.issue_result !== filters.result) return false;
      
      if (filters.side) {
        const sideStr = JSON.stringify(j.sides).toLowerCase();
        if (!sideStr.includes(filters.side.toLowerCase())) return false;
      }
      return true; 
    });

    // 2. Sort
    data.sort((a, b) => {
      const dateA = a.data_json.date_issue?.split('.').reverse().join('') || '';
      const dateB = b.data_json.date_issue?.split('.').reverse().join('') || '';
      
      if (sortOption === 'date_desc') return dateB.localeCompare(dateA);
      if (sortOption === 'date_asc') return dateA.localeCompare(dateB);
      if (sortOption === 'court_asc') return (a.data_json.court || '').localeCompare(b.data_json.court || '');
      return 0;
    });

    return data;
  }, [allCases, filters, sortOption]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return processedData.slice(start, start + PAGE_SIZE);
  }, [processedData, page]);

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] selection:bg-[#0A84FF] selection:text-white font-sans antialiased">
      
      {/* --- HERO SECTION --- */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 transition-colors duration-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => window.location.reload()}>
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-black font-semibold font-serif text-lg shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-transform duration-500 group-hover:scale-105">
                  П
                </div>
                <div className="flex flex-col">
                  <h1 className="font-semibold text-lg tracking-tight text-white leading-none">Прецедент</h1>
                  <span className="text-[10px] uppercase tracking-wide text-[#86868b] mt-0.5">Поиск практики</span>
                </div>
             </div>
             
             <div className="hidden md:flex items-center space-x-8 text-xs font-medium text-[#86868b]">
                <div className="text-right">
                   <div className="uppercase tracking-widest text-[10px]">База данных</div>
                   <div className="text-white text-sm">{totalCount}</div>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="text-right">
                   <div className="uppercase tracking-widest text-[10px]">Найдено</div>
                   <div className="text-white text-sm">{loading ? '...' : processedData.length}</div>
                </div>
             </div>
          </div>

          <form onSubmit={handleSearch} className="relative w-full max-w-3xl mx-auto">
             <div className="flex flex-col md:flex-row bg-[#1c1c1e] rounded-2xl md:rounded-full p-2 border border-white/5 focus-within:ring-2 focus-within:ring-[#0A84FF]/50 focus-within:border-[#0A84FF]/50 transition-all duration-300 shadow-2xl">
                
                <div className="flex-grow relative border-b md:border-b-0 md:border-r border-white/5">
                  <input 
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ключевые слова"
                    className="w-full h-12 px-6 bg-transparent text-white placeholder-[#6e6e73] focus:outline-none rounded-t-xl md:rounded-l-full"
                  />
                </div>

                <div className="w-full md:w-1/3 relative border-b md:border-b-0 md:border-r border-white/5">
                   <input 
                    type="text"
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                    placeholder="Номер дела"
                    className="w-full h-12 px-6 bg-transparent text-white placeholder-[#6e6e73] focus:outline-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-white text-black px-6 h-12 rounded-xl md:rounded-full font-medium hover:bg-[#f5f5f7] disabled:opacity-50 transition-all duration-200 flex items-center justify-center space-x-2 mt-2 md:mt-0 md:ml-2 shadow-lg hover:shadow-white/10"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Найти</span>
                      <SearchIcon className="w-4 h-4" />
                    </>
                  )}
                </button>
             </div>

             <div className="flex justify-center mt-4">
                <button 
                  type="button"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className={`flex items-center space-x-1.5 text-xs font-medium tracking-wide transition-all duration-300 px-4 py-1.5 rounded-full ${filtersOpen ? 'bg-white/10 text-white' : 'text-[#86868b] hover:text-white'}`}
                >
                  <FilterIcon className="w-3 h-3" />
                  <span>Фильтры поиска</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${filtersOpen ? 'rotate-180' : ''}`} />
                </button>
             </div>
          </form>

        </div>
      </header>

      {/* --- FILTERS --- */}
      <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${filtersOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-2">
           <FilterPanel 
             isOpen={filtersOpen}
             filters={filters}
             cases={allCases}
             onFilterChange={handleFilterChange}
             onApply={() => handleSearch()} 
             onReset={handleResetFilters}
           />
        </div>
      </div>

      {/* --- RESULTS --- */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[60vh]">
        
        {/* Results Toolbar */}
        {allCases.length > 0 && (
          <div className="flex justify-between items-center mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <p className="text-sm text-[#86868b]">
              Показано {paginatedData.length} из {processedData.length} документов
            </p>
            <div className="flex items-center space-x-3">
              <span className="text-xs font-medium text-[#6e6e73]">Сортировка</span>
              <div className="relative group">
                <select 
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="appearance-none bg-[#1c1c1e] text-sm text-white pl-4 pr-8 py-1.5 rounded-lg border border-white/10 hover:border-[#0A84FF]/50 focus:outline-none focus:border-[#0A84FF] transition-colors cursor-pointer"
                >
                  <option value="date_desc">Сначала новые</option>
                  <option value="date_asc">Сначала старые</option>
                  <option value="court_asc">По суду (А-Я)</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#86868b] pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* State: Empty */}
        {!loading && allCases.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in duration-700">
             <div className="w-16 h-16 bg-[#1c1c1e] rounded-3xl flex items-center justify-center mb-6 shadow-2xl border border-white/5">
                <SearchIcon className="w-6 h-6 text-[#86868b]" />
             </div>
             <h3 className="text-2xl font-semibold text-white tracking-tight">Начните поиск</h3>
             <p className="text-[#86868b] mt-3 max-w-sm">Используйте ключевые слова, номера дел или расширенные фильтры для поиска по базе.</p>
          </div>
        )}

        {/* State: Error */}
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/30 text-red-200 text-center rounded-2xl backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
           {paginatedData.map((item, index) => (
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
                className="px-6 py-2.5 rounded-full bg-[#1c1c1e] border border-white/10 text-sm font-medium text-white hover:bg-[#2c2c2e] disabled:opacity-30 disabled:hover:bg-[#1c1c1e] transition-all"
              >
                Назад
              </button>
              <div className="flex items-center text-sm font-medium text-[#86868b]">
                 {page} <span className="mx-2 text-[#424245]">/</span> {Math.ceil(processedData.length / PAGE_SIZE)}
              </div>
              <button 
                disabled={page * PAGE_SIZE >= processedData.length}
                onClick={() => setPage(p => p + 1)}
                className="px-6 py-2.5 rounded-full bg-[#1c1c1e] border border-white/10 text-sm font-medium text-white hover:bg-[#2c2c2e] disabled:opacity-30 disabled:hover:bg-[#1c1c1e] transition-all"
              >
                Вперед
              </button>
           </div>
        )}
      </main>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/5 mt-auto py-12 bg-black">
        <div className="max-w-6xl mx-auto px-4 text-center">
           <p className="text-[11px] text-[#424245] uppercase tracking-widest">
             © {new Date().getFullYear()} Прецедент • Юрайт
           </p>
        </div>
      </footer>

      {/* --- MODAL --- */}
      <Modal 
        data={selectedCase} 
        onClose={() => setSelectedCase(null)} 
        query={query}
      />

    </div>
  );
};

export default App;