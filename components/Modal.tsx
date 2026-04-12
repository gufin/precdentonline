import React, { useEffect, useRef, useState } from 'react';
import { CaseRecord, AIAnalysisResult, CaseMetadataResponse } from '../types';
import { XIcon, SparklesIcon, FileTextIcon } from './Icons';
import { fetchCaseText, fetchCaseMetadata, startRecognition, pollRecognitionStatus } from '../services/api';
import { useTheme } from '../ThemeContext';

interface ModalProps {
  data: CaseRecord | null;
  onClose: () => void;
  query: string;
}

type AIAnalysisState =
  | { status: 'idle' }
  | { status: 'loading'; message: string }
  | { status: 'success'; data: AIAnalysisResult }
  | { status: 'error'; error: string };

const Modal: React.FC<ModalProps> = ({ data, onClose, query }) => {
  const { t } = useTheme();
  const modalRef = useRef<HTMLDivElement>(null);
  const [fullText, setFullText] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<CaseMetadataResponse | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisState>({ status: 'idle' });

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

  const loadMetadata = async (caseNumber: string) => {
    setLoadingMetadata(true);
    try {
      const result = await fetchCaseMetadata(caseNumber);
      if (result.found && result.metadata) {
        setMetadata(result);
      }
    } catch (error) {
      console.error('Failed to load metadata:', error);
    } finally {
      setLoadingMetadata(false);
    }
  };

  const handleStartAIAnalysis = async () => {
    const textToAnalyze = fullText !== null ? fullText : content_act;

    if (!textToAnalyze || textToAnalyze.trim().length === 0) {
      setAiAnalysis({ status: 'error', error: 'Полный текст решения недоступен для анализа' });
      return;
    }

    if (loadingText) {
      setAiAnalysis({ status: 'error', error: 'Дождитесь загрузки полного текста документа' });
      return;
    }

    setAiAnalysis({ status: 'loading', message: 'Анализируем решение...' });

    try {
      const requestID = await startRecognition(textToAnalyze);

      const result = await pollRecognitionStatus(requestID, (progress) => {
        setAiAnalysis({ status: 'loading', message: `Анализируем решение... ${progress}%` });
      });

      setAiAnalysis({ status: 'success', data: result });
    } catch (error) {
      console.error('AI Analysis error:', error);
      setAiAnalysis({
        status: 'error',
        error: error instanceof Error ? error.message : 'Не удалось выполнить AI-анализ'
      });
    }
  };

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

      setAiAnalysis({ status: 'idle' });

      if (data.case_number) {
        loadMetadata(data.case_number);
      }

      if (data.semanticData && data.case_number) {
        loadFullText(data.case_number);
      } else {
        setFullText(null);
        setLoadingText(false);
        setTextError(null);
      }
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
      setFullText(null);
      setMetadata(null);
      setTextError(null);
    };
  }, [data, onClose]);

  if (!data) return null;

  const { data_json, content_act, case_number } = data;
  const displayText = fullText !== null ? fullText : content_act;

  const highlightText = (text: string) => {
    if (!query) return <>{text}</>;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase()
            ? <mark key={i} className={`${t.highlightBg} ${t.highlightText} rounded-sm px-0.5`}>{part}</mark>
            : <React.Fragment key={i}>{part}</React.Fragment>
        )}
      </>
    );
  };

  const progressValue = aiAnalysis.status === 'loading'
    ? parseInt(aiAnalysis.message.match(/\d+/)?.[0] || '0')
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className={`absolute inset-0 ${t.modalOverlay} transition-opacity duration-300`}
        onClick={onClose}
      />

      <div
        ref={modalRef}
        className={`relative ${t.modalBg} w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl shadow-black/20 rounded-3xl border ${t.modalBorder} animate-in fade-in zoom-in-95 duration-300 overflow-hidden`}
      >
        {/* Header */}
        <div className={`flex justify-between items-start p-6 md:p-8 border-b ${t.modalHeaderBorder} ${t.modalHeaderBg} sticky top-0 z-10`}>
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2">
              <span className={`px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold ${t.modalBadgeBg} ${t.modalBadgeText} rounded-full shadow-[0_0_10px_rgba(0,0,0,0.15)]`}>
                {data_json.issue_result || 'Решение'}
              </span>
              <span className={`text-[11px] uppercase tracking-widest ${t.modalDateText} font-medium`}>
                {data_json.date_issue}
              </span>
            </div>
            <h2 className={`text-2xl md:text-3xl font-bold ${t.modalCaseText} tracking-tight leading-none`}>
              {case_number}
            </h2>
            <p className={`text-sm ${t.modalCourtText} font-medium`}>{data_json.court}</p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 ${t.modalCloseBtn} ${t.modalCloseBtnHover} rounded-full transition-colors`}
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">

          {/* AI Analysis Section */}
          {aiAnalysis.status !== 'idle' && (
            <div className={`p-6 ${t.aiSectionBg} rounded-2xl border ${t.aiSectionBorder}`}>
              <div className="flex items-center space-x-2 mb-4">
                <SparklesIcon className={`w-5 h-5 ${t.aiIconText}`} />
                <h3 className={`text-lg font-semibold ${t.aiTitle}`}>AI-анализ решения</h3>
              </div>

              {/* Loading */}
              {aiAnalysis.status === 'loading' && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="relative w-16 h-16 mb-4">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none"
                        className={t.aiProgressTrack} />
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - progressValue / 100)}`}
                        className={`${t.aiProgressFill} transition-all duration-300`}
                        strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`${t.aiProgressLabel} font-bold text-sm`}>{progressValue}%</span>
                    </div>
                  </div>
                  <p className={`text-sm ${t.aiLoadingText}`}>{aiAnalysis.message}</p>
                </div>
              )}

              {/* Error */}
              {aiAnalysis.status === 'error' && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-900/20 border border-red-500/30 text-red-200 rounded-xl">
                    <p className="text-sm">{aiAnalysis.error}</p>
                  </div>
                  <button
                    onClick={handleRetryAIAnalysis}
                    className={`px-4 py-2 ${t.aiRetryBg} text-white text-sm font-semibold rounded-lg ${t.aiRetryHover} transition-colors`}
                  >
                    Повторить попытку
                  </button>
                </div>
              )}

              {/* Success */}
              {aiAnalysis.status === 'success' && (
                <div className="space-y-6">
                  {aiAnalysis.data.summary && (
                    <div className={`p-4 ${t.aiSummaryBg} border ${t.aiSummaryBorder} rounded-xl`}>
                      <h4 className={`text-xs uppercase tracking-widest ${t.aiSummaryLabel} mb-2 font-semibold`}>
                        📋 Супер-краткая фабула дела
                      </h4>
                      <p className={`text-sm ${t.aiSummaryText} leading-relaxed whitespace-pre-wrap`}>
                        {aiAnalysis.data.summary}
                      </p>
                    </div>
                  )}

                  {aiAnalysis.data.arguments && (
                    <div className={`p-4 ${t.aiArgsBg} border ${t.aiArgsBorder} rounded-xl`}>
                      <h4 className={`text-xs uppercase tracking-widest ${t.aiArgsLabel} mb-2 font-semibold`}>
                        ⚖️ Позиции и доводы сторон
                      </h4>
                      <p className={`text-sm ${t.aiArgsText} leading-relaxed whitespace-pre-wrap`}>
                        {aiAnalysis.data.arguments}
                      </p>
                    </div>
                  )}

                  {aiAnalysis.data.reasoning && (
                    <div className={`p-4 ${t.aiArgsBg} border ${t.aiArgsBorder} rounded-xl`}>
                      <h4 className={`text-xs uppercase tracking-widest ${t.aiArgsLabel} mb-2 font-semibold`}>
                        🔍 Мотивировка суда
                      </h4>
                      <p className={`text-sm ${t.aiArgsText} leading-relaxed whitespace-pre-wrap`}>
                        {aiAnalysis.data.reasoning}
                      </p>
                    </div>
                  )}

                  {aiAnalysis.data.resolution && (
                    <div className="p-4 bg-[#30d158]/10 border border-[#30d158]/30 rounded-xl">
                      <h4 className="text-xs uppercase tracking-widest text-[#30d158] mb-2 font-semibold">
                        ✅ Резолютивная часть
                      </h4>
                      <div
                        className={`text-sm ${t.aiSummaryText} leading-relaxed whitespace-pre-wrap`}
                        dangerouslySetInnerHTML={{
                          __html: aiAnalysis.data.resolution.replace(
                            /\*\*(.+?)\*\*/g,
                            '<strong class="text-[#30d158] font-bold text-base">$1</strong>'
                          )
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sides */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-5 ${t.modalSidesBg} rounded-2xl border ${t.modalSidesBorder}`}>
            <div>
              <h4 className={`text-[10px] uppercase tracking-widest ${t.modalSidesLabel} mb-2 font-semibold`}>Истец</h4>
              {loadingMetadata ? (
                <div className={`text-sm ${t.modalSidesLoading}`}>Загрузка...</div>
              ) : (
                <ul className={`text-sm font-medium ${t.modalSidesValue} space-y-1`}>
                  {(metadata?.metadata.sides?.Plaintiffs || data_json.sides?.Plaintiffs)?.map((s, i) => (
                    <li key={i}>{s.name}</li>
                  )) || <li>—</li>}
                </ul>
              )}
            </div>
            <div>
              <h4 className={`text-[10px] uppercase tracking-widest ${t.modalSidesLabel} mb-2 font-semibold`}>Ответчик</h4>
              {loadingMetadata ? (
                <div className={`text-sm ${t.modalSidesLoading}`}>Загрузка...</div>
              ) : (
                <ul className={`text-sm font-medium ${t.modalSidesValue} space-y-1`}>
                  {(metadata?.metadata.sides?.Defendants || data_json.sides?.Defendants)?.map((s, i) => (
                    <li key={i}>{s.name}</li>
                  )) || <li>—</li>}
                </ul>
              )}
            </div>
          </div>

          {/* Text Body */}
          <div className={`prose ${t.modalBodyProse} prose-sm max-w-none ${t.modalBodyText} leading-relaxed`}>
            {loadingText ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center space-y-3">
                  <div className={`w-8 h-8 border-2 ${t.aiProgressTrack} border-t-current rounded-full animate-spin`} style={{ borderTopColor: 'currentColor' }} />
                  <p className={`text-sm ${t.aiLoadingText}`}>Загрузка полного текста документа...</p>
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
        <div className={`p-5 border-t ${t.modalFooterBorder} flex justify-between items-center ${t.modalFooterBg} sticky bottom-0`}>
          {!data.semanticData ? (
            <a
              href={data_json.url || '#'}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center space-x-2 text-sm font-medium ${t.modalOriginalLink} ${t.modalOriginalLinkHover} transition-colors`}
            >
              <FileTextIcon className="w-4 h-4" />
              <span>Оригинал документа</span>
            </a>
          ) : (
            <div />
          )}

          <button
            onClick={handleStartAIAnalysis}
            disabled={aiAnalysis.status === 'loading'}
            className={`flex items-center space-x-2 px-5 py-2.5 ${t.aiActionBg} ${t.aiActionText} text-sm font-semibold rounded-full shadow-lg ${t.aiActionHover} transition-all duration-200 ${t.aiActionDisabled}`}
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
