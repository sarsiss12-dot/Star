#!/usr/bin/env python3
"""Reassemble Stars Faz 93D.1 binary release and verify SHA-256."""
from pathlib import Path
from hashlib import sha256

folder = Path(__file__).resolve().parent
parts = [folder / f"stars-faz93d1.zip.part{i:02}" for i in range(7)]
if not all(p.is_file() for p in parts):
    raise SystemExit("Missing release part(s)")
output = folder / "stars-faz93d1.zip"
with output.open("wb") as out:
    for part in parts:
        out.write(part.read_bytes())
digest = sha256(output.read_bytes()).hexdigest()
expected = "e47581b0799e735a8caf086caf4ac1c1cd7b8d5f991076c5f8d7f5f2ef192ff3"
if digest != expected:
    output.unlink(missing_ok=True)
    raise SystemExit(f"SHA-256 mismatch: {digest}")
print(f"Release restored: {output.name} SHA-256 {digest}")
