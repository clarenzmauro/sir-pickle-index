// src/components/ExamplePrompts.tsx
import React from 'react';
import styles from './ExamplePrompts.module.css';

interface ExamplePromptsProps {
  onPromptClick: (prompt: string, mode: SearchMode) => void;
  isLoading: boolean;
}

// Define SearchMode here as well or import from a shared types file
type SearchMode = 'ask' | 'keyword';

const exampleQueries = [
  { text: 'How do I use swing trading with IRL and ERL?', mode: 'ask' as SearchMode },
  { text: 'What are the most powerful trading entry models?', mode: 'ask' as SearchMode },
  { text: 'How do I avoid low probability trading conditions?', mode: 'ask' as SearchMode },
  { text: 'What is the key to bias in IRL and ERL?', mode: 'ask' as SearchMode },
  { text: 'How do I use the economic calendar for trading?', mode: 'ask' as SearchMode },
  { text: 'How do I predict the next candlestick?', mode: 'ask' as SearchMode },
  { text: 'What is top down analysis in ICT concepts?', mode: 'ask' as SearchMode },
  { text: 'How do I catch the highest probability setups?', mode: 'ask' as SearchMode },
  { text: 'How do I organize my trade journal?', mode: 'ask' as SearchMode },
];

const ExamplePrompts: React.FC<ExamplePromptsProps> = ({ onPromptClick, isLoading }) => {
  return (
    <div className={styles['example-prompts-container']}>
      <h3 className={styles['example-prompts-title']}>Not sure where to start?</h3>
      <div className={styles['prompts-grid']}>
        {exampleQueries.map((prompt, index) => (
          <button
            key={index}
            className={styles['prompt-button']}
            onClick={() => onPromptClick(prompt.text, prompt.mode)}
            disabled={isLoading}
          >
            {prompt.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExamplePrompts;