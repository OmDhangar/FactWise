import { Patient, TemperatureRecord, DoctorVisit, HistoricalClosedCase } from '@/types';
import { getFacilityTodayDate, shiftDate } from './clinicalCalculations';

export function getInitialSeedData(): {
  patients: Patient[];
  temperatureRecords: TemperatureRecord[];
  doctorVisits: DoctorVisit[];
  historicalClosedCases: HistoricalClosedCase[];
} {
  const today = getFacilityTodayDate();
  const dayMinus1 = shiftDate(today, -1);
  const dayMinus2 = shiftDate(today, -2);
  const dayMinus3 = shiftDate(today, -3);
  const dayMinus4 = shiftDate(today, -4);

  const FIRST_NAMES = [
    'Aarav', 'Fatima', 'Liam', 'Zainab', 'Lucas', 'Priya', 'Noah', 'Amara',
    'Mateo', 'Mei', 'Ethan', 'Amina', 'Oliver', 'Ananya', 'Elijah', 'Layla',
    'Alexander', 'Hana', 'Daniel', 'Sunita', 'Henry', 'Yasmin', 'James', 'Kavita',
    'Benjamin', 'Sara', 'William', 'Zoya', 'Sebastian', 'Pooja', 'Jack', 'Farah',
    'Samuel', 'Deepika', 'David', 'Mariam', 'Joseph', 'Rohan', 'John', 'Vikram',
    'Owen', 'Aditi', 'Julian', 'Nisha', 'Leo', 'Riya', 'Gabriel', 'Siddharth',
    'Anthony', 'Divya', 'Isaac', 'Mira', 'Dylan', 'Swati', 'Thomas', 'Anil',
    'Charles', 'Sneha', 'Christopher', 'Rajesh', 'Jaxon', 'Shreya', 'Maverick', 'Tanvi',
    'Josiah', 'Neeraj', 'Ezekiel', 'Preeti', 'Caleb', 'Manoj', 'Nathan', 'Geeta',
    'Andrew', 'Suresh'
  ];

  const LAST_NAMES = [
    'Sharma', 'Patel', 'Khan', 'Singh', 'Verma', 'Kumar', 'Ahmed', 'Gupta',
    'Chowdhury', 'Mendoza', 'Kim', 'Ali', 'Das', 'Sen', 'Joshi', 'Bose',
    'Nair', 'Rao', 'Reddy', 'Mehta', 'Kaur', 'Shah', 'Iqbal', 'Siddiqui',
    'Mukherjee', 'Banerjee', 'Ghosh', 'Chatterjee', 'Mishra', 'Pandey', 'Tiwari', 'Dubey',
    'Yadav', 'Prasad', 'Thakur', 'Chauhan', 'Saxena', 'Bhatia', 'Malhotra', 'Kapoor',
    'Khanna', 'Arora', 'Bhasin', 'Sawhney', 'Talwar', 'Kohli', 'Sood', 'Nangia',
    'Chopra', 'Anand', 'Grover', 'Madan', 'Bahl', 'Sethi', 'Bahl', 'Lamba',
    'Ahluwalia', 'Sandhu', 'Grewal', 'Sidhu', 'Brar', 'Dhillon', 'Gill', 'Mann',
    'Virk', 'Cheema', 'Deol', 'Bajwa', 'Randhawa', 'Bains', 'Pannu', 'Sohal',
    'Dosanjh', 'Kahlon'
  ];

  const patients: Patient[] = [];
  const temperatureRecords: TemperatureRecord[] = [];
  const doctorVisits: DoctorVisit[] = [];

  // Generate strictly 74 active patients (1 per bed, B-01 to B-74)
  for (let i = 1; i <= 74; i++) {
    const bedNumber = `B-${String(i).padStart(2, '0')}`;
    const displayId = `QC-2026-${String(i).padStart(4, '0')}`;
    const fullName = `${FIRST_NAMES[(i - 1) % FIRST_NAMES.length]} ${LAST_NAMES[(i - 1) % LAST_NAMES.length]}`;
    const age = 18 + ((i * 7) % 62);
    const gender = i % 3 === 0 ? 'female' : i % 3 === 1 ? 'male' : 'other';

    // Default status: admitted
    let lifecycleStatus: Patient['lifecycle_status'] = 'admitted';
    let dischargeReviewFlag: Patient['discharge_review_flag'] = 'normal';
    let dischargeApprovedAt: string | null = null;
    let dischargeApprovedBy: string | null = null;

    // Bed B-08 & B-15 are already doctor-approved, waiting in Admin Discharge Queue
    if (i === 8 || i === 15) {
      lifecycleStatus = 'discharge_approved';
      dischargeApprovedAt = `${today}T09:30:00Z`;
      dischargeApprovedBy = 'Dr. Michael Chen, MD';
    }

    // Admission date (spread across last 3 to 10 days)
    const daysAdmittedAgo = i <= 25 ? 5 : i <= 50 ? 4 : 3;
    const admissionDate = shiftDate(today, -daysAdmittedAgo);

    const patient: Patient = {
      id: `pat-${i}`,
      display_id: displayId,
      full_name: fullName,
      age,
      gender,
      bed_number: bedNumber,
      lifecycle_status: lifecycleStatus,
      discharge_review_flag: dischargeReviewFlag,
      discharge_approved_at: dischargeApprovedAt,
      discharge_approved_by: dischargeApprovedBy,
      discharged_at: null,
      discharged_by: null,
      final_outcome: null,
      outcome_recorded_at: null,
      admission_date: admissionDate,
      admission_notes: `Admitted with prolonged febrile symptoms. Isolation bed ${bedNumber} assigned.`,
    };

    patients.push(patient);

    // ==========================================
    // SEED TEMPERATURE RECORDS FOR HISTORICAL DAYS
    // ==========================================
    // For Bed B-07, B-22 (Ready for Doctor Approval): 3 consecutive normal days (day-3, day-2, day-1) + today normal
    if (i === 7 || i === 22) {
      // Day -3
      temperatureRecords.push({
        id: `tr-${i}-d3`,
        patient_id: patient.id,
        recorded_date: dayMinus3,
        recorded_at: `${dayMinus3}T08:15:00Z`,
        temperature_celsius: 36.6,
        is_primary: true,
        reading_type: 'routine_daily',
        nurse_id: 'user-nurse-01',
        nurse_name: 'Nurse Sarah Jenkins',
        is_fever: false,
      });
      // Day -2
      temperatureRecords.push({
        id: `tr-${i}-d2`,
        patient_id: patient.id,
        recorded_date: dayMinus2,
        recorded_at: `${dayMinus2}T08:20:00Z`,
        temperature_celsius: 36.7,
        is_primary: true,
        reading_type: 'routine_daily',
        nurse_id: 'user-nurse-01',
        nurse_name: 'Nurse Sarah Jenkins',
        is_fever: false,
      });
      // Day -1
      temperatureRecords.push({
        id: `tr-${i}-d1`,
        patient_id: patient.id,
        recorded_date: dayMinus1,
        recorded_at: `${dayMinus1}T08:10:00Z`,
        temperature_celsius: 36.5,
        is_primary: true,
        reading_type: 'routine_daily',
        nurse_id: 'user-nurse-01',
        nurse_name: 'Nurse Sarah Jenkins',
        is_fever: false,
      });
    } else if (i === 8 || i === 15) {
      // B-08 & B-15 already approved: 3 normal days leading to approval
      for (const d of [dayMinus3, dayMinus2, dayMinus1]) {
        temperatureRecords.push({
          id: `tr-${i}-${d}`,
          patient_id: patient.id,
          recorded_date: d,
          recorded_at: `${d}T08:30:00Z`,
          temperature_celsius: 36.6,
          is_primary: true,
          reading_type: 'routine_daily',
          nurse_id: 'user-nurse-01',
          nurse_name: 'Nurse Sarah Jenkins',
          is_fever: false,
        });
      }
    } else {
      // Other patients: seed varied history (some fevers, some recoveries)
      if (i % 4 === 0) {
        // Fever yesterday
        temperatureRecords.push({
          id: `tr-${i}-d1`,
          patient_id: patient.id,
          recorded_date: dayMinus1,
          recorded_at: `${dayMinus1}T08:45:00Z`,
          temperature_celsius: 38.6,
          is_primary: true,
          reading_type: 'routine_daily',
          nurse_id: 'user-nurse-01',
          nurse_name: 'Nurse Sarah Jenkins',
          is_fever: true,
        });
      } else {
        // Normal yesterday
        temperatureRecords.push({
          id: `tr-${i}-d1`,
          patient_id: patient.id,
          recorded_date: dayMinus1,
          recorded_at: `${dayMinus1}T08:40:00Z`,
          temperature_celsius: 36.8,
          is_primary: true,
          reading_type: 'routine_daily',
          nurse_id: 'user-nurse-01',
          nurse_name: 'Nurse Sarah Jenkins',
          is_fever: false,
        });
      }
    }

    // ==========================================
    // TODAY'S TEMPERATURE MEASUREMENTS (48 Completed, 26 Pending)
    // Beds 1 to 48: Completed today
    // Beds 49 to 74: Pending today
    // ==========================================
    if (i <= 48) {
      const isFever = i === 12 || i === 30 || i === 44; // 3 active fevers today
      const tempVal = isFever ? 38.7 : 36.6 + ((i * 3) % 8) / 10;
      temperatureRecords.push({
        id: `tr-${i}-today`,
        patient_id: patient.id,
        recorded_date: today,
        recorded_at: `${today}T08:${String(10 + (i % 45)).padStart(2, '0')}:00Z`,
        temperature_celsius: tempVal,
        is_primary: true,
        reading_type: 'routine_daily',
        nurse_id: 'user-nurse-01',
        nurse_name: 'Nurse Sarah Jenkins',
        is_fever: isFever,
        needs_attention: isFever,
      });
    }

    // ==========================================
    // TODAY'S DOCTOR VISITS (30 Completed, 44 Pending)
    // 28 Completed among measured patients (e.g. Beds 1 to 28)
    // 2 Completed Emergency Visits among unmeasured patients (Beds 24 & 31 - let's pick Beds 49 & 50)
    // Beds 29 to 48 (20 patients): Measured today, Doctor visit PENDING -> "Ready for Examination"!
    // Beds 51 to 74 (24 patients): Unmeasured today, Doctor visit PENDING -> "Awaiting Temperature"!
    // ==========================================
    if (i <= 28) {
      doctorVisits.push({
        id: `dv-${i}-today`,
        patient_id: patient.id,
        visit_date: today,
        visited_at: `${today}T10:${String(15 + (i % 40)).padStart(2, '0')}:00Z`,
        doctor_id: 'user-doctor-01',
        doctor_name: 'Dr. Michael Chen, MD',
        clinical_observation:
          i === 7
            ? 'Patient apyrexial for 3 consecutive days. Lungs clear, vital signs stable. Candidate for discharge review.'
            : 'Routine examination completed. Patient stable and monitored.',
        is_emergency: false,
        approved_discharge: i === 8 || i === 15,
      });
    } else if (i === 49 || i === 50) {
      // 2 Emergency pre-temperature visits among unmeasured cohort
      doctorVisits.push({
        id: `dv-${i}-today-emergency`,
        patient_id: patient.id,
        visit_date: today,
        visited_at: `${today}T07:45:00Z`,
        doctor_id: 'user-doctor-01',
        doctor_name: 'Dr. Michael Chen, MD',
        clinical_observation:
          'Emergency triage visit prior to routine nursing rounds due to reported respiratory distress. Nebulizer started.',
        is_emergency: true,
        approved_discharge: false,
      });
    }
  }

  // ==========================================
  // HISTORICAL CLOSED CASES (20 Cases: 17 Cured, 3 Deceased)
  // Baseline Mortality = 3 / 20 = 15.0%
  // Baseline Survival = 17 / 20 = 85.0%
  // ==========================================
  const historicalClosedCases: HistoricalClosedCase[] = [
    { id: 'h-01', patient_name: 'Robert Miller', bed_number_historical: 'B-12', outcome: 'cured', admission_date: dayMinus4, closed_at: dayMinus1 },
    { id: 'h-02', patient_name: 'Grace Hopper', bed_number_historical: 'B-04', outcome: 'cured', admission_date: dayMinus4, closed_at: dayMinus1 },
    { id: 'h-03', patient_name: 'Arthur Dent', bed_number_historical: 'B-19', outcome: 'deceased', admission_date: dayMinus4, closed_at: dayMinus2 },
    { id: 'h-04', patient_name: 'Eleanor Vance', bed_number_historical: 'B-33', outcome: 'cured', admission_date: dayMinus4, closed_at: dayMinus1 },
    { id: 'h-05', patient_name: 'Samuel Clemens', bed_number_historical: 'B-21', outcome: 'cured', admission_date: dayMinus4, closed_at: dayMinus2 },
    { id: 'h-06', patient_name: 'Ada Lovelace', bed_number_historical: 'B-02', outcome: 'cured', admission_date: dayMinus4, closed_at: dayMinus1 },
    { id: 'h-07', patient_name: 'Alan Turing', bed_number_historical: 'B-55', outcome: 'cured', admission_date: dayMinus4, closed_at: dayMinus1 },
    { id: 'h-08', patient_name: 'Charles Babbage', bed_number_historical: 'B-60', outcome: 'deceased', admission_date: dayMinus4, closed_at: dayMinus2 },
    { id: 'h-09', patient_name: 'Margaret Hamilton', bed_number_historical: 'B-41', outcome: 'cured', admission_date: dayMinus4, closed_at: dayMinus1 },
    { id: 'h-10', patient_name: 'Claude Shannon', bed_number_historical: 'B-14', outcome: 'cured', admission_date: dayMinus4, closed_at: dayMinus2 },
    { id: 'h-11', patient_name: 'John von Neumann', bed_number_historical: 'B-28', outcome: 'cured', admission_date: dayMinus4, closed_at: dayMinus1 },
    { id: 'h-12', patient_name: 'Katherine Johnson', bed_number_historical: 'B-09', outcome: 'cured', admission_date: dayMinus4, closed_at: dayMinus1 },
    { id: 'h-13', patient_name: 'Dorothy Vaughan', bed_number_historical: 'B-17', outcome: 'cured', admission_date: dayMinus4, closed_at: dayMinus1 },
    { id: 'h-14', patient_name: 'Mary Jackson', bed_number_historical: 'B-26', outcome: 'cured', admission_date: dayMinus4, closed_at: dayMinus2 },
    { id: 'h-15', patient_name: 'George Boole', bed_number_historical: 'B-48', outcome: 'deceased', admission_date: dayMinus4, closed_at: dayMinus3 },
    { id: 'h-16', patient_name: 'Emmy Noether', bed_number_historical: 'B-38', outcome: 'cured', admission_date: dayMinus4, closed_at: dayMinus1 },
    { id: 'h-17', patient_name: 'Henrietta Leavitt', bed_number_historical: 'B-52', outcome: 'cured', admission_date: dayMinus4, closed_at: dayMinus1 },
    { id: 'h-18', patient_name: 'Marie Curie', bed_number_historical: 'B-64', outcome: 'cured', admission_date: dayMinus4, closed_at: dayMinus2 },
    { id: 'h-19', patient_name: 'Rosalind Franklin', bed_number_historical: 'B-70', outcome: 'cured', admission_date: dayMinus4, closed_at: dayMinus1 },
    { id: 'h-20', patient_name: 'Barbara McClintock', bed_number_historical: 'B-11', outcome: 'cured', admission_date: dayMinus4, closed_at: dayMinus1 },
  ];

  return {
    patients,
    temperatureRecords,
    doctorVisits,
    historicalClosedCases,
  };
}

