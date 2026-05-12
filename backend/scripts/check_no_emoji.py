"""Skrip verifikasi sederhana untuk memastikan berkas Python bebas dari emoji.

Penggunaan:
    python scripts/check_no_emoji.py

Skrip memindai seluruh berkas .py di dalam folder app/ dan tests/ kemudian
melaporkan baris yang memuat karakter emoji. Exit code non-zero bila ditemukan
pelanggaran.

Skrip ini sendiri wajib bebas dari emoji.
"""

from __future__ import annotations

import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCAN_DIRS = ["app", "tests"]

# Rentang Unicode yang umum menampung emoji / pictograph.
EMOJI_RANGES: list[tuple[int, int]] = [
    (0x1F300, 0x1F5FF),
    (0x1F600, 0x1F64F),
    (0x1F680, 0x1F6FF),
    (0x1F700, 0x1F77F),
    (0x1F780, 0x1F7FF),
    (0x1F800, 0x1F8FF),
    (0x1F900, 0x1F9FF),
    (0x1FA00, 0x1FA6F),
    (0x1FA70, 0x1FAFF),
    (0x2600, 0x26FF),
    (0x2700, 0x27BF),
]


def _is_emoji_codepoint(cp: int) -> bool:
    for start, end in EMOJI_RANGES:
        if start <= cp <= end:
            return True
    return False


def scan_file(path: Path) -> list[tuple[int, str, str]]:
    findings: list[tuple[int, str, str]] = []
    with path.open("r", encoding="utf-8") as handle:
        for lineno, line in enumerate(handle, start=1):
            for ch in line:
                if _is_emoji_codepoint(ord(ch)):
                    name = unicodedata.name(ch, "UNKNOWN")
                    findings.append((lineno, ch, name))
                    break
    return findings


def main() -> int:
    violations: list[tuple[Path, int, str, str]] = []
    for folder in SCAN_DIRS:
        base = ROOT / folder
        if not base.exists():
            continue
        for py_file in base.rglob("*.py"):
            for lineno, ch, name in scan_file(py_file):
                violations.append((py_file, lineno, ch, name))

    if not violations:
        print("OK: tidak ditemukan emoji pada berkas Python.")
        return 0

    print("Ditemukan karakter emoji pada berkas berikut:")
    for path, lineno, ch, name in violations:
        rel = path.relative_to(ROOT)
        print(f"  {rel}:{lineno}  U+{ord(ch):04X}  {name}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
