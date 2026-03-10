'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logbooksApi, LogbookEntry, UserAircraft } from '@/lib/api';
import {
  Plus, ChevronRight, ArrowLeft, Trash2, Edit3, Plane, Save, X,
  Download, ChevronLeft, ChevronsLeft, ChevronsRight
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────

function timeToMinutes(t: string | null | undefined): number {
  if (!t) return 0;
  const parts = t.split(':');
  if (parts.length < 2) return 0;
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function minutesToHHMM(min: number): string {
  if (!min || min <= 0) return '0:00';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

type FormData = Partial<LogbookEntry> & { [key: string]: unknown };

const EMPTY_FORM: FormData = {
  date: todayStr(),
  callsign: '', aircraftId: '', aircraftType: '',
  departure: '', destination: '',
  scheduledOut: '', scheduledIn: '',
  blockOff: '', takeOffTime: '', landingTime: '', blockIn: '',
  picName: '', picLicenceNumber: '', sicName: '', sicLicenceNumber: '',
  ifrTime: 0, nightTime: 0, picTime: 0, sicTime: 0, reliefTime: 0,
  xcTime: 0, multiPilotTime: 0, dualReceived: 0, dualGiven: 0, simulatorTime: 0,
  takeoffDay: 0, takeoffNight: 0, landingDay: 0, landingNight: 0, autoland: 0,
  holdCount: null, approachCount: null, goAroundCount: null,
  remarks: '',
};

// ─── Component ─────────────────────────────────────────────

export default function LogbookView() {
  const { token, user } = useAuth();
  const [entries, setEntries] = useState<LogbookEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [aircraft, setAircraft] = useState<UserAircraft[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const limit = 25;

  const userName = user ? `${user.firstName} ${user.lastName}` : '';

  const fetchEntries = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await logbooksApi.list(token, { page, limit });
      setEntries(res.data);
      setTotal(res.total);
    } catch (e) {
      console.error('Fetch entries error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [token, page]);

  const fetchAircraft = useCallback(async () => {
    if (!token) return;
    try {
      const ac = await logbooksApi.listAircraft(token);
      setAircraft(ac);
    } catch (e) { console.error(e); }
  }, [token]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);
  useEffect(() => { fetchAircraft(); }, [fetchAircraft]);

  // ─── Computed times ────────────────────────────────────

  const totalBlockMin = timeToMinutes(form.blockIn as string) - timeToMinutes(form.blockOff as string);
  const totalFlightMin = timeToMinutes(form.landingTime as string) - timeToMinutes(form.takeOffTime as string);
  const totalSchedMin = timeToMinutes(form.scheduledIn as string) - timeToMinutes(form.scheduledOut as string);
  const totalTimeMin = totalBlockMin > 0 ? totalBlockMin : 0;

  // ─── Form handlers ────────────────────────────────────

  const setField = (field: string, value: unknown) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };

      // Auto-fill aircraft type
      if (field === 'aircraftId') {
        const match = aircraft.find(a => a.aircraftId === value);
        if (match) next.aircraftType = match.aircraftType;
      }

      return next;
    });
  };

  const handleCheckbox = (field: string, checked: boolean) => {
    if (checked) {
      setForm(prev => ({ ...prev, [field]: totalTimeMin > 0 ? totalTimeMin : 0 }));
    } else {
      setForm(prev => ({ ...prev, [field]: 0 }));
    }
  };

  const handleTimeValue = (field: string, val: string) => {
    const min = parseInt(val) || 0;
    const capped = Math.min(min, totalTimeMin > 0 ? totalTimeMin : 9999);
    setForm(prev => ({ ...prev, [field]: capped }));
  };

  const isPicUser = (form.picName as string || '').toLowerCase().trim() === userName.toLowerCase().trim();

  const openNewFlight = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, picName: userName });
    setShowForm(true);
    setError('');
  };

  const openNextLeg = () => {
    const last = entries[0]; // most recent
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      date: todayStr(),
      aircraftId: last?.aircraftId || '',
      aircraftType: last?.aircraftType || '',
      picName: last?.picName || userName,
      picLicenceNumber: last?.picLicenceNumber || '',
      sicName: last?.sicName || '',
      sicLicenceNumber: last?.sicLicenceNumber || '',
      departure: last?.destination || '',
    });
    setShowForm(true);
    setError('');
  };

  const openEdit = (entry: LogbookEntry) => {
    setEditingId(entry.id);
    setForm({ ...entry });
    setShowForm(true);
    setError('');
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setError('');

    // Validate
    if (!form.date) { setError('Date is required'); setSaving(false); return; }

    // Auto PIC time
    const submitForm = { ...form };
    if (isPicUser && totalTimeMin > 0) {
      submitForm.picTime = totalTimeMin;
    }

    // Validate SIC + Relief <= totalTime
    const sic = (submitForm.sicTime as number) || 0;
    const relief = (submitForm.reliefTime as number) || 0;
    if (sic + relief > totalTimeMin && totalTimeMin > 0) {
      setError('SIC + Relief time cannot exceed Total Time');
      setSaving(false);
      return;
    }

    // Validate dualReceived not checked if PIC = user
    if (isPicUser && (submitForm.dualReceived as number) > 0) {
      setError('Dual Received cannot be set when you are PIC');
      setSaving(false);
      return;
    }

    try {
      if (editingId) {
        await logbooksApi.update(editingId, submitForm as Partial<LogbookEntry>, token);
      } else {
        await logbooksApi.create(submitForm as Partial<LogbookEntry>, token);
      }
      setShowForm(false);
      fetchEntries();
      fetchAircraft();
    } catch (e: unknown) {
      setError((e as Error).message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm('Delete this entry?')) return;
    try {
      await logbooksApi.delete(id, token);
      fetchEntries();
    } catch (e) { console.error(e); }
  };

  const handleExport = async () => {
    if (!token) return;
    try {
      const blob = await logbooksApi.exportPdf(token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'logbook.html';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
  };

  const totalPages = Math.ceil(total / limit);

  // ─── Entry Form ────────────────────────────────────────

  if (showForm) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <button onClick={() => setShowForm(false)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Logbook
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {editingId ? 'Edit Flight' : 'New Flight'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <div className="space-y-6">
          {/* Flight Info */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Flight Info</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="block">
                <span className="text-xs text-gray-500">Date *</span>
                <input type="date" value={(form.date as string) || ''} onChange={e => setField('date', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">Callsign</span>
                <input type="text" value={(form.callsign as string) || ''} onChange={e => setField('callsign', e.target.value.toUpperCase())}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase" placeholder="AFR123" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">Aircraft ID</span>
                <input type="text" value={(form.aircraftId as string) || ''} onChange={e => setField('aircraftId', e.target.value.toUpperCase())}
                  list="aircraft-list"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase" placeholder="F-GKXA" />
                <datalist id="aircraft-list">
                  {aircraft.map(a => <option key={a.id} value={a.aircraftId}>{a.aircraftType}</option>)}
                </datalist>
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">Aircraft Type</span>
                <input type="text" value={(form.aircraftType as string) || ''} onChange={e => setField('aircraftType', e.target.value.toUpperCase())}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase" placeholder="A320" />
              </label>
            </div>
          </div>

          {/* Route & Times */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Route & Times</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="block">
                <span className="text-xs text-gray-500">Departure (ICAO)</span>
                <input type="text" maxLength={4} value={(form.departure as string) || ''} onChange={e => setField('departure', e.target.value.toUpperCase())}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase font-mono" placeholder="LFPG" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">Destination (ICAO)</span>
                <input type="text" maxLength={4} value={(form.destination as string) || ''} onChange={e => setField('destination', e.target.value.toUpperCase())}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase font-mono" placeholder="EGLL" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">Sched Out *</span>
                <input type="time" value={(form.scheduledOut as string) || ''} onChange={e => setField('scheduledOut', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">Sched In *</span>
                <input type="time" value={(form.scheduledIn as string) || ''} onChange={e => setField('scheduledIn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">Block Off</span>
                <input type="time" value={(form.blockOff as string) || ''} onChange={e => setField('blockOff', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">Take-Off</span>
                <input type="time" value={(form.takeOffTime as string) || ''} onChange={e => setField('takeOffTime', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">Landing</span>
                <input type="time" value={(form.landingTime as string) || ''} onChange={e => setField('landingTime', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">Block In</span>
                <input type="time" value={(form.blockIn as string) || ''} onChange={e => setField('blockIn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </label>
            </div>

            {/* Computed times */}
            <div className="mt-3 flex gap-6 text-sm">
              <div><span className="text-gray-500">Total Schedule:</span> <span className="font-mono font-semibold">{minutesToHHMM(totalSchedMin)}</span></div>
              <div><span className="text-gray-500">Total Flight:</span> <span className="font-mono font-semibold">{minutesToHHMM(totalFlightMin)}</span></div>
              <div><span className="text-gray-500">Total Block:</span> <span className="font-mono font-bold text-blue-700">{minutesToHHMM(totalBlockMin)}</span></div>
              <div><span className="text-gray-500">Total Time:</span> <span className="font-mono font-bold text-blue-700">{minutesToHHMM(totalTimeMin)}</span></div>
            </div>
          </div>

          {/* Crew */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Crew</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="block">
                <span className="text-xs text-gray-500">PIC Name</span>
                <input type="text" value={(form.picName as string) || ''} onChange={e => setField('picName', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">PIC Licence # *</span>
                <input type="text" value={(form.picLicenceNumber as string) || ''} onChange={e => setField('picLicenceNumber', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">SIC Name</span>
                <input type="text" value={(form.sicName as string) || ''} onChange={e => setField('sicName', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">SIC Licence # *</span>
                <input type="text" value={(form.sicLicenceNumber as string) || ''} onChange={e => setField('sicLicenceNumber', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </label>
            </div>
            {isPicUser && <p className="mt-2 text-xs text-green-600">You are PIC — PIC Time will be auto-set to Total Time</p>}
          </div>

          {/* Time Categories */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Time Categories</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { key: 'ifrTime', label: 'IFR' },
                { key: 'nightTime', label: 'Night' },
                { key: 'picTime', label: 'PIC', auto: isPicUser },
                { key: 'sicTime', label: 'SIC', disabled: isPicUser },
                { key: 'reliefTime', label: 'Relief' },
                { key: 'xcTime', label: 'Cross Country' },
                { key: 'multiPilotTime', label: 'Multi-Pilot' },
                { key: 'dualReceived', label: 'Dual Received', disabled: isPicUser },
                { key: 'dualGiven', label: 'Dual Given' },
                { key: 'simulatorTime', label: 'Simulator' },
              ].map(({ key, label, auto, disabled }) => {
                const val = (form[key] as number) || 0;
                const checked = val > 0 || auto;
                return (
                  <div key={key} className={`border rounded-lg p-2 ${disabled ? 'opacity-50' : ''}`}>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled || auto}
                        onChange={e => handleCheckbox(key, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="font-medium">{label}</span>
                    </label>
                    {checked && !auto && (
                      <input
                        type="number"
                        min={0}
                        max={totalTimeMin > 0 ? totalTimeMin : 9999}
                        value={val}
                        onChange={e => handleTimeValue(key, e.target.value)}
                        disabled={disabled}
                        className="mt-1 w-full text-xs rounded border border-gray-300 px-2 py-1 text-center font-mono"
                      />
                    )}
                    {checked && (
                      <div className="text-[10px] text-gray-400 mt-0.5 text-center">{minutesToHHMM(auto ? totalTimeMin : val)}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operations */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Operations</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              {[
                { key: 'takeoffDay', label: 'T/O Day' },
                { key: 'takeoffNight', label: 'T/O Night' },
                { key: 'landingDay', label: 'LDG Day' },
                { key: 'landingNight', label: 'LDG Night' },
                { key: 'autoland', label: 'Autoland' },
                { key: 'holdCount', label: 'Hold *' },
                { key: 'approachCount', label: 'Approach *' },
                { key: 'goAroundCount', label: 'Go-Around *' },
              ].map(({ key, label }) => (
                <label key={key} className="block">
                  <span className="text-xs text-gray-500">{label}</span>
                  <input
                    type="number"
                    min={0}
                    value={(form[key] as number) ?? ''}
                    onChange={e => setField(key, e.target.value === '' ? null : parseInt(e.target.value) || 0)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-center font-mono"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Remarks</h3>
            <textarea
              value={(form.remarks as string) || ''}
              onChange={e => setField('remarks', e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Notes, observations..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : editingId ? 'Update Flight' : 'Save Flight'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── List View ─────────────────────────────────────────

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Flight Logbook</h2>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <Download className="w-4 h-4" /> Export
          </button>
          {entries.length > 0 && (
            <button onClick={openNextLeg}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600">
              <ChevronRight className="w-4 h-4" /> Next Leg
            </button>
          )}
          <button onClick={openNewFlight}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> New Flight
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20">
          <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No flights recorded yet</p>
          <p className="text-gray-400 text-sm mt-1">Click &quot;New Flight&quot; to add your first entry</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">Date</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">CS</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">A/C</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">Type</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600 whitespace-nowrap">DEP</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600 whitespace-nowrap">DEST</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600 whitespace-nowrap">Block Off</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600 whitespace-nowrap">T/O</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600 whitespace-nowrap">LDG</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600 whitespace-nowrap">Block In</th>
                  <th className="px-3 py-2 text-center font-semibold text-blue-700 whitespace-nowrap">Block</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600 whitespace-nowrap">Flight</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">PIC</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600 whitespace-nowrap">IFR</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600 whitespace-nowrap">Night</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600 whitespace-nowrap">PIC</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600 whitespace-nowrap">T/O D</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600 whitespace-nowrap">LDG D</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600 whitespace-nowrap"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map(e => {
                  const block = timeToMinutes(e.blockIn) - timeToMinutes(e.blockOff);
                  const flight = timeToMinutes(e.landingTime) - timeToMinutes(e.takeOffTime);
                  return (
                    <tr key={e.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openEdit(e)}>
                      <td className="px-3 py-2 whitespace-nowrap font-mono">{e.date}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{e.callsign}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono">{e.aircraftId}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{e.aircraftType}</td>
                      <td className="px-3 py-2 text-center font-mono font-semibold">{e.departure}</td>
                      <td className="px-3 py-2 text-center font-mono font-semibold">{e.destination}</td>
                      <td className="px-3 py-2 text-center font-mono text-gray-500">{e.blockOff?.slice(0, 5)}</td>
                      <td className="px-3 py-2 text-center font-mono text-gray-500">{e.takeOffTime?.slice(0, 5)}</td>
                      <td className="px-3 py-2 text-center font-mono text-gray-500">{e.landingTime?.slice(0, 5)}</td>
                      <td className="px-3 py-2 text-center font-mono text-gray-500">{e.blockIn?.slice(0, 5)}</td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-blue-700">{minutesToHHMM(block)}</td>
                      <td className="px-3 py-2 text-center font-mono">{minutesToHHMM(flight)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{e.picName}</td>
                      <td className="px-3 py-2 text-center font-mono">{e.ifrTime ? minutesToHHMM(e.ifrTime) : ''}</td>
                      <td className="px-3 py-2 text-center font-mono">{e.nightTime ? minutesToHHMM(e.nightTime) : ''}</td>
                      <td className="px-3 py-2 text-center font-mono">{e.picTime ? minutesToHHMM(e.picTime) : ''}</td>
                      <td className="px-3 py-2 text-center">{e.takeoffDay || ''}</td>
                      <td className="px-3 py-2 text-center">{e.landingDay || ''}</td>
                      <td className="px-3 py-2">
                        <button onClick={(ev) => { ev.stopPropagation(); handleDelete(e.id); }}
                          className="p-1 text-gray-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button onClick={() => setPage(1)} disabled={page === 1} className="p-1 disabled:opacity-30"><ChevronsLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-gray-600">Page {page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="p-1 disabled:opacity-30"><ChevronsRight className="w-4 h-4" /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
