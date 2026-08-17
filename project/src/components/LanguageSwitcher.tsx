import { useLanguage } from '../i18n/LanguageContext';

const LanguageSwitcher = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-sm">
      <button
        onClick={() => setLang('en')}
        className={`px-3 py-1 rounded-md font-medium transition-colors ${
          lang === 'en' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        onClick={() => setLang('zh')}
        className={`px-3 py-1 rounded-md font-medium transition-colors ${
          lang === 'zh' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
        }`}
        aria-label="切換至中文"
      >
        中文
      </button>
    </div>
  );
};

export default LanguageSwitcher;
