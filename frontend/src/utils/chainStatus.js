/**
 * @param {object} log — API log document
 * @param {{ chainMatch: boolean|null, localIntegrity?: boolean }|undefined} verifyCache — last verify result for this log id
 */
export function getBlockchainUiStatus(log, verifyCache) {
  const hasIndex =
    log?.chainLogIndex != null && log?.chainLogIndex !== undefined;
  const tx = log?.blockchainTxHash;

  if (!hasIndex && !tx) {
    return {
      label: "Not anchored",
      variant: "neutral",
      detail: "No on-chain commitment for this log.",
    };
  }

  if (verifyCache && typeof verifyCache.chainMatch === "boolean") {
    if (verifyCache.chainMatch === true) {
      return {
        label: "Verified on-chain",
        variant: "success",
        detail: "Smart contract hash matches stored hash.",
      };
    }
    return {
      label: "Chain mismatch",
      variant: "danger",
      detail: "On-chain hash does not match stored record.",
    };
  }

  return {
    label: "Anchored",
    variant: "warn",
    detail: "Run verification to compare with the contract.",
  };
}
