import { loginUser } from '../../data/api.js';
import LoginModel from './login-model.js';

export default class LoginPresenter {
  constructor(view) {
    this.view = view;
    this.model = LoginModel;
  }

  // Initialize presenter with view
  static create(view) {
    return new LoginPresenter(view);
  }

  // Handle login form submission
  async handleLogin({ email, password }) {
    try {
      // Show loading state
      this.view.showLoading();
      this.view.hideMessage();

      // Validate input using model
      const loginRequest = this.model.createLoginRequest({ email, password });
      
      if (!loginRequest.success) {
        this.view.hideLoading();
        this.view.showError(loginRequest.message);
        return { success: false, message: loginRequest.message };
      }

      // Call API through model's validated data
      const apiResult = await loginUser(loginRequest.data);
      
      // Process result using model
      const processedResult = this.model.processLoginResult(apiResult);
      
      if (!processedResult.success) {
        this.view.hideLoading();
        this.view.showError(processedResult.message);
        return { success: false, message: processedResult.message };
      }

      // Success - handle login success through model
      const loginSuccessResult = this.model.handleLoginSuccess(processedResult.data);
      
      if (!loginSuccessResult.success) {
        this.view.hideLoading();
        this.view.showError(loginSuccessResult.message);
        return { success: false, message: loginSuccessResult.message };
      }

      // Show success and redirect
      this.handleLoginSuccessUI(loginSuccessResult.data);
      return { success: true, data: loginSuccessResult.data };

    } catch (error) {
      console.error('Login error:', error);
      this.view.hideLoading();
      this.view.showError('Connection error. Please check your internet connection and try again.');
      return { success: false, message: 'Connection error occurred' };
    }
  }

  // Handle successful login UI updates
  handleLoginSuccessUI(userData) {
    // Show success message
    this.view.showSuccess('Login successful! Redirecting to dashboard...');
    
    // Animate success and redirect
    this.view.animateSuccess(() => {
      this.redirectToDashboard();
    });
  }

  // Redirect to dashboard
  redirectToDashboard() {
    setTimeout(() => {
      window.location.hash = '#/dashboard';
    }, 800);
  }

  // Check if user is already logged in
  checkExistingLogin() {
    const sessionCheck = this.model.checkUserSession();
    
    if (sessionCheck.isValid) {
      // User is already logged in with valid token
      this.redirectToDashboard();
      return true;
    } else if (sessionCheck.message.includes('expired')) {
      // Show expired session message
      this.view.showError(sessionCheck.message);
    }
    
    return false;
  }

  // Validate individual fields (for real-time validation)
  validateEmail(email) {
    const validation = this.model.validateEmail(email);
    return validation;
  }

  validatePassword(password) {
    const validation = this.model.validatePassword(password);
    return validation;
  }

  // Handle real-time field validation
  handleFieldValidation(fieldName, value) {
    let validation;
    
    switch (fieldName) {
      case 'email':
        validation = this.validateEmail(value);
        break;
      case 'password':
        validation = this.validatePassword(value);
        break;
      default:
        return;
    }

    if (!validation.isValid && value.trim() !== '') {
      this.view.showFieldError(fieldName, validation.message);
    } else {
      this.view.hideFieldError(fieldName);
    }
  }

  // Handle logout (if needed)
  handleLogout() {
    const logoutResult = this.model.handleLogout();
    
    if (logoutResult.success) {
      window.location.hash = '#/login';
    } else {
      console.error('Logout error:', logoutResult.message);
      // Force redirect even if logout fails
      window.location.hash = '#/login';
    }
  }

  // Get current user info through model
  getCurrentUser() {
    return this.model.getCurrentUser();
  }

  // Check if current session is valid
  isSessionValid() {
    const sessionCheck = this.model.checkUserSession();
    return sessionCheck.isValid;
  }

  // Initialize presenter
  init() {
    // Check if user is already logged in
    if (!this.checkExistingLogin()) {
      // Set up view if user is not logged in
      this.view.init(this);
    }
  }

  // Cleanup presenter
  destroy() {
    if (this.view && typeof this.view.destroy === 'function') {
      this.view.destroy();
    }
  }
}