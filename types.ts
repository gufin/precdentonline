export interface CaseSide {
  name: string;
  type?: string;
}

export interface CaseSides {
  Plaintiffs?: CaseSide[];
  Defendants?: CaseSide[];
  Third?: CaseSide[];
  Others?: CaseSide[];
}

export interface CaseDataJson {
  court?: string;
  judge?: string;
  case_category_2?: string;
  issue_result?: string;
  case_consideration?: string; // Level
  type?: string; // Alternative Level
  date_issue?: string; // dd.mm.yyyy
  date_of_entry?: string; // dd.mm.yyyy
  url?: string;
  sides?: CaseSides;
}

export interface CaseRecord {
  id?: string; // Generated or from API
  case_number: string;
  content_act: string; // The text content
  data_json: CaseDataJson;
  semanticData?: {
    score: number;
    highlights: string[];
    snippet: string;
  };
}

export interface FilterState {
  court: string;
  judge: string;
  category: string;
  result: string;
  level: string;
  side: string;
  dateIssueFrom: string;
  dateIssueTo: string;
  dateEntryFrom: string;
  dateEntryTo: string;
  inForceOnly: boolean;
}

export type SortOption = 'date_desc' | 'date_asc' | 'entry_desc' | 'entry_asc' | 'court_asc' | 'judge_asc';

export interface SearchParams {
  query: string;
  caseNumber: string;
}

// Новые типы для семантического поиска
// Фильтры для семантического поиска (соответствуют API semsearch.ru)
export interface SearchFilters {
  date_from?: string | null;     // Дата от (ISO 8601: YYYY-MM-DD)
  date_to?: string | null;       // Дата до (ISO 8601: YYYY-MM-DD)
  court?: string | null;         // Точное совпадение названия суда
  doctype?: string | null;       // Тип документа (Решение, Постановление, etc.)
  categories?: string[] | null;  // Категории дел (OR условие)
}

export interface SemanticSearchRequest {
  query: string;
  limit?: number; // 1-100
  min_score?: number; // 0-1
  filters?: SearchFilters | null;
}

export interface SearchResultItem {
  document_id: string;
  case_number: string;
  court_name: string | null;
  doc_date: string | null; // ISO 8601 format
  score: number;
  snippet: string;
  highlights: string[];
  url: string;
  doctype: string | null;
  categories?: string[] | null; // Категории дела
}

export interface SemanticSearchResponse {
  query: string;
  took_ms: number;
  items: SearchResultItem[];
}

// Адаптер для преобразования SearchResultItem в CaseRecord
export function adaptSearchResultToCaseRecord(item: SearchResultItem): CaseRecord {
  // Парсим дату из ISO формата в dd.mm.yyyy
  const formatDate = (isoDate: string | null): string => {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    } catch {
      return '';
    }
  };

  return {
    id: item.document_id,
    case_number: item.case_number,
    content_act: item.snippet, // Используем snippet как основной текст
    data_json: {
      court: item.court_name || undefined,
      date_issue: formatDate(item.doc_date),
      url: item.url,
      issue_result: item.doctype || undefined,
      // Категории дела сохраняем в case_category_2 (как строку через запятую)
      case_category_2: item.categories?.join(', ') || undefined,
    },
    // Дополнительные поля для семантического поиска
    semanticData: {
      score: item.score,
      highlights: item.highlights,
      snippet: item.snippet,
    },
  } as CaseRecord & { semanticData?: { score: number; highlights: string[]; snippet: string } };
}

// Типы для AI-анализа судебных решений (Recognition API)

// Запрос на запуск анализа
export interface RecognitionRequest {
  recognitionFunctionName: string; // Обычно "Резюмировать решение"
  fileData: string; // Полный текст судебного решения
}

// Ответ при запуске анализа (содержит requestID для polling)
export interface RecognitionStartResponse {
  requestID: string;
}

// Ответ при проверке статуса
export interface RecognitionStatusResponse {
  status: string; // "В обработке", "Завершен", "Ошибка"
  result?: {
    Результат?: string; // JSON в виде строки с результатами анализа (новый формат)
    СтрокаJson?: string; // JSON в виде строки с результатами анализа (старый формат)
    РаспознанныйТекст?: string; // Исходный текст решения
    ОписаниеОшибки?: string; // Описание ошибки (если есть)
  };
}

// Структура результата AI-анализа (парсится из result.Результат)
export interface AIAnalysisResult {
  супер_краткая_фабула_дела?: string;
  
  позиции_и_доводы_сторон?: {
    истец?: string;
    ответчик?: string;
    [key: string]: string | undefined;
  };
  
  мотивировка_суда?: {
    ключевые_причины?: string;
    нормы_права?: string;
    отклонение_доводов?: string;
    [key: string]: string | undefined;
  } | string; // Может быть объектом или строкой
  
  резолютивная_часть?: {
    результат?: string;
    другие_действия?: string;
    суммы?: {
      основной_долг?: string;
      неустойка_штраф?: string;
      [key: string]: string | undefined;
    };
    [key: string]: any;
  };
}
