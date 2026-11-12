import React from 'react';

interface StatusBadgeProps {
  status:
    | 'pending'
    | 'completed'
    | 'fever'
    | 'urgent'
    | 'admitted'
    | 'discharge_approved'
    | 'discharged'
    | 'deceased'
    | 'requires_rereview';
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  switch (status) {
    case 'pending':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          {label || 'Pending'}
        </span>
      );
    case 'completed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {label || 'Completed'}
        </span>
      );
    case 'fever':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          {label || 'Fever Detected'}
        </span>
      );
    case 'urgent':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300 ${className}`}
        >
          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
          {label || 'Urgent Attention'}
        </span>
      );
    case 'discharge_approved':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          {label || 'Discharge Approved'}
        </span>
      );
    case 'discharged':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          {label || 'Discharged (Cured)'}
        </span>
      );
    case 'deceased':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-white border border-slate-700 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          {label || 'Deceased'}
        </span>
      );
    case 'requires_rereview':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 ${className}`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-600" />
          {label || 'Requires Doctor Re-review'}
        </span>
      );
    case 'admitted':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          {label || 'Admitted'}
        </span>
      );
  }
}
