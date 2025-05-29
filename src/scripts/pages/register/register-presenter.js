import RegisterModel from './register-model.js';
import { registerUser } from '../../data/api.js';

export default class RegisterPresenter {
  constructor() {
    this.model = new RegisterModel();
    this.view = null; // Will be set by the page/view
  }

  // Set the view reference
  setView(view) {
    this.view = view;
  }

  // Handle user input changes
  handleInputChange(fieldName, value) {
    // Sanitize input
    const sanitizedValue = this.model.sanitizeInput(value);
    
    // Update model
    this.model.setUserData({ [fieldName]: sanitizedValue });
    
    // Validate field in real-time
    const isValid = this.model.validateField(fieldName, sanitizedValue);
    
    // Notify view of validation result
    if (this.view && this.view.updateFieldValidation) {
      this.view.updateFieldValidation(fieldName, isValid, this.model.getFieldError(fieldName));
    }

    // Handle special cases
    if (fieldName === 'password') {
      this._handlePasswordStrengthUpdate(sanitizedValue);
    }
  }

  // Handle password strength indication
  _handlePasswordStrengthUpdate(password) {
    const strengthInfo = this.model.getPasswordStrength(password);
    
    if (this.view && this.view.updatePasswordStrength) {
      this.view.updatePasswordStrength(strengthInfo);
    }
  }

  // Handle form submission
  async handleSubmit(formData) {
    try {
      // Set loading state
      this.model.setLoading(true);
      this._notifyLoadingState(true);

      // Update model with form data
      this.model.setUserData(formData);

      // Validate all fields
      if (!this.model.validateAll()) {
        const errors = this.model.getValidationErrors();
        this._notifyValidationErrors(errors);
        return { success: false, errors };
      }

      // Prepare data for submission
      const submissionData = this.model.prepareForSubmission();

      // Call API
      const result = await registerUser(submissionData);

      // Store result in model
      this.model.setRegistrationResult(result);

      if (result.error) {
        // Handle API errors
        this._notifyApiError(result.message);
        return { success: false, message: result.message };
      } else {
        // Handle success
        this._notifySuccess('Registration successful! Redirecting to login...');
        
        // Clear sensitive data after successful registration
        setTimeout(() => {
          this.model.clearUserData();
        }, 2000);

        return { success: true, message: 'Registration successful!' };
      }

    } catch (error) {
      // Handle network/unexpected errors
      const errorMessage = 'Connection error. Please try again.';
      this._notifyApiError(errorMessage);
      console.error('Registration error:', error);
      
      return { success: false, message: errorMessage };
    } finally {
      // Always clear loading state
      this.model.setLoading(false);
      this._notifyLoadingState(false);
    }
  }

  // Get current user data
  getUserData() {
    return this.model.getUserData();
  }

  // Check if form is currently loading
  isLoading() {
    return this.model.getLoading();
  }

  // Get validation errors
  getValidationErrors() {
    return this.model.getValidationErrors();
  }

  // Check if specific field has error
  hasFieldError(fieldName) {
    return this.model.hasFieldError(fieldName);
  }

  // Get specific field error message
  getFieldError(fieldName) {
    return this.model.getFieldError(fieldName);
  }

  // Clear all form data
  clearForm() {
    this.model.clearUserData();
    if (this.view && this.view.clearFormFields) {
      this.view.clearFormFields();
    }
  }

  // Reset presenter state
  reset() {
    this.model.reset();
    if (this.view && this.view.reset) {
      this.view.reset();
    }
  }

  // Check password strength
  getPasswordStrength(password) {
    return this.model.getPasswordStrength(password);
  }

  // Validate single field
  validateField(fieldName, value) {
    return this.model.validateField(fieldName, value);
  }

  // Validate entire form
  validateForm() {
    return this.model.validateAll();
  }

  // Pre-submit validation check
  canSubmit() {
    const userData = this.model.getUserData();
    return userData.name && userData.email && userData.password && 
           !this.model.hasValidationErrors() && !this.model.getLoading();
  }

  // Get form state for debugging
  getFormState() {
    return {
      userData: this.model.getUserData(),
      errors: this.model.getValidationErrors(),
      isLoading: this.model.getLoading(),
      canSubmit: this.canSubmit()
    };
  }

  // Private notification methods to update view
  _notifyLoadingState(isLoading) {
    if (this.view && this.view.updateLoadingState) {
      this.view.updateLoadingState(isLoading);
    }
  }

  _notifyValidationErrors(errors) {
    if (this.view && this.view.showValidationErrors) {
      this.view.showValidationErrors(errors);
    }
  }

  _notifyApiError(message) {
    if (this.view && this.view.showMessage) {
      this.view.showMessage(message, 'error');
    }
  }

  _notifySuccess(message) {
    if (this.view && this.view.showMessage) {
      this.view.showMessage(message, 'success');
    }
  }

  // Static method for backward compatibility
  static async register(userData) {
    const presenter = new RegisterPresenter();
    return await presenter.handleSubmit(userData);
  }
}