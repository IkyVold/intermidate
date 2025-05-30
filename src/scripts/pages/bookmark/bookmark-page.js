import BookmarkPresenter from './bookmark-presenter.js';
import { getNotificationPermission } from '../../data/api.js';

export default class BookmarkPage {
  constructor() {
    this.bookmarkedStories = BookmarkPresenter.getBookmarkedStories();
  }

  async render() {
    const userName = localStorage.getItem('userName') || 'User';

    return `
      <section class="container">
        <div class="dashboard-header">
          <h1 class="dashboard-title">Your Bookmarks, ${userName}</h1>
          <div class="header-actions">
            <a href="#/dashboard" class="home-btn">
              <i class="fas fa-home"></i>
              <span>Home</span>
            </a>
          </div>
        </div>

        <!-- Story Detail Modal -->
        <div id="story-detail-modal" class="modal" style="display: none;">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Story Details</h3>
              <span class="close" id="close-story-modal">×</span>
            </div>
            <div class="modal-body" id="story-detail-content">
              <div class="loading" style="display: none;">
                <div class="loading-spinner"></div>
                <span>Loading story details...</span>
              </div>
              <div id="story-detail-error" class="error-container" style="display: none;">
                <div class="error-message">
                  <i class="fas fa-exclamation-triangle"></i>
                  <span id="story-error-text"></span>
                </div>
              </div>
              <div id="story-detail-data" style="display: none;"></div>
            </div>
          </div>
        </div>

        <!-- Loading indicator -->
        <div id="loading-indicator" class="loading" style="display: none;">
          <div class="loading-spinner"></div>
          <span>Loading bookmarks...</span>
        </div>

        <!-- Error message container -->
        <div id="error-container" class="error-container" style="display: none;">
          <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <span id="error-text"></span>
            <button id="retry-btn" class="btn btn-sm">Retry</button>
          </div>
        </div>

        <div id="bookmark-view">
          <h2 class="stories-heading">Bookmarked Stories</h2>
          <div id="bookmark-list" class="story-list"></div>
        </div>

        <!-- Toast notification -->
        <div id="toast" class="toast" style="display: none;">
          <div class="toast-content">
            <i class="toast-icon"></i>
            <span class="toast-message"></span>
          </div>
        </div>
      </section>

      <style>
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }
        
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .dashboard-title {
          font-size: 2rem;
          color: #333;
          margin: 0;
        }
        
        .header-actions {
          display: flex;
          gap: 1rem;
        }
        
        .home-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: #f8f9fc;
          border: 1px solid #e3e6f0;
          border-radius: 0.5rem;
          padding: 0.5rem 1rem;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        
        .home-btn:hover {
          background-color: #eaecf4;
        }
        
        .stories-heading {
          font-size: 1.75rem;
          color: #333;
          margin: 1.5rem 0 1.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #f1f1f1;
        }
        
        .story-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        
        .story-card {
          border: 1px solid #e3e6f0;
          border-radius: 0.75rem;
          overflow: hidden;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          background-color: #fff;
          box-shadow: 0 0.15rem 1.75rem rgba(34, 39, 46, 0.1);
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .story-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.5rem 2rem rgba(34, 39, 46, 0.15);
        }
        
        .story-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
        }
        
        .story-content {
          padding: 1.25rem;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }
        
        .story-title {
          font-size: 1.25rem;
          color: #333;
          margin-bottom: 0.75rem;
          font-weight: 600;
        }
        
        .story-description {
          font-size: 0.95rem;
          color: #666;
          line-height: 1.6;
          margin-bottom: 1rem;
          flex-grow: 1;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
        }
        
        .story-footer {
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          color: #777;
        }
        
        .location-badge {
          display: inline-flex;
          align-items: center;
          background-color: #e3f2fd;
          color: #1565c0;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.8rem;
          margin-top: 0.5rem;
        }
        
        .location-badge i {
          margin-right: 0.25rem;
          font-size: 0.9rem;
        }
        
        .bookmark-toggle {
          background: none;
          border: none;
          color: #f1c40f;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0.5rem;
          transition: all 0.2s ease;
        }
        
        .bookmark-toggle.bookmarked {
          color: #d4a017;
        }
        
        .bookmark-toggle:hover {
          transform: scale(1.2);
        }
        
        /* Modal Styles */
        .modal {
          position: fixed;
          z-index: 1000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.5);
          overflow-y: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          box-sizing: border-box;
        }
        
        .modal-content {
          background-color: #fefefe;
          margin: 0 auto;
          padding: 0;
          border-radius: 0.75rem;
          width: 100%;
          max-width: 600px;
          box-shadow: 0 0.5rem 2rem rgba(34, 39, 46, 0.15);
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid #e3e6f0;
          flex-shrink: 0;
        }
        
        .modal-header h3 {
          margin: 0;
          font-size: clamp(1rem, 4vw, 1.25rem);
          color: #333;
        }
        
        .close {
          color: #aaa;
          font-size: clamp(1.2rem, 4vw, 1.5rem);
          font-weight: bold;
          cursor: pointer;
        }
        
        .close:hover {
          color: #333;
        }
        
        .modal-body {
          padding: 1rem;
          flex-grow: 1;
          overflow-y: auto;
        }
        
        .modal-body img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          display: block;
        }
        
        .modal-body p {
          margin: 0 0 0.75rem;
          font-size: clamp(0.85rem, 3vw, 0.95rem);
          line-height: 1.5;
          color: #333;
        }
        
        .modal-body p strong {
          color: #333;
          font-weight: 600;
        }
        
        .bookmark-toggle.btn {
          width: 100%;
          margin-top: 1rem;
          text-align: center;
          font-size: clamp(0.85rem, 3vw, 0.95rem);
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
        }
        
        /* Loading Styles */
        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 2rem;
          color: #666;
        }
        
        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #f3f3f0;
          border-top: 3px solid #4e73df;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Error Styles */
        .error-container {
          margin: 1rem 0;
        }
        
        .error-message {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
          border-radius: 0.5rem;
        }
        
        .error-message i {
          font-size: 1.25rem;
        }
        
        /* Toast Styles */
        .toast {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          z-index: 1050;
          background-color: #333;
          color: white;
          padding: 1rem;
          border-radius: 0.5rem;
          box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15);
          transition: all 0.3s ease;
        }
        
        .toast.success {
          background-color: #1cc88a;
        }
        
        .toast.error {
          background-color: #e74a3b;
        }
        
        .toast.info {
          background-color: #36b9cc;
        }
        
        .toast-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
          
          .story-list {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          }
          
          .modal-content {
            width: 95%;
            max-height: 85vh;
          }
          
          .toast {
            bottom: 1rem;
            right: 1rem;
            left: 1rem;
            max-width: calc(100% - 2rem);
          }
        }
        
        @media (max-width: 576px) {
          .story-list {
            grid-template-columns: 1fr;
          }
          
          .dashboard-title {
            font-size: clamp(1.5rem, 5vw, 1.75rem);
          }
          
          .stories-heading {
            font-size: clamp(1.25rem, 4vw, 1.5rem);
          }
          
          .modal-content {
            width: 90%;
            max-height: 80vh;
          }
          
          .modal-body {
            padding: 0.75rem;
          }
          
          .modal-body img {
            margin-bottom: 0.5rem;
          }
        }

        .view-detail-btn {
          background-color: #36b9cc;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          text-decoration: none;
          font-weight: 500;
          transition: background-color 0.3s ease;
          margin-top: 0.5rem;
          display: inline-block;
        }
        
        .view-detail-btn:hover {
          background-color: #2c9faf;
        }
      </style>
    `;
  }

  async afterRender() {
    this.loadExternalResources();
    this.setupEventListeners();
    await this.loadBookmarks();
  }

  setupEventListeners() {
    const closeStoryModal = document.getElementById('close-story-modal');
    const storyModal = document.getElementById('story-detail-modal');
    const bookmarkList = document.getElementById('bookmark-list');
    const retryBtn = document.getElementById('retry-btn');

    closeStoryModal.addEventListener('click', () => {
      storyModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
      if (event.target === storyModal) {
        storyModal.style.display = 'none';
      }
    });

    bookmarkList.addEventListener('click', async (event) => {
      if (event.target.classList.contains('view-detail-btn')) {
        const storyId = event.target.dataset.storyId;
        await this.showStoryDetail(storyId);
      }
      if (event.target.classList.contains('bookmark-toggle')) {
        const storyId = event.target.dataset.storyId;
        this.toggleBookmark(storyId);
      }
    });

    retryBtn.addEventListener('click', () => {
      this.loadBookmarks();
    });
  }

  async showStoryDetail(storyId) {
    const modal = document.getElementById('story-detail-modal');
    const content = document.getElementById('story-detail-content');
    const errorContainer = document.getElementById('story-detail-error');
    const errorText = document.getElementById('story-error-text');
    const dataContainer = document.getElementById('story-detail-data');
    const loading = content.querySelector('.loading');

    loading.style.display = 'flex';
    errorContainer.style.display = 'none';
    dataContainer.style.display = 'none';
    modal.style.display = 'block';

    try {
      const result = await BookmarkPresenter.getStoryDetail(storyId);
      
      loading.style.display = 'none';
      
      if (result.error) {
        errorText.textContent = result.message || 'Failed to load story details.';
        errorContainer.style.display = 'block';
        return;
      }

      const story = result.story;
      dataContainer.innerHTML = `
        <img 
          src="${story.photoUrl}" 
          alt="${story.name}" 
          class="story-detail-image"
          onerror="this.onerror=null;this.src='https://via.placeholder.com/300x200?text=Image+Not+Found';"
        />
        <h3 class="story-detail-title">${story.name}</h3>
        <p class="story-detail-description">${story.description}</p>
        <p class="story-detail-meta">Created: ${new Date(story.createdAt).toLocaleDateString()}</p>
        ${story.lat && story.lon ? 
          `<p class="story-detail-location">
            <i class="fas fa-map-marker-alt"></i>
            Location: ${story.lat.toFixed(4)}, ${story.lon.toFixed(4)}
          </p>` : ''}
        <button class="bookmark-toggle btn bookmarked" data-story-id="${story.id}">
          <i class="fas fa-bookmark"></i> Remove Bookmark
        </button>
      `;
      dataContainer.style.display = 'block';

      dataContainer.querySelector('.bookmark-toggle').addEventListener('click', () => {
        this.toggleBookmark(storyId);
        this.showStoryDetail(storyId); // Refresh modal
      });
    } catch (error) {
      console.error('Error fetching story details:', error);
      loading.style.display = 'none';
      errorText.textContent = 'Failed to load story details. Please try again.';
      errorContainer.style.display = 'block';
    }
  }

  async loadBookmarks() {
    const bookmarkList = document.querySelector('#bookmark-list');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorContainer = document.getElementById('error-container');
    const errorText = document.getElementById('error-text');

    loadingIndicator.style.display = 'flex';
    errorContainer.style.display = 'none';
    bookmarkList.innerHTML = '';

    try {
      this.bookmarkedStories = BookmarkPresenter.getBookmarkedStories();

      loadingIndicator.style.display = 'none';

      if (!this.bookmarkedStories || this.bookmarkedStories.length === 0) {
        bookmarkList.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
            <i class="fas fa-bookmark" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
            <h3 style="color: #666; margin-bottom: 0.5rem;">No Bookmarked Stories</h3>
            <p style="color: #999;">Bookmark stories from the home page to see them here!</p>
            <a href="#/dashboard" class="btn btn-primary" style="margin-top: 1rem;">Go to Home</a>
          </div>
        `;
        return;
      }

      bookmarkList.innerHTML = this.bookmarkedStories.map((story) => `
        <div class="story-card">
          <img 
            src="${story.photoUrl}" 
            alt="${story.name}" 
            class="story-image" 
            onerror="this.onerror=null;this.src='https://via.placeholder.com/300x200?text=Image+Not+Found';"
          />
          <div class="story-content">
            <h3 class="story-title">${story.name}</h3>
            <p class="story-description">${story.description}</p>
            ${story.lat && story.lon ? 
              `<div class="location-badge">
                <i class="fas fa-map-marker-alt"></i> Has Location
              </div>` : ''}
            <div class="story-footer">
              <span>By ${story.name}</span>
              <div>
                <button class="bookmark-toggle bookmarked" data-story-id="${story.id}">
                  <i class="fas fa-bookmark"></i>
                </button>
                <span>${new Date(story.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <a href="javascript:void(0)" class="view-detail-btn" data-story-id="${story.id}">View Detail</a>
          </div>
        </div>
      `).join('');

    } catch (error) {
      console.error('Error loading bookmarks:', error);
      loadingIndicator.style.display = 'none';
      errorText.textContent = 'Failed to load bookmarks. Please try again.';
      errorContainer.style.display = 'block';
    }
  }

  toggleBookmark(storyId) {
    const index = this.bookmarkedStories.findIndex(s => s.id === storyId);
    if (index !== -1) {
      this.bookmarkedStories.splice(index, 1);
      this.showToast('Story removed from bookmarks!', 'info');
      localStorage.setItem('bookmarkedStories', JSON.stringify(this.bookmarkedStories));
      this.loadBookmarks();
    }
  }

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const icon = toast.querySelector('.toast-icon');
    const messageElement = toast.querySelector('.toast-message');

    switch (type) {
      case 'success':
        icon.className = 'toast-icon fas fa-check-circle';
        toast.className = 'toast success';
        break;
      case 'error':
        icon.className = 'toast-icon fas fa-exclamation-circle';
        toast.className = 'toast error';
        break;
      case 'info':
      default:
        icon.className = 'toast-icon fas fa-info-circle';
        toast.className = 'toast info';
        break;
    }

    messageElement.textContent = message;
    toast.style.display = 'block';

    setTimeout(() => {
      toast.style.display = 'none';
    }, 4000);
  }

  loadExternalResources() {
    if (!document.getElementById('font-awesome')) {
      const link = document.createElement('link');
      link.id = 'font-awesome';
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
      document.head.appendChild(link);
    }
  }

  cleanup() {
    window.removeEventListener('click', this.handleModalClick);
  }
}