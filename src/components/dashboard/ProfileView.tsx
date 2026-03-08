'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { User, Mail, Phone, MapPin, Calendar, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { getRoleLabel, formatDate, getInitials } from '@/lib/utils';

export default function ProfileView() {
  const { user, token, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    zipCode: user?.zipCode || '',
    country: user?.country || '',
  });

  const handleSave = async () => {
    if (!token) return;
    setIsSaving(true);
    setMessage(null);
    try {
      await authApi.updateProfile(form, token);
      updateUser(form);
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      setIsEditing(false);
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : 'Failed to update profile.';
      setMessage({ type: 'error', text });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile header */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-accent-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {user ? getInitials(user.firstName, user.lastName) : '?'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</h1>
            <p className="text-gray-500">{user?.email}</p>
            <span className="badge bg-accent-100 text-accent-700 mt-1">{getRoleLabel(user?.role || '')}</span>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Profile details */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="btn-secondary text-sm py-1.5">
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(false)} className="btn-secondary text-sm py-1.5">Cancel</button>
              <button onClick={handleSave} disabled={isSaving} className="btn-primary text-sm py-1.5 flex items-center gap-1">
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">First Name</label>
            {isEditing ? (
              <input
                value={form.firstName}
                onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))}
                className="input-field"
              />
            ) : (
              <p className="text-gray-900">{user?.firstName || '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Last Name</label>
            {isEditing ? (
              <input
                value={form.lastName}
                onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))}
                className="input-field"
              />
            ) : (
              <p className="text-gray-900">{user?.lastName || '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
            <p className="text-gray-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              {user?.email || '—'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
            {isEditing ? (
              <input
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                className="input-field"
                placeholder="+33 6 12 34 56 78"
              />
            ) : (
              <p className="text-gray-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                {user?.phone || '—'}
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
            {isEditing ? (
              <input
                value={form.address}
                onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                className="input-field"
                placeholder="123 Aviation Street"
              />
            ) : (
              <p className="text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                {[user?.address, user?.city, user?.zipCode, user?.country].filter(Boolean).join(', ') || '—'}
              </p>
            )}
          </div>
          {isEditing && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">City</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Zip Code</label>
                <input
                  value={form.zipCode}
                  onChange={(e) => setForm(f => ({ ...f, zipCode: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Country</label>
                <input
                  value={form.country}
                  onChange={(e) => setForm(f => ({ ...f, country: e.target.value }))}
                  className="input-field"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Account info */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Role</span>
            <span className="font-medium">{getRoleLabel(user?.role || '')}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Member since</span>
            <span className="font-medium">{user?.createdAt ? formatDate(user.createdAt) : '—'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Terms accepted</span>
            <span className={`font-medium ${user?.acceptedTermsAt ? 'text-green-600' : 'text-orange-500'}`}>
              {user?.acceptedTermsAt ? formatDate(user.acceptedTermsAt) : 'Pending'}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Date of birth</span>
            <span className="font-medium">{user?.dateOfBirth ? formatDate(user.dateOfBirth) : '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
