import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Mail, Phone, Shield } from 'lucide-react';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-400 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div><span className="text-lg font-bold text-white">CorpID</span><span className="text-xs text-slate-400 block">QuickStart HK</span></div>
            </div>
            <p className="text-sm text-slate-400">{t.footer.tagline}</p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">{t.footer.product}</h3>
            <ul className="space-y-3">
              <li><Link to="/register" className="text-sm hover:text-blue-400 transition-colors">{t.nav.register}</Link></li>
              <li><Link to="/pricing" className="text-sm hover:text-blue-400 transition-colors">{t.nav.pricing}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">{t.footer.support}</h3>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-sm hover:text-blue-400 transition-colors">{t.footer.contact}</Link></li>
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
              <div className="flex items-center gap-2"><Mail className="w-4 h-4" /><span>{t.about.contact.email}</span></div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4" /><span>{t.about.contact.phone}</span></div>
            </div>
            <p className="text-sm text-slate-500">{t.footer.copyright}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
