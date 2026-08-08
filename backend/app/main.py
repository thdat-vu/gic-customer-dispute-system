from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import router
from app.api.errors import register_exception_handlers
from app.constants import FrontendOrigin
from app.database import create_database_schema


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_database_schema()
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FrontendOrigin.LOCAL_DEVELOPMENT],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
register_exception_handlers(app)
app.include_router(router)


@app.get("/")
def health_check() -> dict[str, str]:
    return {"message": "Hello World"}
