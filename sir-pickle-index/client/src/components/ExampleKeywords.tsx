import React from 'react';
import styles from './ExamplePrompts.module.css'; // Reusing the same styles

interface ExampleKeywordsProps {
  onKeywordClick: (keyword: string) => void;
  isLoading: boolean;
}

const exampleKeywords = [
  'breakaway gaps',
  'IRL ERL',
  'FVG',
  'unicorn model',
  'economic calendar',
  'candlestick logic',
  'impulse shifts',
  'bias',
  'swing trading',
];

const ExampleKeywords: React.FC<ExampleKeywordsProps> = ({ onKeywordClick, isLoading }) => {
  return (
    <div className={styles['example-prompts-container']}>
      <h3 className={styles['example-prompts-title']}>Popular search terms:</h3>
      <div className={styles['prompts-grid']}>
        {exampleKeywords.map((keyword, index) => (
          <button
            key={index}
            className={styles['prompt-button']}
            onClick={() => onKeywordClick(keyword)}
            disabled={isLoading}
          >
            {keyword}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExampleKeywords; 