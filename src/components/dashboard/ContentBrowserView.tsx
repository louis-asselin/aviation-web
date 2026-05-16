'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FolderOpen, FileText, Play, Link, Lock, Plus, ChevronRight, ArrowLeft, Star, Trash2 } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://spirited-friendship-production-fb20.up.railway.app';

interface ContentFolder {
  id: string;
  parentId: string | null;
  name: string;
  description: string | null;
  tier: string;
  icon: string | null;
  orderIndex: number;
  isPublished: boolean;
  subfolderCount?: number;
  fileCount?: number;
}

interface ContentFile {
  id: string;
  folderId: string;
  name: string;
  description: string | null;
  fileType: string;
  fileUrl: string | null;
  tier: string;
  orderIndex: number;
  fileSize: number | null;
  isPublished: boolean;
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

export default function ContentBrowserView() {
  const { user, token } = useAuth();
  const [folders, setFolders] = useState<ContentFolder[]>([]);
  const [files, setFiles] = useState<ContentFile[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showCreateFile, setShowCreateFile] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'org_admin';
  const isPremium = (user as any)?.subscriptionTier === 'premium' || isAdmin;

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    loadContent();
  }, [currentFolderId]);

  async function loadContent() {
    setLoading(true);
    try {
      if (currentFolderId) {
        const res = await fetch(`${API}/api/content/folders/${currentFolderId}`, { headers, cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setFolders(data.subfolders || []);
          setFiles(data.files || []);
          setBreadcrumb(data.breadcrumb || []);
        }
      } else {
        const path = isAdmin ? '/api/content/admin/folders' : '/api/content/folders';
        const res = await fetch(`${API}${path}`, { headers, cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setFolders(data);
          setFiles([]);
          setBreadcrumb([]);
        }
      }
    } catch (e) {
      console.error('Load content error:', e);
    }
    setLoading(false);
  }

  async function createFolder(name: string, tier: string) {
    try {
      await fetch(`${API}/api/content/folders`, {
        method: 'POST', headers,
        body: JSON.stringify({ name, tier, parentId: currentFolderId })
      });
      loadContent();
      setShowCreateFolder(false);
    } catch (e) { console.error(e); }
  }

  async function createFile(name: string, fileType: string, fileUrl: string, tier: string) {
    try {
      await fetch(`${API}/api/content/files`, {
        method: 'POST', headers,
        body: JSON.stringify({ folderId: currentFolderId, name, fileType, fileUrl, tier })
      });
      loadContent();
      setShowCreateFile(false);
    } catch (e) { console.error(e); }
  }

  async function deleteFolder(id: string) {
    if (!confirm('Delete this folder and all its contents?')) return;
    await fetch(`${API}/api/content/folders/${id}`, { method: 'DELETE', headers });
    loadContent();
  }

  async function deleteFile(id: string) {
    if (!confirm('Delete this file?')) return;
    await fetch(`${API}/api/content/files/${id}`, { method: 'DELETE', headers });
    loadContent();
  }

  const fileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-500" />;
      case 'video': return <Play className="w-5 h-5 text-blue-500" />;
      case 'link': return <Link className="w-5 h-5 text-green-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {currentFolderId && (
            <button onClick={() => {
              const parentIdx = breadcrumb.length - 2;
              setCurrentFolderId(parentIdx >= 0 ? breadcrumb[parentIdx].id : null);
            }} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Content</h1>
            {breadcrumb.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                <button onClick={() => setCurrentFolderId(null)} className="hover:text-primary-500">Home</button>
                {breadcrumb.map((b, i) => (
                  <span key={b.id} className="flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" />
                    <button
                      onClick={() => setCurrentFolderId(b.id)}
                      className={i === breadcrumb.length - 1 ? 'text-gray-900 font-medium' : 'hover:text-primary-500'}
                    >
                      {b.name}
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => setShowCreateFolder(true)}
              className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
              <Plus className="w-4 h-4" /> New Folder
            </button>
            {currentFolderId && (
              <button onClick={() => setShowCreateFile(true)}
                className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm">
                <Plus className="w-4 h-4" /> New File
              </button>
            )}
          </div>
        )}
      </div>

      {/* Premium banner for basic users */}
      {!isPremium && (
        <div className="mb-6 bg-gradient-to-r from-primary-500 to-primary-400 rounded-xl p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8 text-yellow-300" />
            <div>
              <p className="font-bold">Upgrade to Premium</p>
              <p className="text-sm text-white/80">Unlock all content and features</p>
            </div>
          </div>
          <button className="bg-white text-primary-500 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-gray-100">
            Upgrade
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          {/* Folders */}
          {folders.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
              {folders.map(folder => {
                const locked = folder.tier === 'premium' && !isPremium;
                return (
                  <div key={folder.id}
                    onClick={() => !locked && setCurrentFolderId(folder.id)}
                    className={`p-4 bg-white rounded-xl border hover:shadow-md transition-all cursor-pointer ${locked ? 'opacity-50' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <FolderOpen className={`w-8 h-8 ${folder.tier === 'premium' ? 'text-yellow-500' : 'text-primary-500'}`} />
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          folder.tier === 'premium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {folder.tier.toUpperCase()}
                        </span>
                        {locked && <Lock className="w-3 h-3 text-gray-400" />}
                      </div>
                    </div>
                    <p className="font-semibold text-sm text-gray-900 truncate">{folder.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {folder.subfolderCount ? `${folder.subfolderCount} folders` : ''}
                      {folder.subfolderCount && folder.fileCount ? ' · ' : ''}
                      {folder.fileCount ? `${folder.fileCount} files` : ''}
                    </p>
                    {isAdmin && (
                      <button onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                        className="mt-2 text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Files */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map(file => {
                const locked = file.tier === 'premium' && !isPremium;
                return (
                  <div key={file.id}
                    className={`flex items-center gap-4 p-4 bg-white rounded-xl border hover:shadow-sm ${locked ? 'opacity-50' : ''}`}
                  >
                    {fileIcon(file.fileType)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{file.fileType.toUpperCase()}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      file.tier === 'premium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {file.tier.toUpperCase()}
                    </span>
                    {locked ? (
                      <Lock className="w-4 h-4 text-gray-400" />
                    ) : file.fileUrl ? (
                      <a href={file.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="text-primary-500 text-sm font-medium hover:underline">
                        Open
                      </a>
                    ) : null}
                    {isAdmin && (
                      <button onClick={() => deleteFile(file.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {folders.length === 0 && files.length === 0 && (
            <div className="text-center py-20 text-gray-500">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No content yet</p>
              {isAdmin && <p className="text-sm mt-1">Create folders to organize your content</p>}
            </div>
          )}
        </>
      )}

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <CreateModal title="New Folder" onClose={() => setShowCreateFolder(false)}
          onSubmit={(name, tier) => createFolder(name, tier)} />
      )}

      {/* Create File Modal */}
      {showCreateFile && (
        <CreateFileModal onClose={() => setShowCreateFile(false)} onSubmit={createFile} />
      )}
    </div>
  );
}

function CreateModal({ title, onClose, onSubmit }: { title: string; onClose: () => void; onSubmit: (name: string, tier: string) => void }) {
  const [name, setName] = useState('');
  const [tier, setTier] = useState('basic');
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">{title}</h2>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Folder name"
          className="w-full border rounded-lg px-3 py-2 mb-3" autoFocus />
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTier('basic')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border ${tier === 'basic' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200'}`}>
            Basic (Free)
          </button>
          <button onClick={() => setTier('premium')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border ${tier === 'premium' ? 'bg-yellow-50 border-yellow-500 text-yellow-700' : 'border-gray-200'}`}>
            Premium (Paid)
          </button>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
          <button onClick={() => name && onSubmit(name, tier)} disabled={!name}
            className="btn-primary px-4 py-2 text-sm">Create</button>
        </div>
      </div>
    </div>
  );
}

function CreateFileModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (name: string, type: string, url: string, tier: string) => void }) {
  const [name, setName] = useState('');
  const [fileType, setFileType] = useState('pdf');
  const [fileUrl, setFileUrl] = useState('');
  const [tier, setTier] = useState('basic');
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">New File</h2>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="File name"
          className="w-full border rounded-lg px-3 py-2 mb-3" autoFocus />
        <select value={fileType} onChange={e => setFileType(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-3">
          <option value="pdf">PDF</option>
          <option value="video">Video</option>
          <option value="link">Link</option>
          <option value="text">Text</option>
        </select>
        <input value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="File URL"
          className="w-full border rounded-lg px-3 py-2 mb-3" />
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTier('basic')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border ${tier === 'basic' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200'}`}>
            Basic
          </button>
          <button onClick={() => setTier('premium')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border ${tier === 'premium' ? 'bg-yellow-50 border-yellow-500 text-yellow-700' : 'border-gray-200'}`}>
            Premium
          </button>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
          <button onClick={() => name && onSubmit(name, fileType, fileUrl, tier)} disabled={!name}
            className="btn-primary px-4 py-2 text-sm">Create</button>
        </div>
      </div>
    </div>
  );
}
