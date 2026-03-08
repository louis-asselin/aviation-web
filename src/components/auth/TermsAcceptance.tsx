'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

export default function TermsAcceptance() {
  const { acceptTerms, declineTerms, logout } = useAuth();
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeclineWarning, setShowDeclineWarning] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const canAccept = termsChecked && privacyChecked;

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await acceptTerms();
    } catch {
      alert('Failed to accept terms. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = () => {
    if (!showDeclineWarning) {
      setShowDeclineWarning(true);
      return;
    }
    declineTerms();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-accent-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-accent-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Terms & Conditions</h1>
            <p className="text-gray-500 mt-2">Please review and accept to continue</p>
          </div>

          {/* Terms of Service */}
          <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === 'terms' ? null : 'terms')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="font-semibold text-gray-800">Terms of Service</span>
              {expandedSection === 'terms' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {expandedSection === 'terms' && (
              <div className="p-4 text-sm text-gray-600 max-h-60 overflow-y-auto space-y-3">
                <p><strong>1. Acceptance of Terms</strong> — By accessing the Aviation Learning platform, you agree to be bound by these Terms of Service.</p>
                <p><strong>2. User Accounts</strong> — You are responsible for maintaining the confidentiality of your login credentials.</p>
                <p><strong>3. Intellectual Property</strong> — All content on this platform is protected by intellectual property rights. Any unauthorized dissemination without written consent from the founder of this application may result in criminal prosecution.</p>
                <p><strong>4. User Conduct</strong> — You agree not to share your credentials, copy/distribute course materials, or attempt to gain unauthorized access.</p>
                <p><strong>5. Limitation of Liability</strong> — The platform is provided &quot;as is&quot; without warranties of any kind.</p>
                <p><strong>6. ATO Content Responsibility</strong> — Course content is subject to each ATO&apos;s approval. The ATO is responsible if their content does not comply with regulatory requirements. The platform disclaims all liability regarding content.</p>
                <p><strong>7. Pilot & General User Disclaimer</strong> — Information provided is for informational purposes only and cannot replace or contradict approved texts, laws, regulations, or any other official documentation. Users remain responsible for the legal validity of these texts.</p>
                <p><strong>8. Modifications</strong> — We reserve the right to modify these terms at any time. Continued use constitutes acceptance.</p>
              </div>
            )}
          </div>

          {/* Privacy Policy */}
          <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === 'privacy' ? null : 'privacy')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="font-semibold text-gray-800">Privacy Policy</span>
              {expandedSection === 'privacy' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {expandedSection === 'privacy' && (
              <div className="p-4 text-sm text-gray-600 max-h-60 overflow-y-auto space-y-3">
                <p><strong>Data Controller</strong> — Your organization (ATO, airline, or other entity) determines the purposes for processing your personal data.</p>
                <p><strong>Data Collected</strong> — We collect: identity data (name, email, date of birth), training data (progress, exam results, qualifications), and technical data (session info, preferences).</p>
                <p><strong>Purpose</strong> — Data is used exclusively for authentication, training management, progress tracking, and organizational administration.</p>
                <p><strong>Legal Basis (GDPR Art. 6)</strong> — Processing based on: your consent (Art. 6.1.a), contractual necessity (Art. 6.1.b), and legal obligations (Art. 6.1.c).</p>
                <p><strong>Data Retention</strong> — Account data retained for duration of activity + 5 years. Training records minimum 5 years post-training per aviation regulations.</p>
                <p><strong>Your Rights</strong> — Right of access (Art. 15), rectification (Art. 16), erasure (Art. 17), portability (Art. 20). Exercise via Settings &gt; Personal Data.</p>
                <p><strong>Security</strong> — HTTPS encryption, bcrypt password hashing, JWT authentication, rate limiting, Helmet.js security headers.</p>
                <p><strong>No Third-Party Sharing</strong> — We do not share data with third parties, advertisers, or analytics platforms.</p>
              </div>
            )}
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsChecked}
                onChange={(e) => setTermsChecked(e.target.checked)}
                className="mt-1 w-4 h-4 text-accent-500 rounded focus:ring-accent-500"
              />
              <span className="text-sm text-gray-700">
                I have read and accept the <strong>Terms of Service</strong>
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyChecked}
                onChange={(e) => setPrivacyChecked(e.target.checked)}
                className="mt-1 w-4 h-4 text-accent-500 rounded focus:ring-accent-500"
              />
              <span className="text-sm text-gray-700">
                I have read and accept the <strong>Privacy Policy</strong>
              </span>
            </label>
          </div>

          {/* Decline warning */}
          {showDeclineWarning && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold">Warning</p>
                <p>If you decline, you will not be able to access the platform content. You will be signed out. Click &quot;Decline&quot; again to confirm.</p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleDecline}
              className="btn-secondary flex-1"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={!canAccept || isLoading}
              className="btn-primary flex-1"
            >
              {isLoading ? 'Accepting...' : 'Accept and Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
