export type WeatherCondition = 'Clear' | 'Rain' | 'Storm' | 'Fog' | 'Snow';
export type TransportMode = 'Road' | 'Rail' | 'Air' | 'Sea';
export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface PredictionInput {
  id?: string;
  distanceKm: number;
  weather: WeatherCondition;
  transportMode: TransportMode;
  supplierReliability: number; // 0 - 100
  isHolidayPeriod: boolean;
  origin: string;
  destination: string;
  originCode: string;
  destinationCode: string;
}

export interface ContributingFactor {
  id: string;
  name: string;
  detail: string;
  iconName: 'weather' | 'supplier' | 'transport' | 'distance' | 'holiday';
  impactText: string;
  impactType: 'risk' | 'mitigation' | 'neutral';
  weight: number; // 0 - 100%
  percentageShare: number; // bar width %
}

export interface OpsRecommendation {
  title: string;
  badge: string;
  description: string;
  primaryAction: {
    id: string;
    label: string;
    icon: string;
  };
  secondaryAction?: {
    id: string;
    label: string;
    icon: string;
  };
}

export interface RiskPredictionResult {
  id: string;
  evaluatedModel: string;
  delayProbability: number;
  deltaVsBaseline: number;
  riskLevel: RiskLevel;
  projectedDelayWindow: string;
  modelConfidence: 'High' | 'Medium' | 'Low';
  historicalAccuracy: number;
  varianceIndex: number;
  criticalThreshold: number;
  factors: ContributingFactor[];
  recommendation: OpsRecommendation;
  evaluatedAt: string;
  pipelineLatencyMs: number;
  input: PredictionInput;
}

export interface ShipmentRecord {
  id: string;
  transportMode: TransportMode;
  originCode: string;
  destinationCode: string;
  etaInfo: string;
  riskLevel: RiskLevel | 'In-Transit';
  delayProbability: number;
  evaluatedAt: string;
  prediction?: RiskPredictionResult;
}

export interface DashboardStats {
  totalToday: number;
  totalChangePct: number;
  criticalRiskCount: number;
  avgDelayProbability: number;
  avgDelayDelta: number;
  onTimeRate: number;
  targetRate: number;
}

export interface TrendWeek {
  week: string;
  label: string;
  rate: number;
  benchmark: number;
}

export type ActiveTab = 'dashboard' | 'predict' | 'shipments' | 'settings';

export type UserRegion = 'EU Central' | 'US East' | 'APAC';
export type UserRole = 'Ops Manager' | 'Analyst' | 'Admin';

export interface UserProfile {
  name: string;
  email: string;
  region: UserRegion;
  role: UserRole;
}
