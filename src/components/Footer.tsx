import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useBranding } from '../config/branding.tsx';
import { Mail, Phone, Shield } from 'lucide-react';

const Footer = () => {
  const { t, language } = useLanguage();
  const { branding } = useBranding();
  
  // Show Chinese or English based on language setting
  const displayName = language === 'zh' 
    ? (branding?.companyNameZh || branding?.companyName || 'QuickCorpID')
    : (branding?.companyName || branding?.companyNameZh || 'QuickCorpID');
  const nameParts = displayName.split(' ');
  const tagline = language === 'zh'
    ? (branding?.taglineZh || branding?.tagline || 'Digital identity made simple')
    : (branding?.tagline || branding?.taglineZh || 'Digital identity made simple');

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ 
                  backgroundImage: branding?.colors?.gradient 
                    ? `linear-gradient(to bottom right, ${branding.colors.gradient.from}, ${branding.colors.gradient.to})`
                    : 'linear-gradient(to bottom right, #2563eb, #14b8a6)'
                }}
              >
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">{nameParts[0]}</span>
                <span className="text-xs text-slate-400 block">{nameParts.slice(1).join(' ') || tagline}</span>
              </div>
            </div>
            <p className="text-sm text-slate-400">{tagline}</p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">{t.footer.product}</h3>
            <ul className="space-y-3">
              <li><Link to="/register" className="text-sm hover:text-blue-400 transition-colors">{t.nav.register}</Link></li>
              {branding?.features?.showPricingPage && (
                <li><Link to="/pricing" className="text-sm hover:text-blue-400 transition-colors">{t.nav.pricing}</Link></li>
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">{t.footer.support}</h3>
            <ul className="space-y-3">
              {branding?.features?.showAboutPage && (
                <li><Link to="/about" className="text-sm hover:text-blue-400 transition-colors">{t.footer.contact}</Link></li>
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">{t.footer.legal}</h3>
            <ul className="space-y-3">
              <li><span className="text-sm hover:text-blue-400 transition-colors cursor-pointer">{t.footer.terms}</span></li>
              <li><span className="text-sm hover:text-blue-400 transition-colors cursor-pointer">{t.footer.privacy}</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              {branding?.contact?.email && (
                <div className="flex items-center gap-2"><Mail className="w-4 h-4" /><span>{branding.contact.email}</span></div>
              )}
              {branding?.contact?.phone && (
                <div className="flex items-center gap-2"><Phone className="w-4 h-4" /><span>{branding.contact.phone}</span></div>
              )}
              {branding?.contact?.website && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{branding.contact.website}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-slate-500">
              {language === 'zh' 
                ? (branding?.footer?.copyright || '© 2024 QuickCorpID')
                : (branding?.footer?.copyright || '© 2024 QuickCorpID')
              }
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
