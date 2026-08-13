/**
 * Login Page
 * 
 * User authentication page for QuickCorpID
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { signIn, loading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (!email || !password) {
      setFormError(language === 'zh' ? '請填寫所有欄位' : 'Please fill in all fields');
      return;
    }

    const result = await signIn(email, password);
    if (!result.error) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 shadow-lg mb-4">
            <span className="text-white text-2xl font-bold">Q</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900">
            {language === 'zh' ? '登入 QuickCorpID' : 'Sign in to QuickCorpID'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {language === 'zh' ? '香港企業身份管理平台' : 'Hong Kong Business Identity Platform'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Messages */}
            {(error || formError) && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{formError || error}</span>
              </div>
            )}

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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {language === 'zh' ? '忘記密碼？' : 'Forgot password?'}
              </Link>
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
                  <span>{language === 'zh' ? '登入中...' : 'Signing in...'}</span>
                </>
              ) : (
                <span>{language === 'zh' ? '登入' : 'Sign In'}</span>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center text-sm text-slate-600">
            {language === 'zh' ? '沒有帳戶？' : "Don't have an account?"}{' '}
            <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-semibold">
              {language === 'zh' ? '立即註冊' : 'Sign up now'}
            </Link>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800 font-medium mb-2">
            {language === 'zh' ? '測試帳戶' : 'Demo Account'}
          </p>
          <p className="text-xs text-blue-600">
            {language === 'zh' ? '電郵：testuser@example.com' : 'Email: testuser@example.com'}
          </p>
          <p className="text-xs text-blue-600">
            {language === 'zh' ? '密碼：TestPass123!' : 'Password: TestPass123!'}
          </p>
        </div>
      </div>
    </div>
  );
}
