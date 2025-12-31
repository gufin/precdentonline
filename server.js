import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001; // Different port from Vite dev server

const API_BASE = process.env.API_BASE || 'https://api.you-right.ru/gas';
const API_KEY = process.env.API_KEY || '';
const SEMANTIC_API_BASE = process.env.SEMANTIC_API_BASE || 'http://195.35.56.180'; // Онлайн API семантического поиска
const SEMANTIC_API_KEY = process.env.SEMANTIC_API_KEY || '3a6fe05a871834862d13c3497a5df8c273e50e5d0aa67d8f0a7ef05a013ce93b'; // Ключ для семантического API

// JSON body parser
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Раздача статических файлов из dist (для продакшена)
app.use(express.static(path.join(__dirname, 'dist')));

// Для всех остальных маршрутов отдаем index.html (SPA routing)
app.get('*', (req, res) => {
  // Пропускаем API маршруты
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.get('/api/count', async (_req, res) => {
  if (!API_KEY) {
    return res.status(500).json({ error: 'API_KEY не задан' });
  }

  try {
    const url = `${API_BASE}/get_Count_Records?key=${encodeURIComponent(API_KEY)}`;
    const response = await fetch(url);
    const text = await response.text();
    return res.type('application/json').send(text);
  } catch (error) {
    console.error('count error', error);
    return res.status(500).json({ error: 'Не удалось получить количество' });
  }
});

app.get('/api/search', async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({ error: 'API_KEY не задан' });
  }

  // Правильно декодируем query параметры
  const query = decodeURIComponent((req.query.q || '').toString().trim());
  const caseNumber = decodeURIComponent((req.query.caseNumber || '').toString().trim());
  const effectiveQuery = query || caseNumber;

  if (!effectiveQuery) {
    return res.status(400).json({ error: 'Введите текст запроса или номер дела' });
  }

  try {
    const url = `${API_BASE}/get_Document_By_Content?key=${encodeURIComponent(API_KEY)}&content=${encodeURIComponent(effectiveQuery)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API response not OK:', response.status, response.statusText);
      return res.status(response.status).json({ error: `Ошибка API: ${response.status} ${response.statusText}` });
    }
    
    const text = await response.text();
    
    if (!text || text.trim().length === 0) {
      console.error('Empty response from API');
      return res.status(500).json({ error: 'Пустой ответ от API' });
    }
    
    // Проверяем на ошибки от 1С
    if (text.trim().startsWith('{ОбщийМодуль') || text.includes('ОбщегоНазначения')) {
      console.error('1C API error:', text.substring(0, 200));
      return res.status(500).json({ error: 'Ошибка API: ' + text.trim().substring(0, 200) });
    }
    
    return res.type('application/json').send(text);
  } catch (error) {
    console.error('search error', error);
    return res.status(500).json({ error: 'Не удалось выполнить поиск: ' + error.message });
  }
});

// Прокси для семантического поиска
app.post('/api/v1/search', async (req, res) => {
  try {
    const url = `${SEMANTIC_API_BASE}/api/v1/search`;
    
    // Устанавливаем таймаут для запроса
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': SEMANTIC_API_KEY, // Используем отдельный ключ для семантического поиска
        },
        body: JSON.stringify(req.body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      // Проверяем, что ответ - это JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Semantic API returned non-JSON:', text.substring(0, 200));
        return res.status(502).json({ 
          error: 'Семантический поиск недоступен',
          details: 'API вернул неверный формат ответа'
        });
      }

      const data = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      return res.json(data);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('Semantic API timeout');
        return res.status(504).json({ 
          error: 'Семантический поиск недоступен',
          details: 'Превышено время ожидания ответа от API'
        });
      }
      
      // ECONNREFUSED или другие сетевые ошибки
      if (fetchError.code === 'ECONNREFUSED' || fetchError.message.includes('fetch failed')) {
        console.error('Semantic API connection refused:', fetchError.message);
        return res.status(503).json({ 
          error: 'Семантический поиск недоступен',
          details: `Не удалось подключиться к API по адресу ${SEMANTIC_API_BASE}. Убедитесь, что сервис запущен.`
        });
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error('semantic search error', error);
    return res.status(500).json({ 
      error: 'Не удалось выполнить семантический поиск',
      details: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`API Server started on http://localhost:${port}`);
});
