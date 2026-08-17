import { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import {
  User, Building2, Bell, Lock, LogOut, Save, Check, Monitor, Smartphone, AlertCircle, Loader2
} from 'lucide-react';

const SettingsPage = () => {
  const { t, lang, setLang } = useLanguage();
  const { user, signOut } = useAuth();
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({ full_name: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .maybeSingle();
      setProfile({
        full_name: data?.full_name ?? '',
        phone: data?.phone ?? '',
        email: user.email ?? '',
      });
    };
    load();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: profile.full_name,
        phone: profile.phone,
        language: lang,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError(isZh ? '保存失敗' : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'profile', label: isZh ? '個人資料' : 'Profile', icon: User },
    { key: 'organisation', label: isZh ? '組織' : 'Organisation', icon: Building2 },
    { key: 'notifications', label: isZh ? '通知' : 'Notifications', icon: Bell },
    { key: 'security', label: isZh ? '安全' : 'Security', icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">{isZh ? '設定' : 'Settings'}</h1>
          <p className="text-slate-500 mt-1">{isZh ? '管理您的帳戶設定' : 'Manage your account settings'}</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Tabs */}
          <div className="md:w-56 flex-shrink-0">
            <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-slate-900">{isZh ? '個人資料' : 'Profile'}</h2>
                  {error && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{isZh ? '姓名' : 'Name'}</label>
                    <input type="text" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{isZh ? '電郵' : 'Email'}</label>
                    <input type="email" value={profile.email} readOnly className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{isZh ? '電話' : 'Phone'}</label>
                    <input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{isZh ? '語言' : 'Language'}</label>
                    <div className="inline-flex rounded-xl border border-slate-200 p-0.5">
                      <button onClick={() => setLang('en')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${lang === 'en' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>English</button>
                      <button onClick={() => setLang('zh')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${lang === 'zh' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>中文</button>
                    </div>
                  </div>
                  <button onClick={handleSaveProfile} disabled={saving} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? (isZh ? '已保存' : 'Saved') : (isZh ? '保存更改' : 'Save Changes')}
                  </button>
                </div>
              )}

              {/* Organisation Tab */}
              {activeTab === 'organisation' && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-slate-900">{isZh ? '組織' : 'Organisation'}</h2>
                  <p className="text-slate-500">{isZh ? '您目前所屬的組織資訊。' : 'Information about the organisation you belong to.'}</p>
                  <div className="p-5 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">{isZh ? '當前組織' : 'Current Organisation'}</p>
                        <p className="font-semibold text-slate-900">{profile.full_name || (isZh ? '未設定' : 'Not set')}</p>
                      </div>
                    </div>
                  </div>
                  <button className="inline-flex items-center gap-2 px-5 py-3 text-red-600 font-medium rounded-xl border border-red-200 hover:bg-red-50 transition-all">
                    <LogOut className="w-4 h-4" />
                    {isZh ? '離開組織' : 'Leave Organisation'}
                  </button>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-slate-900">{isZh ? '通知' : 'Notifications'}</h2>
                  <div className="space-y-4">
                    {[
                      { label: isZh ? '電郵通知' : 'Email notifications', desc: isZh ? '接收重要更新電郵' : 'Receive important updates via email' },
                      { label: isZh ? '申請狀態提醒' : 'Application alerts', desc: isZh ? '申請狀態變更時通知' : 'Get notified on application status changes' },
                      { label: isZh ? '產品更新' : 'Product updates', desc: isZh ? '新功能及改進通知' : 'New features and improvements' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                          <p className="font-medium text-slate-900">{item.label}</p>
                          <p className="text-sm text-slate-500">{item.desc}</p>
                        </div>
                        <ToggleSwitch defaultOn={i < 2} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-900">{isZh ? '安全' : 'Security'}</h2>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-4">{isZh ? '更改密碼' : 'Change Password'}</h3>
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">{isZh ? '目前密碼' : 'Current Password'}</label>
                        <input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">{isZh ? '新密碼' : 'New Password'}</label>
                        <input type="password" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">{isZh ? '確認新密碼' : 'Confirm New Password'}</label>
                        <input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                      </div>
                      <button className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-800 font-semibold rounded-xl hover:bg-slate-200 transition-all">
                        <Lock className="w-4 h-4" />
                        {isZh ? '更新密碼' : 'Update Password'}
                      </button>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-100">
                    <h3 className="font-semibold text-slate-800 mb-4">{isZh ? '活躍工作階段' : 'Active Sessions'}</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                        <Monitor className="w-5 h-5 text-slate-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{isZh ? '當前瀏覽器' : 'Current Browser'}</p>
                          <p className="text-xs text-slate-500">{isZh ? '香港 · 進行中' : 'Hong Kong · Active now'}</p>
                        </div>
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">{isZh ? '活躍' : 'Active'}</span>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                        <Smartphone className="w-5 h-5 text-slate-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{isZh ? 'iAM Smart 應用程式' : 'iAM Smart App'}</p>
                          <p className="text-xs text-slate-500">{isZh ? '2小時前' : '2 hours ago'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-100">
                    <button onClick={signOut} className="inline-flex items-center gap-2 px-5 py-3 text-red-600 font-medium rounded-xl border border-red-200 hover:bg-red-50 transition-all">
                      <LogOut className="w-4 h-4" />
                      {isZh ? '登出' : 'Sign Out'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToggleSwitch = ({ defaultOn }: { defaultOn: boolean }) => {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`relative w-12 h-6 rounded-full transition-colors ${on ? 'bg-blue-600' : 'bg-slate-300'}`}
      role="switch"
      aria-checked={on}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-6' : ''}`} />
    </button>
  );
};

export default SettingsPage;
