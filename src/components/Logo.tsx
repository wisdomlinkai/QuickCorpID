import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useBranding } from '../config/branding';

const Logo = () => {
  const { branding } = useBranding();
  
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <div className="relative">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold text-slate-800 leading-tight">
          {branding.logo.type === 'image' ? (
            <img src={branding.logo.imageUrl} alt={branding.logo.imageAlt || branding.companyName} className="h-8" />
          ) : (
            branding.companyName.split(' ')[0]
          )}
        </span>
        <span className="text-xs text-slate-500 leading-tight">
          {branding.logo.type === 'text' && branding.companyName.split(' ').slice(1).join(' ')}
        </span>
      </div>
    </Link>
  );
};

export default Logo;
