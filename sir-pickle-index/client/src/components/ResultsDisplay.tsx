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

// Add interfaces for processed answer structure
interface CitationPart {
  type: 'text' | 'citation';
  content: string;
  sourceIndex?: number;
}

interface ProcessedAnswerField {
  [key: string]: CitationPart[];
}

interface ProcessedAnswer {
  original: StructuredAnswer;
  processed: ProcessedAnswerField;
}

interface RelatedSource {
  videoTitle: string;
  timestampLink: string;
  timestampUrl: string;
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
  processedAnswer?: ProcessedAnswer; // Add processedAnswer to the interface
  citations: Citation[];
  relatedSources: RelatedSource[];
}

export interface KeywordResultItem {
  videoTitle: string;
  timestampLink: string;
  timestampUrl: string;
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

// Helper function to render processed field with clickable citations
const renderProcessedField = (fieldParts: CitationPart[], relatedSources: RelatedSource[]) => {
  if (!fieldParts || !Array.isArray(fieldParts)) return null;

  return fieldParts.map((part, index) => {
    if (part.type === 'citation' && part.sourceIndex !== undefined && relatedSources[part.sourceIndex]) {
      const source = relatedSources[part.sourceIndex];
      return (
        <a 
          key={index} 
          href={source.timestampUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles['citation-link']} 
          title={`Jump to: ${source.videoTitle} at ${source.timestampLink}`}
        >
          {part.content}
        </a>
      );
    }
    return <React.Fragment key={index}>{part.content}</React.Fragment>;
  });
};

// Helper function to render text with citations (basic implementation - fallback)
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
        const source = relatedSources[citationData.sourceIndex];
        return (
          <a 
            key={index} 
            href={source.timestampUrl}
            target="_blank" 
            rel="noopener noreferrer"
            className={styles['citation-link']} 
            title={`Jump to: ${source.videoTitle} at ${source.timestampLink}`}
          >
            [{citationId}]
          </a>
        );
      }
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

// Helper function to highlight keywords in text
const highlightKeywords = (text: string, searchQuery: string) => {
  if (!text || !searchQuery) return text;

  // Split search query into individual terms and filter out empty/short strings
  const keywords = searchQuery
    .toLowerCase()
    .split(/\s+/)
    .filter(term => term.length > 2); // Filter out very short words like "a", "is", etc.

  if (keywords.length === 0) return text;

  // Create a regex pattern that matches any of the keywords (case-insensitive)
  // Escape special regex characters in keywords
  const escapedKeywords = keywords.map(keyword => 
    keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  
  // Try to match exact phrase first, then individual words
  const exactPhrase = searchQuery.trim().toLowerCase();
  const patterns = [];
  
  // Add exact phrase pattern if it's longer than a single word
  if (exactPhrase.includes(' ') && exactPhrase.length > 3) {
    const escapedPhrase = exactPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    patterns.push(escapedPhrase);
  }
  
  // Add individual keyword patterns
  patterns.push(...escapedKeywords);
  
  const pattern = new RegExp(`(${patterns.join('|')})`, 'gi');

  // Split text by the pattern and wrap matches in mark tags
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    if (!part) return <React.Fragment key={index}></React.Fragment>;
    
    // Check if this part matches exact phrase or any individual keywords (case-insensitive)
    const partLower = part.toLowerCase();
    const isExactPhrase = exactPhrase.includes(' ') && partLower === exactPhrase;
    const isKeyword = keywords.some(keyword => partLower === keyword);

    if (isExactPhrase || isKeyword) {
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
    const { structuredAnswer, processedAnswer, citations, relatedSources, answerTimeMs } = askData;

    // Debug logging
    console.log('[ResultsDisplay] Received askData:', { 
      hasProcessedAnswer: !!processedAnswer, 
      citationsCount: citations?.length || 0,
      relatedSourcesCount: relatedSources?.length || 0 
    });
    
    if (processedAnswer) {
      console.log('[ResultsDisplay] processedAnswer structure:', processedAnswer);
    }

    // Helper function to render a field, preferring processed data
    const renderAnswerField = (fieldName: keyof StructuredAnswer, fieldValue: string) => {
      if (processedAnswer && processedAnswer.processed[fieldName]) {
        console.log(`[ResultsDisplay] Using processed data for field: ${fieldName}`, processedAnswer.processed[fieldName]);
        return renderProcessedField(processedAnswer.processed[fieldName], relatedSources);
      }
      // Fallback to basic implementation
      console.log(`[ResultsDisplay] Using fallback for field: ${fieldName}`);
      return renderTextWithCitations(fieldValue, citations, relatedSources);
    };

    return (
      <div className={`${styles['results-display-container']} ${styles['ask-result-container']}`}>
        <h4>AI Answer ({answerTimeMs}ms)</h4>
        
        {structuredAnswer.introduction && (
          <div className={styles['structured-answer-section']}>
            <strong>Introduction</strong>
            <p>{renderAnswerField('introduction', structuredAnswer.introduction)}</p>
          </div>
        )}
        {structuredAnswer.explanation && (
          <div className={styles['structured-answer-section']}>
            <strong>Explanation</strong>
            <p>{renderAnswerField('explanation', structuredAnswer.explanation)}</p>
          </div>
        )}
        {structuredAnswer.examples && structuredAnswer.examples !== "No specific examples were found in the provided context." && (
          <div className={styles['structured-answer-section']}>
            <strong>Examples from the Sources</strong>
            <p>{renderAnswerField('examples', structuredAnswer.examples)}</p>
          </div>
        )}
         {structuredAnswer.tips && structuredAnswer.tips !== "No specific tips or key takeaways were found in the provided context." && (
          <div className={styles['structured-answer-section']}>
            <strong>Tips / Key Takeaways</strong>
            <p>{renderAnswerField('tips', structuredAnswer.tips)}</p>
          </div>
        )}
        {structuredAnswer.caveats && structuredAnswer.caveats !== "No specific caveats or important considerations were found in the provided context." && (
          <div className={styles['structured-answer-section']}>
            <strong>Caveats / Important Considerations</strong>
            <p>{renderAnswerField('caveats', structuredAnswer.caveats)}</p>
          </div>
        )}

        {relatedSources && relatedSources.length > 0 && (
          <div className={styles['related-sources-list']}>
            <h5>Sources:</h5>
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
                <a href={source.timestampUrl} target="_blank" rel="noopener noreferrer" className={styles['source-link']}>
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
                  <a href={item.timestampUrl} target="_blank" rel="noopener noreferrer" className={styles['source-link']}>
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