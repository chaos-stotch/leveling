import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initStorage } from './utils/storage.js'
import { initCaches } from './utils/storage-compat.js'
import { startAutoSync, isSyncEnabled } from './utils/sync.js'
import { getSupabaseConfig } from './utils/supabase.js'

// Wait for DOM and stylesheets to load to prevent FOUC
const waitForReady = () => {
  return new Promise((resolve) => {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      // Small delay to ensure stylesheets are applied
      setTimeout(resolve, 0);
      return;
    }
    
    const checkReady = () => {
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(resolve, 0);
      } else {
        setTimeout(checkReady, 10);
      }
    };
    
    if (document.addEventListener) {
      document.addEventListener('DOMContentLoaded', () => setTimeout(resolve, 0), { once: true });
      window.addEventListener('load', () => setTimeout(resolve, 0), { once: true });
    } else {
      checkReady();
    }
    
    // Fallback timeout
    setTimeout(resolve, 100);
  });
};

// Boot-safe loading pipeline
const initApp = async () => {
  // 0. Wait for DOM and stylesheets to prevent FOUC
  await waitForReady();

  // 1. Initialize IndexedDB and migrate from localStorage
  try {
    await initStorage();
    await initCaches();
  } catch (error) {
    console.error('Storage initialization error:', error);
  }

  // 2. Render UI immediately (don't wait for sync)
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
  <React.StrictMode>
    <App />
    </React.StrictMode>
  );

  // 3. Start sync in background (non-blocking)
  if (isSyncEnabled()) {
    const config = getSupabaseConfig();
    if (config && config.userId) {
      startAutoSync(config.userId);
    }
  }

  // 4. Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    import('virtual:pwa-register').then(({ registerSW }) => {
      registerSW({
        immediate: true,
        });
      }).catch(() => {
        // Service worker registration failed, continue anyway
      });
    });
  }

  // 5. Initialize Capacitor if on native platform
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      const { App } = await import('@capacitor/app');
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive && isSyncEnabled()) {
          const config = getSupabaseConfig();
          if (config && config.userId) {
            import('./utils/sync.js').then(({ sync }) => {
              sync(config.userId).catch(console.error);
            });
          }
        }
      });
    }
  } catch (error) {
    // Capacitor not available (web environment) - ignore
  }
};

// Start app initialization
initApp().catch(console.error);
