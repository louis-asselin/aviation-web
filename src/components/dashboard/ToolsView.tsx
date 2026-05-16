'use client';

import { useState } from 'react';
import { Fuel, Wind, ArrowLeftRight, Mountain, Timer, Gauge } from 'lucide-react';

type ToolId = 'fuel' | 'wind' | 'units' | 'density' | 'distance' | 'pressure' | null;

export default function ToolsView() {
  const [activeTool, setActiveTool] = useState<ToolId>(null);

  const tools = [
    { id: 'fuel' as ToolId, name: 'Fuel Calculator', icon: Fuel, color: 'text-orange-500 bg-orange-50' },
    { id: 'wind' as ToolId, name: 'Wind Component', icon: Wind, color: 'text-blue-500 bg-blue-50' },
    { id: 'units' as ToolId, name: 'Unit Converter', icon: ArrowLeftRight, color: 'text-green-500 bg-green-50' },
    { id: 'density' as ToolId, name: 'Density Altitude', icon: Mountain, color: 'text-purple-500 bg-purple-50' },
    { id: 'distance' as ToolId, name: 'Distance / Time', icon: Timer, color: 'text-red-500 bg-red-50' },
    { id: 'pressure' as ToolId, name: 'Pressure Converter', icon: Gauge, color: 'text-teal-500 bg-teal-50' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Aviation Tools</h1>

      {!activeTool ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {tools.map(tool => (
            <button key={tool.id} onClick={() => setActiveTool(tool.id)}
              className="p-6 bg-white rounded-xl border hover:shadow-md transition-all text-left">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${tool.color}`}>
                <tool.icon className="w-6 h-6" />
              </div>
              <p className="font-semibold text-gray-900">{tool.name}</p>
            </button>
          ))}
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
        <span className="text-xs text-gray-500 w-10">{unit}</span>
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

function FuelCalc() {
  const [flow, setFlow] = useState('');
  const [time, setTime] = useState('');
  const [reserve, setReserve] = useState('45');
  const [taxi, setTaxi] = useState('5');
  const f = parseFloat(flow) || 0, t = parseFloat(time) || 0;
  const trip = f * t, res = f * (parseFloat(reserve) || 45) / 60, total = trip + res + (parseFloat(taxi) || 0);
  return (
    <div className="bg-white rounded-xl border p-6 max-w-md">
      <h2 className="text-lg font-bold mb-4">Fuel Calculator</h2>
      <InputRow label="Fuel Flow" value={flow} onChange={setFlow} unit="L/h" />
      <InputRow label="Flight Time" value={time} onChange={setTime} unit="hours" />
      <InputRow label="Reserve" value={reserve} onChange={setReserve} unit="min" placeholder="45" />
      <InputRow label="Taxi Fuel" value={taxi} onChange={setTaxi} unit="L" placeholder="5" />
      <hr className="my-3" />
      <ResultRow label="Trip Fuel" value={`${trip.toFixed(1)} L`} />
      <ResultRow label="Reserve Fuel" value={`${res.toFixed(1)} L`} />
      <ResultRow label="Total Required" value={`${total.toFixed(1)} L`} bold />
      <ResultRow label="Weight (Jet A1)" value={`${(total * 0.8).toFixed(1)} kg`} />
      <ResultRow label="Weight (AVGAS)" value={`${(total * 0.72).toFixed(1)} kg`} />
    </div>
  );
}

function WindCalc() {
  const [rwy, setRwy] = useState('');
  const [dir, setDir] = useState('');
  const [spd, setSpd] = useState('');
  const r = (parseFloat(rwy) || 0) * Math.PI / 180;
  const d = (parseFloat(dir) || 0) * Math.PI / 180;
  const s = parseFloat(spd) || 0;
  const hw = s * Math.cos(d - r), xw = s * Math.sin(d - r);
  return (
    <div className="bg-white rounded-xl border p-6 max-w-md">
      <h2 className="text-lg font-bold mb-4">Wind Component</h2>
      <InputRow label="Runway Heading" value={rwy} onChange={setRwy} unit="°" />
      <InputRow label="Wind Direction" value={dir} onChange={setDir} unit="°" />
      <InputRow label="Wind Speed" value={spd} onChange={setSpd} unit="kt" />
      <hr className="my-3" />
      <ResultRow label={hw >= 0 ? 'Headwind' : 'Tailwind'} value={`${Math.abs(hw).toFixed(1)} kt`} bold color={hw >= 0 ? 'text-green-600' : 'text-red-600'} />
      <ResultRow label="Crosswind" value={`${Math.abs(xw).toFixed(1)} kt ${xw > 0 ? 'from Right' : xw < 0 ? 'from Left' : ''}`} bold />
    </div>
  );
}

function UnitConv() {
  const [val, setVal] = useState('');
  const [conv, setConv] = useState(0);
  const conversions = [
    ['NM → km', 1.852], ['km → NM', 1/1.852], ['ft → m', 0.3048], ['m → ft', 3.28084],
    ['kt → km/h', 1.852], ['km/h → kt', 1/1.852], ['lbs → kg', 0.453592], ['kg → lbs', 2.20462],
    ['US gal → L', 3.78541], ['L → US gal', 1/3.78541], ['inHg → hPa', 33.8639], ['hPa → inHg', 1/33.8639],
  ] as [string, number][];
  const result = (parseFloat(val) || 0) * conversions[conv][1];
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
        {['Time', 'Distance', 'Speed'].map((l, i) => (
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
