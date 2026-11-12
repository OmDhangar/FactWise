import React from 'react';
import { Flame, ShieldCheck } from 'lucide-react';

interface StreakBadgeProps {
  streakDays: number;
  isEligible: boolean;
  className?: string;
}

export function StreakBadge({ streakDays, isEligible, className = '' }: StreakBadgeProps) {
  if (isEligible || streakDays >= 3) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm ${className}`}
        title="Patient has completed 3 consecutive qualifying fever-free days"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>3/3 Days (Eligible)</span>
      </span>
    );
  }

  if (streakDays === 2) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 ${className}`}
      >
        <Flame className="w-3.5 h-3.5 text-blue-500" />
        <span>2 of 3 Days</span>
      </span>
    );
  }

  if (streakDays === 1) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        <span>1 of 3 Days</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200 ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
      <span>0 of 3 Days</span>
    </span>
  );
}

