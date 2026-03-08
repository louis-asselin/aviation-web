'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { coursesApi, Course, Module } from '@/lib/api';
import { BookOpen, ChevronRight, FileText, ArrowLeft, Clock, Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function CoursesView() {
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingModules, setIsLoadingModules] = useState(false);

  useEffect(() => {
    if (!token) return;
    coursesApi.list(token)
      .then(data => setCourses(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to load courses:', err))
      .finally(() => setIsLoading(false));
  }, [token]);

  const openCourse = async (course: Course) => {
    if (!token) return;
    setSelectedCourse(course);
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
