'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { UserRole } from '@/types';
import { Thermometer, Stethoscope, Building2, BarChart3, AlertCircle } from 'lucide-react';

interface AppNavigationProps {
  currentTab: UserRole;
  onTabChange: (tab: UserRole) => void;
}

export function AppNavigation({ currentTab, onTabChange }: AppNavigationProps) {
  const { metrics, patients } = useStore();

  const reReviewCount = patients.filter(
    (p) => p.discharge_review_flag === 'requires_doctor_rereview'
  ).length;

  return (
    <div className="bg-white border-b border-slate-200 sticky top-14 sm:top-16 z-20 shadow-sm -mx-3 -mt-3 sm:mx-0 sm:mt-0 sm:rounded-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <nav className="flex space-x-2 sm:space-x-6 overflow-x-auto py-2 scrollbar-none">
          {/* Nurse Tab */}
          <button
            onClick={() => onTabChange('nurse')}
            className={`flex items-center gap-1.5 py-2 px-3 border-b-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors min-h-[40px] shrink-0 ${
              currentTab === 'nurse'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Thermometer className="w-4 h-4 shrink-0" />
            <span>Nurse Triage</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                metrics.measured_pending_count > 0
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-emerald-100 text-emerald-900'
              }`}
            >
              {metrics.measured_pending_count}
            </span>
          </button>

          {/* Doctor Tab */}
          <button
            onClick={() => onTabChange('doctor')}
            className={`flex items-center gap-1.5 py-2 px-3 border-b-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors min-h-[40px] shrink-0 ${
              currentTab === 'doctor'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-4 h-4 shrink-0" />
            <span>Doctor Rounds</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-extrabold bg-blue-100 text-blue-900">
              {metrics.doctor_visits_pending_today}
            </span>
            {reReviewCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-extrabold bg-rose-100 text-rose-900 flex items-center gap-0.5">
                <AlertCircle className="w-3 h-3 text-rose-600" />
                {reReviewCount}
              </span>
            )}
          </button>

          {/* Admin Tab */}
          <button
            onClick={() => onTabChange('admin')}
            className={`flex items-center gap-1.5 py-2 px-3 border-b-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors min-h-[40px] shrink-0 ${
              currentTab === 'admin'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>Admin Queue</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                metrics.pending_discharges_count > 0
                  ? 'bg-blue-600 text-white animate-pulse'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {metrics.pending_discharges_count}
            </span>
          </button>

          {/* Head Doctor Overview Tab */}
          <button
            onClick={() => onTabChange('head_doctor')}
            className={`flex items-center gap-1.5 py-2 px-3 border-b-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors min-h-[40px] shrink-0 ${
              currentTab === 'head_doctor'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Facility Overview</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
