// src/components/InputSection.tsx
import React, { useState, useCallback, useMemo, useRef, memo } from 'react';
import styles from './InputSection.module.css';
import FilterDropdown, { type FilterOption } from './FilterDropdown.js';

type SearchMode = 'ask' | 'keyword';

export interface SearchParams {
  query: string;
  mode: SearchMode;
  filter?: string; // Optional filter for keyword search
}

interface InputSectionProps {
  onSearch: (params: SearchParams) => void;
  isLoading: boolean;
  filterOptions?: FilterOption[]; // Optional filter options
  onModeChange?: (mode: SearchMode) => void; // Optional callback for mode changes
}

// Default filter options - these would typically come from an API call
const DEFAULT_FILTER_OPTIONS: FilterOption[] = [
  { value: '', label: 'All Content' },
  { value: 'youtube-videos', label: 'YouTube Videos' },
  { value: 'youtube-livestreams', label: 'YouTube Livestreams'},
  { value: 'discord-livestreams', label: 'Discord Livestreams'},
];

const InputSection: React.FC<InputSectionProps> = memo(({ 
  onSearch, 
  isLoading, 
  filterOptions = DEFAULT_FILTER_OPTIONS,
  onModeChange
}) => {
  const [searchMode, setSearchMode] = useState<SearchMode>('ask');
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(''); // Empty string means "All Content"
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(() => {
    if (query.trim() && !isLoading) {
      const searchParams: SearchParams = {
        query: query.trim(),
        mode: searchMode,
      };

      // Only include filter for keyword search mode and when a filter is selected
      if (searchMode === 'keyword' && selectedFilter) {
        searchParams.filter = selectedFilter;
      }

      onSearch(searchParams);
    }
  }, [query, searchMode, selectedFilter, isLoading, onSearch]);

  const handleKeyPress = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setIsTyping(true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout - optimized for faster response
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 600); // Reduced from 1000ms to 600ms for snappier feel
  }, []);

  const handleModeChange = useCallback((mode: SearchMode) => {
    setSearchMode(mode);
    // Reset query input and filter when switching modes
    setQuery('');
    if (mode === 'ask') {
      setSelectedFilter('');
    }
    onModeChange?.(mode);
  }, [onModeChange]);

  const handleFilterChange = useCallback((filter: string) => {
    setSelectedFilter(filter);
  }, []);

  // Memoize placeholder text
  const placeholderText = useMemo(() => 
    searchMode === 'ask'
      ? 'Ask Sir Pickle AI anything...'
      : 'Search keywords...',
    [searchMode]
  );

  // Memoize search icon classes
  const searchIconClasses = useMemo(() =>
    `${styles['search-icon-span']} ${isTyping ? styles['search-icon-typing'] : ''}`,
    [isTyping]
  );

  return (
    <div className={styles['input-section-container']}>
      <div className={styles['tabs-container']}>
        <button
          className={`${styles['tab-button']} ${searchMode === 'ask' ? styles.active : ''}`}
          onClick={() => handleModeChange('ask')}
          disabled={isLoading}
        >
          Ask a question
        </button>
        <button
          className={`${styles['tab-button']} ${searchMode === 'keyword' ? styles.active : ''}`}
          onClick={() => handleModeChange('keyword')}
          disabled={isLoading}
        >
          Keyword Search
        </button>
      </div>

      <div className={styles['search-container']}>
        <div className={styles['input-area-container']}>
          {/* Search Icon */}
          <span className={searchIconClasses}>
            🔍
          </span>
          
          <input
            type="text"
            className={styles['input-field-element']}
            placeholder={placeholderText}
            value={query}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
        </div>

        {/* Filter dropdown - only show for keyword search */}
        {searchMode === 'keyword' && (
          <div className={styles['filter-container']}>
            <FilterDropdown
              selectedFilter={selectedFilter}
              onFilterChange={handleFilterChange}
              options={filterOptions}
              isLoading={isLoading}
              disabled={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
});

InputSection.displayName = 'InputSection';

export default InputSection;