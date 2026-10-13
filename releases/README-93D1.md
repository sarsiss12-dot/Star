# Stars Faz 93D.1 release

GitHub source tree is the complete Faz 93D.1 code snapshot, based on Faz 92D and all intermediate Faz 93A, 93A.1, 93B, 93C and 93D work.

The release archive `stars-faz93d1.zip` (3,623,151 bytes) is split into seven **binary** .partNN files because the upload bridge has a per-request size limit. Reassemble them in numeric order; they are NOT separately extractable ZIPs.

Run:

```bash
python releases/assemble-93d1.py
```

Expected archive SHA-256: `e47581b0799e735a8caf086caf4ac1c1cd7b8d5f991076c5f8d7f5f2ef192ff3`.

Faz 93D.1: 69 test packages, 4,421 passed checks, zero remaining failures and timeouts according to the delivered report. No physical Android/browser acceptance has been performed. The source and complete archive are also preserved in the development delivery.
