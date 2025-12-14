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

  const query = (req.query.q || '').toString().trim();
  const caseNumber = (req.query.caseNumber || '').toString().trim();
  const effectiveQuery = query || caseNumber;

  if (!effectiveQuery) {
    return res.status(400).json({ error: 'Введите текст запроса или номер дела' });
  }

  try {
    const url = `${API_BASE}/get_Document_By_Content?key=${encodeURIComponent(API_KEY)}&content=${encodeURIComponent(effectiveQuery)}`;
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const text = new TextDecoder('utf-8').decode(buffer);
    return res.type('application/json').send(text);
  } catch (error) {
    console.error('search error', error);
    return res.status(500).json({ error: 'Не удалось выполнить поиск' });
  }
});

app.listen(port, () => {
  console.log(`API Server started on http://localhost:${port}`);
});
