import {createRoot} from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App.tsx';
import './index.css';
import { initPwa } from './lib/pwa';

initPwa();
// Vercel Web Analytics : visites globales (sans cookie), visibles dans le tableau de bord Vercel.
createRoot(document.getElementById('root')!).render(
  <>
    <App />
    <Analytics />
  </>
);
