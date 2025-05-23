import React, { useState } from 'react';
import './AdminAuth.css';
import apiService from '../services/apiService';

interface AdminAuthProps {
  onAuthenticated: () => void;
  onCancel: () => void;
}

interface AuthCredentials {
  username: string;
  password: string;
}

const AdminAuth: React.FC<AdminAuthProps> = ({ onAuthenticated, onCancel }) => {
  const [credentials, setCredentials] = useState<AuthCredentials>({
    username: '',
    password: ''
  });
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiService.login(credentials);
      
      if (response.success) {
        onAuthenticated();
      } else {
        setError(response.message || 'Authentication failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="auth-overlay" onKeyDown={handleKeyPress}>
      <div className="auth-container">
        <div className="auth-header">
          <h2>🔐 Admin Authentication</h2>
          <p>Please enter your credentials to access the admin panel</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              className="auth-input"
              placeholder="Enter username"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              className="auth-input"
              placeholder="Enter password"
              disabled={isLoading}
            />
          </div>

          <div className="auth-buttons">
            <button
              type="button"
              onClick={onCancel}
              className="auth-button auth-button-cancel"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="auth-button auth-button-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        <div className="auth-footer">
          <small>Access restricted to authorized personnel only</small>
        </div>
      </div>
    </div>
  );
};

export default AdminAuth; 