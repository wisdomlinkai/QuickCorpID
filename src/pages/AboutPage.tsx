import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Shield, Target, CheckCircle2, Mail, Phone, Globe, Lock, ArrowRight, Zap, Users } from 'lucide-react';

const AboutPage = () => {
  const { t, language } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20 pb-12">
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-600 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{t.about.title}</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">{t.about.subtitle}</p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-8 h-8 text-blue-600" />
                <h2 className="text-2xl font-bold text-slate-900">{t.about.mission.title}</h2>
              </div>
              <p className="text-slate-600 leading-relaxed mb-6">{t.about.mission.desc}</p>
              <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-medium rounded-xl hover:from-blue-700 hover:to-teal-600 transition-all">
                {t.hero.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[{ icon: Zap, title: '5 min', desc: language === 'zh' ? '快速註冊' : 'Quick' }, { icon: Globe, title: 'EN/中文', desc: language === 'zh' ? '雙語' : 'Bilingual' }, { icon: Lock, title: '256-bit', desc: language === 'zh' ? '加密' : 'SSL' }, { icon: Users, title: '10K+', desc: language === 'zh' ? '企業' : 'Businesses' }].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="bg-slate-50 rounded-xl p-6 text-center">
                    <Icon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                    <p className="text-2xl font-bold text-slate-800">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">{t.about.whatIsCorpId.title}</h2>
            <p className="text-slate-600 max-w-3xl mx-auto">{t.about.whatIsCorpId.desc}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.about.whatIsCorpId.benefits.map((benefit, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-slate-700">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">{t.about.contact.title}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div><p className="text-sm text-slate-500">Email</p><p className="font-medium text-slate-800">{t.about.contact.email}</p></div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-6 h-6 text-teal-600" />
                </div>
                <div><p className="text-sm text-slate-500">Phone</p><p className="font-medium text-slate-800">{t.about.contact.phone}</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-blue-600 to-teal-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">{t.hero.title}</h2>
          <p className="text-blue-100 mb-8">{t.hero.subtitle}</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all">
            {t.hero.cta}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
