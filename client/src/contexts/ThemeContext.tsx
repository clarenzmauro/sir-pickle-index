// src/contexts/ThemeContext.tsx
import { useState, useEffect, type ReactNode, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { ThemeContext, type Theme } from './theme.js';

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
      setTheme((prevTheme: Theme) => (prevTheme === 'light' ? 'dark' : 'light'));
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};