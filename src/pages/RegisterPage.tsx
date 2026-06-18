import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../lib/AuthContext';
import { createApplication, uploadDocument, submitApplicationDb, type ApplicationInsert } from '../lib/aws';
import { submitApplication as submitToCorpID } from '../services/corpidApi';
import { Building2, CreditCard, FileText, User, Briefcase, Upload, Loader2, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Lock, ShieldCheck, X, FileCheck, Mail, Phone, Share2, Copy, Printer, Check, Calendar, Clock, LogIn } from 'lucide-react';
import { generateQRCodeDataUrl } from '../utils/qrcode';
import { validateHKIDFormat, verifyBRNumber } from '../services/corpidApi';

const FORM_STORAGE_KEY = 'corpid_registration_form';
const REGISTRATION_DATA_KEY = 'corpid_registration_data';
const DEBOUNCE_DELAY = 500; // ms

interface UploadedFile { name: string; size: number; type: string; preview?: string; }
interface FormData {
  brNumber: string; companyNameEn: string; companyNameZh: string; businessType: string;
  email: string; phone: string; idType: string; idNumber: string; uploadedFile: UploadedFile | null;
  role: string; agreeTerms: boolean; authDeclaration: boolean;
}

const validateEmail = (email: string): boolean => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone: string): boolean => !phone || /^(\+?852)?[2-9]\d{7}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
const validateHKIDFormatOnly = (id: string): boolean => /^[A-Z]{1,2}\d{6}\(\d\)$/.test(id.toUpperCase());
const validatePassport = (p: string): boolean => /^[A-Z0-9]{5,12}$/.test(p.toUpperCase());
const formatPhone = (v: string): string => { const c = v.replace(/\D/g, ''); return c.length <= 4 ? c : c.length <= 8 ? `${c.slice(0,4)} ${c.slice(4)}` : `${c.slice(0,4)} ${c.slice(4,8)}`; };

const RegisterPage = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
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
    if (saved) try { return { ...JSON.parse(saved), uploadedFile: null }; } catch {}
    return { brNumber: '', companyNameEn: '', companyNameZh: '', businessType: '', email: '', phone: '', idType: language === 'zh' ? '香港身份證' : 'Hong Kong ID Card', idNumber: '', uploadedFile: null, role: '', agreeTerms: false, authDeclaration: false };
  });

  useEffect(() => { const { uploadedFile, ...data } = formData; localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(data)); }, [formData]);

  // Debounced BR verification
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (formData.brNumber && /^\d{8}$/.test(formData.brNumber)) {
      setBrVerification({ loading: true, valid: null });
      
      debounceRef.current = setTimeout(async () => {
        try {
          const result = await verifyBRNumber(formData.brNumber);
          setBrVerification({ 
            loading: false, 
            valid: result.valid,
            company: result.valid ? (result.companyName || '') : undefined
          });
          
          // Auto-fill company name if available
          if (result.valid && result.companyName && !formData.companyNameEn) {
            setFormData(p => ({ ...p, companyNameEn: result.companyName || '' }));
          }
        } catch {
          setBrVerification({ loading: false, valid: null });
        }
      }, DEBOUNCE_DELAY);
    } else {
      setBrVerification({ loading: false, valid: null });
    }
    
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [formData.brNumber]);

  const validateField = useCallback((field: string, value: unknown): string => {
    switch (field) {
      case 'brNumber': if (!value) return t.errors.required; if (!/^\d{8}$/.test(value as string)) return t.errors.invalidBr; return '';
      case 'companyName': if (!formData.companyNameEn && !formData.companyNameZh) return t.errors.required; return '';
      case 'businessType': return !value ? t.errors.required : '';
      case 'email': if (value && !validateEmail(value as string)) return t.errors.invalidEmail; return '';
      case 'phone': if (value && !validatePhone(value as string)) return t.errors.invalidPhone; return '';
      case 'idNumber':
        if (!value) return t.errors.required;
        if (formData.idType === 'Hong Kong ID Card' || formData.idType === '香港身份證') {
          // First check format
          if (!validateHKIDFormatOnly(value as string)) return t.errors.invalidHkid;
          // Then validate checksum
          if (!validateHKIDFormat(value as string)) return t.errors.invalidHkid;
          return '';
        }
        return validatePassport(value as string) ? '' : t.errors.invalidPassport;
      case 'role': return !value ? t.errors.roleRequired : '';
      case 'authDeclaration': return !value ? t.errors.authRequired : '';
      case 'agreeTerms': return !value ? t.errors.termsRequired : '';
      default: return '';
    }
  }, [formData, t.errors]);

  const steps = [
    { num: 1, icon: Building2, label: t.register.steps.step1 },
    { num: 2, icon: CreditCard, label: t.register.steps.step2 },
    { num: 3, icon: User, label: t.register.steps.step3 },
    { num: 4, icon: FileText, label: t.register.steps.step4 },
  ];

  const validate = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!formData.brNumber) e.brNumber = t.errors.required; else if (!/^\d{8}$/.test(formData.brNumber)) e.brNumber = t.errors.invalidBr;
      if (!formData.companyNameEn && !formData.companyNameZh) e.companyName = t.errors.required;
      if (!formData.businessType) e.businessType = t.errors.required;
      if (formData.email && !validateEmail(formData.email)) e.email = t.errors.invalidEmail;
      if (formData.phone && !validatePhone(formData.phone)) e.phone = t.errors.invalidPhone;
    }
    if (s === 2) {
      if (!formData.idNumber) e.idNumber = t.errors.required;
      else if ((formData.idType === 'Hong Kong ID Card' || formData.idType === '香港身份證')) {
        if (!validateHKIDFormatOnly(formData.idNumber)) e.idNumber = t.errors.invalidHkid;
        else if (!validateHKIDFormat(formData.idNumber)) e.idNumber = t.errors.invalidHkid;
      }
      else if (!validatePassport(formData.idNumber)) e.idNumber = t.errors.invalidPassport;
    }
    if (s === 3) {
      if (!formData.role) e.role = t.errors.roleRequired;
      if (!formData.authDeclaration) e.authDeclaration = t.errors.authRequired;
      if (!formData.agreeTerms) e.agreeTerms = t.errors.termsRequired;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleBlur = (field: string) => { setTouched(p => ({ ...p, [field]: true })); setErrors(p => ({ ...p, [field]: validateField(field, formData[field as keyof FormData]) })); };

  const handleFileUpload = (file: File) => {
    if (file.size > 5 * 1024 * 1024) { setErrors(p => ({ ...p, uploadedFile: t.errors.fileSizeExceeded })); return; }
    if (!['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'].includes(file.type)) { setErrors(p => ({ ...p, uploadedFile: t.errors.invalidFileType })); return; }
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
  const handleKeyDown = (e: React.KeyboardEvent, s: number) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (validate(s)) s < 4 ? setStep(s + 1) : handleSubmit(); } };

  const handleSubmit = async () => {
    if (!validate(3)) return;
    
    // Check if user is authenticated
    if (!user) {
      // Store form data and redirect to login
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
      setShowLoginPrompt(true);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get user ID from AWS Cognito
      const userId = user.userId;
      
      // Get user email from form
      const userEmail = formData.email || '';
      
      // Prepare application data
      const applicationData: ApplicationInsert = {
        user_id: userId,
        br_number: formData.brNumber,
        company_name_en: formData.companyNameEn || undefined,
        company_name_zh: formData.companyNameZh || undefined,
        business_type: formData.businessType,
        id_type: formData.idType === 'Hong Kong ID Card' || formData.idType === '香港身份證' ? 'hkid' : 'passport',
        id_number: formData.idNumber,
        applicant_role: formData.role as 'owner' | 'employee' | 'agent',
        applicant_email: formData.email || userEmail || '',
        applicant_phone: formData.phone || undefined,
        status: 'draft',
      };
      
      // Upload document if present
      let documentUrl: string | undefined;
      if (formData.uploadedFile) {
        try {
          // Convert data URL to File for upload
          const response = await fetch(formData.uploadedFile.preview || '');
          const blob = await response.blob();
          const file = new File([blob], formData.uploadedFile.name, { type: formData.uploadedFile.type });
          
          const uploadResult = await uploadDocument(userId, file);
          if (uploadResult.data) {
            documentUrl = uploadResult.data.publicUrl;
            applicationData.document_url = documentUrl;
          }
        } catch (uploadError) {
          console.error('Document upload failed:', uploadError);
          // Continue without document - it's optional
        }
      }
      
      // Create application in AWS
      const { data: application, error: appError } = await createApplication(applicationData);
      
      if (appError || !application) {
        throw new Error(appError?.message || 'Failed to create application');
      }
      
      // Submit to CorpID API (mock or real)
      const corpIDResult = await submitToCorpID({
        business: {
          brNumber: formData.brNumber,
          companyNameEn: formData.companyNameEn,
          companyNameZh: formData.companyNameZh,
          businessType: formData.businessType,
        },
        identity: {
          idType: applicationData.id_type,
          idNumber: formData.idNumber,
          documentFile: null,
        },
        applicant: {
          role: applicationData.applicant_role,
          email: applicationData.applicant_email,
          phone: formData.phone,
        },
        agreeTerms: formData.agreeTerms,
        authDeclaration: formData.authDeclaration,
      });
      
      if (!corpIDResult.success) {
        throw new Error(corpIDResult.message || 'CorpID submission failed');
      }
      
      // Update application with reference number
      const generatedRef = corpIDResult.refNumber || `CORP-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      
      await submitApplicationDb(application.id, generatedRef);
      
      setRefNumber(generatedRef);
      
      // Generate QR code
      const qrUrl = generateQRCodeDataUrl(generatedRef, 150);
      setQrCodeUrl(qrUrl);
      
      // Store registration data for dashboard
      localStorage.setItem(REGISTRATION_DATA_KEY, JSON.stringify({
        id: application.id,
        refNumber: generatedRef,
        companyName: formData.companyNameEn || formData.companyNameZh,
        brNumber: formData.brNumber,
        businessType: formData.businessType,
        email: formData.email || userEmail,
        phone: formData.phone,
        status: 'submitted',
        submittedDate: new Date().toISOString(),
      }));
      
      // Clear form storage
      localStorage.removeItem(FORM_STORAGE_KEY);
      setFormData({
        brNumber: '', companyNameEn: '', companyNameZh: '', businessType: '',
        email: '', phone: '', idType: language === 'zh' ? '香港身份證' : 'Hong Kong ID Card',
        idNumber: '', uploadedFile: null, role: '', agreeTerms: false, authDeclaration: false
      });
      
      setIsSuccess(true);
    } catch (error) {
      console.error('Submission error:', error);
      setErrors(prev => ({
        ...prev,
        submit: error instanceof Error ? error.message : 'Submission failed. Please try again.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Share functionality
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/dashboard?ref=${refNumber}`;
    const shareText = language === 'zh' 
      ? `我的 CorpID 申請參考編號: ${refNumber}` 
      : `My CorpID application reference: ${refNumber}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: 'CorpID Registration', text: shareText, url: shareUrl });
      } catch {
        // User cancelled or error
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = () => {
    const shareUrl = `${window.location.origin}/dashboard?ref=${refNumber}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Estimated timeline
  const getEstimatedDates = () => {
    const now = new Date();
    const processing = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +1 day
    const expected = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 days
    return { processing, expected };
  };

  // Login prompt modal for unauthenticated users
  if (showLoginPrompt && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-teal-100 rounded-xl flex items-center justify-center">
              <LogIn className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              {language === 'zh' ? '登入以繼續' : 'Sign In to Continue'}
            </h2>
            <p className="text-slate-600 mb-6">
              {language === 'zh' 
                ? '請登入或註冊帳戶以提交您的 CorpID 申請。您的表單資料已自動儲存。'
                : 'Please sign in or create an account to submit your CorpID application. Your form data has been saved.'}
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
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="w-full px-6 py-2 text-slate-500 hover:text-slate-700 transition-colors"
              >
                {language === 'zh' ? '返回' : 'Go Back'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    const estimatedDates = getEstimatedDates();
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center print-container">
            {/* Success Icon */}
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-slate-900 mb-4">{t.register.success.title}</h1>
            <p className="text-lg text-slate-600 mb-8">{t.register.success.subtitle}</p>
            
            {/* Reference Number & QR Code */}
            <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-6 mb-8">
              <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                <div className="text-center md:text-left">
                  <p className="text-sm text-slate-600 mb-2">{t.register.success.refNumber}</p>
                  <p className="text-2xl font-mono font-bold text-blue-600 mb-2">{refNumber}</p>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-slate-500">
                    <Lock className="w-4 h-4" />
                    <span>{t.register.success.refLabel}</span>
                  </div>
                </div>
                {qrCodeUrl && (
                  <div className="bg-white p-3 rounded-xl shadow-sm">
                    <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24" />
                  </div>
                )}
              </div>
            </div>
            
            {/* Estimated Timeline */}
            <div className="bg-slate-50 rounded-xl p-6 mb-8 print-no-break">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center justify-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                {language === 'zh' ? '預計時間表' : 'Estimated Timeline'}
              </h3>
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-amber-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  <p className="text-xs text-slate-500">{language === 'zh' ? '處理中' : 'Processing'}</p>
                  <p className="text-sm font-medium text-slate-800">{estimatedDates.processing.toLocaleDateString()}</p>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-0.5 bg-slate-300" />
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-xs text-slate-500">{language === 'zh' ? '預計完成' : 'Expected'}</p>
                  <p className="text-sm font-medium text-slate-800">{estimatedDates.expected.toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            
            {/* Next Steps with Checklist */}
            <div className="text-left bg-slate-50 rounded-xl p-6 mb-8 print-no-break">
              <h3 className="font-semibold text-slate-800 mb-4">{t.register.success.nextSteps}</h3>
              <ul className="space-y-3">
                {t.register.success.nextStepsItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <button 
                      onClick={() => setChecklist(p => { const n = [...p]; n[i] = !n[i]; return n; })}
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${checklist[i] ? 'bg-emerald-500 text-white' : 'bg-blue-100 text-blue-600'} no-print`}
                    >
                      {checklist[i] ? <Check className="w-3 h-3" /> : <span className="text-xs font-medium">{i + 1}</span>}
                    </button>
                    <span className={`text-slate-600 ${checklist[i] ? 'line-through text-slate-400' : ''}`}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center no-print">
              <button 
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all"
              >
                <Printer className="w-5 h-5" />
                {language === 'zh' ? '列印' : 'Print'}
              </button>
              <button 
                onClick={handleShare}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all"
              >
                <Share2 className="w-5 h-5" />
                {language === 'zh' ? '分享' : 'Share'}
              </button>
              <button 
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                {copied ? (language === 'zh' ? '已複製' : 'Copied') : (language === 'zh' ? '複製連結' : 'Copy Link')}
              </button>
            </div>
            
            {/* Go to Dashboard Button */}
            <div className="mt-6 no-print">
              <button 
                onClick={() => navigate('/dashboard')} 
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                {t.register.success.goToDashboard}
              </button>
            </div>
            
            {/* Print-only footer */}
            <div className="hidden print-only mt-8 pt-6 border-t border-slate-200 text-center">
              <p className="text-xs text-slate-500">This document confirms your CorpID application has been submitted.</p>
              <p className="text-xs text-slate-400 mt-2">Generated on {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8"><h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{t.register.title}</h1><p className="text-slate-600">{t.register.subtitle}</p></div>
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">{steps.map((s) => { const Icon = s.icon; const isActive = step === s.num; const isCompleted = step > s.num; return (<div key={s.num} className="flex-1 flex flex-col items-center"><div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-all ${isActive ? 'bg-gradient-to-br from-blue-600 to-teal-500 shadow-lg scale-110' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>{isCompleted ? <CheckCircle2 className="w-6 h-6 text-white" /> : <Icon className={`w-6 h-6 ${isActive ? 'text-white' : ''}`} />}</div><span className={`text-xs font-medium text-center hidden md:block ${isActive ? 'text-blue-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>{s.label}</span></div>); })}</div>
          <div className="w-full bg-slate-200 rounded-full h-2 md:hidden"><div className="bg-gradient-to-r from-blue-600 to-teal-500 h-2 rounded-full transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} /></div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8" onKeyDown={(e) => handleKeyDown(e, step)}>
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6"><div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-teal-100 rounded-xl flex items-center justify-center"><Building2 className="w-8 h-8 text-blue-600" /></div><h2 className="text-xl font-semibold text-slate-800">{t.register.step1.title}</h2><p className="text-slate-500 text-sm">{t.register.step1.subtitle}</p></div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.register.step1.brNumber} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type="text" value={formData.brNumber} onChange={(e) => setFormData({ ...formData, brNumber: e.target.value.replace(/\D/g, '').slice(0, 8) })} onBlur={() => handleBlur('brNumber')} placeholder={t.register.step1.brNumberPlaceholder} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${errors.brNumber && touched.brNumber ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} maxLength={8} />
                  {brVerification.loading && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div>}
                  {brVerification.valid === true && !brVerification.loading && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />}
                  {brVerification.valid === false && !brVerification.loading && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />}
                </div>
                <p className="mt-1 text-xs text-slate-500">{t.register.step1.brNumberHint}</p>
                {brVerification.valid === true && brVerification.company && <p className="mt-1 text-sm text-emerald-600">{language === 'zh' ? '已驗證：' : 'Verified: '}{brVerification.company}</p>}
                {brVerification.valid === false && <p className="mt-1 text-sm text-red-500">{language === 'zh' ? '商業登記號碼無效' : 'Invalid Business Registration Number'}</p>}
                {errors.brNumber && touched.brNumber && <p className="mt-1 text-sm text-red-500 flex items-center gap-1" role="alert" aria-live="polite"><AlertCircle className="w-4 h-4" />{errors.brNumber}</p>}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-2">{t.register.step1.companyNameEn}</label><input type="text" value={formData.companyNameEn} onChange={(e) => setFormData({ ...formData, companyNameEn: e.target.value })} onBlur={() => handleBlur('companyName')} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-2">{t.register.step1.companyNameZh}</label><input type="text" value={formData.companyNameZh} onChange={(e) => setFormData({ ...formData, companyNameZh: e.target.value })} onBlur={() => handleBlur('companyName')} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              {errors.companyName && touched.companyName && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.companyName}</p>}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{language === 'zh' ? '電郵地址' : 'Email Address'}</label>
                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} onBlur={() => handleBlur('email')} placeholder="example@company.com" className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${errors.email && touched.email ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} /></div>
                {errors.email && touched.email && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{language === 'zh' ? '電話號碼' : 'Phone Number'}</label>
                <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })} onBlur={() => handleBlur('phone')} placeholder="+852 1234 5678" className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${errors.phone && touched.phone ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} maxLength={15} /></div>
                <p className="mt-1 text-xs text-slate-500">{language === 'zh' ? '格式：+852 1234 5678' : 'Format: +852 1234 5678'}</p>
                {errors.phone && touched.phone && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.register.step1.businessType} <span className="text-red-500">*</span></label>
                <select value={formData.businessType} onChange={(e) => setFormData({ ...formData, businessType: e.target.value })} onBlur={() => handleBlur('businessType')} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${errors.businessType && touched.businessType ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}><option value="">{t.register.step1.businessTypePlaceholder}</option>{t.register.step1.businessTypes.map((type, i) => <option key={i} value={type}>{type}</option>)}</select>
                {errors.businessType && touched.businessType && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.businessType}</p>}
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6"><div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-xl flex items-center justify-center"><ShieldCheck className="w-8 h-8 text-teal-600" /></div><h2 className="text-xl font-semibold text-slate-800">{t.register.step2.title}</h2><p className="text-slate-500 text-sm">{t.register.step2.subtitle}</p></div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.register.step2.idType}</label>
                <div className="grid grid-cols-2 gap-4">{t.register.step2.idTypes.map((type, i) => (<button key={i} type="button" onClick={() => setFormData({ ...formData, idType: type, idNumber: '' })} className={`p-4 border rounded-xl text-left transition-all ${formData.idType === type ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500' : 'border-slate-200 hover:border-blue-300'}`}><span className="font-medium text-slate-800">{type}</span></button>))}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.register.step2.idNumber} <span className="text-red-500">*</span></label>
                <input type="text" value={formData.idNumber} onChange={(e) => setFormData({ ...formData, idNumber: e.target.value.toUpperCase() })} onBlur={() => handleBlur('idNumber')} placeholder={t.register.step2.idNumberPlaceholder} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 font-mono ${errors.idNumber && touched.idNumber ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} maxLength={10} />
                <p className="mt-1 text-xs text-slate-500">{t.register.step2.idNumberHint}</p>
                {errors.idNumber && touched.idNumber && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.idNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.register.step2.uploadDoc}</label>
                <p className="text-xs text-slate-500 mb-3">{t.register.step2.formats}</p>
                {formData.uploadedFile ? (
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><FileCheck className="w-5 h-5 text-blue-600" /></div><div><p className="font-medium text-slate-800 text-sm">{formData.uploadedFile.name}</p><p className="text-xs text-slate-500">{(formData.uploadedFile.size / 1024).toFixed(1)} KB</p></div></div>
                      <button type="button" onClick={removeFile} className="p-2 hover:bg-slate-200 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
                    </div>
                    {formData.uploadedFile.preview && formData.uploadedFile.type.startsWith('image/') && (<div className="mt-3"><img src={formData.uploadedFile.preview} alt="Preview" className="max-h-40 rounded-lg border border-slate-200" /></div>)}
                  </div>
                ) : (
                  <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                    <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileInput} className="hidden" />
                    <Upload className="w-10 h-10 mx-auto text-slate-400 mb-3" /><p className="text-slate-600 mb-1">{t.register.step2.dragDrop}</p><p className="text-xs text-slate-400">{t.register.step2.formats}</p>
                  </div>
                )}
                {errors.uploadedFile && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.uploadedFile}</p>}
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6"><div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center"><Briefcase className="w-8 h-8 text-blue-600" /></div><h2 className="text-xl font-semibold text-slate-800">{t.register.step3.title}</h2><p className="text-slate-500 text-sm">{t.register.step3.subtitle}</p></div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">{t.register.step3.role} <span className="text-red-500">*</span></label>
                <div className="space-y-3">{t.register.step3.roles.map((role) => (<button key={role.value} type="button" onClick={() => setFormData({ ...formData, role: role.value })} onBlur={() => handleBlur('role')} className={`w-full p-4 border rounded-xl text-left transition-all ${formData.role === role.value ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500' : 'border-slate-200 hover:border-blue-300'}`}><div className="font-medium text-slate-800">{role.label}</div><div className="text-sm text-slate-500">{role.desc}</div></button>))}</div>
                {errors.role && touched.role && <p className="mt-2 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.role}</p>}
              </div>
              <div className="space-y-4 bg-slate-50 rounded-xl p-4">
                <h3 className="font-medium text-slate-800">{t.register.step3.authDeclaration}</h3>
                <label className="flex items-start gap-3 cursor-pointer"><input type="checkbox" checked={formData.authDeclaration} onChange={(e) => setFormData({ ...formData, authDeclaration: e.target.checked })} onBlur={() => handleBlur('authDeclaration')} className="w-5 h-5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" /><span className="text-sm text-slate-600">{t.register.step3.authText}</span></label>
                {errors.authDeclaration && touched.authDeclaration && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.authDeclaration}</p>}
                <label className="flex items-start gap-3 cursor-pointer"><input type="checkbox" checked={formData.agreeTerms} onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })} onBlur={() => handleBlur('agreeTerms')} className="w-5 h-5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" /><span className="text-sm text-slate-600">{t.register.step3.agreeTerms}</span></label>
                {errors.agreeTerms && touched.agreeTerms && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.agreeTerms}</p>}
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6"><div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center"><FileText className="w-8 h-8 text-emerald-600" /></div><h2 className="text-xl font-semibold text-slate-800">{t.register.step4.title}</h2><p className="text-slate-500 text-sm">{t.register.step4.subtitle}</p></div>
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3"><h3 className="font-medium text-slate-800">{t.register.step4.businessDetails}</h3><button onClick={() => setStep(1)} className="text-sm text-blue-600 hover:underline">{t.common.edit}</button></div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">{t.register.step1.brNumber}:</span><span className="font-medium text-slate-800 font-mono">{formData.brNumber}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">{t.register.step1.companyName}:</span><span className="font-medium text-slate-800">{formData.companyNameEn || formData.companyNameZh}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">{t.register.step1.businessType}:</span><span className="font-medium text-slate-800">{formData.businessType}</span></div>
                  {formData.email && <div className="flex justify-between"><span className="text-slate-500">{language === 'zh' ? '電郵' : 'Email'}:</span><span className="font-medium text-slate-800">{formData.email}</span></div>}
                  {formData.phone && <div className="flex justify-between"><span className="text-slate-500">{language === 'zh' ? '電話' : 'Phone'}:</span><span className="font-medium text-slate-800">{formData.phone}</span></div>}
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3"><h3 className="font-medium text-slate-800">{t.register.step4.identityDetails}</h3><button onClick={() => setStep(2)} className="text-sm text-blue-600 hover:underline">{t.common.edit}</button></div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">{t.register.step2.idType}:</span><span className="font-medium text-slate-800">{formData.idType}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">{t.register.step2.idNumber}:</span><span className="font-medium text-slate-800 font-mono">{formData.idNumber}</span></div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3"><h3 className="font-medium text-slate-800">{t.register.step4.roleDetails}</h3><button onClick={() => setStep(3)} className="text-sm text-blue-600 hover:underline">{t.common.edit}</button></div>
                <div className="text-sm"><div className="flex justify-between"><span className="text-slate-500">{t.register.step3.role}:</span><span className="font-medium text-slate-800">{t.register.step3.roles.find(r => r.value === formData.role)?.label}</span></div></div>
              </div>
              <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4"><Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" /><p className="text-sm text-blue-800">{language === 'zh' ? '您的數據已加密並安全傳輸。' : 'Your data is encrypted and securely transmitted.'}</p></div>
            </div>
          )}
          
          {/* Submit Error Display */}
          {errors.submit && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">{language === 'zh' ? '提交失敗' : 'Submission Failed'}</p>
                <p className="text-sm text-red-600 mt-1">{errors.submit}</p>
              </div>
            </div>
          )}
          
          {/* Auth status indicator */}
          {!user && !authLoading && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
              <LogIn className="w-5 h-5 text-amber-600" />
              <p className="text-sm text-amber-800">
                {language === 'zh' 
                  ? '您將需要登入或註冊以提交申請。' 
                  : 'You will need to sign in or create an account to submit.'}
              </p>
            </div>
          )}
          
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
            <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${step === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}><ChevronLeft className="w-5 h-5" />{t.register.buttons.back}</button>
            {step < 4 ? (<button onClick={() => { if (validate(step)) setStep(step + 1); }} className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg">{t.register.buttons.next}<ChevronRight className="w-5 h-5" /></button>) : (<button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg disabled:opacity-70">{isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" />{t.register.step4.processing}</> : <><CheckCircle2 className="w-5 h-5" />{t.register.step4.submitBtn}</>}</button>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
