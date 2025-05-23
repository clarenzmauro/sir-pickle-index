// src/components/InputSection.tsx
import React, { useState } from 'react';
import styles from './InputSection.module.css';
import FilterDropdown, { type FilterOption } from './FilterDropdown';

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
}

// Default filter options - these would typically come from an API call
const DEFAULT_FILTER_OPTIONS: FilterOption[] = [
  { value: '', label: 'All Content' },
  { value: 'youtube-videos', label: 'YouTube Videos', count: 120 },
  { value: 'youtube-livestreams', label: 'YouTube Livestreams', count: 45 },
  { value: 'discord-livestreams', label: 'Discord Livestreams', count: 28 },
];

const InputSection: React.FC<InputSectionProps> = ({ 
  onSearch, 
  isLoading, 
  filterOptions = DEFAULT_FILTER_OPTIONS 
}) => {
  const [searchMode, setSearchMode] = useState<SearchMode>('ask');
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(''); // Empty string means "All Content"
  const [isTyping, setIsTyping] = useState(false);

  const handleSearch = () => {
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
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsTyping(true);
    
    // Clear typing state after user stops typing
    setTimeout(() => setIsTyping(false), 1000);
  };

  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    // Reset filter when switching modes
    if (mode === 'ask') {
      setSelectedFilter('');
    }
  };

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
          <span className={`${styles['search-icon-span']} ${isTyping ? styles['search-icon-typing'] : ''}`}>
            🔍
          </span>
          
          <input
            type="text"
            className={styles['input-field-element']}
            placeholder={
              searchMode === 'ask'
                ? 'Ask Sir Pickle AI anything...'
                : 'Search keywords...'
            }
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
              onFilterChange={setSelectedFilter}
              options={filterOptions}
              isLoading={isLoading}
              disabled={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default InputSection;