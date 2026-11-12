import { getInitialSeedData } from '../src/lib/seedData';
import {
  getFacilityTodayDate,
  shiftDate,
  calculateFeverFreeStreak,
  getDailyTemperatureStatus,
  getDailyDoctorVisitStatus,
  check5PointDischargeEligibility,
  calculateFacilityMetrics,
} from '../src/lib/clinicalCalculations';
import { FACILITY_CONFIG } from '../src/lib/constants';

console.log('=== QUARANTINECARE MVP V2.1 AUTOMATED VERIFICATION SUITE ===\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

const seed = getInitialSeedData();
const today = getFacilityTodayDate();

// TEST 1: Initial State & Occupancy (74/74 Beds)
console.log('\n--- Test 1: Capacity & Initial Seed Accounting ---');
assert(seed.patients.length === 74, `Total active patients is exactly 74 (Got: ${seed.patients.length})`);

const metrics = calculateFacilityMetrics(
  seed.patients,
  seed.temperatureRecords,
  seed.doctorVisits,
  seed.historicalClosedCases,
  74,
  today
);

assert(metrics.total_capacity === 74, `Total capacity is 74 beds`);
assert(metrics.occupied_beds === 74, `Occupied beds is 74/74 (100% capacity)`);
assert(metrics.available_beds === 0, `Available beds is exactly 0`);

// TEST 2: Daily Temperature Status Distribution (48 Measured, 26 Pending)
console.log('\n--- Test 2: Daily Temperature Distribution ---');
assert(metrics.measured_today_count === 48, `Measured today is 48 (Got: ${metrics.measured_today_count})`);
assert(metrics.measured_pending_count === 26, `Pending measurement is 26 (Got: ${metrics.measured_pending_count})`);
assert(metrics.temperature_completion_rate === 64.9, `Temperature completion rate is 64.9% (Got: ${metrics.temperature_completion_rate}%)`);

// TEST 3: Daily Doctor Visit Distribution (30 Completed, 44 Pending)
console.log('\n--- Test 3: Doctor Visit Distribution ---');
assert(metrics.doctor_visits_completed_today === 30, `Doctor visits completed today is 30 (28 routine + 2 emergency) (Got: ${metrics.doctor_visits_completed_today})`);
assert(metrics.doctor_visits_pending_today === 44, `Doctor visits pending today is 44 (20 ready + 24 awaiting temp) (Got: ${metrics.doctor_visits_pending_today})`);

// Emergency visit continuity check
const emergencyPatient = seed.patients.find(p => p.bed_number === 'B-49')!;
const emergencyVisitStatus = getDailyDoctorVisitStatus(emergencyPatient.id, seed.doctorVisits, today);
assert(emergencyVisitStatus.status === 'completed' && emergencyVisitStatus.isEmergency === true, `Emergency pre-temperature doctor visit on Bed B-49 is completed`);

// TEST 4: Baseline Closed Case Metrics (20 Cases: 17 Cured, 3 Deceased)
console.log('\n--- Test 4: Historical Closed Case Benchmarks ---');
assert(metrics.closed_cases_total === 20, `Total closed cases is 20`);
assert(metrics.closed_cured_count === 17, `Cured closed cases is 17`);
assert(metrics.closed_deceased_count === 3, `Deceased closed cases is 3`);
assert(metrics.mortality_rate === 15.0, `Mortality rate matches 15.0% benchmark (Got: ${metrics.mortality_rate}%)`);
assert(metrics.survival_rate === 85.0, `Survival rate matches 85.0% benchmark (Got: ${metrics.survival_rate}%)`);

// TEST 5: 3-Day Fever-Free Streak Calculation Rules
console.log('\n--- Test 5: Clinical Streak Rules ---');
// Bed B-07 has 3 qualifying days
const b07 = seed.patients.find(p => p.bed_number === 'B-07')!;
const b07Streak = calculateFeverFreeStreak(b07.id, seed.temperatureRecords, b07.admission_date, 37.8, today);
assert(b07Streak.streakDays >= 3, `Bed B-07 completed >= 3 fever-free days (Got: ${b07Streak.streakDays} days)`);
assert(b07Streak.isEligibleForDischargeApproval === true, `Bed B-07 is eligible for discharge review`);

// Verify 5-Point Discharge Check
const b07Eligibility = check5PointDischargeEligibility(b07, seed.temperatureRecords, seed.doctorVisits, 37.8, today);
assert(b07Eligibility.eligible === true, `Bed B-07 passes all 5 discharge criteria`);

// TEST 6: Fever Breaks Streak and Invalidation
console.log('\n--- Test 6: Fever Streak Reset & Invalidation ---');
const recordsWithFever = [
  ...seed.temperatureRecords,
  {
    id: 'tr-b07-spike',
    patient_id: b07.id,
    recorded_date: today,
    recorded_at: `${today}T14:00:00Z`,
    temperature_celsius: 38.6,
    is_primary: false,
    reading_type: 'additional_check' as const,
    additional_reason: 'Chills reported',
    nurse_id: 'user-nurse-01',
    nurse_name: 'Nurse Sarah Jenkins',
    is_fever: true
  }
];

const b07StreakAfterFever = calculateFeverFreeStreak(b07.id, recordsWithFever, b07.admission_date, 37.8, today);
assert(b07StreakAfterFever.streakDays === 0, `Same-day fever spike resets streak to 0 (Got: ${b07StreakAfterFever.streakDays})`);
assert(b07StreakAfterFever.isEligibleForDischargeApproval === false, `Bed B-07 is no longer eligible after fever spike`);

// TEST 7: Discharge Queue & Bed Release Simulation
console.log('\n--- Test 7: Discharge Processing & Bed Release Cycle ---');
const b08 = seed.patients.find(p => p.bed_number === 'B-08')!;
assert(b08.lifecycle_status === 'discharge_approved', `Bed B-08 is in discharge_approved status`);

// Simulate Admin Processing Discharge on Bed B-08
const patientsAfterDischarge = seed.patients.map(p => {
  if (p.id === b08.id) {
    return {
      ...p,
      lifecycle_status: 'discharged' as const,
      final_outcome: 'cured' as const,
      discharged_at: `${today}T11:00:00Z`
    };
  }
  return p;
});

const metricsAfterDischarge = calculateFacilityMetrics(
  patientsAfterDischarge,
  seed.temperatureRecords,
  seed.doctorVisits,
  seed.historicalClosedCases,
  74,
  today
);

assert(metricsAfterDischarge.occupied_beds === 73, `Occupancy drops from 74 to 73 upon discharge`);
assert(metricsAfterDischarge.available_beds === 1, `Bed B-08 is released and available beds = 1`);
assert(metricsAfterDischarge.closed_cases_total === 21, `Total closed cases increments to 21`);
assert(metricsAfterDischarge.closed_cured_count === 18, `Closed cured count increments to 18`);
assert(metricsAfterDischarge.survival_rate === 85.7, `Survival rate dynamically updates to 18/21 = 85.7% (Got: ${metricsAfterDischarge.survival_rate}%)`);

// TEST 8: Re-admission into released Bed B-08
console.log('\n--- Test 8: Patient Intake into Released Bed ---');
const newPatient = {
  id: 'pat-new-75',
  display_id: 'QC-2026-0075',
  full_name: 'Maya Lin',
  age: 32,
  gender: 'female' as const,
  bed_number: 'B-08',
  lifecycle_status: 'admitted' as const,
  discharge_review_flag: 'normal' as const,
  discharge_approved_at: null,
  discharge_approved_by: null,
  discharged_at: null,
  discharged_by: null,
  final_outcome: null,
  outcome_recorded_at: null,
  admission_date: today
};

const patientsAfterIntake = [...patientsAfterDischarge, newPatient];
const metricsAfterIntake = calculateFacilityMetrics(
  patientsAfterIntake,
  seed.temperatureRecords,
  seed.doctorVisits,
  seed.historicalClosedCases,
  74,
  today
);

assert(metricsAfterIntake.occupied_beds === 74, `Occupancy returns to 74/74 beds (100% full)`);
assert(metricsAfterIntake.available_beds === 0, `Available beds returns to 0`);

console.log(`\n=== VERIFICATION COMPLETE: ${passCount} PASSED, ${failCount} FAILED ===`);
if (failCount > 0) process.exit(1);
