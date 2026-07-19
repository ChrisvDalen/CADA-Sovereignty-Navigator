/** Aantal maanden waarna een leveranciersverificatie als verouderd geldt. */
export const VERIFICATION_STALE_MONTHS = 12;

/**
 * Bepaalt of de laatste verificatie van een leverancier verouderd is. Een
 * ontbrekende datum geldt altijd als verouderd (nooit geverifieerd).
 */
export function isVerificationStale(
  lastVerified: string | null,
  thresholdMonths = VERIFICATION_STALE_MONTHS,
  now: Date = new Date(),
): boolean {
  if (!lastVerified) return true;
  const verified = new Date(lastVerified);
  if (Number.isNaN(verified.getTime())) return true;
  const threshold = new Date(now);
  threshold.setMonth(threshold.getMonth() - thresholdMonths);
  return verified.getTime() < threshold.getTime();
}
