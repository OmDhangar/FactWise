'use client';

import React, { useState } from 'react';
import { Patient } from '@/types';
import { useStore } from '@/context/StoreContext';
import {
  calculateFeverFreeStreak,
  getDailyTemperatureStatus,
  getDailyDoctorVisitStatus,
  check5PointDischargeEligibility,
} from '@/lib/clinicalCalculations';
import { StreakBadge } from '@/components/common/StreakBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  X,
  Stethoscope,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface PatientDossierDrawerProps {
  patient: Patient | null;
  onClose: () => void;
}

export function PatientDossierDrawer({ patient, onClose }: PatientDossierDrawerProps) {
  const {
    activeUser,
    facilityDate,
    feverThreshold,
    temperatureRecords,
    doctorVisits,
    recordDoctorVisit,
    approveDischarge,
  } = useStore();

  if (!patient) return null;

  const streakResult = calculateFeverFreeStreak(
    patient.id,
    temperatureRecords,
    patient.admission_date,
    feverThreshold,
    facilityDate
  );

  const tempStatus = getDailyTemperatureStatus(patient.id, temperatureRecords, facilityDate);
  const visitStatus = getDailyDoctorVisitStatus(patient.id, doctorVisits, facilityDate);

  const dischargeCheck = check5PointDischargeEligibility(
    patient,
    temperatureRecords,
    doctorVisits,
    feverThreshold,
    facilityDate
  );

  // Form states
  const [observation, setObservation] = useState<string>(
    visitStatus.visit?.clinical_observation || ''
  );
  const [isEmergency, setIsEmergency] = useState<boolean>(visitStatus.isEmergency);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Get patient's temperature history sorted chronologically desc
  const patientTempRecords = temperatureRecords
    .filter((r) => r.patient_id === patient.id)
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));

  // Handle Complete Examination
  const handleCompleteVisit = (shouldApproveDischarge: boolean = false) => {
    setErrorMessage(null);

    if (!observation || observation.trim().length === 0) {
      setErrorMessage('Please enter clinical observation notes for this visit.');
      return;
    }

    const res = recordDoctorVisit({
      patientId: patient.id,
      clinicalObservation: observation,
      isEmergency,
      approveDischarge: shouldApproveDischarge,
    });

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to complete visit.');
      return;
    }

    if (shouldApproveDischarge) {
      setSuccessToast(
        `Discharge approved by ${activeUser.name}! Patient routed to Admin Discharge Queue.`
      );
    } else {
      setSuccessToast(`Daily examination completed successfully by ${activeUser.name}.`);
    }

    setTimeout(() => {
      onClose();
    }, 900);
  };

  // Handle direct Approve Discharge
  const handleApproveDischargeDirect = () => {
    setErrorMessage(null);

    const res = approveDischarge(patient.id);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to approve discharge.');
      return;
    }

    setSuccessToast(
      `Discharge approved by ${activeUser.name}! Patient routed to Admin Discharge Queue.`
    );
    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-end animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{patient.full_name}</h2>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-slate-200 text-slate-800">
                  {patient.bed_number}
                </span>
                <StatusBadge status={patient.lifecycle_status} />
              </div>
              <p className="text-xs text-slate-500">
                {patient.display_id} • Age {patient.age} • {patient.gender} • Admitted {patient.admission_date}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Re-Review Alert if previous discharge invalidated */}
          {patient.discharge_review_flag === 'requires_doctor_rereview' && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-700">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>Discharge Invalidated: Clinical Re-Review Required</span>
              </div>
              <p className="mt-1 text-rose-800">
                This patient recorded a temperature spike after initial discharge approval.
                The pending discharge was automatically revoked. A new 3-day fever-free streak is required.
              </p>
            </div>
          )}

          {/* Clinical Status Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Fever-Free Streak</div>
              <div className="mt-1">
                <StreakBadge
                  streakDays={streakResult.streakDays}
                  isEligible={streakResult.isEligibleForDischargeApproval}
                />
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Today&apos;s Temperature</div>
              <div className="mt-1 flex items-center gap-1.5">
                <StatusBadge
                  status={tempStatus === 'completed' ? 'completed' : 'pending'}
                  label={tempStatus === 'completed' ? 'Measured' : 'Pending Nurse'}
                />
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Doctor Visit Today</div>
              <div className="mt-1 flex items-center gap-1.5">
                <StatusBadge
                  status={visitStatus.status === 'completed' ? 'completed' : 'pending'}
                  label={
                    visitStatus.status === 'completed'
                      ? visitStatus.isEmergency
                        ? 'Examined (Emergency)'
                        : 'Examined Today'
                      : 'Pending Exam'
                  }
                />
              </div>
            </div>
          </div>

          {/* Notice if unmeasured today */}
          {tempStatus === 'pending' && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Morning nurse temperature measurement is pending.</strong>
                <p className="mt-0.5 text-amber-800">
                  You can still conduct an emergency consultation before the temperature is recorded.
                  The visit will remain marked as completed when the nurse logs the temperature later.
                </p>
              </div>
            </div>
          )}

          {/* Discharge Eligibility Clearance Banner */}
          {patient.lifecycle_status === 'admitted' && (
            <>
              {dischargeCheck.eligible ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>3-Day Fever-Free Criteria Met: Eligible for Discharge</span>
                  </div>
                  <p className="text-emerald-700">
                    Patient has completed 3 consecutive qualifying fever-free days with today&apos;s temperature and doctor visit validated.
                  </p>
                  <button
                    onClick={handleApproveDischargeDirect}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Discharge & Route to Admin</span>
                  </button>
                </div>
              ) : streakResult.isEligibleForDischargeApproval && !dischargeCheck.eligible ? (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                  <div className="font-semibold text-blue-800">
                    3-Day Streak Reached ({streakResult.streakDays} Days)
                  </div>
                  <div className="text-[11px] text-blue-700 mt-0.5">
                    To approve discharge: {dischargeCheck.failedReasons.join('; ')}
                  </div>
                </div>
              ) : null}
            </>
          )}

          {/* Already Approved Notice */}
          {patient.lifecycle_status === 'discharge_approved' && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-300 text-blue-900 text-xs flex items-center justify-between">
              <div>
                <strong className="text-blue-900">Approved for Discharge</strong>
                <p className="text-[11px] text-blue-700">
                  Approved by {patient.discharge_approved_by} at{' '}
                  {patient.discharge_approved_at
                    ? new Date(patient.discharge_approved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '--'}. Currently queued in Hospital Administration.
                </p>
              </div>
              <StatusBadge status="discharge_approved" />
            </div>
          )}

          {/* Doctor Examination Form */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Daily Clinical Examination</span>
              </h3>
              {visitStatus.status === 'completed' && (
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Examined Today by {visitStatus.visit?.doctor_name}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Observation & Findings <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Enter patient vitals, lung auscultation, febrile symptoms, and general clinical status..."
                className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {tempStatus === 'pending' && (
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEmergency}
                  onChange={(e) => setIsEmergency(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Flag as pre-temperature Emergency Examination</span>
              </label>
            )}

            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successToast && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successToast}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCompleteVisit(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Daily Examination</span>
              </button>

              {streakResult.streakDays >= 3 && patient.lifecycle_status === 'admitted' && (
                <button
                  type="button"
                  onClick={() => handleCompleteVisit(true)}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Save & Approve Discharge</span>
                </button>
              )}
            </div>
          </div>

          {/* Chronological Temperature History Dossier */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-blue-600" />
              <span>Chronological Temperature Dossier</span>
            </h3>

            {patientTempRecords.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No temperature records recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
                {patientTempRecords.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{r.recorded_date}</span>
                        <span className="text-slate-400">
                          {new Date(r.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                          r.is_fever
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {r.temperature_celsius}°C
                      </span>
                      {r.is_primary ? (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          Primary
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          Check: {r.additional_reason || 'Additional'}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Logged by <span className="text-slate-600 font-medium">{r.nurse_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

