/**
 * Documents Page
 * 
 * Upload, manage, and share documents with S3 integration
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { organisationApi, documentApi, type Organisation, type Document } from '../lib/api';
import {
  FileText,
  Upload,
  Download,
  Share2,
  Trash2,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Loader2,
  File,
  FileCheck,
  Clock,
  X,
  Mail,
  Copy,
} from 'lucide-react';

export default function DocumentsPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organisation | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  useEffect(() => {
    loadOrganisations();
  }, []);

  const loadOrganisations = async () => {
    setLoading(true);
    const { data } = await organisationApi.list();
    if (data && data.length > 0) {
      setOrganisations(data);
      setSelectedOrg(data[0]);
      loadDocuments(data[0].id);
    } else {
      setLoading(false);
    }
  };

  const loadDocuments = async (orgId: string) => {
    const { data } = await documentApi.list(orgId);
    if (data) {
      setDocuments(data.documents);
    }
    setLoading(false);
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedOrg) return;

    setUploading(true);
    setError('');

    try {
      // Step 1: Create document metadata
      const { data: docData, error: createError } = await documentApi.create(selectedOrg.id, {
        title: file.name,
        type: getDocumentType(file.name),
      });

      if (createError || !docData) {
        throw new Error(createError?.message || 'Failed to create document');
      }

      // Step 2: Get upload URL
      const { data: urlData, error: urlError } = await documentApi.getUploadUrl(
        selectedOrg.id,
        docData.id
      );

      if (urlError || !urlData) {
        throw new Error(urlError?.message || 'Failed to get upload URL');
      }

      // Step 3: Upload file to S3
      const { error: uploadError } = await documentApi.uploadFile(urlData.upload_url, file);

      if (uploadError) {
        throw new Error(uploadError.message || 'Failed to upload file');
      }

      // Step 4: Confirm upload
      const { error: confirmError } = await documentApi.confirmUpload(selectedOrg.id, docData.id, {
        size_bytes: file.size,
        mime_type: file.type,
      });

      if (confirmError) {
        throw new Error(confirmError.message || 'Failed to confirm upload');
      }

      // Reload documents
      await loadDocuments(selectedOrg.id);
      setShowUploadModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }

    setUploading(false);
  };

  const handleDownload = async (doc: Document) => {
    if (!selectedOrg) return;

    const { data, error } = await documentApi.get(selectedOrg.id, doc.id);
    if (data && data.download_url) {
      window.open(data.download_url, '_blank');
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!selectedOrg) return;

    if (window.confirm(language === 'zh' ? '確定要刪除此文件嗎？' : 'Are you sure you want to delete this document?')) {
      const { error } = await documentApi.delete(selectedOrg.id, doc.id);
      if (!error) {
        setDocuments(documents.filter((d) => d.id !== doc.id));
      }
    }
  };

  const getDocumentType = (filename: string): Document['type'] => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'contract';
    return 'other';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!selectedOrg) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">
              {language === 'zh' ? '尚未有組織' : 'No Organisations Yet'}
            </h2>
            <p className="text-slate-600 mb-6">
              {language === 'zh'
                ? '您需要先建立組織才能管理文件。'
                : 'You need to create an organisation before managing documents.'}
            </p>
            <button
              onClick={() => navigate('/organisations')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700"
            >
              {language === 'zh' ? '建立組織' : 'Create Organisation'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {language === 'zh' ? '文件管理' : 'Document Management'}
            </h1>
            <p className="mt-2 text-slate-600">
              {language === 'zh'
                ? '上傳、管理和分享您的企業文件'
                : 'Upload, manage, and share your business documents'}
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800"
          >
            <Upload className="w-5 h-5" />
            {language === 'zh' ? '上傳文件' : 'Upload Document'}
          </button>
        </div>

        {/* Organisation Selector */}
        {organisations.length > 1 && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
            <select
              value={selectedOrg.id}
              onChange={(e) => {
                const org = organisations.find((o) => o.id === e.target.value);
                setSelectedOrg(org || null);
                if (org) loadDocuments(org.id);
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

        {/* Documents Grid */}
        {documents.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">
              {language === 'zh' ? '尚未有文件' : 'No Documents Yet'}
            </h2>
            <p className="text-slate-600 mb-6">
              {language === 'zh'
                ? '開始上傳您的企業文件，包括合約、決議、稅務文件等。'
                : 'Start uploading your business documents, including contracts, resolutions, tax documents, and more.'}
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700"
            >
              <Upload className="w-5 h-5" />
              {language === 'zh' ? '上傳第一個文件' : 'Upload Your First Document'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-xl hover:border-blue-200 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <File className="w-7 h-7" />
                  </div>
                  <div className="flex items-center gap-1">
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
                </div>

                <h3 className="font-semibold text-slate-900 mb-2 truncate">{doc.title}</h3>

                <div className="space-y-1 text-sm text-slate-500 mb-4">
                  <p>
                    {language === 'zh' ? '類型：' : 'Type: '}
                    {doc.type}
                  </p>
                  <p>
                    {language === 'zh' ? '大小：' : 'Size: '}
                    {formatFileSize(doc.size_bytes)}
                  </p>
                  <p>
                    {language === 'zh' ? '版本：' : 'Version: '}
                    v{doc.version}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(doc)}
                    disabled={doc.status !== 'uploaded'}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    {language === 'zh' ? '下載' : 'Download'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDoc(doc);
                      setShowShareModal(true);
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                {language === 'zh' ? '上傳文件' : 'Upload Document'}
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2 mb-4">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
            >
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-2">
                {language === 'zh' ? '點擊或拖放文件' : 'Click or drag and drop files'}
              </p>
              <p className="text-sm text-slate-400">
                {language === 'zh' ? '支援 PDF, DOC, DOCX, JPG, PNG' : 'Supports PDF, DOC, DOCX, JPG, PNG'}
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="hidden"
            />

            {uploading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{language === 'zh' ? '上傳中...' : 'Uploading...'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                {language === 'zh' ? '分享文件' : 'Share Document'}
              </h2>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setSelectedDoc(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="font-medium text-slate-900">{selectedDoc.title}</p>
              <p className="text-sm text-slate-500 mt-1">
                {language === 'zh' ? '文件 ID：' : 'Document ID: '}
                {selectedDoc.id}
              </p>
            </div>

            <div className="space-y-4">
              <button className="w-full flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <Mail className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <p className="font-medium text-slate-900">
                    {language === 'zh' ? '通過電郵分享' : 'Share via Email'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {language === 'zh' ? '發送文件連結到電郵' : 'Send document link via email'}
                  </p>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <Copy className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <p className="font-medium text-slate-900">
                    {language === 'zh' ? '複製連結' : 'Copy Link'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {language === 'zh' ? '複製文件連結到剪貼板' : 'Copy document link to clipboard'}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
