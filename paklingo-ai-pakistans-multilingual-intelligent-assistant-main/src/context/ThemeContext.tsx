import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeName = 'emerald' | 'navy-gold' | 'blue' | 'dark' | 'light' | 'pink' | 'yellow' | 'purple' | 'grey';
export type FontSizeOption = 'small' | 'medium' | 'large';

export interface ThemeMeta {
  id: ThemeName;
  name: string;
  category: 'dark' | 'light';
  bgPreview: string;
  surfacePreview: string;
  accentPreview: string;
  description: string;
}

export const THEMES_LIST: ThemeMeta[] = [
  {
    id: 'emerald',
    name: 'Emerald SaaS',
    category: 'light',
    bgPreview: '#f8fafc',
    surfacePreview: '#ffffff',
    accentPreview: '#059669',
    description: 'Modern Pakistani Emerald + Clean Slate',
  },
  {
    id: 'dark',
    name: 'Obsidian Emerald',
    category: 'dark',
    bgPreview: '#090d16',
    surfacePreview: '#0f172a',
    accentPreview: '#10b981',
    description: 'Deep Charcoal + Luminous Emerald',
  },
  {
    id: 'navy-gold',
    name: 'Premier AI',
    category: 'light',
    bgPreview: '#f8f9fa',
    surfacePreview: '#ffffff',
    accentPreview: '#d97706',
    description: 'Deep Navy + Warm Pakistani Gold',
  },
  {
    id: 'blue',
    name: 'Blue',
    category: 'light',
    bgPreview: '#f0f7ff',
    surfacePreview: '#ffffff',
    accentPreview: '#2563eb',
    description: 'Soft Blue + Deep Navy',
  },
  {
    id: 'dark',
    name: 'Dark',
    category: 'dark',
    bgPreview: '#0a1128',
    surfacePreview: '#111e3f',
    accentPreview: '#10b981',
    description: 'Deep Navy + Soft White',
  },
  {
    id: 'light',
    name: 'Light',
    category: 'light',
    bgPreview: '#f8fafc',
    surfacePreview: '#ffffff',
    accentPreview: '#0a1128',
    description: 'Soft White + Deep Navy',
  },
  {
    id: 'pink',
    name: 'Pink',
    category: 'light',
    bgPreview: '#fff1f4',
    surfacePreview: '#ffffff',
    accentPreview: '#e11d48',
    description: 'Soft Pink + Deep Navy',
  },
  {
    id: 'yellow',
    name: 'Yellow',
    category: 'light',
    bgPreview: '#fefce8',
    surfacePreview: '#ffffff',
    accentPreview: '#d97706',
    description: 'Warm Cream/Yellow + Deep Navy',
  },
  {
    id: 'purple',
    name: 'Purple',
    category: 'light',
    bgPreview: '#f8f5ff',
    surfacePreview: '#ffffff',
    accentPreview: '#7c3aed',
    description: 'Soft Lavender + Deep Navy',
  },
  {
    id: 'grey',
    name: 'Grey',
    category: 'light',
    bgPreview: '#f4f5f7',
    surfacePreview: '#ffffff',
    accentPreview: '#334155',
    description: 'Light Grey + Charcoal/Navy',
  },
];

export interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  fontSize: FontSizeOption;
  setFontSize: (size: FontSizeOption) => void;
  resolvedTheme: 'light' | 'dark';
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'paklingo_theme';
const FONT_SIZE_STORAGE_KEY = 'paklingo_font_size';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state: default to 'emerald' for Modern Pakistani AI Super-App
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window === 'undefined') return 'emerald';
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      const validThemes: ThemeName[] = ['emerald', 'navy-gold', 'blue', 'dark', 'light', 'pink', 'yellow', 'purple', 'grey'];
      if (saved && validThemes.includes(saved as ThemeName)) {
        return saved as ThemeName;
      }
    } catch {
      // ignore
    }
    return 'emerald';
  });

  // Font Size state
  const [fontSize, setFontSizeState] = useState<FontSizeOption>(() => {
    if (typeof window === 'undefined') return 'medium';
    try {
      const saved = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
      if (saved === 'small' || saved === 'medium' || saved === 'large') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'medium';
  });

  // Derived resolvedTheme ('light' | 'dark')
  const resolvedTheme: 'light' | 'dark' = theme === 'dark' ? 'dark' : 'light';

  // Apply Theme to DOM
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Set data-theme attribute
    root.setAttribute('data-theme', theme);

    // Maintain dark class for Tailwind's dark: variants
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    // Persist to localStorage
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme, resolvedTheme]);

  // Apply Font Size to DOM
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    root.setAttribute('data-font-size', fontSize);

    // Apply root font-size so that all rem units scale globally
    if (fontSize === 'small') {
      root.style.fontSize = '14px';
    } else if (fontSize === 'large') {
      root.style.fontSize = '18px';
    } else {
      root.style.fontSize = '16px';
    }

    try {
      localStorage.setItem(FONT_SIZE_STORAGE_KEY, fontSize);
    } catch {
      // ignore
    }
  }, [fontSize]);

  const setTheme = useCallback((newTheme: ThemeName) => {
    setThemeState(newTheme);
  }, []);

  const setFontSize = useCallback((newSize: FontSizeOption) => {
    setFontSizeState(newSize);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'emerald' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        fontSize,
        setFontSize,
        resolvedTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
