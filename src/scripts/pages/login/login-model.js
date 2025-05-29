const LoginModel = {
  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      isValid: emailRegex.test(email),
      message: emailRegex.test(email) ? '' : 'Please enter a valid email address'
    };
  },

  // Validate password
  validatePassword(password) {
    const minLength = 6;
    return {
      isValid: password && password.length >= minLength,
      message: password && password.length >= minLength ? '' : `Password must be at least ${minLength} characters long`
    };
  },

  // Validate all login data
  validateLoginData({ email, password }) {
    const errors = {};
    let isValid = true;

    // Validate email
    const emailValidation = this.validateEmail(email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.message;
      isValid = false;
    }

    // Validate password
    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.message;
      isValid = false;
    }

    return {
      isValid,
      errors,
      data: isValid ? { email: email.toLowerCase().trim(), password } : null
    };
  },

  // Sanitize input data
  sanitizeLoginData({ email, password }) {
    return {
      email: email ? email.toLowerCase().trim() : '',
      password: password ? password.trim() : ''
    };
  },

  // Check if credentials are empty
  isEmpty({ email, password }) {
    return !email || !password || email.trim() === '' || password.trim() === '';
  },

  // Format error messages for display
  formatErrorMessage(errors) {
    if (!errors || Object.keys(errors).length === 0) {
      return '';
    }

    const errorMessages = Object.values(errors);
    return errorMessages.join('. ');
  },

  // Validate login response from server
  validateLoginResponse(response) {
    if (!response) {
      return {
        isValid: false,
        message: 'No response received from server'
      };
    }

    if (response.error) {
      return {
        isValid: false,
        message: response.message || 'Login failed'
      };
    }

    if (!response.loginResult || !response.loginResult.token) {
      return {
        isValid: false,
        message: 'Invalid login response format'
      };
    }

    return {
      isValid: true,
      message: 'Login successful',
      data: response.loginResult
    };
  },

  // Check if user is already logged in
  isUserLoggedIn() {
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    
    return !!(token && userName);
  },

  // Store user session data
  storeUserSession(userData) {
    try {
      if (userData.token) {
        localStorage.setItem('token', userData.token);
      }
      if (userData.name) {
        localStorage.setItem('userName', userData.name);
      }
      return {
        success: true,
        message: 'User session stored successfully'
      };
    } catch (error) {
      console.error('Error storing user session:', error);
      return {
        success: false,
        message: 'Failed to store user session'
      };
    }
  },

  // Clear user session data
  clearUserSession() {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      return {
        success: true,
        message: 'User session cleared successfully'
      };
    } catch (error) {
      console.error('Error clearing user session:', error);
      return {
        success: false,
        message: 'Failed to clear user session'
      };
    }
  },

  // Get current user data
  getCurrentUser() {
    return {
      token: localStorage.getItem('token'),
      name: localStorage.getItem('userName')
    };
  },

  // Check if token is expired (basic check)
  isTokenValid(token) {
    if (!token) return false;
    
    try {
      // Basic JWT token structure check
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      // Decode payload (basic check without verification)
      const payload = JSON.parse(atob(parts[1]));
      
      // Check if token has expiration and if it's not expired
      if (payload.exp) {
        const currentTime = Math.floor(Date.now() / 1000);
        return payload.exp > currentTime;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  },

  // Check current user session validity
  checkUserSession() {
    if (!this.isUserLoggedIn()) {
      return {
        isValid: false,
        message: 'No active user session found'
      };
    }

    const currentUser = this.getCurrentUser();
    
    if (!this.isTokenValid(currentUser.token)) {
      // Clear expired session
      this.clearUserSession();
      return {
        isValid: false,
        message: 'Your session has expired. Please login again.'
      };
    }

    return {
      isValid: true,
      message: 'Valid user session found',
      data: currentUser
    };
  },

  // Generate login request data
  createLoginRequest({ email, password }) {
    const sanitizedData = this.sanitizeLoginData({ email, password });
    const validation = this.validateLoginData(sanitizedData);
    
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
        message: this.formatErrorMessage(validation.errors)
      };
    }

    return {
      success: true,
      data: validation.data
    };
  },

  // Process login result
  processLoginResult(result) {
    const validation = this.validateLoginResponse(result);
    
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.message
      };
    }

    return {
      success: true,
      data: validation.data,
      message: validation.message
    };
  },

  // Handle complete login process including session storage
  handleLoginSuccess(userData) {
    const storeResult = this.storeUserSession(userData);
    
    if (!storeResult.success) {
      return {
        success: false,
        message: storeResult.message,
        data: userData
      };
    }

    return {
      success: true,
      message: 'Login successful! User session created.',
      data: userData
    };
  },

  // Handle logout process
  handleLogout() {
    const clearResult = this.clearUserSession();
    
    return {
      success: clearResult.success,
      message: clearResult.success ? 'Logout successful' : clearResult.message
    };
  }
};

export default LoginModel;