'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { X, UserPlus, Bed, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface RegistrationModalProps {
  onClose: () => void;
}

export function RegistrationModal({ onClose }: RegistrationModalProps) {
  const { getAvailableBeds, registerNewPatient } = useStore();
  const availableBeds = getAvailableBeds();

  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<string>('35');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [selectedBed, setSelectedBed] = useState<string>(availableBeds[0] || '');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const isFull = availableBeds.length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isFull) {
      setErrorMessage('Facility is at maximum capacity (74/74 beds occupied). Cannot admit new patients.');
      return;
    }

    if (!fullName.trim()) {
      setErrorMessage('Please enter the patient full legal name.');
      return;
    }

    const numAge = parseInt(age, 10);
    if (isNaN(numAge) || numAge <= 0 || numAge > 120) {
      setErrorMessage('Please enter a valid age between 1 and 120.');
      return;
    }

    if (!selectedBed) {
      setErrorMessage('Please assign an available isolation bed.');
      return;
    }

    const res = registerNewPatient({
      fullName: fullName.trim(),
      age: numAge,
      gender,
      bedNumber: selectedBed,
      admissionNotes: notes.trim() || undefined,
    });

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to register patient.');
      return;
    }

    setSuccessToast(`Patient ${fullName} admitted successfully and assigned to ${selectedBed}.`);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Patient Intake & Bed Allocation</h3>
              <p className="text-xs text-slate-500">Admit arriving quarantine case & allocate physical bed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Capacity Alert if full */}
          {isFull && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-300 text-red-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong>Facility at Maximum Capacity (74/74 Beds Occupied)</strong>
                <p className="mt-0.5 text-red-800">
                  There are currently 0 available beds. An attending doctor must approve and admin must process a pending discharge before a new patient can be admitted.
                </p>
              </div>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Legal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isFull}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Maya Lin"
              className="w-full text-xs h-9 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
          </div>

          {/* Age & Gender Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Age (Years) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                max="120"
                disabled={isFull}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full text-xs h-9 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <select
                disabled={isFull}
                value={gender}
                onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other')}
                className="w-full text-xs h-9 px-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Canonical Bed Allocation Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>
                Assign Available Bed <span className="text-red-500">*</span>
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                {availableBeds.length} bed(s) available
              </span>
            </label>

            {isFull ? (
              <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-100 text-xs text-slate-500 flex items-center gap-2">
                <Bed className="w-4 h-4 text-slate-400" />
                <span>No beds currently available</span>
              </div>
            ) : (
              <select
                required
                value={selectedBed}
                onChange={(e) => setSelectedBed(e.target.value)}
                className="w-full text-xs h-9 px-3 rounded-lg border border-slate-300 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableBeds.map((b) => (
                  <option key={b} value={b}>
                    Bed {b} (Available for Assignment)
                  </option>
                ))}
              </select>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              Occupied beds (1 to 74) are strictly excluded from selection.
            </p>
          </div>

          {/* Admission Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Initial Triage & Quarantine Notes
            </label>
            <textarea
              rows={2}
              disabled={isFull}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Clinical referral notes, symptom onset, isolation instructions..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successToast && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isFull}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Complete Admission</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

