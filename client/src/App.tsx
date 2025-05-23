// src/App.tsx
import { useState, useCallback, useEffect, useMemo } from 'react';
import './App.css';
import { useTheme } from './hooks/useTheme.js';
import InputSection, { type SearchParams } from './components/InputSection.js';
import ExamplePrompts from './components/ExamplePrompts.js';
import ExampleKeywords from './components/ExampleKeywords.js';
import ResultsDisplay, { type AskResult, type KeywordSearchResult } from './components/ResultsDisplay.js';
import AdminPage from './pages/AdminPage.js';
import AdminAuth from './components/AdminAuth.js'; // Import the new AdminAuth component
import apiService from './services/apiService.js';
import { useFilterOptions } from './hooks/useFilterOptions.js';

type SearchMode = 'ask' | 'keyword';

function App() {
  const { theme, toggleTheme } = useTheme();
  const { filterOptions } = useFilterOptions();
  const [currentSearchMode, setCurrentSearchMode] = useState<SearchMode>('ask');
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [results, setResults] = useState<AskResult | KeywordSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check for existing authentication on component mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        if (apiService.isAuthenticated()) {
          // Verify the token with the backend
          const response = await apiService.verifyToken();
          if (response.success) {
            setIsAuthenticated(true);
          } else {
            // Token is invalid, clear it
            apiService.logout();
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        // Token verification failed, clear it
        apiService.logout();
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkExistingAuth();
  }, []);

  // Check URL for admin parameter on component mount and handle URL changes
  useEffect(() => {
    if (isCheckingAuth) return; // Wait for auth check to complete

    const checkAdminParam = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const isAdminRequested = urlParams.get('admin') === 'true';
      
      if (isAdminRequested && !isAuthenticated) {
        setShowAdminAuth(true);
      } else if (!isAdminRequested) {
        setShowAdminAuth(false);
        // Don't automatically log out if user navigates away from admin URL
      }
    };

    checkAdminParam();

    // Listen for URL changes (back/forward navigation)
    const handlePopState = () => {
      checkAdminParam();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated, isCheckingAuth]);

  const handleSearch = useCallback(async (searchParams: SearchParams) => {
    setIsLoading(true);
    setError(null);
    setResults(null);
    setCurrentSearchMode(searchParams.mode);
    setCurrentQuery(searchParams.query);

    try {
      let response;
      if (searchParams.mode === 'ask') {
        response = await apiService.askQuestion(searchParams.query);
      } else {
        response = await apiService.keywordSearch(searchParams.query, searchParams.filter);
      }
      setResults(response);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePromptClick = useCallback((prompt: string, mode: SearchMode) => {
    console.log(`Example prompt clicked: "${prompt}" in mode: ${mode}`);
    const searchParams: SearchParams = {
      query: prompt,
      mode: mode,
    };
    handleSearch(searchParams);
  }, [handleSearch]);

  const handleKeywordClick = useCallback((keyword: string) => {
    console.log(`Example keyword clicked: "${keyword}"`);
    const searchParams: SearchParams = {
      query: keyword,
      mode: 'keyword',
    };
    handleSearch(searchParams);
  }, [handleSearch]);

  const handleModeChange = useCallback((newMode: SearchMode) => {
    // Clear results, error, and current query when switching modes
    setResults(null);
    setError(null);
    setCurrentQuery('');
    setCurrentSearchMode(newMode);
  }, []);

  const handleAuthSuccess = useCallback(() => {
    setIsAuthenticated(true);
    setShowAdminAuth(false);
  }, []);

  const handleAuthCancel = useCallback(() => {
    setShowAdminAuth(false);
    // Remove admin parameter from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('admin');
    window.history.replaceState({}, '', url.toString());
  }, []);

  const handleAdminExit = useCallback(() => {
    // Clear authentication state and tokens
    apiService.logout();
    setIsAuthenticated(false);
    setShowAdminAuth(false);
    // Remove admin parameter from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('admin');
    window.history.replaceState({}, '', url.toString());
  }, []);

  // Memoize expensive computations
  const shouldShowExamples = useMemo(() => 
    !results && !isLoading && !error, 
    [results, isLoading, error]
  );

  const shouldShowResults = useMemo(() => 
    !!(results || isLoading || error), 
    [results, isLoading, error]
  );

  // Memoize theme button content
  const themeButtonContent = useMemo(() => 
    theme === 'light' ? '🌙 Dark' : '☀️ Light',
    [theme]
  );

  // Show authentication modal if admin access is requested but not authenticated
  if (showAdminAuth && !isAuthenticated && !isCheckingAuth) {
    return <AdminAuth onAuthenticated={handleAuthSuccess} onCancel={handleAuthCancel} />;
  }

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Checking authentication...</div>
      </div>
    );
  }

  // Show admin page if authenticated
  if (isAuthenticated) {
    return (
      <div className="app-container">
        <header className="app-header">
          <h1>Sir Pickle Index</h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={handleAdminExit}
              className="theme-toggle-button"
            >
              ← Back to Main
            </button>
            <button onClick={toggleTheme} className="theme-toggle-button">
              {themeButtonContent}
            </button>
          </div>
        </header>
        <main className="main-content">
          <AdminPage />
        </main>
      </div>
    );
  }

  // Main application UI
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Sir Pickle Index</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={toggleTheme} className="theme-toggle-button">
            {themeButtonContent}
          </button>
        </div>
      </header>

      <div className="disclaimer-banner">
        <p>
            The information provided by this bot is designed to help users better
            understand concepts taught by Sir Pickle. 
            It is not intended to constitute financial advice, nor should it be relied upon as such.
            Always double check the information provided as it may contain inaccuracies.
        </p>
      </div>

      <main className="main-content">
        <InputSection 
          onSearch={handleSearch} 
          isLoading={isLoading} 
          filterOptions={filterOptions}
          onModeChange={handleModeChange}
        />
        
        {shouldShowExamples && (
          <>
            {currentSearchMode === 'ask' ? (
              <ExamplePrompts onPromptClick={handlePromptClick} isLoading={isLoading} />
            ) : (
              <ExampleKeywords onKeywordClick={handleKeywordClick} isLoading={isLoading} />
            )}
          </>
        )}
        
        {shouldShowResults && (
          <ResultsDisplay
            searchMode={currentSearchMode}
            results={results}
            isLoading={isLoading}
            error={error}
            searchQuery={currentQuery}
          />
        )}
      </main>
    </div>
  );
}

export default App;