import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
// Registers the install-prompt listener at startup — Android fires it only once.
import './lib/installPrompt';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
