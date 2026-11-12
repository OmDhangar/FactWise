'use client';

import React, { useState } from 'react';
import { Patient } from '@/types';
import { useStore } from '@/context/StoreContext';
import { getDailyTemperatureStatus } from '@/lib/clinicalCalculations';
import { X, Thermometer, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface TempRecordModalProps {
  patient: Patient | null;
  onClose: () => void;
}

export function TempRecordModal({ patient, onClose }: TempRecordModalProps) {
  const {
    activeUser,
    facilityDate,
    feverThreshold,
    temperatureRecords,
    recordTemperature,
  } = useStore();

  if (!patient) return null;

  const todayStatus = getDailyTemperatureStatus(patient.id, temperatureRecords, facilityDate);
  const existingPrimary = temperatureRecords.find(
    (r) => r.patient_id === patient.id && r.recorded_date === facilityDate && r.is_primary
  );

  const [tempValue, setTempValue] = useState<string>('36.8');
  const [readingType, setReadingType] = useState<'routine_daily' | 'additional_check'>(
    existingPrimary ? 'additional_check' : 'routine_daily'
  );
  const [additionalReason, setAdditionalReason] = useState<string>('');
  const [confirmedExtreme, setConfirmedExtreme] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const numericTemp = parseFloat(tempValue);
  const isNumeric = !isNaN(numericTemp);

  // Tier 2 extreme check
  const isExtreme = isNumeric && (numericTemp < 34.0 || numericTemp > 42.0);

  // Tier 3 clinical classification
  const isFever = isNumeric && numericTemp >= feverThreshold;
  const isUrgent = isNumeric && numericTemp >= 39.5;

  const handleSave = () => {
    setErrorMessage(null);

    // Tier 1 Validation
    if (!isNumeric) {
      setErrorMessage('Please enter a valid numeric temperature value in Celsius.');
      return;
    }

    if (numericTemp < 30.0 || numericTemp > 46.0) {
      setErrorMessage('Temperature outside viable human range (30.0°C – 46.0°C).');
      return;
    }

    // Tier 2 Confirmation
    if (isExtreme && !confirmedExtreme) {
      setErrorMessage(`Please check the confirmation box below to verify extreme reading (${numericTemp}°C).`);
      return;
    }

    const isPrimary = readingType === 'routine_daily' && !existingPrimary;

    if (!isPrimary && (!additionalReason || additionalReason.trim().length === 0)) {
      setErrorMessage('Clinical reason is required for additional checks.');
      return;
    }

    const res = recordTemperature({
      patientId: patient.id,
      temperatureCelsius: Math.round(numericTemp * 10) / 10,
      isPrimary,
      readingType,
      additionalReason: !isPrimary ? additionalReason : undefined,
    });

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to record temperature.');
      return;
    }

    if (res.invalidatedDischarge) {
      alert(
        `CRITICAL ALERT: Patient ${patient.full_name} (${patient.bed_number}) recorded a fever (${numericTemp}°C). Pending discharge was revoked and routed to doctor.`
      );
    }

    setSuccessToast(`Recorded ${numericTemp}°C for Bed ${patient.bed_number}.`);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Modal Container: Mobile bottom sheet / Desktop centered dialog */}
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
        {/* Header - Compact for mobile view */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg font-mono font-extrabold text-sm sm:text-base bg-blue-600 text-white shadow-sm">
              {patient.bed_number}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  {patient.full_name}
                </h3>
              </div>
              <p className="text-[11px] text-slate-500">
                {patient.display_id} • Age {patient.age} • Nurse: {activeUser.name.split(' ')[0]}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body - Optimized to fit in first view on mobile */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
          {/* Status Notice if Primary Already Exists */}
          {existingPrimary && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Primary reading recorded at {new Date(existingPrimary.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({existingPrimary.temperature_celsius}°C).</strong>
                <span className="text-amber-800 block text-[11px]">Recording additional clinical check.</span>
              </div>
            </div>
          )}

          {/* Large Touch-Friendly Temperature Controls (Visible immediately!) */}
          <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Temperature (Celsius)
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                Tap + / - or presets
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const val = parseFloat(tempValue) || 36.8;
                  setTempValue((Math.max(30, val - 0.1)).toFixed(1));
                }}
                className="w-14 h-14 sm:w-16 sm:h-14 rounded-xl border-2 border-slate-300 bg-white text-slate-800 font-extrabold text-2xl hover:bg-slate-100 hover:border-slate-400 flex items-center justify-center active:scale-90 transition-all shadow-sm select-none"
              >
                -
              </button>

              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="46"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="w-full h-14 text-center text-3xl font-extrabold font-mono rounded-xl border-2 border-blue-500 bg-white text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 shadow-inner select-all"
                  placeholder="36.8"
                />
                <span className="absolute right-3.5 top-4 text-base font-bold text-slate-400 pointer-events-none">
                  °C
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const val = parseFloat(tempValue) || 36.8;
                  setTempValue((Math.min(46, val + 0.1)).toFixed(1));
                }}
                className="w-14 h-14 sm:w-16 sm:h-14 rounded-xl border-2 border-slate-300 bg-white text-slate-800 font-extrabold text-2xl hover:bg-slate-100 hover:border-slate-400 flex items-center justify-center active:scale-90 transition-all shadow-sm select-none"
              >
                +
              </button>
            </div>

            {/* Quick One-Tap Presets (Mobile Friendly 40px touch targets) */}
            <div className="grid grid-cols-5 gap-1.5 mt-3">
              {[
                { label: '36.5°', val: '36.5' },
                { label: '36.8°', val: '36.8' },
                { label: '37.2°', val: '37.2' },
                { label: '37.8° 🔥', val: '37.8' },
                { label: '38.5° ⚠️', val: '38.5' },
              ].map((p) => {
                const isSelected = tempValue === p.val;
                return (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => setTempValue(p.val)}
                    className={`h-9 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center justify-center ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow ring-2 ring-blue-300'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clinical Classification Live Pill */}
          {isNumeric && (
            <div
              className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-between ${
                isUrgent
                  ? 'bg-red-50 text-red-900 border-red-300'
                  : isFever
                  ? 'bg-rose-50 text-rose-900 border-rose-300'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                {isUrgent ? (
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                ) : isFever ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span>
                  {isUrgent
                    ? 'High Fever: Urgent Attention (≥39.5°C)'
                    : isFever
                    ? `Fever Active (≥${feverThreshold}°C)`
                    : `Normal / Apyrexial (<${feverThreshold}°C)`}
                </span>
              </div>
              <span className="text-[11px] font-mono font-semibold">
                {isFever ? 'Streak Resets' : 'Qualifies Streak'}
              </span>
            </div>
          )}

          {/* Extreme Value Confirmation (Only shown when extreme) */}
          {isExtreme && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-xs">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmedExtreme}
                  onChange={(e) => setConfirmedExtreme(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 w-4 h-4"
                />
                <span className="text-amber-900 text-[11px]">
                  <strong>Confirm extreme reading:</strong> Verified {numericTemp}°C is not a typo.
                </span>
              </label>
            </div>
          )}

          {/* Clinical Reason (Only shown for additional checks) */}
          {existingPrimary && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Additional Check <span className="text-red-500">*</span>
              </label>
              <select
                value={additionalReason}
                onChange={(e) => setAdditionalReason(e.target.value)}
                className="w-full text-xs h-9 px-3 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Reason --</option>
                <option value="Post-medication antipyretic check">Post-medication antipyretic check</option>
                <option value="Patient reported chills / shivering">Patient reported chills / shivering</option>
                <option value="Doctor requested re-check">Doctor requested re-check</option>
                <option value="Pre-discharge re-verification">Pre-discharge re-verification</option>
              </select>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Toast */}
          {successToast && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successToast}</span>
            </div>
          )}
        </div>

        {/* FIXED FOOTER: ALWAYS VISIBLE ON FIRST VIEW WITHOUT SCROLLING! */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-24 sm:w-28 py-3 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-extrabold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Thermometer className="w-4 h-4" />
            <span>Save Reading {isNumeric ? `(${numericTemp}°C)` : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
