'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '../lib/ThemeProvider';

// Define the type for ThemeContext
type ThemeContextType = {
  theme: string;
  toggleTheme: () => void;
};

export default function ThemeToggle() {
  // Fallback state for when the component is used outside ThemeProvider
  const [localTheme, setLocalTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  // Try to use the ThemeProvider context, but don't throw if it's unavailable
  let themeContext: ThemeContextType | undefined;
  try {
    themeContext = useTheme();
  } catch (error) {
    // ThemeProvider not available, we'll use local state
  }
  
  // Initialize theme from localStorage or system preference when using local state
  useEffect(() => {
    setMounted(true);
    if (!themeContext) {
      const savedTheme = localStorage?.getItem('theme');
      if (savedTheme) {
        setLocalTheme(savedTheme);
      } else if (window?.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setLocalTheme('dark');
      }
    }
  }, [themeContext]);

  // Local theme toggle function
  const toggleLocalTheme = () => {
    const newTheme = localTheme === 'light' ? 'dark' : 'light';
    setLocalTheme(newTheme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
  };

  // Use context values if available, otherwise use local state
  const theme = themeContext?.theme || localTheme;
  const toggleTheme = themeContext?.toggleTheme || toggleLocalTheme;

  // Prevent hydration mismatch
  if (!mounted && !themeContext) {
    return null;
  }

  return (
    <button 
      className="theme-toggle" 
      onClick={toggleTheme} 
      aria-label="Toggle light/dark mode"
    >
      {theme === 'light' ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v2"></path>
          <path d="M12 20v2"></path>
          <path d="m4.93 4.93 1.41 1.41"></path>
          <path d="m17.66 17.66 1.41 1.41"></path>
          <path d="M2 12h2"></path>
          <path d="M20 12h2"></path>
          <path d="m6.34 17.66-1.41 1.41"></path>
          <path d="m19.07 4.93-1.41 1.41"></path>
        </svg>
      )}
    </button>
  );
} 