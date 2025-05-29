import LoginPresenter from './login-presenter.js';

export default class LoginPage {
  constructor() {
    this.presenter = null;
    this.form = null;
    this.messageBox = null;
    this.loginButton = null;
    this.buttonText = null;
    this.buttonLoader = null;
    this.emailField = null;
    this.passwordField = null;
    this.fieldErrors = new Map();
  }

  async render() {
    return `
      <section class="container auth-container">
        <div class="auth-header">
          <h2>Login</h2>
          <p>Enter your credentials to access your account</p>
        </div>
        <form id="login-form" class="auth-form">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input type="email" id="email" name="email" placeholder="Your email address" required />
            <span class="field-error" id="email-error" style="display: none;"></span>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Your password" required />
            <span class="field-error" id="password-error" style="display: none;"></span>
          </div>
          <button type="submit" id="login-button">
            <span>Login</span>
            <div class="button-loader" style="display: none;"></div>
          </button>
        </form>
        <p id="login-message" style="margin-top: 10px; text-align: center; display: none;"></p>
        <div class="auth-footer">
          <p>Don't have an account? <a href="#/register">Register</a></p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Initialize DOM elements
    this._initializeDOMElements();
    
    // Create and initialize presenter
    this.presenter = LoginPresenter.create(this);
    this.presenter.init();
  }

  // Initialize presenter with this view
  init(presenter) {
    this.presenter = presenter;
    this._setupEventListeners();
    this._animateFormAppearance();
  }

  // Initialize DOM element references
  _initializeDOMElements() {
    this.form = document.querySelector('#login-form');
    this.messageBox = document.querySelector('#login-message');
    this.loginButton = document.querySelector('#login-button');
    this.buttonText = this.loginButton?.querySelector('span');
    this.buttonLoader = this.loginButton?.querySelector('.button-loader');
    this.emailField = document.querySelector('#email');
    this.passwordField = document.querySelector('#password');
  }

  // Setup event listeners
  _setupEventListeners() {
    if (!this.form) return;

    // Form submission
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this._handleFormSubmit();
    });

    // Real-time field validation
    this.emailField?.addEventListener('blur', (e) => {
      this.presenter.handleFieldValidation('email', e.target.value);
    });

    this.passwordField?.addEventListener('blur', (e) => {
      this.presenter.handleFieldValidation('password', e.target.value);
    });

    // Clear field errors on input
    this.emailField?.addEventListener('input', () => {
      this.hideFieldError('email');
    });

    this.passwordField?.addEventListener('input', () => {
      this.hideFieldError('password');
    });
  }

  // Handle form submission
  async _handleFormSubmit() {
    if (!this.presenter) return;

    const email = this.emailField?.value.trim() || '';
    const password = this.passwordField?.value || '';

    await this.presenter.handleLogin({ email, password });
  }

  // Show loading state
  showLoading() {
    if (this.buttonText && this.buttonLoader) {
      this.buttonText.style.opacity = '0';
      this.buttonLoader.style.display = 'block';
      this.loginButton.disabled = true;
    }
  }

  // Hide loading state
  hideLoading() {
    if (this.buttonText && this.buttonLoader) {
      this.buttonText.style.opacity = '1';
      this.buttonLoader.style.display = 'none';
      this.loginButton.disabled = false;
    }
  }

  // Show error message
  showError(message) {
    this._showMessage(message, 'error');
  }

  // Show success message
  showSuccess(message) {
    this._showMessage(message, 'success');
  }

  // Hide message
  hideMessage() {
    if (this.messageBox) {
      this.messageBox.style.display = 'none';
      this.messageBox.textContent = '';
    }
  }

  // Show field-specific error
  showFieldError(fieldName, message) {
    const errorElement = document.querySelector(`#${fieldName}-error`);
    const inputElement = document.querySelector(`#${fieldName}`);
    
    if (errorElement && inputElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      errorElement.style.color = '#e74c3c';
      errorElement.style.fontSize = '0.8rem';
      errorElement.style.marginTop = '5px';
      
      inputElement.style.borderColor = '#e74c3c';
      this.fieldErrors.set(fieldName, message);
    }
  }

  // Hide field-specific error
  hideFieldError(fieldName) {
    const errorElement = document.querySelector(`#${fieldName}-error`);
    const inputElement = document.querySelector(`#${fieldName}`);
    
    if (errorElement && inputElement) {
      errorElement.style.display = 'none';
      errorElement.textContent = '';
      inputElement.style.borderColor = '';
      this.fieldErrors.delete(fieldName);
    }
  }

  // Animate success and execute callback
  animateSuccess(callback) {
    const container = document.querySelector('.auth-container');
    if (container) {
      container.animate([
        { transform: 'translateY(0)', opacity: 1 },
        { transform: 'translateY(-20px)', opacity: 0 }
      ], {
        duration: 500,
        easing: 'ease-in-out',
        fill: 'forwards'
      });
    }
    
    if (callback) {
      setTimeout(callback, 500);
    }
  }

  // Private method to show messages
  _showMessage(message, type) {
    if (!this.messageBox) return;

    this.messageBox.textContent = message;
    this.messageBox.style.color = type === 'error' ? '#e74c3c' : '#2ecc71';
    this.messageBox.style.display = 'block';
    
    // Animation based on message type
    if (type === 'error') {
      this._animateError();
    } else {
      this._animateFadeIn();
    }
  }

  // Error animation (shake)
  _animateError() {
    if (!this.messageBox) return;

    this.messageBox.animate([
      { transform: 'translateX(0)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(5px)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(0)' }
    ], {
      duration: 300,
      easing: 'ease-in-out'
    });
  }

  // Fade in animation
  _animateFadeIn() {
    if (!this.messageBox) return;

    this.messageBox.animate([
      { opacity: 0 },
      { opacity: 1 }
    ], {
      duration: 300,
      easing: 'ease-in-out'
    });
  }

  // Form appearance animation
  _animateFormAppearance() {
    const formElements = document.querySelectorAll('.auth-form .form-group, .auth-form button');
    
    formElements.forEach((element, index) => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        element.animate([
          { opacity: 0, transform: 'translateY(20px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], {
          duration: 300,
          easing: 'ease-out',
          fill: 'forwards'
        });
        
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, 100 * index);
    });
  }

  // Get form data
  getFormData() {
    return {
      email: this.emailField?.value.trim() || '',
      password: this.passwordField?.value || ''
    };
  }

  // Clear form
  clearForm() {
    if (this.form) {
      this.form.reset();
    }
    this.hideMessage();
    this.fieldErrors.clear();
    
    // Clear all field errors
    ['email', 'password'].forEach(field => {
      this.hideFieldError(field);
    });
  }

  // Check if form has errors
  hasFieldErrors() {
    return this.fieldErrors.size > 0;
  }

  // Cleanup method
  destroy() {
    if (this.presenter) {
      this.presenter.destroy();
      this.presenter = null;
    }
    
    // Remove event listeners if needed
    this.form = null;
    this.messageBox = null;
    this.loginButton = null;
    this.buttonText = null;
    this.buttonLoader = null;
    this.emailField = null;
    this.passwordField = null;
    this.fieldErrors.clear();
  }
}