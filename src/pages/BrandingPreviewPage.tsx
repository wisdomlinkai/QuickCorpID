/**
 * Branding Preview Page
 * 
 * Use this page to preview different partner brandings.
 * Access at: /admin/branding
 */

import { useState } from 'react';
import { useBranding, brandingConfigs, type BrandingId } from '../config/branding.tsx';
import { Check, Copy, Palette, Building2, Mail, Phone, Globe } from 'lucide-react';

const BRAND_OPTIONS: { id: BrandingId; name: string; description: string }[] = [
  { id: 'default', name: 'CorpID QuickStart', description: 'Default branding' },
  { id: 'tai-hk', name: 'Tai HK Business Services', description: 'Company secretary partner' },
  { id: 'sleek', name: 'Sleek Hong Kong', description: 'Fintech partner' },
  { id: 'neat', name: 'Neat Business', description: 'Banking partner' },
];

export default function BrandingPreviewPage() {
  const { branding, setBranding, brandingId } = useBranding();
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = () => {
    const url = `${window.location.origin}?brand=${brandingId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Branding Preview</h1>
          <p className="text-slate-600 mt-2">Preview and test different partner brandings</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Branding Selector */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Select Branding</h2>
              <div className="space-y-2">
                {BRAND_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setBranding(option.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      brandingId === option.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-800">{option.name}</p>
                        <p className="text-sm text-slate-500">{option.description}</p>
                      </div>
                      {brandingId === option.id && (
                        <Check className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <button
                  onClick={handleCopyUrl}
                  className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Preview URL'}
                </button>
              </div>
            </div>

            {/* Environment Variable */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Set as Default</h2>
              <p className="text-sm text-slate-600 mb-3">
                Add this to your <code className="bg-slate-100 px-1 rounded">.env</code> file:
              </p>
              <div className="bg-slate-900 rounded-lg p-4">
                <code className="text-green-400 text-sm">
                  VITE_BRANDING={brandingId}
                </code>
              </div>
            </div>
          </div>

          {/* Branding Preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Logo & Name */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Brand Identity
              </h2>
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 bg-gradient-to-br from-${branding.colors.gradient.from} to-${branding.colors.gradient.to} rounded-xl flex items-center justify-center`}>
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{branding.name}</h3>
                  <p className="text-slate-500">{branding.tagline}</p>
                </div>
              </div>
            </div>

            {/* Color Palette */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Color Palette
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className={`h-20 bg-${branding.colors.primary} rounded-lg mb-2`} />
                  <p className="text-sm font-medium text-slate-700">Primary</p>
                  <p className="text-xs text-slate-500">{branding.colors.primary}</p>
                </div>
                <div>
                  <div className={`h-20 bg-${branding.colors.secondary} rounded-lg mb-2`} />
                  <p className="text-sm font-medium text-slate-700">Secondary</p>
                  <p className="text-xs text-slate-500">{branding.colors.secondary}</p>
                </div>
                <div>
                  <div className={`h-20 bg-${branding.colors.accent} rounded-lg mb-2`} />
                  <p className="text-sm font-medium text-slate-700">Accent</p>
                  <p className="text-xs text-slate-500">{branding.colors.accent}</p>
                </div>
                <div>
                  <div className={`h-20 bg-gradient-to-br from-${branding.colors.gradient.from} to-${branding.colors.gradient.to} rounded-lg mb-2`} />
                  <p className="text-sm font-medium text-slate-700">Gradient</p>
                  <p className="text-xs text-slate-500">{branding.colors.gradient.from} → {branding.colors.gradient.to}</p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Contact Information</h2>
              <div className="space-y-3">
                {branding.contact.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-700">{branding.contact.email}</span>
                  </div>
                )}
                {branding.contact.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-700">{branding.contact.phone}</span>
                  </div>
                )}
                {branding.contact.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-700">{branding.contact.website}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Feature Flags */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Feature Flags</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-700">Pricing Page</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${branding.features.showPricing ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {branding.features.showPricing ? 'Visible' : 'Hidden'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-700">About Page</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${branding.features.showAbout ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {branding.features.showAbout ? 'Visible' : 'Hidden'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-700">Language Switcher</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${branding.features.showLanguageSwitcher ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {branding.features.showLanguageSwitcher ? 'Visible' : 'Hidden'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-700">Powered By Footer</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${branding.footer.showPoweredBy ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {branding.footer.showPoweredBy ? 'Visible' : 'Hidden'}
                  </span>
                </div>
              </div>
            </div>

            {/* Partner Info */}
            {branding.partner && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Partner Information</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Partner ID</p>
                    <p className="font-mono text-slate-800">{branding.partner.id}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Partner Name</p>
                    <p className="text-slate-800">{branding.partner.name}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Affiliate Code</p>
                    <p className="font-mono text-slate-800">{branding.partner.affiliateCode || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview Navigation */}
        <div className="mt-8 flex gap-4">
          <a
            href="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Homepage
          </a>
          <a
            href="/register"
            className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
          >
            View Registration
          </a>
        </div>
      </div>
    </div>
  );
}
