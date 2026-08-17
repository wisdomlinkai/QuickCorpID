import { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import {
  Building2, Plus, X, Users, Crown, Mail, AlertCircle, Loader2
} from 'lucide-react';

type Org = {
  id: string;
  name_en: string | null;
  name_zh: string | null;
  br_number: string | null;
  business_type: string | null;
  created_at: string;
  role: string;
  member_count: number;
};

const OrganisationsPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ nameEn: '', nameZh: '', brNumber: '', businessType: '' });
  const [submitting, setSubmitting] = useState(false);

  const isZh = t.nav.home === '首頁';

  const loadOrgs = async () => {
    if (!user) return;
    try {
      const { data: memberships } = await supabase
        .from('organisation_members')
        .select('organisation_id, role')
        .eq('user_id', user.id);

      const orgIds = (memberships ?? []).map(m => m.organisation_id);
      if (orgIds.length === 0) {
        setOrgs([]);
        return;
      }

      const { data: orgData } = await supabase
        .from('organisations')
        .select('id, name_en, name_zh, br_number, business_type, created_at')
        .in('id', orgIds);

      const memberCounts = await Promise.all(
        orgIds.map(async (orgId) => {
          const { count } = await supabase
            .from('organisation_members')
            .select('id', { count: 'exact', head: true })
            .eq('organisation_id', orgId);
          return { orgId, count: count ?? 0 };
        })
      );

      const countMap = new Map(memberCounts.map(m => [m.orgId, m.count]));
      const roleMap = new Map((memberships ?? []).map(m => [m.organisation_id, m.role]));

      setOrgs((orgData ?? []).map(o => ({
        ...o,
        role: roleMap.get(o.id) ?? 'member',
        member_count: countMap.get(o.id) ?? 0,
      })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrgs(); }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { data: orgData, error: orgError } = await supabase
        .from('organisations')
        .insert({
          name_en: form.nameEn,
          name_zh: form.nameZh || null,
          br_number: form.brNumber || null,
          business_type: form.businessType || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      await supabase.from('organisation_members').insert({
        organisation_id: orgData.id,
        user_id: user?.id,
        role: 'owner',
      });

      await supabase.from('activities').insert({
        user_id: user?.id,
        organisation_id: orgData.id,
        action: 'org_created',
        description: `Created organisation ${form.nameEn}`,
      });

      setForm({ nameEn: '', nameZh: '', brNumber: '', businessType: '' });
      setShowCreate(false);
      await loadOrgs();
    } catch (err) {
      setError(err instanceof Error ? err.message : isZh ? '創建失敗' : 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 pt-32">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{isZh ? '組織' : 'Organisations'}</h1>
            <p className="text-slate-500 mt-1">{isZh ? '管理您的企業組織' : 'Manage your business organisations'}</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            {isZh ? '創建組織' : 'Create Organisation'}
          </button>
        </div>

        {orgs.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
              <Building2 className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{isZh ? '尚無組織' : 'No organisations yet'}</h3>
            <p className="text-slate-500 mb-6">{isZh ? '創建您的第一個組織以開始使用' : 'Create your first organisation to get started'}</p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-5 h-5" />
              {isZh ? '創建組織' : 'Create Organisation'}
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orgs.map((org) => (
              <div key={org.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  {org.role === 'owner' && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                      <Crown className="w-3 h-3" />
                      {isZh ? '擁有人' : 'Owner'}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{org.name_en ?? org.name_zh ?? 'Untitled'}</h3>
                {org.name_zh && org.name_en && <p className="text-sm text-slate-500 mb-3">{org.name_zh}</p>}
                <div className="space-y-2 text-sm">
                  {org.br_number && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="text-slate-400">{isZh ? 'BR號碼' : 'BR No.'}:</span>
                      <span className="font-medium">{org.br_number}</span>
                    </div>
                  )}
                  {org.business_type && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="text-slate-400">{isZh ? '類型' : 'Type'}:</span>
                      <span className="font-medium">{org.business_type}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{org.member_count} {isZh ? '成員' : 'members'}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setShowInvite(org.id); setInviteEmail(''); }}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-all text-sm"
                >
                  <Mail className="w-4 h-4" />
                  {isZh ? '邀請成員' : 'Invite Member'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">{isZh ? '創建組織' : 'Create Organisation'}</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            {error && (
              <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{isZh ? '公司名稱（英文）' : 'Company Name (English)'}</label>
                <input type="text" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{isZh ? '公司名稱（中文）' : 'Company Name (Chinese)'}</label>
                <input type="text" value={form.nameZh} onChange={(e) => setForm({ ...form, nameZh: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{isZh ? 'BR號碼' : 'BR Number'}</label>
                <input type="text" value={form.brNumber} onChange={(e) => setForm({ ...form, brNumber: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{isZh ? '業務類型' : 'Business Type'}</label>
                <select value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white">
                  <option value="">--</option>
                  {t.register.step1.businessTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <button type="submit" disabled={submitting} className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isZh ? '創建' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowInvite(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">{isZh ? '邀請成員' : 'Invite Member'}</h2>
              <button onClick={() => setShowInvite(null)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-700">{isZh ? '輸入成員的電郵地址以發送邀請。' : 'Enter the member\'s email address to send an invitation.'}</p>
            </div>
            <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="name@business.hk" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all mb-4" />
            <button onClick={() => setShowInvite(null)} className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
              {isZh ? '發送邀請' : 'Send Invitation'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganisationsPage;
