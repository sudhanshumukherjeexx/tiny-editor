import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/special-elite/400.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import './styles/globals.css';
import './editor/editorStyles.css';
import './styles/print.css';
import App from './app/App';
import { SettingsProvider } from './app/settings';
import { UIProvider } from './app/ui';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <UIProvider>
        <App />
      </UIProvider>
    </SettingsProvider>
  </StrictMode>,
);
