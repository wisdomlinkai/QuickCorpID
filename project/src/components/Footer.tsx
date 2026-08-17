import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">{t.footer.product}</h3>
            <ul className="space-y-3">
              <li><Link to="/" className="text-sm hover:text-white transition-colors">{t.nav.home}</Link></li>
              <li><Link to="/register" className="text-sm hover:text-white transition-colors">{t.nav.register}</Link></li>
              <li><Link to="/dashboard" className="text-sm hover:text-white transition-colors">{t.nav.dashboard}</Link></li>
              <li><Link to="/pricing" className="text-sm hover:text-white transition-colors">{t.nav.pricing}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">{t.footer.support}</h3>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-sm hover:text-white transition-colors">{t.nav.about}</Link></li>
              <li><a href="mailto:support@ibizsmart.hk" className="text-sm hover:text-white transition-colors">{t.footer.contact}</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">{t.footer.legal}</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm hover:text-white transition-colors">{t.footer.terms}</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">{t.footer.privacy}</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">{t.footer.contact}</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 flex-shrink-0" /><a href="mailto:support@ibizsmart.hk" className="hover:text-white transition-colors">support@ibizsmart.hk</a></li>
              <li className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 flex-shrink-0" /><span>+852 1234 5678</span></li>
              <li className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 flex-shrink-0" /><span>Hong Kong</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-400">{t.footer.copyright}</p>
          <p className="text-sm text-slate-400">{t.footer.tagline}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
