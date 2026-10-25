# 96H.3 test inputs

This change restores the 130-suite input set from the SHA-verified 96H.0 and 96H.2 evidence archives. It changes no runtime file. Eight missing phase tests, portable historical baseline paths, current voting/privacy fixtures, five genuine political Save8 checkpoints, freight saves, and the original navy reference fixtures are included. The setup and native atlas tests create their output directories before writing, including when run alone.

`TEST-SOURCES-96H3.json` pins every selected test/helper/baseline/fixture input by SHA-256 and Git blob identity. Sources already in Git retain their original blob. Historical 96B/C source snapshots that were never committed retain their verified archive provenance; no Git commit is invented for them. Historical output files are not substitutes for an executed test.

Install the dependencies in `tests/package.json` when the host does not provide them. Run from the repository root:

```sh
node tests/verify-sources-96h3.js
STARS_TEST_WORKERS=4 STARS_TEST_LOGS=tests/audit96h3/regression node tests/run-all.js
node tests/faz96g2_setup_test.js
node tests/faz95d_identity_test.js
```

The full clean verification tree contains runtime source, static test code, pinned baseline/Save fixtures, the technology catalog and historical SHA reference inputs. It starts without generated output folders. No prior successful test logs are copied into that tree. Neither test expectations nor production economics are relaxed to pass a failing result.

Real browser tests require Playwright and a Chromium executable selected with `STARS_CHROMIUM_PATH`. The restored H0 browser scripts intentionally test the existing H0 source/cache identity. A future runtime release must keep browser expectations explicit for its own identity. Physical Android is separate from Chromium touch emulation.
