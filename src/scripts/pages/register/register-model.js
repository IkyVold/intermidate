export default class RegisterModel {
  constructor() {
    this.user = {
      name: '',
      email: '',
      password: ''
    };
    this.validationErrors = {};
    this.isLoading = false;
    this.registrationResult = null;
  }

  // Set user data
  setUserData(userData) {
    this.user = { ...this.user, ...userData };
    this.clearValidationErrors();
  }

  // Get current user data
  getUserData() {
    return { ...this.user };
  }

  // Clear user data
  clearUserData() {
    this.user = {
      name: '',
      email: '',
      password: ''
    };
    this.clearValidationErrors();
    this.registrationResult = null;
  }

  // Set loading state
  setLoading(loading) {
    this.isLoading = loading;
  }

  // Get loading state
  getLoading() {
    return this.isLoading;
  }

  // Set registration result
  setRegistrationResult(result) {
    this.registrationResult = result;
  }

  // Get registration result
  getRegistrationResult() {
    return this.registrationResult;
  }

  // Validate individual field
  validateField(fieldName, value) {
    const errors = {};

    switch (fieldName) {
      case 'name':
        if (!value || value.trim().length < 2) {
          errors.name = 'Name must be at least 2 characters long';
        } else if (value.trim().length > 50) {
          errors.name = 'Name must be less than 50 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          errors.name = 'Name can only contain letters and spaces';
        }
        break;

      case 'email':
        if (!value || !this._isValidEmail(value)) {
          errors.email = 'Please enter a valid email address';
        } else if (value.length > 100) {
          errors.email = 'Email must be less than 100 characters';
        }
        break;

      case 'password':
        if (!value || value.length < 8) {
          errors.password = 'Password must be at least 8 characters long';
        } else if (value.length > 128) {
          errors.password = 'Password must be less than 128 characters';
        } else if (!this._isStrongPassword(value)) {
          errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        }
        break;
    }

    // Update validation errors for this field
    if (Object.keys(errors).length > 0) {
      this.validationErrors[fieldName] = errors[fieldName];
    } else {
      delete this.validationErrors[fieldName];
    }

    return Object.keys(errors).length === 0;
  }

  // Validate all form data
  validateAll() {
    this.clearValidationErrors();
    
    let isValid = true;
    
    // Validate each field
    ['name', 'email', 'password'].forEach(field => {
      if (!this.validateField(field, this.user[field])) {
        isValid = false;
      }
    });

    return isValid;
  }

  // Get validation errors
  getValidationErrors() {
    return { ...this.validationErrors };
  }

  // Get specific field error
  getFieldError(fieldName) {
    return this.validationErrors[fieldName] || null;
  }

  // Check if field has error
  hasFieldError(fieldName) {
    return !!this.validationErrors[fieldName];
  }

  // Clear all validation errors
  clearValidationErrors() {
    this.validationErrors = {};
  }

  // Clear specific field error
  clearFieldError(fieldName) {
    delete this.validationErrors[fieldName];
  }

  // Check if form has any errors
  hasValidationErrors() {
    return Object.keys(this.validationErrors).length > 0;
  }

  // Get password strength
  getPasswordStrength(password) {
    if (!password) return { strength: 'none', score: 0, message: '' };
    
    let score = 0;
    let message = '';
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    
    // Determine strength level
    if (score < 3) {
      message = 'Weak password';
      return { strength: 'weak', score, message };
    } else if (score < 5) {
      message = 'Good password';
      return { strength: 'good', score, message };
    } else {
      message = 'Strong password';
      return { strength: 'strong', score, message };
    }
  }

  // Prepare data for API submission
  prepareForSubmission() {
    if (!this.validateAll()) {
      throw new Error('Form validation failed');
    }

    return {
      name: this.user.name.trim(),
      email: this.user.email.trim().toLowerCase(),
      password: this.user.password
    };
  }

  // Check if user already exists (for client-side duplicate prevention)
  isDuplicateEmail(existingEmails = []) {
    const currentEmail = this.user.email.trim().toLowerCase();
    return existingEmails.some(email => 
      email.toLowerCase() === currentEmail
    );
  }

  // Sanitize user input
  sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000); // Limit length for security
  }

  // Reset model to initial state
  reset() {
    this.user = {
      name: '',
      email: '',
      password: ''
    };
    this.validationErrors = {};
    this.isLoading = false;
    this.registrationResult = null;
  }

  // Export user data for debugging/logging (without sensitive info)
  toJSON() {
    return {
      user: {
        name: this.user.name,
        email: this.user.email,
        hasPassword: !!this.user.password
      },
      hasValidationErrors: this.hasValidationErrors(),
      isLoading: this.isLoading,
      hasResult: !!this.registrationResult
    };
  }

  // Private helper methods
  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  _isStrongPassword(password) {
    // At least one uppercase, one lowercase, and one number
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    return hasUppercase && hasLowercase && hasNumber;
  }
}