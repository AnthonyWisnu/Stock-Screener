"""Script setup database: buat database, jalankan migrasi, seed data awal.

Jalankan sekali sebelum menjalankan aplikasi:
    python scripts/setup_db.py
    python scripts/setup_db.py --password PASSWORDANDA

Script ini membaca kredensial dari file .env di folder backend/.
Argumen --password akan override nilai POSTGRES_PASSWORD di .env.
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

# Load .env
try:
    from dotenv import load_dotenv
    load_dotenv(ROOT / ".env")
except ImportError:
    pass

import asyncpg


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Setup database IDX Stock Screener")
    parser.add_argument("--host", default=None, help="PostgreSQL host (override .env)")
    parser.add_argument("--port", type=int, default=None, help="PostgreSQL port (override .env)")
    parser.add_argument("--user", default=None, help="PostgreSQL user (override .env)")
    parser.add_argument("--password", default=None, help="PostgreSQL password (override .env)")
    parser.add_argument("--dbname", default=None, help="Nama database target (override .env)")
    return parser.parse_args()


def get_config(args: argparse.Namespace) -> dict:
    return {
        "host": args.host or os.environ.get("POSTGRES_HOST", "localhost"),
        "port": args.port or int(os.environ.get("POSTGRES_PORT", "5432")),
        "user": args.user or os.environ.get("POSTGRES_USER", "postgres"),
        "password": args.password or os.environ.get("POSTGRES_PASSWORD", ""),
        "dbname": args.dbname or os.environ.get("POSTGRES_DB", "idx_screener"),
    }


async def create_database_if_not_exists(cfg: dict) -> None:
    conn = await asyncpg.connect(
        host=cfg["host"], port=cfg["port"],
        user=cfg["user"], password=cfg["password"],
        database="postgres",
    )
    try:
        exists = await conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1", cfg["dbname"]
        )
        if not exists:
            await conn.execute(f'CREATE DATABASE "{cfg["dbname"]}"')
            print(f"Database '{cfg['dbname']}' berhasil dibuat.")
        else:
            print(f"Database '{cfg['dbname']}' sudah ada.")
    finally:
        await conn.close()


async def run_migrations(cfg: dict) -> None:
    migrations_dir = ROOT / "app" / "db" / "migrations"
    sql_files = sorted(migrations_dir.glob("*.sql"))

    if not sql_files:
        print("Tidak ada file migrasi ditemukan.")
        return

    conn = await asyncpg.connect(
        host=cfg["host"], port=cfg["port"],
        user=cfg["user"], password=cfg["password"],
        database=cfg["dbname"],
    )
    try:
        for sql_file in sql_files:
            print(f"Menjalankan migrasi: {sql_file.name} ...")
            sql = sql_file.read_text(encoding="utf-8")
            await conn.execute(sql)
            print(f"  Selesai: {sql_file.name}")
    finally:
        await conn.close()


async def update_env_file(cfg: dict) -> None:
    """Update file .env dengan password yang berhasil digunakan."""
    env_path = ROOT / ".env"
    if not env_path.exists():
        return
    lines = env_path.read_text(encoding="utf-8").splitlines()
    new_lines = []
    for line in lines:
        if line.startswith("POSTGRES_PASSWORD="):
            new_lines.append(f"POSTGRES_PASSWORD={cfg['password']}")
        elif line.startswith("POSTGRES_HOST="):
            new_lines.append(f"POSTGRES_HOST={cfg['host']}")
        elif line.startswith("POSTGRES_PORT="):
            new_lines.append(f"POSTGRES_PORT={cfg['port']}")
        elif line.startswith("POSTGRES_USER="):
            new_lines.append(f"POSTGRES_USER={cfg['user']}")
        elif line.startswith("POSTGRES_DB="):
            new_lines.append(f"POSTGRES_DB={cfg['dbname']}")
        else:
            new_lines.append(line)
    env_path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
    print(f"File .env diperbarui dengan konfigurasi yang berhasil.")


async def main() -> None:
    args = parse_args()
    cfg = get_config(args)

    print("=== Setup Database IDX Stock Screener ===")
    print(f"Host    : {cfg['host']}:{cfg['port']}")
    print(f"User    : {cfg['user']}")
    print(f"Database: {cfg['dbname']}")
    print()

    try:
        await create_database_if_not_exists(cfg)
        await run_migrations(cfg)
        await update_env_file(cfg)
        print()
        print("Setup selesai. Database siap digunakan.")
        print()
        print("Langkah berikutnya:")
        print("  python -m uvicorn app.main:app --reload --port 8000")
    except asyncpg.InvalidPasswordError:
        print()
        print("ERROR: Password salah.")
        print()
        print("Jalankan ulang dengan password yang benar:")
        print('  python scripts/setup_db.py --password PASSWORDANDA')
        sys.exit(1)
    except OSError as exc:
        # Abaikan error cleanup event loop Windows (Python 3.9 bug)
        if "Event loop is closed" in str(exc) or exc.errno in (None, 0):
            pass
        else:
            print(f"ERROR: {exc}")
            sys.exit(1)
    except RuntimeError as exc:
        # Python 3.9 Windows: "Event loop is closed" saat cleanup asyncio
        if "Event loop is closed" in str(exc):
            pass
        else:
            print(f"ERROR: {exc}")
            sys.exit(1)
    except Exception as exc:
        print(f"ERROR: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    # Python 3.9 Windows: ProactorEventLoop menyebabkan error cleanup asyncpg.
    # Gunakan SelectorEventLoop sebagai workaround.
    import platform
    if platform.system() == "Windows":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
