import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Zap, Shield, Lock, Globe, Building2, User, UtensilsCrossed, Car, ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

const HomePage = () => {
  const { t } = useLanguage();
  const benefitIcons: Record<string, React.ComponentType<{ className?: string }>> = { zap: Zap, shield: Shield, lock: Lock, globe: Globe };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="absolute top-0 left-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <pattern id="bauhinia" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="4" fill="currentColor" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#bauhinia)" />
          </svg>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium mb-8">
              <ShieldCheck className="w-4 h-4" />
              <span>{t.trust.sandbox}</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">{t.hero.title}</h1>
            <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-2xl mx-auto">{t.hero.subtitle}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5">
                <Sparkles className="w-5 h-5" />
                {t.hero.cta}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/about" className="inline-flex items-center justify-center px-8 py-4 bg-white text-slate-700 font-semibold rounded-xl border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all">{t.hero.learnMore}</Link>
            </div>
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-slate-500">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /><span>{t.trust.sandbox}</span></div>
              <div className="flex items-center gap-2"><Lock className="w-5 h-5 text-blue-500" /><span>{t.trust.secure}</span></div>
              <div className="flex items-center gap-2"><Shield className="w-5 h-5 text-teal-500" /><span>{t.trust.supportedBy}</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{t.benefits.title}</h2>
            <p className="text-lg text-slate-600">{t.benefits.subtitle}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {t.benefits.items.map((item, index) => {
              const Icon = benefitIcons[item.icon] || Shield;
              return (
                <div key={index} className="group p-8 bg-white rounded-2xl border border-slate-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Target Users */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{t.targetUsers.title}</h2>
            <p className="text-lg text-slate-600">{t.targetUsers.subtitle}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[{ icon: Building2, item: t.targetUsers.items[0] }, { icon: User, item: t.targetUsers.items[1] }, { icon: UtensilsCrossed, item: t.targetUsers.items[2] }, { icon: Car, item: t.targetUsers.items[3] }].map(({ icon: Icon, item }, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 text-center">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-teal-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">{t.hero.title}</h2>
          <p className="text-xl text-blue-100 mb-8">{t.hero.subtitle}</p>
          <Link to="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5">
            {t.hero.cta}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
