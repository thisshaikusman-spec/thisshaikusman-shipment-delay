import React, { useState, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DashboardScreen } from './components/DashboardScreen';
import { PredictionForm } from './components/PredictionForm';
import { ResultScreen } from './components/ResultScreen';
import { ShipmentsScreen } from './components/ShipmentsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { LoginScreen } from './components/LoginScreen';
import { SignUpScreen } from './components/SignUpScreen';
import {
  ActiveTab,
  PredictionInput,
  RiskPredictionResult,
  ShipmentRecord,
  DashboardStats,
  UserProfile,
} from './types';
import {
  INITIAL_STATS,
  TREND_DATA,
  INITIAL_PREDICTION_RESULT,
  INITIAL_SHIPMENTS,
} from './data/sampleShipments';
import {
  predictDelayRisk,
  calculateLocalDelayRisk,
} from './services/delayRiskService';
import {
  getSession,
  clearSession,
  StoredUser,
} from './auth';

// ── Profile persistence in localStorage ───────────────────────────────────
const PROFILE_KEY = 'logipredict_user_profile';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Sophie Okafor',
  email: 's.okafor@logipredict.io',
  region: 'EU Central',
  role: 'Ops Manager',
};

function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw) as UserProfile;
  } catch { /* ignore */ }
  return DEFAULT_PROFILE;
}

function saveProfileToStorage(p: UserProfile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  } catch { /* ignore */ }
}

// ── Auth screen router ─────────────────────────────────────────────────────
type AuthScreen = 'login' | 'signup';

export default function App() {
  // ── Auth state ──────────────────────────────────────────────────────────
  // Initialise from existing localStorage session (persists across reload)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return getSession() !== null;
  });
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [signUpSuccessMsg, setSignUpSuccessMsg] = useState('');

  // ── App state ───────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isResultView, setIsResultView] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<RiskPredictionResult>(INITIAL_PREDICTION_RESULT);
  const [formInitialValues, setFormInitialValues] = useState<PredictionInput>(
    INITIAL_PREDICTION_RESULT.input
  );
  const [shipments, setShipments] = useState<ShipmentRecord[]>(INITIAL_SHIPMENTS);
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS);
  const [apiEndpoint, setApiEndpoint] = useState<string>(
    import.meta.env.VITE_API_URL || 'http://localhost:8000/predict'
  );
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  // ── User Profile ─────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<UserProfile>(loadProfile);

  const handleSaveProfile = useCallback((updated: UserProfile) => {
    setProfile(updated);
    saveProfileToStorage(updated);
  }, []);

  const profileSectionRef = useRef<HTMLDivElement | null>(null);

  const handleNavigateToSettings = useCallback(() => {
    setActiveTab('settings');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      profileSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }, []);

  // ── Auth handlers ─────────────────────────────────────────────────────────
  const handleLoginSuccess = useCallback((user: StoredUser) => {
    // Seed profile from the logged-in user name/email
    const seededProfile: UserProfile = {
      name: user.name,
      email: user.email,
      region: loadProfile().region,
      role: loadProfile().role,
    };
    setProfile(seededProfile);
    saveProfileToStorage(seededProfile);
    setIsAuthenticated(true);
    setActiveTab('dashboard');
  }, []);

  const handleSignUpSuccess = useCallback(() => {
    setSignUpSuccessMsg('Account created! Sign in to continue.');
    setAuthScreen('login');
  }, []);

  const handleSignOut = useCallback(() => {
    clearSession();
    setIsAuthenticated(false);
    setAuthScreen('login');
    setSignUpSuccessMsg('');
    // Reset view state
    setActiveTab('dashboard');
    setIsResultView(false);
  }, []);

  // ── Prediction flow ────────────────────────────────────────────────────
  const handleQuickPredict = () => {
    setIsResultView(false);
    setActiveTab('predict');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePredictSubmit = async (input: PredictionInput) => {
    setIsEvaluating(true);
    setFormInitialValues(input);
    try {
      const activeEndpoint = apiEndpoint || import.meta.env.VITE_API_URL || 'http://localhost:8000/predict';
      const result = await predictDelayRisk(input, activeEndpoint);
      setCurrentResult(result);
      setIsResultView(true);
      setActiveTab('predict');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error during risk evaluation:', err);
      const fallbackResult = calculateLocalDelayRisk(input);
      setCurrentResult(fallbackResult);
      setIsResultView(true);
      setActiveTab('predict');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSelectShipment = (shipment: ShipmentRecord) => {
    if (shipment.prediction) {
      setCurrentResult(shipment.prediction);
    } else {
      const simulatedResult = calculateLocalDelayRisk({
        id: shipment.id,
        distanceKm: shipment.transportMode === 'Air' ? 560 : shipment.transportMode === 'Sea' ? 980 : 680,
        weather: shipment.riskLevel === 'High' ? 'Storm' : shipment.riskLevel === 'Medium' ? 'Rain' : 'Clear',
        transportMode: shipment.transportMode,
        supplierReliability: shipment.riskLevel === 'High' ? 62 : shipment.riskLevel === 'Medium' ? 76 : 92,
        isHolidayPeriod: false,
        origin: `${shipment.originCode} Central Terminal`,
        destination: `${shipment.destinationCode} Regional DC`,
        originCode: shipment.originCode,
        destinationCode: shipment.destinationCode,
      });
      simulatedResult.delayProbability = shipment.delayProbability;
      simulatedResult.riskLevel = shipment.riskLevel === 'In-Transit' ? 'Low' : shipment.riskLevel;
      setCurrentResult(simulatedResult);
    }
    setIsResultView(true);
    setActiveTab('predict');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToForm = () => {
    setIsResultView(false);
    setActiveTab('predict');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRunAnother = () => {
    setIsResultView(false);
    setActiveTab('predict');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogToDispatch = (result: RiskPredictionResult) => {
    const newRecord: ShipmentRecord = {
      id: result.id,
      transportMode: result.input.transportMode,
      originCode: result.input.originCode,
      destinationCode: result.input.destinationCode,
      etaInfo: result.projectedDelayWindow.includes('On Schedule')
        ? 'On Schedule'
        : `ETA ${result.projectedDelayWindow.split(' ')[0]}`,
      riskLevel: result.riskLevel,
      delayProbability: result.delayProbability,
      evaluatedAt: result.evaluatedAt,
      prediction: result,
    };
    setShipments((prev) => [newRecord, ...prev.filter((s) => s.id !== result.id)]);
    setStats((prev) => ({
      ...prev,
      totalToday: prev.totalToday + 1,
      criticalRiskCount: result.riskLevel === 'High' ? prev.criticalRiskCount + 1 : prev.criticalRiskCount,
      avgDelayProbability: Number(
        ((prev.avgDelayProbability * prev.totalToday + result.delayProbability) /
          (prev.totalToday + 1)).toFixed(1)
      ),
    }));
  };

  const handleTabChange = (tab: ActiveTab) => {
    if (tab === 'predict' && !isResultView) setIsResultView(false);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetData = () => {
    setShipments(INITIAL_SHIPMENTS);
    setStats(INITIAL_STATS);
    setCurrentResult(INITIAL_PREDICTION_RESULT);
    setFormInitialValues(INITIAL_PREDICTION_RESULT.input);
    setIsResultView(false);
    setActiveTab('dashboard');
  };

  // ── Auth screen router ────────────────────────────────────────────────────
  if (!isAuthenticated) {
    if (authScreen === 'signup') {
      return (
        <SignUpScreen
          onSignUpSuccess={handleSignUpSuccess}
          onGoToLogin={() => { setSignUpSuccessMsg(''); setAuthScreen('login'); }}
        />
      );
    }
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        onGoToSignUp={() => { setSignUpSuccessMsg(''); setAuthScreen('signup'); }}
        successMessage={signUpSuccessMsg}
      />
    );
  }

  // ── Authenticated app ─────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      <Header
        activeTab={activeTab}
        isResultView={activeTab === 'predict' && isResultView}
        profile={profile}
        onNavigateToSettings={handleNavigateToSettings}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 w-full pt-16 pb-20">
        {activeTab === 'dashboard' && (
          <DashboardScreen
            stats={stats}
            trendData={TREND_DATA}
            shipments={shipments}
            onSelectShipment={handleSelectShipment}
            onQuickPredict={handleQuickPredict}
            onRefreshStats={() => {
              setStats((prev) => ({
                ...prev,
                totalToday: prev.totalToday + Math.floor(Math.random() * 3),
                avgDelayProbability: Number((28.4 + (Math.random() * 0.4 - 0.2)).toFixed(1)),
              }));
            }}
          />
        )}

        {activeTab === 'predict' && (
          <>
            {isResultView ? (
              <ResultScreen
                result={currentResult}
                onBackToForm={handleBackToForm}
                onRunAnother={handleRunAnother}
                onLogToDispatch={handleLogToDispatch}
              />
            ) : (
              <PredictionForm
                initialValues={formInitialValues}
                onSubmit={handlePredictSubmit}
                isEvaluating={isEvaluating}
                apiEndpoint={apiEndpoint}
              />
            )}
          </>
        )}

        {activeTab === 'shipments' && (
          <ShipmentsScreen
            shipments={shipments}
            onSelectShipment={handleSelectShipment}
            onNewPrediction={handleQuickPredict}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            apiEndpoint={apiEndpoint}
            onSaveEndpoint={(url) => setApiEndpoint(url)}
            onResetData={handleResetData}
            profile={profile}
            onSaveProfile={handleSaveProfile}
            profileSectionRef={profileSectionRef}
            onSignOut={handleSignOut}
          />
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hasActiveResult={isResultView}
      />
    </div>
  );
}
