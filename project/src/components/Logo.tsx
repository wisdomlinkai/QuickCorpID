import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useBranding } from '../config/branding';

const Logo = () => {
  const { lang } = useLanguage();
  const { branding } = useBranding();
  const name = lang === 'zh' ? branding.name.zh : branding.name.en;

  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path d="M9 22V12h6v10" />
        </svg>
      </div>
      <span className="text-lg font-bold text-slate-900 tracking-tight">{name}</span>
    </Link>
  );
};

export default Logo;
