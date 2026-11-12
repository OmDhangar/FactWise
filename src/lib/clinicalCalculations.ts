import {
  Patient,
  TemperatureRecord,
  DoctorVisit,
  HistoricalClosedCase,
  StreakEvaluationResult,
  FacilityMetrics,
} from '@/types';
import { FACILITY_CONFIG } from './constants';

/**
 * Returns today's facility operating date in 'YYYY-MM-DD' format.
 */
export function getFacilityTodayDate(): string {
  // Use ISO string slice or locale formatted to ensure YYYY-MM-DD consistency
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Shifts a YYYY-MM-DD date by N days.
 */
export function shiftDate(dateStr: string, daysOffset: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + daysOffset);
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generates an array of contiguous dates from start to end inclusive.
 */
export function generateDateSequence(startDate: string, endDate: string): string[] {
  const result: string[] = [];
  let curr = startDate;
  // Safety guard against infinite loops
  let count = 0;
  while (curr <= endDate && count < 60) {
    result.push(curr);
    curr = shiftDate(curr, 1);
    count++;
  }
  return result;
}

/**
 * Derives the daily temperature status for a patient on the given facility date.
 */
export function getDailyTemperatureStatus(
  patientId: string,
  tempRecords: TemperatureRecord[],
  facilityDate: string = getFacilityTodayDate()
): 'pending' | 'completed' {
  const hasPrimaryToday = tempRecords.some(
    (r) => r.patient_id === patientId && r.recorded_date === facilityDate && r.is_primary
  );
  return hasPrimaryToday ? 'completed' : 'pending';
}

/**
 * Derives the daily doctor examination status for a patient on the given facility date.
 */
export function getDailyDoctorVisitStatus(
  patientId: string,
  doctorVisits: DoctorVisit[],
  facilityDate: string = getFacilityTodayDate()
): { status: 'pending' | 'completed'; isEmergency: boolean; visit?: DoctorVisit } {
  const visitToday = doctorVisits.find(
    (v) => v.patient_id === patientId && v.visit_date === facilityDate
  );
  if (!visitToday) {
    return { status: 'pending', isEmergency: false };
  }
  return { status: 'completed', isEmergency: visitToday.is_emergency, visit: visitToday };
}

/**
 * Calculates the consecutive fever-free calendar days for a patient.
 *
 * Clinical Rules:
 * 1. Must contain a valid primary daily reading (< threshold).
 * 2. Additional readings cannot substitute for the primary reading.
 * 3. Any reading on that date >= threshold invalidates the entire calendar date as a Fever Day.
 * 4. Maximum of exactly one fever-free day counted per calendar date.
 * 5. A missing primary reading on any calendar date breaks the streak and resets it to 0.
 */
export function calculateFeverFreeStreak(
  patientId: string,
  tempRecords: TemperatureRecord[],
  admissionDate: string,
  feverThreshold: number = FACILITY_CONFIG.fever_threshold_celsius,
  facilityDate: string = getFacilityTodayDate()
): StreakEvaluationResult {
  const patientRecords = tempRecords.filter((r) => r.patient_id === patientId);

  // Group records by calendar date
  const recordsByDate: Record<string, TemperatureRecord[]> = {};
  for (const r of patientRecords) {
    if (!recordsByDate[r.recorded_date]) {
      recordsByDate[r.recorded_date] = [];
    }
    recordsByDate[r.recorded_date].push(r);
  }

  // Generate sequence of dates from admission up to today
  // If admission is after facility date, just use facilityDate
  const startDate = admissionDate > facilityDate ? facilityDate : admissionDate;
  const dateSeq = generateDateSequence(startDate, facilityDate);

  let currentStreak = 0;
  const qualifyingDates: string[] = [];
  let lastFeverDate: string | null = null;
  let hasFeverToday = false;
  let todayPrimaryReading: TemperatureRecord | null = null;

  for (const date of dateSeq) {
    const dailyReadings = recordsByDate[date] || [];
    const primaryReading = dailyReadings.find((r) => r.is_primary);

    if (date === facilityDate && primaryReading) {
      todayPrimaryReading = primaryReading;
    }

    // Check for any fever reading on this date
    const hasAnyFever = dailyReadings.some((r) => r.temperature_celsius >= feverThreshold);
    if (hasAnyFever) {
      lastFeverDate = date;
      if (date === facilityDate) {
        hasFeverToday = true;
      }
      currentStreak = 0;
      continue;
    }

    // If no fever, we still require a valid primary reading to qualify as a fever-free day
    if (!primaryReading) {
      currentStreak = 0;
      continue;
    }

    // Valid primary reading and no fever on this date: count as 1 qualifying day
    currentStreak += 1;
    qualifyingDates.push(date);
  }

  return {
    streakDays: currentStreak,
    isEligibleForDischargeApproval: currentStreak >= 3,
    qualifyingDates,
    lastFeverDate,
    hasFeverToday,
    todayPrimaryReading,
  };
}

/**
 * Validates the strict 5-point discharge eligibility criteria:
 * 1. 3 consecutive qualifying fever-free calendar days
 * 2. Today's primary temperature measurement completed
 * 3. Today's doctor examination completed
 * 4. Patient lifecycle status is 'admitted'
 * 5. No outstanding discharge re-review flag
 */
export function check5PointDischargeEligibility(
  patient: Patient,
  tempRecords: TemperatureRecord[],
  doctorVisits: DoctorVisit[],
  feverThreshold: number = FACILITY_CONFIG.fever_threshold_celsius,
  facilityDate: string = getFacilityTodayDate()
): { eligible: boolean; failedReasons: string[]; streakResult: StreakEvaluationResult } {
  const failedReasons: string[] = [];

  const streakResult = calculateFeverFreeStreak(
    patient.id,
    tempRecords,
    patient.admission_date,
    feverThreshold,
    facilityDate
  );

  // 1. Streak check
  if (streakResult.streakDays < 3) {
    failedReasons.push(
      `Fever-free streak is ${streakResult.streakDays} of 3 required qualifying days`
    );
  }

  // 2. Today's temp check
  const tempStatus = getDailyTemperatureStatus(patient.id, tempRecords, facilityDate);
  if (tempStatus !== 'completed') {
    failedReasons.push(`Today's primary temperature measurement is pending`);
  }

  // 3. Today's doctor visit check
  const visitStatus = getDailyDoctorVisitStatus(patient.id, doctorVisits, facilityDate);
  if (visitStatus.status !== 'completed') {
    failedReasons.push(`Today's doctor examination has not been completed`);
  }

  // 4. Lifecycle status check
  if (patient.lifecycle_status !== 'admitted') {
    failedReasons.push(
      `Patient lifecycle status is '${patient.lifecycle_status}' (must be 'admitted')`
    );
  }

  // 5. Re-review flag check
  if (patient.discharge_review_flag === 'requires_doctor_rereview') {
    failedReasons.push(
      `Outstanding clinical re-review required following previous discharge invalidation`
    );
  }

  return {
    eligible: failedReasons.length === 0,
    failedReasons,
    streakResult,
  };
}

/**
 * Computes live facility operational and clinical benchmark metrics.
 */
export function calculateFacilityMetrics(
  patients: Patient[],
  tempRecords: TemperatureRecord[],
  doctorVisits: DoctorVisit[],
  historicalClosedCases: HistoricalClosedCase[],
  totalCapacity: number = FACILITY_CONFIG.total_beds,
  facilityDate: string = getFacilityTodayDate()
): FacilityMetrics {
  // Active admitted patients (holding a bed)
  const activePatients = patients.filter(
    (p) => p.lifecycle_status === 'admitted' || p.lifecycle_status === 'discharge_approved'
  );

  const occupied_beds = activePatients.length;
  const available_beds = Math.max(0, totalCapacity - occupied_beds);

  const pending_discharges = activePatients.filter(
    (p) => p.lifecycle_status === 'discharge_approved'
  );

  // Daily Temperature Completion
  let measured_today_count = 0;
  let doctor_visits_completed_today = 0;

  for (const p of activePatients) {
    if (getDailyTemperatureStatus(p.id, tempRecords, facilityDate) === 'completed') {
      measured_today_count++;
    }
    if (getDailyDoctorVisitStatus(p.id, doctorVisits, facilityDate).status === 'completed') {
      doctor_visits_completed_today++;
    }
  }

  const measured_pending_count = activePatients.length - measured_today_count;
  const doctor_visits_pending_today = activePatients.length - doctor_visits_completed_today;

  const temperature_completion_rate =
    activePatients.length > 0
      ? Math.round((measured_today_count / activePatients.length) * 1000) / 10
      : 0;

  const doctor_completion_rate =
    activePatients.length > 0
      ? Math.round((doctor_visits_completed_today / activePatients.length) * 1000) / 10
      : 0;

  // Closed Cases Accounting (Historical + Live Discharged / Deceased)
  // Segregate active patients completely from closed cases!
  const liveClosedCured = patients.filter(
    (p) => p.lifecycle_status === 'discharged' && p.final_outcome === 'cured'
  );
  const liveClosedDeceased = patients.filter(
    (p) => p.lifecycle_status === 'deceased' || p.final_outcome === 'deceased'
  );

  const histCured = historicalClosedCases.filter((c) => c.outcome === 'cured').length;
  const histDeceased = historicalClosedCases.filter((c) => c.outcome === 'deceased').length;

  const closed_cured_count = histCured + liveClosedCured.length;
  const closed_deceased_count = histDeceased + liveClosedDeceased.length;
  const closed_cases_total = closed_cured_count + closed_deceased_count;

  const mortality_rate =
    closed_cases_total > 0
      ? Math.round((closed_deceased_count / closed_cases_total) * 1000) / 10
      : 0;

  const survival_rate =
    closed_cases_total > 0
      ? Math.round((closed_cured_count / closed_cases_total) * 1000) / 10
      : 0;

  return {
    total_capacity: totalCapacity,
    occupied_beds,
    available_beds,
    pending_discharges_count: pending_discharges.length,
    measured_today_count,
    measured_pending_count,
    temperature_completion_rate,
    doctor_visits_completed_today,
    doctor_visits_pending_today,
    doctor_completion_rate,
    closed_cases_total,
    closed_cured_count,
    closed_deceased_count,
    mortality_rate,
    survival_rate,
  };
}

