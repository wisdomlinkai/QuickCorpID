import { useBranding } from '../config/branding.tsx';
import { useLanguage } from '../i18n/LanguageContext';
import { Building2 } from 'lucide-react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export default function Logo({ className = '', showText = true }: LogoProps) {
  const { branding } = useBranding();
  const { language } = useLanguage();
  
  // Check if partner has a custom logo image
  const hasCustomLogo = branding?.logo?.type === 'image' && branding.logo.imageUrl;
  
  if (hasCustomLogo) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <img 
          src={branding.logo.imageUrl!} 
          alt={branding.logo.imageAlt || branding.companyName}
          className="h-8 w-auto"
        />
        {!showText && <span className="sr-only">{branding.companyName}</span>}
      </div>
    );
  }
  
  // Show Chinese or English based on language
  const displayName = language === 'zh'
    ? (branding?.companyNameZh || branding?.companyName || 'CorpID QuickStart')
    : (branding?.companyName || branding?.companyNameZh || 'CorpID QuickStart');
  const primaryColor = branding?.colors?.primary || '#2563eb';
  const gradientFrom = branding?.colors?.gradient?.from || '#2563eb';
  const gradientTo = branding?.colors?.gradient?.to || '#14b8a6';
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundImage: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientTo})` }}
      >
        <Building2 className="w-5 h-5 text-white" />
      </div>
      {showText && (
        <span 
          className="text-xl font-bold"
          style={{ color: primaryColor }}
        >
          {displayName}
        </span>
      )}
    </div>
  );
}
