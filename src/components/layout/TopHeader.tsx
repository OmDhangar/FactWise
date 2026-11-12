'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { UserRole } from '@/types';
import { Activity, RotateCcw, Bed, UserCheck, ShieldAlert } from 'lucide-react';

export function TopHeader() {
  const { activeUser, switchUserRole, metrics, resetData, feverThreshold, setFeverThreshold } = useStore();

  const isFull = metrics.available_beds === 0;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      {/* Top Banner: Demo Switcher for Assessment Evaluators */}
      <div className="bg-slate-900 text-slate-100 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold uppercase tracking-wider text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
            Assessment Demo Switcher
          </span>
          <span className="text-slate-400 hidden sm:inline">
            Click to switch persona & test role-specific workflows:
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {(['nurse', 'doctor', 'admin', 'head_doctor'] as UserRole[]).map((role) => {
            const isActive = activeUser.role === role;
            const labels: Record<UserRole, string> = {
              nurse: 'Nurse Sarah',
              doctor: 'Dr. Chen',
              admin: 'Admin Elena',
              head_doctor: 'Head Doctor Vance',
            };

            return (
              <button
                key={role}
                onClick={() => switchUserRole(role)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow ring-2 ring-blue-300'
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
            className="ml-2 flex items-center gap-1 text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline">Reset Seed</span>
          </button>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-900 tracking-tight">QuarantineCare</span>
              <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                MVP V2.1
              </span>
            </div>
            <p className="text-xs text-slate-500">Virus Quarantine & Treatment Operations Facility</p>
          </div>
        </div>

        {/* Live Facility Occupancy Pill & Active Role Profile */}
        <div className="flex items-center gap-4">
          {/* Occupancy Indicator */}
          <div
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
              isFull
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-emerald-50 text-emerald-900 border-emerald-300'
            }`}
          >
            <Bed className="w-4 h-4 text-slate-600" />
            <span>
              Occupancy:{' '}
              <strong className="font-semibold text-slate-900">
                {metrics.occupied_beds} / {metrics.total_capacity} Beds
              </strong>
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                isFull ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
              }`}
            >
              {isFull ? '100% Full (0 Available)' : `${metrics.available_beds} Available`}
            </span>
          </div>

          {/* Active User Chip */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700">
              <UserCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-900">{activeUser.name}</div>
              <div className="text-[11px] text-slate-500 capitalize">{activeUser.title}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

