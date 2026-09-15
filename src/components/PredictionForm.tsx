import React, { useState, useEffect, useId } from 'react';
import {
  Truck,
  Train,
  Plane,
  Ship,
  Sun,
  CloudRain,
  CloudLightning,
  CloudFog,
  Snowflake,
  Milestone,
  Sliders,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Loader2,
  BookmarkCheck,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  PredictionInput,
  WeatherCondition,
  TransportMode,
} from '../types';

interface PredictionFormProps {
  initialValues?: PredictionInput;
  onSubmit: (input: PredictionInput) => void;
  isEvaluating?: boolean;
  apiEndpoint?: string;
}

const PRESET_CORRIDORS = [
  {
    origin: 'Rotterdam (RTM)',
    destination: 'Munich (MUC)',
    originCode: 'RTM',
    destinationCode: 'MUC',
    defaultDistance: 680,
  },
  {
    origin: 'Hamburg (HAM)',
    destination: 'Vienna (VIE)',
    originCode: 'HAM',
    destinationCode: 'VIE',
    defaultDistance: 940,
  },
  {
    origin: 'Lyon (LYS)',
    destination: 'Frankfurt (FRA)',
    originCode: 'LYS',
    destinationCode: 'FRA',
    defaultDistance: 560,
  },
  {
    origin: 'Barcelona (BCN)',
    destination: 'Milan (MIL)',
    originCode: 'BCN',
    destinationCode: 'MIL',
    defaultDistance: 980,
  },
  {
    origin: 'Warsaw (WAW)',
    destination: 'Berlin (BER)',
    originCode: 'WAW',
    destinationCode: 'BER',
    defaultDistance: 570,
  },
];

export const PredictionForm: React.FC<PredictionFormProps> = ({
  initialValues,
  onSubmit,
  isEvaluating = false,
  apiEndpoint,
}) => {
  const targetEndpoint =
    apiEndpoint || import.meta.env.VITE_API_URL || 'http://localhost:8000/predict';
  const [backendStatus, setBackendStatus] = useState<
    'checking' | 'connected' | 'unreachable'
  >('checking');
  const [backendModel, setBackendModel] = useState<string>('');

  const checkHealth = async () => {
    setBackendStatus('checking');
    try {
      const healthUrl = targetEndpoint.replace(/\/predict\/?$/, '/health');
      const res = await fetch(healthUrl, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setBackendStatus('connected');
        setBackendModel(data.best_model || 'FastAPI Model');
      } else {
        setBackendStatus('unreachable');
      }
    } catch {
      setBackendStatus('unreachable');
    }
  };

  useEffect(() => {
    checkHealth();
  }, [targetEndpoint]);

  const distanceInputId = useId();
  const weatherSelectId = useId();
  const transportSelectId = useId();
  const supplierSliderId = useId();
  const holidayToggleId = useId();

  const [selectedCorridorIndex, setSelectedCorridorIndex] = useState(0);
  const [distanceKm, setDistanceKm] = useState<number>(
    initialValues?.distanceKm ?? 680
  );
  const [weather, setWeather] = useState<WeatherCondition>(
    initialValues?.weather ?? 'Storm'
  );
  const [transportMode, setTransportMode] = useState<TransportMode>(
    initialValues?.transportMode ?? 'Road'
  );
  const [supplierReliability, setSupplierReliability] = useState<number>(
    initialValues?.supplierReliability ?? 72
  );
  const [isHolidayPeriod, setIsHolidayPeriod] = useState<boolean>(
    initialValues?.isHolidayPeriod ?? false
  );

  // Live calculated preliminary risk score
  const calculateLiveEstimatedScore = () => {
    let score = 24;
    if (weather === 'Storm') score += 22;
    else if (weather === 'Snow') score += 18;
    else if (weather === 'Fog') score += 12;
    else if (weather === 'Rain') score += 8;
    else score -= 4;

    const diff = 80 - supplierReliability;
    if (diff > 0) score += Math.round(diff * 0.35);
    else score -= Math.round(Math.abs(diff) * 0.2);

    if (transportMode === 'Road') score += 5;
    else if (transportMode === 'Rail') score += 2;
    else if (transportMode === 'Air') score += weather === 'Storm' ? 14 : -3;
    else if (transportMode === 'Sea') score += 7;

    if (distanceKm > 1000) score += 9;
    else if (distanceKm > 500) score += 5;

    if (isHolidayPeriod) score += 11;
    else score -= 3;

    return Math.max(8, Math.min(94, Math.round(score)));
  };

  const liveScore = calculateLiveEstimatedScore();
  const liveRiskCategory =
    liveScore >= 52 ? 'High Risk' : liveScore >= 26 ? 'Medium Risk' : 'Low Risk';

  const handleCorridorChange = (index: number) => {
    setSelectedCorridorIndex(index);
    const corridor = PRESET_CORRIDORS[index];
    setDistanceKm(corridor.defaultDistance);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const corridor = PRESET_CORRIDORS[selectedCorridorIndex];
    onSubmit({
      distanceKm: Math.max(1, distanceKm),
      weather,
      transportMode,
      supplierReliability,
      isHolidayPeriod,
      origin: corridor.origin,
      destination: corridor.destination,
      originCode: corridor.originCode,
      destinationCode: corridor.destinationCode,
    });
  };

  // Quick preset loader buttons
  const applyPreset = (type: 'storm-road' | 'clear-air' | 'holiday-rail') => {
    if (type === 'storm-road') {
      setSelectedCorridorIndex(0);
      setDistanceKm(680);
      setWeather('Storm');
      setTransportMode('Road');
      setSupplierReliability(72);
      setIsHolidayPeriod(false);
    } else if (type === 'clear-air') {
      setSelectedCorridorIndex(2);
      setDistanceKm(560);
      setWeather('Clear');
      setTransportMode('Air');
      setSupplierReliability(94);
      setIsHolidayPeriod(false);
    } else if (type === 'holiday-rail') {
      setSelectedCorridorIndex(1);
      setDistanceKm(940);
      setWeather('Snow');
      setTransportMode('Rail');
      setSupplierReliability(64);
      setIsHolidayPeriod(true);
    }
  };

  return (
    <div className="flex flex-col w-full px-4 md:px-6 py-4 max-w-[840px] mx-auto space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e2e8f0] pb-3">
        <div>
          <span className="text-[11px] font-semibold text-[#1d4ed8] uppercase tracking-wider">
            Predictive Dispatch Model
          </span>
          <h1 className="font-headline font-bold text-xl sm:text-2xl text-[#0b1c30]">
            Shipment Delay Risk Predictor
          </h1>
        </div>
        {/* Preset quick buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <span className="text-xs text-[#64748b] whitespace-nowrap mr-1 font-medium">
            Sample Scenarios:
          </span>
          <button
            type="button"
            onClick={() => applyPreset('storm-road')}
            className="px-2.5 py-1 text-xs bg-white border border-[#cbd5e1] hover:border-[#1d4ed8] hover:text-[#1d4ed8] rounded-md transition-all whitespace-nowrap shadow-xs"
          >
            Alpine Storm (Road)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('clear-air')}
            className="px-2.5 py-1 text-xs bg-white border border-[#cbd5e1] hover:border-[#1d4ed8] hover:text-[#1d4ed8] rounded-md transition-all whitespace-nowrap shadow-xs"
          >
            Clear Air Express
          </button>
          <button
            type="button"
            onClick={() => applyPreset('holiday-rail')}
            className="px-2.5 py-1 text-xs bg-white border border-[#cbd5e1] hover:border-[#1d4ed8] hover:text-[#1d4ed8] rounded-md transition-all whitespace-nowrap shadow-xs"
          >
            Holiday Snow (Rail)
          </button>
        </div>
      </div>

      {/* Backend Connectivity Status Banner */}
      {backendStatus === 'connected' && (
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
            <span className="font-bold text-emerald-900">FastAPI Model Active:</span>
            <span>{backendModel || 'Logistic Regression'}</span>
            <span className="text-emerald-700 hidden sm:inline font-mono text-[11px]">
              ({targetEndpoint})
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
            Live Serving
          </span>
        </div>
      )}

      {backendStatus === 'checking' && (
        <div className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 shadow-xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
          <span>Checking connection to FastAPI backend ({targetEndpoint})...</span>
        </div>
      )}

      {backendStatus === 'unreachable' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 py-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 shadow-xs">
          <div className="flex items-start sm:items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-bold">FastAPI Backend Unreachable:</span>{' '}
              <span>Using local simulation fallback. Start the backend with{' '}
                <code className="bg-amber-100 text-amber-950 px-1 py-0.5 rounded font-mono text-[11px]">
                  uvicorn api:app --reload
                </code>{' '}
                to use the trained machine learning model.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={checkHealth}
            className="self-start sm:self-auto px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg font-semibold transition-all flex items-center gap-1 cursor-pointer shrink-0"
          >
            <RotateCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Active Corridor Selector */}
        <div className="bg-white rounded-xl shadow-xs border border-[#e2e8f0] p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-headline font-bold text-sm text-[#0b1c30] flex items-center gap-2">
              <Milestone className="w-4 h-4 text-[#1d4ed8]" />
              <span>Corridor Route Selection</span>
            </label>
            <span className="text-xs text-[#64748b]">Central EU Freight Corridor</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {PRESET_CORRIDORS.map((c, idx) => (
              <button
                key={c.originCode + c.destinationCode}
                type="button"
                onClick={() => handleCorridorChange(idx)}
                className={`flex flex-col p-2.5 rounded-lg border text-left transition-all ${
                  selectedCorridorIndex === idx
                    ? 'bg-[#eff4ff] border-[#1d4ed8] ring-1 ring-[#1d4ed8]'
                    : 'bg-white border-[#e2e8f0] hover:border-[#cbd5e1]'
                }`}
              >
                <div className="flex items-center gap-1 font-headline font-bold text-xs text-[#0b1c30]">
                  <span>{c.originCode}</span>
                  <ArrowRight className="w-3 h-3 text-[#64748b]" />
                  <span>{c.destinationCode}</span>
                </div>
                <span className="text-[10px] text-[#64748b] mt-0.5 truncate">
                  {c.defaultDistance} km
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Core Inputs Card */}
        <div className="bg-white rounded-xl shadow-xs border border-[#e2e8f0] p-4 sm:p-5 space-y-5">
          {/* Row 1: Distance & Weather */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Input 1: Distance (km) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={distanceInputId}
                  className="font-headline font-semibold text-xs text-[#0b1c30] uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Milestone className="w-3.5 h-3.5 text-[#1d4ed8]" />
                  <span>Transit Distance (km)</span>
                </label>
                <span className="text-xs text-[#64748b] font-data-mono">
                  Range: 10 - 5000 km
                </span>
              </div>
              <div className="relative">
                <input
                  id={distanceInputId}
                  type="number"
                  min="10"
                  max="5000"
                  step="10"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  required
                  className="w-full h-10 px-3 pr-12 rounded-lg bg-white border border-[#cbd5e1] text-sm text-[#0b1c30] font-medium focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/20 outline-none transition-all"
                  placeholder="e.g. 680"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#64748b] font-semibold">
                  km
                </span>
              </div>
              {/* Quick Distance Chips */}
              <div className="flex gap-1.5 pt-1">
                {[250, 480, 680, 940, 1200].map((km) => (
                  <button
                    key={km}
                    type="button"
                    onClick={() => setDistanceKm(km)}
                    className={`px-2 py-0.5 text-[11px] rounded font-data-mono transition-colors ${
                      distanceKm === km
                        ? 'bg-[#1d4ed8] text-white'
                        : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
                    }`}
                  >
                    {km}k
                  </button>
                ))}
              </div>
            </div>

            {/* Input 2: Weather (dropdown: Clear/Rain/Storm/Fog/Snow) */}
            <div className="space-y-1.5">
              <label
                htmlFor={weatherSelectId}
                className="font-headline font-semibold text-xs text-[#0b1c30] uppercase tracking-wider flex items-center gap-1.5"
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Weather Condition</span>
              </label>
              <div className="relative">
                <select
                  id={weatherSelectId}
                  value={weather}
                  onChange={(e) => setWeather(e.target.value as WeatherCondition)}
                  className="w-full h-10 px-3 rounded-lg bg-white border border-[#cbd5e1] text-sm text-[#0b1c30] font-medium focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/20 outline-none appearance-none transition-all cursor-pointer"
                >
                  <option value="Clear">Clear (Optimal visibility)</option>
                  <option value="Rain">Rain (Moderate surface slickness)</option>
                  <option value="Storm">Storm (High wind / lightning alert)</option>
                  <option value="Fog">Fog (Severe visibility reduction)</option>
                  <option value="Snow">Snow (Sub-zero mountain hazard)</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748b]">
                  ▼
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1 text-xs text-[#64748b]">
                {weather === 'Clear' && <Sun className="w-3.5 h-3.5 text-amber-500" />}
                {weather === 'Rain' && <CloudRain className="w-3.5 h-3.5 text-blue-500" />}
                {weather === 'Storm' && <CloudLightning className="w-3.5 h-3.5 text-amber-600" />}
                {weather === 'Fog' && <CloudFog className="w-3.5 h-3.5 text-slate-500" />}
                {weather === 'Snow' && <Snowflake className="w-3.5 h-3.5 text-cyan-500" />}
                <span>
                  {weather === 'Storm' || weather === 'Snow'
                    ? 'Elevated hazard: triggers SHAP high-weight factor'
                    : 'Standard meteorological corridor parameters'}
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Transport Mode & Supplier Reliability Slider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#f1f5f9]">
            {/* Input 3: Transport Mode (dropdown: Road/Rail/Air/Sea) */}
            <div className="space-y-1.5">
              <label
                htmlFor={transportSelectId}
                className="font-headline font-semibold text-xs text-[#0b1c30] uppercase tracking-wider flex items-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5 text-[#1d4ed8]" />
                <span>Transport Mode</span>
              </label>
              <div className="relative">
                <select
                  id={transportSelectId}
                  value={transportMode}
                  onChange={(e) => setTransportMode(e.target.value as TransportMode)}
                  className="w-full h-10 px-3 rounded-lg bg-white border border-[#cbd5e1] text-sm text-[#0b1c30] font-medium focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/20 outline-none appearance-none transition-all cursor-pointer"
                >
                  <option value="Road">Road Freight (Truck / Highway)</option>
                  <option value="Rail">Rail Intermodal (Freight Train)</option>
                  <option value="Air">Air Express (Cargo Flight)</option>
                  <option value="Sea">Sea Freight (Container Vessel)</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748b]">
                  ▼
                </div>
              </div>
              <div className="flex items-center gap-1.5 pt-1 text-xs text-[#64748b]">
                {transportMode === 'Road' && <Truck className="w-3.5 h-3.5 text-[#1d4ed8]" />}
                {transportMode === 'Rail' && <Train className="w-3.5 h-3.5 text-slate-700" />}
                {transportMode === 'Air' && <Plane className="w-3.5 h-3.5 text-blue-600" />}
                {transportMode === 'Sea' && <Ship className="w-3.5 h-3.5 text-cyan-700" />}
                <span>Transit velocity & bottleneck characteristics</span>
              </div>
            </div>

            {/* Input 4: Supplier Reliability Score (slider 0-100) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={supplierSliderId}
                  className="font-headline font-semibold text-xs text-[#0b1c30] uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#1d4ed8]" />
                  <span>Supplier Reliability Score</span>
                </label>
                <span className="font-data-mono font-bold text-sm text-[#0b1c30] bg-[#e5eeff] px-2 py-0.5 rounded">
                  {supplierReliability}/100
                </span>
              </div>

              <input
                id={supplierSliderId}
                type="range"
                min="0"
                max="100"
                value={supplierReliability}
                onChange={(e) => setSupplierReliability(Number(e.target.value))}
                className="w-full h-2 bg-[#e2e8f0] rounded-lg appearance-none cursor-pointer accent-[#1d4ed8]"
              />

              <div className="flex items-center justify-between text-[11px] text-[#64748b]">
                <span>0 (Poor / High Dwell)</span>
                <span className="font-semibold text-amber-800">80 Benchmark</span>
                <span>100 (Optimal SLA)</span>
              </div>

              <div className="pt-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded font-medium ${
                    supplierReliability < 60
                      ? 'bg-red-100 text-red-800'
                      : supplierReliability < 80
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {supplierReliability < 60
                    ? 'Critical supplier risk (<60 score)'
                    : supplierReliability < 80
                    ? 'Below 80 benchmark (+8% delay offset)'
                    : 'Optimal carrier adherence (-4% risk mitigation)'}
                </span>
              </div>
            </div>
          </div>

          {/* Row 3: Holiday Period (toggle switch) */}
          <div className="pt-3 border-t border-[#f1f5f9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f8f9ff] p-3.5 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#e2e8f0] flex items-center justify-center text-[#1d4ed8] shadow-xs">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-headline font-semibold text-xs sm:text-sm text-[#0b1c30]">
                  Holiday Period (Regional / Bank Holiday)
                </span>
                <span className="text-xs text-[#64748b]">
                  Restricts heavy transport windows and reduces customs processing speed
                </span>
              </div>
            </div>

            <label htmlFor={holidayToggleId} className="relative inline-flex items-center cursor-pointer select-none">
              <input
                id={holidayToggleId}
                type="checkbox"
                checked={isHolidayPeriod}
                onChange={(e) => setIsHolidayPeriod(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#cbd5e1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1d4ed8]" />
              <span className="ml-2.5 text-xs font-semibold text-[#0b1c30] w-12">
                {isHolidayPeriod ? 'Active' : 'None'}
              </span>
            </label>
          </div>
        </div>

        {/* Real-time Pre-computation Insight Card */}
        <div className="bg-white rounded-xl p-4 border border-[#e2e8f0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-xs font-bold text-xs ${
                liveScore >= 52
                  ? 'bg-red-600'
                  : liveScore >= 26
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
            >
              {liveScore}%
            </div>
            <div>
              <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider block">
                Live Factor Projection
              </span>
              <span className="font-headline text-sm font-bold text-[#0b1c30]">
                Estimated: {liveRiskCategory} ({liveScore}% delay probability)
              </span>
            </div>
          </div>
          <span className="text-xs text-[#64748b] italic">
            Full SHAP breakdown computes upon submission
          </span>
        </div>

        {/* Primary Action Button: 'Predict delay risk' */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={isEvaluating}
            className="w-full h-12 rounded-xl bg-[#1d4ed8] hover:bg-[#1e40af] active:scale-98 text-white font-headline font-bold text-base shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>
                  {backendStatus === 'connected'
                    ? `Running Inference on FastAPI Model (${backendModel || 'ML Pipeline'})...`
                    : 'Evaluating Feature Weights (Local Fallback)...'}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>
                  {backendStatus === 'connected'
                    ? 'Predict Delay Risk (Live Model)'
                    : 'Predict Delay Risk (Local Fallback)'}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
