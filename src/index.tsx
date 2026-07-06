import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { CONFIG } from './utils/config';

// Set HTML document title dynamically from CONFIG (VITE_WEB_NAME)
document.title = CONFIG.webName;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);