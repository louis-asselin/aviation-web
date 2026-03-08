'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { orgsApi, coursesApi, Organization, Course } from '@/lib/api';
import {
  Building2, Users, Search, Plus, Pencil, X, ToggleLeft, ToggleRight,
  ArrowLeft, BookOpen, Eye, EyeOff, Trash2, ChevronRight
} from 'lucide-react';

// Programs suggestions by org type (matches iOS)
const PROGRAMS_BY_TYPE: Record<string, string[]> = {
  ato: ['ATPL_THEORIQUE', 'ATPI', 'MODULAIRE', 'PPL'],
  airline: ['AIRLINE_OPS', 'SECURITE', 'MANUELS', 'CRM', 'DGR', 'SOP'],
  common: ['COMMON', 'SECURITE', 'DGR'],
};

const ORG_TYPES = [
  { value: 'ato', label: 'ATO', color: 'blue' },
  { value: 'airline', label: 'Compagnie', color: 'orange' },
  { value: 'common', label: 'Commun', color: 'green' },
];

const CONTENT_TYPES = ['pdf', 'video', 'interactive', 'mixed', 'quiz'];

interface OrgFormData {
  name: string;
  type: string;
  code: string;
  description: string;
}

interface CourseFormData {
  title: string;
  program: string;
  description: string;
  contentType: string;
  estimatedDurationMin: number;
  isPublished: boolean;
}

const emptyOrgForm: OrgFormData = { name: '', type: 'ato', code: '', description: '' };
const emptyCourseForm: CourseFormData = {
  title: '', program: '', description: '', contentType: 'pdf',
  estimatedDurationMin: 60, isPublished: false,
};

export default function AdminOrgsView() {
  const { token } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Detail view
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [orgCourses, setOrgCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Org modal
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [orgForm, setOrgForm] = useState<OrgFormData>(emptyOrgForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Course modal
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState<CourseFormData>(emptyCourseForm);
  const [savingCourse, setSavingCourse] = useState(false);

  const loadOrgs = () => {
    if (!token) return;
    orgsApi.list(token)
      .then(data => setOrgs(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to load organizations:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { loadOrgs(); }, [token]);

  const filteredOrgs = orgs.filter(o =>
    o.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Open org detail
  const openOrgDetail = async (org: Organization) => {
    if (!token) return;
    setSelectedOrg(org);
    setLoadingCourses(true);
    try {
      const allCourses = await coursesApi.list(token);
      const courses = (Array.isArray(allCourses) ? allCourses : [])
        .filter(c => c.organizationId === org.id);
      setOrgCourses(courses);
    } catch { setOrgCourses([]); }
    finally { setLoadingCourses(false); }
  };

  // Org CRUD
  const openCreateOrg = () => {
    setEditingOrg(null);
    setOrgForm(emptyOrgForm);
    setError('');
    setShowOrgModal(true);
  };

  const openEditOrg = (org: Organization, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingOrg(org);
    setOrgForm({ name: org.name, type: org.type, code: org.code, description: org.description || '' });
    setError('');
    setShowOrgModal(true);
  };

  const saveOrg = async () => {
    if (!token || !orgForm.name.trim() || !orgForm.code.trim()) {
      setError('Nom et code sont obligatoires');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingOrg) {
        await orgsApi.update(editingOrg.id, {
          name: orgForm.name, type: orgForm.type, description: orgForm.description,
        }, token);
      } else {
        await orgsApi.create({
          name: orgForm.name, type: orgForm.type, code: orgForm.code, description: orgForm.description,
        }, token);
      }
      setShowOrgModal(false);
      setIsLoading(true);
      loadOrgs();
      if (selectedOrg && editingOrg && editingOrg.id === selectedOrg.id) {
        setSelectedOrg({ ...selectedOrg, ...orgForm });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally { setSaving(false); }
  };

  const toggleActive = async (org: Organization, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!token) return;
    try {
      await orgsApi.update(org.id, { isActive: !org.isActive }, token);
      setIsLoading(true);
      loadOrgs();
    } catch (err) { console.error('Toggle failed:', err); }
  };

  // Course CRUD within org
  const openCreateCourse = () => {
    if (!selectedOrg) return;
    const programs = PROGRAMS_BY_TYPE[selectedOrg.type] || [];
    setEditingCourse(null);
    setCourseForm({ ...emptyCourseForm, program: programs[0] || '' });
    setError('');
    setShowCourseModal(true);
  };

  const openEditCourse = (course: Course, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCourseForm({
      title: course.title,
      program: course.program || course.subject || '',
      description: course.description || '',
      contentType: course.contentType || 'pdf',
      estimatedDurationMin: course.estimatedDurationMin || 60,
      isPublished: course.isPublished ?? false,
    });
    setEditingCourse(course);
    setError('');
    setShowCourseModal(true);
  };

  const saveCourse = async () => {
    if (!token || !selectedOrg || !courseForm.title.trim()) {
      setError('Le titre est obligatoire');
      return;
    }
    setSavingCourse(true);
    setError('');
    try {
      if (editingCourse) {
        await coursesApi.update(editingCourse.id, {
          title: courseForm.title,
          description: courseForm.description,
          program: courseForm.program,
          subject: courseForm.program,
          contentType: courseForm.contentType,
          estimatedDurationMin: courseForm.estimatedDurationMin,
          isPublished: courseForm.isPublished,
        }, token);
      } else {
        await coursesApi.create({
          title: courseForm.title,
          description: courseForm.description,
          organizationId: selectedOrg.id,
          subject: courseForm.program,
          level: 'intermediate',
          contentType: courseForm.contentType,
        }, token);
      }
      setShowCourseModal(false);
      openOrgDetail(selectedOrg);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally { setSavingCourse(false); }
  };

  const deleteCourse = async (course: Course, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!token || !selectedOrg) return;
    if (!confirm(`Supprimer le cours "${course.title}" ?`)) return;
    try {
      await coursesApi.delete(course.id, token);
      openOrgDetail(selectedOrg);
    } catch (err) { console.error('Delete failed:', err); }
  };

  const togglePublished = async (course: Course, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!token) return;
    try {
      await coursesApi.update(course.id, { isPublished: !course.isPublished }, token);
      if (selectedOrg) openOrgDetail(selectedOrg);
    } catch (err) { console.error('Toggle failed:', err); }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/2 mb-3" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  // ======== ORG DETAIL VIEW ========
  if (selectedOrg) {
    const programs = PROGRAMS_BY_TYPE[selectedOrg.type] || [];
    const coursesByProgram: Record<string, Course[]> = {};
    orgCourses.forEach(c => {
      const prog = c.program || c.subject || 'Sans programme';
      if (!coursesByProgram[prog]) coursesByProgram[prog] = [];
      coursesByProgram[prog].push(c);
    });

    const typeColor = selectedOrg.type === 'ato' ? 'blue' : selectedOrg.type === 'airline' ? 'orange' : 'green';

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedOrg(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className={`w-14 h-14 bg-${typeColor}-50 rounded-xl flex items-center justify-center`}>
            <Building2 className={`w-7 h-7 text-${typeColor}-500`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{selectedOrg.name}</h1>
              <span className={`badge bg-${typeColor}-100 text-${typeColor}-700`}>{selectedOrg.type.toUpperCase()}</span>
              {selectedOrg.isActive === false && <span className="badge bg-red-100 text-red-700">Inactive</span>}
            </div>
            <p className="text-sm text-gray-500">Code: {selectedOrg.code} • {orgCourses.length} cours</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => openEditOrg(selectedOrg)} className="p-2 hover:bg-gray-100 rounded-lg" title="Modifier">
              <Pencil className="w-4 h-4 text-gray-500" />
            </button>
            <button onClick={openCreateCourse} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Ajouter un cours
            </button>
          </div>
        </div>

        {selectedOrg.description && (
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">{selectedOrg.description}</p>
        )}

        {/* Courses grouped by program */}
        {loadingCourses ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : orgCourses.length === 0 ? (
          <div className="card text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun cours dans cette organisation.</p>
            <button onClick={openCreateCourse} className="btn-primary mt-4 text-sm">
              <Plus className="w-4 h-4 inline mr-1" /> Créer un cours
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(coursesByProgram).map(([program, courses]) => (
              <div key={program}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{program}</h2>
                <div className="space-y-2">
                  {courses.map(course => (
                    <div key={course.id} className="card flex items-center gap-4 group hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 bg-accent-50 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-accent-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{course.title}</h3>
                          {course.isPublished ? (
                            <span className="badge bg-green-100 text-green-700 text-[10px]">Publié</span>
                          ) : (
                            <span className="badge bg-yellow-100 text-yellow-700 text-[10px]">Brouillon</span>
                          )}
                        </div>
                        {course.description && (
                          <p className="text-sm text-gray-500 truncate">{course.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                          {course.estimatedDurationMin && <span>{course.estimatedDurationMin} min</span>}
                          <span>{course.moduleCount || 0} module{(course.moduleCount || 0) !== 1 ? 's' : ''}</span>
                          {course.contentType && <span>{course.contentType}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => togglePublished(course, e)} className="p-2 hover:bg-gray-100 rounded-lg" title={course.isPublished ? 'Dépublier' : 'Publier'}>
                          {course.isPublished ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                        </button>
                        <button onClick={(e) => openEditCourse(course, e)} className="p-2 hover:bg-gray-100 rounded-lg" title="Modifier">
                          <Pencil className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={(e) => deleteCourse(course, e)} className="p-2 hover:bg-red-50 rounded-lg" title="Supprimer">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Course modal */}
        {showCourseModal && (
          <Modal title={editingCourse ? 'Modifier le cours' : 'Nouveau cours'} onClose={() => setShowCourseModal(false)} error={error}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input type="text" value={courseForm.title} onChange={(e) => setCourseForm({...courseForm, title: e.target.value})} className="input-field" placeholder="Titre du cours" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Programme *</label>
                <select value={courseForm.program} onChange={(e) => setCourseForm({...courseForm, program: e.target.value})} className="input-field">
                  {programs.map(p => <option key={p} value={p}>{p}</option>)}
                  <option value="">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={courseForm.description} onChange={(e) => setCourseForm({...courseForm, description: e.target.value})} className="input-field" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de contenu</label>
                  <select value={courseForm.contentType} onChange={(e) => setCourseForm({...courseForm, contentType: e.target.value})} className="input-field">
                    {CONTENT_TYPES.map(ct => <option key={ct} value={ct}>{ct.toUpperCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durée (min)</label>
                  <input type="number" value={courseForm.estimatedDurationMin} min={5} max={600} step={15}
                    onChange={(e) => setCourseForm({...courseForm, estimatedDurationMin: Number(e.target.value)})} className="input-field" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="isPublished" checked={courseForm.isPublished}
                  onChange={(e) => setCourseForm({...courseForm, isPublished: e.target.checked})}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <label htmlFor="isPublished" className="text-sm text-gray-700">Publier immédiatement</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCourseModal(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Annuler</button>
              <button onClick={saveCourse} disabled={savingCourse} className="btn-primary text-sm">
                {savingCourse ? 'Enregistrement...' : editingCourse ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </Modal>
        )}

        {/* Org edit modal */}
        {showOrgModal && <OrgModal form={orgForm} setForm={setOrgForm} editing={!!editingOrg} saving={saving} error={error} onSave={saveOrg} onClose={() => setShowOrgModal(false)} />}
      </div>
    );
  }

  // ======== ORG LIST VIEW ========
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Organizations</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{filteredOrgs.length} organisation{filteredOrgs.length !== 1 ? 's' : ''}</span>
          <button onClick={openCreateOrg} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Nouvelle
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher..." className="input-field pl-10" />
      </div>

      {filteredOrgs.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune organisation trouvée.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrgs.map((org) => {
            const tc = org.type === 'ato' ? 'blue' : org.type === 'airline' ? 'orange' : 'green';
            return (
              <div key={org.id} className="card hover:shadow-md transition-all cursor-pointer group" onClick={() => openOrgDetail(org)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${tc}-50`}>
                      <Building2 className={`w-6 h-6 text-${tc}-500`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{org.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`badge bg-${tc}-100 text-${tc}-700`}>{org.type.toUpperCase()}</span>
                        <span className="text-xs text-gray-500">Code: {org.code}</span>
                        {org.isActive === false && <span className="badge bg-red-100 text-red-700">Inactive</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button onClick={(e) => openEditOrg(org, e)} className="p-2 hover:bg-gray-100 rounded-lg" title="Modifier">
                        <Pencil className="w-4 h-4 text-gray-500" />
                      </button>
                      <button onClick={(e) => toggleActive(org, e)} className="p-2 hover:bg-gray-100 rounded-lg" title={org.isActive !== false ? 'Désactiver' : 'Activer'}>
                        {org.isActive !== false ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                      </button>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </div>
                {org.description && <p className="text-sm text-gray-500 mt-3">{org.description}</p>}
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                  {(org.memberCount ?? org.userCount) !== undefined && (
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {org.memberCount ?? org.userCount} membres</span>
                  )}
                  {org.courseCount !== undefined && <span>{org.courseCount} cours</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showOrgModal && <OrgModal form={orgForm} setForm={setOrgForm} editing={!!editingOrg} saving={saving} error={error} onSave={saveOrg} onClose={() => setShowOrgModal(false)} />}
    </div>
  );
}

// ======== ORG MODAL ========
function OrgModal({ form, setForm, editing, saving, error, onSave, onClose }: {
  form: OrgFormData;
  setForm: (f: OrgFormData) => void;
  editing: boolean;
  saving: boolean;
  error: string;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title={editing ? "Modifier l'organisation" : 'Nouvelle organisation'} onClose={onClose} error={error}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
          <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input-field" placeholder="Ex: Mon ATO" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
          <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="input-field">
            {ORG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Programmes suggérés : {(PROGRAMS_BY_TYPE[form.type] || []).join(', ')}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
          <input type="text" value={form.code} onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})} className="input-field" placeholder="Ex: ATO-001" disabled={editing} />
          {editing && <p className="text-xs text-gray-400 mt-1">Le code ne peut pas être modifié</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="input-field" rows={3} placeholder="Description optionnelle..." />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Annuler</button>
        <button onClick={onSave} disabled={saving} className="btn-primary text-sm">
          {saving ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer'}
        </button>
      </div>
    </Modal>
  );
}

// ======== REUSABLE MODAL ========
function Modal({ title, onClose, error, children }: {
  title: string; onClose: () => void; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
