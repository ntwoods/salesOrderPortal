export function invariant(condition, message) {
  if (!condition) throw new Error(message || "Invariant failed.");
}

export function hasActionableSegments(order) {
  return (order?.segments || []).some((segment) => segment.eligibleForAccountsUpload);
}
