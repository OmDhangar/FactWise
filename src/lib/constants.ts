import { FacilityConfig, User } from '@/types';

export const FACILITY_CONFIG: FacilityConfig = {
  total_beds: 74,
  fever_threshold_celsius: 37.8, // Configurable clinical threshold assumption
  extreme_high_threshold: 42.0,
  extreme_low_threshold: 34.0,
  facility_timezone: 'Asia/Kolkata',
};

export const DEMO_USERS: Record<string, User> = {
  nurse: {
    id: 'user-nurse-01',
    name: 'Nurse Sarah Jenkins',
    role: 'nurse',
    title: 'Staff Triage Nurse',
    department: 'Quarantine Ward East',
  },
  doctor: {
    id: 'user-doctor-01',
    name: 'Dr. Michael Chen, MD',
    role: 'doctor',
    title: 'Attending Infectious Disease Physician',
    department: 'Clinical Treatment Wing',
  },
  admin: {
    id: 'user-admin-01',
    name: 'Elena Rostova',
    role: 'admin',
    title: 'Admissions & Patient Operations Lead',
    department: 'Hospital Administration',
  },
  head_doctor: {
    id: 'user-head-01',
    name: 'Dr. Alistair Vance, MD, PhD',
    role: 'head_doctor',
    title: 'Head of Quarantine Facility & Clinical Director',
    department: 'Facility Directorate',
  },
};

