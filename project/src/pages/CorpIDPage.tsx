import { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import {
  ShieldCheck, QrCode, Link2, Loader2, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';

const CorpIDPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [status, setStatus] = useState<string>('draft');
  const [reference, setReference] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const isZh = t.nav.home === '首頁';

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data: orgs } = await supabase.from('organisations').select('id').eq('created_by', user.id);
      const orgIds = (orgs ?? []).map(o => o.id);
      if (orgIds.length === 0) { setLoading(false); return; }
      const { data: reg } = await supabase
        .from('registrations')
        .select('status, reference_number')
        .in('organisation_id', orgIds)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (reg) {
        setStatus(reg.status);
        setReference(reg.reference_number);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleConnect = async () => {
    setConnecting(true);
    setTimeout(() => {
      setStatus('approved');
      setConnecting(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 pt-32">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isConnected = status === 'approved';

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">{isZh ? 'CorpID 連接' : 'CorpID Connection'}</h1>
          <p className="text-slate-500 mt-1">{isZh ? '連接您的數碼企業身份' : 'Connect your Digital Corporate Identity'}</p>
        </div>

        {/* Status Card */}
        <div className={`bg-white rounded-2xl p-8 shadow-sm border-2 mb-8 ${isConnected ? 'border-emerald-200' : 'border-slate-100'}`}>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isConnected ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-blue-500 to-teal-500'
            }`}>
              {isConnected ? <CheckCircle2 className="w-10 h-10 text-white" /> : <ShieldCheck className="w-10 h-10 text-white" />}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-3 justify-center sm:justify-start mb-2">
                <h2 className="text-xl font-bold text-slate-900">
                  {isConnected ? (isZh ? '已連接' : 'Connected') : (isZh ? '未連接' : 'Not Connected')}
                </h2>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {t.dashboard.status[status as keyof typeof t.dashboard.status] ?? status}
                </span>
              </div>
              <p className="text-slate-500 text-sm">
                {isConnected
                  ? (isZh ? '您的 CorpID 已成功連接並啟用' : 'Your CorpID is successfully connected and active')
                  : (isZh ? '連接您的 CorpID 以啟用數碼企業身份' : 'Connect your CorpID to activate your digital identity')}
              </p>
              {reference && (
                <p className="text-sm text-slate-400 mt-2">{t.dashboard.refNumber}: <span className="font-mono font-medium text-slate-600">{reference}</span></p>
              )}
            </div>
          </div>
        </div>

        {/* QR Code / Connect */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
            <h3 className="text-lg font-bold text-slate-900 mb-4">{isZh ? '掃描連接' : 'Scan to Connect'}</h3>
            <div className="inline-flex items-center justify-center w-48 h-48 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 mb-4">
              {connecting ? (
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              ) : isConnected ? (
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              ) : (
                <QrCode className="w-20 h-20 text-slate-300" />
              )}
            </div>
            <p className="text-sm text-slate-500">
              {connecting ? (isZh ? '正在連接...' : 'Connecting...') :
               isConnected ? (isZh ? '連接成功' : 'Connection established') :
               (isZh ? '使用 iAM Smart 掃描 QR 碼以連接' : 'Scan with iAM Smart to connect')}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">{isZh ? '連接說明' : 'Connection Instructions'}</h3>
            <ol className="space-y-4">
              {[
                isZh ? '確保您已註冊 CorpID' : 'Ensure you have registered for CorpID',
                isZh ? '打開 iAM Smart 應用程式' : 'Open the iAM Smart mobile app',
                isZh ? '掃描左側 QR 碼' : 'Scan the QR code on the left',
                isZh ? '確認連接請求' : 'Confirm the connection request',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <span className="text-sm text-slate-700 pt-1">{step}</span>
                </li>
              ))}
            </ol>
            {!isConnected && (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
              >
                {connecting ? <><Loader2 className="w-5 h-5 animate-spin" /> {isZh ? '連接中...' : 'Connecting...'}</> : <><Link2 className="w-5 h-5" /> {isZh ? '連接 CorpID' : 'Connect CorpID'}</>}
              </button>
            )}
          </div>
        </div>

        {/* Polling indicator */}
        {status === 'pending' && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
            <RefreshCw className="w-4 h-4 animate-spin" />
            {isZh ? '正在檢查連接狀態...' : 'Checking connection status...'}
          </div>
        )}
      </div>
    </div>
  );
};

export default CorpIDPage;
