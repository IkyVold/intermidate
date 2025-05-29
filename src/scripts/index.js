// CSS imports
import '../styles/styles.css';

import App from './pages/app';

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });
  await app.renderPage();
   console.log('Berhasil mendaftarkan service worker.');
  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });
});

