#!/usr/bin/env python3
"""Deterministic game ZIP from RELEASE-MANIFEST.json; verifies CRC, SHA-256 and member set.

Does not run gameplay or browser tests."""
import argparse
import hashlib
import json
from pathlib import Path
import sys
import zipfile

STAMP = (2026, 10, 28, 12, 0, 0)  # same fixed entry time as earlier release ZIPs


def sha(data):
    return hashlib.sha256(data).hexdigest()


def build(root, out):
    manifest = json.loads((root / 'RELEASE-MANIFEST.json').read_text('utf-8'))
    files = manifest['files']
    if manifest.get('file_count') != len(files):
        raise ValueError('file_count does not match files')
    for name, digest in files.items():
        if sha((root / name).read_bytes()) != digest:
            raise ValueError('working tree differs from manifest: ' + name)
    names = ['RELEASE-MANIFEST.json'] + sorted(files)
    with zipfile.ZipFile(out, 'w') as z:
        for name in names:
            info = zipfile.ZipInfo(name, STAMP)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            z.writestr(info, (root / name).read_bytes())
    return manifest, names


def verify(out, manifest, names):
    with zipfile.ZipFile(out) as z:
        if z.testzip() is not None:
            raise ValueError('CRC failure')
        if z.namelist() != names:
            raise ValueError('unexpected ZIP members')
        packed = json.loads(z.read('RELEASE-MANIFEST.json'))
        if packed != manifest:
            raise ValueError('packed manifest differs')
        for name, digest in manifest['files'].items():
            if sha(z.read(name)) != digest:
                raise ValueError('packed file differs: ' + name)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--out', type=Path)
    args = parser.parse_args()
    root = args.root.resolve()
    try:
        build_id = json.loads((root / 'RELEASE-MANIFEST.json').read_text('utf-8'))['build']
        out = args.out or root / 'releases' / ('stars-faz' + build_id + '.zip')
        manifest, names = build(root, out)
        verify(out, manifest, names)
    except (OSError, ValueError, KeyError, zipfile.BadZipFile) as err:
        print('BAŞARISIZ: ' + str(err))
        sys.exit(1)
    data = out.read_bytes()
    print(json.dumps({'file': out.name, 'bytes': len(data), 'sha256': sha(data), 'crc': 'PASS',
                      'members': len(names), 'manifest_runtime_files': len(manifest['files'])}, indent=2))
