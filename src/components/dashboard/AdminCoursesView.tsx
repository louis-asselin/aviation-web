'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  coursesApi, orgsApi, examsApi, filesApi,
  Course, Module, Organization, Question, FileMetadata
} from '@/lib/api';
import {
  BookOpen, Plus, Pencil, Trash2, Search, ArrowLeft, X, FileText,
  ChevronRight, Upload, Download, HelpCircle, CheckCircle, XCircle,
  ChevronDown, ChevronUp, RotateCw
} from 'lucide-react';

// ============================================================
// ADMIN COURSES VIEW — Course > Module > Files + Questions
// Mirrors the iOS ContentManagerView functionality
// ============================================================

export default function AdminCoursesView() {
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Navigation depth: list → course (modules) → module (files + questions)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);

  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [moduleFiles, setModuleFiles] = useState<FileMetadata[]>([]);
  const [moduleQuestions, setModuleQuestions] = useState<Question[]>([]);
  const [loadingModuleDetail, setLoadingModuleDetail] = useState(false);

  // Modals
  const [error, setError] = useState('');

  const loadCourses = () => {
    if (!token) return;
    coursesApi.list(token)
      .then(data => setCourses(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to load courses:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (!token) return;
    loadCourses();
    orgsApi.list(token).then(data => setOrganizations(Array.isArray(data) ? data : [])).catch(() => {});
  }, [token]);

  const filteredCourses = courses.filter(c =>
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.organizationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.program?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load modules for course
  const openCourse = async (course: Course) => {
    if (!token) return;
    setSelectedCourse(course);
    setSelectedModule(null);
    setLoadingModules(true);
    try {
      const data = await coursesApi.modules(course.id, token);
      setModules(Array.isArray(data) ? data.sort((a, b) => a.orderIndex - b.orderIndex) : []);
    } catch { setModules([]); }
    finally { setLoadingModules(false); }
  };

  // Load files + questions for module
  const openModule = async (mod: Module) => {
    if (!token || !selectedCourse) return;
    setSelectedModule(mod);
    setLoadingModuleDetail(true);
    try {
      const [files, questions] = await Promise.all([
        filesApi.listByModule(mod.id, token).catch(() => [] as FileMetadata[]),
        mod.examId
          ? examsApi.getQuestions(mod.examId, token).catch(() => [] as Question[])
          : examsApi.moduleQuestions(mod.id, token).catch(() => [] as Question[]),
      ]);
      setModuleFiles(Array.isArray(files) ? files : []);
      setModuleQuestions(Array.isArray(questions) ? questions : []);
    } catch {
      setModuleFiles([]);
      setModuleQuestions([]);
    } finally { setLoadingModuleDetail(false); }
  };

  // Refresh current module
  const refreshModule = () => {
    if (selectedModule) openModule(selectedModule);
  };

  // Go back
  const goBackToList = () => { setSelectedCourse(null); setModules([]); setSelectedModule(null); };
  const goBackToCourse = () => { setSelectedModule(null); setModuleFiles([]); setModuleQuestions([]); };

  // ============================================================
  // RENDER: MODULE DETAIL (files + questions)
  // ============================================================
  if (selectedCourse && selectedModule) {
    return (
      <ModuleDetailView
        token={token!}
        course={selectedCourse}
        module={selectedModule}
        files={moduleFiles}
        questions={moduleQuestions}
        loading={loadingModuleDetail}
        onBack={goBackToCourse}
        onRefresh={refreshModule}
      />
    );
  }

  // ============================================================
  // RENDER: COURSE MODULES LIST
  // ============================================================
  if (selectedCourse) {
    return (
      <CourseModulesView
        token={token!}
        course={selectedCourse}
        modules={modules}
        loading={loadingModules}
        organizations={organizations}
        onBack={goBackToList}
        onOpenModule={openModule}
        onReload={() => openCourse(selectedCourse)}
        onReloadCourses={loadCourses}
      />
    );
  }

  // ============================================================
  // RENDER: COURSES LIST
  // ============================================================
  return (
    <CoursesListView
      token={token!}
      courses={filteredCourses}
      organizations={organizations}
      loading={isLoading}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onOpenCourse={openCourse}
      onReload={() => { setIsLoading(true); loadCourses(); }}
    />
  );
}

// ============================================================
// COURSES LIST VIEW
// ============================================================
function CoursesListView({ token, courses, organizations, loading, searchQuery, onSearchChange, onOpenCourse, onReload }: {
  token: string; courses: Course[]; organizations: Organization[]; loading: boolean;
  searchQuery: string; onSearchChange: (q: string) => void;
  onOpenCourse: (c: Course) => void; onReload: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', organizationId: '', program: '', contentType: 'pdf', estimatedDurationMin: 60, isPublished: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!form.title.trim() || !form.organizationId) { setError('Titre et organisation sont obligatoires'); return; }
    setSaving(true); setError('');
    try {
      await coursesApi.create({
        title: form.title, description: form.description,
        organizationId: Number(form.organizationId),
        subject: form.program || undefined,
        level: 'intermediate',
        contentType: form.contentType,
      }, token);
      setShowModal(false);
      onReload();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erreur'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card animate-pulse"><div className="h-4 bg-gray-200 rounded w-3/4 mb-3" /><div className="h-3 bg-gray-200 rounded w-1/2" /></div>)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Gestion des Cours</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{courses.length} cours</span>
          <button onClick={() => { setForm({ title: '', description: '', organizationId: organizations[0] ? String(organizations[0].id) : '', program: '', contentType: 'pdf', estimatedDurationMin: 60, isPublished: false }); setError(''); setShowModal(true); }} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Nouveau cours
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} placeholder="Rechercher un cours..." className="input-field pl-10" />
      </div>

      {courses.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun cours trouvé.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map(course => (
            <div key={course.id} className="card hover:shadow-md transition-all cursor-pointer group" onClick={() => onOpenCourse(course)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent-50 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-accent-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{course.title}</h3>
                      {course.isPublished ? <span className="badge bg-green-100 text-green-700 text-[10px]">Publié</span> : <span className="badge bg-yellow-100 text-yellow-700 text-[10px]">Brouillon</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {course.organizationName && <span>{course.organizationName}</span>}
                      {(course.program || course.subject) && <span>• {course.program || course.subject}</span>}
                      <span>• {course.moduleCount || 0} modules</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Nouveau cours" onClose={() => setShowModal(false)} error={error}>
          <div className="space-y-4">
            <Field label="Titre *" value={form.title} onChange={v => setForm({...form, title: v})} placeholder="Titre du cours" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organisation *</label>
              <select value={form.organizationId} onChange={e => setForm({...form, organizationId: e.target.value})} className="input-field">
                {organizations.map(o => <option key={o.id} value={String(o.id)}>{o.name} ({o.type})</option>)}
              </select>
            </div>
            <Field label="Programme" value={form.program} onChange={v => setForm({...form, program: v})} placeholder="Ex: ATPL_THEORIQUE" />
            <Field label="Description" value={form.description} onChange={v => setForm({...form, description: v})} multiline />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de contenu</label>
                <select value={form.contentType} onChange={e => setForm({...form, contentType: e.target.value})} className="input-field">
                  {['pdf','video','interactive','mixed','quiz'].map(ct => <option key={ct} value={ct}>{ct.toUpperCase()}</option>)}
                </select>
              </div>
              <Field label="Durée (min)" value={String(form.estimatedDurationMin)} onChange={v => setForm({...form, estimatedDurationMin: Number(v)})} type="number" />
            </div>
          </div>
          <ModalFooter onClose={() => setShowModal(false)} onSave={handleCreate} saving={saving} label="Créer" />
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// COURSE MODULES VIEW
// ============================================================
function CourseModulesView({ token, course, modules, loading, organizations, onBack, onOpenModule, onReload, onReloadCourses }: {
  token: string; course: Course; modules: Module[]; loading: boolean; organizations: Organization[];
  onBack: () => void; onOpenModule: (m: Module) => void; onReload: () => void; onReloadCourses: () => void;
}) {
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', contentType: 'pdf', durationMin: 30 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Course edit
  const [showEditCourse, setShowEditCourse] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: course.title, description: course.description || '', isPublished: course.isPublished ?? false, estimatedDurationMin: course.estimatedDurationMin || 60 });
  const [savingCourse, setSavingCourse] = useState(false);

  const handleSaveModule = async () => {
    if (!moduleForm.title.trim()) { setError('Le titre est obligatoire'); return; }
    setSaving(true); setError('');
    try {
      if (editingModule) {
        await coursesApi.updateModule(course.id, editingModule.id, { title: moduleForm.title, description: moduleForm.description, contentType: moduleForm.contentType }, token);
      } else {
        await coursesApi.createModule(course.id, { title: moduleForm.title, description: moduleForm.description, orderIndex: modules.length }, token);
      }
      setShowModuleModal(false);
      onReload();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erreur'); }
    finally { setSaving(false); }
  };

  const deleteModule = async (mod: Module) => {
    if (!confirm(`Supprimer le module "${mod.title}" ?`)) return;
    try { await coursesApi.deleteModule(course.id, mod.id, token); onReload(); }
    catch (err) { console.error(err); }
  };

  const handleUpdateCourse = async () => {
    setSavingCourse(true); setError('');
    try {
      await coursesApi.update(course.id, { title: courseForm.title, description: courseForm.description, isPublished: courseForm.isPublished, estimatedDurationMin: courseForm.estimatedDurationMin }, token);
      setShowEditCourse(false);
      onReloadCourses();
      onReload();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erreur'); }
    finally { setSavingCourse(false); }
  };

  const deleteCourse = async () => {
    if (!confirm(`Supprimer le cours "${course.title}" ?`)) return;
    try { await coursesApi.delete(course.id, token); onBack(); onReloadCourses(); }
    catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">{course.title}</h1>
            {course.isPublished ? <span className="badge bg-green-100 text-green-700 text-[10px]">Publié</span> : <span className="badge bg-yellow-100 text-yellow-700 text-[10px]">Brouillon</span>}
          </div>
          <p className="text-sm text-gray-500">{course.organizationName} • {course.program || course.subject || 'Sans programme'} • {modules.length} modules</p>
        </div>
        <button onClick={() => { setCourseForm({ title: course.title, description: course.description || '', isPublished: course.isPublished ?? false, estimatedDurationMin: course.estimatedDurationMin || 60 }); setError(''); setShowEditCourse(true); }} className="p-2 hover:bg-gray-100 rounded-lg" title="Modifier le cours"><Pencil className="w-4 h-4 text-gray-500" /></button>
        <button onClick={deleteCourse} className="p-2 hover:bg-red-50 rounded-lg" title="Supprimer"><Trash2 className="w-4 h-4 text-red-500" /></button>
        <button onClick={() => { setEditingModule(null); setModuleForm({ title: '', description: '', contentType: 'pdf', durationMin: 30 }); setError(''); setShowModuleModal(true); }} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Module
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
      ) : modules.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun module. Commencez par en créer un.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {modules.map((mod, index) => (
            <div key={mod.id} className="card flex items-center gap-4 group hover:shadow-md transition-shadow cursor-pointer" onClick={() => onOpenModule(mod)}>
              <div className="w-8 h-8 bg-accent-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-sm text-accent-500">{index + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900">{mod.title}</h3>
                {mod.description && <p className="text-sm text-gray-500 truncate">{mod.description}</p>}
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  {mod.fileCount !== undefined && <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {mod.fileCount} fichier{(mod.fileCount || 0) !== 1 ? 's' : ''}</span>}
                  {mod.questionCount !== undefined && <span className="flex items-center gap-1"><HelpCircle className="w-3 h-3" /> {mod.questionCount} question{(mod.questionCount || 0) !== 1 ? 's' : ''}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <button onClick={() => { setEditingModule(mod); setModuleForm({ title: mod.title, description: mod.description || '', contentType: mod.contentType || 'pdf', durationMin: mod.durationMin || 30 }); setError(''); setShowModuleModal(true); }} className="p-1.5 hover:bg-gray-100 rounded"><Pencil className="w-3.5 h-3.5 text-gray-500" /></button>
                <button onClick={() => deleteModule(mod)} className="p-1.5 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </div>
          ))}
        </div>
      )}

      {/* Module modal */}
      {showModuleModal && (
        <Modal title={editingModule ? 'Modifier le module' : 'Nouveau module'} onClose={() => setShowModuleModal(false)} error={error}>
          <div className="space-y-4">
            <Field label="Titre *" value={moduleForm.title} onChange={v => setModuleForm({...moduleForm, title: v})} placeholder="Titre du module" />
            <Field label="Description" value={moduleForm.description} onChange={v => setModuleForm({...moduleForm, description: v})} multiline />
          </div>
          <ModalFooter onClose={() => setShowModuleModal(false)} onSave={handleSaveModule} saving={saving} label={editingModule ? 'Mettre à jour' : 'Créer'} />
        </Modal>
      )}

      {/* Course edit modal */}
      {showEditCourse && (
        <Modal title="Modifier le cours" onClose={() => setShowEditCourse(false)} error={error}>
          <div className="space-y-4">
            <Field label="Titre" value={courseForm.title} onChange={v => setCourseForm({...courseForm, title: v})} />
            <Field label="Description" value={courseForm.description} onChange={v => setCourseForm({...courseForm, description: v})} multiline />
            <Field label="Durée (min)" value={String(courseForm.estimatedDurationMin)} onChange={v => setCourseForm({...courseForm, estimatedDurationMin: Number(v)})} type="number" />
            <div className="flex items-center gap-3">
              <input type="checkbox" id="pub" checked={courseForm.isPublished} onChange={e => setCourseForm({...courseForm, isPublished: e.target.checked})} className="w-4 h-4 rounded border-gray-300" />
              <label htmlFor="pub" className="text-sm text-gray-700">Publié</label>
            </div>
          </div>
          <ModalFooter onClose={() => setShowEditCourse(false)} onSave={handleUpdateCourse} saving={savingCourse} label="Mettre à jour" />
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// MODULE DETAIL VIEW (files + questions)
// ============================================================
function ModuleDetailView({ token, course, module: mod, files, questions, loading, onBack, onRefresh }: {
  token: string; course: Course; module: Module;
  files: FileMetadata[]; questions: Question[];
  loading: boolean; onBack: () => void; onRefresh: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [error, setError] = useState('');

  // File upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await filesApi.upload(file, course.id, mod.id, token);
      onRefresh();
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Erreur lors de l\'upload du fichier');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const deleteFile = async (file: FileMetadata) => {
    if (!confirm(`Supprimer "${file.originalName}" ?`)) return;
    try { await filesApi.delete(file.id, token); onRefresh(); }
    catch (err) { console.error(err); }
  };

  const deleteQuestion = async (q: Question) => {
    if (!confirm('Supprimer cette question ?')) return;
    try {
      if (mod.examId) {
        await examsApi.deleteQuestion(mod.examId, q.id, token);
      }
      onRefresh();
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{mod.title}</h1>
          <p className="text-sm text-gray-500">{course.title} • Module {mod.orderIndex + 1}</p>
        </div>
        <button onClick={onRefresh} className="p-2 hover:bg-gray-100 rounded-lg" title="Rafraîchir"><RotateCw className="w-4 h-4 text-gray-500" /></button>
      </div>

      {mod.description && <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">{mod.description}</p>}

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      {/* FILES SECTION */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" /> Fichiers ({files.length})
          </h2>
          <div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.png,.mp4" />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-primary flex items-center gap-2 text-sm">
              {uploading ? <><RotateCw className="w-4 h-4 animate-spin" /> Upload...</> : <><Upload className="w-4 h-4" /> Importer un fichier</>}
            </button>
          </div>
        </div>

        {files.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Aucun fichier. Importez un PDF ou un document.</p>
        ) : (
          <div className="space-y-2">
            {files.map(file => (
              <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group">
                <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.originalName}</p>
                  <p className="text-xs text-gray-400">{(file.sizeBytes / 1024).toFixed(0)} Ko • {file.mimeType}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={filesApi.downloadUrl(file.id)} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-gray-200 rounded" title="Télécharger">
                    <Download className="w-3.5 h-3.5 text-gray-500" />
                  </a>
                  <button onClick={() => deleteFile(file)} className="p-1.5 hover:bg-red-50 rounded" title="Supprimer">
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QUESTIONS SECTION */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-500" /> Questions ({questions.length})
          </h2>
          <button onClick={() => { setEditingQuestion(null); setShowQuestionModal(true); }} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Ajouter une question
          </button>
        </div>

        {questions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Aucune question. Créez des QCM pour ce module.</p>
        ) : (
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <QuestionCard key={q.id} question={q} index={idx}
                onEdit={() => { setEditingQuestion(q); setShowQuestionModal(true); }}
                onDelete={() => deleteQuestion(q)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Question modal */}
      {showQuestionModal && (
        <QuestionEditorModal
          token={token}
          module={mod}
          editing={editingQuestion}
          onClose={() => { setShowQuestionModal(false); setEditingQuestion(null); }}
          onSaved={onRefresh}
        />
      )}
    </div>
  );
}

// ============================================================
// QUESTION CARD
// ============================================================
function QuestionCard({ question, index, onEdit, onDelete }: {
  question: Question; index: number; onEdit: () => void; onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start gap-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <span className="text-xs font-bold text-gray-400 bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{question.text}</p>
          <p className="text-xs text-gray-400 mt-1">{question.type === 'vrai_faux' ? 'Vrai/Faux' : 'QCM'} • {question.options?.length || 0} options</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 hover:bg-gray-100 rounded"><Pencil className="w-3.5 h-3.5 text-gray-500" /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 ml-9 space-y-2">
          {question.options?.map(opt => (
            <div key={opt.id} className={`flex items-center gap-2 text-sm p-2 rounded ${opt.label === question.correctOptionId || String(opt.id) === question.correctOptionId ? 'bg-green-50 text-green-800' : 'text-gray-600'}`}>
              <span className="font-bold text-xs w-5">{opt.label}.</span>
              <span>{opt.text}</span>
              {(opt.label === question.correctOptionId || String(opt.id) === question.correctOptionId) && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}
            </div>
          ))}
          {question.explanation && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800 mt-2">
              <strong>Explication :</strong> {question.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// QUESTION EDITOR MODAL (mirrors iOS QuestionEditorView)
// ============================================================
function QuestionEditorModal({ token, module: mod, editing, onClose, onSaved }: {
  token: string; module: Module; editing: Question | null;
  onClose: () => void; onSaved: () => void;
}) {
  const [text, setText] = useState(editing?.text || '');
  const [type, setType] = useState(editing?.type || 'qcm');
  const [options, setOptions] = useState<{ label: string; text: string }[]>(
    editing?.options?.map(o => ({ label: o.label, text: o.text })) ||
    [{ label: 'A', text: '' }, { label: 'B', text: '' }, { label: 'C', text: '' }, { label: 'D', text: '' }]
  );
  const [correctAnswer, setCorrectAnswer] = useState(editing?.correctOptionId || 'A');
  const [explanation, setExplanation] = useState(editing?.explanation || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Auto-adjust for vrai_faux
  useEffect(() => {
    if (type === 'vrai_faux') {
      setOptions([{ label: 'A', text: 'Vrai' }, { label: 'B', text: 'Faux' }]);
    } else if (options.length < 4) {
      const labels = ['A', 'B', 'C', 'D'];
      const newOpts = [...options];
      while (newOpts.length < 4) {
        newOpts.push({ label: labels[newOpts.length], text: '' });
      }
      setOptions(newOpts);
    }
  }, [type]);

  const handleSave = async () => {
    if (!text.trim()) { setError('La question est obligatoire'); return; }
    const filledOptions = options.filter(o => o.text.trim());
    if (filledOptions.length < 2) { setError('Au moins 2 options sont requises'); return; }

    setSaving(true); setError('');
    const payload = {
      text, type,
      options: filledOptions,
      correctOptionId: correctAnswer,
      explanation: explanation || undefined,
    };

    try {
      if (editing && mod.examId) {
        await examsApi.updateQuestion(mod.examId, editing.id, payload, token);
      } else if (mod.examId) {
        await examsApi.addQuestion(mod.examId, payload, token);
      } else {
        await examsApi.addModuleQuestion(mod.id, payload, token);
      }
      onClose();
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally { setSaving(false); }
  };

  return (
    <Modal title={editing ? 'Modifier la question' : 'Nouvelle question'} onClose={onClose} error={error} wide>
      <div className="space-y-4">
        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <div className="flex gap-3">
            <button onClick={() => setType('qcm')} className={`px-4 py-2 text-sm rounded-lg border ${type === 'qcm' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'}`}>QCM</button>
            <button onClick={() => setType('vrai_faux')} className={`px-4 py-2 text-sm rounded-lg border ${type === 'vrai_faux' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'}`}>Vrai / Faux</button>
          </div>
        </div>

        {/* Question text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
          <textarea value={text} onChange={e => setText(e.target.value)} className="input-field" rows={3} placeholder="Saisissez la question..." />
        </div>

        {/* Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Options (sélectionnez la bonne réponse)</label>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={opt.label} className="flex items-center gap-2">
                <button
                  onClick={() => setCorrectAnswer(opt.label)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
                    correctAnswer === opt.label
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
                <input
                  type="text"
                  value={opt.text}
                  onChange={e => {
                    const newOpts = [...options];
                    newOpts[i] = { ...newOpts[i], text: e.target.value };
                    setOptions(newOpts);
                  }}
                  className="input-field flex-1"
                  placeholder={`Option ${opt.label}`}
                  disabled={type === 'vrai_faux'}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Explanation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Explication (optionnelle)</label>
          <textarea value={explanation} onChange={e => setExplanation(e.target.value)} className="input-field" rows={2} placeholder="Explication affichée après la réponse..." />
        </div>
      </div>

      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} label={editing ? 'Mettre à jour' : 'Ajouter'} />
    </Modal>
  );
}

// ============================================================
// SHARED COMPONENTS
// ============================================================
function Modal({ title, onClose, error, children, wide }: {
  title: string; onClose: () => void; error?: string; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className={`bg-white rounded-xl shadow-xl ${wide ? 'max-w-lg' : 'max-w-md'} w-full mx-4 p-6 max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
        {children}
      </div>
    </div>
  );
}

function ModalFooter({ onClose, onSave, saving, label }: {
  onClose: () => void; onSave: () => void; saving: boolean; label: string;
}) {
  return (
    <div className="flex justify-end gap-3 mt-6">
      <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Annuler</button>
      <button onClick={onSave} disabled={saving} className="btn-primary text-sm">{saving ? 'Enregistrement...' : label}</button>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, multiline, type }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} className="input-field" rows={3} placeholder={placeholder} />
      ) : (
        <input type={type || 'text'} value={value} onChange={e => onChange(e.target.value)} className="input-field" placeholder={placeholder} />
      )}
    </div>
  );
}
