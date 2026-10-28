# 96H.7 — research only; retain 96H.6.1

Start main: `94d47ea2e4923db54a4eee89affd594844c7f60d`.
Exact historical full engine: `fb7454acb48620a0c79c31bfc1ce3b1639504b10`.
The historical Library ZIP differs from that commit in ai.js; do not use its final 4/537 totals for the requested commit. See SOURCE/F4-ARCHIVE-VERIFIED/HISTORICAL-COMPARISON.

No runtime changes are accepted. The only behavioral candidate fixes the failed-target deadline lifecycle, but seed11 suffers an overseas upkeep/disband cascade (22 ships at day2310), ending power10323→4990. It is rejected. No 96h7 playable release, no build bump, no candidate120/240 campaign.

## Reproduction

The evidence ZIP includes the two full19-runtime source stacks under `control/` and `historical/`, the minimal Node runtime host under `scripts/runtime-host.js`, three real month60 Save fixtures under `inputs/`, raw outputs, a rejected patch and all research scripts. It excludes screenshots and the75MB historical distribution archive; its CRC/list/hash verification is included. It does not include rejected historical economy candidates.

1. Extract into an empty directory. Node18+ and Python3 suffice for mock engine probes; actual browser checks require Playwright and a complete Chromium distribution. The code repository supplies browser test assets.
2. Reconstruct the single rejected candidate by copying `control` to `candidate`, then `python scripts/apply-candidate.py`. This is research only.
3. Write a JSON job (use an actual absolute inputFile path):

```json
{"version":"candidate","tag":"replay-11-candidate","config":{"seed":11},"inputFile":"/absolute/extracted/inputs/seed11-month60.save","months":24,"out":"/absolute/output"}
```

4. Run `node scripts/host.js /absolute/job.json`. Repeat with version=`control` and the same Save. Actual60 half-day steps/month; nativeSave8load if absolute month60 is crossed; snapshot observers assert fullSave/RNG purity. Sources are not mixed.
5. For matched-origin comparison use a supplied `evidence/START-...save`,12months, version historical/control. Native historical120 control is supplied in raw data. Source provenance and F4 archive/commit mismatch must remain separate.
6. The batch/forensics scripts preserve the original sibling `Star`, `phase96h61`, `phase96h63` input paths. Edit only inputFile/output paths or reconstruct that layout from `inputs` for those scripts; the host job route above is portable. Prior sealed8seed controls are reused, not claimed to have all been rerun. Condensed source-hashed120monthly records are under `references/current120`.

`HISTORICAL-COMPARISON.json` contains commit-matched summaries for8seeds. `references/F4-pre-settlement-comparisons.json` is the correct preserved historical source; later overwritten both/repeat files are not used. `CANONICAL-REUSE-CHECK.json` retains the failed full-Save-hash check. `CANONICAL-REUSE-QUALIFIED.json` shows measured physical state/RNG equality for3×24months; it is not a full-byte equality claim.

Policy sensitivity: hold720→360/1440 (saved timers interpreted retrospectively from since); reviews90→30/180 (first saved nextReview retained); ordinary ship runway6→3/9; campaign force1.25→1.10/1.50; candidate partner window4→all; safe civilian-first allocator. Each alone, no new RNG or resource grants. Read source for exact transforms. Short horizon and inactive gates do not prove universal policy safety. Only the deadline lifecycle became the one production candidate; it failed.

203 fresh targeted assertions,10suites;17 fresh Chromium/PWA scenarios. Previous6068PASS are historical only. PhysicalAndroid NOTRUN. Browser screenshots are internal QA and excluded from this evidence deliverable.

## Manifest and publication

`EVIDENCE-MANIFEST.json` covers every other file in this ZIP with bytes/SHA256/CRC32. ZIP CRC is separately tested. Its own hash, package hash and publication HEAD are stored outside the ZIP to avoid circular hashes. `RESEARCH-96H7.json` describes research, not a game release. The final delivery report appends the remote verification receipt after publication.
