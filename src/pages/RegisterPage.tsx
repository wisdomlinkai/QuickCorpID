/**
 * CorpID Registration Page - Simplified 3-Step Flow
 * 
 * Only collects the 7 required fields for CorpID:
 * 1. Business: BR Number + Business Type
 * 2. Identity: ID Type + ID Number
 * 3. Applicant: Role + Email + Declarations
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../lib/AuthContext';
import { createApplication, uploadDocument, submitApplicationDb, type ApplicationInsert } from '../lib/aws';
import { submitApplication as submitToCorpID, verifyBRNumber, validateHKIDFormat, type BusinessType, type ApplicantRole } from '../services/corpidApi';
import { Building2, Fingerprint, FileCheck, Loader2, CheckCircle2, AlertCircle, Lock, Mail, Share2, Copy, Printer, Check, Calendar, Clock, LogIn } from 'lucide-react';
import { generateQRCodeDataUrl } from '../utils/qrcode';

const FORM_STORAGE_KEY = 'corpid_registration_form';
const REGISTRATION_DATA_KEY = 'corpid_registration_data';
const DEBOUNCE_DELAY = 500;

const BUSINESS_TYPES: { value: BusinessType; labelEn: string; labelZh: string }[] = [
  { value: 'limited_company', labelEn: 'Limited Company', labelZh: '有限公司' },
  { value: 'sole_proprietorship', labelEn: 'Sole Proprietorship', labelZh: '獨資經營' },
  { value: 'partnership', labelEn: 'Partnership', labelZh: '合夥經營' },
  { value: 'branch_company', labelEn: 'Branch of Foreign Company', labelZh: '海外公司分公司' },
];

const APPLICANT_ROLES: { value: ApplicantRole; labelEn: string; labelZh: string; descEn: string; descZh: string }[] = [
  { value: 'director', labelEn: 'Company Director', labelZh: '公司董事', descEn: 'I am a director of the company', descZh: '我是公司董事' },
  { value: 'owner', labelEn: 'Business Owner', labelZh: '業務擁有人', descEn: 'I am the owner (sole proprietorship)', descZh: '我是業務擁有人（獨資）' },
  { value: 'partner', labelEn: 'Partner', labelZh: '合夥人', descEn: 'I am a partner in the business', descZh: '我是合夥人' },
  { value: 'authorized_representative', labelEn: 'Authorized Representative', labelZh: '獲授權代表', descEn: 'I am authorized to act on behalf', descZh: '我獲授權代表公司行事' },
];

interface UploadedFile { name: string; size: number; type: string; preview?: string; }
interface FormData {
  brNumber: string; companyNameEn: string; companyNameZh: string; businessType: BusinessType | '';
  idType: 'hkid' | 'passport'; idNumber: string; uploadedFile: UploadedFile | null;
  role: ApplicantRole | ''; email: string; agreeTerms: boolean; authDeclaration: boolean;
}

const validateEmail = (email: string): boolean => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateHKIDFormatOnly = (id: string): boolean => /^[A-Z]{1,2}\d{6}\(\d\)$/.test(id.toUpperCase());
const validatePassport = (p: string): boolean => /^[A-Z0-9]{5,12}$/.test(p.toUpperCase());

const RegisterPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [refNumber, setRefNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [checklist, setChecklist] = useState<boolean[]>([false, false, false]);
  const [brVerification, setBrVerification] = useState<{ loading: boolean; valid: boolean | null; company?: string }>({ loading: false, valid: null });
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const [formData, setFormData] = useState<FormData>(() => {
    const saved = localStorage.getItem(FORM_STORAGE_KEY);
    if (saved) try { return { ...JSON.parse(saved), uploadedFile: null }; } catch { /* ignore */ }
    return { brNumber: '', companyNameEn: '', companyNameZh: '', businessType: '', idType: 'hkid', idNumber: '', uploadedFile: null, role: '', email: '', agreeTerms: false, authDeclaration: false };
  });

  useEffect(() => { const { ...data } = formData; localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(data)); }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formData]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (formData.brNumber && /^\d{8}$/.test(formData.brNumber)) {
      setBrVerification({ loading: true, valid: null });
      debounceRef.current = setTimeout(async () => {
        try {
          const result = await verifyBRNumber(formData.brNumber);
          setBrVerification({ loading: false, valid: result.valid, company: result.valid ? (result.companyName || '') : undefined });
          if (result.valid && result.companyName && !formData.companyNameEn) setFormData(p => ({ ...p, companyNameEn: result.companyName || '' }));
        } catch { /* BR verification failed */ setBrVerification({ loading: false, valid: null }); }
      }, DEBOUNCE_DELAY);
    } else { setBrVerification({ loading: false, valid: null }); }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [formData.brNumber]);

  const validateStep = (stepNum: number): boolean => {
    const newErrors: Record<string, string> = {};
    const isZh = language === 'zh';
    if (stepNum === 1) {
      if (!formData.brNumber) newErrors.brNumber = isZh ? '商業登記號碼為必填' : 'Business Registration Number is required';
      else if (!/^\d{8}$/.test(formData.brNumber)) newErrors.brNumber = isZh ? '請輸入8位數字' : 'Please enter 8-digit BR number';
      if (!formData.businessType) newErrors.businessType = isZh ? '請選擇業務類型' : 'Please select business type';
    }
    if (stepNum === 2) {
      if (!formData.idNumber) newErrors.idNumber = isZh ? '證件號碼為必填' : 'ID number is required';
      else if (formData.idType === 'hkid') {
        if (!validateHKIDFormatOnly(formData.idNumber)) newErrors.idNumber = isZh ? '格式錯誤（例：A123456(7)）' : 'Invalid format (e.g., A123456(7))';
        else if (!validateHKIDFormat(formData.idNumber)) newErrors.idNumber = isZh ? '香港身份證號碼無效' : 'Invalid HKID number';
      } else if (!validatePassport(formData.idNumber)) newErrors.idNumber = isZh ? '請輸入有效的護照號碼' : 'Please enter valid passport number';
    }
    if (stepNum === 3) {
      if (!formData.role) newErrors.role = isZh ? '請選擇您的角色' : 'Please select your role';
      if (!formData.email) newErrors.email = isZh ? '電郵地址為必填' : 'Email is required';
      else if (!validateEmail(formData.email)) newErrors.email = isZh ? '請輸入有效的電郵' : 'Please enter valid email';
      if (!formData.authDeclaration) newErrors.authDeclaration = isZh ? '請確認授權' : 'Please confirm authorization';
      if (!formData.agreeTerms) newErrors.agreeTerms = isZh ? '請同意條款' : 'Please agree to terms';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => setTouched(p => ({ ...p, [field]: true }));
  const handleNext = () => { if (validateStep(step)) setStep(step + 1); };
  const handleBack = () => setStep(Math.max(1, step - 1));

  const handleFileUpload = (file: File) => {
    if (file.size > 5 * 1024 * 1024) { setErrors(p => ({ ...p, uploadedFile: language === 'zh' ? '檔案超過5MB' : 'File exceeds 5MB' })); return; }
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) { setErrors(p => ({ ...p, uploadedFile: language === 'zh' ? '無效檔案類型' : 'Invalid file type' })); return; }
    setErrors(p => ({ ...p, uploadedFile: '' }));
    const reader = new FileReader();
    reader.onload = (e) => setFormData(p => ({ ...p, uploadedFile: { name: file.name, size: file.size, type: file.type, preview: e.target?.result as string } }));
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]); };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); };
  const removeFile = () => { setFormData(p => ({ ...p, uploadedFile: null })); if (fileInputRef.current) fileInputRef.current.value = ''; };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    if (!user) { localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData)); setShowLoginPrompt(true); return; }
    setIsSubmitting(true);
    try {
      const userId = user.userId;
      const applicationData: ApplicationInsert = {
        user_id: userId, br_number: formData.brNumber,
        company_name_en: formData.companyNameEn || undefined, company_name_zh: formData.companyNameZh || undefined,
        business_type: formData.businessType, id_type: formData.idType, id_number: formData.idNumber,
        applicant_role: formData.role, applicant_email: formData.email, status: 'draft',
      };
      if (formData.uploadedFile) {
        try {
          const response = await fetch(formData.uploadedFile.preview || '');
          const blob = await response.blob();
          const file = new File([blob], formData.uploadedFile.name, { type: formData.uploadedFile.type });
          const uploadResult = await uploadDocument(userId, file);
          if (uploadResult.data) applicationData.document_url = uploadResult.data.publicUrl;
        } catch (e) { console.error('Upload failed:', e); }
      }
      const { data: application, error: appError } = await createApplication(applicationData);
      if (appError || !application) throw new Error(appError?.message || 'Failed to create application');
      const corpIDResult = await submitToCorpID({
        business: { brNumber: formData.brNumber, companyNameEn: formData.companyNameEn, companyNameZh: formData.companyNameZh, businessType: formData.businessType as BusinessType },
        identity: { idType: formData.idType, idNumber: formData.idNumber, documentFile: null },
        applicant: { role: formData.role as ApplicantRole, email: formData.email },
        declarations: { agreeTerms: formData.agreeTerms, authDeclaration: formData.authDeclaration, dataConsent: true },
      });
      if (!corpIDResult.success) throw new Error(corpIDResult.message || 'CorpID submission failed');
      const generatedRef = corpIDResult.refNumber || `CORP-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      await submitApplicationDb(application.id, generatedRef);
      setRefNumber(generatedRef);
      setQrCodeUrl(generateQRCodeDataUrl(generatedRef, 150));
      localStorage.setItem(REGISTRATION_DATA_KEY, JSON.stringify({ id: application.id, refNumber: generatedRef, companyName: formData.companyNameEn || formData.companyNameZh, brNumber: formData.brNumber, businessType: formData.businessType, email: formData.email, status: 'submitted', submittedDate: new Date().toISOString() }));
      localStorage.removeItem(FORM_STORAGE_KEY);
      setIsSuccess(true);
    } catch (error) {
      console.error('Submission error:', error);
      setErrors(prev => ({ ...prev, submit: error instanceof Error ? error.message : 'Submission failed' }));
    } finally { setIsSubmitting(false); }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/dashboard?ref=${refNumber}`;
    if (navigator.share) try { await navigator.share({ title: 'CorpID Registration', text: `Ref: ${refNumber}`, url: shareUrl }); } catch { /* share cancelled */ }
    else handleCopy();
  };
  const handleCopy = () => { navigator.clipboard.writeText(`${window.location.origin}/dashboard?ref=${refNumber}`); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handlePrint = () => window.print();
  const getEstimatedDates = () => ({ processing: new Date(Date.now() + 24 * 60 * 60 * 1000), expected: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) });

  // Login Prompt
  if (showLoginPrompt && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-teal-100 rounded-xl flex items-center justify-center"><LogIn className="w-8 h-8 text-blue-600" /></div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">{language === 'zh' ? '登入以繼續' : 'Sign In to Continue'}</h2>
            <p className="text-slate-600 mb-6">{language === 'zh' ? '請登入或註冊帳戶以提交 CorpID 申請' : 'Please sign in to submit your CorpID application'}</p>
            <div className="space-y-3">
              <button onClick={() => navigate('/register?auth=login')} className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800">{language === 'zh' ? '登入' : 'Sign In'}</button>
              <button onClick={() => navigate('/register?auth=signup')} className="w-full px-6 py-3 border border-blue-600 text-blue-600 font-semibold rounded-xl hover:bg-blue-50">{language === 'zh' ? '建立帳戶' : 'Create Account'}</button>
              <button onClick={() => setShowLoginPrompt(false)} className="w-full px-6 py-2 text-slate-500 hover:text-slate-700">{language === 'zh' ? '返回' : 'Go Back'}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success Screen
  if (isSuccess) {
    const estimatedDates = getEstimatedDates();
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg"><CheckCircle2 className="w-12 h-12 text-white" /></div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">{language === 'zh' ? '註冊成功！' : 'Registration Successful!'}</h1>
            <p className="text-lg text-slate-600 mb-8">{language === 'zh' ? '您的 CorpID 申請已提交' : 'Your CorpID application has been submitted'}</p>
            <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-6 mb-8">
              <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                <div className="text-center md:text-left">
                  <p className="text-sm text-slate-600 mb-2">{language === 'zh' ? '參考編號' : 'Reference Number'}</p>
                  <p className="text-2xl font-mono font-bold text-blue-600 mb-2">{refNumber}</p>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-slate-500"><Lock className="w-4 h-4" /><span>{language === 'zh' ? '請保存作記錄' : 'Save for your records'}</span></div>
                </div>
                {qrCodeUrl && <div className="bg-white p-3 rounded-xl shadow-sm"><img src={qrCodeUrl} alt="QR Code" className="w-24 h-24" /></div>}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center justify-center gap-2"><Calendar className="w-5 h-5 text-blue-600" />{language === 'zh' ? '預計時間表' : 'Estimated Timeline'}</h3>
              <div className="flex justify-center gap-8">
                <div className="text-center"><div className="w-12 h-12 mx-auto mb-2 bg-amber-100 rounded-full flex items-center justify-center"><Clock className="w-6 h-6 text-amber-600" /></div><p className="text-xs text-slate-500">{language === 'zh' ? '處理中' : 'Processing'}</p><p className="text-sm font-medium">{estimatedDates.processing.toLocaleDateString()}</p></div>
                <div className="flex items-center"><div className="w-8 h-0.5 bg-slate-300" /></div>
                <div className="text-center"><div className="w-12 h-12 mx-auto mb-2 bg-emerald-100 rounded-full flex items-center justify-center"><CheckCircle2 className="w-6 h-6 text-emerald-600" /></div><p className="text-xs text-slate-500">{language === 'zh' ? '預計完成' : 'Expected'}</p><p className="text-sm font-medium">{estimatedDates.expected.toLocaleDateString()}</p></div>
              </div>
            </div>
            <div className="text-left bg-slate-50 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-slate-800 mb-4">{language === 'zh' ? '下一步' : 'Next Steps'}</h3>
              <ul className="space-y-3">
                {(language === 'zh' ? ['申請將由數碼政策辦公室審核', '2-3個工作天內收到確認電郵', '核准後可開始使用 CorpID'] : ['Application will be reviewed', 'Confirmation email within 2-3 days', 'Start using CorpID once approved']).map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <button onClick={() => setChecklist(p => { const n = [...p]; n[i] = !n[i]; return n; })} className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${checklist[i] ? 'bg-emerald-500 text-white' : 'bg-blue-100 text-blue-600'}`}>{checklist[i] ? <Check className="w-3 h-3" /> : <span className="text-xs font-medium">{i + 1}</span>}</button>
                    <span className={`text-slate-600 ${checklist[i] ? 'line-through text-slate-400' : ''}`}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={handlePrint} className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50"><Printer className="w-5 h-5" />{language === 'zh' ? '列印' : 'Print'}</button>
              <button onClick={handleShare} className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50"><Share2 className="w-5 h-5" />{language === 'zh' ? '分享' : 'Share'}</button>
              <button onClick={handleCopy} className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50">{copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}{copied ? (language === 'zh' ? '已複製' : 'Copied') : (language === 'zh' ? '複製連結' : 'Copy Link')}</button>
            </div>
            <div className="mt-6"><button onClick={() => navigate('/dashboard')} className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800">{language === 'zh' ? '前往儀表板' : 'Go to Dashboard'}</button></div>
          </div>
        </div>
      </div>
    );
  }

  // Main Registration Form
  const steps = [
    { num: 1, icon: Building2, label: language === 'zh' ? '企業驗證' : 'Business' },
    { num: 2, icon: Fingerprint, label: language === 'zh' ? '身份驗證' : 'Identity' },
    { num: 3, icon: FileCheck, label: language === 'zh' ? '授權提交' : 'Authorization' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{language === 'zh' ? 'CorpID 註冊' : 'CorpID Registration'}</h1>
          <p className="text-slate-600">{language === 'zh' ? '只需3個步驟完成註冊' : 'Complete in 3 simple steps'}</p>
        </div>

        {/* Step Indicators */}
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
          <div className="w-full bg-slate-200 rounded-full h-2 md:hidden"><div className="bg-gradient-to-r from-blue-600 to-teal-500 h-2 rounded-full transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} /></div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {/* Step 1: Business Verification */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-teal-100 rounded-xl flex items-center justify-center"><Building2 className="w-8 h-8 text-blue-600" /></div>
                <h2 className="text-xl font-semibold text-slate-800">{language === 'zh' ? '企業驗證' : 'Business Verification'}</h2>
                <p className="text-slate-500 text-sm">{language === 'zh' ? '輸入商業登記號碼以驗證' : 'Enter BR number to verify'}</p>
              </div>

              {/* BR Number */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{language === 'zh' ? '商業登記號碼' : 'Business Registration Number'} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type="text" value={formData.brNumber} onChange={(e) => setFormData({ ...formData, brNumber: e.target.value.replace(/\D/g, '').slice(0, 8) })} onBlur={() => handleBlur('brNumber')} placeholder={language === 'zh' ? '例如：12345678' : 'e.g., 12345678'} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${errors.brNumber && touched.brNumber ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} maxLength={8} />
                  {brVerification.loading && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div>}
                  {brVerification.valid === true && !brVerification.loading && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />}
                  {brVerification.valid === false && !brVerification.loading && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />}
                </div>
                <p className="mt-1 text-xs text-slate-500">{language === 'zh' ? '商業登記證上的8位數字' : '8-digit number from BR Certificate'}</p>
                {brVerification.valid === true && brVerification.company && <p className="mt-1 text-sm text-emerald-600">{language === 'zh' ? '已驗證：' : 'Verified: '}{brVerification.company}</p>}
                {errors.brNumber && touched.brNumber && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.brNumber}</p>}
              </div>

              {/* Company Name (Optional, auto-filled) */}
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-2">{language === 'zh' ? '公司名稱（英文）' : 'Company Name (English)'}</label><input type="text" value={formData.companyNameEn} onChange={(e) => setFormData({ ...formData, companyNameEn: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-2">{language === 'zh' ? '公司名稱（中文）' : 'Company Name (Chinese)'}</label><input type="text" value={formData.companyNameZh} onChange={(e) => setFormData({ ...formData, companyNameZh: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" /></div>
              </div>

              {/* Business Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{language === 'zh' ? '業務類型' : 'Business Type'} <span className="text-red-500">*</span></label>
                <select value={formData.businessType} onChange={(e) => setFormData({ ...formData, businessType: e.target.value as BusinessType })} onBlur={() => handleBlur('businessType')} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${errors.businessType && touched.businessType ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
                  <option value="">{language === 'zh' ? '選擇類型' : 'Select type'}</option>
                  {BUSINESS_TYPES.map(bt => (<option key={bt.value} value={bt.value}>{language === 'zh' ? bt.labelZh : bt.labelEn}</option>))}
                </select>
                {errors.businessType && touched.businessType && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.businessType}</p>}
              </div>
            </div>
          )}

          {/* Step 2: Identity Verification */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-teal-100 rounded-xl flex items-center justify-center"><Fingerprint className="w-8 h-8 text-blue-600" /></div>
                <h2 className="text-xl font-semibold text-slate-800">{language === 'zh' ? '身份驗證' : 'Identity Verification'}</h2>
                <p className="text-slate-500 text-sm">{language === 'zh' ? '驗證您的身份' : 'Verify your identity'}</p>
              </div>

              {/* ID Type Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{language === 'zh' ? '證件類型' : 'ID Type'} <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setFormData({ ...formData, idType: 'hkid', idNumber: '' })} className={`p-4 rounded-xl border-2 transition-all ${formData.idType === 'hkid' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <span className="font-medium">{language === 'zh' ? '香港身份證' : 'Hong Kong ID'}</span>
                  </button>
                  <button type="button" onClick={() => setFormData({ ...formData, idType: 'passport', idNumber: '' })} className={`p-4 rounded-xl border-2 transition-all ${formData.idType === 'passport' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <span className="font-medium">{language === 'zh' ? '護照' : 'Passport'}</span>
                  </button>
                </div>
              </div>

              {/* ID Number Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{language === 'zh' ? '證件號碼' : 'ID Number'} <span className="text-red-500">*</span></label>
                <input type="text" value={formData.idNumber} onChange={(e) => setFormData({ ...formData, idNumber: formData.idType === 'hkid' ? e.target.value.toUpperCase() : e.target.value })} onBlur={() => handleBlur('idNumber')} placeholder={formData.idType === 'hkid' ? (language === 'zh' ? '例如：A123456(7)' : 'e.g., A123456(7)') : (language === 'zh' ? '護照號碼' : 'Passport number')} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${errors.idNumber && touched.idNumber ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} />
                {errors.idNumber && touched.idNumber && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.idNumber}</p>}
              </div>

              {/* Document Upload (Optional) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{language === 'zh' ? '上傳證件（選填）' : 'Upload Document (Optional)'}</label>
                <div className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                  <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileInput} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  {formData.uploadedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="text-sm text-slate-700">{formData.uploadedFile.name}</span>
                      <button type="button" onClick={removeFile} className="text-slate-400 hover:text-red-500"><AlertCircle className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="text-slate-500"><p className="text-sm">{language === 'zh' ? '拖放或點擊上傳' : 'Drag & drop or click to upload'}</p><p className="text-xs text-slate-400 mt-1">JPG, PNG, PDF (max 5MB)</p></div>
                  )}
                </div>
                {errors.uploadedFile && <p className="mt-1 text-sm text-red-500">{errors.uploadedFile}</p>}
              </div>
            </div>
          )}

          {/* Step 3: Authorization */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-teal-100 rounded-xl flex items-center justify-center"><FileCheck className="w-8 h-8 text-blue-600" /></div>
                <h2 className="text-xl font-semibold text-slate-800">{language === 'zh' ? '授權及提交' : 'Authorization'}</h2>
                <p className="text-slate-500 text-sm">{language === 'zh' ? '確認您的角色並提交' : 'Confirm your role and submit'}</p>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{language === 'zh' ? '您的角色' : 'Your Role'} <span className="text-red-500">*</span></label>
                <div className="space-y-2">
                  {APPLICANT_ROLES.map(r => (
                    <button key={r.value} type="button" onClick={() => setFormData({ ...formData, role: r.value })} className={`w-full p-4 rounded-xl border-2 text-left transition-all ${formData.role === r.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <p className="font-medium">{language === 'zh' ? r.labelZh : r.labelEn}</p>
                      <p className="text-sm text-slate-500">{language === 'zh' ? r.descZh : r.descEn}</p>
                    </button>
                  ))}
                </div>
                {errors.role && touched.role && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.role}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{language === 'zh' ? '電郵地址' : 'Email Address'} <span className="text-red-500">*</span></label>
                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} onBlur={() => handleBlur('email')} placeholder="email@company.com" className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${errors.email && touched.email ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} /></div>
                {errors.email && touched.email && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.email}</p>}
              </div>

              {/* Declarations */}
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={formData.authDeclaration} onChange={(e) => setFormData({ ...formData, authDeclaration: e.target.checked })} onBlur={() => handleBlur('authDeclaration')} className="mt-1 w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                  <span className="text-sm text-slate-700">{language === 'zh' ? '我確認我有權代表此企業申請 CorpID' : 'I confirm I am authorized to register CorpID on behalf of this business'}</span>
                </label>
                {errors.authDeclaration && touched.authDeclaration && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.authDeclaration}</p>}

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={formData.agreeTerms} onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })} onBlur={() => handleBlur('agreeTerms')} className="mt-1 w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                  <span className="text-sm text-slate-700">{language === 'zh' ? '我同意服務條款及私隱政策' : 'I agree to the Terms of Service and Privacy Policy'}</span>
                </label>
                {errors.agreeTerms && touched.agreeTerms && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.agreeTerms}</p>}
              </div>

              {errors.submit && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{errors.submit}</div>}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
            {step > 1 ? (
              <button type="button" onClick={handleBack} className="px-6 py-3 text-slate-600 hover:text-slate-800 font-medium flex items-center gap-2">
                {language === 'zh' ? '上一步' : 'Back'}
              </button>
            ) : <div />}
            {step < 3 ? (
              <button type="button" onClick={handleNext} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 flex items-center gap-2">
                {language === 'zh' ? '下一步' : 'Next'}
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 flex items-center gap-2">
                {isSubmitting ? (<><Loader2 className="w-5 h-5 animate-spin" />{language === 'zh' ? '處理中...' : 'Processing...'}</>) : (language === 'zh' ? '提交申請' : 'Submit Application')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
