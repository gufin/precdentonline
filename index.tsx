import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Безопасная инициализация с проверкой DOM
function initApp() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Failed to render app:', error);
  }
}

// Ждем загрузки DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
