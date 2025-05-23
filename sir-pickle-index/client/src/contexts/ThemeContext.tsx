// src/contexts/ThemeContext.tsx
import { createContext, useState, useContext, useEffect, type ReactNode, useCallback } from 'react';
import { flushSync } from 'react-dom';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('sir-pickle-ai-theme') as Theme | null;
    return storedTheme || 'dark'; // Default to dark
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sir-pickle-ai-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    // Use flushSync to ensure immediate DOM update for instant theme switching
    flushSync(() => {
      setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};