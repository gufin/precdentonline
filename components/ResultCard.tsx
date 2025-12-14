import React from 'react';
import { CaseRecord } from '../types';
import { FileTextIcon } from './Icons';

interface ResultCardProps {
  data: CaseRecord;
  query: string;
  onClick: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ data, query, onClick }) => {
  const { case_number, content_act, data_json } = data;

  const previewText = content_act.length > 300 
    ? content_act.slice(0, 300) + '...' 
    : content_act;

  const renderHighlighted = (text: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <span key={i} className="text-[#0A84FF] font-medium bg-[#0A84FF]/10 rounded px-0.5">{part}</span> 
        : part
    );
  };

  return (
    <article 
      onClick={onClick}
      className="group relative bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-white/5 rounded-3xl p-6 transition-all duration-300 cursor-pointer overflow-hidden hover:shadow-2xl hover:shadow-black/50 hover:scale-[1.01]"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
               <span className="text-[10px] uppercase tracking-wider text-[#86868b] font-medium truncate max-w-[200px]">
                 {data_json.court || 'Суд не указан'}
               </span>
            </div>
            <h3 className="text-lg font-semibold text-white tracking-tight group-hover:text-[#0A84FF] transition-colors">
              {case_number}
            </h3>
          </div>
          <span className="shrink-0 text-[11px] font-medium text-[#6e6e73] bg-white/5 px-2 py-1 rounded-lg">
            {data_json.date_issue}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-5">
           {data_json.issue_result && (
             <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#0A84FF]/10 text-[#0A84FF] text-[11px] font-medium">
               {data_json.issue_result}
             </span>
           )}
           {data_json.judge && (
             <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/5 text-[#86868b] text-[11px] font-medium border border-white/5">
               {data_json.judge}
             </span>
           )}
        </div>

        {/* Snippet */}
        <div className="flex-grow">
          <p className="text-[13px] leading-relaxed text-[#a1a1a6] font-normal line-clamp-4">
            {renderHighlighted(previewText)}
          </p>
        </div>
        
        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
           <span className="text-[11px] font-medium text-[#0A84FF] flex items-center">
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