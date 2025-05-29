import RegisterPresenter from './register-presenter.js';

export default class RegisterPage {
  constructor() {
    this.presenter = new RegisterPresenter();
    this.presenter.setView(this); // Set this page as the view for MVP pattern
    this.elements = {}; // Cache for DOM elements
  }

  async render() {
    return `
      <section class="container auth-container">
        <div class="auth-header">
          <h2>Create Account</h2>
          <p>Join us today! Fill in the details below to get started</p>
        </div>
        <form id="register-form" class="auth-form">
          <div class="form-group">
            <label for="name">Full Name</label>
            <input type="text" id="name" name="name" placeholder="Your full name" required />
            <small class="field-error" id="name-error" style="display: none;"></small>
          </div>
          <div class="form-group">
            <label for="email">Email Address</label>
            <input type="email" id="email" name="email" placeholder="Your email address" required />
            <small class="field-error" id="email-error" style="display: none;"></small>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Create a strong password" required minlength="8" />
            <small class="password-hint" id="password-hint">Password must be at least 8 characters long</small>
            <small class="field-error" id="password-error" style="display: none;"></small>
          </div>
          <button type="submit" id="register-button">
            <span>Create Account</span>
            <div class="button-loader" style="display: none;"></div>
          </button>
        </form>
        <p id="register-message" style="margin-top: 10px; text-align: center; display: none;"></p>
        <div class="auth-footer">
          <p>Already have an account? <a href="#/login">Login</a></p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Cache DOM elements
    this._cacheElements();
    
    // Setup event listeners
    this._setupEventListeners();
    
    // Animation for when the form appears
    this._animateFormAppearance();
  }

  // Cache frequently used DOM elements
  _cacheElements() {
    this.elements = {
      form: document.querySelector('#register-form'),
      nameInput: document.querySelector('#name'),
      emailInput: document.querySelector('#email'),
      passwordInput: document.querySelector('#password'),
      submitButton: document.querySelector('#register-button'),
      buttonText: document.querySelector('#register-button span'),
      buttonLoader: document.querySelector('.button-loader'),
      messageBox: document.querySelector('#register-message'),
      passwordHint: document.querySelector('#password-hint'),
      nameError: document.querySelector('#name-error'),
      emailError: document.querySelector('#email-error'),
      passwordError: document.querySelector('#password-error')
    };
  }

  // Setup all event listeners
  _setupEventListeners() {
    // Form submission
    this.elements.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this._handleFormSubmit();
    });

    // Real-time input validation
    this.elements.nameInput.addEventListener('input', (e) => {
      this.presenter.handleInputChange('name', e.target.value);
    });

    this.elements.emailInput.addEventListener('input', (e) => {
      this.presenter.handleInputChange('email', e.target.value);
    });

    this.elements.passwordInput.addEventListener('input', (e) => {
      this.presenter.handleInputChange('password', e.target.value);
    });

    // Clear errors on focus
    [this.elements.nameInput, this.elements.emailInput, this.elements.passwordInput].forEach(input => {
      input.addEventListener('focus', (e) => {
        this._clearFieldError(e.target.name);
      });
    });
  }

  // Handle form submission
  async _handleFormSubmit() {
    // Clear previous messages
    this.hideMessage();

    // Get form data
    const formData = {
      name: this.elements.nameInput.value,
      email: this.elements.emailInput.value,
      password: this.elements.passwordInput.value
    };

    // Submit through presenter
    const result = await this.presenter.handleSubmit(formData);

    if (result.success) {
      // Handle successful registration
      this._handleRegistrationSuccess();
    } else {
      // Errors are already handled by presenter calling view methods
      console.log('Registration failed:', result.message || result.errors);
    }
  }

  // Handle successful registration
  _handleRegistrationSuccess() {
    // Create success animation
    const container = document.querySelector('.auth-container');
    container.animate([
      { transform: 'translateY(0)', opacity: 1 },
      { transform: 'translateY(-20px)', opacity: 0 }
    ], {
      duration: 500,
      easing: 'ease-in-out',
      fill: 'forwards'
    });
    
    // Redirect after animation
    setTimeout(() => {
      window.location.hash = '#/login';
    }, 1500);
  }

  // View interface methods called by presenter

  // Update loading state
  updateLoadingState(isLoading) {
    if (isLoading) {
      this._showButtonLoading();
      this.elements.submitButton.disabled = true;
    } else {
      this._hideButtonLoading();
      this.elements.submitButton.disabled = false;
    }
  }

  // Update individual field validation
  updateFieldValidation(fieldName, isValid, errorMessage) {
    const errorElement = this.elements[`${fieldName}Error`];
    
    if (isValid) {
      this._hideFieldError(fieldName);
    } else if (errorMessage) {
      this._showFieldError(fieldName, errorMessage);
    }
  }

  // Update password strength indicator
  updatePasswordStrength(strengthInfo) {
    const { strength, message } = strengthInfo;
    const hint = this.elements.passwordHint;
    
    // Update text and color based on strength
    hint.textContent = message || 'Password must be at least 8 characters long';
    
    switch (strength) {
      case 'weak':
        hint.style.color = '#e74c3c';
        break;
      case 'good':
        hint.style.color = '#f39c12';
        break;
      case 'strong':
        hint.style.color = '#2ecc71';
        break;
      default:
        hint.style.color = '#7f8c8d';
    }
  }

  // Show validation errors
  showValidationErrors(errors) {
    Object.entries(errors).forEach(([fieldName, message]) => {
      this._showFieldError(fieldName, message);
    });
    
    // Show first error in main message
    const firstError = Object.values(errors)[0];
    this.showMessage(firstError, 'error');
  }

  // Show message
  showMessage(text, type = 'info') {
    const messageBox = this.elements.messageBox;
    messageBox.textContent = text;
    messageBox.style.color = type === 'error' ? '#e74c3c' : '#2ecc71';
    messageBox.style.display = 'block';
    
    // Add appropriate animation
    if (type === 'error') {
      this._shakeElement(messageBox);
    } else {
      this._fadeInElement(messageBox);
    }
  }

  // Hide message
  hideMessage() {
    this.elements.messageBox.style.display = 'none';
    this.elements.messageBox.textContent = '';
  }

  // Clear form fields
  clearFormFields() {
    this.elements.form.reset();
    this._clearAllFieldErrors();
    this.hideMessage();
  }

  // Reset view to initial state
  reset() {
    this.clearFormFields();
    this.updateLoadingState(false);
  }

  // Private helper methods

  _showButtonLoading() {
    this.elements.buttonText.style.opacity = '0';
    this.elements.buttonLoader.style.display = 'block';
  }

  _hideButtonLoading() {
    this.elements.buttonText.style.opacity = '1';
    this.elements.buttonLoader.style.display = 'none';
  }

  _showFieldError(fieldName, message) {
    const errorElement = this.elements[`${fieldName}Error`];
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      errorElement.style.color = '#e74c3c';
      
      // Add error styling to input
      const input = this.elements[`${fieldName}Input`];
      if (input) {
        input.style.borderColor = '#e74c3c';
      }
    }
  }

  _hideFieldError(fieldName) {
    const errorElement = this.elements[`${fieldName}Error`];
    if (errorElement) {
      errorElement.style.display = 'none';
      errorElement.textContent = '';
      
      // Remove error styling from input
      const input = this.elements[`${fieldName}Input`];
      if (input) {
        input.style.borderColor = '';
      }
    }
  }

  _clearFieldError(fieldName) {
    this._hideFieldError(fieldName);
  }

  _clearAllFieldErrors() {
    ['name', 'email', 'password'].forEach(fieldName => {
      this._clearFieldError(fieldName);
    });
  }

  _shakeElement(element) {
    element.animate([
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

  _fadeInElement(element) {
    element.animate([
      { opacity: 0 },
      { opacity: 1 }
    ], {
      duration: 300,
      easing: 'ease-in-out'
    });
  }

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
}