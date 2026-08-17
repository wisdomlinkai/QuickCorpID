import { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import {
  FileText, Upload, Download, Share2, Trash2, X, Link as LinkIcon, AlertCircle, Loader2, FileCheck
} from 'lucide-react';

type Doc = {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string | null;
  created_at: string;
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const DocumentsPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareDoc, setShareDoc] = useState<Doc | null>(null);
  const [shareLink, setShareLink] = useState('');
  const isZh = t.nav.home === '首頁';
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data: orgs } = await supabase.from('organisations').select('id').eq('created_by', user.id);
      const firstOrg = orgs?.[0]?.id ?? null;
      setOrgId(firstOrg);
      if (firstOrg) {
        const { data: documents } = await supabase
          .from('documents')
          .select('id, file_name, file_size, file_type, created_at')
          .eq('organisation_id', firstOrg)
          .order('created_at', { ascending: false });
        setDocs(documents ?? []);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !orgId || !user) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const { data, error: insertError } = await supabase.from('documents').insert({
          organisation_id: orgId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: user.id,
        }).select().single();

        if (insertError) throw insertError;

        setDocs(prev => [{ ...data }, ...prev]);
      }

      await supabase.from('activities').insert({
        user_id: user.id,
        organisation_id: orgId,
        action: 'document_uploaded',
        description: `Uploaded ${files.length} document(s)`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : isZh ? '上傳失敗' : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('documents').delete().eq('id', id);
    setDocs(prev => prev.filter(d => d.id !== id));
  };

  const handleShare = (doc: Doc) => {
    setShareDoc(doc);
    setShareLink(`${window.location.origin}/share/${doc.id}`);
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">{isZh ? '文件' : 'Documents'}</h1>
          <p className="text-slate-500 mt-1">{isZh ? '管理您的企業文件' : 'Manage your business documents'}</p>
        </div>

        {!orgId && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">{isZh ? '請先創建組織以管理文件。' : 'Please create an organisation first to manage documents.'}</p>
          </div>
        )}

        {/* Upload Zone */}
        <label className={`block border-2 border-dashed rounded-2xl p-10 text-center transition-all mb-8 ${orgId ? 'border-slate-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer' : 'border-slate-200 opacity-50'}`}>
          <input type="file" className="hidden" multiple accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" onChange={(e) => handleUpload(e.target.files)} disabled={!orgId || uploading} />
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
              <p className="text-slate-600 font-medium">{isZh ? '上傳中...' : 'Uploading...'}</p>
            </div>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 mb-4">
                <Upload className="w-7 h-7 text-blue-600" />
              </div>
              <p className="text-slate-700 font-semibold mb-1">{isZh ? '上傳文件' : 'Upload Document'}</p>
              <p className="text-sm text-slate-500">{isZh ? '拖放或點擊上傳 · JPG, PNG, PDF, DOC (最大 5MB)' : 'Drag & drop or click · JPG, PNG, PDF, DOC (max 5MB)'}</p>
            </>
          )}
        </label>

        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Documents List */}
        {docs.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{isZh ? '尚無文件' : 'No documents yet'}</h3>
            <p className="text-slate-500">{isZh ? '上傳您的第一份文件' : 'Upload your first document to get started'}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {docs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                    <FileCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{doc.file_name}</p>
                    <p className="text-sm text-slate-500">{formatSize(doc.file_size)} · {new Date(doc.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button className="p-2 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" aria-label="Download">
                      <Download className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleShare(doc)} className="p-2 rounded-lg text-slate-400 hover:bg-teal-50 hover:text-teal-600 transition-colors" aria-label="Share">
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(doc.id)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors" aria-label="Delete">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {shareDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShareDoc(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">{isZh ? '分享文件' : 'Share Document'}</h2>
              <button onClick={() => setShareDoc(null)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">{isZh ? '複製以下連結以分享文件：' : 'Copy the link below to share this document:'}</p>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <LinkIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input type="text" value={shareLink} readOnly className="flex-1 bg-transparent text-sm text-slate-700 outline-none" />
              <button onClick={() => navigator.clipboard.writeText(shareLink)} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                {isZh ? '複製' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
