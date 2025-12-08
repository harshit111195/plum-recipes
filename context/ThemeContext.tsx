import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * 🎨 THEME CONTEXT
 * ============================================
 * Manages light/dark mode theming for the app.
 * 
 * Usage:
 *   const { theme, setTheme, isDark } = useTheme();
 * 
 * Theme options:
 *   - 'light': Always light mode
 *   - 'dark': Always dark mode (DEFAULT)
 *   - 'system': Follow system preference
 */

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  isDark: boolean;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'plum-theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from localStorage, default to 'dark'
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem(STORAGE_KEY) as Theme;
    return stored || 'dark';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  // Apply theme to document
  const applyTheme = useCallback((isDark: boolean) => {
    const root = document.documentElement;
    
    if (isDark) {
      root.classList.add('dark');
      setResolvedTheme('dark');
      // Update theme-color meta tag for browser UI
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0D0D0D');
    } else {
      root.classList.remove('dark');
      setResolvedTheme('light');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#F5F5F5');
    }
  }, []);

  // Handle theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);
      
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme, applyTheme]);

  // Set theme and persist to localStorage
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  }, []);

  const isDark = resolvedTheme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
