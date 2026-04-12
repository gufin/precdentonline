import React, { createContext, useContext, useMemo } from 'react';
import { Theme, ThemeClasses, themes } from './theme';

interface ThemeContextValue {
  theme: Theme;
  isEmbed: boolean;
  t: ThemeClasses;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  isEmbed: false,
  t: themes.dark,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isEmbed = useMemo(
    () => new URLSearchParams(window.location.search).get('embed') === 'true',
    []
  );
  const theme: Theme = isEmbed ? 'light' : 'dark';
  const t = themes[theme];

  return (
    <ThemeContext.Provider value={{ theme, isEmbed, t }}>
      {children}
    </ThemeContext.Provider>
  );
};
