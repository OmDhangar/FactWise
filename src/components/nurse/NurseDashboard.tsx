'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { Patient } from '@/types';
import {
  getDailyTemperatureStatus,
  calculateFeverFreeStreak,
} from '@/lib/clinicalCalculations';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StreakBadge } from '@/components/common/StreakBadge';
import { TempRecordModal } from './TempRecordModal';
import { Search, Thermometer, CheckCircle2, Clock, Plus, Zap, ArrowRight } from 'lucide-react';

export function NurseDashboard() {
  const { patients, temperatureRecords, facilityDate, feverThreshold, metrics } = useStore();

  // Primary Actionable Focus: Default to Pending Measurements!
  const [filterTab, setFilterTab] = useState<'pending' | 'completed' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Active admitted / discharge approved patients
  const activePatients = patients.filter(
    (p) => p.lifecycle_status === 'admitted' || p.lifecycle_status === 'discharge_approved'
  );

  // Filter patients
  const filteredPatients = activePatients.filter((p) => {
    const tempStatus = getDailyTemperatureStatus(p.id, temperatureRecords, facilityDate);

    if (filterTab === 'pending' && tempStatus !== 'pending') return false;
    if (filterTab === 'completed' && tempStatus !== 'completed') return false;

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchBed = p.bed_number.toLowerCase().includes(q);
      const matchName = p.full_name.toLowerCase().includes(q);
      const matchId = p.display_id.toLowerCase().includes(q);
      return matchBed || matchName || matchId;
    }

    return true;
  });

  // Find first pending patient for 1-click Quick Triage Action
  const nextPendingPatient = activePatients.find(
    (p) => getDailyTemperatureStatus(p.id, temperatureRecords, facilityDate) === 'pending'
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1-CLICK QUICK ACTION: Next Pending Patient (First View on Mobile!) */}
      {nextPendingPatient && filterTab === 'pending' && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-lg border border-blue-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex flex-col items-center justify-center font-mono font-extrabold text-white shrink-0 border border-white/30">
              <span className="text-[9px] uppercase tracking-wider text-blue-100">BED</span>
              <span className="text-base leading-none">{nextPendingPatient.bed_number}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-400 text-amber-950">
                  Next Pending Round
                </span>
                <span className="text-xs text-blue-100">{nextPendingPatient.display_id}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold leading-tight mt-0.5">
                {nextPendingPatient.full_name}
              </h2>
            </div>
          </div>

          <button
            onClick={() => setSelectedPatient(nextPendingPatient)}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-extrabold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-blue-600 text-blue-600" />
            <span>Record Bed {nextPendingPatient.bed_number} Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Triage Stats Row - Compact & Mobile Optimized */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-amber-50 p-3 sm:p-4 rounded-xl border border-amber-200 text-center sm:text-left">
          <div className="text-[10px] sm:text-xs font-bold text-amber-700 uppercase tracking-wider">
            Pending
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-900 mt-0.5 font-mono">
            {metrics.measured_pending_count}
          </div>
          <p className="text-[10px] text-amber-700/80 hidden sm:block">Patients awaiting round</p>
        </div>

        <div className="bg-emerald-50 p-3 sm:p-4 rounded-xl border border-emerald-200 text-center sm:text-left">
          <div className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider">
            Completed
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-900 mt-0.5 font-mono">
            {metrics.measured_today_count}
          </div>
          <p className="text-[10px] text-emerald-700/80 hidden sm:block">Measured this morning</p>
        </div>

        <div className="bg-blue-50 p-3 sm:p-4 rounded-xl border border-blue-200 text-center sm:text-left">
          <div className="text-[10px] sm:text-xs font-bold text-blue-700 uppercase tracking-wider">
            Progress
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-blue-900 mt-0.5 font-mono">
            {metrics.temperature_completion_rate}%
          </div>
          <p className="text-[10px] text-blue-700/80 hidden sm:block">Daily morning triage</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Filter Pills with Full-width touch tabs on mobile */}
        <div className="grid grid-cols-3 gap-1 bg-slate-200/80 p-1 rounded-xl border border-slate-300">
          <button
            onClick={() => setFilterTab('pending')}
            className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              filterTab === 'pending'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Pending</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-900 font-extrabold">
              {metrics.measured_pending_count}
            </span>
          </button>

          <button
            onClick={() => setFilterTab('completed')}
            className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              filterTab === 'completed'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Done</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-900 font-extrabold">
              {metrics.measured_today_count}
            </span>
          </button>

          <button
            onClick={() => setFilterTab('all')}
            className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              filterTab === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>All ({activePatients.length})</span>
          </button>
        </div>

        {/* Quick Search */}
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

      {/* MOBILE CARD VIEW: Visible on Mobile screens (< md) - PROPER LARGE BUTTONS VISIBLE IMMEDIATELY! */}
      <div className="block md:hidden space-y-3">
        {filteredPatients.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-400 border border-slate-200">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-bold text-slate-700">No patients in this list</p>
            <p className="text-xs text-slate-400 mt-1">
              {filterTab === 'pending' ? 'All morning temperatures completed!' : 'Try clearing your search.'}
            </p>
          </div>
        ) : (
          filteredPatients.map((patient) => {
            const tempStatus = getDailyTemperatureStatus(
              patient.id,
              temperatureRecords,
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
                {/* Top Row: Bed #, Name, Status */}
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
                    status={tempStatus === 'completed' ? 'completed' : 'pending'}
                    label={tempStatus === 'completed' ? 'Done' : 'Pending'}
                  />
                </div>

                {/* Vitals Summary Row */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Today:</span>
                    {todayRecord ? (
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                          todayRecord.is_fever
                            ? 'bg-rose-100 text-rose-800 font-extrabold'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {todayRecord.temperature_celsius}°C {todayRecord.is_fever ? '(Fever)' : ''}
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium">Not measured yet</span>
                    )}
                  </div>

                  <StreakBadge
                    streakDays={streakResult.streakDays}
                    isEligible={streakResult.isEligibleForDischargeApproval}
                  />
                </div>

                {/* FULL-WIDTH PROPER ACTION BUTTON: VISIBLE IMMEDIATELY ON FIRST VIEW! */}
                {tempStatus === 'pending' ? (
                  <button
                    onClick={() => setSelectedPatient(patient)}
                    className="w-full py-3 px-4 rounded-xl text-sm font-extrabold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow transition-all flex items-center justify-center gap-2"
                  >
                    <Thermometer className="w-4 h-4" />
                    <span>Record Temperature for Bed {patient.bed_number}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedPatient(patient)}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-500" />
                    <span>Add Clinical Check ({todayRecord?.temperature_celsius}°C logged)</span>
                  </button>
                )}
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
                <th className="py-3 px-4">Daily Temp Status</th>
                <th className="py-3 px-4">Today&apos;s Reading</th>
                <th className="py-3 px-4">Fever-Free Streak</th>
                <th className="py-3 px-4 text-right">Primary Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-600">No patients found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {filterTab === 'pending'
                        ? 'All patient morning temperature measurements have been completed!'
                        : 'Try adjusting your search filter.'}
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
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Bed # */}
                      <td className="py-3.5 px-4 font-mono font-bold text-sm text-slate-900">
                        <span className="inline-block px-2.5 py-1 rounded bg-slate-100 border border-slate-300 group-hover:border-blue-300 group-hover:bg-blue-50 transition-colors">
                          {patient.bed_number}
                        </span>
                      </td>

                      {/* Patient Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 text-xs">
                          {patient.full_name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {patient.display_id} • Age {patient.age} • {patient.gender}
                        </div>
                      </td>

                      {/* Daily Temp Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge
                          status={tempStatus === 'completed' ? 'completed' : 'pending'}
                          label={tempStatus === 'completed' ? 'Completed Today' : 'Pending Measurement'}
                        />
                      </td>

                      {/* Today's Reading */}
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
                          <span className="text-slate-400 font-mono text-xs">--</span>
                        )}
                      </td>

                      {/* Streak */}
                      <td className="py-3.5 px-4">
                        <StreakBadge
                          streakDays={streakResult.streakDays}
                          isEligible={streakResult.isEligibleForDischargeApproval}
                        />
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        {tempStatus === 'pending' ? (
                          <button
                            onClick={() => setSelectedPatient(patient)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all active:scale-95"
                          >
                            <Thermometer className="w-3.5 h-3.5" />
                            <span>Record Temp</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedPatient(patient)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Check</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Temperature Modal */}
      {selectedPatient && (
        <TempRecordModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}
    </div>
  );
}
