'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { orgsApi, studentTrackingApi, Organization, TrackingStudent } from '@/lib/api';
import { Search, Users, GraduationCap, Filter } from 'lucide-react';

const ATPL_SUBJECTS = ['010','021','022','031','032','033','040','050','061','062','070','081','090','100'];
const SUBJECT_NAMES: Record<string, string> = {
  '010': 'Air Law', '021': 'Airframe & Systems', '022': 'Instrumentation',
  '031': 'Mass & Balance', '032': 'Performance', '033': 'Flight Planning',
  '040': 'Human Performance', '050': 'Meteorology', '061': 'General Navigation',
  '062': 'Radio Navigation', '070': 'Operational Procedures', '081': 'Principles of Flight',
  '090': 'Communications', '100': 'Principles of Flight (H)'
};

export default function StudentTrackingView() {
  const { token, user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [students, setStudents] = useState<TrackingStudent[]>([]);
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [studentDetail, setStudentDetail] = useState<Record<string, unknown> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Load ATO organizations
  useEffect(() => {
    if (!token) return;
    orgsApi.list(token).then((orgs) => {
      const atoOrgs = (Array.isArray(orgs) ? orgs : []).filter((o) => o.type === 'ato');
      setOrganizations(atoOrgs);
      if (atoOrgs.length > 0) setSelectedOrgId(String(atoOrgs[0].id));
    }).catch(() => {});
  }, [token]);

  // Load students when org selected
  useEffect(() => {
    if (!token || !selectedOrgId) return;
    setLoading(true);
    studentTrackingApi.students(selectedOrgId, token)
      .then((data) => setStudents(Array.isArray(data) ? data : []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [token, selectedOrgId]);

  // Load student detail
  const loadStudentDetail = async (studentId: string) => {
    if (!token || !selectedOrgId) return;
    setSelectedStudent(studentId);
    setDetailLoading(true);
    try {
      const detail = await studentTrackingApi.studentDetail(selectedOrgId, studentId, token) as Record<string, unknown>;
      setStudentDetail(detail);
    } catch {
      setStudentDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch = `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(search.toLowerCase());
    const matchesProgram = programFilter === 'all' || s.assignedProgram === programFilter;
    return matchesSearch && matchesProgram;
  });

  const programs = [...new Set(students.map(s => s.assignedProgram).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">ATPL Tracking</h1>
      </div>

      {/* Org selector + filters */}
      <div className="flex flex-wrap gap-4 items-center">
        {organizations.length > 1 && (
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="input-field max-w-xs"
          >
            {organizations.map((org) => (
              <option key={org.id} value={String(org.id)}>{org.name}</option>
            ))}
          </select>
        )}

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {programs.length > 0 && (
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="input-field max-w-[200px]"
          >
            <option value="all">All Programs</option>
            {programs.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        )}
      </div>

      {organizations.length === 0 && (
        <div className="text-center py-16">
          <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No ATO organization found.</p>
          <p className="text-sm text-gray-400 mt-1">ATPL Tracking is only available for ATO-type organizations.</p>
        </div>
      )}

      {organizations.length > 0 && (
        <>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No students found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="card cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => loadStudentDetail(student.id)}
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
                    <div className="flex items-center gap-3">
                      {student.promotion && (
                        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                          {student.promotion}
                        </span>
                      )}
                      {student.assignedProgram && (
                        <span className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-full font-medium">
                          {student.assignedProgram}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {selectedStudent === student.id && (
                    <div className="mt-4 pt-4 border-t">
                      {detailLoading ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                        </div>
                      ) : studentDetail ? (
                        <StudentDetailPanel detail={studentDetail} />
                      ) : (
                        <p className="text-sm text-gray-400 text-center py-4">Unable to load details</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StudentDetailPanel({ detail }: { detail: Record<string, unknown> }) {
  const attendance = (detail.attendance || []) as Array<{ subject: string; hours: number }>;
  const validations = (detail.validations || []) as Array<{ subject: string; isValidated: boolean }>;
  const examResults = (detail.examResults || []) as Array<{ subject: string; isPassed: boolean; attempts: number }>;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-blue-50 rounded-lg text-center">
          <p className="text-xs text-blue-600">Total Hours</p>
          <p className="text-lg font-bold text-blue-900">
            {attendance.reduce((sum, a) => sum + (a.hours || 0), 0).toFixed(1)}h
          </p>
        </div>
        <div className="p-3 bg-green-50 rounded-lg text-center">
          <p className="text-xs text-green-600">Validated</p>
          <p className="text-lg font-bold text-green-900">
            {validations.filter(v => v.isValidated).length}/{ATPL_SUBJECTS.length}
          </p>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg text-center">
          <p className="text-xs text-purple-600">Exams Passed</p>
          <p className="text-lg font-bold text-purple-900">
            {examResults.filter(e => e.isPassed).length}/{ATPL_SUBJECTS.length}
          </p>
        </div>
      </div>

      {/* Subject table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 text-gray-500 font-medium">Subject</th>
              <th className="py-2 text-center text-gray-500 font-medium">Hours</th>
              <th className="py-2 text-center text-gray-500 font-medium">Validated</th>
              <th className="py-2 text-center text-gray-500 font-medium">Exam</th>
            </tr>
          </thead>
          <tbody>
            {ATPL_SUBJECTS.map((subj) => {
              const att = attendance.find(a => a.subject === subj);
              const val = validations.find(v => v.subject === subj);
              const exam = examResults.find(e => e.subject === subj);
              return (
                <tr key={subj} className="border-b border-gray-50">
                  <td className="py-2">
                    <span className="font-medium text-gray-700">{subj}</span>
                    <span className="text-gray-400 ml-2 text-xs">{SUBJECT_NAMES[subj] || ''}</span>
                  </td>
                  <td className="py-2 text-center text-gray-600">{att?.hours ? `${att.hours}h` : '-'}</td>
                  <td className="py-2 text-center">
                    {val?.isValidated ? (
                      <span className="text-green-500 font-medium">Yes</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="py-2 text-center">
                    {exam ? (
                      <span className={`font-medium ${exam.isPassed ? 'text-green-500' : 'text-red-500'}`}>
                        {exam.isPassed ? 'Passed' : 'Failed'} ({exam.attempts})
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
