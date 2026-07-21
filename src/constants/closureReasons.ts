/** Preset reasons when a responder ends a case before the normal workflow completes. */
export const CLOSURE_REASON_PRESETS = [
  'Patient Receiveood',
  'Died on Scene',
  'Died on Transit',
  'Died on Arrival',
  'Patient refused treatment / transport',
  'Patient transferred to another facility',
  'Referral Declined',
  'Resolved on scene without transport',
  'False alarm - no emergency confirmed',
  'Duplicate case - merged with another incident',
  'Case handed off to partner agency',
  'Alert Terminated',
] as const;

export type ClosureReasonPreset = (typeof CLOSURE_REASON_PRESETS)[number];

export function buildClosureReason(preset: string, extraNote?: string): string {
  const note = extraNote?.trim();
  return note ? `${preset} — ${note}` : preset;
}
