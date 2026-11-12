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
import { PatientDossierDrawer } from './PatientDossierDrawer';
import {
  Stethoscope,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export function DoctorDashboard() {
  const { patients, temperatureRecords, doctorVisits, facilityDate, feverThreshold } = useStore();

  // Primary Actionable Focus: Default to "Ready for Examination"!
  const [filterTab, setFilterTab] = useState<'ready' | 'rereview' | 'awaiting' | 'completed' | 'all'>('ready');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const activePatients = patients.filter(
    (p) => p.lifecycle_status === 'admitted' || p.lifecycle_status === 'discharge_approved'
  );

  // Re-review patients (discharges invalidated by fever)
  const reReviewPatients = activePatients.filter(
    (p) => p.discharge_review_flag === 'requires_doctor_rereview'
  );

  // Ready for examination: temp completed today, doctor visit pending
  const readyPatients = activePatients.filter((p) => {
    const tempStatus = getDailyTemperatureStatus(p.id, temperatureRecords, facilityDate);
    const visitStatus = getDailyDoctorVisitStatus(p.id, doctorVisits, facilityDate);
    return tempStatus === 'completed' && visitStatus.status === 'pending';
  });

  // Awaiting temperature: temp pending today, doctor visit pending
  const awaitingTempPatients = activePatients.filter((p) => {
    const tempStatus = getDailyTemperatureStatus(p.id, temperatureRecords, facilityDate);
    const visitStatus = getDailyDoctorVisitStatus(p.id, doctorVisits, facilityDate);
    return tempStatus === 'pending' && visitStatus.status === 'pending';
  });

  // Completed today
  const completedTodayPatients = activePatients.filter((p) => {
    const visitStatus = getDailyDoctorVisitStatus(p.id, doctorVisits, facilityDate);
    return visitStatus.status === 'completed';
  });

  // Filter patients based on tab & search
  const filteredPatients = activePatients.filter((p) => {
    const tempStatus = getDailyTemperatureStatus(p.id, temperatureRecords, facilityDate);
    const visitStatus = getDailyDoctorVisitStatus(p.id, doctorVisits, facilityDate);

    if (filterTab === 'ready') {
      if (!(tempStatus === 'completed' && visitStatus.status === 'pending')) return false;
    } else if (filterTab === 'rereview') {
      if (p.discharge_review_flag !== 'requires_doctor_rereview') return false;
    } else if (filterTab === 'awaiting') {
      if (!(tempStatus === 'pending' && visitStatus.status === 'pending')) return false;
    } else if (filterTab === 'completed') {
      if (visitStatus.status !== 'completed') return false;
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchBed = p.bed_number.toLowerCase().includes(q);
      const matchName = p.full_name.toLowerCase().includes(q);
      return matchBed || matchName;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Doctor Clinical Rounds</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Coordinated Workflow
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visual focus: Patients with completed morning temperatures are prepared for clinical evaluation. No wasted time measuring unready patients.
          </p>
        </div>

        {/* Doctor Rounds Counters */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-lg bg-blue-50 border border-blue-200 text-right">
            <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Ready for Exam</div>
            <div className="text-lg font-bold text-blue-900">{readyPatients.length} Patients</div>
          </div>
          <div className="px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-right">
            <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Examined Today</div>
            <div className="text-lg font-bold text-emerald-900">{completedTodayPatients.length} Patients</div>
          </div>
        </div>
      </div>

      {/* High-Priority Re-Review Alert Banner (Requirement 8) */}
      {reReviewPatients.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 shadow-sm flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-rose-900">
                Action Required: {reReviewPatients.length} Discharge(s) Invalidated by Fever Spike
              </div>
              <p className="text-xs text-rose-700 mt-0.5">
                The attending physician must re-evaluate patients whose discharge approvals were automatically revoked due to fever.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterTab('rereview')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shrink-0 shadow-sm"
          >
            Review Flagged Patients
          </button>
        </div>
      )}

      {/* Queue Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 overflow-x-auto">
          {/* Tab 1: Ready for Exam (Primary Focus) */}
          <button
            onClick={() => setFilterTab('ready')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterTab === 'ready'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Ready for Exam</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
              {readyPatients.length}
            </span>
          </button>

          {/* Tab: Re-Review (if any) */}
          {reReviewPatients.length > 0 && (
            <button
              onClick={() => setFilterTab('rereview')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                filterTab === 'rereview'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-700 bg-rose-100 hover:bg-rose-200'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Requires Re-Review ({reReviewPatients.length})</span>
            </button>
          )}

          {/* Tab 2: Awaiting Temperature */}
          <button
            onClick={() => setFilterTab('awaiting')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterTab === 'awaiting'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Awaiting Temp</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
              {awaitingTempPatients.length}
            </span>
          </button>

          {/* Tab 3: Completed Today */}
          <button
            onClick={() => setFilterTab('completed')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterTab === 'completed'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
            <span>Completed Today</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
              {completedTodayPatients.length}
            </span>
          </button>

          {/* Tab 4: All Admitted */}
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterTab === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>All ({activePatients.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bed (B-01) or name..."
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      {/* Main Doctor Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Bed #</th>
                <th className="py-3 px-4">Patient Information</th>
                <th className="py-3 px-4">Today&apos;s Temp</th>
                <th className="py-3 px-4">Fever-Free Streak</th>
                <th className="py-3 px-4">Doctor Visit Status</th>
                <th className="py-3 px-4 text-right">Clinical Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-600">No patients in this queue</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {filterTab === 'ready'
                        ? 'All ready patients have been evaluated by attending physicians!'
                        : 'Try selecting another queue tab above.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => {
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
                  const streakResult = calculateFeverFreeStreak(
                    patient.id,
                    temperatureRecords,
                    patient.admission_date,
                    feverThreshold,
                    facilityDate
                  );

                  const todayRecord = streakResult.todayPrimaryReading;

                  return (
                    <tr
                      key={patient.id}
                      className={`hover:bg-slate-50/80 transition-colors group ${
                        patient.discharge_review_flag === 'requires_doctor_rereview'
                          ? 'bg-rose-50/30'
                          : ''
                      }`}
                    >
                      {/* Bed # */}
                      <td className="py-3.5 px-4 font-mono font-bold text-sm text-slate-900">
                        <span className="inline-block px-2.5 py-1 rounded bg-slate-100 border border-slate-300 group-hover:border-blue-300 group-hover:bg-blue-50 transition-colors">
                          {patient.bed_number}
                        </span>
                      </td>

                      {/* Patient Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-xs">
                            {patient.full_name}
                          </span>
                          {patient.lifecycle_status === 'discharge_approved' && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              Approved
                            </span>
                          )}
                          {patient.discharge_review_flag === 'requires_doctor_rereview' && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-0.5">
                              <AlertCircle className="w-3 h-3 text-rose-600" /> Re-Review
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {patient.display_id} • Age {patient.age} • Admitted {patient.admission_date}
                        </div>
                      </td>

                      {/* Today's Temp */}
                      <td className="py-3.5 px-4">
                        {todayRecord ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                                todayRecord.is_fever
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {todayRecord.temperature_celsius}°C
                            </span>
                            {todayRecord.is_fever && (
                              <span className="text-[10px] font-semibold text-rose-600">Fever</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-amber-600 text-xs font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Pending Nurse
                          </span>
                        )}
                      </td>

                      {/* Streak */}
                      <td className="py-3.5 px-4">
                        <StreakBadge
                          streakDays={streakResult.streakDays}
                          isEligible={streakResult.isEligibleForDischargeApproval}
                        />
                      </td>

                      {/* Doctor Visit Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge
                          status={visitStatus.status === 'completed' ? 'completed' : 'pending'}
                          label={
                            visitStatus.status === 'completed'
                              ? visitStatus.isEmergency
                                ? 'Examined (Emergency)'
                                : 'Examined Today'
                              : 'Pending Visit'
                          }
                        />
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedPatient(patient)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-blue-600 shadow-sm transition-all active:scale-95"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span>Examine Dossier</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Clinical Dossier Drawer */}
      {selectedPatient && (
        <PatientDossierDrawer
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}
    </div>
  );
}

