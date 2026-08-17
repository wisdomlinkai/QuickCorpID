import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Check, Sparkles, Building2, Zap, Shield } from 'lucide-react';

const PricingPage = () => {
  const { t } = useLanguage();

  const tiers = [
    {
      key: 'free',
      data: t.pricing.free,
      highlighted: false,
      icon: Zap,
    },
    {
      key: 'premium',
      data: t.pricing.premium,
      highlighted: true,
      icon: Sparkles,
    },
    {
      key: 'enterprise',
      data: t.pricing.enterprise,
      highlighted: false,
      icon: Building2,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">{t.pricing.title}</h1>
          <p className="text-xl text-slate-600">{t.pricing.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map(({ key, data, highlighted, icon: Icon }) => (
            <div
              key={key}
              className={`relative bg-white rounded-2xl p-8 flex flex-col transition-all ${
                highlighted
                  ? 'border-2 border-blue-500 shadow-2xl md:-translate-y-4'
                  : 'border border-slate-200 shadow-lg hover:shadow-xl'
              }`}
            >
              {highlighted && data.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-teal-500 text-white text-sm font-semibold rounded-full shadow-lg">
                  {data.badge}
                </div>
              )}

              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
                highlighted ? 'bg-gradient-to-br from-blue-600 to-teal-500' : 'bg-blue-50'
              }`}>
                <Icon className={`w-6 h-6 ${highlighted ? 'text-white' : 'text-blue-600'}`} />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-1">{data.name}</h3>
              <p className="text-sm text-slate-500 mb-6">{data.desc}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">{data.price}</span>
                <span className="text-slate-500 ml-1">{data.period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {data.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      highlighted ? 'bg-blue-600' : 'bg-emerald-100'
                    }`}>
                      <Check className={`w-3 h-3 ${highlighted ? 'text-white' : 'text-emerald-600'}`} />
                    </div>
                    <span className="text-sm text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={key === 'free' ? '/register' : key === 'enterprise' ? '/about' : '/register'}
                className={`w-full py-3.5 rounded-xl font-semibold text-center transition-all ${
                  highlighted
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                {data.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-16 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
            <Shield className="w-4 h-4" />
            <span>{t.pricing.comingSoon}</span>
          </div>
          <p className="text-slate-500 mt-3">{t.pricing.comingSoonDesc}</p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
