'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import {
  BarChart3,
  Activity,
  Bed,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Sliders,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

export function FacilityOverview() {
  const { metrics, feverThreshold, setFeverThreshold, historicalClosedCases, patients } = useStore();

  const isMortalityOnTarget = metrics.mortality_rate <= 15.0;
  const isSurvivalOnTarget = metrics.survival_rate >= 85.0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Facility Operations & Clinical Performance</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
              Executive Oversight
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visual focus: Facility occupancy, daily round compliance, and clinical quality benchmarks against expected hospital standards.
          </p>
        </div>

        {/* Configurable Clinical Fever Threshold Controller */}
        <div className="bg-slate-50 border border-slate-300 rounded-lg p-2.5 flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>Fever Threshold:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFeverThreshold(Math.max(37.0, Math.round((feverThreshold - 0.1) * 10) / 10))}
              className="w-6 h-6 rounded bg-white border border-slate-300 text-xs font-bold hover:bg-slate-100 flex items-center justify-center"
            >
              -
            </button>
            <span className="text-xs font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200">
              {feverThreshold}°C
            </span>
            <button
              onClick={() => setFeverThreshold(Math.min(39.0, Math.round((feverThreshold + 0.1) * 10) / 10))}
              className="w-6 h-6 rounded bg-white border border-slate-300 text-xs font-bold hover:bg-slate-100 flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: Facility Capacity & Occupancy (Assessment Requirement) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Beds */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Bed Capacity</span>
            <Bed className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            {metrics.total_capacity}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Maximum physical capacity</div>
        </div>

        {/* Occupied Beds */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Occupied Beds</span>
            <span className="w-2 h-2 rounded-full bg-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            {metrics.occupied_beds}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {metrics.occupied_beds === 74 ? '100% Occupancy (Full)' : `${metrics.occupied_beds}/74 Beds occupied`}
          </div>
        </div>

        {/* Available Beds */}
        <div
          className={`p-4 rounded-xl border shadow-sm ${
            metrics.available_beds === 0
              ? 'bg-slate-50 border-slate-200'
              : 'bg-emerald-50 border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Available Beds</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div
            className={`text-2xl font-bold mt-2 font-mono ${
              metrics.available_beds === 0 ? 'text-slate-400' : 'text-emerald-700'
            }`}
          >
            {metrics.available_beds}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {metrics.available_beds === 0 ? 'Zero beds available' : 'Ready for admissions'}
          </div>
        </div>

        {/* Pending Discharges */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pending Discharges</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-2 font-mono">
            {metrics.pending_discharges_count}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Doctor-approved in admin queue</div>
        </div>
      </div>

      {/* SECTION 2: Daily Operational Round Compliance */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Daily Operational Round Compliance</h2>
          <p className="text-xs text-slate-500">
            Mandatory daily protocol: Every patient must receive a nurse temperature triage and a doctor clinical visit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Temperature Measurement Progress Bar */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">1. Daily Nurse Temperature Triage</span>
              <span className="font-mono font-bold text-blue-600">
                {metrics.measured_today_count} / {metrics.occupied_beds} ({metrics.temperature_completion_rate}%)
              </span>
            </div>

            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, metrics.temperature_completion_rate)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{metrics.measured_pending_count} Patients Pending</span>
              <span>Target: 100% daily</span>
            </div>
          </div>

          {/* Doctor Examination Progress Bar */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">2. Daily Doctor Clinical Visit</span>
              <span className="font-mono font-bold text-emerald-600">
                {metrics.doctor_visits_completed_today} / {metrics.occupied_beds} ({metrics.doctor_completion_rate}%)
              </span>
            </div>

            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, metrics.doctor_completion_rate)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{metrics.doctor_visits_pending_today} Visits Remaining</span>
              <span>Target: 100% daily</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Clinical Quality & Benchmark Metrics (Closed Cases Only) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Treatment Quality & Outcome Benchmarks</h2>
            <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
              Total Closed Cases: {metrics.closed_cases_total}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Calculated strictly from closed patient cases (20 simulated historical cohort records + live session discharges).
            Active inpatients are strictly excluded from closed calculations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mortality Benchmark Card */}
          <div
            className={`p-5 rounded-xl border shadow-sm space-y-3 ${
              isMortalityOnTarget
                ? 'bg-emerald-50/60 border-emerald-200'
                : 'bg-rose-50 border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Facility Mortality Rate
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                  isMortalityOnTarget
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {isMortalityOnTarget ? (
                  <>
                    <TrendingDown className="w-3.5 h-3.5" /> Within Expected 15%
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-3.5 h-3.5" /> Exceeds 15% Benchmark
                  </>
                )}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <div
                className={`text-3xl font-extrabold font-mono ${
                  isMortalityOnTarget ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {metrics.mortality_rate}%
              </div>
              <div className="text-xs text-slate-500">
                Expected Benchmark: <strong className="text-slate-800">15.0%</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-600 flex items-center justify-between">
              <span>Underlying Closed Patient Counts:</span>
              <strong className="font-mono text-slate-900">
                {metrics.closed_deceased_count} Deceased / {metrics.closed_cases_total} Closed Cases
              </strong>
            </div>
          </div>

          {/* Survival Rate (Cured) Benchmark Card */}
          <div
            className={`p-5 rounded-xl border shadow-sm space-y-3 ${
              isSurvivalOnTarget
                ? 'bg-emerald-50/60 border-emerald-200'
                : 'bg-amber-50 border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Facility Survival Rate (Cured)
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                  isSurvivalOnTarget
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isSurvivalOnTarget ? (
                  <>
                    <TrendingUp className="w-3.5 h-3.5" /> Meets 85% Target
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" /> Below Target
                  </>
                )}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <div
                className={`text-3xl font-extrabold font-mono ${
                  isSurvivalOnTarget ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {metrics.survival_rate}%
              </div>
              <div className="text-xs text-slate-500">
                Expected Benchmark: <strong className="text-slate-800">85.0%</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-600 flex items-center justify-between">
              <span>Underlying Closed Patient Counts:</span>
              <strong className="font-mono text-slate-900">
                {metrics.closed_cured_count} Cured / {metrics.closed_cases_total} Closed Cases
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

