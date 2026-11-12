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
  const { activeUser, metrics, patients } = useStore();

  // Pending counts for badges
  const reReviewCount = patients.filter(
    (p) => p.discharge_review_flag === 'requires_doctor_rereview'
  ).length;

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-6 overflow-x-auto py-2">
          {/* Nurse Tab */}
          <button
            onClick={() => onTabChange('nurse')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
              currentTab === 'nurse'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Thermometer className="w-4 h-4" />
            <span>Nurse Triage</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                metrics.measured_pending_count > 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {metrics.measured_pending_count} Pending
            </span>
          </button>

          {/* Doctor Tab */}
          <button
            onClick={() => onTabChange('doctor')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
              currentTab === 'doctor'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Doctor Rounds</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800">
              {metrics.doctor_visits_pending_today} Ready
            </span>
            {reReviewCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-rose-600" />
                {reReviewCount} Re-Review
              </span>
            )}
          </button>

          {/* Admin Tab */}
          <button
            onClick={() => onTabChange('admin')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
              currentTab === 'admin'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Admin & Discharges</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                metrics.pending_discharges_count > 0
                  ? 'bg-blue-100 text-blue-800 animate-pulse'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {metrics.pending_discharges_count} Approved Discharges
            </span>
          </button>

          {/* Head Doctor Overview Tab */}
          <button
            onClick={() => onTabChange('head_doctor')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
              currentTab === 'head_doctor'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Facility Overview</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700">
              Executive
            </span>
          </button>
        </nav>
      </div>
    </div>
  );
}

