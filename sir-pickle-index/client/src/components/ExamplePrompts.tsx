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
  { text: 'What is an order block?', mode: 'ask' as SearchMode },
  { text: 'What is institutional order flow?', mode: 'ask' as SearchMode },
  { text: 'How do I use an optimal trade entry?', mode: 'ask' as SearchMode },
  { text: 'Premium and discount PD arrays', mode: 'keyword' as SearchMode }, // Example keyword
  { text: 'Why not trade during high impact news?', mode: 'ask' as SearchMode },
  { text: 'What is an SMT divergence?', mode: 'ask' as SearchMode },
  // Add more examples from your design
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