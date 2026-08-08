from pydantic import BaseModel


class FieldError(BaseModel):
    field: str
    issue: str


class ErrorDetail(BaseModel):
    code: str
    message: str
    fields: list[FieldError] | None


class ErrorResponse(BaseModel):
    error: ErrorDetail
