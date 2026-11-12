'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { Patient } from '@/types';
import {
  getDailyTemperatureStatus,
  getDailyDoctorVisitStatus,
  calculateFeverFreeStreak,
} from '@/lib/clinicalCalculations';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StreakBadge } from '@/components/common/StreakBadge';
import { RegistrationModal } from './RegistrationModal';
import {
  Building2,
  Bed,
  UserPlus,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  LogOut,
  Clock,
  Search,
} from 'lucide-react';

export function AdminDashboard() {
  const {
    patients,
    temperatureRecords,
    doctorVisits,
    facilityDate,
    feverThreshold,
    metrics,
    processAdminDischarge,
    getAvailableBeds,
  } = useStore();

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const availableBeds = getAvailableBeds();
  const isFull = availableBeds.length === 0;

  // Active admitted & approved patients
  const activePatients = patients.filter(
    (p) => p.lifecycle_status === 'admitted' || p.lifecycle_status === 'discharge_approved'
  );

  // Focus: Doctor-Approved Discharge Queue (Requirement 8)
  const dischargeApprovedPatients = activePatients.filter(
    (p) => p.lifecycle_status === 'discharge_approved'
  );

  // Handle discharge
  const handleProcessDischarge = (patient: Patient) => {
    const confirmDischarge = window.confirm(
      `Confirm discharge processing for ${patient.full_name} (${patient.bed_number})?\n\nThis will record final outcome as CURED, log departure timestamp, and release Bed ${patient.bed_number} to Available for new admissions.`
    );

    if (!confirmDischarge) return;

    const res = processAdminDischarge(patient.id);
    if (!res.success) {
      alert(`Discharge Failed: ${res.error}`);
      return;
    }

    setActionMessage(
      `Discharge complete for ${patient.full_name}. Bed ${patient.bed_number} has been released and is now Available for intake!`
    );
    setTimeout(() => {
      setActionMessage(null);
    }, 4500);
  };

  // Filter active table
  const filteredActivePatients = activePatients.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.bed_number.toLowerCase().includes(q) ||
      p.full_name.toLowerCase().includes(q) ||
      p.display_id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Hospital Administration & Bed Management</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Operations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visual focus: Process doctor-approved discharges promptly to release blocked beds and admit arriving cases.
          </p>
        </div>

        {/* Capacity Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRegisterOpen(true)}
            disabled={isFull}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Register New Patient</span>
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-medium flex items-center gap-3 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Occupancy Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Bed Capacity</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">74 Beds</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Fixed facility isolation units (B-01 to B-74)</p>
        </div>

        <div
          className={`p-4 rounded-xl border shadow-sm ${
            isFull ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Occupied Beds</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {metrics.occupied_beds} <span className="text-sm font-normal text-slate-500">/ 74</span>
          </div>
          <p className={`text-[11px] mt-0.5 font-medium ${isFull ? 'text-amber-800' : 'text-slate-500'}`}>
            {isFull ? '100% capacity - All beds occupied' : `${metrics.occupied_beds} active quarantine cases`}
          </p>
        </div>

        <div
          className={`p-4 rounded-xl border shadow-sm ${
            isFull ? 'bg-slate-50 border-slate-200' : 'bg-emerald-50 border-emerald-200'
          }`}
        >
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Beds</div>
          <div
            className={`text-2xl font-bold mt-1 ${isFull ? 'text-slate-400' : 'text-emerald-700'}`}
          >
            {metrics.available_beds}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isFull
              ? 'Zero available - Discharge required to admit'
              : `Beds available for new admissions: ${availableBeds.join(', ')}`}
          </p>
        </div>
      </div>

      {/* PRIMARY ACTIONABLE FOCUS (Requirement 8): Doctor-Approved Discharge Queue */}
      <div className="bg-white rounded-xl border-2 border-blue-200 shadow-md overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Doctor-Approved Discharge Queue</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                  {dischargeApprovedPatients.length} Approved
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Patients who completed 3-day fever-free criteria and have received clinical sign-off from attending doctors.
              </p>
            </div>
          </div>

          <span className="text-[11px] text-slate-500 bg-white px-2.5 py-1 rounded border border-blue-200 shrink-0">
            Clicking completes discharge & frees the bed
          </span>
        </div>

        {dischargeApprovedPatients.length === 0 ? (
          <div className="py-10 text-center text-slate-400 bg-white">
            <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-medium text-slate-600">No patients awaiting administrative discharge</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              When an attending doctor clears an eligible patient, they will immediately appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {dischargeApprovedPatients.map((patient) => {
              const streakResult = calculateFeverFreeStreak(
                patient.id,
                temperatureRecords,
                patient.admission_date,
                feverThreshold,
                facilityDate
              );

              return (
                <div
                  key={patient.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-300 flex flex-col items-center justify-center font-mono font-bold text-blue-900 shrink-0">
                      <span className="text-[10px] text-blue-600 uppercase font-sans">BED</span>
                      <span className="text-sm leading-none">{patient.bed_number}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{patient.full_name}</span>
                        <StatusBadge status="discharge_approved" />
                        <StreakBadge streakDays={streakResult.streakDays} isEligible={true} />
                      </div>

                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>ID: {patient.display_id}</span>
                        <span>Age: {patient.age}</span>
                        <span>Admitted: {patient.admission_date}</span>
                        <span className="text-blue-700 font-medium">
                          Approved by: {patient.discharge_approved_by || 'Dr. Michael Chen, MD'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleProcessDischarge(patient)}
                      className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Process Discharge & Release Bed</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Inpatients Registry */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Current Inpatient Census ({activePatients.length})</h2>
            <p className="text-xs text-slate-500">Live roster of patients currently occupying quarantine beds</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bed or name..."
              className="w-full h-9 pl-9 pr-4 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Bed #</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Admission Date</th>
                <th className="py-3 px-4">Lifecycle Status</th>
                <th className="py-3 px-4">Daily Temperature</th>
                <th className="py-3 px-4">Doctor Visit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredActivePatients.map((patient) => {
                const tempStatus = getDailyTemperatureStatus(
                  patient.id,
                  temperatureRecords,
                  facilityDate
                );
                const visitStatus = getDailyDoctorVisitStatus(
                  patient.id,
                  doctorVisits,
                  facilityDate
                );

                return (
                  <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {patient.bed_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{patient.full_name}</div>
                      <div className="text-[11px] text-slate-400">{patient.display_id}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{patient.admission_date}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={patient.lifecycle_status} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        status={tempStatus === 'completed' ? 'completed' : 'pending'}
                        label={tempStatus === 'completed' ? 'Measured' : 'Pending'}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        status={visitStatus.status === 'completed' ? 'completed' : 'pending'}
                        label={visitStatus.status === 'completed' ? 'Examined' : 'Pending'}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal */}
      {isRegisterOpen && <RegistrationModal onClose={() => setIsRegisterOpen(false)} />}
    </div>
  );
}

