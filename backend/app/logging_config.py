"""Konfigurasi logging aplikasi.

Seluruh log diarahkan ke stdout dalam format yang dapat dibaca oleh log viewer
di panel Hostinger. Tidak ada file handler agar deployment tetap sederhana.
"""

from __future__ import annotations

import logging
import sys
from logging.config import dictConfig


def configure_logging(level: str = "INFO") -> None:
    """Konfigurasi handler root logging ke stdout dengan format standar."""
    config: dict = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": "%(asctime)s %(levelname)s [%(name)s] %(message)s",
                "datefmt": "%Y-%m-%dT%H:%M:%S%z",
            }
        },
        "handlers": {
            "stdout": {
                "class": "logging.StreamHandler",
                "stream": sys.stdout,
                "formatter": "standard",
                "level": level,
            }
        },
        "root": {
            "handlers": ["stdout"],
            "level": level,
        },
        "loggers": {
            "uvicorn": {"handlers": ["stdout"], "level": level, "propagate": False},
            "uvicorn.error": {"handlers": ["stdout"], "level": level, "propagate": False},
            "uvicorn.access": {"handlers": ["stdout"], "level": level, "propagate": False},
            "apscheduler": {"handlers": ["stdout"], "level": level, "propagate": False},
            "sqlalchemy.engine": {
                "handlers": ["stdout"],
                "level": "WARNING",
                "propagate": False,
            },
        },
    }
    dictConfig(config)

    # Tangkap exception yang tidak di-handle dan catat sebagai CRITICAL.
    def _handle_uncaught(exc_type, exc_value, exc_tb):  # type: ignore[no-untyped-def]
        if issubclass(exc_type, KeyboardInterrupt):
            sys.__excepthook__(exc_type, exc_value, exc_tb)
            return
        logging.getLogger("uncaught").critical(
            "Exception tidak tertangani", exc_info=(exc_type, exc_value, exc_tb)
        )

    sys.excepthook = _handle_uncaught
