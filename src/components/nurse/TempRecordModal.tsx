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
      setErrorMessage('Temperature value is outside the physiologically possible human range (30.0°C – 46.0°C).');
      return;
    }

    // Tier 2 Confirmation
    if (isExtreme && !confirmedExtreme) {
      setErrorMessage(`Please check the confirmation box below to verify this extreme reading (${numericTemp}°C).`);
      return;
    }

    const isPrimary = readingType === 'routine_daily' && !existingPrimary;

    if (!isPrimary && (!additionalReason || additionalReason.trim().length === 0)) {
      setErrorMessage('Please select or enter a clinical reason for this additional reading.');
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
        `CRITICAL CLINICAL ALERT: Patient ${patient.full_name} (${patient.bed_number}) recorded a fever (${numericTemp}°C). Pending discharge approval has been revoked and routed back to attending doctor.`
      );
    }

    setSuccessToast(`Temperature ${numericTemp}°C recorded successfully by ${activeUser.name}.`);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Record Daily Temperature</h3>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-slate-200 text-slate-800">
                  {patient.bed_number}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {patient.full_name} ({patient.display_id}) • Age {patient.age}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Status Context Banner */}
          {existingPrimary ? (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Primary daily measurement already recorded today:</strong>
                <div className="mt-0.5 text-amber-800">
                  Logged at {new Date(existingPrimary.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                  by {existingPrimary.nurse_name} (<strong>{existingPrimary.temperature_celsius}°C</strong>).
                  Submitting an additional check requires clinical justification.
                </div>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Recording <strong>Primary Daily Temperature</strong> for today ({facilityDate}).
              </span>
            </div>
          )}

          {/* Reading Type Selector */}
          {existingPrimary && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Measurement Type</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  disabled
                  className="p-2 rounded border border-slate-200 bg-slate-100 text-slate-400 font-medium cursor-not-allowed text-left"
                >
                  Primary Daily (Already Logged)
                </button>
                <button
                  type="button"
                  className="p-2 rounded border border-blue-500 bg-blue-50 text-blue-800 font-semibold text-left"
                >
                  Secondary / Clinical Check
                </button>
              </div>
            </div>
          )}

          {/* Temperature Entry Controls */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Body Temperature (Celsius °C)
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const val = parseFloat(tempValue) || 36.8;
                  setTempValue((Math.max(30, val - 0.1)).toFixed(1));
                }}
                className="w-11 h-11 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 font-bold text-lg hover:bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
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
                  className="w-full h-11 px-4 text-center text-xl font-bold font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="36.8"
                  autoFocus
                />
                <span className="absolute right-4 top-3 text-sm font-semibold text-slate-400 pointer-events-none">
                  °C
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const val = parseFloat(tempValue) || 36.8;
                  setTempValue((Math.min(46, val + 0.1)).toFixed(1));
                }}
                className="w-11 h-11 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 font-bold text-lg hover:bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
              >
                +
              </button>
            </div>

            {/* Quick Presets for Rapid 10-15s rounds */}
            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
              <span className="text-[11px] text-slate-500 mr-1">Quick Presets:</span>
              {[
                { label: '36.5°', val: '36.5' },
                { label: '36.8°', val: '36.8' },
                { label: '37.2°', val: '37.2' },
                { label: '37.8° (Fever)', val: '37.8' },
                { label: '38.5° (High)', val: '38.5' },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => setTempValue(p.val)}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    tempValue === p.val
                      ? 'bg-blue-600 text-white font-semibold border-blue-600'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clinical Classification Preview */}
          {isNumeric && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                isUrgent
                  ? 'bg-red-50 text-red-900 border-red-300'
                  : isFever
                  ? 'bg-rose-50 text-rose-900 border-rose-300'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {isUrgent ? (
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                ) : isFever ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
                <span className="font-semibold">
                  {isUrgent
                    ? 'Urgent Attention: Severe Hyperpyrexia (≥ 39.5°C)'
                    : isFever
                    ? `Fever Detected (≥ ${feverThreshold}°C threshold)`
                    : `Normal / Apyrexial (< ${feverThreshold}°C)`}
                </span>
              </div>
              <span className="text-[11px] font-mono">
                {isFever ? 'Resets 3-Day Streak' : 'Qualifies Streak Day'}
              </span>
            </div>
          )}

          {/* Extreme Value Confirmation (Tier 2) */}
          {isExtreme && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmedExtreme}
                  onChange={(e) => setConfirmedExtreme(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-amber-900 font-medium">
                  <strong>Extreme physiological value confirmation:</strong> I confirm that this reading of{' '}
                  <span className="font-bold underline">{numericTemp}°C</span> has been verified and is not a typographical error.
                </span>
              </label>
            </div>
          )}

          {/* Additional Reading Reason (Mandatory if secondary) */}
          {(!existingPrimary && readingType === 'additional_check') || existingPrimary ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Reason for Additional Check <span className="text-red-500">*</span>
              </label>
              <select
                value={additionalReason}
                onChange={(e) => setAdditionalReason(e.target.value)}
                className="w-full text-xs h-9 px-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Clinical Justification --</option>
                <option value="Post-medication antipyretic check">Post-medication antipyretic check</option>
                <option value="Patient reported chills / shivering">Patient reported chills / shivering</option>
                <option value="Attending physician requested re-measurement">Attending physician requested re-measurement</option>
                <option value="Spike suspected / telemetry variance">Spike suspected / telemetry variance</option>
                <option value="Pre-discharge re-verification">Pre-discharge re-verification</option>
              </select>
            </div>
          ) : null}

          {/* Nurse Identity & Timestamp (Audit trail) */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <div>
              <span className="text-slate-400">Nurse Signature: </span>
              <strong className="text-slate-800">{activeUser.name}</strong>
            </div>
            <div>
              <span className="text-slate-400">Date: </span>
              <span className="font-mono text-slate-700">{facilityDate}</span>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Toast */}
          {successToast && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successToast}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200/70 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Thermometer className="w-4 h-4" />
            <span>Save Reading</span>
          </button>
        </div>
      </div>
    </div>
  );
}

