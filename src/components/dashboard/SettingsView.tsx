'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { gdprApi, twoFactorApi, bugReportsApi } from '@/lib/api';
import {
  Shield, FileText, Download, Trash2, KeyRound,
  AlertTriangle, CheckCircle2, Eye, EyeOff, Smartphone, Bug
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

  // 2FA states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorMessage, setTwoFactorMessage] = useState<{ type: string; text: string } | null>(null);
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disableCode, setDisableCode] = useState('');

  // Bug report states
  const [showBugForm, setShowBugForm] = useState(false);
  const [bugTitle, setBugTitle] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [bugCategory, setBugCategory] = useState('general');
  const [bugSeverity, setBugSeverity] = useState('medium');
  const [isSubmittingBug, setIsSubmittingBug] = useState(false);
  const [bugMessage, setBugMessage] = useState<{ type: string; text: string } | null>(null);

  // Load 2FA status
  useEffect(() => {
    if (!token) return;
    twoFactorApi.status(token).then(data => {
      setTwoFactorEnabled(data.twoFactorEnabled);
    }).catch(() => {});
  }, [token]);

  const handleSetup2FA = async () => {
    if (!token) return;
    setIs2FALoading(true);
    setTwoFactorMessage(null);
    try {
      const data = await twoFactorApi.setup(token);
      setQrCodeUrl(data.qrCodeUrl);
      setShowSetup2FA(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to setup 2FA.';
      setTwoFactorMessage({ type: 'error', text: message });
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleConfirm2FA = async () => {
    if (!token || twoFactorCode.length !== 6) return;
    setIs2FALoading(true);
    setTwoFactorMessage(null);
    try {
      await twoFactorApi.confirm(twoFactorCode, token);
      setTwoFactorEnabled(true);
      setShowSetup2FA(false);
      setTwoFactorCode('');
      setQrCodeUrl('');
      setTwoFactorMessage({ type: 'success', text: '2FA enabled successfully.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid code.';
      setTwoFactorMessage({ type: 'error', text: message });
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!token || disableCode.length !== 6) return;
    setIs2FALoading(true);
    setTwoFactorMessage(null);
    try {
      await twoFactorApi.disable(disableCode, token);
      setTwoFactorEnabled(false);
      setShowDisable2FA(false);
      setDisableCode('');
      setTwoFactorMessage({ type: 'success', text: '2FA disabled.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid code.';
      setTwoFactorMessage({ type: 'error', text: message });
    } finally {
      setIs2FALoading(false);
    }
  };

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

      {/* Two-Factor Authentication */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h2>
        </div>

        {twoFactorMessage && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
            twoFactorMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {twoFactorMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {twoFactorMessage.text}
          </div>
        )}

        {twoFactorEnabled ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-4 h-4" /> Enabled
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Your account is protected with two-factor authentication.
            </p>

            {showDisable2FA ? (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Enter your authenticator code to disable 2FA</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                  className="input-field text-center text-lg tracking-widest font-mono max-w-xs"
                  placeholder="000000"
                />
                <div className="flex gap-3">
                  <button onClick={() => { setShowDisable2FA(false); setDisableCode(''); }} className="btn-secondary">Cancel</button>
                  <button
                    onClick={handleDisable2FA}
                    disabled={is2FALoading || disableCode.length !== 6}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg"
                  >
                    {is2FALoading ? 'Disabling...' : 'Disable 2FA'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowDisable2FA(true)} className="btn-secondary text-red-600">
                Disable 2FA
              </button>
            )}
          </div>
        ) : showSetup2FA ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
            </p>
            {qrCodeUrl && (
              <div className="flex justify-center">
                <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter the 6-digit code from your app</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                className="input-field text-center text-lg tracking-widest font-mono max-w-xs"
                placeholder="000000"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowSetup2FA(false); setTwoFactorCode(''); }} className="btn-secondary">Cancel</button>
              <button
                onClick={handleConfirm2FA}
                disabled={is2FALoading || twoFactorCode.length !== 6}
                className="btn-primary"
              >
                {is2FALoading ? 'Verifying...' : 'Confirm & Enable'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Add an extra layer of security by enabling two-factor authentication with an authenticator app.
            </p>
            <button onClick={handleSetup2FA} disabled={is2FALoading} className="btn-primary">
              {is2FALoading ? 'Setting up...' : 'Enable 2FA'}
            </button>
          </div>
        )}
      </div>

      {/* Bug Report (for non-admin users) */}
      {user && user.role !== 'admin' && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Bug className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Report a Bug</h2>
          </div>

          {bugMessage && (
            <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
              bugMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {bugMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {bugMessage.text}
            </div>
          )}

          {showBugForm ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={bugTitle}
                  onChange={e => setBugTitle(e.target.value)}
                  className="input-field"
                  placeholder="Brief description of the issue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={bugDescription}
                  onChange={e => setBugDescription(e.target.value)}
                  className="input-field min-h-[100px]"
                  placeholder="Describe the issue in detail..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={bugCategory} onChange={e => setBugCategory(e.target.value)} className="input-field">
                    <option value="general">General</option>
                    <option value="ui">User Interface</option>
                    <option value="content">Content</option>
                    <option value="performance">Performance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                  <select value={bugSeverity} onChange={e => setBugSeverity(e.target.value)} className="input-field">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowBugForm(false); setBugTitle(''); setBugDescription(''); }} className="btn-secondary">Cancel</button>
                <button
                  onClick={async () => {
                    if (!token || !bugTitle || !bugDescription) return;
                    setIsSubmittingBug(true);
                    setBugMessage(null);
                    try {
                      const deviceInfo = `${navigator.userAgent.includes('iPad') ? 'iPad' : 'Web'} - ${navigator.platform}`;
                      await bugReportsApi.submit({
                        title: bugTitle,
                        description: bugDescription,
                        category: bugCategory,
                        severity: bugSeverity,
                        deviceInfo,
                      }, token);
                      setBugMessage({ type: 'success', text: 'Bug report submitted. Thank you!' });
                      setTimeout(() => setBugMessage(null), 4000);
                      setShowBugForm(false);
                      setBugTitle('');
                      setBugDescription('');
                    } catch (err: unknown) {
                      const msg = err instanceof Error ? err.message : 'Failed to submit';
                      setBugMessage({ type: 'error', text: msg });
                    } finally {
                      setIsSubmittingBug(false);
                    }
                  }}
                  disabled={isSubmittingBug || !bugTitle || !bugDescription}
                  className="btn-primary"
                >
                  {isSubmittingBug ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                Found a bug or issue? Let us know and our team will look into it.
              </p>
              <button onClick={() => setShowBugForm(true)} className="btn-secondary">
                Report a Bug
              </button>
            </div>
          )}
        </div>
      )}

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
