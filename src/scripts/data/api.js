import CONFIG from '../config.js';

const ENDPOINTS = {
  LOGIN: `${CONFIG.BASE_URL}/login`,
  REGISTER: `${CONFIG.BASE_URL}/register`,
  STORIES: `${CONFIG.BASE_URL}/stories`,
  STORIES_WITH_LOCATION: `${CONFIG.BASE_URL}/stories?location=1`,
  NOTIFICATIONS_SUBSCRIBE: `${CONFIG.BASE_URL}/notifications/subscribe`,
};

const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

async function apiRequest(url, options = {}) {
  try {
    console.log('Sending API request to:', url, 'with options:', options);
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('API request failed with status:', response.status, 'Response:', result);
      return { error: true, message: result.message || `Request failed with status ${response.status}.`, status: response.status };
    }
    
    return result;
  } catch (error) {
    console.error('API request error:', error);
    return { error: true, message: 'Network error.' };
  }
}

function getAuthToken() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No authentication token found in localStorage.');
  }
  return token;
}

function createAuthHeaders(additionalHeaders = {}) {
  const token = getAuthToken();
  if (!token) {
    console.warn('No token available for Authorization header.');
    return { ...additionalHeaders };
  }
  return {
    'Authorization': `Bearer ${token}`,
    ...additionalHeaders,
  };
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function initializePushNotifications() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported');
      return { error: true };
    }

    console.log('Registering Service Worker...');
    const registration = await navigator.serviceWorker.register('/sw.bundle.js');
    console.log('Service Worker registered:', registration);

    console.log('Requesting notification permission...');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return { error: true };
    }

    console.log('Subscribing to push notifications...');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    console.log('Push subscription created:', subscription);

    const token = getAuthToken();
    if (token) {
      console.log('Sending subscription to server...');
      console.log('Subscription data being sent:', JSON.stringify(subscription, null, 2));
      const response = await apiRequest(ENDPOINTS.NOTIFICATIONS_SUBSCRIBE, {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify({ subscription })
      });

      console.log('Server response:', response);
      if (response.error) {
        console.error('Failed to subscribe on server:', response.message);
        return { error: true };
      }
      console.log('Subscription sent to server successfully');
    } else {
      console.warn('No token available, skipping server subscription');
    }

    localStorage.setItem('pushSubscription', JSON.stringify(subscription));
    return { success: true, subscription };
  } catch (error) {
    console.error('Error initializing push notifications:', error);
    return { error: true };
  }
}

export async function sendPushNotification(title, body) {
  try {
    if (!('Notification' in window)) {
      console.warn('Notifications are not supported');
      return;
    }

    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'story-notification',
        renotify: true,
        requireInteraction: false,
        silent: false
      });
      notification.onclick = function(event) {
        event.preventDefault();
        window.focus();
        notification.close();
      };
      setTimeout(() => notification.close(), 5000);
      return { success: true };
    } else {
      console.warn('Notification permission not granted');
      return { error: true };
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { error: true };
  }
}

export async function loginUser({ email, password }) {
  await new Promise(resolve => setTimeout(resolve, 800));
  const result = await apiRequest(ENDPOINTS.LOGIN, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (!result.error) {
    await initializePushNotifications();
  }

  return result;
}

export async function registerUser({ name, email, password }) {
  const result = await apiRequest(ENDPOINTS.REGISTER, {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });

  if (!result.error) {
    await initializePushNotifications();
  }

  return result;
}

export async function getAllStories() {
  const token = getAuthToken();
  if (!token) {
    return { error: true, message: 'Unauthorized. Please login.' };
  }

  return await apiRequest(ENDPOINTS.STORIES, {
    method: 'GET',
    headers: createAuthHeaders(),
  });
}

export async function getAllStoriesWithLocation() {
  const token = getAuthToken();
  if (!token) {
    return { error: true, message: 'Unauthorized. Please login.' };
  }

  return await apiRequest(ENDPOINTS.STORIES_WITH_LOCATION, {
    method: 'GET',
    headers: createAuthHeaders(),
  });
}

export async function addNewStory({ description, photo, audioRecording = null, lat = null, lon = null }) {
  const token = getAuthToken();
  if (!token) {
    return { error: true, message: 'User is not authenticated.' };
  }

  try {
    const formData = new FormData();
    formData.append('description', description);
    formData.append('photo', photo);
    
    if (lat !== null) formData.append('lat', lat);
    if (lon !== null) formData.append('lon', lon);
    
    if (audioRecording) {
      const audioFile = new File([audioRecording], 'audio.webm', { type: 'audio/webm' });
      formData.append('audio', audioFile);
    }

    const response = await fetch(ENDPOINTS.STORIES, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const result = await response.json();
    
    if (!response.ok) {
      return {
        error: true,
        message: result.message || 'Failed to submit story. Please try again.',
        status: response.status,
      };
    }
    
    // Tambahkan pengecekan status notifikasi sebelum mengirim notifikasi
    if (result && !result.error && await isPushNotificationEnabled()) {
      await sendPushNotification(
        'Story berhasil dibuat',
        `Anda telah membuat story baru dengan deskripsi: ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`
      );
    }
    
    return result;
  } catch (error) {
    console.error('Add story API error:', error);
    return { error: true, message: 'Failed to submit story.' };
  }
}

export async function isPushNotificationEnabled() {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const subscription = await registration.pushManager.getSubscription();
      return subscription !== null;
    }
    return false;
  } catch (error) {
    console.error('Error checking push notification status:', error);
    return false;
  }
}

export function getNotificationPermission() {
  if ('Notification' in window) {
    return Notification.permission;
  }
  return 'unsupported';
}

export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe(); // Batalkan langganan di client
        const token = getAuthToken();
        if (token) {
          await apiRequest(ENDPOINTS.NOTIFICATIONS_SUBSCRIBE, {
            method: 'DELETE',
            headers: createAuthHeaders(),
            body: JSON.stringify({ endpoint: subscription.endpoint })
          }); // Batalkan langganan di server
        }
        localStorage.removeItem('pushSubscription'); // Hapus dari localStorage
        return { success: true };
      }
    }
    return { error: true };
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    return { error: true };
  }
}