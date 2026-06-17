import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Check, Sparkles, ArrowRight, X, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const PricingPage = () => {
  const { t, language } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Feature comparison data
  const allFeatures = [
    { key: 'registration', name: language === 'zh' ? 'CorpID 註冊' : 'CorpID Registration', free: true, premium: true, enterprise: true },
    { key: 'dashboard', name: language === 'zh' ? '基本儀表板' : 'Basic Dashboard', free: true, premium: true, enterprise: true },
    { key: 'signing', name: language === 'zh' ? '數碼簽署' : 'Digital Signing', free: language === 'zh' ? '5次/月' : '5/month', premium: language === 'zh' ? '無限' : 'Unlimited', enterprise: language === 'zh' ? '無限' : 'Unlimited' },
    { key: 'entities', name: language === 'zh' ? '企業實體' : 'Business Entities', free: '1', premium: language === 'zh' ? '最多5個' : 'Up to 5', enterprise: language === 'zh' ? '無限' : 'Unlimited' },
    { key: 'api', name: language === 'zh' ? 'API 存取' : 'API Access', free: false, premium: true, enterprise: true },
    { key: 'priority', name: language === 'zh' ? '優先處理' : 'Priority Processing', free: false, premium: true, enterprise: true },
    { key: 'support', name: language === 'zh' ? '客戶支援' : 'Customer Support', free: language === 'zh' ? '電郵' : 'Email', premium: language === 'zh' ? '優先' : 'Priority', enterprise: language === 'zh' ? '專屬' : 'Dedicated' },
    { key: 'sla', name: language === 'zh' ? 'SLA 保證' : 'SLA Guarantee', free: false, premium: false, enterprise: true },
    { key: 'integration', name: language === 'zh' ? '自訂整合' : 'Custom Integration', free: false, premium: false, enterprise: true },
    { key: 'manager', name: language === 'zh' ? '專屬客戶經理' : 'Dedicated Manager', free: false, premium: false, enterprise: true },
  ];

  // FAQ data
  const faqItems = [
    {
      question: language === 'zh' ? '免費版有什麼限制？' : 'What are the limitations of the Free plan?',
      answer: language === 'zh' 
        ? '免費版包含完整的 CorpID 註冊功能、基本儀表板、每月5次數碼簽署，以及電郵支援。適合單一企業實體使用。'
        : 'The Free plan includes full CorpID registration, basic dashboard, 5 digital signatures per month, and email support. Perfect for single business entities.',
    },
    {
      question: language === 'zh' ? '如何升級到付費方案？' : 'How do I upgrade to a paid plan?',
      answer: language === 'zh'
        ? '您可以在儀表板中點擊「升級」按鈕，選擇適合的方案並完成付款。我們支援信用卡、銀行轉賬等多種付款方式。'
        : 'You can upgrade by clicking the "Upgrade" button in your dashboard, selecting your preferred plan, and completing payment. We accept credit cards and bank transfers.',
    },
    {
      question: language === 'zh' ? '可以隨時取消訂閱嗎？' : 'Can I cancel my subscription anytime?',
      answer: language === 'zh'
        ? '是的，您可以隨時取消訂閱。取消後，您的方案將在當前計費週期結束時失效，不會收取額外費用。'
        : 'Yes, you can cancel anytime. Your plan will remain active until the end of your current billing period with no additional charges.',
    },
    {
      question: language === 'zh' ? '年付方案有折扣嗎？' : 'Is there a discount for annual billing?',
      answer: language === 'zh'
        ? '是的！選擇年付方案可享2個月免費，相當於83折優惠。年付方案還享有優先客戶支援服務。'
        : 'Yes! Annual billing gives you 2 months free (17% discount). Annual subscribers also get priority customer support.',
    },
    {
      question: language === 'zh' ? '企業方案如何收費？' : 'How is the Enterprise plan priced?',
      answer: language === 'zh'
        ? '企業方案根據您的具體需求定制，包括企業實體數量、API調用量、整合需求等。請聯繫我們的銷售團隊獲取報價。'
        : 'Enterprise pricing is customized based on your needs including number of entities, API usage, and integration requirements. Contact our sales team for a quote.',
    },
    {
      question: language === 'zh' ? 'CorpID 註冊需要多長時間？' : 'How long does CorpID registration take?',
      answer: language === 'zh'
        ? '透過我們的平台提交申請只需5分鐘。官方審核通常需要2-3個工作天。付費方案用戶可享優先處理服務。'
        : 'Registration takes just 5 minutes through our platform. Official processing typically takes 2-3 business days. Paid plan users get priority processing.',
    },
  ];

  const plans = [
    { ...t.pricing.free, highlight: false, href: '/register', badge: '' },
    { ...t.pricing.premium, highlight: true, href: null },
    { ...t.pricing.enterprise, highlight: false, href: null, badge: '' },
  ];

  // Calculate annual price (2 months free)
  const getAnnualPrice = (monthlyPrice: string) => {
    const price = parseInt(monthlyPrice.replace(/\D/g, ''));
    if (isNaN(price)) return monthlyPrice;
    const annualPrice = price * 10; // 12 months - 2 free = 10 months
    return `$${annualPrice}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{t.pricing.title}</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">{t.pricing.subtitle}</p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${billingPeriod === 'monthly' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {language === 'zh' ? '按月付費' : 'Monthly'}
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${billingPeriod === 'annual' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {language === 'zh' ? '按年付費' : 'Annual'}
            <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">
              {language === 'zh' ? '省17%' : 'Save 17%'}
            </span>
          </button>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-2xl p-6 mb-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-800">{t.pricing.comingSoon}</span>
          </div>
          <p className="text-slate-600 text-sm">{t.pricing.comingSoonDesc}</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {plans.map((plan, index) => {
            const isPremium = plan.highlight;
            const displayPrice = billingPeriod === 'annual' && isPremium 
              ? getAnnualPrice(plan.price) 
              : plan.price;
            const displayPeriod = billingPeriod === 'annual' && isPremium 
              ? (language === 'zh' ? '/年' : '/year') 
              : plan.period;
            
            return (
              <div key={index} className={`relative bg-white rounded-2xl shadow-sm border ${plan.highlight ? 'border-blue-500 ring-2 ring-blue-500' : 'border-slate-200'} overflow-hidden flex flex-col transition-all hover:shadow-lg`}>
                {plan.badge && <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-teal-500 text-white text-xs font-semibold px-4 py-1 rounded-bl-lg">{plan.badge}</div>}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">{plan.name}</h3>
                  <p className="text-sm text-slate-500 mb-4">{plan.desc}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-slate-900">{displayPrice}</span>
                    <span className="text-slate-500 text-sm">{displayPeriod}</span>
                    {billingPeriod === 'annual' && isPremium && (
                      <p className="text-xs text-emerald-600 mt-1">{language === 'zh' ? '2個月免費！' : '2 months free!'}</p>
                    )}
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
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
            {language === 'zh' ? '功能比較' : 'Feature Comparison'}
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-4 font-semibold text-slate-800">{language === 'zh' ? '功能' : 'Feature'}</th>
                    <th className="text-center px-6 py-4 font-semibold text-slate-800">{t.pricing.free.name}</th>
                    <th className="text-center px-6 py-4 font-semibold text-blue-600 bg-blue-50">{t.pricing.premium.name}</th>
                    <th className="text-center px-6 py-4 font-semibold text-slate-800">{t.pricing.enterprise.name}</th>
                  </tr>
                </thead>
                <tbody>
                  {allFeatures.map((feature, i) => (
                    <tr key={feature.key} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-6 py-4 text-sm text-slate-700">{feature.name}</td>
                      <td className="text-center px-6 py-4">
                        {typeof feature.free === 'boolean' ? (
                          feature.free ? <Check className="w-5 h-5 text-emerald-500 mx-auto" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />
                        ) : (
                          <span className="text-sm text-slate-600">{feature.free}</span>
                        )}
                      </td>
                      <td className="text-center px-6 py-4 bg-blue-50/50">
                        {typeof feature.premium === 'boolean' ? (
                          feature.premium ? <Check className="w-5 h-5 text-emerald-500 mx-auto" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />
                        ) : (
                          <span className="text-sm text-slate-600">{feature.premium}</span>
                        )}
                      </td>
                      <td className="text-center px-6 py-4">
                        {typeof feature.enterprise === 'boolean' ? (
                          feature.enterprise ? <Check className="w-5 h-5 text-emerald-500 mx-auto" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />
                        ) : (
                          <span className="text-sm text-slate-600">{feature.enterprise}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8 flex items-center justify-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            {language === 'zh' ? '常見問題' : 'Frequently Asked Questions'}
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <span className="font-medium text-slate-800">{item.question}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-4 text-slate-600 text-sm leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-16 text-center">
          <p className="text-slate-600 mb-4">{language === 'zh' ? '有疑問？' : 'Questions?'}</p>
          <Link to="/about" className="text-blue-600 font-medium hover:underline inline-flex items-center gap-1">
            {t.footer.contact}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5 text-slate-400" />
            </button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-teal-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                {language === 'zh' ? '即將推出' : 'Coming Soon'}
              </h3>
              <p className="text-slate-600">{selectedPlan} - {t.pricing.comingSoonDesc}</p>
            </div>

            {/* Plan Comparison in Modal */}
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <h4 className="font-medium text-slate-800 mb-3 text-center">
                {language === 'zh' ? '方案比較' : 'Plan Comparison'}
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="font-medium text-slate-800">{language === 'zh' ? '按月' : 'Monthly'}</p>
                  <p className="text-slate-500">{selectedPlan === t.pricing.premium.name ? '$199/月' : language === 'zh' ? '自訂' : 'Custom'}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="font-medium text-blue-800">{language === 'zh' ? '按年' : 'Annual'}</p>
                  <p className="text-blue-600">{selectedPlan === t.pricing.premium.name ? '$1,990/年' : language === 'zh' ? '自訂' : 'Custom'}</p>
                  <p className="text-xs text-emerald-600">{language === 'zh' ? '省17%' : 'Save 17%'}</p>
                </div>
              </div>
            </div>

            {/* Contact Form for Enterprise */}
            {selectedPlan === t.pricing.enterprise.name && (
              <div className="mb-6">
                <input
                  type="email"
                  placeholder={language === 'zh' ? '您的電郵' : 'Your email'}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl mb-3 focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder={language === 'zh' ? '您的需求（選填）' : 'Your requirements (optional)'}
                  rows={2}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-teal-700 transition-all"
            >
              {language === 'zh' ? '關閉' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPage;
