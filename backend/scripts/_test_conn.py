import asyncio
import asyncpg
import platform
import os
from pathlib import Path

# Load .env
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / ".env")
except ImportError:
    pass

if platform.system() == "Windows":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def test():
    pw = os.environ.get("POSTGRES_PASSWORD", "")
    host = os.environ.get("POSTGRES_HOST", "localhost")
    user = os.environ.get("POSTGRES_USER", "postgres")
    print(f"Mencoba koneksi: host={host} user={user} password=[{pw}]")
    try:
        conn = await asyncpg.connect(
            host=host, port=5432, user=user, password=pw, database="postgres"
        )
        ver = await conn.fetchval("SELECT version()")
        await conn.close()
        print(f"BERHASIL: {ver[:50]}")
    except asyncpg.InvalidPasswordError as e:
        print(f"GAGAL - Password salah: {e}")
    except Exception as e:
        print(f"GAGAL - Error lain: {type(e).__name__}: {e}")

asyncio.run(test())
