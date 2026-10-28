#!/usr/bin/env python3
"""Read-only package integrity check; does not run gameplay/browser tests."""
import argparse
import hashlib
import json
from pathlib import Path
import sys


def verify(root):
    manifest = json.loads((root / 'RELEASE-MANIFEST.json').read_text('utf-8'))
    expected = manifest['files']
    errors = []
    for name, sha in expected.items():
        p = root / name
        if p.is_symlink() or root not in p.resolve().parents:
            errors.append('Geçersiz yol: ' + name)
        elif not p.is_file():
            errors.append('Eksik: ' + name)
        elif hashlib.sha256(p.read_bytes()).hexdigest() != sha:
            errors.append('Değişmiş: ' + name)
    actual = {p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file()}
    extra = actual - set(expected) - {'RELEASE-MANIFEST.json'}
    subset = manifest.get('scope') in {'github-runtime-and-phase96e1-changes', 'github-runtime-and-phase96f-changes', 'github-runtime-and-phase96f1-changes', 'github-runtime-and-phase96f3-changes'}
    if not subset:
        errors.extend('Manifest dışı: ' + name for name in sorted(extra))
    for msg in errors:
        print(msg)
    if errors:
        print('BAŞARISIZ: paket kimliği eşleşmiyor.')
        return 1
    print(f"DOĞRULANDI: {len(expected)} dosya; oyun build {manifest.get('game_build', manifest.get('build'))}.")
    if subset:
        print('KAPSAM: GitHub çalışma zamanı ve yayımlanan faz dosyaları; tarihsel arşivler kapsam dışıdır. Tam kanonik ZIP doğrulaması değildir.')
    print('Bu bütünlük kontrolüdür; oyun/Android testleri yeniden çalıştırılmadı.')
    return 0


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    try:
        sys.exit(verify(args.root.resolve()))
    except (OSError, ValueError, KeyError, TypeError) as err:
        print('BAŞARISIZ: ' + str(err))
        sys.exit(1)
