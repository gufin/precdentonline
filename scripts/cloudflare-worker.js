// Cloudflare Worker для проксирования запросов к Recognition API
// Обходит проблему с невалидным SSL сертификатом dev.you-right.ru

const RECOGNITION_API_BASE = 'https://dev.you-right.ru/ur_ai_api/hs/RecognitionService';
const API_TOKEN = 'Bearer ew0KImFsZyI6ICJIUzI1NiIsDQoidHlwIjogIkpXVCINCn0.ew0KImp0aSI6ICI0MjMwNTE0OC1hOTViLTQzNDItODM5Mi1lYjg1YWQ2YTk4N2YiLA0KImV4cCI6IDE4MDg5NDI0MDAsDQoiYXVkIjogIkxMTV9SZWNvZ25pdGlvblNlcnZpY2UiLA0KInN1YiI6ICJBZG1pbiIsDQoibmJmIjogMTc2ODY0OTk0MywNCiJpYXQiOiAxNzY4NjQ5OTQzLA0KImlzcyI6ICJzc2wiDQp9.lXJlUG4GApPW145B6902x7sZ9Y--jl9rSCi6m3wwjUY';

// CORS заголовки
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Обработка preflight запроса
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);

  try {
    // POST /recognize - запуск анализа
    if (request.method === 'POST' && url.pathname === '/recognize') {
      const body = await request.json();
      
      const response = await fetch(`${RECOGNITION_API_BASE}/recognize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': API_TOKEN,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /status?requestID=... - проверка статуса
    if (request.method === 'GET' && url.pathname === '/status') {
      const requestID = url.searchParams.get('requestID');
      
      if (!requestID) {
        return new Response(JSON.stringify({ error: 'requestID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const response = await fetch(`${RECOGNITION_API_BASE}/recognize?requestID=${encodeURIComponent(requestID)}`, {
        method: 'GET',
        headers: {
          'Authorization': API_TOKEN,
        },
      });

      const data = await response.json();
      
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 404 для остальных путей
    return new Response('Not Found', { 
      status: 404,
      headers: corsHeaders,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
