import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getLanguageFromUrl = (): Language | null => {
  const params = new URLSearchParams(window.location.search);
  const langParam = params.get('lang');
  if (langParam === 'zh' || langParam === 'en') {
    return langParam;
  }
  return null;
};

const updateUrlLanguage = (lang: Language) => {
  const url = new URL(window.location.href);
  url.searchParams.set('lang', lang);
  window.history.replaceState({}, '', url.toString());
};

const updateHtmlLang = (lang: Language) => {
  document.documentElement.lang = lang;
  // Update page title based on language
  const titles = {
    en: 'CorpID QuickStart HK - Register CorpID in 5 Minutes',
    zh: 'CorpID QuickStart HK - 輕鬆註冊 CorpID，5 分鐘搞定'
  };
  document.title = titles[lang];
  
  // Update meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    const descriptions = {
      en: 'CorpID QuickStart HK - The easiest way for Hong Kong SMEs to register their Digital Corporate Identity',
      zh: 'CorpID QuickStart HK - 香港中小企業取得數碼企業身份的最簡單方法'
    };
    metaDesc.setAttribute('content', descriptions[lang]);
  }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Priority: URL param > localStorage > default to 'en'
    const urlLang = getLanguageFromUrl();
    if (urlLang) {
      localStorage.setItem('language', urlLang);
      return urlLang;
    }
    const saved = localStorage.getItem('language');
    return saved === 'zh' ? 'zh' : 'en';
  });

  useEffect(() => {
    // Update localStorage
    localStorage.setItem('language', language);
    // Update URL
    updateUrlLanguage(language);
    // Update HTML lang attribute
    updateHtmlLang(language);
  }, [language]);

  // Listen for URL changes (back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const urlLang = getLanguageFromUrl();
      if (urlLang && urlLang !== language) {
        setLanguageState(urlLang);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [language]);

  // Set initial HTML lang on mount
  useEffect(() => {
    updateHtmlLang(language);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
