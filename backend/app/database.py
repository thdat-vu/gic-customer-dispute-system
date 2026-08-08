from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


BACKEND_DIRECTORY = Path(__file__).resolve().parent.parent
DEFAULT_DATABASE_PATH = BACKEND_DIRECTORY / "data" / "app.db"
DEFAULT_DATABASE_URL = f"sqlite:///{DEFAULT_DATABASE_PATH}"


class Base(DeclarativeBase):
    pass


def create_sqlite_engine(database_url: str = DEFAULT_DATABASE_URL) -> Engine:
    """Create the SQLite engine used by the application or a seed test."""
    return create_engine(database_url, connect_args={"check_same_thread": False})


engine = create_sqlite_engine()
SessionLocal = sessionmaker(bind=engine)


def create_database_schema(target_engine: Engine = engine) -> None:
    """Create the local SQLite directory and all declared tables."""
    if target_engine.url.database:
        Path(target_engine.url.database).parent.mkdir(parents=True, exist_ok=True)

    # Importing models registers the table metadata before create_all runs.
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=target_engine)
