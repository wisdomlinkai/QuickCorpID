import { useLanguage } from '../i18n/LanguageContext';
import { Target, FileBadge, CheckCircle2, Mail, Phone, MapPin, Building2 } from 'lucide-react';

const AboutPage = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-20">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">{t.about.title}</h1>
        <p className="text-xl text-slate-600">{t.about.subtitle}</p>
      </section>

      {/* Mission */}
      <section className="bg-gradient-to-br from-slate-50 to-blue-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Target className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">{t.about.mission.title}</h2>
              <p className="text-lg text-slate-600 leading-relaxed">{t.about.mission.desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* What is CorpID */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <FileBadge className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">{t.about.whatIsCorpId.title}</h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">{t.about.whatIsCorpId.desc}</p>
              <ul className="space-y-3">
                {t.about.whatIsCorpId.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Built for HK */}
      <section className="bg-slate-900 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 mb-6">
            <Building2 className="w-8 h-8 text-teal-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">{t.about.team.title}</h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">{t.about.team.desc}</p>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">{t.about.contact.title}</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <a href="mailto:support@ibizsmart.hk" className="group p-8 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm text-slate-500 mb-1">{t.footer.contact}</p>
              <p className="text-slate-900 font-medium">support@ibizsmart.hk</p>
            </a>
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-teal-50 flex items-center justify-center mb-4">
                <Phone className="w-6 h-6 text-teal-600" />
              </div>
              <p className="text-sm text-slate-500 mb-1">{t.about.contact.phone ? 'Phone' : 'Phone'}</p>
              <p className="text-slate-900 font-medium">{t.about.contact.phone}</p>
            </div>
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-slate-600" />
              </div>
              <p className="text-sm text-slate-500 mb-1">Location</p>
              <p className="text-slate-900 font-medium">Hong Kong</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
