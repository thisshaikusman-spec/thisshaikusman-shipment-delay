import React, { useState } from 'react';
import {
  ArrowLeft,
  Route,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Sparkles,
  CloudLightning,
  Store,
  Truck,
  Milestone,
  CalendarCheck,
  Bot,
  RotateCcw,
  ClipboardCheck,
  FileDown,
  Info,
  ExternalLink,
  ShieldCheck,
  Check,
  Send,
} from 'lucide-react';
import { RiskPredictionResult, ContributingFactor } from '../types';

interface ResultScreenProps {
  result: RiskPredictionResult;
  onBackToForm: () => void;
  onRunAnother: () => void;
  onLogToDispatch?: (result: RiskPredictionResult) => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  result,
  onBackToForm,
  onRunAnother,
  onLogToDispatch,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [appliedAction, setAppliedAction] = useState<string | null>(null);
  const [loggedToDispatch, setLoggedToDispatch] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleActionClick = (actionId: string, actionLabel: string) => {
    setAppliedAction(actionId);
    showToast(`Dispatched order: "${actionLabel}" registered to telemetry pipeline.`);
  };

  const handleLogClick = () => {
    if (onLogToDispatch && !loggedToDispatch) {
      onLogToDispatch(result);
      setLoggedToDispatch(true);
      showToast(`Shipment ${result.id} logged to live Ops Dispatch queue.`);
    } else {
      showToast(`Shipment ${result.id} is already in the dispatch manifest.`);
    }
  };

  const handleExportPDF = () => {
    showToast('Exporting AI Delay Risk SHAP Audit dossier (PDF)...');
    setTimeout(() => {
      window.print();
    }, 600);
  };

  const getFactorIcon = (iconName: ContributingFactor['iconName']) => {
    switch (iconName) {
      case 'weather':
        return <CloudLightning className="w-5 h-5 text-amber-600" />;
      case 'supplier':
        return <Store className="w-5 h-5 text-[#374559]" />;
      case 'transport':
        return <Truck className="w-5 h-5 text-[#374559]" />;
      case 'distance':
        return <Milestone className="w-5 h-5 text-[#374559]" />;
      case 'holiday':
        return <CalendarCheck className="w-5 h-5 text-emerald-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-[#1d4ed8]" />;
    }
  };

  // Color config for Risk Level Badge
  const isHigh = result.riskLevel === 'High';
  const isMedium = result.riskLevel === 'Medium';
  const isLow = result.riskLevel === 'Low';

  const riskBadgeStyles = isHigh
    ? 'bg-red-50 text-red-800 border border-red-200'
    : isMedium
    ? 'bg-amber-50 text-amber-800 border border-amber-200'
    : 'bg-emerald-50 text-emerald-800 border border-emerald-200';

  const riskBarColor = isHigh
    ? 'bg-red-600'
    : isMedium
    ? 'bg-amber-500'
    : 'bg-emerald-600';

  return (
    <div className="flex flex-col w-full px-4 md:px-6 py-4 max-w-[840px] mx-auto space-y-4">
      {/* Toast Notification Notification Pill */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#0f172a] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-top-3 duration-200 text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation / Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToForm}
          className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#e5eeff] hover:bg-[#dce9ff] transition-colors text-[#0037b0] font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Input Form</span>
        </button>
        <span className="font-data-mono text-xs font-semibold text-[#434655] bg-[#dce9ff] px-2.5 py-1 rounded">
          {result.id}
        </span>
      </div>

      {/* Route Breadcrumb & Live Context Banner */}
      <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-[#e2e8f0]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#eff4ff] flex items-center justify-center text-[#0037b0] flex-shrink-0 border border-[#dce9ff]">
            <Route className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
              Active Corridor
            </span>
            <span className="font-headline font-semibold text-sm text-[#0b1c30] truncate">
              {result.input.origin} → {result.input.destination}
            </span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#eff4ff] text-[#006591] text-xs font-medium border border-[#c9e6ff] flex-shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#006591]" />
          <span>{result.evaluatedModel} Evaluated</span>
        </span>
      </div>

      {/* Focal Prediction Hero Card */}
      <div className="relative overflow-hidden rounded-xl bg-white shadow-sm border border-[#e2e8f0] p-5 sm:p-6">
        {/* Subtle background ambient aura */}
        <div
          className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-2xl pointer-events-none opacity-20 ${
            isHigh ? 'bg-red-500' : isMedium ? 'bg-amber-400' : 'bg-emerald-400'
          }`}
        />

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
          {/* Big Bold Probability */}
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
              Delay Probability
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="font-headline text-[48px] sm:text-[54px] leading-none font-extrabold text-[#0b1c30] tracking-tight">
                {result.delayProbability}%
              </span>
              <span
                className={`text-xs sm:text-sm font-semibold flex items-center gap-0.5 ${
                  result.deltaVsBaseline > 0 ? 'text-amber-800' : 'text-emerald-700'
                }`}
              >
                {result.deltaVsBaseline > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>
                  {result.deltaVsBaseline > 0 ? `+${result.deltaVsBaseline}%` : `${result.deltaVsBaseline}%`} vs baseline
                </span>
              </span>
            </div>
          </div>

          {/* Prominent Risk Level Badge */}
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full self-start shadow-sm font-semibold text-sm ${riskBadgeStyles}`}>
            {isHigh ? (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            ) : isMedium ? (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            )}
            <span>{result.riskLevel} Risk</span>
          </div>
        </div>

        {/* Projected Impact Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-4 bg-[#f8f9ff] rounded-lg p-3.5 border border-[#e2e8f0]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#0b1c30] shadow-xs border border-[#e2e8f0]">
              <Clock className={`w-5 h-5 ${isHigh ? 'text-red-600' : isMedium ? 'text-amber-600' : 'text-emerald-600'}`} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-medium text-[#64748b]">
                Projected Delay Window
              </span>
              <span className="font-headline text-sm text-[#0b1c30] font-bold truncate">
                {result.projectedDelayWindow}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#1d4ed8] shadow-xs border border-[#e2e8f0]">
              <Sparkles className="w-5 h-5 text-[#1d4ed8]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-medium text-[#64748b]">
                Model Confidence
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-headline text-sm text-[#0b1c30] font-bold">
                  {result.modelConfidence}
                </span>
                <span className="text-xs text-[#64748b]">
                  ({result.historicalAccuracy}% historical accuracy)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Confidence Gauge Indicator */}
        <div className="mt-4">
          <div className="flex justify-between items-center text-xs text-[#64748b] mb-1.5">
            <span>Variance Index (Permissible Tolerance: 2.0h)</span>
            <span className="text-amber-800 font-semibold font-data-mono">
              Critical Threshold at {result.criticalThreshold}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#e2e8f0] overflow-hidden relative">
            <div
              className={`h-full ${riskBarColor} rounded-full transition-all duration-700`}
              style={{ width: `${Math.min(100, result.delayProbability)}%` }}
            />
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-600"
              style={{ left: `${result.criticalThreshold}%` }}
              title="Critical Threshold: 50%"
            />
          </div>
        </div>
      </div>

      {/* Key Contributing Factors (Feature Weight Breakdown) */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-headline font-bold text-base text-[#0b1c30]">
              Key Contributing Factors
            </h2>
            <div className="relative group cursor-pointer" tabIndex={0}>
              <Info className="w-4 h-4 text-[#64748b] hover:text-[#0b1c30] transition-colors" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block group-focus:block z-30 w-64 p-2.5 bg-[#0f172a] text-white text-xs rounded-lg shadow-xl pointer-events-none">
                Calculated via SHAP feature importance relative to 14,200 recent corridor runs.
              </div>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
            Feature Weight
          </span>
        </div>

        {/* Factors Bar List */}
        <div className="space-y-4">
          {result.factors.map((factor) => {
            const isMitigation = factor.impactType === 'mitigation';
            const isHighRiskFactor = factor.impactType === 'risk' && factor.weight >= 30;

            const chipClass = isMitigation
              ? 'bg-emerald-100 text-emerald-900'
              : isHighRiskFactor
              ? 'bg-amber-100 text-amber-900 font-semibold'
              : 'bg-[#e5eeff] text-[#0b1c30]';

            const barColor = isMitigation
              ? 'bg-emerald-500'
              : isHighRiskFactor
              ? 'bg-amber-500'
              : 'bg-[#4f5d71]';

            return (
              <div key={factor.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex-shrink-0">
                      {getFactorIcon(factor.iconName)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-headline font-semibold text-sm text-[#0b1c30] truncate">
                        {factor.name}
                      </span>
                      <span className="text-xs text-[#64748b] truncate">
                        {factor.detail}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded text-xs font-data-mono ${chipClass}`}>
                      {factor.impactText}
                    </span>
                    <span className="font-data-mono text-xs text-[#0b1c30] font-bold w-8 text-right">
                      {factor.percentageShare}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-[#eff4ff] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${factor.percentageShare}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ops Action Recommendation Card */}
      <div className="rounded-xl bg-[#e5eeff] border border-[#dce9ff] p-4 sm:p-5 shadow-xs relative overflow-hidden">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1d4ed8] text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
            <Bot className="w-5 h-5" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-headline text-sm font-bold text-[#0b1c30]">
                {result.recommendation.title}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#dce1ff] text-[#001551] rounded uppercase">
                {result.recommendation.badge}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#434655] leading-relaxed">
              {result.recommendation.description}
            </p>
          </div>
        </div>

        {/* Quick action pill chips */}
        <div className="flex flex-wrap gap-2 mt-4 pt-2 sm:pl-12">
          {result.recommendation.primaryAction && (
            <button
              onClick={() =>
                handleActionClick(
                  result.recommendation.primaryAction.id,
                  result.recommendation.primaryAction.label
                )
              }
              className={`px-3 py-1.5 font-medium text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-all ${
                appliedAction === result.recommendation.primaryAction.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white hover:bg-slate-50 text-[#1d4ed8] border border-[#cbd5e1]'
              }`}
            >
              {appliedAction === result.recommendation.primaryAction.id ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{result.recommendation.primaryAction.label}</span>
            </button>
          )}

          {result.recommendation.secondaryAction && (
            <button
              onClick={() =>
                handleActionClick(
                  result.recommendation.secondaryAction!.id,
                  result.recommendation.secondaryAction!.label
                )
              }
              className={`px-3 py-1.5 font-medium text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-all ${
                appliedAction === result.recommendation.secondaryAction.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white hover:bg-slate-50 text-[#434655] border border-[#cbd5e1]'
              }`}
            >
              {appliedAction === result.recommendation.secondaryAction.id ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <ExternalLink className="w-3.5 h-3.5" />
              )}
              <span>{result.recommendation.secondaryAction.label}</span>
            </button>
          )}
        </div>
      </div>

      {/* Operational Bottom Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <button
          onClick={onRunAnother}
          className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#1d4ed8] text-white font-medium text-sm hover:bg-[#1e40af] active:scale-98 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Run Another Prediction</span>
        </button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleLogClick}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 shadow-xs border ${
              loggedToDispatch
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-[#0b1c30] border-[#cbd5e1] hover:bg-slate-50'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 text-[#1d4ed8]" />
            <span>{loggedToDispatch ? 'Logged in Dispatch' : 'Log to Ops Dispatch'}</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg bg-white text-[#0b1c30] border border-[#cbd5e1] font-medium text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <FileDown className="w-4 h-4 text-[#1d4ed8]" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Micro Audit Status Footer */}
      <div className="text-center pt-2 pb-6 text-[#64748b] text-xs flex items-center justify-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
        <span className="font-data-mono">
          SHAP Feature Analysis calculated at {result.evaluatedAt} • Pipeline Latency: {result.pipelineLatencyMs}ms
        </span>
      </div>
    </div>
  );
};
