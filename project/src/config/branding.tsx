import { type ReactNode } from 'react';

export type Branding = {
  name: { en: string; zh: string };
  colors: {
    primary: string;
    secondary: string;
    gradient: string;
  };
  features: {
    showPricingPage: boolean;
    showAboutPage: boolean;
  };
};

const defaultBranding: Branding = {
  name: { en: 'iBiz Smart', zh: '智企通' },
  colors: {
    primary: '#2563eb',
    secondary: '#14b8a6',
    gradient: 'from-blue-600 to-teal-500',
  },
  features: {
    showPricingPage: true,
    showAboutPage: true,
  },
};

type BrandingContextValue = {
  branding: Branding;
};

export const useBranding = (): BrandingContextValue => {
  return { branding: defaultBranding };
};

export const BrandingProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};
