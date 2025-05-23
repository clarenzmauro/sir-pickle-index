// src/components/FilterDropdown.tsx
//
// Dropdown component for filtering keyword search results by category/tags
// Provides "All Content" option and dynamically populated filter options
//
import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
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

const FilterDropdown: React.FC<FilterDropdownProps> = memo(({
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

  const handleSelect = useCallback((value: string) => {
    onFilterChange(value);
    setIsOpen(false);
  }, [onFilterChange]);

  const handleToggle = useCallback(() => {
    if (!disabled && !isLoading) {
      setIsOpen(prev => !prev);
    }
  }, [disabled, isLoading]);

  // Memoize expensive computations
  const selectedOption = useMemo(() => 
    options.find(option => option.value === selectedFilter),
    [options, selectedFilter]
  );

  const displayLabel = useMemo(() => 
    selectedOption?.label || 'All Content',
    [selectedOption]
  );

  const dropdownButtonClasses = useMemo(() =>
    `${styles['dropdown-button']} ${isOpen ? styles['dropdown-button-open'] : ''}`,
    [isOpen]
  );

  const dropdownArrowClasses = useMemo(() =>
    `${styles['dropdown-arrow']} ${isOpen ? styles['dropdown-arrow-up'] : ''}`,
    [isOpen]
  );

  const shouldShowMenu = useMemo(() =>
    isOpen && !disabled && !isLoading,
    [isOpen, disabled, isLoading]
  );

  return (
    <div className={styles['filter-dropdown']} ref={dropdownRef}>
      <button
        className={dropdownButtonClasses}
        onClick={handleToggle}
        disabled={disabled || isLoading}
        type="button"
      >
        <span className={styles['dropdown-label']}>
          {isLoading ? 'Loading...' : displayLabel}
        </span>
        <span className={dropdownArrowClasses}>
          ▼
        </span>
      </button>

      {shouldShowMenu && (
        <div className={styles['dropdown-menu']}>
          {options.map((option) => (
            <FilterDropdownItem
              key={option.value}
              option={option}
              isSelected={option.value === selectedFilter}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// Optimized dropdown item component
const FilterDropdownItem: React.FC<{
  option: FilterOption;
  isSelected: boolean;
  onSelect: (value: string) => void;
}> = memo(({ option, isSelected, onSelect }) => {
  const handleClick = useCallback(() => {
    onSelect(option.value);
  }, [onSelect, option.value]);

  const itemClasses = useMemo(() =>
    `${styles['dropdown-item']} ${isSelected ? styles['dropdown-item-selected'] : ''}`,
    [isSelected]
  );

  return (
    <button
      className={itemClasses}
      onClick={handleClick}
      type="button"
    >
      <span className={styles['option-label']}>{option.label}</span>
      {option.count !== undefined && (
        <span className={styles['option-count']}>({option.count})</span>
      )}
    </button>
  );
});

FilterDropdown.displayName = 'FilterDropdown';
FilterDropdownItem.displayName = 'FilterDropdownItem';

export default FilterDropdown; 