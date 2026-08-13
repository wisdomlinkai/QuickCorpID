/**
 * Signup Page
 * 
 * User registration page for QuickCorpID
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { Mail, Lock, User, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { signUp, loading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [formError, setFormError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearError();

    // Validation
    if (!email || !password || !confirmPassword || !fullName) {
      setFormError(language === 'zh' ? '請填寫所有欄位' : 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setFormError(language === 'zh' ? '密碼不符' : 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setFormError(language === 'zh' ? '密碼需至少8個字元' : 'Password must be at least 8 characters');
      return;
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!(hasUpperCase && hasLowerCase && hasNumbers)) {
      setFormError(
        language === 'zh'
          ? '密碼需包含大寫字母、小寫字母和數字'
          : 'Password must contain uppercase, lowercase, and numbers'
      );
      return;
    }

    const result = await signUp(email, password, { full_name: fullName });
    if (!result.error) {
      setIsSuccess(true);
    }
  };

  // Success State
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              {language === 'zh' ? '註冊成功！' : 'Account Created!'}
            </h2>
            <p className="text-slate-600 mb-6">
              {language === 'zh'
                ? '我們已發送驗證電郵到您的信箱。請點擊電郵中的連結以啟用您的帳戶。'
                : 'We sent a verification email to your inbox. Please click the link in the email to activate your account.'}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800"
            >
              {language === 'zh' ? '前往登入' : 'Go to Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 shadow-lg mb-4">
            <span className="text-white text-2xl font-bold">Q</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900">
            {language === 'zh' ? '建立 QuickCorpID 帳戶' : 'Create QuickCorpID Account'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {language === 'zh' ? '開始管理您的企業身份' : 'Start managing your business identity'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Messages */}
            {(error || formError) && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{formError || error}</span>
              </div>
            )}

            {/* Full Name Field */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2">
                {language === 'zh' ? '姓名' : 'Full Name'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={language === 'zh' ? '您的姓名' : 'Your full name'}
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                {language === 'zh' ? '電郵地址' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={language === 'zh' ? 'you@example.com' : 'you@example.com'}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                {language === 'zh' ? '密碼' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {language === 'zh'
                  ? '至少8個字元，需包含大寫、小寫和數字'
                  : 'At least 8 characters with uppercase, lowercase, and numbers'}
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                {language === 'zh' ? '確認密碼' : 'Confirm Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="terms" className="text-sm text-slate-600">
                {language === 'zh' ? (
                  <>
                    我同意{' '}
                    <Link to="/terms" className="text-blue-600 hover:text-blue-700">
                      服務條款
                    </Link>{' '}
                    和{' '}
                    <Link to="/privacy" className="text-blue-600 hover:text-blue-700">
                      私隱政策
                    </Link>
                  </>
                ) : (
                  <>
                    I agree to the{' '}
                    <Link to="/terms" className="text-blue-600 hover:text-blue-700">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-blue-600 hover:text-blue-700">
                      Privacy Policy
                    </Link>
                  </>
                )}
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{language === 'zh' ? '註冊中...' : 'Creating account...'}</span>
                </>
              ) : (
                <span>{language === 'zh' ? '建立帳戶' : 'Create Account'}</span>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center text-sm text-slate-600">
            {language === 'zh' ? '已有帳戶？' : 'Already have an account?'}{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              {language === 'zh' ? '立即登入' : 'Sign in'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
