'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Patient,
  TemperatureRecord,
  DoctorVisit,
  HistoricalClosedCase,
  User,
  UserRole,
  FacilityMetrics,
} from '@/types';
import { DEMO_USERS, FACILITY_CONFIG } from '@/lib/constants';
import { getInitialSeedData } from '@/lib/seedData';
import {
  getFacilityTodayDate,
  calculateFacilityMetrics,
  check5PointDischargeEligibility,
} from '@/lib/clinicalCalculations';

interface StoreContextType {
  activeUser: User;
  switchUserRole: (role: UserRole) => void;
  patients: Patient[];
  temperatureRecords: TemperatureRecord[];
  doctorVisits: DoctorVisit[];
  historicalClosedCases: HistoricalClosedCase[];
  feverThreshold: number;
  setFeverThreshold: (val: number) => void;
  facilityDate: string;
  metrics: FacilityMetrics;
  getAvailableBeds: () => string[];
  resetData: () => void;

  // Actions
  recordTemperature: (input: {
    patientId: string;
    temperatureCelsius: number;
    isPrimary: boolean;
    readingType: 'routine_daily' | 'additional_check';
    additionalReason?: string;
  }) => { success: boolean; error?: string; invalidatedDischarge?: boolean };

  recordDoctorVisit: (input: {
    patientId: string;
    clinicalObservation: string;
    treatmentNotes?: string;
    isEmergency?: boolean;
    approveDischarge?: boolean;
  }) => { success: boolean; error?: string };

  approveDischarge: (patientId: string) => { success: boolean; error?: string };

  processAdminDischarge: (patientId: string) => { success: boolean; error?: string };

  registerNewPatient: (input: {
    fullName: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    bedNumber: string;
    admissionNotes?: string;
  }) => { success: boolean; error?: string };
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'quarantinecare_mvp_v2_store';

export function StoreProvider({ children }: { children: ReactNode }) {
  const [activeUser, setActiveUser] = useState<User>(DEMO_USERS.nurse);
  const [feverThreshold, setFeverThreshold] = useState<number>(FACILITY_CONFIG.fever_threshold_celsius);
  const [facilityDate] = useState<string>(getFacilityTodayDate());

  const [patients, setPatients] = useState<Patient[]>([]);
  const [temperatureRecords, setTemperatureRecords] = useState<TemperatureRecord[]>([]);
  const [doctorVisits, setDoctorVisits] = useState<DoctorVisit[]>([]);
  const [historicalClosedCases, setHistoricalClosedCases] = useState<HistoricalClosedCase[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from localStorage or Seed Data
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPatients(parsed.patients || []);
        setTemperatureRecords(parsed.temperatureRecords || []);
        setDoctorVisits(parsed.doctorVisits || []);
        setHistoricalClosedCases(parsed.historicalClosedCases || []);
        if (parsed.feverThreshold) setFeverThreshold(parsed.feverThreshold);
      } else {
        const seed = getInitialSeedData();
        setPatients(seed.patients);
        setTemperatureRecords(seed.temperatureRecords);
        setDoctorVisits(seed.doctorVisits);
        setHistoricalClosedCases(seed.historicalClosedCases);
      }
    } catch {
      const seed = getInitialSeedData();
      setPatients(seed.patients);
      setTemperatureRecords(seed.temperatureRecords);
      setDoctorVisits(seed.doctorVisits);
      setHistoricalClosedCases(seed.historicalClosedCases);
    }
    setIsLoaded(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          patients,
          temperatureRecords,
          doctorVisits,
          historicalClosedCases,
          feverThreshold,
        })
      );
    } catch {
      // ignore storage quota issues
    }
  }, [patients, temperatureRecords, doctorVisits, historicalClosedCases, feverThreshold, isLoaded]);

  const switchUserRole = (role: UserRole) => {
    if (DEMO_USERS[role]) {
      setActiveUser(DEMO_USERS[role]);
    }
  };

  const resetData = () => {
    const seed = getInitialSeedData();
    setPatients(seed.patients);
    setTemperatureRecords(seed.temperatureRecords);
    setDoctorVisits(seed.doctorVisits);
    setHistoricalClosedCases(seed.historicalClosedCases);
    setFeverThreshold(FACILITY_CONFIG.fever_threshold_celsius);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  // Derived available beds
  const getAvailableBeds = (): string[] => {
    const occupiedBedSet = new Set(
      patients
        .filter((p) => p.lifecycle_status === 'admitted' || p.lifecycle_status === 'discharge_approved')
        .map((p) => p.bed_number)
    );

    const available: string[] = [];
    for (let i = 1; i <= FACILITY_CONFIG.total_beds; i++) {
      const bedNum = `B-${String(i).padStart(2, '0')}`;
      if (!occupiedBedSet.has(bedNum)) {
        available.push(bedNum);
      }
    }
    return available;
  };

  // 1. RECORD TEMPERATURE
  const recordTemperature = (input: {
    patientId: string;
    temperatureCelsius: number;
    isPrimary: boolean;
    readingType: 'routine_daily' | 'additional_check';
    additionalReason?: string;
  }) => {
    const patient = patients.find((p) => p.id === input.patientId);
    if (!patient) return { success: false, error: 'Patient not found' };

    // Prevent duplicate primary reading on the same date
    if (input.isPrimary) {
      const existingPrimary = temperatureRecords.find(
        (r) => r.patient_id === input.patientId && r.recorded_date === facilityDate && r.is_primary
      );
      if (existingPrimary) {
        return {
          success: false,
          error: `Primary reading for today already recorded at ${new Date(existingPrimary.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${existingPrimary.temperature_celsius}°C). Additional readings require clinical justification.`,
        };
      }
    } else {
      if (!input.additionalReason || input.additionalReason.trim().length === 0) {
        return { success: false, error: 'Clinical reason is required for additional temperature checks.' };
      }
    }

    const isFever = input.temperatureCelsius >= feverThreshold;
    const newRecord: TemperatureRecord = {
      id: `tr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      patient_id: input.patientId,
      recorded_date: facilityDate,
      recorded_at: new Date().toISOString(),
      temperature_celsius: input.temperatureCelsius,
      is_primary: input.isPrimary,
      reading_type: input.readingType,
      additional_reason: input.additionalReason,
      nurse_id: activeUser.id,
      nurse_name: activeUser.name,
      is_fever: isFever,
      needs_attention: input.temperatureCelsius >= 39.5,
    };

    // Check if fever invalidates pending discharge approval
    let invalidatedDischarge = false;
    let updatedPatients = [...patients];

    if (isFever && patient.lifecycle_status === 'discharge_approved') {
      invalidatedDischarge = true;
      updatedPatients = updatedPatients.map((p) => {
        if (p.id === input.patientId) {
          return {
            ...p,
            lifecycle_status: 'admitted' as const,
            discharge_review_flag: 'requires_doctor_rereview' as const,
            discharge_approved_at: null,
            discharge_approved_by: null,
          };
        }
        return p;
      });
    }

    setTemperatureRecords((prev) => [...prev, newRecord]);
    setPatients(updatedPatients);

    return { success: true, invalidatedDischarge };
  };

  // 2. RECORD DOCTOR VISIT
  const recordDoctorVisit = (input: {
    patientId: string;
    clinicalObservation: string;
    treatmentNotes?: string;
    isEmergency?: boolean;
    approveDischarge?: boolean;
  }) => {
    const patient = patients.find((p) => p.id === input.patientId);
    if (!patient) return { success: false, error: 'Patient not found' };

    const newVisit: DoctorVisit = {
      id: `dv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      patient_id: input.patientId,
      visit_date: facilityDate,
      visited_at: new Date().toISOString(),
      doctor_id: activeUser.id,
      doctor_name: activeUser.name,
      clinical_observation: input.clinicalObservation,
      treatment_notes: input.treatmentNotes,
      is_emergency: input.isEmergency ?? false,
      approved_discharge: input.approveDischarge ?? false,
    };

    // Replace or add today's visit
    setDoctorVisits((prev) => {
      const filtered = prev.filter(
        (v) => !(v.patient_id === input.patientId && v.visit_date === facilityDate)
      );
      return [...filtered, newVisit];
    });

    // If approving discharge, validate and update patient
    if (input.approveDischarge) {
      const allVisitsWithNew = [
        ...doctorVisits.filter((v) => !(v.patient_id === input.patientId && v.visit_date === facilityDate)),
        newVisit,
      ];
      const check = check5PointDischargeEligibility(
        patient,
        temperatureRecords,
        allVisitsWithNew,
        feverThreshold,
        facilityDate
      );

      if (!check.eligible) {
        return {
          success: false,
          error: `Discharge criteria not met: ${check.failedReasons.join(', ')}`,
        };
      }

      setPatients((prev) =>
        prev.map((p) => {
          if (p.id === input.patientId) {
            return {
              ...p,
              lifecycle_status: 'discharge_approved',
              discharge_review_flag: 'normal',
              discharge_approved_at: new Date().toISOString(),
              discharge_approved_by: activeUser.name,
            };
          }
          return p;
        })
      );
    }

    return { success: true };
  };

  // 3. APPROVE DISCHARGE (DIRECT ACTION)
  const approveDischarge = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) return { success: false, error: 'Patient not found' };

    const check = check5PointDischargeEligibility(
      patient,
      temperatureRecords,
      doctorVisits,
      feverThreshold,
      facilityDate
    );

    if (!check.eligible) {
      return {
        success: false,
        error: `Cannot approve discharge: ${check.failedReasons.join('; ')}`,
      };
    }

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            lifecycle_status: 'discharge_approved',
            discharge_review_flag: 'normal',
            discharge_approved_at: new Date().toISOString(),
            discharge_approved_by: activeUser.name,
          };
        }
        return p;
      })
    );

    return { success: true };
  };

  // 4. PROCESS ADMIN DISCHARGE & BED RELEASE
  const processAdminDischarge = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) return { success: false, error: 'Patient not found' };

    if (patient.lifecycle_status !== 'discharge_approved') {
      return {
        success: false,
        error: 'Patient must be approved by an attending physician prior to administrative discharge.',
      };
    }

    // Defensive revalidation: ensure no active fever today
    const check = check5PointDischargeEligibility(
      { ...patient, lifecycle_status: 'admitted' },
      temperatureRecords,
      doctorVisits,
      feverThreshold,
      facilityDate
    );

    if (!check.eligible) {
      return {
        success: false,
        error: `Discharge blocked upon re-validation: ${check.failedReasons.join('; ')}`,
      };
    }

    // Atomically complete discharge and free the bed
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            lifecycle_status: 'discharged',
            final_outcome: 'cured',
            discharged_at: new Date().toISOString(),
            discharged_by: activeUser.name,
            outcome_recorded_at: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    return { success: true };
  };

  // 5. REGISTER NEW PATIENT & ASSIGN BED
  const registerNewPatient = (input: {
    fullName: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    bedNumber: string;
    admissionNotes?: string;
  }) => {
    const activePatients = patients.filter(
      (p) => p.lifecycle_status === 'admitted' || p.lifecycle_status === 'discharge_approved'
    );

    if (activePatients.length >= FACILITY_CONFIG.total_beds) {
      return {
        success: false,
        error: `Facility is at maximum capacity (74/74 beds occupied). Discharge an approved patient to free a bed.`,
      };
    }

    // Verify bed is available
    const isBedOccupied = activePatients.some((p) => p.bed_number === input.bedNumber);
    if (isBedOccupied) {
      return {
        success: false,
        error: `Bed ${input.bedNumber} is currently occupied. Please select an available bed.`,
      };
    }

    const nextIdNum = patients.length + 1;
    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      display_id: `QC-2026-${String(nextIdNum).padStart(4, '0')}`,
      full_name: input.fullName,
      age: input.age,
      gender: input.gender,
      bed_number: input.bedNumber,
      lifecycle_status: 'admitted',
      discharge_review_flag: 'normal',
      discharge_approved_at: null,
      discharge_approved_by: null,
      discharged_at: null,
      discharged_by: null,
      final_outcome: null,
      outcome_recorded_at: null,
      admission_date: facilityDate,
      admission_notes: input.admissionNotes || `Newly admitted. Assigned to ${input.bedNumber}.`,
    };

    setPatients((prev) => [...prev, newPatient]);
    return { success: true };
  };

  const metrics = calculateFacilityMetrics(
    patients,
    temperatureRecords,
    doctorVisits,
    historicalClosedCases,
    FACILITY_CONFIG.total_beds,
    facilityDate
  );

  return (
    <StoreContext.Provider
      value={{
        activeUser,
        switchUserRole,
        patients,
        temperatureRecords,
        doctorVisits,
        historicalClosedCases,
        feverThreshold,
        setFeverThreshold,
        facilityDate,
        metrics,
        getAvailableBeds,
        resetData,
        recordTemperature,
        recordDoctorVisit,
        approveDischarge,
        processAdminDischarge,
        registerNewPatient,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextType {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}

