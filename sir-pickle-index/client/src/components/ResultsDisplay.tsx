// src/components/ResultsDisplay.tsx
// 
// This component displays search results for both "Ask" and "Keyword" search modes.
// 
// Key Features:
// - ASK MODE: Displays structured AI answers with citations and related sources
// - KEYWORD MODE: Displays search results with highlighted keywords in snippets
// - Keyword highlighting uses green background to make search terms stand out
// - Responsive design with dark/light theme support
// - Consistent styling between both search modes
//
import React from 'react';
import styles from './ResultsDisplay.module.css';

// Define interfaces for the expected result structures based on your backend API
// These should match the PRD and your actual API response shapes
interface StructuredAnswer {
  introduction: string;
  explanation: string;
  examples: string;
  tips: string;
  caveats: string;
}

interface Citation {
  id: number;
  sourceIndex: number;
}

interface RelatedSource {
  videoTitle: string;
  timestampLink: string;
  snippet: string;
  publishedDate: string;
  tags: string[];
  channel: string;
  category: string;
  videoUrl: string;
}

export interface AskResult {
  answerTimeMs: number;
  structuredAnswer: StructuredAnswer;
  citations: Citation[];
  relatedSources: RelatedSource[];
}

export interface KeywordResultItem {
  videoTitle: string;
  timestampLink: string;
  snippet: string;
  publishedDate: string;
  tags: string[];
  channel: string;
  category: string;
  videoUrl: string;
}

export interface KeywordSearchResult {
  results: KeywordResultItem[];
  // searchTimeMs: number; // If your backend adds this for keyword search
}

interface ResultsDisplayProps {
  searchMode: 'ask' | 'keyword';
  results: AskResult | KeywordSearchResult | null;
  isLoading: boolean;
  error: string | null;
  searchQuery?: string; // Added to enable keyword highlighting
  appliedFilter?: string; // Added to show applied filter
}

// Helper function to render text with citations (basic implementation)
const renderTextWithCitations = (text: string, citations: Citation[], relatedSources: RelatedSource[]) => {
  if (!text) return null;

  // This regex is very basic. It finds [Source X]
  // A more robust solution might involve a proper parser if citations get complex
  const parts = text.split(/(\[Source \d+\])/g);

  return parts.map((part, index) => {
    const citationMatch = part.match(/\[Source (\d+)\]/);
    if (citationMatch) {
      const citationId = parseInt(citationMatch[1], 10);
      const citationData = citations.find(c => c.id === citationId);
      if (citationData && relatedSources[citationData.sourceIndex]) {
        // In a real app, clicking this could scroll to/highlight the source
        return (
          <span key={index} className={styles['citation-link']} title={`Source: ${relatedSources[citationData.sourceIndex].videoTitle}`}>
            [{citationId}]
          </span>
        );
      }
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

// Helper function to highlight keywords in text
const highlightKeywords = (text: string, searchQuery: string) => {
  if (!text || !searchQuery) return text;

  // Split search query into individual terms and filter out empty strings
  const keywords = searchQuery
    .toLowerCase()
    .split(/\s+/)
    .filter(term => term.length > 0);

  if (keywords.length === 0) return text;

  // Create a regex pattern that matches any of the keywords (case-insensitive)
  // Escape special regex characters in keywords
  const escapedKeywords = keywords.map(keyword => 
    keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  const pattern = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');

  // Split text by the pattern and wrap matches in mark tags
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    if (!part) return <React.Fragment key={index}></React.Fragment>;
    
    // Check if this part matches any of our keywords (case-insensitive)
    const isKeyword = keywords.some(keyword => 
      part.toLowerCase() === keyword.toLowerCase()
    );

    if (isKeyword) {
      return <mark key={index} className={styles['keyword-highlight']}>{part}</mark>;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  searchMode,
  results,
  isLoading,
  error,
  searchQuery,
  appliedFilter,
}) => {
  if (isLoading) {
    return <div className={styles['loading-text']}>Loading...</div>;
  }

  if (error) {
    return <div className={`${styles['error-text']} ${styles['results-display-container']}`}>Error: {error}</div>;
  }

  if (!results) {
    return null; // ExamplePrompts will be shown instead when no search has been performed
  }

  // --- ASK A QUESTION RESULTS ---
  if (searchMode === 'ask' && results && 'structuredAnswer' in results) {
    const askData = results as AskResult;
    const { structuredAnswer, citations, relatedSources, answerTimeMs } = askData;

    return (
      <div className={`${styles['results-display-container']} ${styles['ask-result-container']}`}>
        <h4>AI Answer ({answerTimeMs}ms)</h4>
        
        {structuredAnswer.introduction && (
          <div className={styles['structured-answer-section']}>
            <strong>Introduction</strong>
            <p>{renderTextWithCitations(structuredAnswer.introduction, citations, relatedSources)}</p>
          </div>
        )}
        {structuredAnswer.explanation && (
          <div className={styles['structured-answer-section']}>
            <strong>Explanation</strong>
            <p>{renderTextWithCitations(structuredAnswer.explanation, citations, relatedSources)}</p>
          </div>
        )}
        {structuredAnswer.examples && structuredAnswer.examples !== "No specific examples were found in the provided context." && (
          <div className={styles['structured-answer-section']}>
            <strong>Examples from the Sources</strong>
            <p>{renderTextWithCitations(structuredAnswer.examples, citations, relatedSources)}</p>
          </div>
        )}
         {structuredAnswer.tips && structuredAnswer.tips !== "No specific tips or key takeaways were found in the provided context." && (
          <div className={styles['structured-answer-section']}>
            <strong>Tips / Key Takeaways</strong>
            <p>{renderTextWithCitations(structuredAnswer.tips, citations, relatedSources)}</p>
          </div>
        )}
        {structuredAnswer.caveats && structuredAnswer.caveats !== "No specific caveats or important considerations were found in the provided context." && (
          <div className={styles['structured-answer-section']}>
            <strong>Caveats / Important Considerations</strong>
            <p>{renderTextWithCitations(structuredAnswer.caveats, citations, relatedSources)}</p>
          </div>
        )}

        {relatedSources && relatedSources.length > 0 && (
          <div className={styles['related-sources-list']}>
            <h5>Related Sources:</h5>
            {relatedSources.map((source, index) => (
              <div key={source.videoUrl + index} className={styles['related-source-item']}> {/* Use a more unique key if possible */}
                <h3>{source.videoTitle}</h3>
                <div className={styles.metadata}>
                  <span>Category: {source.category}</span>
                  <span>Published: {new Date(source.publishedDate).toLocaleDateString()}</span>
                </div>
                {source.tags && source.tags.length > 0 && (
                    <div className={styles.metadata}>Tags: {source.tags.join(', ')}</div>
                )}
                <p className={styles.snippet}>{source.snippet}</p>
                <a href={source.videoUrl} target="_blank" rel="noopener noreferrer" className={styles['source-link']}>
                  Watch Video ({source.timestampLink || 'Full Video'})
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- KEYWORD SEARCH RESULTS ---
  if (searchMode === 'keyword' && results && 'results' in results) {
    const keywordData = results as KeywordSearchResult;
    
    return (
      <div className={`${styles['results-display-container']} ${styles['keyword-result-container']}`}>
        <h4>Keyword Search Results</h4>
        
        {appliedFilter && (
          <div className={styles['applied-filter']}>
            <span className={styles['filter-label']}>Filter applied:</span> 
            <span className={styles['filter-value']}>{appliedFilter}</span>
          </div>
        )}
        
        {keywordData.results.length === 0 ? (
          <p className={styles['no-results-text']}>No results found for your keyword search.</p>
        ) : (
          <>
            <div className={styles['results-count']}>
              Found {keywordData.results.length} result{keywordData.results.length !== 1 ? 's' : ''}
            </div>
            
            <div className={styles['keyword-results-list']}>
              {keywordData.results.map((item, index) => (
                <div key={item.videoUrl + index} className={styles['related-source-item']}>
                  <h3>{item.videoTitle}</h3>
                  <div className={styles.metadata}>
                    <span>Channel: {item.channel}</span>
                    <span>Category: {item.category}</span>
                    <span>Published: {new Date(item.publishedDate).toLocaleDateString()}</span>
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div className={styles.metadata}>
                      <strong>Tags:</strong> {item.tags.join(', ')}
                    </div>
                  )}
                  <p className={styles.snippet}>
                    {highlightKeywords(item.snippet, searchQuery || '')}
                  </p>
                  <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" className={styles['source-link']}>
                    Watch Video ({item.timestampLink || 'View Context'})
                  </a>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return <div className={`${styles['no-results-text']} ${styles['results-display-container']}`}>No results to display or unknown format.</div>;
};

export default ResultsDisplay;