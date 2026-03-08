'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { coursesApi, filesApi, orgsApi, Course, Module, FileMetadata, Organization } from '@/lib/api';
import { BookOpen, ChevronRight, FileText, ArrowLeft, Clock, Users, AlertTriangle, Download, Eye, File, FileImage, FileSpreadsheet } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://spirited-friendship-production-fb20.up.railway.app/api';

function getFileIcon(mimeType: string) {
  if (mimeType?.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
  if (mimeType?.includes('image')) return <FileImage className="w-5 h-5 text-blue-500" />;
  if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
  if (mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) return <FileText className="w-5 h-5 text-orange-500" />;
  return <File className="w-5 h-5 text-gray-500" />;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CoursesView() {
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingModules, setIsLoadingModules] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [suspendedOrgs, setSuspendedOrgs] = useState<Organization[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const loadData = () => {
    if (!token) return;
    coursesApi.list(token)
      .then(data => setCourses(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to load courses:', err))
      .finally(() => setIsLoading(false));

    orgsApi.list(token, false)
      .then(data => {
        const orgs = Array.isArray(data) ? data : [];
        setSuspendedOrgs(orgs.filter(o => o.isActive === false));
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [token]);

  const openCourse = async (course: Course) => {
    if (!token) return;
    setSelectedCourse(course);
    setSelectedModule(null);
    setFiles([]);
    setIsLoadingModules(true);
    try {
      const data = await coursesApi.modules(course.id, token);
      setModules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load modules:', err);
    } finally {
      setIsLoadingModules(false);
    }
  };

  const openModule = async (module: Module) => {
    if (!token) return;
    setSelectedModule(module);
    setPreviewUrl(null);
    setIsLoadingFiles(true);
    try {
      const data = await filesApi.listByModule(module.id, token);
      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const downloadFile = (file: FileMetadata) => {
    if (!token) return;
    const url = `${API_BASE}/files/${file.id}/download`;
    // Open in new tab with auth
    window.open(url + `?token=${token}`, '_blank');
  };

  const previewFile = (file: FileMetadata) => {
    if (!token) return;
    const url = `${API_BASE}/files/${file.id}/download?token=${token}`;
    setPreviewUrl(url);
  };

  const canPreview = (mimeType: string) => {
    return mimeType?.includes('pdf') || mimeType?.includes('image');
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  // File preview overlay
  if (previewUrl) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewUrl(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Document Preview</h1>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
          <iframe
            src={previewUrl}
            className="w-full h-full"
            title="File Preview"
          />
        </div>
      </div>
    );
  }

  // Module content view (files)
  if (selectedCourse && selectedModule) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelectedModule(null); setFiles([]); }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{selectedModule.title}</h1>
            <p className="text-sm text-gray-500">{selectedCourse.title}</p>
          </div>
        </div>

        {selectedModule.description && (
          <div className="card">
            <p className="text-sm text-gray-600">{selectedModule.description}</p>
          </div>
        )}

        {/* Files */}
        {isLoadingFiles ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="card text-center py-8">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No documents available in this module.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">{files.length} document{files.length !== 1 ? 's' : ''}</h2>
            </div>
            {files.map((file) => (
              <div
                key={file.id}
                className="card hover:shadow-md transition-shadow flex items-center gap-4"
              >
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  {getFileIcon(file.mimeType)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{file.originalName}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                    <span>{formatFileSize(file.sizeBytes)}</span>
                    <span>{file.mimeType?.split('/').pop()?.toUpperCase()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {canPreview(file.mimeType) && (
                    <button
                      onClick={() => previewFile(file)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => downloadFile(file)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Module list view for selected course
  if (selectedCourse) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelectedCourse(null); setModules([]); }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{selectedCourse.title}</h1>
            <p className="text-sm text-gray-500">{selectedCourse.description}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Course Progress</span>
            <span className="text-sm font-bold text-accent-500">{selectedCourse.progress || 0}%</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-400 to-accent-500 rounded-full transition-all"
              style={{ width: `${selectedCourse.progress || 0}%` }}
            />
          </div>
        </div>

        {/* Modules */}
        {isLoadingModules ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : modules.length === 0 ? (
          <div className="card text-center py-8">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No modules available for this course.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {modules.sort((a, b) => a.orderIndex - b.orderIndex).map((module, index) => (
              <div
                key={module.id}
                onClick={() => openModule(module)}
                className="card hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4"
              >
                <div className="w-10 h-10 bg-accent-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-accent-500">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">{module.title}</h3>
                  {module.description && (
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{module.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {module.pdfUrl && (
                    <span className="badge bg-blue-100 text-blue-700">
                      <FileText className="w-3 h-3 mr-1" />
                      PDF
                    </span>
                  )}
                  {module.progress !== undefined && (
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${module.progress}%` }}
                      />
                    </div>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Courses list view
  return (
    <div className="space-y-6">
      {/* Suspended org banners */}
      {suspendedOrgs.map(org => (
        <div key={org.id} className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-700">Access Suspended</p>
            <p className="text-sm text-orange-600">Your access to {org.name} has been suspended. Please contact your administrator.</p>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">My Courses</h1>
        <span className="text-sm text-gray-500">{courses.length} course{courses.length !== 1 ? 's' : ''}</span>
      </div>

      {courses.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-1">No courses yet</h2>
          <p className="text-gray-500">You have not been enrolled in any courses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div
              key={course.id}
              onClick={() => openCourse(course)}
              className="card hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-accent-50 rounded-lg flex items-center justify-center group-hover:bg-accent-100 transition-colors">
                  <BookOpen className="w-5 h-5 text-accent-500" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{course.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-4">{course.description}</p>

              <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  {course.moduleCount || 0} modules
                </span>
                {course.organizationName && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {course.organizationName}
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-500 rounded-full transition-all"
                    style={{ width: `${course.progress || 0}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600">{course.progress || 0}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
