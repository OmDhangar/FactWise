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
import { Search, Thermometer, CheckCircle2, Clock, AlertTriangle, Plus } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      {/* Top Header & Operational Compliance Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Nurse Daily Triage Roster</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Morning Rounds
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visual focus: Record daily primary body temperatures in Celsius. Prevents duplicate measurements & synchronizes doctor queues.
          </p>
        </div>

        {/* Triage Stats Widget */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-lg bg-amber-50 border border-amber-200 text-right">
            <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Pending Today</div>
            <div className="text-lg font-bold text-amber-900">{metrics.measured_pending_count} Patients</div>
          </div>
          <div className="px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-right">
            <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Completed Today</div>
            <div className="text-lg font-bold text-emerald-900">{metrics.measured_today_count} Patients</div>
          </div>
          <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-right">
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Daily Progress</div>
            <div className="text-lg font-bold text-blue-600">{metrics.temperature_completion_rate}%</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setFilterTab('pending')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterTab === 'pending'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Pending Measurements</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
              {metrics.measured_pending_count}
            </span>
          </button>

          <button
            onClick={() => setFilterTab('completed')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterTab === 'completed'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Completed Today</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
              {metrics.measured_today_count}
            </span>
          </button>

          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterTab === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>All Patients</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
              {activePatients.length}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
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

      {/* Main Patient Table (Clean, high-contrast, linear-style) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
                              <span className="text-[10px] font-semibold text-rose-600 flex items-center gap-0.5">
                                <AlertTriangle className="w-3 h-3" /> Fever
                              </span>
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all active:scale-95"
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

