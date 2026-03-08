'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { orgsApi, Organization } from '@/lib/api';
import { Building2, Users, ChevronRight, Search } from 'lucide-react';

export default function AdminOrgsView() {
  const { token } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!token) return;
    orgsApi.list(token)
      .then(data => setOrgs(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to load organizations:', err))
      .finally(() => setIsLoading(false));
  }, [token]);

  const filteredOrgs = orgs.filter(o =>
    o.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <span className="text-sm text-gray-500">{filteredOrgs.length} organization{filteredOrgs.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search organizations..."
          className="input-field pl-10"
        />
      </div>

      {filteredOrgs.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No organizations found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrgs.map((org) => (
            <div key={org.id} className="card hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                    <Building2 className="w-6 h-6 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{org.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="badge bg-gray-100 text-gray-600">{org.type}</span>
                      <span className="text-xs text-gray-500">Code: {org.code}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
              {org.memberCount !== undefined && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  {org.memberCount} member{org.memberCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
