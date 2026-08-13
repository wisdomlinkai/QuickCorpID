/**
 * Co-Branding Configuration
 * @version 2.0.0
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

// ============ Default iBiz Smart Branding ============

export const defaultBranding: BrandingConfig = {
  companyName: 'iBiz Smart',
  companyNameZh: '智企通',
  tagline: 'Smart Enterprise Connection',
  taglineZh: '智能企業身份，簡單便捷',
  
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
    email: 'support@ibizsmart.hk',
    phone: '+852 1234 5678',
  },
  
  footer: {
    copyright: '© 2026 iBiz Smart 智企通',
  },
  
  features: {
    showPricingPage: true,
    showAboutPage: true,
  },
};

// ============ Tai HK Partner Branding ============

export const taiHKBranding: BrandingConfig = {
  companyName: 'Tai HK Corporate Services',
  companyNameZh: '大香港企業服務',
  tagline: '用心幫你 助你起飛',
  taglineZh: '用心幫你 助你起飛',
  
  // Colors based on Tai HK website - professional navy/teal tones
  colors: {
    primary: '#334155',       // slate-700 - Deep navy for professionalism
    primaryHover: '#1e293b', // slate-800
    secondary: '#0d9488',    // teal-600 - Teal accent from their brand
    accent: '#f59e0b',       // amber-500 - Gold for premium feel
    gradient: {
      from: '#334155',       // slate-700
      to: '#0d9488',         // teal-600
    },
  },
  
  logo: {
    type: 'text',
  },
  
  contact: {
    email: 'info@taihk.com.hk',
    phone: '+852 3611 5771',
    website: 'https://www.taihk.com.hk',
  },
  
  footer: {
    copyright: '© 2024 大香港企業服務 Tai HK Corporate Services',
    termsUrl: 'https://www.taihk.com.hk/terms',
    privacyUrl: 'https://www.taihk.com.hk/privacy',
  },
  
  features: {
    showPricingPage: false, // Tai HK has their own pricing
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

export const BrandingProvider = ({ children, initialBranding }: BrandingProviderProps) => {
  // Check URL for brand parameter
  const getInitialBranding = (): BrandingConfig => {
    if (typeof window === 'undefined') return initialBranding || defaultBranding;
    
    const urlParams = new URLSearchParams(window.location.search);
    const brandParam = urlParams.get('brand');
    
    if (brandParam === 'tai-hk') {
      return taiHKBranding;
    }
    
    return initialBranding || defaultBranding;
  };
  
  const [branding, setBranding] = useState<BrandingConfig>(getInitialBranding);
  
  return (
    <BrandingContext.Provider value={{ branding, setBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = (): BrandingContextType => {
  const context = useContext(BrandingContext);
  if (!context) {
    // Return default branding instead of throwing
    return {
      branding: defaultBranding,
      setBranding: () => {},
    };
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
