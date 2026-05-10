import React, { createContext, useContext, useMemo } from 'react';
import { Theme, ThemeClasses, themes } from './theme';

interface ThemeContextValue {
  theme: Theme;
  isEmbed: boolean;
  isAllCourtsEmbed: boolean;
  t: ThemeClasses;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  isEmbed: false,
  isAllCourtsEmbed: false,
  t: themes.dark,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isEmbed, isAllCourtsEmbed } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const embed = params.get('embed') === 'true';
    const embedSource = params.get('embedSource') || params.get('source');
    const referrerOrigin = document.referrer ? new URL(document.referrer).origin : '';

    return {
      isEmbed: embed,
      isAllCourtsEmbed: embed && (embedSource === 'allcourts' || referrerOrigin === 'https://allcourts.you-right.ru'),
    };
  }, []);

  const theme: Theme = isAllCourtsEmbed ? 'allcourts' : isEmbed ? 'light' : 'dark';
  const t = themes[theme];

  return (
    <ThemeContext.Provider value={{ theme, isEmbed, isAllCourtsEmbed, t }}>
      {children}
    </ThemeContext.Provider>
  );
};
