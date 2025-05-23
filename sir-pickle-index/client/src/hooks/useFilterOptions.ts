// src/hooks/useFilterOptions.ts
//
// Custom hook to fetch and manage filter options for keyword search
// In a real application, this would fetch data from the backend API
//
import { useState, useEffect } from 'react';
import type { FilterOption } from '../components/FilterDropdown';

// Mock API call - in real app this would hit an endpoint like /api/filters
const fetchFilterOptions = async (): Promise<FilterOption[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock data that would come from backend
  return [
    { value: '', label: 'All Content' },
    { value: 'youtube-videos', label: 'YouTube Videos', count: 120 },
    { value: 'youtube-livestreams', label: 'YouTube Livestreams', count: 45 },
    { value: 'discord-livestreams', label: 'Discord Livestreams', count: 28 },
  ];
};

export const useFilterOptions = () => {
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([
    { value: '', label: 'All Content' } // Default option while loading
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const options = await fetchFilterOptions();
        setFilterOptions(options);
      } catch (err) {
        setError('Failed to load filter options');
        console.error('Error loading filter options:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadFilterOptions();
  }, []);

  return {
    filterOptions,
    isLoading,
    error,
  };
}; 