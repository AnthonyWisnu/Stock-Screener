"""Exception dan handler error untuk API.

Seluruh pesan error yang dihadirkan ke pengguna berbahasa Indonesia.
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


class AppError(Exception):
    """Base class untuk error aplikasi yang ditampilkan ke pengguna."""

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_message: str = "Terjadi kesalahan tidak terduga."

    def __init__(self, message: Optional[str] = None) -> None:
        super().__init__(message or self.default_message)
        self.message = message or self.default_message


class StockNotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    default_message = "Kode saham tidak ditemukan."


class InvalidParameterError(AppError):
    status_code = status.HTTP_400_BAD_REQUEST
    default_message = "Parameter request tidak valid."


def _build_response(
    status_code: int, message: str, detail: Optional[object] = None
) -> JSONResponse:
    payload: dict = {"error": message}
    if detail is not None:
        payload["detail"] = detail
    return JSONResponse(status_code=status_code, content=payload)


def register_exception_handlers(app: FastAPI) -> None:
    """Daftarkan handler exception untuk response berbahasa Indonesia."""

    @app.exception_handler(AppError)
    async def _handle_app_error(_: Request, exc: AppError) -> JSONResponse:
        logger.info("AppError %s: %s", exc.__class__.__name__, exc.message)
        return _build_response(exc.status_code, exc.message)

    @app.exception_handler(RequestValidationError)
    async def _handle_validation(_: Request, exc: RequestValidationError) -> JSONResponse:
        detail = [
            {
                "lokasi": list(err.get("loc", [])),
                "pesan": err.get("msg", ""),
                "tipe": err.get("type", ""),
            }
            for err in exc.errors()
        ]
        return _build_response(
            status.HTTP_400_BAD_REQUEST,
            "Parameter request tidak valid.",
            detail,
        )

    @app.exception_handler(StarletteHTTPException)
    async def _handle_http(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        message = (
            exc.detail if isinstance(exc.detail, str) else "Permintaan tidak dapat diproses."
        )
        return _build_response(exc.status_code, message)

    @app.exception_handler(Exception)
    async def _handle_unexpected(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("Exception tidak terduga: %s", exc)
        return _build_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "Terjadi kesalahan pada server. Silakan coba lagi.",
        )
