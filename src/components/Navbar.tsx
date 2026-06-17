import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import Logo from './Logo';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { path: '/', label: t.nav.home },
    { path: '/register', label: t.nav.register },
    { path: '/dashboard', label: t.nav.dashboard },
    { path: '/pricing', label: t.nav.pricing },
    { path: '/about', label: t.nav.about },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Logo />
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path} className={`text-sm font-medium transition-colors ${location.pathname === item.path ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}>
                  {item.label}
                </Link>
              ))}
            </div>
            <LanguageSwitcher />
          </div>
          <div className="md:hidden flex items-center gap-4">
            <LanguageSwitcher />
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {isOpen && (
          <div className="md:hidden py-4 border-t border-slate-200">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)} className={`px-4 py-3 rounded-lg text-sm font-medium ${location.pathname === item.path ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
