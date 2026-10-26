// Test/research only. NOT a runtime AI override.
// Inject after loading actual game scripts and call only in monthly reporting.
// Replace only the reporting expression power:totalPower(e).
function readOnlyPowerH5(e) {
  const at = Object.getOwnPropertyDescriptor(e, '_powAt');
  const cached = Object.getOwnPropertyDescriptor(e, '_powC');
  try { return totalPower(e); }
  finally {
    if (at) Object.defineProperty(e, '_powAt', at); else delete e._powAt;
    if (cached) Object.defineProperty(e, '_powC', cached); else delete e._powC;
  }
}
// This proposal was locally integrated before environment interruption.
// Strict bare-engine V2 validation is still NOT RUN to completion.
// Do not mask _powC in final Save comparison; restore state around the read.
