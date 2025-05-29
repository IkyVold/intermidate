import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this._setupDrawer();
    // Panggil updateNavigation sekali saat app diinisialisasi
    this._updateNavigation();
    
    // TAMBAHAN: Setup auth state listener
    this._setupAuthStateListener();
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#navigationDrawer.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      if (!this.#navigationDrawer.contains(event.target) && !this.#drawerButton.contains(event.target)) {
        this.#navigationDrawer.classList.remove('open');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
        }
      });
    });
  }

  // TAMBAHAN: Setup listener untuk perubahan auth state
  _setupAuthStateListener() {
    // Listen untuk perubahan localStorage (login/logout dari tab lain)
    window.addEventListener('storage', (e) => {
      if (e.key === 'token' || e.key === 'userName') {
        this._updateNavigation();
      }
    });

    // Listen untuk custom events (login/logout dari tab yang sama)
    window.addEventListener('authStateChanged', () => {
      this._updateNavigation();
    });

    // ALTERNATIF: Polling check (sebagai backup)
    // Check auth state setiap 1 detik (optional, bisa dihapus jika tidak perlu)
    let lastAuthState = this._getAuthState();
    setInterval(() => {
      const currentAuthState = this._getAuthState();
      if (currentAuthState !== lastAuthState) {
        lastAuthState = currentAuthState;
        this._updateNavigation();
      }
    }, 1000);
  }

  // Helper method untuk cek status auth
  _getAuthState() {
    const token = localStorage.getItem('token');
    return token !== null && token !== undefined && token !== '';
  }

  async renderPage() {
    const url = getActiveRoute();
    const page = routes[url];

    if (!page) {
      this.#content.innerHTML = '<p>Selamat datang silahkan login terlebih dahulu</p>';
      return;
    }

    // Show loading animation
    this._showLoading();

    try {
      // Use View Transition API if supported
      if (document.startViewTransition) {
        // Start view transition
        await document.startViewTransition(async () => {
          // Update the content and run afterRender
          this.#content.innerHTML = await page.render();
          await page.afterRender();
          
          // TAMBAHAN: Update navigasi setelah render halaman tertentu
          // Khususnya setelah login/register berhasil
          this._updateNavigation();
        }).ready;
      } else {
        // Fallback for browsers without View Transition API
        this.#content.innerHTML = await page.render();
        
        // Add animation manually
        this.#content.style.opacity = '0';
        this.#content.style.transform = 'translateY(20px)';
        
        await page.afterRender();
        
        // TAMBAHAN: Update navigasi setelah render
        this._updateNavigation();
        
        // Animate content appearance
        const animation = this.#content.animate([
          { opacity: 0, transform: 'translateY(20px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], {
          duration: 300,
          easing: 'ease-out'
        });
        
        this.#content.style.opacity = '1';
        this.#content.style.transform = 'translateY(0)';
        
        await animation.finished;
      }
    } catch (error) {
      console.error('Error rendering page:', error);
    } finally {
      // Hide loading animation
      this._hideLoading();
    }
  }

  _showLoading() {
    // Create loading element if it doesn't exist
    let loadingElement = document.querySelector('.page-loading');
    if (!loadingElement) {
      loadingElement = document.createElement('div');
      loadingElement.className = 'page-loading';
      loadingElement.innerHTML = `
        <div class="loading-spinner">
          <div class="spinner"></div>
        </div>
      `;
      document.body.appendChild(loadingElement);
    }
    
    // Show loading with animation
    loadingElement.style.display = 'flex';
    loadingElement.animate([
      { opacity: 0 },
      { opacity: 1 }
    ], {
      duration: 200,
      fill: 'forwards'
    });
  }

  _hideLoading() {
    const loadingElement = document.querySelector('.page-loading');
    if (loadingElement) {
      const animation = loadingElement.animate([
        { opacity: 1 },
        { opacity: 0 }
      ], {
        duration: 200,
        fill: 'forwards'
      });
      
      animation.onfinish = () => {
        loadingElement.style.display = 'none';
      };
    }
  }

  _updateNavigation() {
    const navList = document.querySelector('#nav-list');
    if (!navList) return;

    // Validasi token dengan lebih baik
    const token = localStorage.getItem('token');
    const isLoggedIn = token !== null && token !== undefined && token !== '';

    if (isLoggedIn) {
      const userName = localStorage.getItem('userName') || 'User';
      navList.innerHTML = `
        <li><a href="#" id="logout-link">Logout</a></li>
      `;

      const logoutLink = document.querySelector('#logout-link');
      logoutLink?.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        
        // Dispatch custom event untuk memberitahu perubahan auth state
        window.dispatchEvent(new CustomEvent('authStateChanged'));
        
        window.location.hash = '/login';
        // Update navigasi setelah logout sudah dilakukan via event listener
      });
    } else {
      navList.innerHTML = `
        <li><a href="#/login">Login</a></li>
        <li><a href="#/register">Register</a></li>
      `;
    }
  }

  // TAMBAHAN: Method untuk force update navigation (bisa dipanggil dari luar)
  forceUpdateNavigation() {
    this._updateNavigation();
  }
}

export default App;