import { 
  CaseRecord, 
  SemanticSearchRequest, 
  SemanticSearchResponse, 
  adaptSearchResultToCaseRecord,
  RecognitionRequest,
  RecognitionStartResponse,
  RecognitionStatusResponse,
  AIAnalysisResult
} from '../types';

const CONFIG = {
  useProxy: true, // Использовать прокси через server.js для обхода CORS
  apiBase: 'https://api.you-right.ru/gas',
  apiKey: '7bbace5900c34b2d87aa4c612ea356a0', // Старый ключ для классического API
  searchEndpoint: '/api/search',
  countEndpoint: '/api/count',
  // Новый API семантического поиска
  useSemanticProxy: false, // Прямое обращение к API (CORS разрешен)
  semanticApiBase: import.meta.env.VITE_SEMANTIC_API_BASE || 'https://semsearch.ru', // Базовый URL семантического API
  semanticApiKey: import.meta.env.VITE_SEMANTIC_API_KEY || '3a6fe05a871834862d13c3497a5df8c273e50e5d0aa67d8f0a7ef05a013ce93b', // API ключ для семантического поиска
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
export const semanticSearch = async (request: SemanticSearchRequest, retryWithLowerLimit: boolean = false): Promise<CaseRecord[]> => {
  // Прямое обращение к API (CORS разрешен)
  const url = `${CONFIG.semanticApiBase}${CONFIG.semanticSearchEndpoint}`;
  
  // Если это retry, уменьшаем лимит
  const limit = retryWithLowerLimit ? Math.min(request.limit || 20, 10) : (request.limit || 20);
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CONFIG.semanticApiKey, // Добавляем API ключ
      },
      body: JSON.stringify({
        query: request.query,
        limit: limit,
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
      
      // Добавляем информацию о статусе для различных ошибок
      if (res.status === 503) {
        errorMessage = `Семантический поиск недоступен: ${errorMessage}`;
      } else if (res.status === 504) {
        errorMessage = `Превышено время ожидания ответа от сервиса семантического поиска`;
      } else if (res.status === 502) {
        errorMessage = `Сервис семантического поиска вернул неверный ответ: ${errorMessage}`;
      } else if (res.status === 500) {
        // Специальная обработка для ошибок 500 от API
        if ((errorMessage.includes('timed out') || errorMessage.includes('timeout') || errorMessage.includes('Vector search failed')) && !retryWithLowerLimit && limit > 10) {
          // Пробуем еще раз с меньшим лимитом
          console.log(`[Semantic Search] Retrying with lower limit (${limit} -> 10)`);
          return semanticSearch({ ...request, limit: 10 }, true);
        }
        
        if (errorMessage.includes('timed out') || errorMessage.includes('timeout')) {
          errorMessage = `Поиск занял слишком много времени. Попробуйте упростить запрос или уменьшить количество результатов.`;
        } else if (errorMessage.includes('Vector search failed')) {
          errorMessage = `Ошибка при выполнении семантического поиска. Сервис временно перегружен. Попробуйте позже или используйте классический поиск.`;
        } else {
          errorMessage = `Ошибка сервиса семантического поиска: ${errorMessage}`;
        }
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
      throw new Error('Семантический поиск недоступен: не удалось подключиться к серверу.');
    }
    
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Не удалось выполнить семантический поиск');
  }
};

/**
 * Получение полного текста дела по номеру
 */
export const fetchCaseText = async (caseNumber: string): Promise<{ case_number: string; text: string; found: boolean }> => {
  // Прямое обращение к API (CORS разрешен)
  const url = `${CONFIG.semanticApiBase}/api/v1/cases/${encodeURIComponent(caseNumber)}`;
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': CONFIG.semanticApiKey,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage = `Ошибка сервера: ${res.status} ${res.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
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
        }
      } catch {
        if (errorText && !errorText.trim().startsWith('<!')) {
          errorMessage = errorText;
        }
      }
      
      throw new Error(errorMessage);
    }

    const data = await res.json();
    
    if (!data || typeof data !== 'object') {
      throw new Error('Неверный формат ответа от API');
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Сервис недоступен: не удалось подключиться к серверу.');
    }
    
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Не удалось получить текст дела');
  }
};

/**
 * Запуск AI-анализа судебного решения
 * Возвращает requestID для последующего polling
 */
export const startRecognition = async (text: string): Promise<string> => {
  // Прямой URL к Recognition API (CORS включен на сервере)
  const url = 'https://dev.you-right.ru/ur_ai_api/hs/RecognitionService/recognize';
  
  // API токен
  const token = 'Bearer ew0KImFsZyI6ICJIUzI1NiIsDQoidHlwIjogIkpXVCINCn0.ew0KImp0aSI6ICI0MjMwNTE0OC1hOTViLTQzNDItODM5Mi1lYjg1YWQ2YTk4N2YiLA0KImV4cCI6IDE4MDg5NDI0MDAsDQoiYXVkIjogIkxMTV9SZWNvZ25pdGlvblNlcnZpY2UiLA0KInN1YiI6ICJBZG1pbiIsDQoibmJmIjogMTc2ODY0OTk0MywNCiJpYXQiOiAxNzY4NjQ5OTQzLA0KImlzcyI6ICJzc2wiDQp9.lXJlUG4GApPW145B6902x7sZ9Y--jl9rSCi6m3wwjUY';
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify({
        recognitionFunctionName: 'Резюмировать решение',
        fileData: text,
      } as RecognitionRequest),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Неизвестная ошибка' }));
      const errorMessage = errorData.error || `Ошибка сервера: ${res.status}`;
      throw new Error(errorMessage);
    }

    const data: RecognitionStartResponse = await res.json();
    
    if (!data.requestID) {
      throw new Error('Не получен requestID от сервера');
    }

    return data.requestID;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Не удалось подключиться к сервису анализа');
    }
    
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Не удалось запустить AI-анализ');
  }
};

/**
 * Проверка статуса AI-анализа по requestID
 */
export const checkRecognitionStatus = async (requestID: string): Promise<RecognitionStatusResponse> => {
  // Прямой URL к Recognition API (CORS включен на сервере)
  const url = `https://dev.you-right.ru/ur_ai_api/hs/RecognitionService/recognize?requestID=${encodeURIComponent(requestID)}`;
  
  // API токен
  const token = 'Bearer ew0KImFsZyI6ICJIUzI1NiIsDQoidHlwIjogIkpXVCINCn0.ew0KImp0aSI6ICI0MjMwNTE0OC1hOTViLTQzNDItODM5Mi1lYjg1YWQ2YTk4N2YiLA0KImV4cCI6IDE4MDg5NDI0MDAsDQoiYXVkIjogIkxMTV9SZWNvZ25pdGlvblNlcnZpY2UiLA0KInN1YiI6ICJBZG1pbiIsDQoibmJmIjogMTc2ODY0OTk0MywNCiJpYXQiOiAxNzY4NjQ5OTQzLA0KImlzcyI6ICJzc2wiDQp9.lXJlUG4GApPW145B6902x7sZ9Y--jl9rSCi6m3wwjUY';
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': token,
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Неизвестная ошибка' }));
      const errorMessage = errorData.error || `Ошибка сервера: ${res.status}`;
      throw new Error(errorMessage);
    }

    const data: RecognitionStatusResponse = await res.json();
    console.log('Recognition status check response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Не удалось подключиться к сервису анализа');
    }
    
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Не удалось проверить статус анализа');
  }
};

/**
 * Получение списка доступных судов для фильтрации
 */
export const fetchAvailableCourts = async (): Promise<string[]> => {
  const url = `${CONFIG.semanticApiBase}/api/v1/filters/courts`;
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': CONFIG.semanticApiKey,
      },
    });

    if (!res.ok) {
      console.error('Failed to fetch courts:', res.status);
      return [];
    }

    const data = await res.json();
    // API возвращает объект { items: [...], count: N }
    return data.items || [];
  } catch (error) {
    console.error('Error fetching courts:', error);
    return [];
  }
};

/**
 * Получение списка доступных типов документов для фильтрации
 */
export const fetchAvailableDocTypes = async (): Promise<string[]> => {
  const url = `${CONFIG.semanticApiBase}/api/v1/filters/doctypes`;
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': CONFIG.semanticApiKey,
      },
    });

    if (!res.ok) {
      console.error('Failed to fetch doctypes:', res.status);
      return [];
    }

    const data = await res.json();
    // API возвращает объект { items: [...], count: N }
    return data.items || [];
  } catch (error) {
    console.error('Error fetching doctypes:', error);
    return [];
  }
};

/**
 * Получение списка доступных категорий дел для фильтрации
 */
export const fetchAvailableCategories = async (): Promise<string[]> => {
  const url = `${CONFIG.semanticApiBase}/api/v1/filters/categories`;
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': CONFIG.semanticApiKey,
      },
    });

    if (!res.ok) {
      console.error('Failed to fetch categories:', res.status);
      return [];
    }

    const data = await res.json();
    // API возвращает объект { items: [...], count: N }
    return data.items || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

/**
 * Polling механизм с exponential backoff для получения результата анализа
 * Возвращает распарсенный результат или выбрасывает ошибку при таймауте/ошибке
 */
export const pollRecognitionStatus = async (
  requestID: string,
  onProgress?: (progress: number) => void
): Promise<AIAnalysisResult> => {
  const maxAttempts = 60; // Максимум 60 попыток (~3 минуты)
  let attempt = 0;

  // Функция для вычисления задержки с exponential backoff
  const getDelay = (attemptNum: number): number => {
    if (attemptNum < 10) return 2000;  // Первые 10 попыток: 2 секунды
    if (attemptNum < 30) return 3000;  // Следующие 20 попыток: 3 секунды
    return 5000;                        // Последние 30 попыток: 5 секунд
  };

  while (attempt < maxAttempts) {
    try {
      const response = await checkRecognitionStatus(requestID);
      
      // Проверяем статус
      if (response.status === 'Завершен') {
        console.log('Recognition completed. Full response:', JSON.stringify(response, null, 2));
        
        // Проверяем наличие результата
        if (!response.result) {
          console.error('No result field in response');
          throw new Error('Результат анализа отсутствует');
        }

        // Проверяем на ошибку в результате
        if (response.result.ОписаниеОшибки && response.result.ОписаниеОшибки.trim()) {
          console.error('Error in result:', response.result.ОписаниеОшибки);
          throw new Error(response.result.ОписаниеОшибки);
        }

        // Парсим JSON из строки
        // API может возвращать результат в поле "Результат" или "СтрокаJson"
        const jsonString = response.result.Результат || response.result.СтрокаJson;
        
        if (!jsonString) {
          console.error('No Результат or СтрокаJson in result. Result object:', JSON.stringify(response.result, null, 2));
          throw new Error('Отсутствует результат анализа в ответе');
        }

        try {
          const parsedResult: AIAnalysisResult = JSON.parse(jsonString);
          console.log('Parsed AI analysis result:', parsedResult);
          return parsedResult;
        } catch (parseError) {
          console.error('Failed to parse result JSON:', parseError);
          console.error('Raw JSON string:', jsonString);
          throw new Error('Не удалось обработать результат анализа');
        }
      } else if (response.status === 'Ошибка') {
        const errorDesc = response.result?.ОписаниеОшибки || 'Неизвестная ошибка при анализе';
        throw new Error(errorDesc);
      }

      // Статус "В обработке" или другой - продолжаем polling
      attempt++;
      
      if (attempt >= maxAttempts) {
        throw new Error('Анализ занял слишком много времени (более 3 минут). Попробуйте позже или обратитесь в поддержку');
      }

      // Сообщаем о прогрессе в процентах
      if (onProgress) {
        const progress = Math.min(Math.round((attempt / maxAttempts) * 100), 99);
        onProgress(progress);
      }

      // Ждем перед следующей попыткой
      const delay = getDelay(attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      // Если это наша ошибка (таймаут, ошибка парсинга и т.д.), пробрасываем дальше
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Не удалось получить результат анализа');
    }
  }

  // Этот код недостижим, но TypeScript требует return
  throw new Error('Превышено максимальное количество попыток');
};
