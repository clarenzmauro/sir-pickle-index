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

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
};