import React, { useState, useRef } from 'react';
import {
  Server,
  Code2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Copy,
  Check,
  User,
  Mail,
  Globe,
  Briefcase,
  Save,
  LogOut,
} from 'lucide-react';
import { UserProfile, UserRegion, UserRole } from '../types';

const REGIONS: UserRegion[] = ['EU Central', 'US East', 'APAC'];
const ROLES: UserRole[] = ['Ops Manager', 'Analyst', 'Admin'];

interface SettingsScreenProps {
  apiEndpoint: string;
  onSaveEndpoint: (url: string) => void;
  onResetData: () => void;
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  profileSectionRef?: React.RefObject<HTMLDivElement | null>;
  onSignOut?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  apiEndpoint,
  onSaveEndpoint,
  onResetData,
  profile,
  onSaveProfile,
  profileSectionRef,
  onSignOut,
}) => {
  // ── API Endpoint state ──────────────────────────────────────────────────────
  const [endpoint, setEndpoint] = useState(apiEndpoint);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [endpointSaved, setEndpointSaved] = useState(false);

  // ── Profile state ───────────────────────────────────────────────────────────
  const [profileName, setProfileName] = useState(profile.name);
  const [profileEmail, setProfileEmail] = useState(profile.email);
  const [profileRegion, setProfileRegion] = useState<UserRegion>(profile.region);
  const [profileRole, setProfileRole] = useState<UserRole>(profile.role);
  const [profileSaved, setProfileSaved] = useState(false);

  // ── Code snippet state ──────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);

  const sampleFastApiSnippet = `# main.py - FastAPI delay risk endpoint
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Shipment Delay Risk API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ShipmentRequest(BaseModel):
    distance_km: float
    weather: str          # Clear, Rain, Storm, Fog, Snow
    transport_mode: str   # Road, Rail, Air, Sea
    supplier_reliability: float # 0 - 100
    is_holiday: bool
    origin: str
    destination: str

@app.post("/api/predict")
def predict_delay_risk(payload: ShipmentRequest):
    # Plug in your ML model (e.g., XGBoost, LightGBM, Random Forest):
    # features = extract_features(payload)
    # prob = float(ml_model.predict_proba(features)[0][1]) * 100
    prob = 42.0  # e.g. delay probability percentage
    risk_level = "High" if prob >= 52 else "Medium" if prob >= 26 else "Low"
    return {
        "delay_probability": prob,
        "risk_level": risk_level,
        "latency_ms": 115
    }
`;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleTestEndpoint = async () => {
    if (!endpoint.trim()) { setTestStatus('failed'); return; }
    setTestStatus('testing');
    try {
      const res = await fetch(endpoint.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distance_km: 680, weather: 'Storm', transport_mode: 'Road',
          supplier_reliability: 72, is_holiday: false, origin: 'RTM', destination: 'MUC',
        }),
      });
      setTestStatus(res.ok ? 'success' : 'failed');
    } catch {
      setTestStatus('failed');
    }
  };

  const handleSaveEndpoint = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveEndpoint(endpoint);
    setEndpointSaved(true);
    setTimeout(() => setEndpointSaved(false), 2400);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sampleFastApiSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      name: profileName.trim() || profile.name,
      email: profileEmail.trim() || profile.email,
      region: profileRegion,
      role: profileRole,
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2400);
  };

  // Derive initials for preview avatar
  const initials = profileName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SO';

  return (
    <div className="flex flex-col w-full px-4 md:px-6 py-4 pb-24 max-w-[840px] mx-auto space-y-4">

      {/* ── Page header ────────────────────────────────────────────────────────── */}
      <div className="border-b border-[#e2e8f0] pb-3">
        <span className="text-[11px] font-semibold text-[#1d4ed8] uppercase tracking-wider">
          Configuration Centre
        </span>
        <h1 className="font-headline font-bold text-2xl text-[#0b1c30]">
          Profile & Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#64748b] mt-1">
          Manage your operator profile and FastAPI ML engine configuration.
        </p>
      </div>

      {/* ── Profile Section ─────────────────────────────────────────────────────── */}
      <div
        ref={profileSectionRef}
        id="profile-section"
        className="bg-white rounded-xl shadow-xs border border-[#e2e8f0] p-5 space-y-4 scroll-mt-20"
      >
        {/* Section heading + avatar preview */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#eff4ff] text-[#1d4ed8] flex items-center justify-center border border-[#dce9ff]">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-headline font-bold text-base text-[#0b1c30]">
              Operator Profile
            </h2>
            <span className="text-xs text-[#64748b]">
              Displayed across the dispatch console
            </span>
          </div>
          {/* Live avatar preview */}
          <div className="ml-auto flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#1d4ed8] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#e2e8f0] select-none">
              {initials}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-[12px] font-semibold text-[#0b1c30] truncate max-w-[120px]">
                {profileName || 'Operator'}
              </p>
              <p className="text-[10px] text-[#64748b]">{profileRegion}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-3">
          {/* Name + Email row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[#374559] uppercase tracking-wider">
                <User className="w-3.5 h-3.5" />
                Full Name
              </label>
              <input
                id="profile-name"
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="e.g. Sophie Okafor"
                className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#cbd5e1] text-sm text-[#0b1c30] focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/20 outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[#374559] uppercase tracking-wider">
                <Mail className="w-3.5 h-3.5" />
                Email
              </label>
              <input
                id="profile-email"
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="e.g. s.okafor@logipredict.io"
                className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#cbd5e1] text-sm text-[#0b1c30] focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Region + Role row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[#374559] uppercase tracking-wider">
                <Globe className="w-3.5 h-3.5" />
                Region
              </label>
              <select
                id="profile-region"
                value={profileRegion}
                onChange={(e) => setProfileRegion(e.target.value as UserRegion)}
                className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#cbd5e1] text-sm text-[#0b1c30] focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/20 outline-none transition-all cursor-pointer"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[#374559] uppercase tracking-wider">
                <Briefcase className="w-3.5 h-3.5" />
                Role
              </label>
              <select
                id="profile-role"
                value={profileRole}
                onChange={(e) => setProfileRole(e.target.value as UserRole)}
                className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#cbd5e1] text-sm text-[#0b1c30] focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/20 outline-none transition-all cursor-pointer"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Save button + confirmation */}
          <div className="flex items-center gap-3 pt-1">
            <button
              id="save-profile-btn"
              type="submit"
              className="flex items-center gap-2 px-4 h-10 rounded-lg bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile</span>
            </button>
            {profileSaved && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="font-medium">Profile saved!</span>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* ── FastAPI Endpoint Section ─────────────────────────────────────────────── */}
      <div className="border-b border-[#e2e8f0] pb-1 pt-2">
        <span className="text-[11px] font-semibold text-[#1d4ed8] uppercase tracking-wider">
          Integration Architecture
        </span>
        <h2 className="font-headline font-bold text-lg text-[#0b1c30]">
          FastAPI & ML Engine Configuration
        </h2>
        <p className="text-xs text-[#64748b] mt-0.5">
          Connect your custom Python FastAPI ML server or use the built-in heuristic SHAP engine.
        </p>
      </div>

      {/* Endpoint configuration card */}
      <div className="bg-white rounded-xl shadow-xs border border-[#e2e8f0] p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#eff4ff] text-[#1d4ed8] flex items-center justify-center border border-[#dce9ff]">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-headline font-bold text-base text-[#0b1c30]">
              FastAPI Endpoint URL
            </h3>
            <span className="text-xs text-[#64748b]">
              Leave blank to run local client-side prediction engine
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveEndpoint} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="e.g. http://localhost:8000/predict"
              className="flex-1 h-10 px-3.5 rounded-lg bg-white border border-[#cbd5e1] text-sm text-[#0b1c30] focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/20 outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTestEndpoint}
                disabled={testStatus === 'testing'}
                className="px-3.5 h-10 rounded-lg bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0037b0] font-medium text-xs border border-[#dce9ff] transition-colors cursor-pointer"
              >
                {testStatus === 'testing' ? 'Testing...' : 'Test Ping'}
              </button>
              <button
                type="submit"
                className="px-4 h-10 rounded-lg bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
              >
                Save Endpoint
              </button>
            </div>
          </div>

          {endpointSaved && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
              <span>FastAPI endpoint successfully saved! Prediction requests will route here.</span>
            </div>
          )}
          {testStatus === 'success' && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
              <span>FastAPI server responded with 200 OK! Ready for live ML predictions.</span>
            </div>
          )}
          {testStatus === 'failed' && (
            <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              <AlertCircle className="w-4 h-4" />
              <span>
                Endpoint unreachable or CORS restricted. Console will safely fall back to the built-in engine.
              </span>
            </div>
          )}
        </form>
      </div>

      {/* Code boilerplate card */}
      <div className="bg-white rounded-xl shadow-xs border border-[#e2e8f0] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#1d4ed8]" />
            <span className="font-headline font-bold text-sm text-[#0b1c30]">
              FastAPI Boilerplate (Ready to Run)
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#eff4ff] text-[#0037b0] text-xs font-semibold hover:bg-[#dce9ff] transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>
        <pre className="p-3 bg-[#0f172a] text-slate-200 rounded-lg text-xs font-mono overflow-x-auto max-h-72 no-scrollbar leading-relaxed">
          {sampleFastApiSnippet}
        </pre>
      </div>

      {/* Session / Log Out Card */}
      <div className="bg-white rounded-xl shadow-xs border border-[#e2e8f0] p-5 flex items-center justify-between">
        <div>
          <span className="font-headline font-bold text-sm text-[#0b1c30] block">
            Account Session
          </span>
          <span className="text-xs text-[#64748b]">
            Logged in as <strong className="text-[#0b1c30]">{profile.name}</strong> ({profile.email})
          </span>
        </div>
        {onSignOut && (
          <button
            id="settings-logout-btn"
            onClick={onSignOut}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        )}
      </div>

      {/* Reset State Card */}
      <div className="bg-white rounded-xl shadow-xs border border-[#e2e8f0] p-5 flex items-center justify-between">
        <div>
          <span className="font-headline font-bold text-sm text-[#0b1c30] block">
            Reset Telemetry Sample Data
          </span>
          <span className="text-xs text-[#64748b]">
            Restores default 1,284 shipments and reset evaluation history
          </span>
        </div>
        <button
          onClick={onResetData}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#cbd5e1] hover:bg-slate-50 text-[#374559] font-medium text-xs transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>
    </div>
  );
};
