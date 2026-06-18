import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../lib/AuthContext';
import { getUserApplications, type Application } from '../lib/aws';
import { ShieldCheck, Clock, AlertCircle, FileSignature, FileText, RefreshCw, Sparkles, ArrowRight, CheckCircle2, Bell, Building2, Calendar, Lock, X, FileCheck, Upload, Phone, Mail, LogIn } from 'lucide-react';

const REGISTRATION_DATA_KEY = 'corpid_registration_data';

interface ProfileCompletion {
  hasEmail: boolean;
  hasPhone: boolean;
  hasDocument: boolean;
  percentage: number;
}

const DashboardPage = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<'digitalSign' | 'viewDocs' | 'renewAuth' | null>(null);
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletion>({ hasEmail: false, hasPhone: false, hasDocument: false, percentage: 0 });

  // Fetch applications from Supabase
  const fetchApplications = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const userId = user.userId;
      const { data, error } = await getUserApplications(userId);
      
      if (error) {
        console.error('Error fetching applications:', error);
        // Fall back to localStorage data
        loadLocalData();
      } else if (data && data.length > 0) {
        setApplications(data);
        
        // Use the most recent application for display
        const latestApp = data[0];
        
        // Calculate profile completion
        const hasEmail = !!(profile?.email || latestApp.applicant_email);
        const hasPhone = !!(profile?.phone || latestApp.applicant_phone);
        const hasDocument = !!latestApp.document_url;
        const completed = [hasEmail, hasPhone, hasDocument].filter(Boolean).length;
        setProfileCompletion({ hasEmail, hasPhone, hasDocument, percentage: Math.round((completed / 3) * 100) });
      } else {
        // No applications in DB, try localStorage
        loadLocalData();
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      loadLocalData();
    } finally {
      setIsLoading(false);
    }
  }, [user, profile]);

  // Load data from localStorage as fallback
  const loadLocalData = useCallback(() => {
    const savedData = localStorage.getItem(REGISTRATION_DATA_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Convert localStorage format to Application format
        const localApp: Application = {
          id: 'local-' + Date.now(),
          user_id: user?.userId || '',
          br_number: parsed.brNumber || '',
          company_name_en: parsed.companyName,
          company_name_zh: undefined,
          business_type: parsed.businessType || '',
          id_type: 'hkid',
          id_number: '',
          applicant_role: 'owner',
          applicant_email: parsed.email || '',
          applicant_phone: parsed.phone || '',
          status: parsed.status || 'submitted',
          ref_number: parsed.refNumber,
          created_at: parsed.submittedDate || new Date().toISOString(),
          updated_at: parsed.submittedDate || new Date().toISOString(),
          submitted_at: parsed.submittedDate,
        };
        setApplications([localApp]);
        
        // Calculate profile completion
        const hasEmail = !!parsed.email;
        const hasPhone = !!parsed.phone;
        const hasDocument = false;
        const completed = [hasEmail, hasPhone, hasDocument].filter(Boolean).length;
        setProfileCompletion({ hasEmail, hasPhone, hasDocument, percentage: Math.round((completed / 3) * 100) });
      } catch {
        // Ignore parse errors
      }
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchApplications();
    }
  }, [authLoading, fetchApplications]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved': return { icon: ShieldCheck, bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200' };
      case 'rejected': return { icon: AlertCircle, bgColor: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200' };
      default: return { icon: Clock, bgColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200' };
    }
  };

  const actions = [
    { id: 'digitalSign', icon: FileSignature, title: t.dashboard.actions.digitalSign, desc: t.dashboard.actions.digitalSignDesc, color: 'from-blue-500 to-blue-600' },
    { id: 'viewDocs', icon: FileText, title: t.dashboard.actions.viewDocs, desc: t.dashboard.actions.viewDocsDesc, color: 'from-teal-500 to-teal-600' },
    { id: 'renewAuth', icon: RefreshCw, title: t.dashboard.actions.renewAuth, desc: t.dashboard.actions.renewAuthDesc, color: 'from-purple-500 to-purple-600' },
  ];

  // Get the primary application (most recent)
  const primaryApplication = applications[0];

  // Status timeline steps
  const timelineSteps = [
    { key: 'submitted', label: language === 'zh' ? '已提交' : 'Submitted', completed: !!primaryApplication?.submitted_at },
    { key: 'processing', label: language === 'zh' ? '處理中' : 'Processing', completed: primaryApplication?.status === 'approved' || primaryApplication?.status === 'rejected' || primaryApplication?.status === 'processing' },
    { key: 'approved', label: language === 'zh' ? '已核准' : 'Approved', completed: primaryApplication?.status === 'approved' },
  ];

  // Show login prompt if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-teal-100 rounded-xl flex items-center justify-center">
              <LogIn className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              {language === 'zh' ? '登入以查看儀表板' : 'Sign In to View Dashboard'}
            </h2>
            <p className="text-slate-600 mb-6">
              {language === 'zh' 
                ? '請登入您的帳戶以查看 CorpID 申請狀態和管理您的企業資料。'
                : 'Please sign in to your account to view your CorpID application status and manage your business profile.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/register?auth=login')}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                {language === 'zh' ? '登入' : 'Sign In'}
              </button>
              <button
                onClick={() => navigate('/register?auth=signup')}
                className="w-full px-6 py-3 border border-blue-600 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all"
              >
                {language === 'zh' ? '建立帳戶' : 'Create Account'}
              </button>
              <Link
                to="/"
                className="block text-center text-sm text-slate-500 hover:text-slate-700 transition-colors pt-2"
              >
                {language === 'zh' ? '返回首頁' : 'Back to Home'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  // Show empty state if no applications
  const showEmptyState = applications.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-blue-600 to-teal-500 rounded-2xl p-6 md:p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {t.dashboard.welcome}, {profile?.full_name || primaryApplication?.company_name_en || (language === 'zh' ? '用戶' : 'User')}
              </h1>
              <p className="text-blue-100">
                {showEmptyState 
                  ? (language === 'zh' ? '開始您的 CorpID 申請' : 'Start your CorpID application')
                  : t.dashboard.statusDesc[(primaryApplication?.status === 'submitted' ? 'pending' : primaryApplication?.status) as keyof typeof t.dashboard.statusDesc] || t.dashboard.statusDesc.pending}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <Lock className="w-5 h-5" />
              <span className="text-sm font-medium">{t.common.secure}</span>
            </div>
          </div>
        </div>

        {showEmptyState ? (
          /* Empty State - No Applications */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-teal-100 rounded-full flex items-center justify-center">
              <Building2 className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">
              {language === 'zh' ? '尚未有申請記錄' : 'No Applications Yet'}
            </h2>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              {language === 'zh' 
                ? '您還沒有提交任何 CorpID 申請。開始註冊您的企業以獲得香港 CorpID。'
                : "You haven't submitted any CorpID applications yet. Start registering your business to get your Hong Kong CorpID."}
            </p>
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-teal-700 transition-all"
            >
              {language === 'zh' ? '開始申請' : 'Start Application'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* Normal Dashboard with Applications */
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Status Card with Timeline */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-slate-800">{t.dashboard.corpIdStatus}</h2>
                  {primaryApplication && (
                    <span className={`px-3 py-1 ${getStatusConfig(primaryApplication.status).bgColor} ${getStatusConfig(primaryApplication.status).textColor} rounded-full text-sm font-medium flex items-center gap-1`}>
                      {(() => { const Icon = getStatusConfig(primaryApplication.status).icon; return <Icon className="w-4 h-4" />; })()}
                      {t.dashboard.status[(primaryApplication.status === 'submitted' ? 'pending' : primaryApplication.status) as keyof typeof t.dashboard.status] || primaryApplication.status}
                    </span>
                  )}
                </div>
                
                {primaryApplication && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-teal-100 rounded-xl flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{primaryApplication.company_name_en || primaryApplication.company_name_zh || 'Company'}</p>
                        <p className="text-sm text-slate-500">{primaryApplication.ref_number || 'Processing...'}</p>
                      </div>
                    </div>
                    
                    {/* Status Timeline */}
                    <div className="py-4">
                      <div className="flex items-center justify-between relative">
                        {/* Timeline line */}
                        <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200" />
                        <div className="absolute top-5 left-0 h-0.5 bg-emerald-500 transition-all duration-500" style={{ width: `${(timelineSteps.filter(s => s.completed).length - 1) * 50}%` }} />
                        
                        {timelineSteps.map((step, i) => (
                          <div key={step.key} className="relative flex flex-col items-center z-10">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${step.completed ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                              {step.completed ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-sm font-medium">{i + 1}</span>}
                            </div>
                            <span className={`mt-2 text-xs font-medium ${step.completed ? 'text-emerald-600' : 'text-slate-400'}`}>{step.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-sm text-slate-500 mb-1">{t.dashboard.refNumber}</p>
                        <p className="font-mono font-medium text-slate-800">{primaryApplication.ref_number || 'Processing...'}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-sm text-slate-500 mb-1">{t.dashboard.submittedOn}</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <p className="font-medium text-slate-800">
                            {primaryApplication.submitted_at 
                              ? new Date(primaryApplication.submitted_at).toLocaleDateString()
                              : (primaryApplication.created_at 
                                ? new Date(primaryApplication.created_at).toLocaleDateString()
                                : 'N/A')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Application History */}
              {applications.length > 1 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-slate-800 mb-4">
                    {language === 'zh' ? '申請記錄' : 'Application History'}
                  </h2>
                  <div className="space-y-3">
                    {applications.slice(1).map((app) => (
                      <div key={app.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-teal-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{app.company_name_en || app.company_name_zh}</p>
                            <p className="text-xs text-slate-500">{app.ref_number || 'Draft'}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusConfig(app.status).bgColor} ${getStatusConfig(app.status).textColor}`}>
                          {t.dashboard.status[(app.status === 'submitted' ? 'pending' : app.status) as keyof typeof t.dashboard.status] || app.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">{t.dashboard.quickActions}</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button key={action.id} onClick={() => setActiveModal(action.id as typeof activeModal)} className="group p-4 border border-slate-200 rounded-xl text-left hover:border-blue-300 hover:shadow-md transition-all">
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
              {/* Profile Completion */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">{language === 'zh' ? '個人檔案完成度' : 'Profile Completion'}</h2>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">{profileCompletion.percentage}%</span>
                    <span className="text-xs text-slate-400">{language === 'zh' ? '完成' : 'Complete'}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-teal-500 h-2 rounded-full transition-all duration-500" style={{ width: `${profileCompletion.percentage}%` }} />
                  </div>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <Mail className={`w-4 h-4 ${profileCompletion.hasEmail ? 'text-emerald-500' : 'text-slate-300'}`} />
                    <span className={profileCompletion.hasEmail ? 'text-slate-800' : 'text-slate-400'}>{language === 'zh' ? '電郵地址' : 'Email Address'}</span>
                    {profileCompletion.hasEmail && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Phone className={`w-4 h-4 ${profileCompletion.hasPhone ? 'text-emerald-500' : 'text-slate-300'}`} />
                    <span className={profileCompletion.hasPhone ? 'text-slate-800' : 'text-slate-400'}>{language === 'zh' ? '電話號碼' : 'Phone Number'}</span>
                    {profileCompletion.hasPhone && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Upload className={`w-4 h-4 ${profileCompletion.hasDocument ? 'text-emerald-500' : 'text-slate-300'}`} />
                    <span className={profileCompletion.hasDocument ? 'text-slate-800' : 'text-slate-400'}>{language === 'zh' ? '身份證明文件' : 'ID Document'}</span>
                    {profileCompletion.hasDocument && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
                  </li>
                </ul>
              </div>

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
                        <span className="text-xs font-medium text-blue-600">{i + 1}</span>
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
        )}

      </div>

      {/* Digital Sign Modal */}
      {activeModal === 'digitalSign' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-teal-100 rounded-full flex items-center justify-center">
                <FileSignature className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">{t.dashboard.actions.digitalSign}</h3>
              <p className="text-slate-600 mb-6">{language === 'zh' ? '數碼簽署功能即將推出。您將能夠使用 CorpID 安全地簽署文件。' : 'Digital signing feature coming soon. You will be able to securely sign documents using your CorpID.'}</p>
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-800">{language === 'zh' ? '預計推出時間：2024年第四季度' : 'Expected launch: Q4 2024'}</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-teal-700 transition-all">{t.common.close}</button>
            </div>
          </div>
        </div>
      )}

      {/* View Documents Modal */}
      {activeModal === 'viewDocs' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800">{t.dashboard.actions.viewDocs}</h3>
                  <p className="text-sm text-slate-500">{language === 'zh' ? '您的文件' : 'Your documents'}</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                {primaryApplication && (
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <FileCheck className="w-5 h-5 text-emerald-500" />
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{language === 'zh' ? '註冊申請表' : 'Registration Application'}</p>
                        <p className="text-xs text-slate-500">{primaryApplication.submitted_at ? new Date(primaryApplication.submitted_at).toLocaleDateString() : 'Draft'}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">{language === 'zh' ? '已提交' : 'Submitted'}</span>
                  </div>
                )}
                
                {primaryApplication?.document_url && (
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <FileCheck className="w-5 h-5 text-emerald-500" />
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{language === 'zh' ? '身份證明文件' : 'ID Document'}</p>
                        <p className="text-xs text-slate-500">{language === 'zh' ? '已上傳' : 'Uploaded'}</p>
                      </div>
                    </div>
                    <a href={primaryApplication.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm font-medium hover:underline">{language === 'zh' ? '查看' : 'View'}</a>
                  </div>
                )}
                
                <div className="flex items-center justify-between p-4 border-2 border-dashed border-slate-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-600 text-sm">{language === 'zh' ? '上傳新文件' : 'Upload new document'}</p>
                      <p className="text-xs text-slate-400">{language === 'zh' ? 'JPG, PNG, PDF (最大 5MB)' : 'JPG, PNG, PDF (max 5MB)'}</p>
                    </div>
                  </div>
                  <button className="text-blue-600 text-sm font-medium hover:underline">{language === 'zh' ? '選擇' : 'Select'}</button>
                </div>
              </div>
              
              <button onClick={() => setActiveModal(null)} className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-teal-700 transition-all">{t.common.close}</button>
            </div>
          </div>
        </div>
      )}

      {/* Renew Authorization Modal */}
      {activeModal === 'renewAuth' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">{t.dashboard.actions.renewAuth}</h3>
              <p className="text-slate-600 mb-6">{language === 'zh' ? '授權續期功能即將推出。您將能夠更新和管理您的授權代表。' : 'Authorization renewal feature coming soon. You will be able to update and manage your authorized representatives.'}</p>
              <div className="bg-purple-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-purple-800">{language === 'zh' ? '預計推出時間：2024年第四季度' : 'Expected launch: Q4 2024'}</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-teal-700 transition-all">{t.common.close}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
