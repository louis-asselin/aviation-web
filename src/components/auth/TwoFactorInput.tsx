'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Plane, Shield, AlertCircle } from 'lucide-react';

export default function TwoFactorInput() {
  const { verifyTwoFactor, cancelTwoFactor } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (code.length !== 6) {
      setError('Please enter a 6-digit code.');
      return;
    }

    setIsLoading(true);
    try {
      await verifyTwoFactor(code);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid code. Please try again.';
      setError(message);
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h2>
          <p className="text-gray-500 mt-2">Enter the 6-digit code from your authenticator app</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1.5">
              Verification Code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="input-field text-center text-2xl tracking-widest font-mono"
              placeholder="000000"
              required
              autoFocus
              autoComplete="one-time-code"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </button>

          <button
            type="button"
            onClick={cancelTwoFactor}
            className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Back to login
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-gray-400">
          Open your authenticator app (Google Authenticator, Authy, etc.) to get the code.
        </p>
      </div>
    </div>
  );
}
