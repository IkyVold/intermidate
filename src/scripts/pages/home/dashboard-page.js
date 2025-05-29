import DashboardPresenter from './dashboard-presenter.js';
import { 
  initializePushNotifications, 
  isPushNotificationEnabled, 
  getNotificationPermission,
  sendPushNotification,
  unsubscribeFromPush
} from '../../data/api.js';

export default class DashboardPage {
  constructor() {
    this.map = null;
    this.stories = [];
    this.notificationSettings = {
      enabled: false,
      permission: 'default'
    };
  }

  async render() {
    const userName = localStorage.getItem('userName') || 'User';

    return `
      <section class="container">
        <div class="dashboard-header">
          <h1 class="dashboard-title">Welcome, ${userName}</h1>
          <div class="header-actions">
            <button id="notification-settings-btn" class="notification-btn">
              <i class="fas fa-bell"></i>
              <span>Notifications</span>
            </button>
          </div>
        </div>

        <!-- Notification Settings Modal -->
        <div id="notification-modal" class="modal" style="display: none;">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Notification Settings</h3>
              <span class="close" id="close-modal">×</span>
            </div>
            <div class="modal-body">
              <div class="notification-status">
                <div class="status-item">
                  <span class="status-label">Status:</span>
                  <span id="notification-status" class="status-value">Checking...</span>
                </div>
                <div class="status-item">
                  <span class="status-label">Permission:</span>
                  <span id="permission-status" class="status-value">Unknown</span>
                </div>
              </div>
              <div class="notification-actions">
                <button id="enable-notifications" class="btn btn-primary">Enable Notifications</button>
                <button id="disable-notifications" class="btn btn-secondary">Disable Notifications</button>
                <button id="test-notification" class="btn btn-info">Test Notification</button>
              </div>
            </div>
          </div>
        </div>

        <form id="story-form" class="auth-form">
          <a href="#/add-story" class="btn-add-story">Add Story</a>
        </form>

        <div class="view-toggles">
          <button id="list-view-btn" class="view-toggle-btn active">List View</button>
          <button id="map-view-btn" class="view-toggle-btn">Map View</button>
        </div>

        <!-- Loading indicator -->
        <div id="loading-indicator" class="loading" style="display: none;">
          <div class="loading-spinner"></div>
          <span>Loading stories...</span>
        </div>

        <!-- Error message container -->
        <div id="error-container" class="error-container" style="display: none;">
          <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <span id="error-text"></span>
            <button id="retry-btn" class="btn btn-sm">Retry</button>
          </div>
        </div>

        <div id="list-view">
          <h2 class="stories-heading">Stories</h2>
          <div id="story-list" class="story-list"></div>
        </div>

        <div id="map-view" style="display: none;">
          <h2 class="stories-heading">Story Locations</h2>
          <div id="map" class="map-container"></div>
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
        
        .notification-btn {
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
        }
        
        .notification-btn:hover {
          background-color: #eaecf4;
        }
        
        .notification-btn.enabled {
          background-color: #1cc88a;
          color: white;
          border-color: #1cc88a;
        }
        
        .auth-form {
          margin-top: 1.5rem;
          display: flex;
          justify-content: flex-start;
        }
        
        .btn-add-story {
          display: inline-block;
          background-color: #4e73df;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          text-decoration: none;
          font-weight: 600;
          transition: background-color 0.3s ease;
          box-shadow: 0 4px 6px rgba(78, 115, 223, 0.25);
        }
        
        .btn-add-story:hover {
          background-color: #375ace;
          transform: translateY(-2px);
        }
        
        .view-toggles {
          margin: 2rem 0 1rem;
          display: flex;
          gap: 1rem;
        }
        
        .view-toggle-btn {
          padding: 0.5rem 1rem;
          background-color: #f8f9fc;
          border: 1px solid #e3e6f0;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .view-toggle-btn:hover {
          background-color: #eaecf4;
        }
        
        .view-toggle-btn.active {
          background-color: #4e73df;
          color: white;
          border-color: #4e73df;
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
        
        .map-container {
          width: 100%;
          height: 500px;
          border-radius: 0.75rem;
          overflow: hidden;
          border: 1px solid #e3e6f0;
          box-shadow: 0 0.15rem 1.75rem rgba(34, 39, 46, 0.1);
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
        
        /* Modal Styles */
        .modal {
          position: fixed;
          z-index: 1000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.5);
        }
        
        .modal-content {
          background-color: #fefefe;
          margin: 10% auto;
          padding: 0;
          border-radius: 0.75rem;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 0.5rem 2rem rgba(34, 39, 46, 0.15);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e3e6f0;
        }
        
        .modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          color: #333;
        }
        
        .close {
          color: #aaa;
          font-size: 1.5rem;
          font-weight: bold;
          cursor: pointer;
        }
        
        .close:hover {
          color: #333;
        }
        
        .modal-body {
          padding: 1.5rem;
        }
        
        .notification-status {
          margin-bottom: 1.5rem;
        }
        
        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        
        .status-label {
          font-weight: 600;
          color: #333;
        }
        
        .status-value {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .status-value.enabled {
          background-color: #d4edda;
          color: #155724;
        }
        
        .status-value.disabled {
          background-color: #f8d7da;
          color: #721c24;
        }
        
        .status-value.pending {
          background-color: #fff3cd;
          color: #856404;
        }
        
        .notification-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        
        .btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
          text-align: center;
          text-decoration: none;
          display: inline-block;
        }
        
        .btn-primary {
          background-color: #4e73df;
          color: white;
        }
        
        .btn-primary:hover {
          background-color: #375ace;
        }
        
        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }
        
        .btn-secondary:hover {
          background-color: #545b62;
        }
        
        .btn-info {
          background-color: #36b9cc;
          color: white;
        }
        
        .btn-info:hover {
          background-color: #2c9faf;
        }
        
        .btn-sm {
          padding: 0.25rem 0.5rem;
          font-size: 0.875rem;
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
          border: 3px solid #f3f3f3;
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
          
          .map-container {
            height: 400px;
          }
          
          .modal-content {
            margin: 5% auto;
            width: 95%;
          }
          
          .notification-actions {
            flex-direction: column;
          }
          
          .toast {
            bottom: 1rem;
            right: 1rem;
            left: 1rem;
          }
        }
        
        @media (max-width: 576px) {
          .story-list {
            grid-template-columns: 1fr;
          }
          
          .dashboard-title {
            font-size: 1.75rem;
          }
          
          .stories-heading {
            font-size: 1.5rem;
          }
          
          .map-container {
            height: 350px;
          }
        }
      </style>
    `;
  }

  async afterRender() {
    await this.initializeNotificationSettings();
    this.setupEventListeners();
    this.loadExternalResources();
    await this.loadStories();
  }
  
  async initializeNotificationSettings() {
    this.notificationSettings.enabled = await isPushNotificationEnabled();
    this.notificationSettings.permission = getNotificationPermission();
    this.updateNotificationButton();
    
    if (!this.notificationSettings.enabled && this.notificationSettings.permission === 'granted') {
      try {
        await initializePushNotifications();
        this.notificationSettings.enabled = await isPushNotificationEnabled();
        this.updateNotificationButton();
      } catch (error) {
        console.error('Failed to initialize push notifications during setup:', error);
      }
    }
  }
  
  updateNotificationButton() {
    const notificationBtn = document.getElementById('notification-settings-btn');
    if (notificationBtn) {
      if (this.notificationSettings.enabled) {
        notificationBtn.classList.add('enabled');
        notificationBtn.innerHTML = '<i class="fas fa-bell"></i><span>Notifications On</span>';
      } else {
        notificationBtn.classList.remove('enabled');
        notificationBtn.innerHTML = '<i class="fas fa-bell-slash"></i><span>Notifications Off</span>';
      }
    }
  }
  
  setupEventListeners() {
    const listViewBtn = document.getElementById('list-view-btn');
    const mapViewBtn = document.getElementById('map-view-btn');
    const listView = document.getElementById('list-view');
    const mapView = document.getElementById('map-view');
    
    listViewBtn.addEventListener('click', () => {
      listView.style.display = 'block';
      mapView.style.display = 'none';
      listViewBtn.classList.add('active');
      mapViewBtn.classList.remove('active');
    });
    
    mapViewBtn.addEventListener('click', () => {
      listView.style.display = 'none';
      mapView.style.display = 'block';
      listViewBtn.classList.remove('active');
      mapViewBtn.classList.add('active');
      
      if (!this.map) {
        this.initMap();
      }
    });
    
    const notificationBtn = document.getElementById('notification-settings-btn');
    const modal = document.getElementById('notification-modal');
    const closeModal = document.getElementById('close-modal');
    const enableBtn = document.getElementById('enable-notifications');
    const disableBtn = document.getElementById('disable-notifications');
    const testBtn = document.getElementById('test-notification');
    const retryBtn = document.getElementById('retry-btn');
    
    notificationBtn.addEventListener('click', () => {
      this.showNotificationModal();
    });
    
    closeModal.addEventListener('click', () => {
      modal.style.display = 'none';
    });
    
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
    
    enableBtn.addEventListener('click', async () => {
      await this.enableNotifications();
    });
    
    disableBtn.addEventListener('click', async () => {
      await this.disableNotifications();
    });
    
    testBtn.addEventListener('click', async () => {
      await this.testNotification();
    });
    
    retryBtn.addEventListener('click', () => {
      this.loadStories();
    });
  }
  
  showNotificationModal() {
    const modal = document.getElementById('notification-modal');
    const statusElement = document.getElementById('notification-status');
    const permissionElement = document.getElementById('permission-status');
    
    if (this.notificationSettings.enabled) {
      statusElement.textContent = 'Enabled';
      statusElement.className = 'status-value enabled';
    } else {
      statusElement.textContent = 'Disabled';
      statusElement.className = 'status-value disabled';
    }
    
    switch (this.notificationSettings.permission) {
      case 'granted':
        permissionElement.textContent = 'Granted';
        permissionElement.className = 'status-value enabled';
        break;
      case 'denied':
        permissionElement.textContent = 'Denied';
        permissionElement.className = 'status-value disabled';
        break;
      case 'default':
        permissionElement.textContent = 'Not Requested';
        permissionElement.className = 'status-value pending';
        break;
      default:
        permissionElement.textContent = 'Unsupported';
        permissionElement.className = 'status-value disabled';
    }
    
    modal.style.display = 'block';
  }
  
  async enableNotifications() {
    try {
      this.showToast('Requesting notification permission...', 'info');
      const result = await initializePushNotifications();
      this.notificationSettings.enabled = await isPushNotificationEnabled();
      this.notificationSettings.permission = getNotificationPermission();
      this.updateNotificationButton();
      this.showNotificationModal();
      if (result.success) {
        this.showToast('Push notifications enabled successfully!', 'success');
      } else {
        this.showToast('Failed to enable notifications on server. Notifications may still work locally.', 'info');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      this.notificationSettings.enabled = false;
      this.updateNotificationButton();
      this.showNotificationModal();
      this.showToast('Failed to enable notifications.', 'error');
    }
  }
  
  async disableNotifications() {
    try {
      const result = await unsubscribeFromPush();
      this.notificationSettings.enabled = await isPushNotificationEnabled();
      this.updateNotificationButton();
      this.showNotificationModal();
      if (result.success) {
        this.showToast('Push notifications disabled', 'success');
      } else {
        this.showToast('Failed to disable notifications on server.', 'info');
      }
    } catch (error) {
      console.error('Error disabling notifications:', error);
      this.notificationSettings.enabled = false;
      this.updateNotificationButton();
      this.showNotificationModal();
      this.showToast('Failed to disable notifications.', 'error');
    }
  }
  
  async testNotification() {
    try {
      if (!this.notificationSettings.enabled) {
        this.showToast('Notifications are not enabled.', 'info');
        return;
      }
      const result = await sendPushNotification(
        'Test Notification',
        'This is a test notification from Story App!'
      );
      if (result.success) {
        this.showToast('Test notification sent!', 'success');
      } else {
        this.showToast('Failed to send test notification.', 'info');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      this.showToast('Failed to send test notification.', 'error');
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
  
  async loadStories() {
    const storyList = document.querySelector('#story-list');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorContainer = document.getElementById('error-container');
    const errorText = document.getElementById('error-text');
    
    loadingIndicator.style.display = 'flex';
    errorContainer.style.display = 'none';
    storyList.innerHTML = '';
    
    try {
      const result = await DashboardPresenter.getAllStoriesWithLocation();

      loadingIndicator.style.display = 'none';

      if (result.error) {
        errorText.textContent = result.message;
        errorContainer.style.display = 'block';
        return;
      }

      const stories = result.listStory;
      
      if (!stories || stories.length === 0) {
        storyList.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
            <i class="fas fa-book-open" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
            <h3 style="color: #666; margin-bottom: 0.5rem;">No Stories Yet</h3>
            <p style="color: #999;">Be the first to share your story!</p>
            <a href="#/add-story" class="btn btn-primary" style="margin-top: 1rem;">Add Your First Story</a>
          </div>
        `;
        return;
      }
      
      storyList.innerHTML = stories.map((story) => `
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
              <span>${new Date(story.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      `).join('');
      
      this.stories = stories;
      
      this.initializeServiceWorker();
    } catch (error) {
      console.error('Error loading stories:', error);
      loadingIndicator.style.display = 'none';
      errorText.textContent = 'Failed to load stories. Please try again.';
      errorContainer.style.display = 'block';
    }
  }
  
  async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.bundle.js');
        console.log('Service Worker registered:', registration);
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showToast('App updated! Refresh to get the latest version.', 'info');
            }
          });
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }
  
  loadExternalResources() {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
    
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      document.head.appendChild(script);
    }
    
    if (!document.getElementById('font-awesome')) {
      const link = document.createElement('link');
      link.id = 'font-awesome';
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
      document.head.appendChild(link);
    }
  }

  initMap() {
    const checkLeaflet = () => {
      if (typeof L !== 'undefined') {
        this.createMap();
      } else {
        setTimeout(checkLeaflet, 100);
      }
    };
    checkLeaflet();
  }
  
  createMap() {
    try {
      this.map = L.map('map').setView([-6.2088, 106.8456], 10);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(this.map);
      
      if (this.stories && this.stories.length > 0) {
        const markersGroup = L.featureGroup();
        this.stories.forEach(story => {
          if (story.lat && story.lon) {
            const marker = L.marker([story.lat, story.lon])
              .bindPopup(`
                <div class="map-popup">
                  <h4>${story.name}</h4>
                  <p>${story.description.substring(0, 100)}${story.description.length > 100 ? '...' : ''}</p>
                  <small>Created: ${new Date(story.createdAt).toLocaleDateString()}</small>
                </div>
              `);
            markersGroup.addLayer(marker);
          }
        });
        if (markersGroup.getLayers().length > 0) {
          this.map.addLayer(markersGroup);
          this.map.fitBounds(markersGroup.getBounds(), { padding: [20, 20] });
        }
      }
      
      this.addMapStyles();
    } catch (error) {
      console.error('Error initializing map:', error);
      const mapContainer = document.getElementById('map');
      mapContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">
          <div style="text-align: center;">
            <i class="fas fa-map-marked-alt" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <p>Unable to load map. Please try again later.</p>
          </div>
        </div>
      `;
    }
  }
  
  addMapStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .map-popup { max-width: 250px; }
      .map-popup h4 { margin: 0 0 0.5rem 0; font-size: 1.1rem; color: #333; }
      .map-popup p { margin: 0 0 0.5rem 0; font-size: 0.9rem; color: #666; line-height: 1.4; }
      .map-popup small { color: #999; font-size: 0.8rem; }
      .leaflet-popup-content-wrapper { border-radius: 0.5rem; box-shadow: 0 0.25rem 1rem rgba(0,0,0,0.15); }
      .leaflet-popup-tip { border-radius: 0.25rem; }
    `;
    if (!document.getElementById('map-custom-styles')) {
      style.id = 'map-custom-styles';
      document.head.appendChild(style);
    }
  }
  
  async refreshStories() {
    await this.loadStories();
    if (this.map && document.getElementById('map-view').style.display !== 'none') {
      this.map.remove();
      this.map = null;
      this.initMap();
    }
  }
  
  handleOfflineState() {
    const offlineHandler = () => {
      this.showToast('You are now offline. Some features may be limited.', 'info');
    };
    const onlineHandler = () => {
      this.showToast('Connection restored!', 'success');
      this.refreshStories();
    };
    window.addEventListener('offline', offlineHandler);
    window.addEventListener('online', onlineHandler);
  }
  
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    });
  }
  
  async addUserLocationToMap() {
    if (!this.map) return;
    try {
      const userLocation = await this.getCurrentLocation();
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: '<i class="fas fa-user-circle"></i>',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      L.marker([userLocation.lat, userLocation.lon], { icon: userIcon })
        .addTo(this.map)
        .bindPopup('Your Location')
        .openPopup();
      this.map.setView([userLocation.lat, userLocation.lon], 12);
      const userMarkerStyle = document.createElement('style');
      userMarkerStyle.textContent = `
        .user-location-marker { background: none; border: none; }
        .user-location-marker i { color: #4e73df; font-size: 30px; text-shadow: 0 0 10px rgba(78, 115, 223, 0.5); }
      `;
      if (!document.getElementById('user-marker-styles')) {
        userMarkerStyle.id = 'user-marker-styles';
        document.head.appendChild(userMarkerStyle);
      }
    } catch (error) {
      console.error('Error getting user location:', error);
      this.showToast('Unable to get your location', 'error');
    }
  }
  
  cleanup() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    window.removeEventListener('offline', this.handleOfflineState);
    window.removeEventListener('online', this.handleOfflineState);
  }
  
  setupSearchFunctionality() {}
  
  exportStoriesData() {
    if (!this.stories || this.stories.length === 0) {
      this.showToast('No stories to export', 'error');
      return;
    }
    const dataStr = JSON.stringify(this.stories, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stories_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.showToast('Stories exported successfully!', 'success');
  }
}