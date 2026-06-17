import { Globe } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-slate-100 rounded-full p-1">
      <Globe className="w-4 h-4 text-slate-500 ml-2" />
      <button onClick={() => setLanguage('en')} className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${language === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>EN</button>
      <button onClick={() => setLanguage('zh')} className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${language === 'zh' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>中文</button>
    </div>
  );
};

export default LanguageSwitcher;
