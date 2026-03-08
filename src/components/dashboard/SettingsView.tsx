'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { gdprApi } from '@/lib/api';
import {
  Settings, Shield, FileText, Download, Trash2, KeyRound,
  AlertTriangle, CheckCircle2, Eye, EyeOff
} from 'lucide-react';

export default function SettingsView() {
  const { user, token, logout, changePassword } = useAuth();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: string; text: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordMessage({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to change password.';
      setPasswordMessage({ type: 'error', text: message });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleExportData = async () => {
    if (!token) return;
    setIsExporting(true);
    try {
      const data = await gdprApi.exportData(token);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gdpr-export-${user?.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export data.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!token) return;
    setIsDeleting(true);
    try {
      await gdprApi.deleteAccount(token);
      alert('Account deletion requested. Your account will be permanently deleted in 30 days.');
      logout();
    } catch (err) {
      alert('Failed to request account deletion.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>

      {/* Security */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Security</h2>
        </div>

        {passwordMessage && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
            passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {passwordMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {passwordMessage.text}
          </div>
        )}

        {showPasswordForm ? (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={showPasswords} onChange={(e) => setShowPasswords(e.target.checked)} />
              Show passwords
            </label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowPasswordForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={isChangingPassword} className="btn-primary">
                {isChangingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        ) : (
          <button onClick={() => setShowPasswordForm(true)} className="btn-secondary">
            Change Password
          </button>
        )}
      </div>

      {/* Legal */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Legal Information</h2>
        </div>
        <div className="space-y-3">
          <a href="#" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-gray-700">
            <FileText className="w-5 h-5 text-accent-500" />
            <span className="text-sm font-medium">Terms of Service</span>
          </a>
          <a href="#" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-gray-700">
            <Shield className="w-5 h-5 text-accent-500" />
            <span className="text-sm font-medium">Privacy Policy</span>
          </a>
        </div>
      </div>

      {/* Personal Data (GDPR) */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Personal Data</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          In accordance with GDPR Article 20, you can export all your personal data or request account deletion.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export My Data'}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-danger flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete My Account
          </button>
        </div>

        {showDeleteConfirm && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Are you sure?</p>
                <p className="text-sm text-red-600 mt-1">
                  Your account will be deactivated immediately and permanently deleted after 30 days.
                  You can contact support to cancel this within the grace period.
                </p>
                <div className="flex gap-3 mt-3">
                  <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary text-sm py-1.5 px-3">
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-1.5 px-3 rounded-lg"
                  >
                    {isDeleting ? 'Deleting...' : 'Confirm Deletion'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
