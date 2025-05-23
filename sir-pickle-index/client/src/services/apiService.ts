// src/services/apiService.ts
import axios from 'axios';
import type { AskResult, KeywordSearchResult } from '../components/ResultsDisplay'; // Import types

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Interface for upload video request payload
interface UploadVideoPayload {
  title: string;
  publicationDate: string;
  videoUrl: string;
  category: string;
  tags: string;
  transcript: string;
}

// Interface for upload video response
interface UploadVideoResponse {
  message: string;
  videoId: string;
  data: {
    title: string;
    publicationDate: string;
    videoUrl: string;
    category: string;
    tags: string[];
    transcript: string;
    _id: string;
    createdAt: string;
    updatedAt: string;
  };
}

// Interface for authentication
interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    username: string;
    role: string;
  };
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear it
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    }
    return Promise.reject(error);
  }
);

const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post('/admin/auth/login', credentials);
    const authData: AuthResponse = response.data;
    
    // Store token and user info if login successful
    if (authData.success && authData.token) {
      localStorage.setItem('admin_token', authData.token);
      if (authData.user) {
        localStorage.setItem('admin_user', JSON.stringify(authData.user));
      }
    }
    
    return authData;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error during login:', error);
    
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Failed to authenticate.');
    }
    
    throw new Error(errorMessage);
  }
};

const verifyToken = async (): Promise<AuthResponse> => {
  try {
    const response = await apiClient.get('/admin/auth/verify');
    return response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error verifying token:', error);
    
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Failed to verify token.');
    }
    
    throw new Error(errorMessage);
  }
};

const logout = (): void => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
};

const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('admin_token');
};

const getCurrentUser = (): { username: string; role: string } | null => {
  const userStr = localStorage.getItem('admin_user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

const askQuestion = async (question: string): Promise<AskResult> => {
  try {
    const response = await apiClient.post('/ask', { question });
    return response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error asking question:', error);
    
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Failed to get answer from AI.');
    }
    
    throw new Error(errorMessage);
  }
};

const keywordSearch = async (keyword: string, filter?: string): Promise<KeywordSearchResult> => {
  try {
    const params: Record<string, string> = { keyword };
    
    // Add filter parameter if provided
    if (filter) {
      params.filter = filter;
    }
    
    const response = await apiClient.get('/search', { params });
    return response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error performing keyword search:', error);
    
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Failed to perform keyword search.');
    }
    
    throw new Error(errorMessage);
  }
};

const uploadVideo = async (payload: UploadVideoPayload): Promise<UploadVideoResponse> => {
  try {
    const response = await apiClient.post('/admin/upload', payload);
    return response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error uploading video:', error);
    
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Failed to upload video.');
    }
    
    throw new Error(errorMessage);
  }
};

export default {
  askQuestion,
  keywordSearch,
  uploadVideo,
  login,
  verifyToken,
  logout,
  isAuthenticated,
  getCurrentUser,
};