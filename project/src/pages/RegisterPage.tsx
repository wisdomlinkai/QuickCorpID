import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import {
  Building2, FileText, UserCheck, ClipboardCheck,
  ArrowLeft, ArrowRight, Upload, Check, AlertCircle,
  ShieldCheck, Sparkles, Loader2
} from 'lucide-react';

type FormData = {
  brNumber: string;
  companyNameEn: string;
  companyNameZh: string;
  businessType: string;
  email: string;
  phone: string;
  idType: string;
  idNumber: string;
  fileName: string | null;
  role: string;
  authDeclaration: boolean;
  termsAgreed: boolean;
};

const RegisterPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ ref: string } | null>(null);

  const [form, setForm] = useState<FormData>({
    brNumber: '', companyNameEn: '', companyNameZh: '', businessType: '', email: '', phone: '',
    idType: '', idNumber: '', fileName: null,
    role: '', authDeclaration: false, termsAgreed: false,
  });

  const update = (field: keyof FormData, value: string | boolean | null) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const stepIcons = [Building2, FileText, UserCheck, ClipboardCheck];
  const stepLabels = [t.register.steps.step1, t.register.steps.step2, t.register.steps.step3, t.register.steps.step4];

  const canProceed = (): boolean => {
    if (step === 1) return form.brNumber.length >= 8 && form.companyNameEn && form.businessType && form.email;
    if (step === 2) return form.idType && form.idNumber && form.fileName;
    if (step === 3) return form.role && form.authDeclaration && form.termsAgreed;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const { data: orgData, error: orgError } = await supabase
        .from('organisations')
        .insert({
          name_en: form.companyNameEn,
          name_zh: form.companyNameZh || null,
          br_number: form.brNumber,
          business_type: form.businessType,
          created_by: user?.id,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      await supabase.from('organisation_members').insert({
        organisation_id: orgData.id,
        user_id: user?.id,
        role: 'owner',
      });

      const refNumber = `CORP-${Date.now().toString().slice(-8)}`;
      const { error: regError } = await supabase.from('registrations').insert({
        organisation_id: orgData.id,
        status: 'pending',
        reference_number: refNumber,
        id_type: form.idType,
        id_number: form.idNumber,
        role: form.role,
        auth_declaration: form.authDeclaration,
        terms_agreed: form.termsAgreed,
        submitted_at: new Date().toISOString(),
      });

      if (regError) throw regError;

      await supabase.from('activities').insert({
        user_id: user?.id,
        organisation_id: orgData.id,
        action: 'registration_submitted',
        description: `CorpID registration submitted for ${form.companyNameEn}`,
      });

      setSuccess({ ref: refNumber });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.submissionFailed);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4 py-32">
        <div className="max-w-lg w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">{t.register.success.title}</h1>
          <p className="text-slate-600 mb-8">{t.register.success.subtitle}</p>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 mb-8">
            <p className="text-sm text-slate-500 mb-1">{t.register.success.refLabel}</p>
            <p className="text-2xl font-bold text-blue-600">{success.ref}</p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-6 text-left mb-8">
            <h3 className="font-semibold text-slate-800 mb-3">{t.register.success.nextSteps}</h3>
            <ul className="space-y-2">
              {t.register.success.nextStepsItems.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <Check className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                  {step}
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            {t.register.success.goToDashboard}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-32 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">{t.register.title}</h1>
          <p className="text-slate-500">{t.register.subtitle}</p>
        </div>

        {/* Progress indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {stepIcons.map((Icon, i) => {
              const stepNum = i + 1;
              const isComplete = step > stepNum;
              const isCurrent = step === stepNum;
              return (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isComplete ? 'bg-teal-500 text-white' :
                      isCurrent ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-100' :
                      'bg-slate-100 text-slate-400'
                    }`}>
                      {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className={`text-xs mt-2 font-medium hidden sm:block ${isCurrent ? 'text-blue-600' : 'text-slate-400'}`}>
                      {stepLabels[i]}
                    </span>
                  </div>
                  {i < stepIcons.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 transition-all ${step > stepNum ? 'bg-teal-500' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          {/* Step 1: Business Information */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{t.register.step1.title}</h2>
                <p className="text-sm text-slate-500 mt-1">{t.register.step1.subtitle}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.register.step1.brNumber}</label>
                  <input
                    type="text"
                    value={form.brNumber}
                    onChange={(e) => update('brNumber', e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder={t.register.step1.brNumberPlaceholder}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                  <p className="text-xs text-slate-400 mt-1">{t.register.step1.brNumberHint}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.register.step1.businessType}</label>
                  <select
                    value={form.businessType}
                    onChange={(e) => update('businessType', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
                  >
                    <option value="">{t.register.step1.businessTypePlaceholder}</option>
                    {t.register.step1.businessTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.register.step1.companyNameEn}</label>
                  <input
                    type="text"
                    value={form.companyNameEn}
                    onChange={(e) => update('companyNameEn', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.register.step1.companyNameZh}</label>
                  <input
                    type="text"
                    value={form.companyNameZh}
                    onChange={(e) => update('companyNameZh', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.register.step1.email}</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.register.step1.phone}</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Identity Verification */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{t.register.step2.title}</h2>
                <p className="text-sm text-slate-500 mt-1">{t.register.step2.subtitle}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.register.step2.idType}</label>
                  <select
                    value={form.idType}
                    onChange={(e) => update('idType', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
                  >
                    <option value="">--</option>
                    {t.register.step2.idTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.register.step2.idNumber}</label>
                  <input
                    type="text"
                    value={form.idNumber}
                    onChange={(e) => update('idNumber', e.target.value)}
                    placeholder={t.register.step2.idNumberPlaceholder}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                  <p className="text-xs text-slate-400 mt-1">{t.register.step2.idNumberHint}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.register.step2.uploadDoc}</label>
                <label className="block border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) update('fileName', file.name);
                    }}
                  />
                  {form.fileName ? (
                    <div className="flex items-center justify-center gap-2 text-teal-600">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">{form.fileName}</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600 font-medium">{t.register.step2.dragDrop}</p>
                      <p className="text-xs text-slate-400 mt-1">{t.register.step2.formats}</p>
                    </>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* Step 3: Role & Authorization */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{t.register.step3.title}</h2>
                <p className="text-sm text-slate-500 mt-1">{t.register.step3.subtitle}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">{t.register.step3.role}</label>
                <div className="space-y-3">
                  {t.register.step3.roles.map((role) => (
                    <label
                      key={role.value}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        form.role === role.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={form.role === role.value}
                        onChange={(e) => update('role', e.target.value)}
                        className="w-5 h-5 text-blue-600"
                      />
                      <div>
                        <p className="font-medium text-slate-900">{role.label}</p>
                        <p className="text-sm text-slate-500">{role.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.authDeclaration}
                    onChange={(e) => update('authDeclaration', e.target.checked)}
                    className="w-5 h-5 mt-0.5 text-blue-600 rounded"
                  />
                  <span className="text-sm text-slate-700">{t.register.step3.authText}</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.termsAgreed}
                    onChange={(e) => update('termsAgreed', e.target.checked)}
                    className="w-5 h-5 mt-0.5 text-blue-600 rounded"
                  />
                  <span className="text-sm text-slate-700">{t.register.step3.agreeTerms}</span>
                </label>
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{t.register.step4.title}</h2>
                <p className="text-sm text-slate-500 mt-1">{t.register.step4.subtitle}</p>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-slate-50 rounded-xl">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">{t.register.step4.businessDetails}</h3>
                  <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div><dt className="text-slate-500">{t.register.step1.brNumber}</dt><dd className="text-slate-900 font-medium">{form.brNumber}</dd></div>
                    <div><dt className="text-slate-500">{t.register.step1.businessType}</dt><dd className="text-slate-900 font-medium">{form.businessType}</dd></div>
                    <div><dt className="text-slate-500">{t.register.step1.companyNameEn}</dt><dd className="text-slate-900 font-medium">{form.companyNameEn}</dd></div>
                    <div><dt className="text-slate-500">{t.register.step1.companyNameZh}</dt><dd className="text-slate-900 font-medium">{form.companyNameZh || '-'}</dd></div>
                    <div><dt className="text-slate-500">{t.register.step1.email}</dt><dd className="text-slate-900 font-medium">{form.email}</dd></div>
                    <div><dt className="text-slate-500">{t.register.step1.phone}</dt><dd className="text-slate-900 font-medium">{form.phone || '-'}</dd></div>
                  </dl>
                </div>

                <div className="p-5 bg-slate-50 rounded-xl">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">{t.register.step4.identityDetails}</h3>
                  <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div><dt className="text-slate-500">{t.register.step2.idType}</dt><dd className="text-slate-900 font-medium">{form.idType}</dd></div>
                    <div><dt className="text-slate-500">{t.register.step2.idNumber}</dt><dd className="text-slate-900 font-medium">{form.idNumber}</dd></div>
                    <div><dt className="text-slate-500">{t.register.step2.uploadDoc}</dt><dd className="text-slate-900 font-medium">{form.fileName}</dd></div>
                  </dl>
                </div>

                <div className="p-5 bg-slate-50 rounded-xl">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">{t.register.step4.roleDetails}</h3>
                  <dl className="text-sm">
                    <div><dt className="text-slate-500">{t.register.step3.role}</dt><dd className="text-slate-900 font-medium">
                      {t.register.step3.roles.find(r => r.value === form.role)?.label}
                    </dd></div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
              className="inline-flex items-center gap-2 px-5 py-3 text-slate-600 font-medium rounded-xl hover:bg-slate-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.register.buttons.back}
            </button>

            {step < 4 ? (
              <button
                onClick={() => setStep(s => Math.min(4, s + 1))}
                disabled={!canProceed()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.register.buttons.next}
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> {t.register.step4.processing}</> : <><Sparkles className="w-4 h-4" /> {t.register.step4.submitBtn}</>}
              </button>
            )}
          </div>
        </div>

        {!user && (
          <div className="mt-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              {t.nav.login === '登入' ? '請先登入以提交註冊申請。' : 'Please sign in first to submit your registration.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
