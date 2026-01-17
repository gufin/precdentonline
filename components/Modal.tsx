import React, { useEffect, useRef, useState } from 'react';
import { CaseRecord, AIAnalysisResult } from '../types';
import { XIcon, SparklesIcon, FileTextIcon } from './Icons';
import { fetchCaseText, startRecognition, pollRecognitionStatus } from '../services/api';

interface ModalProps {
  data: CaseRecord | null;
  onClose: () => void;
  query: string;
}

// Тип состояния AI-анализа
type AIAnalysisState =
  | { status: 'idle' }
  | { status: 'loading'; message: string }
  | { status: 'success'; data: AIAnalysisResult }
  | { status: 'error'; error: string };

const Modal: React.FC<ModalProps> = ({ data, onClose, query }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [fullText, setFullText] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisState>({ status: 'idle' });

  // Безопасная функция для отображения значений (строка или объект)
  const safeRender = (value: any): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return '';
  };

  const loadFullText = async (caseNumber: string) => {
    setLoadingText(true);
    setTextError(null);
    try {
      const result = await fetchCaseText(caseNumber);
      if (result.found && result.text) {
        setFullText(result.text);
      } else {
        setTextError('Полный текст документа не найден');
      }
    } catch (error) {
      console.error('Failed to load full text:', error);
      setTextError(error instanceof Error ? error.message : 'Не удалось загрузить полный текст');
    } finally {
      setLoadingText(false);
    }
  };

  // Обработчик запуска AI-анализа
  const handleStartAIAnalysis = async () => {
    // Проверяем наличие текста для анализа
    const textToAnalyze = fullText !== null ? fullText : content_act;
    
    if (!textToAnalyze || textToAnalyze.trim().length === 0) {
      setAiAnalysis({
        status: 'error',
        error: 'Полный текст решения недоступен для анализа'
      });
      return;
    }

    // Если текст еще загружается, показываем ошибку
    if (loadingText) {
      setAiAnalysis({
        status: 'error',
        error: 'Дождитесь загрузки полного текста документа'
      });
      return;
    }

    // Запускаем анализ
    setAiAnalysis({
      status: 'loading',
      message: 'Анализируем решение...'
    });

    try {
      // Запускаем анализ и получаем requestID
      const requestID = await startRecognition(textToAnalyze);
      
      // Начинаем polling для получения результата
      const result = await pollRecognitionStatus(requestID, (progress) => {
        setAiAnalysis({
          status: 'loading',
          message: `Анализируем решение... ${progress}%`
        });
      });

      // Устанавливаем успешный результат
      setAiAnalysis({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('AI Analysis error:', error);
      setAiAnalysis({
        status: 'error',
        error: error instanceof Error ? error.message : 'Не удалось выполнить AI-анализ'
      });
    }
  };

  // Обработчик повторной попытки
  const handleRetryAIAnalysis = () => {
    handleStartAIAnalysis();
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (data) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
      
      // Сбрасываем состояние AI-анализа при открытии новой карточки
      setAiAnalysis({ status: 'idle' });
      
      // Если это семантический поиск (есть semanticData), загружаем полный текст
      if (data.semanticData && data.case_number) {
        loadFullText(data.case_number);
      } else {
        // Для классического поиска используем content_act как есть
        setFullText(null);
        setLoadingText(false);
        setTextError(null);
      }
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
      setFullText(null);
      setTextError(null);
    };
  }, [data, onClose]);

  if (!data) return null;

  const { data_json, content_act, case_number } = data;
  
  // Используем полный текст, если загружен, иначе используем content_act
  const displayText = fullText !== null ? fullText : content_act;

  const highlightText = (text: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-[#0A84FF]/20 text-[#0A84FF] rounded-sm px-0.5">{part}</mark> 
        : part
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300" 
        onClick={onClose}
      />
      
      <div 
        ref={modalRef}
        className="relative bg-[#1c1c1e] w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl shadow-black rounded-3xl border border-white/10 animate-in fade-in zoom-in-95 duration-300 overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-start p-6 md:p-8 border-b border-white/5 bg-[#1c1c1e]/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="space-y-2">
             <div className="inline-flex items-center space-x-2">
                <span className="px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-[#0A84FF] text-white rounded-full shadow-[0_0_10px_rgba(10,132,255,0.4)]">
                  {data_json.issue_result || 'Решение'}
                </span>
                <span className="text-[11px] uppercase tracking-widest text-[#86868b] font-medium">
                  {data_json.date_issue}
                </span>
             </div>
             <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-none">
               {case_number}
             </h2>
             <p className="text-sm text-[#a1a1a6] font-medium">{data_json.court}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-[#86868b] hover:text-white"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-hide">
          
          {/* AI Analysis Section - показываем в начале */}
          {aiAnalysis.status !== 'idle' && (
            <div className="p-6 bg-black/30 rounded-2xl border border-[#0A84FF]/20">
              <div className="flex items-center space-x-2 mb-4">
                <SparklesIcon className="w-5 h-5 text-[#0A84FF]" />
                <h3 className="text-lg font-semibold text-white">AI-анализ решения</h3>
              </div>

              {/* Loading State */}
              {aiAnalysis.status === 'loading' && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="relative w-16 h-16 mb-4">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-[#0A84FF]/20"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - parseInt(aiAnalysis.message.match(/\d+/)?.[0] || '0') / 100)}`}
                        className="text-[#0A84FF] transition-all duration-300"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {aiAnalysis.message.match(/\d+/)?.[0] || '0'}%
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-[#86868b]">{aiAnalysis.message}</p>
                </div>
              )}

              {/* Error State */}
              {aiAnalysis.status === 'error' && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-900/20 border border-red-500/30 text-red-200 rounded-xl">
                    <p className="text-sm">{aiAnalysis.error}</p>
                  </div>
                  <button
                    onClick={handleRetryAIAnalysis}
                    className="px-4 py-2 bg-[#0A84FF] text-white text-sm font-semibold rounded-lg hover:bg-[#0071e3] transition-colors"
                  >
                    Повторить попытку
                  </button>
                </div>
              )}

              {/* Success State - Display Results */}
              {aiAnalysis.status === 'success' && (
                <div className="space-y-6">
                  {/* Фабула дела */}
                  {aiAnalysis.data.супер_краткая_фабула_дела && (
                    <div className="p-4 bg-[#0A84FF]/10 border border-[#0A84FF]/30 rounded-xl">
                      <h4 className="text-xs uppercase tracking-widest text-[#0A84FF] mb-2 font-semibold">
                        Супер-краткая фабула дела
                      </h4>
                      <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
                        {aiAnalysis.data.супер_краткая_фабула_дела}
                      </p>
                    </div>
                  )}

                  {/* Позиции сторон */}
                  {aiAnalysis.data.позиции_и_доводы_сторон && (
                    <div>
                      <h4 className="text-xs uppercase tracking-widest text-[#86868b] mb-3 font-semibold">
                        Позиции и доводы сторон
                      </h4>
                      <div className="space-y-3">
                        {aiAnalysis.data.позиции_и_доводы_сторон.истец && (
                          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                            <h5 className="text-sm font-semibold text-white mb-2">Истец</h5>
                            <p className="text-sm text-[#d1d1d6] leading-relaxed whitespace-pre-wrap">
                              {aiAnalysis.data.позиции_и_доводы_сторон.истец}
                            </p>
                          </div>
                        )}
                        {aiAnalysis.data.позиции_и_доводы_сторон.ответчик && (
                          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                            <h5 className="text-sm font-semibold text-white mb-2">Ответчик</h5>
                            <p className="text-sm text-[#d1d1d6] leading-relaxed whitespace-pre-wrap">
                              {aiAnalysis.data.позиции_и_доводы_сторон.ответчик}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Мотивировка суда */}
                  {aiAnalysis.data.мотивировка_суда && (
                    <div>
                      <h4 className="text-xs uppercase tracking-widest text-[#86868b] mb-3 font-semibold">
                        Мотивировка суда
                      </h4>
                      <div className="space-y-3">
                        {typeof aiAnalysis.data.мотивировка_суда === 'object' ? (
                          <>
                            {aiAnalysis.data.мотивировка_суда.ключевые_причины && (
                              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                <h5 className="text-xs uppercase tracking-widest text-[#86868b] mb-2 font-semibold">
                                  Ключевые причины
                                </h5>
                                <p className="text-sm text-[#d1d1d6] leading-relaxed whitespace-pre-wrap">
                                  {aiAnalysis.data.мотивировка_суда.ключевые_причины}
                                </p>
                              </div>
                            )}
                            {aiAnalysis.data.мотивировка_суда.нормы_права && (
                              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                <h5 className="text-xs uppercase tracking-widest text-[#86868b] mb-2 font-semibold">
                                  Нормы права
                                </h5>
                                <p className="text-sm text-[#d1d1d6] leading-relaxed whitespace-pre-wrap">
                                  {aiAnalysis.data.мотивировка_суда.нормы_права}
                                </p>
                              </div>
                            )}
                            {aiAnalysis.data.мотивировка_суда.отклонение_доводов && (
                              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                <h5 className="text-xs uppercase tracking-widest text-[#86868b] mb-2 font-semibold">
                                  Отклонение доводов
                                </h5>
                                <p className="text-sm text-[#d1d1d6] leading-relaxed whitespace-pre-wrap">
                                  {aiAnalysis.data.мотивировка_суда.отклонение_доводов}
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                            <p className="text-sm text-[#d1d1d6] leading-relaxed whitespace-pre-wrap">
                              {aiAnalysis.data.мотивировка_суда}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Резолютивная часть */}
                  {aiAnalysis.data.резолютивная_часть && (
                    <div>
                      <h4 className="text-xs uppercase tracking-widest text-[#86868b] mb-3 font-semibold">
                        Резолютивная часть
                      </h4>
                      <div className="p-4 bg-[#30d158]/10 border border-[#30d158]/30 rounded-xl space-y-3">
                        {/* Результат */}
                        {aiAnalysis.data.резолютивная_часть.результат && (
                          <div>
                            <p className="text-xs uppercase tracking-widest text-[#30d158] mb-1 font-semibold">
                              Результат
                            </p>
                            <p className="text-sm text-white font-medium whitespace-pre-wrap">
                              {aiAnalysis.data.резолютивная_часть.результат}
                            </p>
                          </div>
                        )}

                        {/* Суммы */}
                        {aiAnalysis.data.резолютивная_часть.суммы && (
                          <div>
                            <p className="text-xs uppercase tracking-widest text-[#86868b] mb-2 font-semibold">
                              Суммы
                            </p>
                            <div className="space-y-1">
                              {Object.entries(aiAnalysis.data.резолютивная_часть.суммы).map(([label, amount]) => (
                                <div key={label} className="flex justify-between items-baseline gap-4">
                                  <span className="text-xs text-[#86868b] capitalize">{label.replace(/_/g, ' ')}:</span>
                                  <span className="text-sm text-[#d1d1d6] font-medium text-right">
                                    {amount}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Другие действия */}
                        {aiAnalysis.data.резолютивная_часть.другие_действия && (
                          <div className="pt-2 border-t border-white/10">
                            <p className="text-xs text-[#86868b] leading-relaxed whitespace-pre-wrap">
                              {aiAnalysis.data.резолютивная_часть.другие_действия}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sides */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-black/20 rounded-2xl border border-white/5">
             <div>
                <h4 className="text-[10px] uppercase tracking-widest text-[#86868b] mb-2 font-semibold">Истец</h4>
                <ul className="text-sm font-medium text-white space-y-1">
                  {data_json.sides?.Plaintiffs?.map((s, i) => (
                    <li key={i}>{s.name}</li>
                  )) || '—'}
                </ul>
             </div>
             <div>
                <h4 className="text-[10px] uppercase tracking-widest text-[#86868b] mb-2 font-semibold">Ответчик</h4>
                <ul className="text-sm font-medium text-white space-y-1">
                  {data_json.sides?.Defendants?.map((s, i) => (
                    <li key={i}>{s.name}</li>
                  )) || '—'}
                </ul>
             </div>
          </div>

          {/* Text Body */}
          <div className="prose prose-invert prose-sm max-w-none text-[#d1d1d6] leading-relaxed">
            {loadingText ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-8 h-8 border-2 border-[#0A84FF]/30 border-t-[#0A84FF] rounded-full animate-spin" />
                  <p className="text-sm text-[#86868b]">Загрузка полного текста документа...</p>
                </div>
              </div>
            ) : textError ? (
              <div className="p-4 bg-red-900/20 border border-red-500/30 text-red-200 rounded-xl">
                <p className="text-sm">{textError}</p>
                {data.semanticData && (
                  <p className="text-xs mt-2 text-red-300/70">
                    Показан фрагмент из результатов поиска. Полный текст может быть доступен по ссылке "Оригинал документа".
                  </p>
                )}
              </div>
            ) : (
              <p className="whitespace-pre-wrap font-light text-[15px]">{highlightText(displayText)}</p>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-white/5 flex justify-between items-center bg-[#1c1c1e]/90 backdrop-blur-md sticky bottom-0">
          <a 
            href={data_json.url || '#'} 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center space-x-2 text-sm font-medium text-[#86868b] hover:text-white transition-colors"
          >
            <FileTextIcon className="w-4 h-4" />
            <span>Оригинал документа</span>
          </a>

          <button 
            onClick={handleStartAIAnalysis}
            disabled={aiAnalysis.status === 'loading'}
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#0A84FF] text-white text-sm font-semibold rounded-full shadow-lg shadow-blue-500/20 hover:bg-[#0071e3] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SparklesIcon className="w-4 h-4" />
            <span>AI Анализ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;