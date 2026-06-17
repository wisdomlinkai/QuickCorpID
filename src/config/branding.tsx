/**
 * Co-Branding Configuration
 * 
 * This module provides white-label branding support for the QuickCorpID application.
 * Partners can customize logo, colors, company name, contact information, and footer text.
 */

import { createContext, useContext, ReactNode, useState } from 'react';

export interface BrandingConfig {
  // Company Information
  companyName: string;
  companyNameZh: string;
  tagline: string;
  taglineZh: string;
  
  // Branding Colors
  colors: {
    primary: string;
    primaryHover: string;
    secondary: string;
    accent: string;
    gradient: {
      from: string;
      to: string;
    };
  };
  
  // Logo Configuration
  logo: {
    type: 'text' | 'image';
    imageUrl?: string;
    imageAlt?: string;
  };
  
  // Contact Information
  contact: {
    email: string;
    phone: string;
    website?: string;
  };
  
  // Footer
  footer: {
    copyright: string;
    termsUrl?: string;
    privacyUrl?: string;
  };
  
  // Feature Flags
  features: {
    showPricingPage: boolean;
    showAboutPage: boolean;
    customRegisterUrl?: string;
  };
}

// ============ Default CorpID QuickStart Branding ============

export const defaultBranding: BrandingConfig = {
  companyName: 'CorpID QuickStart HK',
  companyNameZh: 'CorpID QuickStart HK',
  tagline: 'Digital identity made simple',
  taglineZh: '數碼身份變簡單',
  
  colors: {
    primary: '#2563eb', // blue-600
    primaryHover: '#1d4ed8', // blue-700
    secondary: '#14b8a6', // teal-500
    accent: '#0d9488', // teal-600
    gradient: {
      from: '#2563eb', // blue-600
      to: '#14b8a6', // teal-500
    },
  },
  
  logo: {
    type: 'text',
  },
  
  contact: {
    email: 'support@corpidquickstart.hk',
    phone: '+852 1234 5678',
  },
  
  footer: {
    copyright: '© 2024 CorpID QuickStart HK',
  },
  
  features: {
    showPricingPage: true,
    showAboutPage: true,
  },
};

// ============ Tai HK Partner Branding (Example) ============

export const taiHKBranding: BrandingConfig = {
  companyName: 'Tai HK CorpID Portal',
  companyNameZh: '泰港 CorpID 門戶',
  tagline: 'Your trusted CorpID partner',
  taglineZh: '您信賴的 CorpID 合作夥伴',
  
  colors: {
    primary: '#7c3aed', // violet-600
    primaryHover: '#6d28d9', // violet-700
    secondary: '#ec4899', // pink-500
    accent: '#db2777', // pink-600
    gradient: {
      from: '#7c3aed', // violet-600
      to: '#ec4899', // pink-500
    },
  },
  
  logo: {
    type: 'text',
  },
  
  contact: {
    email: 'support@taihk.hk',
    phone: '+852 9876 5432',
    website: 'https://taihk.hk',
  },
  
  footer: {
    copyright: '© 2024 Tai HK Limited',
    termsUrl: 'https://taihk.hk/terms',
    privacyUrl: 'https://taihk.hk/privacy',
  },
  
  features: {
    showPricingPage: true,
    showAboutPage: true,
  },
};

// ============ Branding Context ============

interface BrandingContextType {
  branding: BrandingConfig;
  setBranding: (config: BrandingConfig) => void;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

interface BrandingProviderProps {
  children: ReactNode;
  initialBranding?: BrandingConfig;
}

export const BrandingProvider = ({ children, initialBranding = defaultBranding }: BrandingProviderProps) => {
  const [branding, setBranding] = useState<BrandingConfig>(initialBranding);
  
  return (
    <BrandingContext.Provider value={{ branding, setBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = (): BrandingContextType => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};

// ============ Utility Functions ============

/**
 * Get Tailwind gradient classes based on branding colors
 */
export function getGradientClasses(branding: BrandingConfig): string {
  // Map branding colors to Tailwind classes
  // In production, you'd use CSS custom properties for full flexibility
  const gradientMap: Record<string, string> = {
    'blue-teal': 'from-blue-600 to-teal-500',
    'violet-pink': 'from-violet-600 to-pink-500',
    'emerald-teal': 'from-emerald-600 to-teal-500',
    'orange-amber': 'from-orange-600 to-amber-500',
  };
  
  const key = `${branding.colors.gradient.from.split('-')[0]}-${branding.colors.gradient.to.split('-')[0]}`;
  return gradientMap[key] || 'from-blue-600 to-teal-500';
}

/**
 * Check if current branding is the default
 */
export function isDefaultBranding(branding: BrandingConfig): boolean {
  return branding.companyName === defaultBranding.companyName;
}

// ============ Available Brandings ============

export const availableBrandings: Record<string, BrandingConfig> = {
  default: defaultBranding,
  taihk: taiHKBranding,
};

/**
 * Get branding by key
 */
export function getBrandingByKey(key: string): BrandingConfig {
  return availableBrandings[key] || defaultBranding;
}
