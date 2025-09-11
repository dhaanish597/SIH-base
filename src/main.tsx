import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered: ', registration);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, prompt user to refresh
              if (confirm('New version available! Refresh to update?')) {
                window.location.reload();
              }
            }
          });
        }
      });
    } catch (registrationError) {
      console.log('SW registration failed: ', registrationError);
    }
  });
}

// Add PWA install prompt
let deferredPrompt: any;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Show install button or banner
  const installBanner = document.createElement('div');
  installBanner.innerHTML = `
    <div style="position: fixed; bottom: 20px; left: 20px; right: 20px; background: #4F46E5; color: white; padding: 16px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; display: flex; align-items: center; justify-content: space-between;">
      <div>
        <strong>Install STEM Learn</strong>
        <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Add to your home screen for quick access</p>
      </div>
      <button id="install-btn" style="background: white; color: #4F46E5; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer;">Install</button>
      <button id="dismiss-btn" style="background: transparent; color: white; border: none; padding: 8px; margin-left: 8px; cursor: pointer; font-size: 18px;">&times;</button>
    </div>
  `;
  
  document.body.appendChild(installBanner);
  
  document.getElementById('install-btn')?.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      deferredPrompt = null;
      installBanner.remove();
    }
  });
  
  document.getElementById('dismiss-btn')?.addEventListener('click', () => {
    installBanner.remove();
  });
});
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
