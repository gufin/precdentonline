import { CaseRecord } from '../types';

const CONFIG = {
  useProxy: false, // Прямое обращение к API без прокси-сервера
  apiBase: 'https://api.you-right.ru/gas',
  apiKey: '7bbace5900c34b2d87aa4c612ea356a0',
  searchEndpoint: '/api/search',
  countEndpoint: '/api/count'
};

const decoder = new TextDecoder('utf-8');

function parseJson(text: string): any {
  // Проверяем, что это не HTML страница
  if (text.trim().toLowerCase().startsWith('<!doctype') || text.trim().toLowerCase().startsWith('<html')) {
    return null;
  }
  
  try {
    return JSON.parse(text);
  } catch (e) {
    // Не логируем ошибку, если это HTML (404 страница)
    if (!text.trim().toLowerCase().startsWith('<!')) {
      console.error('JSON parse error', e);
    }
    return null;
  }
}

function buildSearchUrl(query: string, caseNumber: string): string {
  const effectiveQuery = query || caseNumber || '';
  if (!effectiveQuery) return '';

  if (CONFIG.useProxy) {
    const url = new URL(CONFIG.searchEndpoint, window.location.origin);
    url.searchParams.set('q', query || '');
    url.searchParams.set('caseNumber', caseNumber || '');
    return url.toString();
  }

  if (!CONFIG.apiKey) return '';
  return `${CONFIG.apiBase}/get_Document_By_Content?key=${encodeURIComponent(CONFIG.apiKey)}&content=${encodeURIComponent(effectiveQuery)}`;
}

function buildCountUrl(): string {
  if (CONFIG.useProxy) {
    return CONFIG.countEndpoint;
  }
  if (!CONFIG.apiKey) return '';
  return `${CONFIG.apiBase}/get_Count_Records?key=${encodeURIComponent(CONFIG.apiKey)}`;
}

export const fetchTotalCount = async (): Promise<string> => {
  const url = buildCountUrl();
  if (!url) {
    return '—'; // Возвращаем дефолтное значение вместо ошибки
  }

  try {
    const res = await fetch(url);
    
    // Проверяем Content-Type
    const contentType = res.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      // Если это не JSON, значит API недоступен
      return '—';
    }
    
    const text = await res.text();
    
    // Если это HTML (404 страница), возвращаем дефолт
    if (text.trim().toLowerCase().startsWith('<!doctype') || text.trim().toLowerCase().startsWith('<html')) {
      return '—';
    }
    
    const parsed = parseJson(text);
    
    // Если не удалось распарсить, возвращаем дефолт
    if (!parsed) {
      return '—';
    }
    
    // Проверяем наличие ошибки в ответе
    if (parsed && typeof parsed === 'object' && 'error' in parsed) {
      return '—'; // Возвращаем дефолт вместо ошибки
    }
    
    // Проверяем статус ответа
    if (!res.ok) {
      return '—'; // Возвращаем дефолт вместо ошибки
    }
    
    // Возвращаем count_records
    if (parsed && typeof parsed === 'object' && 'count_records' in parsed) {
      return String(parsed.count_records);
    }
    
    // Если это строка или число, возвращаем как есть
    if (typeof parsed === 'string' || typeof parsed === 'number') {
      return String(parsed);
    }
    
    return '—'; // Дефолт при неверном формате
  } catch (error) {
    // Тихая обработка ошибок - просто возвращаем дефолт
    return '—';
  }
};

export const searchCases = async (query: string, caseNumber: string): Promise<CaseRecord[]> => {
  const url = buildSearchUrl(query, caseNumber);
  
  if (!url) {
    throw new Error('API не настроен. Проверьте конфигурацию.');
  }

  try {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const text = decoder.decode(buffer);
    const parsed = parseJson(text);
    
    // Проверяем наличие ошибки в ответе
    if (parsed && typeof parsed === 'object' && 'error' in parsed) {
      throw new Error(parsed.error || 'Ошибка при выполнении поиска');
    }
    
    // Проверяем статус ответа
    if (!res.ok) {
      throw new Error(`Ошибка сервера: ${res.status} ${res.statusText}`);
    }
    
    if (!parsed || !Array.isArray(parsed)) {
      throw new Error('Результатов поиска по ключевым словам не найдено');
    }
    
    return parsed as CaseRecord[];
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Не удалось выполнить поиск');
  }
};
