import React, { useState } from 'react';
import {
  Search,
  Filter,
  Truck,
  Train,
  Plane,
  Ship,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { ShipmentRecord, RiskLevel } from '../types';

interface ShipmentsScreenProps {
  shipments: ShipmentRecord[];
  onSelectShipment: (shipment: ShipmentRecord) => void;
  onNewPrediction: () => void;
}

export const ShipmentsScreen: React.FC<ShipmentsScreenProps> = ({
  shipments,
  onSelectShipment,
  onNewPrediction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('All');
  const [selectedMode, setSelectedMode] = useState<string>('All');

  const filteredShipments = shipments.filter((s) => {
    const matchesSearch =
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.originCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.destinationCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.etaInfo.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRisk =
      selectedRisk === 'All' || s.riskLevel === selectedRisk;

    const matchesMode =
      selectedMode === 'All' || s.transportMode === selectedMode;

    return matchesSearch && matchesRisk && matchesMode;
  });

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

  const getBorderColor = (risk: ShipmentRecord['riskLevel']) => {
    switch (risk) {
      case 'High':
        return 'bg-red-600';
      case 'Medium':
        return 'bg-amber-500';
      case 'Low':
        return 'bg-emerald-500';
      default:
        return 'bg-[#006591]';
    }
  };

  return (
    <div className="flex flex-col w-full px-4 md:px-6 py-4 pb-24 max-w-[840px] mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e2e8f0] pb-3">
        <div>
          <span className="text-[11px] font-semibold text-[#1d4ed8] uppercase tracking-wider">
            Corridor Manifest
          </span>
          <h1 className="font-headline font-bold text-2xl text-[#0b1c30]">
            Evaluated Shipments ({shipments.length})
          </h1>
        </div>
        <button
          onClick={onNewPrediction}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1d4ed8] text-white font-headline font-semibold text-xs shadow-xs hover:bg-[#1e40af] transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Prediction</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-xs border border-[#e2e8f0] p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
          <input
            type="text"
            placeholder="Search by ID (#SH-...), route code (RTM, MUC), or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#f8f9ff] border border-[#cbd5e1] text-xs sm:text-sm text-[#0b1c30] focus:border-[#1d4ed8] focus:bg-white outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center text-xs">
          <span className="text-[#64748b] font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Risk:</span>
          </span>
          {['All', 'High', 'Medium', 'Low', 'In-Transit'].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRisk(r)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedRisk === r
                  ? 'bg-[#1d4ed8] text-white font-semibold'
                  : 'bg-[#eff4ff] text-[#434655] hover:bg-[#dce9ff]'
              }`}
            >
              {r}
            </button>
          ))}

          <span className="text-[#64748b] font-medium ml-2">Mode:</span>
          {['All', 'Road', 'Rail', 'Air', 'Sea'].map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMode(m)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedMode === m
                  ? 'bg-[#1d4ed8] text-white font-semibold'
                  : 'bg-[#eff4ff] text-[#434655] hover:bg-[#dce9ff]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Shipments List */}
      <div className="space-y-2.5">
        {filteredShipments.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-[#e2e8f0] text-[#64748b]">
            <p className="text-sm font-medium">No matching shipments found</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedRisk('All');
                setSelectedMode('All');
              }}
              className="mt-2 text-xs text-[#1d4ed8] font-semibold underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredShipments.map((shipment) => (
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
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 ${getBorderColor(
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
                  <span className="text-[10px] text-[#64748b]">
                    {shipment.evaluatedAt}
                  </span>
                </div>
                {getRiskBadge(shipment.riskLevel)}
              </div>

              <div className="flex items-center justify-between mt-1">
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

                <div className="flex items-center gap-2">
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
                  <ChevronRight className="w-4 h-4 text-[#94a3b8]" />
                </div>
              </div>

              <div className="w-full bg-[#f1f5f9] rounded-full h-1.5 mt-1 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    shipment.riskLevel === 'High'
                      ? 'bg-red-600'
                      : shipment.riskLevel === 'Medium'
                      ? 'bg-amber-500'
                      : shipment.riskLevel === 'Low'
                      ? 'bg-emerald-500'
                      : 'bg-[#39b8fd]'
                  }`}
                  style={{ width: `${shipment.delayProbability}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
