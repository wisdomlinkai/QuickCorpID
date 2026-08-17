import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { translations, type Language } from './translations';

type LanguageContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof translations.en;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('ibiz-lang');
    return (saved === 'en' || saved === 'zh') ? saved : 'en';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('ibiz-lang', newLang);
  };

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-HK' : 'en';
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
