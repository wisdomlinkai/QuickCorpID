/**
 * Organisation Management Page
 * 
 * Create, manage, and switch between organisations
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { organisationApi, type Organisation, type OrganisationMember } from '../lib/api';
import {
  Building2,
  Plus,
  Users,
  Settings,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  X,
  Shield,
  UserCheck,
  Clock,
} from 'lucide-react';

export default function OrganisationPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organisation | null>(null);
  const [members, setMembers] = useState<OrganisationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Load organisations
  useEffect(() => {
    loadOrganisations();
  }, []);

  const loadOrganisations = async () => {
    setLoading(true);
    const { data, error } = await organisationApi.list();
    if (error) {
      setError(error.message);
    } else if (data) {
      setOrganisations(data);
      if (data.length > 0 && !selectedOrg) {
        setSelectedOrg(data[0]);
        loadMembers(data[0].id);
      }
    }
    setLoading(false);
  };

  const loadMembers = async (orgId: string) => {
    const { data, error } = await organisationApi.listMembers(orgId);
    if (data) {
      setMembers(data);
    }
  };

  const handleSelectOrg = (org: Organisation) => {
    setSelectedOrg(org);
    loadMembers(org.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">{language === 'zh' ? '載入中...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            {language === 'zh' ? '組織管理' : 'Organisation Management'}
          </h1>
          <p className="mt-2 text-slate-600">
            {language === 'zh'
              ? '管理您的企業和團隊成員'
              : 'Manage your organisations and team members'}
          </p>
        </div>

        {organisations.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">
              {language === 'zh' ? '建立您的第一個組織' : 'Create Your First Organisation'}
            </h2>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              {language === 'zh'
                ? '開始使用 QuickCorpID，您需要建立一個組織來管理您的企業身份和文件。'
                : 'Get started with QuickCorpID by creating an organisation to manage your business identity and documents.'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800"
            >
              <Plus className="w-5 h-5" />
              {language === 'zh' ? '建立組織' : 'Create Organisation'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Organisation List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">
                    {language === 'zh' ? '我的組織' : 'My Organisations'}
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title={language === 'zh' ? '建立組織' : 'Create Organisation'}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {organisations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => handleSelectOrg(org)}
                      className={`w-full px-6 py-4 text-left hover:bg-slate-50 transition-colors ${
                        selectedOrg?.id === org.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900">{org.name}</h3>
                          <p className="text-sm text-slate-500 mt-1">BR: {org.br_number}</p>
                          {org.corp_id_connected && (
                            <span className="inline-flex items-center gap-1 mt-2 text-xs text-emerald-600">
                              <CheckCircle2 className="w-3 h-3" />
                              CorpID {language === 'zh' ? '已連接' : 'Connected'}
                            </span>
                          )}
                        </div>
                        <MoreVertical className="w-5 h-5 text-slate-400" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Organisation Details */}
            <div className="lg:col-span-2">
              {selectedOrg && (
                <div className="space-y-6">
                  {/* Org Info Card */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-semibold text-slate-900">{selectedOrg.name}</h2>
                        <p className="text-slate-600 mt-1">
                          {language === 'zh' ? '商業登記號碼：' : 'BR Number: '}
                          {selectedOrg.br_number}
                        </p>
                        {selectedOrg.cr_number && (
                          <p className="text-slate-600">
                            {language === 'zh' ? '公司註冊編號：' : 'CR Number: '}
                            {selectedOrg.cr_number}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/settings/organisation/${selectedOrg.id}`)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-slate-50 rounded-xl p-4 text-center">
                        <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-slate-900">{members.length}</p>
                        <p className="text-sm text-slate-600">
                          {language === 'zh' ? '成員' : 'Members'}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 text-center">
                        <Shield className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-slate-900">
                          {members.filter((m) => m.role === 'owner' || m.role === 'admin').length}
                        </p>
                        <p className="text-sm text-slate-600">
                          {language === 'zh' ? '管理員' : 'Admins'}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 text-center">
                        <Clock className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-slate-900">
                          {members.filter((m) => m.status === 'pending').length}
                        </p>
                        <p className="text-sm text-slate-600">
                          {language === 'zh' ? '待處理' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Team Members Card */}
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">
                        {language === 'zh' ? '團隊成員' : 'Team Members'}
                      </h3>
                      <button
                        onClick={() => setShowInviteModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                      >
                        <Mail className="w-4 h-4" />
                        {language === 'zh' ? '邀請成員' : 'Invite Member'}
                      </button>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {members.map((member) => (
                        <div key={member.id} className="px-6 py-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {(member.full_name || member.email || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">
                                {member.full_name || member.email}
                              </p>
                              <p className="text-sm text-slate-500">{member.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                member.role === 'owner'
                                  ? 'bg-purple-100 text-purple-700'
                                  : member.role === 'admin'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {member.role === 'owner'
                                ? language === 'zh'
                                  ? '擁有人'
                                  : 'Owner'
                                : member.role === 'admin'
                                ? language === 'zh'
                                  ? '管理員'
                                  : 'Admin'
                                : member.role === 'authorised_rep'
                                ? language === 'zh'
                                  ? '授權代表'
                                  : 'Authorised Rep'
                                : language === 'zh'
                                ? '檢視者'
                                : 'Viewer'}
                            </span>
                            {member.status === 'pending' && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                {language === 'zh' ? '待處理' : 'Pending'}
                              </span>
                            )}
                            {member.status === 'active' && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Organisation Modal */}
        {showCreateModal && (
          <CreateOrganisationModal
            language={language}
            onClose={() => setShowCreateModal(false)}
            onSuccess={(org) => {
              setOrganisations([...organisations, org]);
              setSelectedOrg(org);
              loadMembers(org.id);
              setShowCreateModal(false);
            }}
          />
        )}

        {/* Invite Member Modal */}
        {showInviteModal && selectedOrg && (
          <InviteMemberModal
            language={language}
            orgId={selectedOrg.id}
            onClose={() => setShowInviteModal(false)}
            onSuccess={(member) => {
              setMembers([...members, member]);
              setShowInviteModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Create Organisation Modal
function CreateOrganisationModal({
  language,
  onClose,
  onSuccess,
}: {
  language: string;
  onClose: () => void;
  onSuccess: (org: Organisation) => void;
}) {
  const [name, setName] = useState('');
  const [brNumber, setBrNumber] = useState('');
  const [crNumber, setCrNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !brNumber) {
      setError(language === 'zh' ? '請填寫必填欄位' : 'Please fill in required fields');
      return;
    }

    setLoading(true);
    const { data, error: apiError } = await organisationApi.create({
      name,
      br_number: brNumber,
      cr_number: crNumber || undefined,
    });

    if (apiError) {
      setError(apiError.message);
    } else if (data) {
      onSuccess(data);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            {language === 'zh' ? '建立新組織' : 'Create New Organisation'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {language === 'zh' ? '組織名稱' : 'Organisation Name'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder={language === 'zh' ? '公司名稱' : 'Company name'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {language === 'zh' ? '商業登記號碼' : 'BR Number'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={brNumber}
              onChange={(e) => setBrNumber(e.target.value.replace(/\D/g, '').slice(0, 8))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="12345678"
              maxLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {language === 'zh' ? '公司註冊編號' : 'CR Number'}
            </label>
            <input
              type="text"
              value={crNumber}
              onChange={(e) => setCrNumber(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder={language === 'zh' ? '選填' : 'Optional'}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50"
            >
              {language === 'zh' ? '取消' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : language === 'zh' ? (
                '建立'
              ) : (
                'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Invite Member Modal
function InviteMemberModal({
  language,
  orgId,
  onClose,
  onSuccess,
}: {
  language: string;
  orgId: string;
  onClose: () => void;
  onSuccess: (member: OrganisationMember) => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'authorised_rep' | 'viewer'>('viewer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError(language === 'zh' ? '請輸入電郵地址' : 'Please enter email address');
      return;
    }

    setLoading(true);
    const { data, error: apiError } = await organisationApi.inviteMember(orgId, {
      email,
      role,
    });

    if (apiError) {
      setError(apiError.message);
    } else if (data) {
      onSuccess(data);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            {language === 'zh' ? '邀請團隊成員' : 'Invite Team Member'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {language === 'zh' ? '電郵地址' : 'Email Address'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="colleague@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {language === 'zh' ? '角色' : 'Role'}
            </label>
            <div className="space-y-2">
              {[
                {
                  value: 'admin',
                  label: language === 'zh' ? '管理員' : 'Admin',
                  desc: language === 'zh' ? '可管理成員和設定' : 'Can manage members and settings',
                },
                {
                  value: 'authorised_rep',
                  label: language === 'zh' ? '授權代表' : 'Authorised Representative',
                  desc: language === 'zh' ? '可簽署文件' : 'Can sign documents',
                },
                {
                  value: 'viewer',
                  label: language === 'zh' ? '檢視者' : 'Viewer',
                  desc: language === 'zh' ? '唯讀權限' : 'Read-only access',
                },
              ].map((r) => (
                <label
                  key={r.value}
                  className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                    role === r.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={role === r.value}
                    onChange={() => setRole(r.value as any)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-slate-900">{r.label}</p>
                    <p className="text-sm text-slate-500">{r.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50"
            >
              {language === 'zh' ? '取消' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : language === 'zh' ? (
                '發送邀請'
              ) : (
                'Send Invite'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
