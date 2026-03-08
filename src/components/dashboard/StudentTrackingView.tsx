'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { orgsApi, usersApi, studentTrackingApi, Organization, User } from '@/lib/api';
import { Search, Users, GraduationCap, ChevronDown, ChevronUp } from 'lucide-react';

const ATPL_SUBJECTS = ['010','021','022','031','032','033','040','050','061','062','070','081','090','100'];
const SUBJECT_NAMES: Record<string, string> = {
  '010': 'Air Law', '021': 'Airframe & Systems', '022': 'Instrumentation',
  '031': 'Mass & Balance', '032': 'Performance', '033': 'Flight Planning',
  '040': 'Human Performance', '050': 'Meteorology', '061': 'General Navigation',
  '062': 'Radio Navigation', '070': 'Operational Procedures', '081': 'Principles of Flight',
  '090': 'Communications', '100': 'Communications (IFR)'
};

const ATPL_PROGRAMS = ['ATPL', 'ATPI', 'MODULAIRE'];

export default function StudentTrackingView() {
  const { token } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [studentDetail, setStudentDetail] = useState<Record<string, unknown> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Load all organizations and users
  useEffect(() => {
    if (!token) return;
    setLoading(true);

    Promise.all([
      orgsApi.list(token),
      usersApi.list(token),
    ]).then(([orgs, users]) => {
      const allOrgs = Array.isArray(orgs) ? orgs : [];
      const allU = Array.isArray(users) ? users : [];

      // Show all orgs (ATO first)
      const sorted = [...allOrgs].sort((a, b) => {
        if (a.type === 'ato' && b.type !== 'ato') return -1;
        if (a.type !== 'ato' && b.type === 'ato') return 1;
        return a.name.localeCompare(b.name);
      });
      setOrganizations(sorted);
      setAllUsers(allU);

      if (sorted.length > 0) setSelectedOrgId(String(sorted[0].id));
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  // Filter students when org changes
  useEffect(() => {
    if (!selectedOrgId || allUsers.length === 0) {
      setStudents([]);
      return;
    }

    // Filter: role=student, belongs to selected org, has ATPL program
    const filtered = allUsers.filter((u) => {
      if (u.role !== 'student') return false;
      // Check org membership
      const inOrg = u.organizations?.some((o) => String(o.id) === selectedOrgId);
      if (!inOrg) return false;
      return true;
    });

    setStudents(filtered);
    setSelectedStudent(null);
    setStudentDetail(null);
  }, [selectedOrgId, allUsers]);

  // Load student detail (ATPL tracking summary)
  const loadStudentDetail = async (studentId: string) => {
    if (!token || !selectedOrgId) return;
    if (selectedStudent === studentId) {
      setSelectedStudent(null);
      setStudentDetail(null);
      return;
    }
    setSelectedStudent(studentId);
    setDetailLoading(true);
    try {
      const detail = await studentTrackingApi.summary(studentId, selectedOrgId, token) as Record<string, unknown>;
      setStudentDetail(detail);
    } catch (_err) {
      setStudentDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const fullName = `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">ATPL Tracking</h1>
        <span className="text-sm text-gray-500">{filteredStudents.length} étudiant{filteredStudents.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Org selector + search */}
      <div className="flex flex-wrap gap-4 items-center">
        {organizations.length > 0 && (
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="input-field max-w-xs"
          >
            {organizations.map((org) => (
              <option key={org.id} value={String(org.id)}>{org.name} ({org.type})</option>
            ))}
          </select>
        )}

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un étudiant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {organizations.length === 0 && !loading ? (
        <div className="text-center py-16">
          <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune organisation trouvée.</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun étudiant trouvé dans cette organisation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="card cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => loadStudentDetail(String(student.id))}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-sm">
                    {student.firstName?.[0]}{student.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                    <p className="text-xs text-gray-500">{student.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {student.gender && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {student.gender === 'male' ? 'M' : student.gender === 'female' ? 'F' : student.gender}
                    </span>
                  )}
                  {selectedStudent === String(student.id)
                    ? <ChevronUp className="w-4 h-4 text-gray-400" />
                    : <ChevronDown className="w-4 h-4 text-gray-400" />
                  }
                </div>
              </div>

              {/* Expanded detail */}
              {selectedStudent === String(student.id) && (
                <div className="mt-4 pt-4 border-t" onClick={(e) => e.stopPropagation()}>
                  {detailLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    </div>
                  ) : studentDetail ? (
                    <StudentDetailPanel detail={studentDetail} />
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">Impossible de charger le détail du suivi</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentDetailPanel({ detail }: { detail: Record<string, unknown> }) {
  const totalHoursBySubject = (detail.totalHoursBySubject || {}) as Record<string, number>;
  const minimumHoursBySubject = (detail.minimumHoursBySubject || {}) as Record<string, number>;
  const validations = (detail.validations || []) as Array<{ subject: string; isValidated: boolean; validatedByName?: string }>;
  const examResults = (detail.examResults || []) as Array<{ subject: string; isPassed: boolean; attempts: number }>;
  const ctkiAuthorizations = (detail.ctkiAuthorizations || []) as Array<{ subject: string; status: string }>;

  const totalHours = Object.values(totalHoursBySubject).reduce((sum, h) => sum + h, 0);
  const validatedCount = validations.filter(v => v.isValidated).length;
  const passedCount = examResults.filter(e => e.isPassed).length;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-blue-50 rounded-lg text-center">
          <p className="text-xs text-blue-600">Heures totales</p>
          <p className="text-lg font-bold text-blue-900">{totalHours.toFixed(1)}h</p>
        </div>
        <div className="p-3 bg-green-50 rounded-lg text-center">
          <p className="text-xs text-green-600">Validées</p>
          <p className="text-lg font-bold text-green-900">{validatedCount}/{ATPL_SUBJECTS.length}</p>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg text-center">
          <p className="text-xs text-purple-600">Examens réussis</p>
          <p className="text-lg font-bold text-purple-900">{passedCount}/{ATPL_SUBJECTS.length}</p>
        </div>
      </div>

      {/* Subject table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 text-gray-500 font-medium">Matière</th>
              <th className="py-2 text-center text-gray-500 font-medium">Heures</th>
              <th className="py-2 text-center text-gray-500 font-medium">Min</th>
              <th className="py-2 text-center text-gray-500 font-medium">Validé</th>
              <th className="py-2 text-center text-gray-500 font-medium">CTKI</th>
              <th className="py-2 text-center text-gray-500 font-medium">Examen</th>
            </tr>
          </thead>
          <tbody>
            {ATPL_SUBJECTS.map((subj) => {
              const hours = totalHoursBySubject[subj] || 0;
              const minHours = minimumHoursBySubject[subj] || 0;
              const val = validations.find(v => v.subject === subj);
              const exam = examResults.find(e => e.subject === subj);
              const ctki = ctkiAuthorizations.find(c => c.subject === subj);
              const hoursOk = minHours > 0 ? hours >= minHours : hours > 0;
              return (
                <tr key={subj} className="border-b border-gray-50">
                  <td className="py-2">
                    <span className="font-medium text-gray-700">{subj}</span>
                    <span className="text-gray-400 ml-2 text-xs">{SUBJECT_NAMES[subj] || ''}</span>
                  </td>
                  <td className={`py-2 text-center ${hoursOk ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                    {hours > 0 ? `${hours}h` : '-'}
                  </td>
                  <td className="py-2 text-center text-gray-400 text-xs">
                    {minHours > 0 ? `${minHours}h` : '-'}
                  </td>
                  <td className="py-2 text-center">
                    {val?.isValidated ? (
                      <span className="text-green-500 font-medium">&#10003;</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="py-2 text-center">
                    {ctki ? (
                      <span className={`text-xs font-medium ${ctki.status === 'authorized' ? 'text-green-500' : ctki.status === 'refused' ? 'text-red-500' : 'text-yellow-500'}`}>
                        {ctki.status === 'authorized' ? '✓' : ctki.status === 'refused' ? '✗' : '...'}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="py-2 text-center">
                    {exam ? (
                      <span className={`font-medium text-xs ${exam.isPassed ? 'text-green-500' : 'text-red-500'}`}>
                        {exam.isPassed ? 'Réussi' : 'Échoué'} ({exam.attempts})
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
