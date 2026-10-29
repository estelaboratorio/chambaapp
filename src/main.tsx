import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register PWA service worker if supported
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      reg.update().catch(() => {});
    }).catch((err) => {
      console.warn('ServiceWorker registration error:', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
