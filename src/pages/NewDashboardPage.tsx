/**
 * Dashboard Page
 * 
 * Main dashboard with overview of organisations, documents, and CorpID connections
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { organisationApi, documentApi, corpidApi, type Organisation, type Document } from '../lib/api';
import {
  Building2,
  FileText,
  Link2,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  TrendingUp,
  Users,
  Shield,
} from 'lucide-react';

export default function NewDashboardPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load organisations
      const orgResult = await organisationApi.list();
      if (orgResult.data) {
        setOrganisations(orgResult.data);
        
        // Load documents for first org
        if (orgResult.data.length > 0) {
          const docResult = await documentApi.list(orgResult.data[0].id, 1, 5);
          if (docResult.data) {
            setDocuments(docResult.data.documents);
          }
        }
      }
    } catch (err) {
      setError('Failed to load dashboard data');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const stats = [
    {
      label: language === 'zh' ? '組織' : 'Organisations',
      value: organisations.length,
      icon: Building2,
      color: 'blue',
      link: '/organisations',
    },
    {
      label: language === 'zh' ? '文件' : 'Documents',
      value: documents.length,
      icon: FileText,
      color: 'teal',
      link: '/documents',
    },
    {
      label: language === 'zh' ? 'CorpID 連接' : 'CorpID Connections',
      value: organisations.filter((o) => o.corp_id_connected).length,
      icon: Link2,
      color: 'purple',
      link: '/corpid',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            {language === 'zh' ? '儀表板' : 'Dashboard'}
          </h1>
          <p className="mt-2 text-slate-600">
            {language === 'zh'
              ? `歡迎回來，${user?.username || '用戶'}`
              : `Welcome back, ${user?.username || 'User'}`}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.label}
                to={stat.link}
                className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-${stat.color}-100 flex items-center justify-center`}
                  >
                    <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Organisations Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                {language === 'zh' ? '我的組織' : 'My Organisations'}
              </h2>
              <Link
                to="/organisations"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {language === 'zh' ? '查看全部' : 'View All'} →
              </Link>
            </div>

            {organisations.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">
                  {language === 'zh'
                    ? '您還沒有建立任何組織'
                    : "You haven't created any organisations yet"}
                </p>
                <button
                  onClick={() => navigate('/organisations')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  {language === 'zh' ? '建立組織' : 'Create Organisation'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {organisations.slice(0, 3).map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-500 rounded-lg flex items-center justify-center text-white font-semibold">
                        {org.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{org.name}</p>
                        <p className="text-sm text-slate-500">BR: {org.br_number}</p>
                      </div>
                    </div>
                    {org.corp_id_connected && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        CorpID
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Documents Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                {language === 'zh' ? '最近文件' : 'Recent Documents'}
              </h2>
              <Link
                to="/documents"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {language === 'zh' ? '查看全部' : 'View All'} →
              </Link>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">
                  {language === 'zh'
                    ? '您還沒有上傳任何文件'
                    : "You haven't uploaded any documents yet"}
                </p>
                <button
                  onClick={() => navigate('/documents')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700"
                >
                  <Plus className="w-4 h-4" />
                  {language === 'zh' ? '上傳文件' : 'Upload Document'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-emerald-500 rounded-lg flex items-center justify-center text-white">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{doc.title}</p>
                        <p className="text-sm text-slate-500">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        doc.status === 'uploaded'
                          ? 'bg-emerald-100 text-emerald-700'
                          : doc.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CorpID Connection Banner */}
        {organisations.length > 0 && organisations.filter((o) => !o.corp_id_connected).length > 0 && (
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 md:p-8 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {language === 'zh' ? '連接您的 CorpID' : 'Connect Your CorpID'}
                  </h3>
                  <p className="text-purple-100">
                    {language === 'zh'
                      ? '使用 CorpID 解鎖數碼簽署、文件管理等功能'
                      : 'Unlock digital signing, document management, and more with CorpID'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/corpid')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 font-semibold rounded-xl hover:bg-purple-50"
              >
                {language === 'zh' ? '開始連接' : 'Connect Now'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
