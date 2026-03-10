'use client';

import React, { useState } from 'react';
import LogbookView from './LogbookView';
import LogbookMapsView from './LogbookMapsView';
import { BookOpen, Map } from 'lucide-react';

type Tab = 'flight' | 'maps';

export default function LogbookPageWrapper() {
  const [tab, setTab] = useState<Tab>('flight');

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
            onClick={() => setTab('maps')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              tab === 'maps'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Map className="w-4 h-4" /> Maps & Stats
          </button>
        </div>
      </div>

      {/* Content */}
      {tab === 'flight' ? <LogbookView /> : <LogbookMapsView />}
    </div>
  );
}
