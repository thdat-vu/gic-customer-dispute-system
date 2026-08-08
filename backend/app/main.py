from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.database import create_database_schema


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_database_schema()
    yield


app = FastAPI(lifespan=lifespan)


@app.get("/")
def health_check() -> dict[str, str]:
    return {"message": "Hello World"}
