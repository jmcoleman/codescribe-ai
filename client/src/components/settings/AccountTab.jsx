import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, User, Save, Check, AlertCircle, Download } from 'lucide-react';
import { toastCompact } from '../../utils/toast';
import { RoleBadge } from '../RoleBadge';
import { TierOverridePanel } from '../TierOverridePanel';
import { useTierOverride } from '../../hooks/useTierOverride';
import { STORAGE_KEYS, getStorageItem } from '../../constants/storage';

export function AccountTab() {
  const { user, updateProfile } = useAuth();
  const { override, applyOverride, clearOverride } = useTierOverride();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Profile form state
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Error states
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Password strength indicators
  const passwordChecks = {
    length: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
  };

  const passwordStrength = Object.values(passwordChecks).filter(Boolean).length;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setIsSaving(true);

    try {
      // Validate inputs
      if (!email.trim()) {
        setProfileError('Email is required');
        setIsSaving(false);
        return;
      }

      if ((firstName || lastName) && (!firstName.trim() || !lastName.trim())) {
        setProfileError('Both first and last name are required');
        setIsSaving(false);
        return;
      }

      // Call API to update profile
      const updates = { email: email.trim() };
      if (firstName && lastName) {
        updates.first_name = firstName.trim();
        updates.last_name = lastName.trim();
      }

      await updateProfile(updates);

      toastCompact('Profile updated successfully', 'success');
      setIsEditing(false);
    } catch (error) {
      setProfileError(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setFirstName(user?.first_name || '');
    setLastName(user?.last_name || '');
    setEmail(user?.email || '');
    setProfileError('');
  };

  const handleDataExport = async () => {
    setIsExporting(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

      const response = await fetch(`${API_URL}/api/user/data-export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to export data');
      }

      // Get filename from header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'codescribe-ai-data-export.json';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) filename = filenameMatch[1];
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toastCompact('Data export downloaded successfully', 'success');
    } catch (error) {
      toastCompact(error.message || 'Failed to export data', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    // Validate
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(`${API_URL}/api/auth/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Log for debugging
        console.error('Password change failed:', {
          status: response.status,
          error: data.error,
          details: data
        });
        throw new Error(data.error || 'Failed to change password');
      }

      toastCompact('Password changed successfully', 'success');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError(error.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5" aria-hidden="true" />
            Profile Information
          </h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter your first name"
            />
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter your last name"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isEditing}
                className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="your.email@example.com"
              />
            </div>
          </div>

          {/* Account Role */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Account Role
            </label>
            <div className="flex items-center">
              <RoleBadge role={user?.role} size="md" />
            </div>
          </div>

          {/* Error Message */}
          {profileError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span>{profileError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div
            className={`overflow-hidden transition-all duration-200 ${
              isEditing
                ? 'max-h-20 opacity-100'
                : 'max-h-0 opacity-0'
            }`}
          >
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={isSaving}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-medium hover:bg-slate-200 active:bg-slate-300 dark:hover:bg-slate-600 dark:active:bg-slate-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg font-semibold shadow-lg shadow-purple-600/20 dark:shadow-purple-900/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" aria-hidden="true" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Password Section */}
      {user?.auth_method === 'email' && (
        <div className="pt-8 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5" aria-hidden="true" />
              Password
            </h2>
            {!showPasswordForm && (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
              >
                Change Password
              </button>
            )}
          </div>

          {showPasswordForm && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Error Message */}
              {passwordError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span>{passwordError}</span>
                </div>
              )}

              {/* Current Password */}
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter current password"
                />
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter new password (min. 8 characters)"
                />

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-1" role="status" aria-live="polite">
                      <span className="sr-only">
                        Password strength: {
                          passwordStrength <= 2 ? 'Weak' :
                          passwordStrength === 3 ? 'Medium' : 'Strong'
                        }
                      </span>
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            level <= passwordStrength
                              ? passwordStrength <= 2
                                ? 'bg-red-500'
                                : passwordStrength === 3
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <div className="space-y-1">
                      <PasswordCheck met={passwordChecks.length}>
                        At least 8 characters
                      </PasswordCheck>
                      <PasswordCheck met={passwordChecks.hasUpper}>
                        One uppercase letter
                      </PasswordCheck>
                      <PasswordCheck met={passwordChecks.hasLower}>
                        One lowercase letter
                      </PasswordCheck>
                      <PasswordCheck met={passwordChecks.hasNumber}>
                        One number
                      </PasswordCheck>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Confirm new password"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError('');
                  }}
                  disabled={isChangingPassword}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-medium hover:bg-slate-200 active:bg-slate-300 dark:hover:bg-slate-600 dark:active:bg-slate-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg font-semibold shadow-lg shadow-purple-600/20 dark:shadow-purple-900/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChangingPassword ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tier Override Panel (Admin/Support Only) */}
      {(user?.role === 'admin' || user?.role === 'support' || user?.role === 'super_admin') && (
        <div className="pt-8 border-t border-slate-200 dark:border-slate-700">
          <TierOverridePanel
            currentTier={user?.tier}
            override={override}
            onApply={applyOverride}
            onClear={clearOverride}
          />
        </div>
      )}

      {/* Data Export Section (GDPR/CCPA) */}
      <div className="pt-8 border-t border-slate-200 dark:border-slate-700">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
            <Download className="w-5 h-5" aria-hidden="true" />
            Export Your Data
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Download all your account data in JSON format (GDPR/CCPA compliance).
          </p>
        </div>

        {/* Collapsible Details */}
        <details className="mb-4 group">
          <summary className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 transition-colors flex items-center gap-2 list-none [&::-webkit-details-marker]:hidden [&::marker]:hidden before:content-none">
            <svg
              className="w-4 h-4 transition-transform group-open:rotate-90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            What's included in the export
          </summary>
          <ul className="list-disc list-inside space-y-1 mt-3 ml-6 text-sm text-slate-600 dark:text-slate-400">
            <li>Profile information (name, email, tier)</li>
            <li>Account settings and preferences</li>
            <li>Usage history and statistics</li>
            <li>Subscription and billing information</li>
          </ul>
        </details>

        <div className="flex justify-end">
          <button
            onClick={handleDataExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg font-semibold shadow-lg shadow-purple-600/20 dark:shadow-purple-900/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" aria-hidden="true" />
                <span>Download My Data</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Password requirement check component
 */
function PasswordCheck({ met, children }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
          met ? 'bg-green-100 dark:bg-green-900/30' : 'bg-slate-100 dark:bg-slate-800'
        }`}
      >
        {met && <Check className="w-3 h-3 text-green-600 dark:text-green-400" aria-hidden="true" />}
      </div>
      <span className={met ? 'text-green-700 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}>
        {children}
      </span>
    </div>
  );
}
