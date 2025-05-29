import AddStoryPresenter from './add-story-presenter.js';

export default class AddStoryPage {
  constructor() {
    this.audioBlob = null;
    this.location = null;
    this.map = null;
    this.marker = null;
    this.mediaStream = null;
    this.audioRecorder = null;
  }
  async render() {
    return `
      <section class="container">
        <h1>Add New Story</h1>
        <form id="add-story-form" class="auth-form">
          <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" name="description" placeholder="Enter your story description" required></textarea>
          </div>
          
          <div class="form-group">
            <label for="photo-input">Photo</label>
            <input type="file" name="photo" accept="image/*" id="photo-input" required />
          </div>
          
          <div class="media-capture-container">
            <button type="button" id="capture-photo" class="media-btn" aria-label="Capture photo using camera">
              <i class="fas fa-camera"></i> Capture Photo
            </button>
            <button type="button" id="record-audio" class="media-btn" aria-label="Record audio">
              <i class="fas fa-microphone"></i> Record Audio
            </button>
          </div>
          
          <div id="media-preview" class="media-preview">
            <img id="photo-preview" alt="Photo preview" style="display: none; max-width: 100%; margin-top: 10px;" />
            <audio id="audio-player" controls style="display: none; width: 100%; margin-top: 10px;" aria-label="Audio preview"></audio>
          </div>
          
          <div class="location-container">
            <div class="form-group checkbox-group">
              <input type="checkbox" id="include-location" name="include-location">
              <label for="include-location" class="location-label">Include my current location</label>
            </div>
            
            <button type="button" id="toggle-map" class="secondary-button" style="display: none;" aria-label="Toggle map visibility">
              Select Location on Map
            </button>
            <p id="location-info" class="location-info" aria-live="polite"></p>
            <p id="coordinates-display" style="display: none;" aria-live="polite">Location not selected</p>
            <div id="map" class="map-container" style="display: none; height: 300px;" role="application" aria-label="Interactive map"></div>
          </div>
          
          <button type="submit">Submit Story</button>
        </form>
        <p id="add-story-message" style="margin-top: 10px; color: red;" aria-live="assertive"></p>
      </section>
    `;
  }

  // Clean up method to stop all media streams
  cleanupMedia() {
    // Stop camera stream if active
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    // Stop audio recorder if active
    if (this.audioRecorder && this.audioRecorder.state === 'recording') {
      this.audioRecorder.stop();
      this.audioRecorder = null;
    }
  }

  async afterRender() {
    const form = document.querySelector('#add-story-form');
    const messageBox = document.querySelector('#add-story-message');
    const capturePhotoBtn = document.querySelector('#capture-photo');
    const recordAudioBtn = document.querySelector('#record-audio');
    const photoInput = document.querySelector('#photo-input');
    const photoPreview = document.querySelector('#photo-preview');
    const audioPlayer = document.querySelector('#audio-player');
    const includeLocationCheckbox = document.querySelector('#include-location');
    const toggleMapBtn = document.querySelector('#toggle-map');
    const locationInfo = document.querySelector('#location-info');
    const coordinatesDisplay = document.querySelector('#coordinates-display');
    const mapContainer = document.querySelector('#map');
    
    // Handle page navigation - clean up resources when user leaves the page
    const handlePageChange = () => {
      this.cleanupMedia();
    };
    
    // Add event listeners for page navigation
    window.addEventListener('hashchange', handlePageChange);
    window.addEventListener('beforeunload', handlePageChange);
    
    // Preview selected photo
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          photoPreview.src = e.target.result;
          photoPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });
    
    // Capture photo using device camera
    capturePhotoBtn.addEventListener('click', async () => {
      try {
        // Clean up previous media streams first
        this.cleanupMedia();
        
        // Request camera access
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        
        // Create video element to show camera feed
        const videoElement = document.createElement('video');
        videoElement.srcObject = this.mediaStream;
        videoElement.autoplay = true;
        videoElement.style.width = '100%';
        videoElement.setAttribute('aria-label', 'Camera preview');
        
        // Create canvas for capturing the photo
        const canvasElement = document.createElement('canvas');
        
        // Create capture button
        const takePictureBtn = document.createElement('button');
        takePictureBtn.textContent = 'Take Picture';
        takePictureBtn.className = 'media-btn';
        takePictureBtn.style.marginTop = '10px';
        
        // Create switch camera button
        const switchCameraBtn = document.createElement('button');
        switchCameraBtn.textContent = 'Switch Camera';
        switchCameraBtn.className = 'media-btn';
        switchCameraBtn.style.marginTop = '10px';
        switchCameraBtn.style.marginLeft = '10px';
        
        // Create close camera button
        const closeCameraBtn = document.createElement('button');
        closeCameraBtn.textContent = 'Close Camera';
        closeCameraBtn.className = 'media-btn';
        closeCameraBtn.style.marginTop = '10px';
        closeCameraBtn.style.marginLeft = '10px';
        
        // Clear preview area and add video elements
        const mediaPreview = document.querySelector('#media-preview');
        mediaPreview.innerHTML = '';
        mediaPreview.appendChild(videoElement);
        
        // Add buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.display = 'flex';
        buttonsContainer.appendChild(takePictureBtn);
        buttonsContainer.appendChild(switchCameraBtn);
        buttonsContainer.appendChild(closeCameraBtn);
        mediaPreview.appendChild(buttonsContainer);
        
        // Switch camera event
        let facingMode = 'environment';
        switchCameraBtn.addEventListener('click', async () => {
          // Stop current stream
          if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
          }
          
          // Toggle facing mode
          facingMode = facingMode === 'environment' ? 'user' : 'environment';
          
          try {
            // Start new stream with different camera
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
              video: { facingMode: facingMode } 
            });
            videoElement.srcObject = this.mediaStream;
          } catch (error) {
            messageBox.textContent = `Camera switch error: ${error.message}`;
          }
        });
        
        // Close camera event
        closeCameraBtn.addEventListener('click', () => {
          this.cleanupMedia();
          
          // Restore original preview if available
          mediaPreview.innerHTML = '';
          if (photoPreview.src) {
            photoPreview.style.display = 'block';
            mediaPreview.appendChild(photoPreview);
          }
          if (audioPlayer.src) {
            audioPlayer.style.display = 'block';
            mediaPreview.appendChild(audioPlayer);
          }
        });
        
        // Take picture event
        takePictureBtn.addEventListener('click', () => {
          // Set canvas dimensions to match video
          canvasElement.width = videoElement.videoWidth;
          canvasElement.height = videoElement.videoHeight;
          
          // Draw video frame to canvas
          canvasElement.getContext('2d').drawImage(
            videoElement, 0, 0, canvasElement.width, canvasElement.height
          );
          
          // Convert canvas to blob and create a File object
          canvasElement.toBlob((blob) => {
            const capturedPhoto = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' });
            
            // Create a FileList-like object
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(capturedPhoto);
            photoInput.files = dataTransfer.files;
            
            // Show preview and stop camera
            photoPreview.src = URL.createObjectURL(blob);
            photoPreview.style.display = 'block';
            
            // Clean up media stream
            this.cleanupMedia();
            
            // Update media preview
            mediaPreview.innerHTML = '';
            mediaPreview.appendChild(photoPreview);
            
            // Update accessibility announcement
            messageBox.textContent = 'Photo captured successfully';
            messageBox.style.color = 'green';
            setTimeout(() => { messageBox.textContent = ''; }, 3000);
          }, 'image/jpeg');
        });
        
      } catch (error) {
        messageBox.textContent = `Camera access error: ${error.message}`;
        console.error('Camera access error:', error);
      }
    });
    
    // Record audio
    recordAudioBtn.addEventListener('click', async () => {
      try {
        if (!this.audioRecorder) {
          // Clean up any previous media streams
          if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
          }
          
          // Start recording
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          this.mediaStream = stream; // Store stream reference for cleanup
          this.audioRecorder = new MediaRecorder(stream);
          
          const audioChunks = [];
          this.audioRecorder.addEventListener('dataavailable', event => {
            audioChunks.push(event.data);
          });
          
          this.audioRecorder.addEventListener('stop', () => {
            this.audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            audioPlayer.src = URL.createObjectURL(this.audioBlob);
            audioPlayer.style.display = 'block';
            recordAudioBtn.textContent = 'Record Audio';
            recordAudioBtn.style.backgroundColor = '#6c757d';
            
            // Attach audio to the form data
            const audioFile = new File([this.audioBlob], 'recorded-audio.webm', { type: 'audio/webm' });
            
            // Accessibility announcement
            messageBox.textContent = 'Audio recorded successfully';
            messageBox.style.color = 'green';
            setTimeout(() => { messageBox.textContent = ''; }, 3000);
          });
          
          this.audioRecorder.start();
          recordAudioBtn.textContent = 'Stop Recording';
          recordAudioBtn.style.backgroundColor = '#dc3545';
          messageBox.textContent = 'Recording audio...';
          messageBox.style.color = '#6c757d';
        } else {
          // Stop recording
          this.audioRecorder.stop();
          this.audioRecorder = null;
        }
      } catch (error) {
        messageBox.textContent = `Microphone access error: ${error.message}`;
        console.error('Microphone access error:', error);
      }
    });
    
    // Function to initialize the map
    const initializeMap = (lat, lng) => {
      // Check if Leaflet is available
      if (typeof L !== 'undefined') {
        // Create map if it doesn't exist
        if (!this.map) {
          this.map = L.map('map').setView([lat, lng], 13);
          
          // Add tile layer (OpenStreetMap)
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(this.map);
          
          // Create marker
          this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
          
          // Update location when marker is dragged
          this.marker.on('dragend', () => {
            const position = this.marker.getLatLng();
            this.location = {
              latitude: position.lat,
              longitude: position.lng,
              accuracy: 0  // No accuracy available for manually placed markers
            };
            coordinatesDisplay.textContent = `Selected location: ${this.location.latitude.toFixed(6)}, ${this.location.longitude.toFixed(6)}`;
            coordinatesDisplay.style.display = 'block';
          });
          
          // Add click event to map to place marker
          this.map.on('click', (e) => {
            const position = e.latlng;
            this.marker.setLatLng(position);
            
            this.location = {
              latitude: position.lat,
              longitude: position.lng,
              accuracy: 0
            };
            coordinatesDisplay.textContent = `Selected location: ${this.location.latitude.toFixed(6)}, ${this.location.longitude.toFixed(6)}`;
            coordinatesDisplay.style.display = 'block';
          });
        } else {
          // Update existing map view and marker position
          this.map.setView([lat, lng], 13);
          this.marker.setLatLng([lat, lng]);
        }
        
        // Force map to redraw after container becomes visible
        setTimeout(() => {
          this.map.invalidateSize();
        }, 100);
      } else {
        // Fallback if Leaflet is not available
        mapContainer.innerHTML = `
          <div style="background-color: #e9ecef; height: 100%; display: flex; align-items: center; justify-content: center;">
            <p>Map would display here with location: ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
          </div>
        `;
      }
    };
    
    // Handle location checkbox
    includeLocationCheckbox.addEventListener('change', async () => {
      if (includeLocationCheckbox.checked) {
        try {
          locationInfo.textContent = 'Acquiring location...';
          toggleMapBtn.style.display = 'none';
          
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            });
          });
          
          this.location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          
          locationInfo.textContent = `Location acquired: ${this.location.latitude.toFixed(6)}, ${this.location.longitude.toFixed(6)}`;
          
          // Show map toggle button
          toggleMapBtn.style.display = 'inline-block';
          
        } catch (error) {
          locationInfo.textContent = `Location error: ${error.message}`;
          includeLocationCheckbox.checked = false;
          console.error('Geolocation error:', error);
        }
      } else {
        this.location = null;
        locationInfo.textContent = '';
        toggleMapBtn.style.display = 'none';
        mapContainer.style.display = 'none';
        coordinatesDisplay.style.display = 'none';
      }
    });
    
    // Handle map toggle button
    toggleMapBtn.addEventListener('click', () => {
      if (mapContainer.style.display === 'none') {
        mapContainer.style.display = 'block';
        if (this.location) {
          initializeMap(this.location.latitude, this.location.longitude);
        } else if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              this.location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
              };
              initializeMap(this.location.latitude, this.location.longitude);
            },
            (error) => {
              console.error('Geolocation error:', error);
              // Default location (e.g., Jakarta)
              initializeMap(-6.2088, 106.8456);
            }
          );
        } else {
          // Default location if geolocation not supported
          initializeMap(-6.2088, 106.8456);
        }
      } else {
        mapContainer.style.display = 'none';
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const description = form.description.value.trim();
      const photo = form.photo.files[0];

      if (!description || !photo) {
        messageBox.textContent = 'Description and photo are required.';
        return;
      }

      messageBox.textContent = 'Submitting...';
      
      // Clean up media before form submission
      this.cleanupMedia();

      // Prepare form data with additional elements
      const formData = {
        description,
        photo,
        audioRecording: this.audioBlob, // Include audio if recorded
        lat: this.location ? this.location.latitude : null,
        lon: this.location ? this.location.longitude : null
      };

      const result = await AddStoryPresenter.addNewStory(formData);

      if (result.error) {
        messageBox.style.color = 'red';
        messageBox.textContent = result.message;
      } else {
        messageBox.style.color = 'green';
        messageBox.textContent = 'Story added successfully!';
        
        // Remove page change event listeners before navigation
        window.removeEventListener('hashchange', handlePageChange);
        window.removeEventListener('beforeunload', handlePageChange);
        
        setTimeout(() => {
          window.location.hash = '/dashboard';
        }, 1000);
      }
    });
  }
}