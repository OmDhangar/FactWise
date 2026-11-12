export type UserRole = 'nurse' | 'doctor' | 'admin' | 'head_doctor';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  department: string;
}

export type LifecycleStatus = 'admitted' | 'discharge_approved' | 'discharged' | 'deceased';
export type DischargeReviewFlag = 'normal' | 'requires_doctor_rereview';

export interface Patient {
  id: string;
  display_id: string;
  full_name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  bed_number: string; // 'B-01' to 'B-74'
  lifecycle_status: LifecycleStatus;
  discharge_review_flag: DischargeReviewFlag;
  discharge_approved_at: string | null;
  discharge_approved_by: string | null;
  discharged_at: string | null;
  discharged_by: string | null;
  final_outcome: 'cured' | 'deceased' | null;
  outcome_recorded_at: string | null;
  admission_date: string; // 'YYYY-MM-DD'
  admission_notes?: string;
}

export interface TemperatureRecord {
  id: string;
  patient_id: string;
  recorded_date: string; // 'YYYY-MM-DD'
  recorded_at: string; // ISO string
  temperature_celsius: number;
  is_primary: boolean;
  reading_type: 'routine_daily' | 'additional_check';
  additional_reason?: string;
  nurse_id: string;
  nurse_name: string;
  is_fever: boolean;
  needs_attention?: boolean;
}

export interface DoctorVisit {
  id: string;
  patient_id: string;
  visit_date: string; // 'YYYY-MM-DD'
  visited_at: string; // ISO string
  doctor_id: string;
  doctor_name: string;
  clinical_observation: string;
  treatment_notes?: string;
  is_emergency: boolean;
  approved_discharge: boolean;
}

export interface HistoricalClosedCase {
  id: string;
  patient_name: string;
  bed_number_historical: string;
  outcome: 'cured' | 'deceased';
  admission_date: string;
  closed_at: string;
}

export interface FacilityConfig {
  total_beds: number;
  fever_threshold_celsius: number;
  extreme_high_threshold: number;
  extreme_low_threshold: number;
  facility_timezone: string;
}

export interface StreakEvaluationResult {
  streakDays: number;
  isEligibleForDischargeApproval: boolean;
  qualifyingDates: string[];
  lastFeverDate: string | null;
  hasFeverToday: boolean;
  todayPrimaryReading: TemperatureRecord | null;
}

export interface FacilityMetrics {
  total_capacity: number; // 74
  occupied_beds: number;
  available_beds: number;
  pending_discharges_count: number;
  measured_today_count: number;
  measured_pending_count: number;
  temperature_completion_rate: number;
  doctor_visits_completed_today: number;
  doctor_visits_pending_today: number;
  doctor_completion_rate: number;
  closed_cases_total: number;
  closed_cured_count: number;
  closed_deceased_count: number;
  mortality_rate: number; // %
  survival_rate: number; // %
}

