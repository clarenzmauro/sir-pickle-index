// src/components/FilterDropdown.tsx
//
// Dropdown component for filtering keyword search results by category/tags
// Provides "All Content" option and dynamically populated filter options
//
import React, { useState, useRef, useEffect } from 'react';
import styles from './FilterDropdown.module.css';

export interface FilterOption {
  value: string;
  label: string;
  count?: number; // Optional count of items in this category
}

interface FilterDropdownProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  options: FilterOption[];
  isLoading?: boolean;
  disabled?: boolean;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  selectedFilter,
  onFilterChange,
  options,
  isLoading = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (value: string) => {
    onFilterChange(value);
    setIsOpen(false);
  };

  const selectedOption = options.find(option => option.value === selectedFilter);
  const displayLabel = selectedOption?.label || 'All Content';

  return (
    <div className={styles['filter-dropdown']} ref={dropdownRef}>
      <button
        className={`${styles['dropdown-button']} ${isOpen ? styles['dropdown-button-open'] : ''}`}
        onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        type="button"
      >
        <span className={styles['dropdown-label']}>
          {isLoading ? 'Loading...' : displayLabel}
        </span>
        <span className={`${styles['dropdown-arrow']} ${isOpen ? styles['dropdown-arrow-up'] : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && !disabled && !isLoading && (
        <div className={styles['dropdown-menu']}>
          {options.map((option) => (
            <button
              key={option.value}
              className={`${styles['dropdown-item']} ${
                option.value === selectedFilter ? styles['dropdown-item-selected'] : ''
              }`}
              onClick={() => handleSelect(option.value)}
              type="button"
            >
              <span className={styles['option-label']}>{option.label}</span>
              {option.count !== undefined && (
                <span className={styles['option-count']}>({option.count})</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterDropdown; 