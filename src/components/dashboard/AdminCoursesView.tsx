'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { coursesApi, orgsApi, Course, Module, Organization } from '@/lib/api';
import {
  BookOpen, Plus, Pencil, Trash2, Search, ArrowLeft, X,
  FileText, GripVertical, ChevronRight, Eye, EyeOff
} from 'lucide-react';

interface CourseFormData {
  title: string;
  description: string;
  organizationId: string;
  subject: string;
  level: string;
  contentType: string;
}

interface ModuleFormData {
  title: string;
  description: string;
}

const emptyCourseForm: CourseFormData = {
  title: '', description: '', organizationId: '', subject: '', level: '', contentType: 'pdf',
};

const LEVELS = ['', 'beginner', 'intermediate', 'advanced'];
const CONTENT_TYPES = ['pdf', 'video', 'mixed'];

export default function AdminCoursesView() {
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Course modal
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState<CourseFormData>(emptyCourseForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Module management
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleForm, setModuleForm] = useState<ModuleFormData>({ title: '', description: '' });
  const [savingModule, setSavingModule] = useState(false);

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
    orgsApi.list(token)
      .then(data => setOrganizations(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [token]);

  const filteredCourses = courses.filter(c =>
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.organizationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load modules for a course
  const openCourse = async (course: Course) => {
    if (!token) return;
    setSelectedCourse(course);
    setLoadingModules(true);
    try {
      const data = await coursesApi.modules(course.id, token);
      setModules(Array.isArray(data) ? data.sort((a, b) => a.orderIndex - b.orderIndex) : []);
    } catch { setModules([]); }
    finally { setLoadingModules(false); }
  };

  // Course CRUD
  const openCreateCourse = () => {
    setEditingCourse(null);
    setCourseForm({
      ...emptyCourseForm,
      organizationId: organizations.length > 0 ? String(organizations[0].id) : '',
    });
    setError('');
    setShowCourseModal(true);
  };

  const openEditCourse = (course: Course) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title,
      description: course.description || '',
      organizationId: String(course.organizationId),
      subject: course.subject || '',
      level: course.level || '',
      contentType: course.contentType || 'pdf',
    });
    setError('');
    setShowCourseModal(true);
  };

  const saveCourse = async () => {
    if (!token || !courseForm.title.trim()) {
      setError('Le titre est obligatoire');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingCourse) {
        await coursesApi.update(editingCourse.id, {
          title: courseForm.title,
          description: courseForm.description,
          subject: courseForm.subject,
          level: courseForm.level,
          contentType: courseForm.contentType,
        }, token);
      } else {
        await coursesApi.create({
          title: courseForm.title,
          description: courseForm.description,
          organizationId: Number(courseForm.organizationId),
          subject: courseForm.subject || undefined,
          level: courseForm.level || undefined,
          contentType: courseForm.contentType || undefined,
        }, token);
      }
      setShowCourseModal(false);
      setIsLoading(true);
      loadCourses();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally { setSaving(false); }
  };

  const deleteCourse = async (course: Course) => {
    if (!token) return;
    if (!confirm(`Supprimer le cours "${course.title}" ? Cette action est irréversible.`)) return;
    try {
      await coursesApi.delete(course.id, token);
      setIsLoading(true);
      loadCourses();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Module CRUD
  const openCreateModule = () => {
    setEditingModule(null);
    setModuleForm({ title: '', description: '' });
    setError('');
    setShowModuleModal(true);
  };

  const openEditModule = (mod: Module) => {
    setEditingModule(mod);
    setModuleForm({ title: mod.title, description: mod.description || '' });
    setError('');
    setShowModuleModal(true);
  };

  const saveModule = async () => {
    if (!token || !selectedCourse || !moduleForm.title.trim()) {
      setError('Le titre du module est obligatoire');
      return;
    }
    setSavingModule(true);
    setError('');
    try {
      if (editingModule) {
        await coursesApi.updateModule(selectedCourse.id, editingModule.id, {
          title: moduleForm.title,
          description: moduleForm.description,
        }, token);
      } else {
        await coursesApi.createModule(selectedCourse.id, {
          title: moduleForm.title,
          description: moduleForm.description || undefined,
          orderIndex: modules.length,
        }, token);
      }
      setShowModuleModal(false);
      // Reload modules
      openCourse(selectedCourse);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally { setSavingModule(false); }
  };

  const deleteModule = async (mod: Module) => {
    if (!token || !selectedCourse) return;
    if (!confirm(`Supprimer le module "${mod.title}" ?`)) return;
    try {
      await coursesApi.deleteModule(selectedCourse.id, mod.id, token);
      openCourse(selectedCourse);
    } catch (err) {
      console.error('Delete module failed:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  // Module list view
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
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{selectedCourse.title}</h1>
            <p className="text-sm text-gray-500">{selectedCourse.description}</p>
          </div>
          <button onClick={openCreateModule} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Module
          </button>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>{modules.length} module{modules.length !== 1 ? 's' : ''}</span>
          {selectedCourse.organizationName && <span>• {selectedCourse.organizationName}</span>}
          {selectedCourse.subject && <span>• {selectedCourse.subject}</span>}
        </div>

        {loadingModules ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : modules.length === 0 ? (
          <div className="card text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun module dans ce cours.</p>
            <button onClick={openCreateModule} className="btn-primary mt-4 text-sm">
              <Plus className="w-4 h-4 inline mr-1" /> Ajouter un module
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {modules.map((mod, index) => (
              <div key={mod.id} className="card flex items-center gap-4 group hover:shadow-md transition-shadow">
                <div className="w-8 h-8 bg-accent-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-sm text-accent-500">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">{mod.title}</h3>
                  {mod.description && (
                    <p className="text-sm text-gray-500 truncate">{mod.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {mod.pdfUrl && (
                    <span className="badge bg-blue-100 text-blue-700 text-xs">PDF</span>
                  )}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModule(mod)} className="p-1.5 hover:bg-gray-100 rounded" title="Modifier">
                      <Pencil className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                    <button onClick={() => deleteModule(mod)} className="p-1.5 hover:bg-red-50 rounded" title="Supprimer">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Module modal */}
        {showModuleModal && (
          <Modal
            title={editingModule ? 'Modifier le module' : 'Nouveau module'}
            onClose={() => setShowModuleModal(false)}
            error={error}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input
                  type="text"
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({...moduleForm, title: e.target.value})}
                  className="input-field"
                  placeholder="Titre du module"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({...moduleForm, description: e.target.value})}
                  className="input-field"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModuleModal(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Annuler</button>
              <button onClick={saveModule} disabled={savingModule} className="btn-primary text-sm">
                {savingModule ? 'Enregistrement...' : editingModule ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // Courses list
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Gestion des Cours</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{filteredCourses.length} cours</span>
          <button onClick={openCreateCourse} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Nouveau cours
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un cours..."
          className="input-field pl-10"
        />
      </div>

      {filteredCourses.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun cours trouvé.</p>
          <button onClick={openCreateCourse} className="btn-primary mt-4 text-sm">
            <Plus className="w-4 h-4 inline mr-1" /> Créer un cours
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="card hover:shadow-md transition-all cursor-pointer group"
              onClick={() => openCourse(course)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent-50 rounded-xl flex items-center justify-center group-hover:bg-accent-100 transition-colors">
                    <BookOpen className="w-6 h-6 text-accent-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{course.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {course.organizationName && <span>{course.organizationName}</span>}
                      {course.subject && <span>• {course.subject}</span>}
                      {course.level && <span>• {course.level}</span>}
                      <span>• {course.moduleCount || 0} module{(course.moduleCount || 0) !== 1 ? 's' : ''}</span>
                      {course.isPublished === false && (
                        <span className="badge bg-yellow-100 text-yellow-700">Brouillon</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openEditCourse(course)} className="p-2 hover:bg-gray-100 rounded-lg" title="Modifier">
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                    <button onClick={() => deleteCourse(course)} className="p-2 hover:bg-red-50 rounded-lg" title="Supprimer">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </div>
              {course.description && (
                <p className="text-sm text-gray-500 mt-2 line-clamp-2 ml-16">{course.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Course modal */}
      {showCourseModal && (
        <Modal
          title={editingCourse ? 'Modifier le cours' : 'Nouveau cours'}
          onClose={() => setShowCourseModal(false)}
          error={error}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
              <input
                type="text"
                value={courseForm.title}
                onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                className="input-field"
                placeholder="Titre du cours"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                className="input-field"
                rows={3}
              />
            </div>
            {!editingCourse && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organisation *</label>
                <select
                  value={courseForm.organizationId}
                  onChange={(e) => setCourseForm({...courseForm, organizationId: e.target.value})}
                  className="input-field"
                >
                  {organizations.map(org => (
                    <option key={org.id} value={String(org.id)}>{org.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matière</label>
                <input
                  type="text"
                  value={courseForm.subject}
                  onChange={(e) => setCourseForm({...courseForm, subject: e.target.value})}
                  className="input-field"
                  placeholder="Ex: 010, 021..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
                <select
                  value={courseForm.level}
                  onChange={(e) => setCourseForm({...courseForm, level: e.target.value})}
                  className="input-field"
                >
                  <option value="">Non spécifié</option>
                  <option value="beginner">Débutant</option>
                  <option value="intermediate">Intermédiaire</option>
                  <option value="advanced">Avancé</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de contenu</label>
              <select
                value={courseForm.contentType}
                onChange={(e) => setCourseForm({...courseForm, contentType: e.target.value})}
                className="input-field"
              >
                {CONTENT_TYPES.map(ct => (
                  <option key={ct} value={ct}>{ct === 'pdf' ? 'PDF' : ct === 'video' ? 'Vidéo' : 'Mixte'}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowCourseModal(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Annuler</button>
            <button onClick={saveCourse} disabled={saving} className="btn-primary text-sm">
              {saving ? 'Enregistrement...' : editingCourse ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Reusable modal component
function Modal({ title, onClose, error, children }: {
  title: string;
  onClose: () => void;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}
        {children}
      </div>
    </div>
  );
}
