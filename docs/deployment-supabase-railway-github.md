# Deployment Supabase, Railway, dan GitHub Pages

## Supabase

Project URL:

```text
https://myerizoulfssefyzqgvl.supabase.co
```

Migration sudah diterapkan ke Supabase project `myerizoulfssefyzqgvl`.
Tabel lama dari project sebelumnya dibackup dengan prefix `legacy_saham_indo_`.

Tabel aktif untuk project ini:

- `stocks`
- `stock_ohlcv`
- `stock_indicators`
- `stocks_latest`

Frontend tidak memakai Supabase key secara langsung. Semua akses data lewat backend FastAPI.

## Railway Backend

Deploy service dari root directory:

```text
backend
```

Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Healthcheck:

```text
/api/status
```

Variables:

```env
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require
LOG_LEVEL=INFO
MARKET_TIMEZONE=Asia/Jakarta
FETCH_INTERVAL_MINUTES=15
HISTORY_BAR_COUNT=260
YFINANCE_TIMEOUT_SECONDS=30
FETCH_MAX_CONCURRENCY=4
CORS_ALLOW_ORIGINS=https://[GITHUB_USER].github.io,http://localhost:5173
APP_ENV=production
```

Jangan masukkan Supabase service role key ke frontend.

## GitHub Pages Frontend

Repository secret:

```text
VITE_API_BASE_URL=https://[RAILWAY_BACKEND_DOMAIN]
```

GitHub Pages:

```text
Settings > Pages > Source: GitHub Actions
```

Workflow deploy ada di:

```text
.github/workflows/deploy-frontend.yml
```
