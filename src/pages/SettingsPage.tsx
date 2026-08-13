/**
 * Settings Page
 * 
 * User profile, organisation settings, and preferences
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import {
  User,
  Building2,
  Bell,
  Lock,
  Globe,
  ChevronRight,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function SettingsPage() {
  const { language } = useLanguage();
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'profile' | 'organisation' | 'notifications' | 'security'>('profile');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Profile form state
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [documentUploads, setDocumentUploads] = useState(true);
  const [corpIDUpdates, setCorpIDUpdates] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');
    setSaved(false);

    const { error } = await updateProfile({
      full_name: fullName,
      email,
      phone,
    });

    if (error) {
      setError(error.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }

    setLoading(false);
  };

  const tabs = [
    { id: 'profile', icon: User, label: language === 'zh' ? '個人資料' : 'Profile' },
    { id: 'organisation', icon: Building2, label: language === 'zh' ? '組織設定' : 'Organisation' },
    { id: 'notifications', icon: Bell, label: language === 'zh' ? '通知設定' : 'Notifications' },
    { id: 'security', icon: Lock, label: language === 'zh' ? '安全設定' : 'Security' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            {language === 'zh' ? '設定' : 'Settings'}
          </h1>
          <p className="mt-2 text-slate-600">
            {language === 'zh'
              ? '管理您的帳戶設定和偏好'
              : 'Manage your account settings and preferences'}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-6">
                  {language === 'zh' ? '個人資料' : 'Profile Information'}
                </h2>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2 mb-6">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {saved && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2 mb-6">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{language === 'zh' ? '設定已儲存' : 'Settings saved successfully'}</span>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-teal-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {(fullName || email || 'U')[0].toUpperCase()}
                    </div>
                    <button className="px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50">
                      {language === 'zh' ? '更換相片' : 'Change Photo'}
                    </button>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {language === 'zh' ? '姓名' : 'Full Name'}
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {language === 'zh' ? '電郵地址' : 'Email Address'}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {language === 'zh' ? '電話號碼' : 'Phone Number'}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      placeholder="+852 1234 5678"
                    />
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{language === 'zh' ? '儲存中...' : 'Saving...'}</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>{language === 'zh' ? '儲存變更' : 'Save Changes'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Organisation Tab */}
            {activeTab === 'organisation' && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-6">
                  {language === 'zh' ? '組織設定' : 'Organisation Settings'}
                </h2>

                <div className="space-y-4">
                  <button
                    onClick={() => navigate('/organisations')}
                    className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <div className="text-left">
                        <p className="font-medium text-slate-900">
                          {language === 'zh' ? '管理組織' : 'Manage Organisations'}
                        </p>
                        <p className="text-sm text-slate-500">
                          {language === 'zh'
                            ? '建立、編輯和管理您的組織'
                            : 'Create, edit, and manage your organisations'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => navigate('/corpid')}
                    className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50"
                  >
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-purple-600" />
                      <div className="text-left">
                        <p className="font-medium text-slate-900">
                          {language === 'zh' ? 'CorpID 連接' : 'CorpID Connection'}
                        </p>
                        <p className="text-sm text-slate-500">
                          {language === 'zh'
                            ? '管理 CorpID 連接和授權'
                            : 'Manage CorpID connections and authorizations'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => navigate('/documents')}
                    className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-teal-600" />
                      <div className="text-left">
                        <p className="font-medium text-slate-900">
                          {language === 'zh' ? '文件管理' : 'Document Management'}
                        </p>
                        <p className="text-sm text-slate-500">
                          {language === 'zh'
                            ? '上傳和管理企業文件'
                            : 'Upload and manage business documents'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-6">
                  {language === 'zh' ? '通知偏好' : 'Notification Preferences'}
                </h2>

                <div className="space-y-6">
                  {/* Email Notifications */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">
                        {language === 'zh' ? '電郵通知' : 'Email Notifications'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {language === 'zh'
                          ? '接收重要更新的電郵通知'
                          : 'Receive email notifications for important updates'}
                      </p>
                    </div>
                    <button
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        emailNotifications ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          emailNotifications ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  <hr className="border-slate-200" />

                  {/* Document Uploads */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">
                        {language === 'zh' ? '文件上傳通知' : 'Document Upload Notifications'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {language === 'zh'
                          ? '當文件成功上傳時接收通知'
                          : 'Get notified when documents are uploaded'}
                      </p>
                    </div>
                    <button
                      onClick={() => setDocumentUploads(!documentUploads)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        documentUploads ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          documentUploads ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  <hr className="border-slate-200" />

                  {/* CorpID Updates */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">
                        {language === 'zh' ? 'CorpID 更新' : 'CorpID Updates'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {language === 'zh'
                          ? '接收 CorpID 連接和簽署更新'
                          : 'Receive CorpID connection and signing updates'}
                      </p>
                    </div>
                    <button
                      onClick={() => setCorpIDUpdates(!corpIDUpdates)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        corpIDUpdates ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          corpIDUpdates ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  <hr className="border-slate-200" />

                  {/* Marketing Emails */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">
                        {language === 'zh' ? '推廣電郵' : 'Marketing Emails'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {language === 'zh'
                          ? '接收新功能和優惠資訊'
                          : 'Receive news about features and promotions'}
                      </p>
                    </div>
                    <button
                      onClick={() => setMarketingEmails(!marketingEmails)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        marketingEmails ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          marketingEmails ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-6">
                  {language === 'zh' ? '安全設定' : 'Security Settings'}
                </h2>

                <div className="space-y-6">
                  {/* Change Password */}
                  <div>
                    <h3 className="font-medium text-slate-900 mb-4">
                      {language === 'zh' ? '更改密碼' : 'Change Password'}
                    </h3>
                    <button className="px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50">
                      {language === 'zh' ? '更改密碼' : 'Change Password'}
                    </button>
                  </div>

                  <hr className="border-slate-200" />

                  {/* Two-Factor Authentication */}
                  <div>
                    <h3 className="font-medium text-slate-900 mb-2">
                      {language === 'zh' ? '雙重認證' : 'Two-Factor Authentication'}
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                      {language === 'zh'
                        ? '為您的帳戶添加額外的安全層'
                        : 'Add an extra layer of security to your account'}
                    </p>
                    <button className="px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50">
                      {language === 'zh' ? '啟用雙重認證' : 'Enable 2FA'}
                    </button>
                  </div>

                  <hr className="border-slate-200" />

                  {/* Active Sessions */}
                  <div>
                    <h3 className="font-medium text-slate-900 mb-2">
                      {language === 'zh' ? '活躍工作階段' : 'Active Sessions'}
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                      {language === 'zh'
                        ? '管理和監控您的登入工作階段'
                        : 'Manage and monitor your login sessions'}
                    </p>
                    <button className="px-4 py-2 border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50">
                      {language === 'zh' ? '登出所有裝置' : 'Sign Out All Devices'}
                    </button>
                  </div>

                  <hr className="border-slate-200" />

                  {/* Language */}
                  <div>
                    <h3 className="font-medium text-slate-900 mb-2">
                      {language === 'zh' ? '語言設定' : 'Language Settings'}
                    </h3>
                    <div className="flex items-center gap-3 mt-4">
                      <Globe className="w-5 h-5 text-slate-400" />
                      <select
                        value={language}
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="en">English</option>
                        <option value="zh">繁體中文</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
