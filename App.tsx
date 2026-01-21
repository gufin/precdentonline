import React, { useState, useEffect, useMemo } from 'react';
import { SearchIcon, ChevronDown, FilterIcon } from './components/Icons';
import { fetchTotalCount, searchCases, semanticSearch } from './services/api';
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
  const [searchType, setSearchType] = useState<'semantic' | 'classic'>('semantic'); // Тип поиска
  
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
    
    setLoading(true);
    setError(null);
    setAllCases([]);
    setPage(1);

    try {
      if (searchType === 'semantic') {
        // Семантический поиск
        if (!query.trim()) {
          setError('Для семантического поиска необходимо ввести текстовый запрос');
          setLoading(false);
          return;
        }
        
        // Формируем фильтры для семантического поиска согласно API документации
        // input[type="date"] возвращает значения в формате YYYY-MM-DD (ISO 8601), что соответствует API
        const searchFilters: any = {
          date_from: filters.dateIssueFrom || undefined,
          date_to: filters.dateIssueTo || undefined,
          court: filters.court || undefined,
          doctype: filters.result || undefined,
        };
        
        // Добавляем категорию, если выбрана (передаем как массив согласно API)
        if (filters.category && filters.category.trim()) {
          searchFilters.categories = [filters.category.trim()];
        }
        
        // Убираем undefined и пустые значения
        const cleanFilters = Object.fromEntries(
          Object.entries(searchFilters).filter(([_, v]) => {
            if (v === undefined || v === '') return false;
            if (Array.isArray(v) && v.length === 0) return false;
            return true;
          })
        ) as any;
        
        const results = await semanticSearch({
          query: query.trim(),
          limit: 100,
          min_score: 0.5,
          filters: Object.keys(cleanFilters).length > 0 ? cleanFilters : null,
        });
        setAllCases(results);
        setError(null);
      } else {
        // Классический поиск
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
  // Примечание: при использовании семантического поиска фильтрация происходит на сервере,
  // но оставляем клиентскую фильтрацию для дополнительных фильтров (judge, side)
  const processedData = useMemo(() => {
    let data = [...allCases];

    // 1. Filter (только те фильтры, которые не поддерживаются сервером)
    data = data.filter(item => {
      const j = item.data_json;
      // court, result, date фильтры уже применены на сервере при семантическом поиске
      if (filters.judge && j.judge !== filters.judge) return false;
      
      if (filters.side) {
        const sideStr = JSON.stringify(j.sides).toLowerCase();
        if (!sideStr.includes(filters.side.toLowerCase())) return false;
      }
      return true; 
    });

    // 2. Sort
    data.sort((a, b) => {
      // При семантическом поиске можно сортировать по score
      if (a.semanticData && b.semanticData && sortOption === 'date_desc') {
        // По умолчанию семантический поиск возвращает отсортированные по релевантности
        // Но можно пересортировать по дате
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
             
             {/* Переключатель типа поиска */}
             <div className="flex flex-col items-center mb-4 space-y-2">
               <div className="inline-flex bg-[#1c1c1e] rounded-full p-1 border border-white/5">
                 <button
                   type="button"
                   onClick={() => {
                     setSearchType('semantic');
                     setError(null);
                     setAllCases([]);
                     setCaseNumber(''); // Очищаем номер дела при переключении на семантический поиск
                   }}
                   className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                     searchType === 'semantic'
                       ? 'bg-[#0A84FF] text-white shadow-lg shadow-blue-500/20'
                       : 'text-[#86868b] hover:text-white'
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
                   }}
                   className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                     searchType === 'classic'
                       ? 'bg-[#0A84FF] text-white shadow-lg shadow-blue-500/20'
                       : 'text-[#86868b] hover:text-white'
                   }`}
                 >
                   Классический поиск
                 </button>
               </div>
              {searchType === 'semantic' && (
                <p className="text-xs text-[#86868b] text-center max-w-md">
                  Умный поиск по смыслу — находит релевантные решения даже без точных совпадений
                </p>
              )}
               {searchType === 'classic' && (
                 <p className="text-xs text-[#86868b] text-center max-w-md">
                   Традиционный поиск по ключевым словам и номерам дел.
                 </p>
               )}
             </div>

             <div className="flex flex-col md:flex-row bg-[#1c1c1e] rounded-2xl md:rounded-full p-2 border border-white/5 focus-within:ring-2 focus-within:ring-[#0A84FF]/50 focus-within:border-[#0A84FF]/50 transition-all duration-300 shadow-2xl">
                
                <div className="flex-grow relative border-b md:border-b-0 md:border-r border-white/5">
                  <input 
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchType === 'semantic' ? "Текстовый запрос (например: контрагент не оплатил поставку)" : "Ключевые слова"}
                    className="w-full h-12 px-6 bg-transparent text-white placeholder-[#6e6e73] focus:outline-none rounded-t-xl md:rounded-l-full"
                  />
                </div>

                {searchType === 'classic' && (
                  <div className="w-full md:w-1/3 relative border-b md:border-b-0 md:border-r border-white/5">
                     <input 
                      type="text"
                      value={caseNumber}
                      onChange={(e) => setCaseNumber(e.target.value)}
                      placeholder="Номер дела"
                      className="w-full h-12 px-6 bg-transparent text-white placeholder-[#6e6e73] focus:outline-none"
                    />
                  </div>
                )}

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
             searchType={searchType}
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
                        onClick={() => {
                          setSearchType('classic');
                          setError(null);
                        }}
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

      {/* --- SEO CONTENT SECTION --- */}
      <section className="border-t border-white/5 bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="prose prose-invert prose-lg max-w-none">
            <h1 className="text-[2.6rem] font-bold text-white tracking-tight mb-8 leading-tight">
              Поиск и анализ судебной практики — онлайн-сервис с ИИ
            </h1>

            <p className="text-lg text-[#86868b] leading-relaxed mb-12">
              Ищете судебную практику для работы? Наш сервис — это профессиональный инструмент для юристов. Он дает доступ к экспертно подобранной базе судебных решений по гражданским, административным и уголовным делам. Вы тратите минуты вместо часов на рутинный поиск.
            </p>

            <h2 className="text-[2rem] font-semibold text-white tracking-tight mb-6 mt-16">
              Где и как найти судебную практику? Крупнейший онлайн-банк дел
            </h2>

            <p className="text-lg text-[#86868b] leading-relaxed mb-6">
              Проблема не в отсутствии информации, а в умении ее найти и применить. Наш архив — это свод более 30 000 проверенных судебных актов в одном месте. Вам больше не нужно открывать десятки вкладок в браузере.
            </p>

            <p className="text-lg text-[#86868b] leading-relaxed mb-4">
              <strong className="text-white font-semibold">Самый полный архив судебных актов в одном месте</strong><br />
              Мы агрегируем решения судов общей юрисдикции, включая практику Верховного Суда РФ. База постоянно обновляется — вы видите актуальную картину и изменения в судебных подходах. Это не просто сборник документов, а структурированное хранилище и реестр для работы.
            </p>

            <p className="text-lg text-[#86868b] leading-relaxed mb-12">
              <strong className="text-white font-semibold">Два мощных способа поиска: семантический и классический</strong><br />
              Вы можете искать по смыслу. Сформулируйте запрос так, как думаете: «взыскание убытков при расторжении договора». Искусственный интеллект (ИИ) поймет контекст и найдет релевантные дела.
              <br /><br />
              Для точного поиска используйте классический вариант: по номеру дела или конкретной правовой норме, например, «неосновательное обогащение». Это особенно важно при подготовке конкретного иска или отзыва.
            </p>

            <h2 className="text-[2rem] font-semibold text-white tracking-tight mb-6 mt-16">
              Глубокий анализ судебной практики и решений
            </h2>

            <p className="text-lg text-[#86868b] leading-relaxed mb-6">
              Найти дело — это половина задачи. Вторая половина — понять, как его использовать в своей ситуации.
            </p>

            <p className="text-lg text-[#86868b] leading-relaxed mb-4">
              <strong className="text-white font-semibold">Правовой анализ для всех типов дел</strong><br />
              Система помогает быстро проводить анализ судебной практики. Вы сможете увидеть, как разные суды трактуют одну и ту же норму в гражданских, административных или уголовных делах. Это основа для правового анализа судебной практики и прогнозирования исхода вашего спора.
            </p>

            <p className="text-lg text-[#86868b] leading-relaxed mb-12">
              <strong className="text-white font-semibold">Анализ практики Верховного Суда РФ</strong><br />
              Отдельное внимание мы уделяем подбору решений ВС РФ. Это ключевые прецеденты, формирующие правоприменение. Быстрый доступ к ним экономит время на подготовку апелляционных и кассационных жалоб.
            </p>

            <h2 className="text-[2rem] font-semibold text-white tracking-tight mb-6 mt-16">
              Специальный поиск и картотека дел с точными фильтрами
            </h2>

            <p className="text-lg text-[#86868b] leading-relaxed mb-6">
              Точно настройте поиск под свою задачу, чтобы получить именно те примеры судебной практики, которые нужны.
            </p>

            <p className="text-lg text-[#86868b] leading-relaxed mb-4">
              <strong className="text-white font-semibold">Примеры расширенной фильтрации</strong><br />
              Используйте точные фильтры для специального поиска судебной практики:
            </p>

            <ul className="text-lg text-[#86868b] leading-relaxed mb-12 space-y-2 list-disc list-inside ml-4">
              <li>Суд: выберите конкретную инстанцию или регион.</li>
              <li>Судья: найдите все дела по фамилии судьи.</li>
              <li>Результат: фильтруйте по удовлетворенным/отклоненным искам.</li>
              <li>Стороны дела: ищите по названию компании или ФИО участника.</li>
              <li>Дата: укажите диапазон, чтобы найти свежие или исторические прецеденты.</li>
            </ul>

            <p className="text-lg text-[#86868b] leading-relaxed mb-12">
              В карточке каждого дела собрана вся ключевая информация для анализа судебного решения.
            </p>

            <h2 className="text-[2rem] font-semibold text-white tracking-tight mb-6 mt-16">
              Ключевые преимущества нашей справочно-правовой системы (СПС)
            </h2>

            <ol className="text-lg text-[#86868b] leading-relaxed mb-12 space-y-3 list-decimal list-inside ml-4">
              <li>Углубленный анализ правовой практики. Система помогает не просто найти, а понять логику суда и применить ее в своей работе.</li>
              <li>Актуальная база с изменениями в одном месте. Все обновления и новые решения автоматически попадают в систему. Вы работаете с текущей информацией.</li>
              <li>Быстрый поиск прецедентов и нормативных актов. Экономьте время на подготовке к заседаниям и составлении документов.</li>
              <li>Проверка гипотез и эффективная подготовка. Оценивайте перспективы спора и укрепляйте свою позицию проверенными примерами.</li>
              <li>Работайте откуда угодно. Полнофункциональный сервис доступен с компьютера, планшета или телефона. Ответ всегда под рукой.</li>
            </ol>

            <h2 className="text-[2rem] font-semibold text-white tracking-tight mb-6 mt-16">
              Наш сервис — это ваша профессиональная справочно-правовая система
            </h2>

            <p className="text-lg text-[#86868b] leading-relaxed mb-6">
              Это не маркетинговый слоган, а суть инструмента. Мы создали эту СПС, чтобы вы тратили время на стратегию и аргументы, а не на поиск информации. Библиотека судебных решений в вашем распоряжении.
            </p>

            <p className="text-lg text-[#86868b] leading-relaxed">
              Используйте онлайн-сервис по самой полной базе, чтобы находить, анализировать и побеждать.
            </p>
          </div>
        </div>
      </section>

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