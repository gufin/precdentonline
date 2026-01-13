import React, { useEffect, useRef, useState } from 'react';
import { CaseRecord } from '../types';
import { XIcon, SparklesIcon, FileTextIcon } from './Icons';
import { fetchCaseText } from '../services/api';

interface ModalProps {
  data: CaseRecord | null;
  onClose: () => void;
  query: string;
}

const Modal: React.FC<ModalProps> = ({ data, onClose, query }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [fullText, setFullText] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);

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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (data) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
      
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

          <button className="flex items-center space-x-2 px-5 py-2.5 bg-[#0A84FF] text-white text-sm font-semibold rounded-full shadow-lg shadow-blue-500/20 hover:bg-[#0071e3] transition-all duration-200">
            <SparklesIcon className="w-4 h-4" />
            <span>AI Анализ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;