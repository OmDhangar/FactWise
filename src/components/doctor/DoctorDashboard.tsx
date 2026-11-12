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
  AlertCircle,
  AlertTriangle,
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
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">Doctor Clinical Rounds</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Coordinated Workflow
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Patients with completed morning temperatures are prepared for evaluation. No wasted visits.
          </p>
        </div>

        {/* Doctor Rounds Counters */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
          <div className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-center sm:text-right">
            <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Ready for Exam</div>
            <div className="text-xl font-extrabold text-blue-900 font-mono">{readyPatients.length}</div>
          </div>
          <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-center sm:text-right">
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Examined Today</div>
            <div className="text-xl font-extrabold text-emerald-900 font-mono">{completedTodayPatients.length}</div>
          </div>
        </div>
      </div>

      {/* High-Priority Re-Review Alert Banner */}
      {reReviewPatients.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-rose-50 border border-rose-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-rose-900">
                Action Required: {reReviewPatients.length} Discharge(s) Invalidated by Fever Spike
              </div>
              <p className="text-[11px] text-rose-700">
                Attending doctor re-evaluation required. Streak reset to 0.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterTab('rereview')}
            className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shrink-0 shadow-sm"
          >
            Review Flagged Patients
          </button>
        </div>
      )}

      {/* Queue Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl border border-slate-300 overflow-x-auto">
          {/* Tab 1: Ready for Exam (Primary Focus) */}
          <button
            onClick={() => setFilterTab('ready')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterTab === 'ready'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Ready ({readyPatients.length})</span>
          </button>

          {/* Tab: Re-Review (if any) */}
          {reReviewPatients.length > 0 && (
            <button
              onClick={() => setFilterTab('rereview')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                filterTab === 'rereview'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-700 bg-rose-100 hover:bg-rose-200'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Re-Review ({reReviewPatients.length})</span>
            </button>
          )}

          {/* Tab 2: Awaiting Temperature */}
          <button
            onClick={() => setFilterTab('awaiting')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterTab === 'awaiting'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Awaiting Temp ({awaitingTempPatients.length})</span>
          </button>

          {/* Tab 3: Completed Today */}
          <button
            onClick={() => setFilterTab('completed')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterTab === 'completed'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
            <span>Done ({completedTodayPatients.length})</span>
          </button>

          {/* Tab 4: All Admitted */}
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
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
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      {/* MOBILE CARD VIEW: Visible on Mobile screens (< md) */}
      <div className="block md:hidden space-y-3">
        {filteredPatients.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-400 border border-slate-200">
            <CheckCircle2 className="w-8 h-8 mx-auto text-blue-500 mb-2" />
            <p className="text-sm font-bold text-slate-700">No patients in this queue</p>
            <p className="text-xs text-slate-400 mt-1">Select another queue tab above.</p>
          </div>
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
              <div
                key={patient.id}
                className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 rounded-xl bg-slate-900 text-white font-mono font-extrabold text-base flex items-center justify-center shadow-sm shrink-0">
                      {patient.bed_number}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {patient.full_name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {patient.display_id} • Age {patient.age}
                      </p>
                    </div>
                  </div>

                  <StatusBadge
                    status={visitStatus.status === 'completed' ? 'completed' : 'pending'}
                    label={visitStatus.status === 'completed' ? 'Examined' : 'Pending Visit'}
                  />
                </div>

                {/* Vitals Summary Row */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Temp:</span>
                    {todayRecord ? (
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                          todayRecord.is_fever
                            ? 'bg-rose-100 text-rose-800 font-extrabold'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {todayRecord.temperature_celsius}°C
                      </span>
                    ) : (
                      <span className="text-amber-600 font-medium text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pending Nurse
                      </span>
                    )}
                  </div>

                  <StreakBadge
                    streakDays={streakResult.streakDays}
                    isEligible={streakResult.isEligibleForDischargeApproval}
                  />
                </div>

                {/* PROPER MOBILE BUTTON: 100% VISIBLE ON FIRST VIEW */}
                <button
                  onClick={() => setSelectedPatient(patient)}
                  className="w-full py-3 px-4 rounded-xl text-sm font-extrabold bg-slate-900 text-white hover:bg-blue-600 active:scale-95 shadow transition-all flex items-center justify-center gap-2"
                >
                  <Stethoscope className="w-4 h-4 text-blue-400" />
                  <span>Examine Patient ({patient.bed_number})</span>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP TABLE VIEW: Shown on Medium & Large Screens (hidden md:block) */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
