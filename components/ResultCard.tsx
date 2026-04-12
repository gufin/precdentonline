import React from 'react';
import { CaseRecord } from '../types';
import { useTheme } from '../ThemeContext';

interface ResultCardProps {
  data: CaseRecord;
  query: string;
  onClick: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ data, query, onClick }) => {
  const { t } = useTheme();
  const { case_number, content_act, data_json, semanticData } = data;

  const previewText = semanticData?.snippet
    ? (semanticData.snippet.length > 300 ? semanticData.snippet.slice(0, 300) + '...' : semanticData.snippet)
    : (content_act.length > 300 ? content_act.slice(0, 300) + '...' : content_act);

  const renderHighlighted = (text: string) => {
    if (semanticData?.highlights && semanticData.highlights.length > 0) {
      const parts: Array<{ text: string; highlight: boolean }> = [];

      const sortedHighlights = [...semanticData.highlights].sort((a, b) => b.length - a.length);

      for (const highlight of sortedHighlights) {
        const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        const newParts: Array<{ text: string; highlight: boolean }> = [];

        for (const part of parts.length > 0 ? parts : [{ text, highlight: false }]) {
          if (part.highlight) {
            newParts.push(part);
            continue;
          }

          const matches = [...part.text.matchAll(regex)];
          if (matches.length === 0) {
            newParts.push(part);
            continue;
          }

          let lastIndex = 0;
          for (const match of matches) {
            if (match.index !== undefined) {
              if (match.index > lastIndex) {
                newParts.push({ text: part.text.slice(lastIndex, match.index), highlight: false });
              }
              newParts.push({ text: match[0], highlight: true });
              lastIndex = match.index + match[0].length;
            }
          }
          if (lastIndex < part.text.length) {
            newParts.push({ text: part.text.slice(lastIndex), highlight: false });
          }
        }

        parts.length = 0;
        parts.push(...newParts);
      }

      if (parts.length === 0) {
        parts.push({ text, highlight: false });
      }

      return (
        <>
          {parts.map((part, i) =>
            part.highlight ? (
              <span key={i} className={`${t.highlightText} font-medium ${t.highlightBg} rounded px-0.5`}>
                {part.text}
              </span>
            ) : (
              <React.Fragment key={i}>{part.text}</React.Fragment>
            )
          )}
        </>
      );
    }

    if (!query) return <>{text}</>;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase()
            ? <span key={i} className={`${t.highlightText} font-medium ${t.highlightBg} rounded px-0.5`}>{part}</span>
            : <React.Fragment key={i}>{part}</React.Fragment>
        )}
      </>
    );
  };

  return (
    <article
      onClick={onClick}
      className={`group relative ${t.cardBg} ${t.cardBgHover} border ${t.cardBorder} rounded-3xl p-6 transition-all duration-300 cursor-pointer overflow-hidden ${t.cardShadowHover} hover:scale-[1.01]`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] uppercase tracking-wider ${t.cardCourtText} font-medium truncate max-w-[200px]`}>
                {data_json.court || 'Суд не указан'}
              </span>
            </div>
            <h3 className={`text-lg font-semibold ${t.cardCaseText} tracking-tight ${t.cardCaseHover} transition-colors`}>
              {case_number}
            </h3>
          </div>
          <span className={`shrink-0 text-[11px] font-medium ${t.cardDateText} ${t.cardDateBg} px-2 py-1 rounded-lg`}>
            {data_json.date_issue}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          {data_json.issue_result && (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md ${t.cardTagResultBg} ${t.cardTagResultText} text-[11px] font-medium`}>
              {data_json.issue_result}
            </span>
          )}
          {data_json.judge && (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md ${t.cardTagJudgeBg} ${t.cardTagJudgeText} text-[11px] font-medium border ${t.cardTagJudgeBorder}`}>
              {data_json.judge}
            </span>
          )}
        </div>

        {/* Snippet */}
        <div className="flex-grow">
          <p className={`text-[13px] leading-relaxed ${t.cardSnippetText} font-normal line-clamp-4`}>
            {renderHighlighted(previewText)}
          </p>
          {semanticData && (
            <div className={`mt-2 text-[10px] ${t.cardScoreText}`}>
              Релевантность: {(semanticData.score * 100).toFixed(0)}%
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`mt-6 pt-4 border-t ${t.cardFooterBorder} flex justify-between items-center opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300`}>
          <span className={`text-[11px] font-medium ${t.cardFooterLinkText} flex items-center`}>
            Подробнее о деле
            <svg className="w-3 h-3 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </article>
  );
};

export default ResultCard;
