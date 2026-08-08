from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.constants import ApiErrorCode, ApiMessage
from app.services import CaseNotFoundError


def error_response(
    *, status_code: int, code: str, message: str, fields: list[dict[str, str]] | None = None
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message, "fields": fields}},
    )


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(CaseNotFoundError)
    async def case_not_found_handler(
        _: Request, error: CaseNotFoundError
    ) -> JSONResponse:
        return error_response(
            status_code=404,
            code=ApiErrorCode.CASE_NOT_FOUND,
            message=str(error),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        _: Request, error: RequestValidationError
    ) -> JSONResponse:
        fields = [
            {
                "field": ".".join(
                    str(part)
                    for part in item["loc"]
                    if part not in {"body", "query", "path"}
                ),
                "issue": item["msg"],
            }
            for item in error.errors()
        ]
        return error_response(
            status_code=422,
            code=ApiErrorCode.VALIDATION_ERROR,
            message=ApiMessage.VALIDATION_ERROR,
            fields=fields,
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_error_handler(
        _: Request, error: StarletteHTTPException
    ) -> JSONResponse:
        return error_response(
            status_code=error.status_code,
            code=ApiErrorCode.HTTP_ERROR,
            message=ApiMessage.HTTP_ERROR,
        )

    @app.exception_handler(Exception)
    async def unexpected_error_handler(_: Request, __: Exception) -> JSONResponse:
        return error_response(
            status_code=500,
            code=ApiErrorCode.INTERNAL_ERROR,
            message=ApiMessage.INTERNAL_ERROR,
        )
