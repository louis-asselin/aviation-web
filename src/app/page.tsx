'use client';

import { useAuth } from '@/contexts/AuthContext';
import LoginPage from './login/page';
import TwoFactorInput from '@/components/auth/TwoFactorInput';
import ForceChangePassword from '@/components/auth/ForceChangePassword';
import TermsAcceptance from '@/components/auth/TermsAcceptance';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function Home() {
  const { user, isLoading, mustChangePassword, needsTermsAcceptance, hasAcceptedTerms, requiresTwoFactor } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // 2FA verification required
  if (requiresTwoFactor) {
    return <TwoFactorInput />;
  }

  // Not logged in → show login
  if (!user) {
    return <LoginPage />;
  }

  // Must change password first
  if (mustChangePassword) {
    return <ForceChangePassword />;
  }

  // Must accept terms
  if (needsTermsAcceptance || !hasAcceptedTerms) {
    return <TermsAcceptance />;
  }

  // Authenticated → show dashboard
  return <DashboardLayout />;
}
