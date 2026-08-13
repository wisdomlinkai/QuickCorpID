/**
 * CorpID Connection Page
 * 
 * Manage CorpID connections for organisations
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { organisationApi, corpidApi, type Organisation, type CorpIDQRCode } from '../lib/api';
import {
  Link2,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  Clock,
  RefreshCw,
  ExternalLink,
  X,
} from 'lucide-react';

export default function CorpIDPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organisation | null>(null);
  const [qrCode, setQrCode] = useState<CorpIDQRCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    loadOrganisations();
  }, []);

  const loadOrganisations = async () => {
    setLoading(true);
    const { data, error } = await organisationApi.list();
    if (data) {
      setOrganisations(data);
      if (data.length > 0) {
        setSelectedOrg(data[0]);
      }
    }
    setLoading(false);
  };

  // Poll for connection status
  const pollConnectionStatus = useCallback(async (orgId: string) => {
    setPolling(true);
    const interval = setInterval(async () => {
      const { data } = await corpidApi.checkConnection(orgId);
      if (data && data.status === 'connected') {
        clearInterval(interval);
        setPolling(false);
        setShowQRModal(false);
        setQrCode(null);
        loadOrganisations();
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      setPolling(false);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    if (!selectedOrg) return;

    setConnecting(true);
    setError('');

    const { data, error: apiError } = await corpidApi.initiateConnection(selectedOrg.id);

    if (apiError) {
      setError(apiError.message);
      setConnecting(false);
    } else if (data) {
      setQrCode(data);
      setShowQRModal(true);
      setConnecting(false);
      pollConnectionStatus(selectedOrg.id);
    }
  };

  const handleDisconnect = async () => {
    if (!selectedOrg) return;

    if (window.confirm(language === 'zh' ? '確定要斷開 CorpID 連接嗎？' : 'Are you sure you want to disconnect CorpID?')) {
      const { error } = await corpidApi.disconnect(selectedOrg.id);
      if (!error) {
        loadOrganisations();
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            {language === 'zh' ? 'CorpID 連接' : 'CorpID Connection'}
          </h1>
          <p className="mt-2 text-slate-600">
            {language === 'zh'
              ? '使用 CorpID 解鎖數碼簽署、文件管理等功能'
              : 'Unlock digital signing, document management, and more with CorpID'}
          </p>
        </div>

        {/* Organisation Selector */}
        {organisations.length > 1 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {language === 'zh' ? '選擇組織' : 'Select Organisation'}
            </label>
            <select
              value={selectedOrg?.id || ''}
              onChange={(e) => {
                const org = organisations.find((o) => o.id === e.target.value);
                setSelectedOrg(org || null);
              }}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              {organisations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} - BR: {org.br_number}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedOrg ? (
          <div className="space-y-6">
            {/* Connection Status Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{selectedOrg.name}</h2>
                  <p className="text-slate-600 mt-1">BR: {selectedOrg.br_number}</p>
                </div>
                {selectedOrg.corp_id_connected ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 font-medium rounded-full">
                    <CheckCircle2 className="w-5 h-5" />
                    {language === 'zh' ? '已連接' : 'Connected'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-full">
                    <Link2 className="w-5 h-5" />
                    {language === 'zh' ? '未連接' : 'Not Connected'}
                  </span>
                )}
              </div>

              {selectedOrg.corp_id_connected ? (
                /* Connected State */
                <div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-emerald-900 mb-1">
                          {language === 'zh' ? 'CorpID 已連接' : 'CorpID Connected'}
                        </h3>
                        <p className="text-sm text-emerald-700">
                          {language === 'zh'
                            ? '您的組織已成功連接到 CorpID。現在可以使用數碼簽署等功能。'
                            : 'Your organisation is successfully connected to CorpID. You can now use digital signing and other features.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                      <p className="text-sm text-slate-600 mb-1">
                        {language === 'zh' ? '數碼簽署' : 'Digital Signing'}
                      </p>
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                      <p className="text-sm text-slate-600 mb-1">
                        {language === 'zh' ? '文件管理' : 'Document Management'}
                      </p>
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                      <p className="text-sm text-slate-600 mb-1">
                        {language === 'zh' ? '身份驗證' : 'Identity Verification'}
                      </p>
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    </div>
                  </div>

                  <button
                    onClick={handleDisconnect}
                    className="w-full px-6 py-3 border border-red-300 text-red-600 font-medium rounded-xl hover:bg-red-50"
                  >
                    {language === 'zh' ? '斷開連接' : 'Disconnect CorpID'}
                  </button>
                </div>
              ) : (
                /* Not Connected State */
                <div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                        <QrCode className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 mb-1">
                          {language === 'zh' ? '連接 CorpID' : 'Connect CorpID'}
                        </h3>
                        <p className="text-sm text-blue-700">
                          {language === 'zh'
                            ? '使用香港政府 CorpID 應用程式掃描 QR 碼以連接您的企業。'
                            : 'Scan the QR code using the Hong Kong Government CorpID app to connect your business.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2 mb-6">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{language === 'zh' ? '連接中...' : 'Connecting...'}</span>
                      </>
                    ) : (
                      <>
                        <QrCode className="w-5 h-5" />
                        <span>{language === 'zh' ? '顯示 QR 碼' : 'Show QR Code'}</span>
                      </>
                    )}
                  </button>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-slate-600 mb-2">
                      {language === 'zh' ? '還沒有 CorpID 應用程式？' : "Don't have the CorpID app?"}
                    </p>
                    <a
                      href="https://www.corpid.gov.hk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      {language === 'zh' ? '下載應用程式' : 'Download the app'}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Help Section */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 mb-4">
                {language === 'zh' ? '常見問題' : 'FAQ'}
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-800 mb-1">
                    {language === 'zh' ? '什麼是 CorpID？' : 'What is CorpID?'}
                  </h4>
                  <p className="text-sm text-slate-600">
                    {language === 'zh'
                      ? 'CorpID 是香港政府推出的數碼企業身份，讓企業可以安全地進行網上身份驗證和電子簽署。'
                      : 'CorpID is a digital business identity launched by the Hong Kong Government, allowing businesses to securely verify identity and sign documents online.'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 mb-1">
                    {language === 'zh' ? '如何連接 CorpID？' : 'How do I connect CorpID?'}
                  </h4>
                  <p className="text-sm text-slate-600">
                    {language === 'zh'
                      ? '點擊「顯示 QR 碼」按鈕，然後使用 CorpID 應用程式掃描 QR 碼即可完成連接。'
                      : 'Click the "Show QR Code" button, then scan the QR code using the CorpID app to complete the connection.'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 mb-1">
                    {language === 'zh' ? '連接後可以做什么？' : 'What can I do after connecting?'}
                  </h4>
                  <p className="text-sm text-slate-600">
                    {language === 'zh'
                      ? '連接後您可以使用數碼簽署、安全文件管理、以及與政府部門的電子服務整合。'
                      : 'After connecting, you can use digital signing, secure document management, and integrate with government e-services.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* No Organisations State */
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">
              {language === 'zh' ? '尚未有組織' : 'No Organisations Yet'}
            </h2>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              {language === 'zh'
                ? '您需要先建立組織才能連接 CorpID。'
                : 'You need to create an organisation before connecting CorpID.'}
            </p>
            <button
              onClick={() => navigate('/organisations')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700"
            >
              {language === 'zh' ? '建立組織' : 'Create Organisation'}
            </button>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && qrCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => {
                setShowQRModal(false);
                setQrCode(null);
                setPolling(false);
              }}
              className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-teal-100 rounded-full flex items-center justify-center">
                <QrCode className="w-8 h-8 text-blue-600" />
              </div>

              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {language === 'zh' ? '掃描 QR 碼' : 'Scan QR Code'}
              </h3>

              <p className="text-slate-600 mb-6">
                {language === 'zh'
                  ? '使用 CorpID 應用程式掃描此 QR 碼以連接您的企業'
                  : 'Scan this QR code with your CorpID app to connect your business'}
              </p>

              {/* QR Code Image */}
              <div className="bg-white p-4 rounded-xl border-2 border-slate-200 mb-4 inline-block">
                <img
                  src={qrCode.qr_code_url}
                  alt="CorpID QR Code"
                  className="w-64 h-64"
                />
              </div>

              {polling && (
                <div className="flex items-center justify-center gap-2 text-sm text-blue-600 mb-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{language === 'zh' ? '等待連接...' : 'Waiting for connection...'}</span>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <Clock className="w-4 h-4" />
                <span>
                  {language === 'zh' ? 'QR 碼將在 ' : 'QR code expires in '}
                  {Math.max(0, Math.floor((new Date(qrCode.expires_at).getTime() - Date.now()) / 60000))}
                  {language === 'zh' ? ' 分鐘後過期' : ' minutes'}
                </span>
              </div>

              <button
                onClick={handleConnect}
                className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                {language === 'zh' ? '重新生成 QR 碼' : 'Regenerate QR Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
