import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { ShieldCheck, Clock, AlertCircle, FileSignature, FileText, RefreshCw, Sparkles, ArrowRight, CheckCircle2, Bell, Building2, Calendar, Lock } from 'lucide-react';

interface Registration {
  refNumber: string;
  companyName: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedDate: string;
}

const DashboardPage = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setRegistration({
        refNumber: 'CORP-2024-ABC12',
        companyName: language === 'zh' ? '演示有限公司' : 'Demo Company Limited',
        status: 'pending',
        submittedDate: new Date().toISOString(),
      });
      setIsLoading(false);
    }, 800);
  }, [language]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved': return { icon: ShieldCheck, bgColor: 'bg-emerald-50', textColor: 'text-emerald-700' };
      case 'rejected': return { icon: AlertCircle, bgColor: 'bg-red-50', textColor: 'text-red-700' };
      default: return { icon: Clock, bgColor: 'bg-amber-50', textColor: 'text-amber-700' };
    }
  };

  const actions = [
    { icon: FileSignature, title: t.dashboard.actions.digitalSign, desc: t.dashboard.actions.digitalSignDesc, color: 'from-blue-500 to-blue-600' },
    { icon: FileText, title: t.dashboard.actions.viewDocs, desc: t.dashboard.actions.viewDocsDesc, color: 'from-teal-500 to-teal-600' },
    { icon: RefreshCw, title: t.dashboard.actions.renewAuth, desc: t.dashboard.actions.renewAuthDesc, color: 'from-purple-500 to-purple-600' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-blue-600 to-teal-500 rounded-2xl p-6 md:p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{t.dashboard.welcome}, {registration?.companyName}</h1>
              <p className="text-blue-100">{t.dashboard.statusDesc[registration?.status || 'pending']}</p>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <Lock className="w-5 h-5" />
              <span className="text-sm font-medium">{t.common.secure}</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-800">{t.dashboard.corpIdStatus}</h2>
                {registration && (
                  <span className={`px-3 py-1 ${getStatusConfig(registration.status).bgColor} ${getStatusConfig(registration.status).textColor} rounded-full text-sm font-medium flex items-center gap-1`}>
                    {(() => { const Icon = getStatusConfig(registration.status).icon; return <Icon className="w-4 h-4" />; })()}
                    {t.dashboard.status[registration.status]}
                  </span>
                )}
              </div>
              {registration && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-teal-100 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{registration.companyName}</p>
                      <p className="text-sm text-slate-500">{registration.refNumber}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-sm text-slate-500 mb-1">{t.dashboard.refNumber}</p>
                      <p className="font-mono font-medium text-slate-800">{registration.refNumber}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-sm text-slate-500 mb-1">{t.dashboard.submittedOn}</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <p className="font-medium text-slate-800">{new Date(registration.submittedDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">{t.dashboard.quickActions}</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {actions.map((action, i) => {
                  const Icon = action.icon;
                  return (
                    <button key={i} className="group p-4 border border-slate-200 rounded-xl text-left hover:border-blue-300 hover:shadow-md transition-all">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="font-medium text-slate-800 text-sm mb-1">{action.title}</p>
                      <p className="text-xs text-slate-500">{action.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Reminders */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-slate-800">{t.dashboard.reminders}</h2>
              </div>
              <ul className="space-y-3">
                {t.dashboard.remindersItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Upgrade */}
            <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl border border-blue-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-slate-800">{t.dashboard.upgradeBanner.title}</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">{t.dashboard.upgradeBanner.desc}</p>
              <Link to="/pricing" className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-teal-700 transition-all">
                {t.dashboard.upgradeBanner.btn}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <button onClick={() => navigate('/register')} className="w-full p-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors text-center">
              <Building2 className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">{language === 'zh' ? '註冊新企業' : 'Register Another Business'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
