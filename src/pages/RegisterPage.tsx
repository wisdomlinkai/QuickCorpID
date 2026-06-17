import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Building2, CreditCard, FileText, User, Briefcase, Upload, Loader2, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Lock, ShieldCheck } from 'lucide-react';

interface FormData {
  brNumber: string;
  companyNameEn: string;
  companyNameZh: string;
  businessType: string;
  idType: string;
  idNumber: string;
  role: string;
  agreeTerms: boolean;
  authDeclaration: boolean;
}

const RegisterPage = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [refNumber, setRefNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    brNumber: '', companyNameEn: '', companyNameZh: '', businessType: '',
    idType: language === 'zh' ? '香港身份證' : 'Hong Kong ID Card', idNumber: '',
    role: '', agreeTerms: false, authDeclaration: false,
  });

  const steps = [
    { num: 1, icon: Building2, label: t.register.steps.step1 },
    { num: 2, icon: CreditCard, label: t.register.steps.step2 },
    { num: 3, icon: User, label: t.register.steps.step3 },
    { num: 4, icon: FileText, label: t.register.steps.step4 },
  ];

  const validate = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!formData.brNumber) e.brNumber = t.errors.required;
      else if (!/^\d{8}$/.test(formData.brNumber)) e.brNumber = t.errors.invalidBr;
      if (!formData.companyNameEn && !formData.companyNameZh) e.companyName = t.errors.required;
      if (!formData.businessType) e.businessType = t.errors.required;
    }
    if (s === 2 && !formData.idNumber) e.idNumber = t.errors.required;
    if (s === 3) {
      if (!formData.role) e.role = t.errors.required;
      if (!formData.authDeclaration) e.authDeclaration = t.errors.required;
      if (!formData.agreeTerms) e.agreeTerms = t.errors.required;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate(3)) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 2500));
    setRefNumber(`CORP-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`);
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">{t.register.success.title}</h1>
            <p className="text-lg text-slate-600 mb-8">{t.register.success.subtitle}</p>
            <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-6 mb-8">
              <p className="text-sm text-slate-600 mb-2">{t.register.success.refNumber}</p>
              <p className="text-2xl font-mono font-bold text-blue-600 mb-2">{refNumber}</p>
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <Lock className="w-4 h-4" />
                <span>{t.register.success.refLabel}</span>
              </div>
            </div>
            <div className="text-left bg-slate-50 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-slate-800 mb-4">{t.register.success.nextSteps}</h3>
              <ul className="space-y-3">
                {t.register.success.nextStepsItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-blue-600">{i + 1}</span>
                    </div>
                    <span className="text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button onClick={() => navigate('/dashboard')} className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all">
              {t.register.success.goToDashboard}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{t.register.title}</h1>
          <p className="text-slate-600">{t.register.subtitle}</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {steps.map((s) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isCompleted = step > s.num;
              return (
                <div key={s.num} className="flex-1 flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-all ${isActive ? 'bg-gradient-to-br from-blue-600 to-teal-500 shadow-lg scale-110' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    {isCompleted ? <CheckCircle2 className="w-6 h-6 text-white" /> : <Icon className={`w-6 h-6 ${isActive ? 'text-white' : ''}`} />}
                  </div>
                  <span className={`text-xs font-medium text-center hidden md:block ${isActive ? 'text-blue-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>{s.label}</span>
                </div>
              );
            })}
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 md:hidden">
            <div className="bg-gradient-to-r from-blue-600 to-teal-500 h-2 rounded-full transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-teal-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">{t.register.step1.title}</h2>
                <p className="text-slate-500 text-sm">{t.register.step1.subtitle}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.register.step1.brNumber} <span className="text-red-500">*</span></label>
                <input type="text" value={formData.brNumber} onChange={(e) => setFormData({ ...formData, brNumber: e.target.value.replace(/\D/g, '').slice(0, 8) })} placeholder={t.register.step1.brNumberPlaceholder} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.brNumber ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} maxLength={8} />
                <p className="mt-1 text-xs text-slate-500">{t.register.step1.brNumberHint}</p>
                {errors.brNumber && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.brNumber}</p>}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t.register.step1.companyNameEn}</label>
                  <input type="text" value={formData.companyNameEn} onChange={(e) => setFormData({ ...formData, companyNameEn: e.target.value })} placeholder={t.register.step1.companyNameEn} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t.register.step1.companyNameZh}</label>
                  <input type="text" value={formData.companyNameZh} onChange={(e) => setFormData({ ...formData, companyNameZh: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              {errors.companyName && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.companyName}</p>}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.register.step1.businessType} <span className="text-red-500">*</span></label>
                <select value={formData.businessType} onChange={(e) => setFormData({ ...formData, businessType: e.target.value })} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${errors.businessType ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
                  <option value="">{t.register.step1.businessTypePlaceholder}</option>
                  {t.register.step1.businessTypes.map((type, i) => <option key={i} value={type}>{type}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-teal-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">{t.register.step2.title}</h2>
                <p className="text-slate-500 text-sm">{t.register.step2.subtitle}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.register.step2.idType}</label>
                <div className="grid grid-cols-2 gap-4">
                  {t.register.step2.idTypes.map((type, i) => (
                    <button key={i} type="button" onClick={() => setFormData({ ...formData, idType: type, idNumber: '' })} className={`p-4 border rounded-xl text-left transition-all ${formData.idType === type ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500' : 'border-slate-200 hover:border-blue-300'}`}>
                      <span className="font-medium text-slate-800">{type}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.register.step2.idNumber} <span className="text-red-500">*</span></label>
                <input type="text" value={formData.idNumber} onChange={(e) => setFormData({ ...formData, idNumber: e.target.value.toUpperCase() })} placeholder={t.register.step2.idNumberPlaceholder} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${errors.idNumber ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} />
                <p className="mt-1 text-xs text-slate-500">{t.register.step2.idNumberHint}</p>
                {errors.idNumber && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.idNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.register.step2.uploadDoc}</label>
                <p className="text-xs text-slate-500 mb-3">{t.register.step2.uploadDoc}</p>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400">
                  <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" />
                  <Upload className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                  <p className="text-slate-600 mb-1">{t.register.step2.dragDrop}</p>
                  <p className="text-xs text-slate-400">{t.register.step2.formats}</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">{t.register.step3.title}</h2>
                <p className="text-slate-500 text-sm">{t.register.step3.subtitle}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">{t.register.step3.role} <span className="text-red-500">*</span></label>
                <div className="space-y-3">
                  {t.register.step3.roles.map((role) => (
                    <button key={role.value} type="button" onClick={() => setFormData({ ...formData, role: role.value })} className={`w-full p-4 border rounded-xl text-left transition-all ${formData.role === role.value ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500' : 'border-slate-200 hover:border-blue-300'}`}>
                      <div className="font-medium text-slate-800">{role.label}</div>
                      <div className="text-sm text-slate-500">{role.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4 bg-slate-50 rounded-xl p-4">
                <h3 className="font-medium text-slate-800">{t.register.step3.authDeclaration}</h3>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={formData.authDeclaration} onChange={(e) => setFormData({ ...formData, authDeclaration: e.target.checked })} className="w-5 h-5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-slate-600">{t.register.step3.authText}</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={formData.agreeTerms} onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })} className="w-5 h-5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-slate-600">{t.register.step3.agreeTerms}</span>
                </label>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">{t.register.step4.title}</h2>
                <p className="text-slate-500 text-sm">{t.register.step4.subtitle}</p>
              </div>
              {['businessDetails', 'identityDetails', 'roleDetails'].map((section, i) => (
                <div key={section} className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-slate-800">{t.register.step4[section as keyof typeof t.register.step4]}</h3>
                    <button onClick={() => setStep(i + 1)} className="text-sm text-blue-600 hover:underline">{t.common.edit}</button>
                  </div>
                  <div className="space-y-2 text-sm">
                    {i === 0 && (
                      <>
                        <div className="flex justify-between"><span className="text-slate-500">{t.register.step1.brNumber}:</span><span className="font-medium text-slate-800">{formData.brNumber}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">{t.register.step1.companyName}:</span><span className="font-medium text-slate-800">{formData.companyNameEn || formData.companyNameZh}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">{t.register.step1.businessType}:</span><span className="font-medium text-slate-800">{formData.businessType}</span></div>
                      </>
                    )}
                    {i === 1 && (
                      <>
                        <div className="flex justify-between"><span className="text-slate-500">{t.register.step2.idType}:</span><span className="font-medium text-slate-800">{formData.idType}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">{t.register.step2.idNumber}:</span><span className="font-medium text-slate-800 font-mono">{formData.idNumber}</span></div>
                      </>
                    )}
                    {i === 2 && (
                      <div className="flex justify-between"><span className="text-slate-500">{t.register.step3.role}:</span><span className="font-medium text-slate-800">{t.register.step3.roles.find(r => r.value === formData.role)?.label}</span></div>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4">
                <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">{language === 'zh' ? '您的數據已加密並安全傳輸。' : 'Your data is encrypted and securely transmitted.'}</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
            <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${step === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}>
              <ChevronLeft className="w-5 h-5" />
              {t.register.buttons.back}
            </button>
            {step < 4 ? (
              <button onClick={() => { if (validate(step)) setStep(step + 1); }} className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg">
                {t.register.buttons.next}
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg disabled:opacity-70">
                {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" />{t.register.step4.processing}</> : <><CheckCircle2 className="w-5 h-5" />{t.register.step4.submitBtn}</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
