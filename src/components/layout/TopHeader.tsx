'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { UserRole } from '@/types';
import { Activity, RotateCcw, Bed, UserCheck } from 'lucide-react';

export function TopHeader() {
  const { activeUser, switchUserRole, metrics, resetData } = useStore();

  const isFull = metrics.available_beds === 0;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      {/* Top Banner: Demo Switcher for Assessment Evaluators */}
      <div className="bg-slate-900 text-slate-100 px-3 sm:px-4 py-1.5 sm:py-2 text-xs flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-bold uppercase tracking-wider text-[10px] text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded border border-blue-800">
            Demo Persona:
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {(['nurse', 'doctor', 'admin', 'head_doctor'] as UserRole[]).map((role) => {
            const isActive = activeUser.role === role;
            const labels: Record<UserRole, string> = {
              nurse: 'Nurse Sarah',
              doctor: 'Dr. Chen',
              admin: 'Admin Elena',
              head_doctor: 'Head Dr. Vance',
            };

            return (
              <button
                key={role}
                onClick={() => switchUserRole(role)}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-all whitespace-nowrap active:scale-95 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow ring-2 ring-blue-300'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {labels[role]}
              </button>
            );
          })}

          <button
            onClick={() => {
              if (confirm('Reset store back to initial 74/74 seed distribution?')) {
                resetData();
              }
            }}
            title="Reset to Initial Assessment Seed Data"
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 px-1.5 py-1 rounded hover:bg-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[10px]">Reset</span>
          </button>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
                QuarantineCare
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1 py-0.2 rounded">
                MVP
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 hidden xs:block">
              Quarantine & Treatment Facility Operations
            </p>
          </div>
        </div>

        {/* Live Facility Occupancy Pill & Active Role Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Occupancy Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${
              isFull
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-emerald-50 text-emerald-900 border-emerald-300'
            }`}
          >
            <Bed className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="text-[11px] sm:text-xs">
              <strong className="font-extrabold">{metrics.occupied_beds}</strong>/74
            </span>
            <span
              className={`px-1 py-0.2 rounded text-[9px] font-extrabold ${
                isFull ? 'bg-amber-200 text-amber-950' : 'bg-emerald-200 text-emerald-950'
              }`}
            >
              {isFull ? 'Full' : `${metrics.available_beds} Free`}
            </span>
          </div>

          {/* Active User Chip */}
          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
              <UserCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">{activeUser.name}</div>
              <div className="text-[10px] text-slate-500 capitalize">{activeUser.title.split(',')[0]}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
