from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# Configurar motor asíncrono para PostgreSQL usando asyncpg
engine = create_async_engine(
    settings.ASYNC_DATABASE_URI,
    echo=settings.ENVIRONMENT == "development",
    future=True,
    pool_pre_ping=True,  # Verifica la conexión antes de usarla
)

# Creador de sesiones asíncronas
async_session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


# Base declarativa de SQLAlchemy 2.0
class Base(DeclarativeBase):
    pass


# Dependencia para inyección de sesión de BD en endpoints de FastAPI
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()

