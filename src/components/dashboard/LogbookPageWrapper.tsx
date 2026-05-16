'use client';

import React, { useState } from 'react';
import LogbookView from './LogbookView';
import LogbookMapsView from './LogbookMapsView';
import { BookOpen, Map, Lock, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type Tab = 'flight' | 'maps';

export default function LogbookPageWrapper() {
  const [tab, setTab] = useState<Tab>('flight');
  const { user } = useAuth();
  const [showPaywall, setShowPaywall] = useState(false);

  const isPremium = (user as any)?.subscriptionTier === 'premium' || (user as any)?.role === 'admin' || (user as any)?.role === 'orgAdmin';

  return (
    <div>
      {/* Sub-tabs */}
      <div className="border-b border-gray-200 px-6 pt-2">
        <div className="flex gap-1">
          <button
            onClick={() => setTab('flight')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              tab === 'flight'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Flight
          </button>
          <button
            onClick={() => {
              if (isPremium) {
                setTab('maps');
              } else {
                setShowPaywall(true);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              tab === 'maps'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Map className="w-4 h-4" /> Maps & Stats
            {!isPremium && <Lock className="w-3 h-3 text-gray-400" />}
          </button>
        </div>
      </div>

      {/* Paywall modal */}
      {showPaywall && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <h3 className="text-lg font-bold">Premium Feature</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Maps & Stats are available with a Premium subscription. Upgrade to visualize your routes, airports, and flight statistics.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPaywall(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowPaywall(false); /* TODO: navigate to subscription */ }}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {tab === 'flight' ? <LogbookView /> : <LogbookMapsView />}
    </div>
  );
}
