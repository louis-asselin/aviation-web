'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Fuel, Wind, ArrowLeftRight, Mountain, Timer, Gauge, Plane, CloudSun, Scale, Thermometer, Zap, ArrowDown, Navigation, Clock, Sun, RotateCcw, Weight, Lock, Star } from 'lucide-react';

type ToolId = 'fuel' | 'wind' | 'units' | 'density' | 'distance' | 'pressure' | 'metar' | 'mass-balance' | 'tas' | 'mach' | 'tod' | 'e6b' | 'endurance' | 'sunrise' | 'holding' | 'mass-check' | 'ftl' | null;

const FREE_TOOLS = new Set<string>(['fuel', 'units', 'distance', 'pressure']);

export default function ToolsView() {
  const { user } = useAuth();
  const [activeTool, setActiveTool] = useState<ToolId>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'org_admin';
  const isPremium = (user as any)?.subscriptionTier === 'premium' || isAdmin;

  const tools: { id: ToolId; name: string; icon: any; color: string }[] = [
    { id: 'wind', name: 'Wind Component', icon: Wind, color: 'text-blue-500 bg-blue-50' },
    { id: 'fuel', name: 'Fuel Calculator', icon: Fuel, color: 'text-orange-500 bg-orange-50' },
    { id: 'ftl', name: 'Duty / FTL', icon: Clock, color: 'text-indigo-500 bg-indigo-50' },
    { id: 'metar', name: 'METAR Decoder', icon: CloudSun, color: 'text-cyan-500 bg-cyan-50' },
    { id: 'mass-balance', name: 'Mass & Balance', icon: Scale, color: 'text-amber-500 bg-amber-50' },
    { id: 'tas', name: 'TAS Calculator', icon: Thermometer, color: 'text-rose-500 bg-rose-50' },
    { id: 'mach', name: 'Mach Converter', icon: Zap, color: 'text-violet-500 bg-violet-50' },
    { id: 'tod', name: 'Top of Descent', icon: ArrowDown, color: 'text-emerald-500 bg-emerald-50' },
    { id: 'e6b', name: 'E6B Computer', icon: Navigation, color: 'text-sky-500 bg-sky-50' },
    { id: 'endurance', name: 'Endurance', icon: Timer, color: 'text-red-500 bg-red-50' },
    { id: 'sunrise', name: 'Sunrise / Sunset', icon: Sun, color: 'text-yellow-500 bg-yellow-50' },
    { id: 'holding', name: 'Holding Timer', icon: RotateCcw, color: 'text-pink-500 bg-pink-50' },
    { id: 'mass-check', name: 'Mass Check', icon: Weight, color: 'text-stone-500 bg-stone-50' },
    { id: 'units', name: 'Unit Converter', icon: ArrowLeftRight, color: 'text-green-500 bg-green-50' },
    { id: 'density', name: 'Density Altitude', icon: Mountain, color: 'text-purple-500 bg-purple-50' },
    { id: 'distance', name: 'Distance / Time', icon: Plane, color: 'text-teal-500 bg-teal-50' },
    { id: 'pressure', name: 'Pressure Converter', icon: Gauge, color: 'text-gray-500 bg-gray-50' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Aviation Tools</h1>

      {/* Premium banner for basic users */}
      {!isPremium && (
        <div className="mb-6 bg-gradient-to-r from-primary-500 to-primary-400 rounded-xl p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8 text-yellow-300" />
            <div>
              <p className="font-bold">Upgrade to Premium</p>
              <p className="text-sm text-white/80">Unlock all 17 aviation tools</p>
            </div>
          </div>
          <button className="bg-white text-primary-500 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-gray-100">
            Upgrade
          </button>
        </div>
      )}

      {!activeTool ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tools.map(tool => {
            const isFree = tool.id ? FREE_TOOLS.has(tool.id) : false;
            const locked = !isFree && !isPremium;

            return locked ? (
              <div key={tool.id}
                className="p-6 bg-white rounded-xl border text-left opacity-60 relative cursor-not-allowed">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${tool.color} opacity-40`}>
                  <tool.icon className="w-6 h-6" />
                </div>
                <p className="font-semibold text-gray-500">{tool.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Lock className="w-3 h-3 text-gray-400" />
                  <span className="text-[10px] font-bold text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded">PREMIUM</span>
                </div>
              </div>
            ) : (
              <button key={tool.id} onClick={() => setActiveTool(tool.id)}
                className="p-6 bg-white rounded-xl border hover:shadow-md transition-all text-left">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${tool.color}`}>
                  <tool.icon className="w-6 h-6" />
                </div>
                <p className="font-semibold text-gray-900">{tool.name}</p>
              </button>
            );
          })}
        </div>
      ) : (
        <div>
          <button onClick={() => setActiveTool(null)}
            className="mb-4 text-sm text-primary-500 hover:underline">&larr; Back to tools</button>
          {activeTool === 'fuel' && <FuelCalc />}
          {activeTool === 'wind' && <WindCalc />}
          {activeTool === 'units' && <UnitConv />}
          {activeTool === 'density' && <DensityCalc />}
          {activeTool === 'distance' && <DistCalc />}
          {activeTool === 'pressure' && <PressureCalc />}
          {activeTool === 'metar' && <MetarDecoder />}
          {activeTool === 'mass-balance' && <MassBalance />}
          {activeTool === 'tas' && <TASCalc />}
          {activeTool === 'mach' && <MachCalc />}
          {activeTool === 'tod' && <TODCalc />}
          {activeTool === 'e6b' && <E6BCalc />}
          {activeTool === 'endurance' && <EnduranceCalc />}
          {activeTool === 'sunrise' && <SunriseSunset />}
          {activeTool === 'holding' && <HoldingTimer />}
          {activeTool === 'mass-check' && <MassCheck />}
          {activeTool === 'ftl' && <FTLCalc />}
        </div>
      )}
    </div>
  );
}

function InputRow({ label, value, onChange, unit, placeholder = '0' }: { label: string; value: string; onChange: (v: string) => void; unit: string; placeholder?: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-24 border rounded-lg px-3 py-1.5 text-right text-sm" type="number" />
        <span className="text-xs text-gray-500 w-12">{unit}</span>
      </div>
    </div>
  );
}

function ResultRow({ label, value, bold = false, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <div className={`flex items-center justify-between py-2 ${bold ? 'font-bold' : ''}`}>
      <span className="text-sm">{label}</span>
      <span className={`text-sm ${color || (bold ? 'text-primary-500' : '')}`}>{value}</span>
    </div>
  );
}

// ====== WIND COMPONENT ======
function WindCalc() {
  const [rwy, setRwy] = useState('');
  const [dir, setDir] = useState('');
  const [spd, setSpd] = useState('');
  const r = (parseFloat(rwy) || 0) * Math.PI / 180;
  const d = (parseFloat(dir) || 0) * Math.PI / 180;
  const s = parseFloat(spd) || 0;
  const hw = s * Math.cos(d - r), xw = s * Math.sin(d - r);

  // SVG diagram
  const cx = 150, cy = 150, radius = 100;
  const rwyAngle = (parseFloat(rwy) || 0);
  const windAngle = (parseFloat(dir) || 0);
  const rwyRad = (rwyAngle - 90) * Math.PI / 180;
  const windRad = (windAngle - 90) * Math.PI / 180;

  return (
    <div className="bg-white rounded-xl border p-6 max-w-lg">
      <h2 className="text-lg font-bold mb-4">Wind Component</h2>
      <InputRow label="Runway QFU" value={rwy} onChange={setRwy} unit="°" />
      <InputRow label="Wind Direction" value={dir} onChange={setDir} unit="°" />
      <InputRow label="Wind Speed" value={spd} onChange={setSpd} unit="kt" />
      <hr className="my-3" />
      <ResultRow label={hw >= 0 ? 'Headwind' : 'Tailwind'} value={`${Math.abs(hw).toFixed(1)} kt`} bold color={hw >= 0 ? 'text-green-600' : 'text-red-600'} />
      <ResultRow label="Crosswind" value={`${Math.abs(xw).toFixed(1)} kt ${xw > 0 ? 'from Right' : xw < 0 ? 'from Left' : ''}`} bold />

      {/* Interactive Diagram */}
      <div className="mt-4 flex justify-center">
        <svg width="300" height="300" viewBox="0 0 300 300" className="border rounded-lg bg-gray-50">
          {/* Compass */}
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#d1d5db" strokeWidth="1" />
          <text x={cx} y={cy - radius - 8} textAnchor="middle" className="text-xs" fill="#6b7280" fontSize="10">N</text>
          <text x={cx + radius + 10} y={cy + 4} textAnchor="middle" className="text-xs" fill="#6b7280" fontSize="10">E</text>
          <text x={cx} y={cy + radius + 16} textAnchor="middle" className="text-xs" fill="#6b7280" fontSize="10">S</text>
          <text x={cx - radius - 10} y={cy + 4} textAnchor="middle" className="text-xs" fill="#6b7280" fontSize="10">W</text>

          {/* Runway */}
          <line
            x1={cx - 60 * Math.cos(rwyRad)} y1={cy - 60 * Math.sin(rwyRad)}
            x2={cx + 60 * Math.cos(rwyRad)} y2={cy + 60 * Math.sin(rwyRad)}
            stroke="#374151" strokeWidth="6" strokeLinecap="round"
          />
          {/* Runway direction marker */}
          <circle cx={cx + 50 * Math.cos(rwyRad)} cy={cy + 50 * Math.sin(rwyRad)} r="4" fill="#10b981" />

          {/* Aircraft symbol at center */}
          <polygon
            points={`${cx},${cy - 8} ${cx - 4},${cy + 4} ${cx},${cy + 2} ${cx + 4},${cy + 4}`}
            fill="#1f2937"
            transform={`rotate(${rwyAngle}, ${cx}, ${cy})`}
          />

          {/* Wind vector (red arrow) */}
          {s > 0 && (
            <>
              <line
                x1={cx + 80 * Math.cos(windRad)} y1={cy + 80 * Math.sin(windRad)}
                x2={cx} y2={cy}
                stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrowRed)"
              />
              <defs>
                <marker id="arrowRed" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#ef4444" />
                </marker>
              </defs>
            </>
          )}

          {/* Headwind component (green dashed) */}
          {s > 0 && Math.abs(hw) > 0.5 && (
            <line
              x1={cx} y1={cy}
              x2={cx + (hw / s) * 60 * Math.cos(rwyRad)} y2={cy + (hw / s) * 60 * Math.sin(rwyRad)}
              stroke="#22c55e" strokeWidth="2" strokeDasharray="4 2"
            />
          )}

          {/* Crosswind component (blue dashed) */}
          {s > 0 && Math.abs(xw) > 0.5 && (
            <line
              x1={cx} y1={cy}
              x2={cx + (xw / s) * 60 * Math.cos(rwyRad + Math.PI / 2)} y2={cy + (xw / s) * 60 * Math.sin(rwyRad + Math.PI / 2)}
              stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 2"
            />
          )}

          {/* Legend */}
          <line x1="10" y1="275" x2="25" y2="275" stroke="#ef4444" strokeWidth="2" />
          <text x="28" y="278" fill="#6b7280" fontSize="8">Wind</text>
          <line x1="60" y1="275" x2="75" y2="275" stroke="#22c55e" strokeWidth="2" strokeDasharray="4 2" />
          <text x="78" y="278" fill="#6b7280" fontSize="8">HW</text>
          <line x1="100" y1="275" x2="115" y2="275" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 2" />
          <text x="118" y="278" fill="#6b7280" fontSize="8">XW</text>
        </svg>
      </div>
    </div>
  );
}

// ====== FUEL CALCULATOR ======
function FuelCalc() {
  const [flow, setFlow] = useState('');
  const [time, setTime] = useState('');
  const [reserve, setReserve] = useState('45');
  const [taxi, setTaxi] = useState('5');
  const [useGal, setUseGal] = useState(false);
  const f = parseFloat(flow) || 0, t = parseFloat(time) || 0;
  const trip = f * t, res = f * (parseFloat(reserve) || 45) / 60, total = trip + res + (parseFloat(taxi) || 0);
  const unit = useGal ? 'USG' : 'L';
  return (
    <div className="bg-white rounded-xl border p-6 max-w-md">
      <h2 className="text-lg font-bold mb-4">Fuel Calculator</h2>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setUseGal(false)} className={`flex-1 py-1.5 text-sm rounded-lg ${!useGal ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}>Litres</button>
        <button onClick={() => setUseGal(true)} className={`flex-1 py-1.5 text-sm rounded-lg ${useGal ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}>US Gallons</button>
      </div>
      <InputRow label="Fuel Flow" value={flow} onChange={setFlow} unit={`${unit}/h`} />
      <InputRow label="Flight Time" value={time} onChange={setTime} unit="hours" />
      <InputRow label="Reserve" value={reserve} onChange={setReserve} unit="min" placeholder="45" />
      <InputRow label="Taxi Fuel" value={taxi} onChange={setTaxi} unit={unit} placeholder="5" />
      <hr className="my-3" />
      <ResultRow label="Trip Fuel" value={`${trip.toFixed(1)} ${unit}`} />
      <ResultRow label="Reserve Fuel" value={`${res.toFixed(1)} ${unit}`} />
      <ResultRow label="Total Required" value={`${total.toFixed(1)} ${unit}`} bold />
      <ResultRow label="Weight (Jet A1)" value={`${(total * (useGal ? 3.03 : 0.8)).toFixed(1)} kg`} />
      <ResultRow label="Weight (AVGAS)" value={`${(total * (useGal ? 2.72 : 0.72)).toFixed(1)} kg`} />
    </div>
  );
}

// ====== DUTY / FTL CALCULATOR ======
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700">{label}</span>
      <button onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-colors ${value ? 'bg-green-500' : 'bg-gray-300'}`}>
        <div className={`w-4 h-4 bg-white rounded-full transition-transform ml-0.5 ${value ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

function FTLCalc() {
  const [regulation, setRegulation] = useState<'oro' | 'subq' | 'part135'>('oro');
  const [reportTime, setReportTime] = useState('6');
  const [sectors, setSectors] = useState('2');
  const [acclimatized, setAcclimatized] = useState(true);
  const [extension, setExtension] = useState(false);
  const [homeBase, setHomeBase] = useState(true);
  const [cmdDiscretion, setCmdDiscretion] = useState(false);
  const [augmented, setAugmented] = useState(false);
  const [crewType, setCrewType] = useState(0); // 0=1 pilot, 1=2 pilots
  const [lastDuty, setLastDuty] = useState('10');
  const [lastRest, setLastRest] = useState('12');

  const reportHour = parseFloat(reportTime) || 6;
  const numSectors = Math.max(1, parseInt(sectors) || 2);

  // ═══ ORO.FTL.205 Table 2 ═══
  function getOroMaxFDP(startHour: number, sc: number): number {
    const sIdx = Math.min(sc, 10) - 1;
    const w1 = [13.0, 12.75, 12.5, 12.25, 12.0, 11.75, 11.5, 11.25, 11.0, 10.75]; // 06:00–13:29
    const w2 = [12.25, 12.0, 11.75, 11.5, 11.25, 11.0, 10.75, 10.5, 10.25, 10.0]; // 13:30–17:59
    const w3 = [11.5, 11.25, 11.0, 10.75, 10.5, 10.25, 10.0, 9.75, 9.5, 9.25];    // 18:00–01:59
    const w4 = [12.0, 11.75, 11.5, 11.25, 11.0, 10.75, 10.5, 10.25, 10.0, 9.75];  // 02:00–05:59
    if (startHour >= 6 && startHour < 13.5) return w1[sIdx];
    if (startHour >= 13.5 && startHour < 18) return w2[sIdx];
    if (startHour >= 18 || startHour < 2) return w3[sIdx];
    return w4[sIdx];
  }

  // ═══ Subpart Q — WOCL helpers ═══
  function calcWOCLOverlap(fdpStart: number, fdpEnd: number): number {
    const wStart = 2, wEnd = 5 + 59/60;
    const starts = [fdpStart, fdpStart - 24, fdpStart + 24];
    let maxOvl = 0;
    for (const s of starts) {
      const e = s + (fdpEnd - fdpStart);
      const ovlStart = Math.max(s, wStart);
      const ovlEnd = Math.min(e, wEnd);
      if (ovlEnd > ovlStart) maxOvl = Math.max(maxOvl, ovlEnd - ovlStart);
    }
    return maxOvl;
  }

  function calcWOCLReduction(fdpStart: number, fdpEnd: number): number {
    const overlap = calcWOCLOverlap(fdpStart, fdpEnd);
    if (overlap <= 0) return 0;
    if (fdpStart >= 2 && fdpStart <= 5 + 59/60) return Math.min(overlap, 2);
    return Math.min(overlap * 0.5, 2);
  }

  function getSubQMaxFDP(): number {
    let base = 13.0;
    if (numSectors > 2) base -= Math.min((numSectors - 2) * 0.5, 2);
    const woclRed = calcWOCLReduction(reportHour, reportHour + base);
    base -= woclRed;
    if (extension) {
      const woclOvl = calcWOCLOverlap(reportHour, reportHour + base + 1);
      let maxSec = 6;
      if (woclOvl > 0 && woclOvl <= 2) maxSec = 4;
      else if (woclOvl > 2) maxSec = 2;
      if (numSectors <= maxSec) {
        base += 1;
        if (reportHour >= 22 || reportHour < 5) base = Math.min(base, 11.75);
      }
    }
    return base;
  }

  const fmtTime = (h: number) => {
    let t = h; while (t < 0) t += 24;
    const hrs = Math.floor(t) % 24;
    const mins = Math.round((t - Math.floor(t)) * 60) % 60;
    return `${String(hrs).padStart(2, '0')}:${String(Math.abs(mins)).padStart(2, '0')}`;
  };
  const fmtDur = (h: number) => {
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    return `${hrs}h${String(mins).padStart(2, '0')}`;
  };

  let maxFDP = 0, maxDuty = 0, minRest = 0;

  if (regulation === 'oro') {
    maxFDP = getOroMaxFDP(reportHour, numSectors);
    if (!acclimatized) maxFDP = Math.max(maxFDP - 2, 9);
    if (extension && acclimatized) maxFDP += 1;
    maxDuty = maxFDP;
    minRest = 12;
  } else if (regulation === 'subq') {
    maxFDP = getSubQMaxFDP();
    maxDuty = maxFDP;
    const lastDutyVal = parseFloat(lastDuty) || 10;
    const minBase = homeBase ? 12 : 10;
    minRest = Math.max(minBase, lastDutyVal);
    if (extension) minRest += 2;
  } else {
    maxFDP = 14;
    maxDuty = 14;
    minRest = 10;
  }

  const cmdExtra = (regulation === 'subq' && cmdDiscretion) ? (augmented ? 3 : 2) : 0;
  // minRest is for pre-duty check (based on last DP)
  // minRestAfter is for next report (based on current duty)
  const minRestAfter = regulation === 'subq' ? Math.max(homeBase ? 12 : 10, maxDuty) : minRest;
  const latestOnBlock = fmtTime(reportHour + maxFDP);
  const earliestNext = fmtTime(reportHour + maxDuty + minRestAfter);
  const lastDutyVal = parseFloat(lastDuty) || 10;
  const lastRestVal = parseFloat(lastRest) || 12;
  const restSufficient = regulation !== 'subq' || lastRestVal >= minRest;

  return (
    <div className="bg-white rounded-xl border p-6 max-w-lg">
      <h2 className="text-lg font-bold mb-4">Duty / FTL Calculator</h2>
      <div className="flex gap-1 mb-4">
        <button onClick={() => setRegulation('oro')} className={`flex-1 py-1.5 text-xs rounded-lg ${regulation === 'oro' ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}>ORO.FTL (EASA)</button>
        <button onClick={() => setRegulation('subq')} className={`flex-1 py-1.5 text-xs rounded-lg ${regulation === 'subq' ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}>Subpart Q</button>
        <button onClick={() => setRegulation('part135')} className={`flex-1 py-1.5 text-xs rounded-lg ${regulation === 'part135' ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}>Part 135</button>
      </div>

      <InputRow label="Report Time" value={reportTime} onChange={setReportTime} unit={regulation === 'oro' ? 'local' : 'UTC'} placeholder="6" />
      <InputRow label="Sectors" value={sectors} onChange={setSectors} unit="" placeholder="2" />

      {/* ORO.FTL options */}
      {regulation === 'oro' && (
        <>
          <Toggle label="Acclimatized" value={acclimatized} onChange={setAcclimatized} />
          <Toggle label="Commander Extension (+1h)" value={extension} onChange={setExtension} />
        </>
      )}

      {/* Subpart Q options */}
      {regulation === 'subq' && (
        <>
          <InputRow label="Last Duty Period" value={lastDuty} onChange={setLastDuty} unit="h" placeholder="10" />
          <InputRow label="Last Rest Taken" value={lastRest} onChange={setLastRest} unit="h" placeholder="12" />
          <Toggle label="Home Base Rest" value={homeBase} onChange={setHomeBase} />
          <Toggle label="Operator Extension (+1h)" value={extension} onChange={setExtension} />
          <Toggle label="Augmented Crew" value={augmented} onChange={setAugmented} />
          <Toggle label="Commander Discretion" value={cmdDiscretion} onChange={setCmdDiscretion} />
        </>
      )}

      {/* Part 135 options */}
      {regulation === 'part135' && (
        <div className="flex gap-2 my-2">
          <button onClick={() => setCrewType(0)} className={`flex-1 py-1.5 text-sm rounded-lg ${crewType === 0 ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}>1 Pilot</button>
          <button onClick={() => setCrewType(1)} className={`flex-1 py-1.5 text-sm rounded-lg ${crewType === 1 ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}>2 Pilots</button>
        </div>
      )}

      {/* WOCL info for Subpart Q */}
      {regulation === 'subq' && (() => {
        const wocl = calcWOCLOverlap(reportHour, reportHour + maxFDP);
        return wocl > 0 ? (
          <div className="mt-2 p-2 bg-indigo-50 rounded-lg flex items-center gap-2">
            <span className="text-indigo-500 text-sm">🌙</span>
            <span className="text-xs text-indigo-600">WOCL encroachment: {wocl.toFixed(1)}h (02:00–05:59)</span>
          </div>
        ) : null;
      })()}

      <hr className="my-3" />

      {/* Results */}
      <ResultRow label="Max FDP" value={fmtDur(maxFDP)} bold />
      <ResultRow label="Latest On-Block" value={latestOnBlock} bold color="text-orange-600" />
      {regulation === 'part135' && (
        <ResultRow label="Max Flight Time" value={fmtDur(crewType === 0 ? 8 : 10)} bold color="text-purple-600" />
      )}

      {/* Extension warnings */}
      {extension && regulation === 'oro' && (
        <p className="text-xs text-orange-500 py-1">⚠️ Commander extension +1h (ORO.FTL.205(e))</p>
      )}
      {extension && regulation === 'subq' && (
        <p className="text-xs text-blue-500 py-1">ℹ️ Operator extension +1h (max 2×/7 days)</p>
      )}

      {/* Commander Discretion (Subpart Q) */}
      {cmdDiscretion && regulation === 'subq' && (
        <>
          <hr className="my-2" />
          <ResultRow label="Commander Discretion" value={`+${fmtDur(cmdExtra)}`} color="text-red-600" />
          <ResultRow label="Max FDP (with discretion)" value={fmtDur(maxFDP + cmdExtra)} bold color="text-red-600" />
          <ResultRow label="Latest On-Block (discr.)" value={fmtTime(reportHour + maxFDP + cmdExtra)} bold color="text-red-600" />
          <p className="text-xs text-red-500 py-1">⚠️ Unforeseen circumstances only. Report required within 28 days.</p>
        </>
      )}

      <hr className="my-3" />
      <ResultRow label="Max Duty Period" value={fmtDur(maxDuty)} />
      <ResultRow label={regulation === 'subq' ? 'Min Rest After This Duty' : 'Min Rest Required'} value={fmtDur(regulation === 'subq' ? minRestAfter : minRest)} bold color="text-blue-600" />
      <ResultRow label="Earliest Next Report" value={earliestNext} bold color="text-green-600" />

      {/* Pre-duty rest check (Subpart Q) */}
      {regulation === 'subq' && (
        <div className="mt-3 mb-1">
          <p className="text-xs font-medium text-gray-500 mb-2">Pre-Duty Rest Check</p>
          <div className="space-y-1 mb-2">
            <ResultRow label="Last Duty Period" value={fmtDur(lastDutyVal)} />
            <ResultRow label="Min Rest Required" value={fmtDur(minRest)} bold color="text-blue-600" />
            <ResultRow label="Last Rest Taken" value={fmtDur(lastRestVal)} bold color={restSufficient ? 'text-green-600' : 'text-red-600'} />
          </div>
          <div className={`flex items-center gap-2 py-2 px-3 rounded-lg ${restSufficient ? 'bg-green-50' : 'bg-red-50'}`}>
            <span className="text-lg">{restSufficient ? '✅' : '⛔'}</span>
            <div>
              <p className={`text-sm font-bold ${restSufficient ? 'text-green-700' : 'text-red-700'}`}>
                {restSufficient ? 'REST COMPLIANT' : 'INSUFFICIENT REST'}
              </p>
              <p className="text-xs text-gray-500">
                {restSufficient
                  ? `You may commence duty at ${fmtTime(reportHour)}`
                  : `Required: ${fmtDur(minRest)}, taken: ${fmtDur(lastRestVal)}. Shortfall: ${fmtDur(minRest - lastRestVal)}`}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {homeBase ? `Home base: rest ≥ max(${fmtDur(lastDutyVal)} last DP, 12h) = ${fmtDur(minRest)}` : `Away: rest ≥ max(${fmtDur(lastDutyVal)} last DP, 10h) = ${fmtDur(minRest)}`}
            {extension ? ' — Extension penalty: +2h included' : ''}
          </p>
        </div>
      )}

      {/* Cumulative Limits */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 font-medium mb-2">Cumulative Limits</p>
        {regulation === 'oro' && (
          <div className="space-y-1 text-xs text-gray-400">
            <p>Block: 100h/28 days · 900h/12 months</p>
            <p>Duty: 110h/14 days · Extensions: max 2×/7 days</p>
            <p>Days off: min 7/28 days</p>
          </div>
        )}
        {regulation === 'subq' && (
          <div className="space-y-1 text-xs text-gray-400">
            <p>Duty: 60h/7 days · 190h/28 days</p>
            <p>Block: 100h/28 days · 900h/year</p>
            <p>Extensions: max 2×/7 days</p>
            <p>Weekly rest: 36h incl. 2 local nights (max 168h gap)</p>
            <p>Meal required if FDP {'>'} 6h</p>
          </div>
        )}
        {regulation === 'part135' && (
          <div className="space-y-1 text-xs text-gray-400">
            <p>Flight: {crewType === 0 ? '8h' : '10h'}/24h · Duty: 14h/24h</p>
            <p>Rest: 10h consecutive/24h · Off: 24h/7 days</p>
          </div>
        )}
      </div>

      {/* Reference */}
      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 font-medium mb-1">Reference</p>
        <p className="text-xs text-gray-400">
          {regulation === 'oro' && 'EU 965/2012 ORO.FTL.205 — Table 2: Max FDP by window (4) and sectors (1–10+). Commander extension: +1h unforeseen. Rest: min 12h (ORO.FTL.235).'}
          {regulation === 'subq' && 'EU-OPS Subpart Q (Reg. 1899/2006) — 13h base FDP, -30min/sector beyond 2 (max -2h). WOCL reduction (02:00–05:59). Operator +1h, Commander +2h/+3h augmented. Rest: home max(12h, duty), away max(10h, duty).'}
          {regulation === 'part135' && '14 CFR 135.267 — Max 14h duty, 8h flight (1 pilot) / 10h (2 pilots). Min 10h consecutive rest. 24h off per 7 days.'}
        </p>
      </div>
    </div>
  );
}

// ====== METAR DECODER ======
function MetarDecoder() {
  const [raw, setRaw] = useState('');

  function decode(metar: string) {
    if (!metar.trim()) return null;
    const parts = metar.trim().split(/\s+/);
    let idx = 0;
    const result: { label: string; value: string }[] = [];

    // Station
    if (parts[idx] === 'METAR' || parts[idx] === 'SPECI') { result.push({ label: 'Type', value: parts[idx] }); idx++; }
    if (parts[idx]) { result.push({ label: 'Station', value: parts[idx] }); idx++; }

    // Date/time
    if (parts[idx] && /\d{6}Z/.test(parts[idx])) {
      const dt = parts[idx];
      result.push({ label: 'Day/Time', value: `Day ${dt.slice(0, 2)}, ${dt.slice(2, 4)}:${dt.slice(4, 6)} UTC` });
      idx++;
    }

    // Wind
    if (parts[idx] && /\d{3}\d{2}(G\d{2})?KT/.test(parts[idx])) {
      const w = parts[idx];
      const dir = w.slice(0, 3), spd = w.slice(3, 5);
      const gust = w.includes('G') ? w.match(/G(\d{2})/)?.[1] : null;
      result.push({ label: 'Wind', value: `${dir}° / ${spd} kt${gust ? ` gusting ${gust} kt` : ''}` });
      idx++;
    } else if (parts[idx] && parts[idx].startsWith('VRB')) {
      result.push({ label: 'Wind', value: `Variable ${parts[idx].slice(3, 5)} kt` });
      idx++;
    }

    // Variable wind
    if (parts[idx] && /\d{3}V\d{3}/.test(parts[idx])) {
      result.push({ label: 'Wind Variable', value: `${parts[idx].slice(0, 3)}° - ${parts[idx].slice(4, 7)}°` });
      idx++;
    }

    // Visibility
    if (parts[idx] && (/^\d{4}$/.test(parts[idx]) || parts[idx] === 'CAVOK' || parts[idx] === '9999')) {
      if (parts[idx] === 'CAVOK') {
        result.push({ label: 'Visibility', value: 'CAVOK (≥10 km, no sig cloud/wx)' });
      } else {
        result.push({ label: 'Visibility', value: `${parseInt(parts[idx])} m` });
      }
      idx++;
    }

    // Weather phenomena
    const wxCodes: Record<string, string> = {
      'RA': 'Rain', 'SN': 'Snow', 'DZ': 'Drizzle', 'FG': 'Fog', 'BR': 'Mist', 'HZ': 'Haze',
      'TS': 'Thunderstorm', 'SH': 'Showers', 'GR': 'Hail', 'FZ': 'Freezing',
      '+': 'Heavy', '-': 'Light', 'VC': 'Vicinity'
    };
    while (parts[idx] && /^[-+]?(VC)?(RA|SN|DZ|FG|BR|HZ|TS|SH|GR|FZ|PE|GS|SQ|SA|DS|SS)+$/.test(parts[idx])) {
      let decoded = parts[idx];
      for (const [code, name] of Object.entries(wxCodes)) {
        decoded = decoded.replace(code, name + ' ');
      }
      result.push({ label: 'Weather', value: decoded.trim() });
      idx++;
    }

    // Clouds
    const cloudAbbr: Record<string, string> = { FEW: '1-2/8', SCT: '3-4/8', BKN: '5-7/8', OVC: '8/8', NSC: 'No Sig Cloud' };
    while (parts[idx] && /^(FEW|SCT|BKN|OVC|NSC|CLR|SKC|NCD)\d{0,3}(CB|TCU)?$/.test(parts[idx])) {
      const c = parts[idx];
      const type = c.slice(0, 3);
      const alt = c.slice(3, 6);
      const extra = c.slice(6);
      const altFt = alt ? parseInt(alt) * 100 : 0;
      result.push({ label: 'Clouds', value: `${type} (${cloudAbbr[type] || type})${altFt ? ` at ${altFt} ft` : ''}${extra ? ` ${extra}` : ''}` });
      idx++;
    }

    // Temperature/Dewpoint
    if (parts[idx] && /^M?\d{2}\/M?\d{2}$/.test(parts[idx])) {
      const [t, d] = parts[idx].split('/');
      const temp = t.startsWith('M') ? `-${t.slice(1)}` : t;
      const dew = d.startsWith('M') ? `-${d.slice(1)}` : d;
      result.push({ label: 'Temperature', value: `${temp}°C` });
      result.push({ label: 'Dewpoint', value: `${dew}°C` });
      idx++;
    }

    // QNH
    if (parts[idx] && /^Q\d{4}$/.test(parts[idx])) {
      result.push({ label: 'QNH', value: `${parts[idx].slice(1)} hPa` });
      idx++;
    } else if (parts[idx] && /^A\d{4}$/.test(parts[idx])) {
      const inhg = parseInt(parts[idx].slice(1)) / 100;
      result.push({ label: 'Altimeter', value: `${inhg.toFixed(2)} inHg` });
      idx++;
    }

    return result;
  }

  const decoded = decode(raw);

  return (
    <div className="bg-white rounded-xl border p-6 max-w-lg">
      <h2 className="text-lg font-bold mb-4">METAR Decoder</h2>
      <textarea value={raw} onChange={e => setRaw(e.target.value.toUpperCase())}
        placeholder="Paste METAR here (e.g. METAR LFPG 161030Z 32015G25KT 9999 FEW040 12/05 Q1023)"
        className="w-full border rounded-lg px-3 py-2 mb-4 text-sm font-mono h-20 resize-none" />
      {decoded && decoded.length > 0 && (
        <div className="space-y-1">
          {decoded.map((item, i) => (
            <ResultRow key={i} label={item.label} value={item.value} />
          ))}
        </div>
      )}
    </div>
  );
}

// ====== MASS & BALANCE ======
function MassBalance() {
  const [stations, setStations] = useState([
    { name: 'BOW', mass: '', arm: '' },
    { name: 'Pilot + Front Pax', mass: '', arm: '' },
    { name: 'Rear Pax', mass: '', arm: '' },
    { name: 'Baggage', mass: '', arm: '' },
    { name: 'Fuel', mass: '', arm: '' },
  ]);

  const updateStation = (idx: number, field: 'mass' | 'arm', val: string) => {
    const newS = [...stations];
    newS[idx] = { ...newS[idx], [field]: val };
    setStations(newS);
  };

  const totalMass = stations.reduce((acc, s) => acc + (parseFloat(s.mass) || 0), 0);
  const totalMoment = stations.reduce((acc, s) => acc + (parseFloat(s.mass) || 0) * (parseFloat(s.arm) || 0), 0);
  const cg = totalMass > 0 ? totalMoment / totalMass : 0;

  return (
    <div className="bg-white rounded-xl border p-6 max-w-lg">
      <h2 className="text-lg font-bold mb-4">Mass & Balance</h2>
      <div className="grid grid-cols-[1fr_80px_80px_80px] gap-2 text-xs font-medium text-gray-500 mb-2">
        <span>Station</span><span className="text-right">Mass (kg)</span><span className="text-right">Arm (m)</span><span className="text-right">Moment</span>
      </div>
      {stations.map((s, i) => (
        <div key={i} className="grid grid-cols-[1fr_80px_80px_80px] gap-2 items-center mb-1">
          <span className="text-sm text-gray-700">{s.name}</span>
          <input value={s.mass} onChange={e => updateStation(i, 'mass', e.target.value)}
            className="border rounded px-2 py-1 text-right text-sm w-full" type="number" placeholder="0" />
          <input value={s.arm} onChange={e => updateStation(i, 'arm', e.target.value)}
            className="border rounded px-2 py-1 text-right text-sm w-full" type="number" placeholder="0" />
          <span className="text-sm text-right text-gray-600">{((parseFloat(s.mass) || 0) * (parseFloat(s.arm) || 0)).toFixed(1)}</span>
        </div>
      ))}
      <hr className="my-3" />
      <ResultRow label="Total Mass" value={`${totalMass.toFixed(1)} kg`} bold />
      <ResultRow label="Total Moment" value={`${totalMoment.toFixed(1)} kg·m`} />
      <ResultRow label="CG Position" value={`${cg.toFixed(3)} m`} bold color="text-blue-600" />
    </div>
  );
}

// ====== TAS CALCULATOR ======
function TASCalc() {
  const [cas, setCas] = useState('');
  const [alt, setAlt] = useState('');
  const [oat, setOat] = useState('');

  const casVal = parseFloat(cas) || 0;
  const altVal = parseFloat(alt) || 0;
  const isaTemp = 15 - (altVal / 1000) * 2;
  const tempUsed = oat ? parseFloat(oat) : isaTemp;
  // Density ratio approximation
  const pressureRatio = Math.pow(1 - 0.0000068756 * altVal, 5.2559);
  const tempRatioISA = (273.15 + tempUsed) / 288.15;
  const densityRatio = pressureRatio / tempRatioISA;
  const tas = casVal / Math.sqrt(densityRatio);

  return (
    <div className="bg-white rounded-xl border p-6 max-w-md">
      <h2 className="text-lg font-bold mb-4">TAS Calculator</h2>
      <InputRow label="CAS / IAS" value={cas} onChange={setCas} unit="kt" />
      <InputRow label="Pressure Altitude" value={alt} onChange={setAlt} unit="ft" />
      <InputRow label="OAT (blank=ISA)" value={oat} onChange={setOat} unit="°C" placeholder="ISA" />
      <hr className="my-3" />
      <ResultRow label="ISA Temp at Alt" value={`${isaTemp.toFixed(1)} °C`} />
      <ResultRow label="Temp Used" value={`${tempUsed.toFixed(1)} °C`} />
      <ResultRow label="True Airspeed" value={`${tas.toFixed(1)} kt`} bold />
    </div>
  );
}

// ====== MACH CONVERTER ======
function MachCalc() {
  const [mach, setMach] = useState('');
  const [alt, setAlt] = useState('');
  const [oat, setOat] = useState('');

  const machVal = parseFloat(mach) || 0;
  const altVal = parseFloat(alt) || 0;
  const isaTemp = 15 - (altVal / 1000) * 2;
  const tempUsed = oat ? parseFloat(oat) : (altVal > 36089 ? -56.5 : isaTemp);
  const tempK = 273.15 + tempUsed;
  const speedOfSound = 38.967 * Math.sqrt(tempK); // kt
  const tas = machVal * speedOfSound;

  return (
    <div className="bg-white rounded-xl border p-6 max-w-md">
      <h2 className="text-lg font-bold mb-4">Mach Converter</h2>
      <InputRow label="Mach Number" value={mach} onChange={setMach} unit="M" placeholder="0.78" />
      <InputRow label="Altitude" value={alt} onChange={setAlt} unit="ft" />
      <InputRow label="OAT (blank=ISA)" value={oat} onChange={setOat} unit="°C" placeholder="ISA" />
      <hr className="my-3" />
      <ResultRow label="Temperature" value={`${tempUsed.toFixed(1)} °C`} />
      <ResultRow label="Speed of Sound" value={`${speedOfSound.toFixed(1)} kt`} />
      <ResultRow label="TAS" value={`${tas.toFixed(1)} kt`} bold />
    </div>
  );
}

// ====== TOP OF DESCENT ======
function TODCalc() {
  const [currentFL, setCurrentFL] = useState('');
  const [targetAlt, setTargetAlt] = useState('');
  const [gs, setGs] = useState('');
  const [angle, setAngle] = useState('3');

  const flVal = (parseFloat(currentFL) || 0) * 100;
  const targetVal = parseFloat(targetAlt) || 0;
  const gsVal = parseFloat(gs) || 0;
  const angleVal = parseFloat(angle) || 3;
  const altDiff = flVal - targetVal;
  const todDist = altDiff / (Math.tan(angleVal * Math.PI / 180) * 6076.12); // ft / (tan * ft/nm)
  const todTime = gsVal > 0 ? (todDist / gsVal) * 60 : 0;
  const vs = gsVal > 0 ? (altDiff / todTime) : 0;

  return (
    <div className="bg-white rounded-xl border p-6 max-w-md">
      <h2 className="text-lg font-bold mb-4">Top of Descent</h2>
      <InputRow label="Current FL" value={currentFL} onChange={setCurrentFL} unit="FL" placeholder="350" />
      <InputRow label="Target Altitude" value={targetAlt} onChange={setTargetAlt} unit="ft" placeholder="3000" />
      <InputRow label="Ground Speed" value={gs} onChange={setGs} unit="kt" />
      <InputRow label="Descent Angle" value={angle} onChange={setAngle} unit="°" placeholder="3" />
      <hr className="my-3" />
      <ResultRow label="TOD Distance" value={`${todDist.toFixed(1)} NM`} bold />
      <ResultRow label="Descent Time" value={`${todTime.toFixed(1)} min`} />
      <ResultRow label="Required V/S" value={`${vs.toFixed(0)} ft/min`} bold color="text-orange-600" />
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-600 font-medium">Rule of 3: FL × 3 = TOD in NM (at 3° / idle)</p>
        <p className="text-xs text-blue-500 mt-1">FL{currentFL || '350'} × 3 = {((parseFloat(currentFL) || 350) * 3 - (targetVal / 100) * 3).toFixed(0)} NM from target</p>
      </div>
    </div>
  );
}

// ====== E6B COMPUTER ======
function E6BCalc() {
  const [tc, setTc] = useState('');
  const [tas, setTas] = useState('');
  const [wd, setWd] = useState('');
  const [ws, setWs] = useState('');

  const tcVal = (parseFloat(tc) || 0) * Math.PI / 180;
  const tasVal = parseFloat(tas) || 0;
  const wdVal = (parseFloat(wd) || 0) * Math.PI / 180;
  const wsVal = parseFloat(ws) || 0;

  // Wind correction angle
  const swc = (wsVal / tasVal) * Math.sin(wdVal - tcVal);
  const wca = Math.asin(Math.max(-1, Math.min(1, swc))) * 180 / Math.PI;
  const th = (parseFloat(tc) || 0) + wca;
  const thRad = th * Math.PI / 180;
  const gsCalc = tasVal * Math.cos(thRad - tcVal) + wsVal * Math.cos(wdVal - tcVal);

  return (
    <div className="bg-white rounded-xl border p-6 max-w-md">
      <h2 className="text-lg font-bold mb-4">E6B Wind Triangle</h2>
      <InputRow label="True Course" value={tc} onChange={setTc} unit="°" />
      <InputRow label="TAS" value={tas} onChange={setTas} unit="kt" />
      <InputRow label="Wind Direction" value={wd} onChange={setWd} unit="°" />
      <InputRow label="Wind Speed" value={ws} onChange={setWs} unit="kt" />
      <hr className="my-3" />
      <ResultRow label="Wind Correction" value={`${wca.toFixed(1)}° ${wca > 0 ? 'R' : wca < 0 ? 'L' : ''}`} />
      <ResultRow label="True Heading" value={`${((th % 360) + 360).toFixed(1)}°`} bold />
      <ResultRow label="Ground Speed" value={`${gsCalc.toFixed(1)} kt`} bold />
    </div>
  );
}

// ====== ENDURANCE ======
function EnduranceCalc() {
  const [fuel, setFuel] = useState('');
  const [flow, setFlow] = useState('');
  const [reserve, setReserve] = useState('45');

  const fuelVal = parseFloat(fuel) || 0;
  const flowVal = parseFloat(flow) || 1;
  const reserveMin = parseFloat(reserve) || 45;
  const reserveFuel = flowVal * reserveMin / 60;
  const usable = fuelVal - reserveFuel;
  const endNoRes = usable > 0 ? usable / flowVal : 0;
  const endTotal = fuelVal / flowVal;

  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m.toString().padStart(2, '0')}min`;
  };

  return (
    <div className="bg-white rounded-xl border p-6 max-w-md">
      <h2 className="text-lg font-bold mb-4">Endurance</h2>
      <InputRow label="Fuel Remaining" value={fuel} onChange={setFuel} unit="L" />
      <InputRow label="Fuel Flow" value={flow} onChange={setFlow} unit="L/h" />
      <InputRow label="Reserve Required" value={reserve} onChange={setReserve} unit="min" placeholder="45" />
      <hr className="my-3" />
      <ResultRow label="Reserve Fuel" value={`${reserveFuel.toFixed(1)} L`} />
      <ResultRow label="Usable Fuel" value={`${Math.max(0, usable).toFixed(1)} L`} />
      <ResultRow label="Endurance (excl. reserve)" value={formatTime(Math.max(0, endNoRes))} bold color={usable > 0 ? 'text-green-600' : 'text-red-600'} />
      <ResultRow label="Total Endurance" value={formatTime(endTotal)} />
    </div>
  );
}

// ====== SUNRISE / SUNSET ======
function SunriseSunset() {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const presets = [
    { name: 'LFMN', lat: '43.658', lon: '7.216' },
    { name: 'LFPG', lat: '49.010', lon: '2.548' },
    { name: 'EGLL', lat: '51.470', lon: '-0.454' },
    { name: 'KJFK', lat: '40.640', lon: '-73.779' },
  ];

  // Simplified solar calculation
  function calcSun(latitude: number, longitude: number, dateStr: string) {
    const d = new Date(dateStr);
    const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
    const declination = -23.45 * Math.cos((360 / 365) * (dayOfYear + 10) * Math.PI / 180);
    const latRad = latitude * Math.PI / 180;
    const decRad = declination * Math.PI / 180;
    const cosHA = (Math.cos(90.833 * Math.PI / 180) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad));

    if (cosHA > 1) return { sunrise: 'No sunrise', sunset: 'No sunset' };
    if (cosHA < -1) return { sunrise: 'Midnight sun', sunset: 'Midnight sun' };

    const ha = Math.acos(cosHA) * 180 / Math.PI;
    const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos((dayOfYear - 1) * 2 * Math.PI / 365)
      - 0.032077 * Math.sin((dayOfYear - 1) * 2 * Math.PI / 365));

    const solarNoon = 720 - 4 * longitude - eqTime;
    const sunriseMin = solarNoon - ha * 4;
    const sunsetMin = solarNoon + ha * 4;

    const fmt = (min: number) => {
      const h = Math.floor(min / 60) % 24;
      const m = Math.round(min % 60);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} UTC`;
    };

    return { sunrise: fmt(sunriseMin), sunset: fmt(sunsetMin) };
  }

  const latVal = parseFloat(lat) || 0;
  const lonVal = parseFloat(lon) || 0;
  const result = (lat && lon) ? calcSun(latVal, lonVal, date) : null;

  return (
    <div className="bg-white rounded-xl border p-6 max-w-md">
      <h2 className="text-lg font-bold mb-4">Sunrise / Sunset</h2>
      <div className="flex gap-2 mb-4 flex-wrap">
        {presets.map(p => (
          <button key={p.name} onClick={() => { setLat(p.lat); setLon(p.lon); }}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg font-mono">{p.name}</button>
        ))}
      </div>
      <InputRow label="Latitude" value={lat} onChange={setLat} unit="°N" placeholder="43.66" />
      <InputRow label="Longitude" value={lon} onChange={setLon} unit="°E" placeholder="7.22" />
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-700">Date</span>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm" />
      </div>
      <hr className="my-3" />
      {result && (
        <>
          <ResultRow label="Sunrise" value={result.sunrise} bold color="text-orange-500" />
          <ResultRow label="Sunset" value={result.sunset} bold color="text-indigo-500" />
        </>
      )}
    </div>
  );
}

// ====== HOLDING TIMER ======
function HoldingTimer() {
  const [aboveFL140, setAboveFL140] = useState(false);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const legTime = aboveFL140 ? 90 : 60; // seconds
  const totalCircuit = legTime * 2;

  // Timer effect
  useState(() => {
    const interval = setInterval(() => {
      if (running && startTime) {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }
    }, 100);
    return () => clearInterval(interval);
  });

  const currentPhase = (elapsed % totalCircuit) < legTime ? 'OUTBOUND' : 'INBOUND';
  const phaseElapsed = elapsed % legTime;
  const progress = phaseElapsed / legTime;

  return (
    <div className="bg-white rounded-xl border p-6 max-w-md text-center">
      <h2 className="text-lg font-bold mb-4">Holding Timer</h2>
      <div className="flex gap-2 mb-6 justify-center">
        <button onClick={() => setAboveFL140(false)} className={`px-4 py-1.5 text-sm rounded-lg ${!aboveFL140 ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}>Below FL140 (1 min)</button>
        <button onClick={() => setAboveFL140(true)} className={`px-4 py-1.5 text-sm rounded-lg ${aboveFL140 ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}>Above FL140 (1.5 min)</button>
      </div>

      {/* Progress ring */}
      <div className="relative w-40 h-40 mx-auto mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle cx="50" cy="50" r="40" fill="none"
            stroke={currentPhase === 'OUTBOUND' ? '#3b82f6' : '#10b981'}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${progress * 251.33} 251.33`} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold font-mono">{Math.floor(phaseElapsed / 60)}:{(phaseElapsed % 60).toString().padStart(2, '0')}</span>
          <span className={`text-xs font-bold mt-1 ${currentPhase === 'OUTBOUND' ? 'text-blue-500' : 'text-green-500'}`}>{running ? currentPhase : 'READY'}</span>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <button onClick={() => {
          if (!running) { setStartTime(Date.now() - elapsed * 1000); setRunning(true); }
          else setRunning(false);
        }} className={`px-6 py-2 rounded-lg font-medium text-white ${running ? 'bg-yellow-500' : 'bg-green-500'}`}>
          {running ? 'Pause' : 'Start'}
        </button>
        <button onClick={() => { setRunning(false); setElapsed(0); setStartTime(null); }}
          className="px-6 py-2 rounded-lg font-medium bg-gray-200 text-gray-700">Reset</button>
      </div>

      <p className="text-xs text-gray-400 mt-4">Leg duration: {aboveFL140 ? '1 min 30 sec' : '1 min'} — Total circuit: {aboveFL140 ? '3 min' : '2 min'}</p>
    </div>
  );
}

// ====== MASS CHECK ======
function MassCheck() {
  const [dow, setDow] = useState('');
  const [payload, setPayload] = useState('');
  const [tripFuel, setTripFuel] = useState('');
  const [taxiFuel, setTaxiFuel] = useState('');
  const [reserveFuel, setReserveFuel] = useState('');
  const [maxZFW, setMaxZFW] = useState('');
  const [maxTOW, setMaxTOW] = useState('');
  const [maxLW, setMaxLW] = useState('');

  const dowVal = parseFloat(dow) || 0;
  const payloadVal = parseFloat(payload) || 0;
  const tripVal = parseFloat(tripFuel) || 0;
  const taxiVal = parseFloat(taxiFuel) || 0;
  const resVal = parseFloat(reserveFuel) || 0;

  const zfw = dowVal + payloadVal;
  const tow = zfw + tripVal + taxiVal + resVal;
  const lw = tow - tripVal - taxiVal;

  const maxZFWVal = parseFloat(maxZFW) || Infinity;
  const maxTOWVal = parseFloat(maxTOW) || Infinity;
  const maxLWVal = parseFloat(maxLW) || Infinity;

  const zfwOk = zfw <= maxZFWVal;
  const towOk = tow <= maxTOWVal;
  const lwOk = lw <= maxLWVal;

  return (
    <div className="bg-white rounded-xl border p-6 max-w-md">
      <h2 className="text-lg font-bold mb-4">Mass Check (ZFW / TOW / LW)</h2>
      <InputRow label="DOW (Dry Op. Weight)" value={dow} onChange={setDow} unit="kg" />
      <InputRow label="Payload" value={payload} onChange={setPayload} unit="kg" />
      <InputRow label="Trip Fuel" value={tripFuel} onChange={setTripFuel} unit="kg" />
      <InputRow label="Taxi Fuel" value={taxiFuel} onChange={setTaxiFuel} unit="kg" />
      <InputRow label="Reserve Fuel" value={reserveFuel} onChange={setReserveFuel} unit="kg" />
      <hr className="my-3" />
      <p className="text-xs font-medium text-gray-500 mb-2">Maximum Limits</p>
      <InputRow label="Max ZFW" value={maxZFW} onChange={setMaxZFW} unit="kg" placeholder="∞" />
      <InputRow label="Max TOW" value={maxTOW} onChange={setMaxTOW} unit="kg" placeholder="∞" />
      <InputRow label="Max LW" value={maxLW} onChange={setMaxLW} unit="kg" placeholder="∞" />
      <hr className="my-3" />
      <div className="space-y-2">
        <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${zfwOk ? 'bg-green-50' : 'bg-red-50'}`}>
          <span className="text-sm font-medium">ZFW</span>
          <span className={`text-sm font-bold ${zfwOk ? 'text-green-600' : 'text-red-600'}`}>{zfw.toFixed(0)} kg {zfwOk ? '✓' : '✗'}</span>
        </div>
        <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${towOk ? 'bg-green-50' : 'bg-red-50'}`}>
          <span className="text-sm font-medium">TOW</span>
          <span className={`text-sm font-bold ${towOk ? 'text-green-600' : 'text-red-600'}`}>{tow.toFixed(0)} kg {towOk ? '✓' : '✗'}</span>
        </div>
        <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${lwOk ? 'bg-green-50' : 'bg-red-50'}`}>
          <span className="text-sm font-medium">LW</span>
          <span className={`text-sm font-bold ${lwOk ? 'text-green-600' : 'text-red-600'}`}>{lw.toFixed(0)} kg {lwOk ? '✓' : '✗'}</span>
        </div>
      </div>
    </div>
  );
}

// ====== UNIT CONVERTER ======
function UnitConv() {
  const [val, setVal] = useState('');
  const [conv, setConv] = useState(0);
  const conversions = [
    ['NM → km', 1.852], ['km → NM', 1/1.852], ['ft → m', 0.3048], ['m → ft', 3.28084],
    ['kt → km/h', 1.852], ['km/h → kt', 1/1.852], ['lbs → kg', 0.453592], ['kg → lbs', 2.20462],
    ['US gal → L', 3.78541], ['L → US gal', 1/3.78541], ['inHg → hPa', 33.8639], ['hPa → inHg', 1/33.8639],
    ['°C → °F', -1], ['°F → °C', -2],
  ] as [string, number][];
  let result: number;
  if (conversions[conv][1] === -1) result = (parseFloat(val) || 0) * 9/5 + 32;
  else if (conversions[conv][1] === -2) result = ((parseFloat(val) || 0) - 32) * 5/9;
  else result = (parseFloat(val) || 0) * (conversions[conv][1] as number);

  return (
    <div className="bg-white rounded-xl border p-6 max-w-md">
      <h2 className="text-lg font-bold mb-4">Unit Converter</h2>
      <select value={conv} onChange={e => setConv(Number(e.target.value))}
        className="w-full border rounded-lg px-3 py-2 mb-3 text-sm">
        {conversions.map((c, i) => <option key={i} value={i}>{c[0]}</option>)}
      </select>
      <input value={val} onChange={e => setVal(e.target.value)} placeholder="Enter value"
        className="w-full border rounded-lg px-3 py-2 mb-3 text-lg" type="number" />
      <div className="text-center py-3">
        <span className="text-2xl font-bold text-primary-500">{result.toFixed(4)}</span>
        <span className="text-sm text-gray-500 ml-2">{conversions[conv][0].split('→')[1]?.trim()}</span>
      </div>
    </div>
  );
}

// ====== DENSITY ALTITUDE ======
function DensityCalc() {
  const [elev, setElev] = useState('');
  const [temp, setTemp] = useState('');
  const [qnh, setQnh] = useState('1013');
  const pa = (parseFloat(elev) || 0) + (1013.25 - (parseFloat(qnh) || 1013)) * 27;
  const isa = 15 - (pa / 1000) * 2;
  const da = pa + 120 * ((parseFloat(temp) || 15) - isa);
  return (
    <div className="bg-white rounded-xl border p-6 max-w-md">
      <h2 className="text-lg font-bold mb-4">Density Altitude</h2>
      <InputRow label="Elevation" value={elev} onChange={setElev} unit="ft" />
      <InputRow label="Temperature" value={temp} onChange={setTemp} unit="°C" placeholder="15" />
      <InputRow label="QNH" value={qnh} onChange={setQnh} unit="hPa" placeholder="1013" />
      <hr className="my-3" />
      <ResultRow label="Pressure Altitude" value={`${pa.toFixed(0)} ft`} />
      <ResultRow label="ISA Temperature" value={`${isa.toFixed(1)} °C`} />
      <ResultRow label="Density Altitude" value={`${da.toFixed(0)} ft`} bold />
    </div>
  );
}

// ====== DISTANCE / TIME / SPEED ======
function DistCalc() {
  const [dist, setDist] = useState('');
  const [gs, setGs] = useState('');
  const [time, setTime] = useState('');
  const [mode, setMode] = useState(0);
  let result = '';
  if (mode === 0) { const h = (parseFloat(dist) || 0) / (parseFloat(gs) || 1); result = `${(h * 60).toFixed(0)} min`; }
  else if (mode === 1) { result = `${((parseFloat(gs) || 0) * (parseFloat(time) || 0) / 60).toFixed(1)} NM`; }
  else { result = `${((parseFloat(dist) || 0) / ((parseFloat(time) || 1) / 60)).toFixed(0)} kt`; }
  return (
    <div className="bg-white rounded-xl border p-6 max-w-md">
      <h2 className="text-lg font-bold mb-4">Distance / Time / Speed</h2>
      <div className="flex gap-1 mb-4">
        {['Find Time', 'Find Distance', 'Find Speed'].map((l, i) => (
          <button key={i} onClick={() => setMode(i)}
            className={`flex-1 py-1.5 text-sm rounded-lg ${mode === i ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}>{l}</button>
        ))}
      </div>
      {mode !== 1 && <InputRow label="Distance" value={dist} onChange={setDist} unit="NM" />}
      {mode !== 2 && <InputRow label="Ground Speed" value={gs} onChange={setGs} unit="kt" />}
      {mode !== 0 && <InputRow label="Time" value={time} onChange={setTime} unit="min" />}
      <hr className="my-3" />
      <ResultRow label={['Time', 'Distance', 'Ground Speed'][mode]} value={result} bold />
    </div>
  );
}

// ====== PRESSURE CONVERTER ======
function PressureCalc() {
  const [hpa, setHpa] = useState('1013.25');
  const v = parseFloat(hpa) || 1013.25;
  return (
    <div className="bg-white rounded-xl border p-6 max-w-md">
      <h2 className="text-lg font-bold mb-4">Pressure Converter</h2>
      <InputRow label="hPa / mbar" value={hpa} onChange={setHpa} unit="hPa" placeholder="1013.25" />
      <hr className="my-3" />
      <ResultRow label="inHg" value={(v / 33.8639).toFixed(2)} bold />
      <ResultRow label="mmHg" value={(v * 0.750062).toFixed(1)} />
      <ResultRow label="PSI" value={(v * 0.0145038).toFixed(3)} />
    </div>
  );
}
