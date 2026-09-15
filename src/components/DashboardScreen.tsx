import React, { useState } from 'react';
import {
  Truck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  RotateCw,
  ArrowRight,
  Plus,
  Train,
  Plane,
  Ship,
  ChevronRight,
  Network,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  DashboardStats,
  TrendWeek,
  ShipmentRecord,
  RiskPredictionResult,
} from '../types';

interface DashboardScreenProps {
  stats: DashboardStats;
  trendData: TrendWeek[];
  shipments: ShipmentRecord[];
  onSelectShipment: (shipment: ShipmentRecord) => void;
  onQuickPredict: () => void;
  onRefreshStats: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  stats,
  trendData,
  shipments,
  onSelectShipment,
  onQuickPredict,
  onRefreshStats,
}) => {
  const [activeFilter, setActiveFilter] = useState<'today' | '7days' | 'hub' | 'corridor'>('today');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefreshStats();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const getTransportIcon = (mode: ShipmentRecord['transportMode']) => {
    switch (mode) {
      case 'Road':
        return <Truck className="w-3.5 h-3.5" />;
      case 'Rail':
        return <Train className="w-3.5 h-3.5" />;
      case 'Air':
        return <Plane className="w-3.5 h-3.5" />;
      case 'Sea':
        return <Ship className="w-3.5 h-3.5" />;
    }
  };

  const getRiskBadge = (risk: ShipmentRecord['riskLevel']) => {
    switch (risk) {
      case 'High':
        return (
          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
            High Risk
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
            Medium Risk
          </span>
        );
      case 'Low':
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
            Low Risk
          </span>
        );
      case 'In-Transit':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-xs font-semibold">
            In-Transit
          </span>
        );
    }
  };

  const getRiskBorderColor = (risk: ShipmentRecord['riskLevel']) => {
    switch (risk) {
      case 'High':
        return 'bg-red-600';
      case 'Medium':
        return 'bg-amber-500';
      case 'Low':
        return 'bg-emerald-500';
      case 'In-Transit':
      default:
        return 'bg-[#006591]';
    }
  };

  const getProgressBarColor = (risk: ShipmentRecord['riskLevel']) => {
    switch (risk) {
      case 'High':
        return 'bg-red-600';
      case 'Medium':
        return 'bg-amber-500';
      case 'Low':
        return 'bg-emerald-500';
      case 'In-Transit':
      default:
        return 'bg-[#39b8fd]';
    }
  };

  return (
    <div className="flex flex-col w-full px-4 md:px-6 pb-24 max-w-[840px] mx-auto gap-4">
      {/* Operational Header & Ambient Status */}
      <section className="flex flex-col gap-2 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#64748b] font-semibold">
              Network Telemetry
            </span>
            <h1 className="font-headline font-bold text-2xl text-[#0b1c30]">
              Operations Overview
            </h1>
          </div>
          <button
            aria-label="Refresh metrics"
            onClick={handleRefresh}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#374559] shadow-xs active:scale-95 transition-all border border-[#dce9ff]"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Quick Filter Pills (Horizontal Scrollable) */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
          <button
            onClick={() => setActiveFilter('today')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap shadow-xs transition-all ${
              activeFilter === 'today'
                ? 'bg-[#0037b0] text-white'
                : 'bg-[#eff4ff] text-[#434655] hover:bg-[#e5eeff]'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setActiveFilter('7days')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeFilter === '7days'
                ? 'bg-[#0037b0] text-white'
                : 'bg-[#eff4ff] text-[#434655] hover:bg-[#e5eeff]'
            }`}
          >
            Past 7 Days
          </button>
          <button
            onClick={() => setActiveFilter('hub')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeFilter === 'hub'
                ? 'bg-[#0037b0] text-white'
                : 'bg-[#dce9ff] text-[#0037b0]'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Active Hub: Central EU</span>
          </button>
          <button
            onClick={() => setActiveFilter('corridor')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeFilter === 'corridor'
                ? 'bg-[#0037b0] text-white'
                : 'bg-[#eff4ff] text-[#434655] hover:bg-[#e5eeff]'
            }`}
          >
            Corridor: Rhine-Alpine
          </button>
        </div>
      </section>

      {/* 2x2 Summary Stat Cards Grid */}
      <section className="grid grid-cols-2 gap-3">
        {/* 1. Total Shipments */}
        <div className="flex flex-col p-4 bg-white rounded-xl shadow-xs border border-[#e2e8f0] relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-[#64748b]">Total Today</span>
            <div className="w-7 h-7 rounded-full bg-[#dce9ff] flex items-center justify-center text-[#0037b0]">
              <Truck className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="font-headline font-bold text-2xl text-[#0b1c30]">
            {stats.totalToday.toLocaleString()}
          </span>
          <div className="flex items-center gap-1 mt-1 text-emerald-600 text-xs font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+{stats.totalChangePct}%</span>
            <span className="text-[#64748b] font-normal text-[11px] ml-0.5">vs ystd</span>
          </div>
        </div>

        {/* 2. High Risk Shipments */}
        <div className="flex flex-col p-4 bg-[#ffdad6] text-[#93000a] rounded-xl shadow-xs border border-[#ffb4ab] relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-[#93000a]">Critical Risk</span>
            <div className="w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-[#ba1a1a]">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="font-headline font-bold text-2xl text-[#ba1a1a]">
            {stats.criticalRiskCount}
          </span>
          <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-[#ba1a1a]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] animate-ping"></span>
            <span className="truncate">Immediate review</span>
          </div>
        </div>

        {/* 3. Average Delay Probability */}
        <div className="flex flex-col p-4 bg-white rounded-xl shadow-xs border border-[#e2e8f0]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-[#64748b]">Avg Delay Prob</span>
            <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="font-headline font-bold text-2xl text-[#0b1c30]">
            {stats.avgDelayProbability}%
          </span>
          <div className="flex items-center gap-1 mt-1 text-emerald-600 text-xs font-semibold">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{stats.avgDelayDelta}%</span>
            <span className="text-[#64748b] font-normal text-[11px] ml-0.5">optimal</span>
          </div>
        </div>

        {/* 4. On-time Rate */}
        <div className="flex flex-col p-4 bg-white rounded-xl shadow-xs border border-[#e2e8f0]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-[#64748b]">On-Time Rate</span>
            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="font-headline font-bold text-2xl text-emerald-700">
            {stats.onTimeRate}%
          </span>
          <div className="flex items-center gap-1 mt-1 text-[#64748b] text-xs">
            <span>Target:</span>
            <span className="font-semibold text-[#0b1c30]">{stats.targetRate.toFixed(1)}%</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-0.5" />
          </div>
        </div>
      </section>

      {/* Trend Chart Section */}
      <section className="p-4 bg-white rounded-xl shadow-xs border border-[#e2e8f0] flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline font-bold text-sm text-[#0b1c30]">
              Delay Rate Trend
            </h2>
            <span className="text-xs text-[#64748b]">
              8-week corridor evolution
            </span>
          </div>
          <div className="px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#0037b0] text-xs font-semibold border border-[#dce9ff]">
            W8: {trendData[trendData.length - 1]?.rate ?? 24.2}%
          </div>
        </div>

        {/* Interactive Annotated Inline SVG Chart */}
        <div className="relative w-full h-44 mt-2">
          <svg
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
            viewBox="0 0 340 140"
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Background horizontal grid lines */}
            <line opacity="0.6" stroke="#CBD5E1" strokeDasharray="3 3" strokeWidth="0.75" x1="20" x2="330" y1="20" y2="20" />
            <line opacity="0.6" stroke="#CBD5E1" strokeDasharray="3 3" strokeWidth="0.75" x1="20" x2="330" y1="60" y2="60" />
            <line opacity="0.6" stroke="#CBD5E1" strokeDasharray="3 3" strokeWidth="0.75" x1="20" x2="330" y1="100" y2="100" />

            {/* Benchmark Threshold (25% line) */}
            <line stroke="#D97706" strokeDasharray="4 3" strokeWidth="1.5" x1="20" x2="330" y1="60" y2="60" />
            <text fill="#D97706" fontFamily="Inter" fontSize="9" fontWeight="600" textAnchor="end" x="330" y="55">
              25% Benchmark
            </text>

            {/* Shaded Area */}
            <path
              d="M 25 95 L 68 85 L 112 70 L 156 92 L 200 64 L 244 52 L 288 58 L 325 48 L 325 120 L 25 120 Z"
              fill="url(#areaGradient)"
            />

            {/* Line Plot */}
            <polyline
              fill="none"
              points="25,95 68,85 112,70 156,92 200,64 244,52 288,58 325,48"
              stroke="#1D4ED8"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
            />

            {/* Data markers */}
            <circle cx="25" cy="95" fill="#FFFFFF" r="3" stroke="#1D4ED8" strokeWidth="2" />
            <circle cx="68" cy="85" fill="#FFFFFF" r="3" stroke="#1D4ED8" strokeWidth="2" />
            <circle cx="112" cy="70" fill="#FFFFFF" r="3" stroke="#1D4ED8" strokeWidth="2" />
            <circle cx="156" cy="92" fill="#FFFFFF" r="3" stroke="#1D4ED8" strokeWidth="2" />
            <circle cx="200" cy="64" fill="#FFFFFF" r="3" stroke="#1D4ED8" strokeWidth="2" />
            <circle cx="244" cy="52" fill="#FFFFFF" r="3" stroke="#1D4ED8" strokeWidth="2" />
            <circle cx="288" cy="58" fill="#FFFFFF" r="3" stroke="#1D4ED8" strokeWidth="2" />

            {/* Active W8 Callout Marker */}
            <circle cx="325" cy="48" fill="#1D4ED8" r="5" />
            <circle cx="325" cy="48" fill="#1D4ED8" opacity="0.25" r="9" className="animate-ping origin-center" />

            {/* Week X-Axis Labels */}
            <text fill="#64748B" fontFamily="Inter" fontSize="9" textAnchor="middle" x="25" y="134">W1</text>
            <text fill="#64748B" fontFamily="Inter" fontSize="9" textAnchor="middle" x="68" y="134">W2</text>
            <text fill="#64748B" fontFamily="Inter" fontSize="9" textAnchor="middle" x="112" y="134">W3</text>
            <text fill="#64748B" fontFamily="Inter" fontSize="9" textAnchor="middle" x="156" y="134">W4</text>
            <text fill="#64748B" fontFamily="Inter" fontSize="9" textAnchor="middle" x="200" y="134">W5</text>
            <text fill="#64748B" fontFamily="Inter" fontSize="9" textAnchor="middle" x="244" y="134">W6</text>
            <text fill="#64748B" fontFamily="Inter" fontSize="9" textAnchor="middle" x="288" y="134">W7</text>
            <text fill="#0F172A" fontFamily="Inter" fontSize="9" fontWeight="700" textAnchor="middle" x="325" y="134">W8</text>
          </svg>
        </div>

        {/* Chart Legend & AI Target */}
        <div className="flex items-center justify-between pt-2 border-t border-[#f1f5f9] text-[#64748b] text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-[#1d4ed8]"></span>
            <span>Observed Delay Rate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-500"></span>
            <span>AI Target (&lt;20%)</span>
          </div>
        </div>
      </section>

      {/* Recent Shipments Overview */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline font-bold text-sm text-[#0b1c30]">
              Recent Evaluated Shipments
            </h2>
            <span className="text-xs text-[#64748b]">
              Live predictive scoring
            </span>
          </div>
          <button
            onClick={onQuickPredict}
            className="flex items-center gap-0.5 text-xs text-[#1d4ed8] font-semibold hover:underline"
          >
            <span>View All ({shipments.length + 142})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Shipment Cards List */}
        <div className="flex flex-col gap-2.5">
          {shipments.map((shipment) => (
            <div
              key={shipment.id}
              onClick={() => onSelectShipment(shipment)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectShipment(shipment);
                }
              }}
              className="p-3.5 bg-white rounded-xl shadow-xs border border-[#e2e8f0] flex flex-col gap-1.5 relative overflow-hidden hover:border-[#cbd5e1] hover:bg-[#f8f9ff]/60 active:bg-[#eff4ff] transition-all cursor-pointer text-left"
            >
              {/* Colored Indicator Left Strip */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 ${getRiskBorderColor(
                  shipment.riskLevel
                )}`}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-data-mono font-bold text-xs text-[#0b1c30]">
                    {shipment.id}
                  </span>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#eff4ff] text-[#434655] text-xs font-medium">
                    {getTransportIcon(shipment.transportMode)}
                    <span>{shipment.transportMode}</span>
                  </div>
                </div>
                {/* Risk badge */}
                {getRiskBadge(shipment.riskLevel)}
              </div>

              <div className="flex items-center justify-between mt-1">
                {/* Route Pill */}
                <div className="flex items-center gap-1.5 text-xs text-[#0b1c30]">
                  <span className="font-bold">{shipment.originCode}</span>
                  <ArrowRight className="w-3 h-3 text-[#94a3b8]" />
                  <span className="font-bold">{shipment.destinationCode}</span>
                  <span
                    className={`ml-1 ${
                      shipment.riskLevel === 'Low'
                        ? 'text-emerald-700'
                        : 'text-[#64748b]'
                    }`}
                  >
                    • {shipment.etaInfo}
                  </span>
                </div>

                {/* Delay Probability Tag */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#64748b]">Delay:</span>
                  <span
                    className={`px-1.5 py-0.5 rounded font-data-mono text-xs font-bold ${
                      shipment.riskLevel === 'High'
                        ? 'bg-red-50 text-red-600'
                        : shipment.riskLevel === 'Medium'
                        ? 'bg-amber-50 text-amber-700'
                        : shipment.riskLevel === 'Low'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-[#eff4ff] text-[#006591]'
                    }`}
                  >
                    {shipment.delayProbability}%
                  </span>
                </div>
              </div>

              {/* Confidence Gauge Micro-bar */}
              <div className="w-full bg-[#f1f5f9] rounded-full h-1.5 mt-1 overflow-hidden">
                <div
                  className={`h-full rounded-full ${getProgressBarColor(
                    shipment.riskLevel
                  )}`}
                  style={{ width: `${shipment.delayProbability}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Floating Quick Predict Action Button */}
      <div className="fixed bottom-20 right-4 sm:right-8 z-40">
        <button
          onClick={onQuickPredict}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-[#1d4ed8] text-white shadow-xl hover:bg-[#1e40af] active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5" />
          <span className="font-headline font-bold text-sm tracking-wide">
            Quick Predict
          </span>
        </button>
      </div>
    </div>
  );
};
