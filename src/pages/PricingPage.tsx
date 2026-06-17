import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Check, Sparkles, Building2, ArrowRight, X } from 'lucide-react';

const PricingPage = () => {
  const { t, language } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');

  const plans = [
    { ...t.pricing.free, highlight: false, href: '/register' },
    { ...t.pricing.premium, highlight: true, href: null },
    { ...t.pricing.enterprise, highlight: false, href: null },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{t.pricing.title}</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">{t.pricing.subtitle}</p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-2xl p-6 mb-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-800">{t.pricing.comingSoon}</span>
          </div>
          <p className="text-slate-600 text-sm">{t.pricing.comingSoonDesc}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div key={index} className={`relative bg-white rounded-2xl shadow-sm border ${plan.highlight ? 'border-blue-500 ring-2 ring-blue-500' : 'border-slate-200'} overflow-hidden flex flex-col transition-all hover:shadow-lg`}>
              {plan.badge && <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-teal-500 text-white text-xs font-semibold px-4 py-1 rounded-bl-lg">{plan.badge}</div>}
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-semibold text-slate-800 mb-2">{plan.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-slate-500 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-6 flex-1">
                  {plan.features.map((f: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">{f}</span>
                    </li>
                  ))}
                </ul>
                {plan.href ? (
                  <Link to={plan.href} className={`w-full py-3 px-4 rounded-xl font-medium text-center transition-all ${plan.highlight ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white hover:from-blue-700 hover:to-teal-700' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}>{plan.cta}</Link>
                ) : (
                  <button onClick={() => { setSelectedPlan(plan.name); setShowModal(true); }} className={`w-full py-3 px-4 rounded-xl font-medium text-center transition-all ${plan.highlight ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white hover:from-blue-700 hover:to-teal-700' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}>{plan.cta}</button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-slate-600 mb-4">{language === 'zh' ? '有疑問？' : 'Questions?'}</p>
          <Link to="/about" className="text-blue-600 font-medium hover:underline inline-flex items-center gap-1">
            {t.footer.contact}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-teal-100 rounded-full flex items-center justify-center">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">{t.pricing.comingSoon}</h3>
              <p className="text-slate-600 mb-4">{selectedPlan} - {t.pricing.comingSoonDesc}</p>
              <button onClick={() => setShowModal(false)} className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-teal-700 transition-all">{t.common.close}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPage;
