'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { orgsApi, Organization } from '@/lib/api';
import { Building2, Users, Search, Plus, Pencil, X, ToggleLeft, ToggleRight } from 'lucide-react';

interface OrgFormData {
  name: string;
  type: string;
  code: string;
  description: string;
}

const emptyForm: OrgFormData = { name: '', type: 'ato', code: '', description: '' };
const ORG_TYPES = [
  { value: 'ato', label: 'ATO' },
  { value: 'airline', label: 'Compagnie' },
  { value: 'common', label: 'Commun' },
];

export default function AdminOrgsView() {
  const { token } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [form, setForm] = useState<OrgFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  // Open create modal
  const openCreate = () => {
    setEditingOrg(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  // Open edit modal
  const openEdit = (org: Organization) => {
    setEditingOrg(org);
    setForm({
      name: org.name,
      type: org.type,
      code: org.code,
      description: org.description || '',
    });
    setError('');
    setShowModal(true);
  };

  // Save (create or update)
  const handleSave = async () => {
    if (!token || !form.name.trim() || !form.code.trim()) {
      setError('Nom et code sont obligatoires');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingOrg) {
        await orgsApi.update(editingOrg.id, {
          name: form.name,
          type: form.type,
          description: form.description,
        }, token);
      } else {
        await orgsApi.create({
          name: form.name,
          type: form.type,
          code: form.code,
          description: form.description,
        }, token);
      }
      setShowModal(false);
      setIsLoading(true);
      loadOrgs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Toggle active
  const toggleActive = async (org: Organization) => {
    if (!token) return;
    try {
      await orgsApi.update(org.id, { isActive: !org.isActive }, token);
      setIsLoading(true);
      loadOrgs();
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Organizations</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{filteredOrgs.length} organisation{filteredOrgs.length !== 1 ? 's' : ''}</span>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Nouvelle
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher..."
          className="input-field pl-10"
        />
      </div>

      {filteredOrgs.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune organisation trouvée.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrgs.map((org) => (
            <div key={org.id} className="card hover:shadow-md transition-all group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    org.type === 'ato' ? 'bg-blue-50' :
                    org.type === 'airline' ? 'bg-orange-50' :
                    'bg-green-50'
                  }`}>
                    <Building2 className={`w-6 h-6 ${
                      org.type === 'ato' ? 'text-blue-500' :
                      org.type === 'airline' ? 'text-orange-500' :
                      'text-green-500'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{org.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`badge ${
                        org.type === 'ato' ? 'bg-blue-100 text-blue-700' :
                        org.type === 'airline' ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }`}>{org.type.toUpperCase()}</span>
                      <span className="text-xs text-gray-500">Code: {org.code}</span>
                      {org.isActive === false && (
                        <span className="badge bg-red-100 text-red-700">Inactive</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(org)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Modifier"
                  >
                    <Pencil className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => toggleActive(org)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={org.isActive !== false ? 'Désactiver' : 'Activer'}
                  >
                    {org.isActive !== false
                      ? <ToggleRight className="w-5 h-5 text-green-500" />
                      : <ToggleLeft className="w-5 h-5 text-gray-400" />
                    }
                  </button>
                </div>
              </div>

              {org.description && (
                <p className="text-sm text-gray-500 mt-3">{org.description}</p>
              )}

              <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                {org.memberCount !== undefined && (
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {org.memberCount} membre{org.memberCount !== 1 ? 's' : ''}
                  </span>
                )}
                {org.userCount !== undefined && org.memberCount === undefined && (
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {org.userCount} membre{org.userCount !== 1 ? 's' : ''}
                  </span>
                )}
                {org.courseCount !== undefined && (
                  <span className="text-xs">{org.courseCount} cours</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                {editingOrg ? 'Modifier l\'organisation' : 'Nouvelle organisation'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="input-field"
                  placeholder="Ex: Mon ATO"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({...form, type: e.target.value})}
                  className="input-field"
                >
                  {ORG_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({...form, code: e.target.value})}
                  className="input-field"
                  placeholder="Ex: ATO-001"
                  disabled={!!editingOrg}
                />
                {editingOrg && <p className="text-xs text-gray-400 mt-1">Le code ne peut pas être modifié</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  className="input-field"
                  rows={3}
                  placeholder="Description optionnelle..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary text-sm"
              >
                {saving ? 'Enregistrement...' : editingOrg ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
