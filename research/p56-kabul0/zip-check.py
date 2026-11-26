#!/usr/bin/env python3
"""Verify p56's published bytes and each unpacked file against the checked-out tree."""
from hashlib import sha256
import json
from pathlib import Path
import sys
from zipfile import ZipFile
from zlib import crc32

root = Path(sys.argv[1])
release = json.loads((root / 'RELEASE-FED-AI-SIYASET0.json').read_bytes())
manifest_path = root / 'RELEASE-MANIFEST.json'
archive = root / release['file']
data = archive.read_bytes()
digest = sha256(data).hexdigest()
crc = f'{crc32(data):08X}'
assert digest == release['sha256'] and crc == release['crc32'] and len(data) == release['bytes']
assert sha256(manifest_path.read_bytes()).hexdigest() == release['manifestSha256']
with ZipFile(archive) as game:
    assert game.testzip() is None
    assert sorted(game.namelist()) == sorted(release['entryHashes'])
    entries = {}
    for name in game.namelist():
        content = game.read(name)
        assert content == (root / name).read_bytes()
        digest_file = sha256(content).hexdigest()
        assert digest_file == release['entryHashes'][name]
        entries[name] = {'sha256': digest_file, 'crc32': f'{crc32(content):08X}'}
print(json.dumps({'sha256': digest, 'crc32': crc, 'bytes': len(data), 'entries': entries}, indent=2))
