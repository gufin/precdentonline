import { CaseRecord, SemanticSearchRequest, SemanticSearchResponse, adaptSearchResultToCaseRecord } from '../types';

const CONFIG = {
  useProxy: true, // Использовать прокси через server.js для обхода CORS
  apiBase: 'https://api.you-right.ru/gas',
  apiKey: '7bbace5900c34b2d87aa4c612ea356a0', // Старый ключ для классического API
  searchEndpoint: '/api/search',
  countEndpoint: '/api/count',
  // Новый API семантического поиска
  useSemanticProxy: true, // Использовать прокси через server.js для обхода CORS
  semanticApiBase: import.meta.env.VITE_SEMANTIC_API_BASE || 'http://195.35.56.180', // Базовый URL нового API
  semanticSearchEndpoint: '/api/v1/search',
};

const decoder = new TextDecoder('utf-8');

function parseJson(text: string): any {
  // Проверяем, что это не HTML страница
  if (text.trim().toLowerCase().startsWith('<!doctype') || text.trim().toLowerCase().startsWith('<html')) {
    return null;
  }
  
  // Проверяем, что это не ошибка от 1С (начинается с {ОбщийМодуль)
  if (text.trim().startsWith('{ОбщийМодуль') || text.includes('ОбщегоНазначения')) {
    return null;
  }
  
  try {
    return JSON.parse(text);
  } catch (e) {
    // Не логируем ошибку парсинга - это может быть ожидаемая ошибка от API
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
    const text = await res.text();
    
    // Если это HTML (404 страница), возвращаем дефолт
    if (text.trim().toLowerCase().startsWith('<!doctype') || text.trim().toLowerCase().startsWith('<html')) {
      return '—';
    }
    
    // Если это ошибка от 1С (начинается с {ОбщийМодуль), возвращаем дефолт
    if (text.trim().startsWith('{ОбщийМодуль') || text.includes('ОбщегоНазначения')) {
      return '—';
    }
    
    // Проверяем Content-Type
    const contentType = res.headers.get('content-type');
    if (contentType && !contentType.includes('application/json') && !contentType.includes('text/plain')) {
      // Если это не JSON и не текст, значит API недоступен
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
    
    // Проверяем на ошибки от 1С
    if (text.trim().startsWith('{ОбщийМодуль') || text.includes('ОбщегоНазначения')) {
      throw new Error('Ошибка API: ' + text.trim().substring(0, 200));
    }
    
    // Проверяем статус ответа
    if (!res.ok) {
      throw new Error(`Ошибка сервера: ${res.status} ${res.statusText}`);
    }
    
    const parsed = parseJson(text);
    
    // Проверяем наличие ошибки в ответе
    if (parsed && typeof parsed === 'object' && 'error' in parsed) {
      throw new Error(parsed.error || 'Ошибка при выполнении поиска');
    }
    
    if (!parsed || !Array.isArray(parsed)) {
      // Если это не массив и не ошибка, возможно просто нет результатов
      // Но если это пустая строка или что-то странное, это ошибка
      if (text.trim() === '' || text.trim().length > 0) {
        throw new Error('Результатов поиска по ключевым словам не найдено');
      }
      throw new Error('Неверный формат ответа от API');
    }
    
    // Если массив пустой, возвращаем пустой массив (не ошибку)
    return parsed as CaseRecord[];
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Не удалось выполнить поиск');
  }
};

/**
 * Семантический поиск по новому API
 */
export const semanticSearch = async (request: SemanticSearchRequest): Promise<CaseRecord[]> => {
  // Используем прокси через server.js или прямое обращение
  const url = CONFIG.useSemanticProxy
    ? CONFIG.semanticSearchEndpoint // Прокси через server.js
    : `${CONFIG.semanticApiBase}${CONFIG.semanticSearchEndpoint}`; // Прямое обращение
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: request.query,
        limit: request.limit || 20,
        min_score: request.min_score ?? 0.5,
        filters: request.filters || null,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage = `Ошибка сервера: ${res.status} ${res.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        
        // Проверяем разные форматы ошибок
        if (errorJson.error) {
          errorMessage = errorJson.error;
          if (errorJson.details) {
            errorMessage += `. ${errorJson.details}`;
          }
        } else if (errorJson.detail) {
          if (Array.isArray(errorJson.detail)) {
            errorMessage = errorJson.detail.map((d: any) => d.msg || d.message).join(', ');
          } else if (typeof errorJson.detail === 'string') {
            errorMessage = errorJson.detail;
          }
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch {
        // Если не удалось распарсить, используем текст ошибки
        if (errorText && !errorText.trim().startsWith('<!')) {
          errorMessage = errorText;
        }
      }
      
      // Добавляем информацию о статусе для 503/504/502
      if (res.status === 503) {
        errorMessage = `Семантический поиск недоступен: ${errorMessage}`;
      } else if (res.status === 504) {
        errorMessage = `Превышено время ожидания ответа от сервиса семантического поиска`;
      } else if (res.status === 502) {
        errorMessage = `Сервис семантического поиска вернул неверный ответ: ${errorMessage}`;
      }
      
      throw new Error(errorMessage);
    }

    const response: SemanticSearchResponse = await res.json();
    
    if (!response.items || !Array.isArray(response.items)) {
      throw new Error('Неверный формат ответа от API');
    }

    // Преобразуем результаты в формат CaseRecord
    return response.items.map(adaptSearchResultToCaseRecord);
  } catch (error) {
    // Обработка сетевых ошибок (когда fetch вообще не может выполниться)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Семантический поиск недоступен: не удалось подключиться к серверу. Проверьте, что прокси-сервер запущен на порту 3001.');
    }
    
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Не удалось выполнить семантический поиск');
  }
};
