import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import {
  FileText, Users, Building2, ShieldCheck, Upload, Link2, UserPlus,
  Clock, ArrowRight, Sparkles, CheckCircle2, AlertCircle
} from 'lucide-react';

type DashboardData = {
  corpIdStatus: string;
  referenceNumber: string | null;
  submittedAt: string | null;
  documentCount: number;
  orgCount: number;
  memberCount: number;
  activities: { id: string; action: string; description: string | null; created_at: string }[];
};

const DashboardPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const { data: orgs } = await supabase
          .from('organisations')
          .select('id, name_en')
          .eq('created_by', user.id);

        const orgIds = (orgs ?? []).map(o => o.id);

        let registration: { status: string; reference_number: string | null; submitted_at: string | null } | null = null;
        let docCount = 0;
        let memberCount = 0;

        if (orgIds.length > 0) {
          const { data: reg } = await supabase
            .from('registrations')
            .select('status, reference_number, submitted_at')
            .in('organisation_id', orgIds)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          registration = reg;

          const { count: docs } = await supabase
            .from('documents')
            .select('id', { count: 'exact', head: true })
            .in('organisation_id', orgIds);

          docCount = docs ?? 0;

          const { count: members } = await supabase
            .from('organisation_members')
            .select('id', { count: 'exact', head: true })
            .in('organisation_id', orgIds);

          memberCount = members ?? 0;
        }

        const { data: activities } = await supabase
          .from('activities')
          .select('id, action, description, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        setData({
          corpIdStatus: registration?.status ?? 'draft',
          referenceNumber: registration?.reference_number ?? null,
          submittedAt: registration?.submitted_at ?? null,
          documentCount: docCount,
          orgCount: orgs?.length ?? 0,
          memberCount,
          activities: activities ?? [],
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 pt-32">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    pending: 'bg-amber-100 text-amber-700',
    processing: 'bg-blue-100 text-blue-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
  };

  const stats = [
    { label: t.dashboard.corpIdStatus, value: t.dashboard.status[data.corpIdStatus as keyof typeof t.dashboard.status] ?? data.corpIdStatus, icon: ShieldCheck, color: 'from-blue-500 to-blue-600', badge: true, badgeClass: statusColors[data.corpIdStatus] },
    { label: t.footer.product === '產品' ? '文件' : 'Documents', value: String(data.documentCount), icon: FileText, color: 'from-teal-500 to-teal-600' },
    { label: t.nav.dashboard === '儀表板' ? '組織' : 'Organisations', value: String(data.orgCount), icon: Building2, color: 'from-slate-500 to-slate-600' },
    { label: t.nav.dashboard === '儀表板' ? '團隊成員' : 'Team Members', value: String(data.memberCount), icon: Users, color: 'from-purple-500 to-purple-600' },
  ];

  const quickActions = [
    { label: t.dashboard.actions.viewDocs, desc: t.dashboard.actions.viewDocsDesc, icon: Upload, to: '/documents', color: 'from-blue-500 to-blue-600' },
    { label: t.nav.dashboard === '儀表板' ? '連接 CorpID' : 'Connect CorpID', desc: t.nav.dashboard === '儀表板' ? '連接您的 CorpID' : 'Link your CorpID', icon: Link2, to: '/corpid', color: 'from-teal-500 to-teal-600' },
    { label: t.dashboard.remindersItems[1], desc: t.nav.dashboard === '儀表板' ? '邀請成員加入' : 'Invite members to join', icon: UserPlus, to: '/organisations', color: 'from-slate-500 to-slate-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">{t.dashboard.welcome}</h1>
          <p className="text-slate-500 mt-1">{user?.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                {stat.badge && (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${stat.badgeClass}`}>
                    {stat.value}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">{stat.label}</p>
              {!stat.badge && <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>}
            </div>
          ))}
        </div>

        {/* CorpID Status Card */}
        {data.referenceNumber && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{t.dashboard.refNumber}</p>
                  <p className="text-lg font-bold text-slate-900">{data.referenceNumber}</p>
                </div>
              </div>
              {data.submittedAt && (
                <div className="text-sm text-slate-500">
                  {t.dashboard.submittedOn}: {new Date(data.submittedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">{t.dashboard.quickActions}</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {quickActions.map((action, i) => (
              <Link
                key={i}
                to={action.to}
                className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:border-blue-200 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{action.label}</h3>
                <p className="text-sm text-slate-500">{action.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Reminders + Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Reminders */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4">{t.dashboard.reminders}</h2>
            <ul className="space-y-3">
              {t.dashboard.remindersItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4">{t.nav.dashboard === '儀表板' ? '近期活動' : 'Recent Activity'}</h2>
            {data.activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm text-slate-400">{t.nav.dashboard === '儀表板' ? '暫無活動記錄' : 'No recent activity'}</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {data.activities.map((activity) => (
                  <li key={activity.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-700">{activity.description ?? activity.action}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{new Date(activity.created_at).toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Upgrade Banner */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{t.dashboard.upgradeBanner.title}</h3>
              <p className="text-blue-100 text-sm">{t.dashboard.upgradeBanner.desc}</p>
            </div>
          </div>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
          >
            {t.dashboard.upgradeBanner.btn}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
