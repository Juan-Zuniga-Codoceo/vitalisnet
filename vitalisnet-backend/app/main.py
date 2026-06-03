from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.routers.agenda import router as agenda_router
from app.routers.finanzas import router as finance_router
from app.routers.auth import router as auth_router
from app.routers.clinical import router as clinical_router

app = FastAPI(
    title="VitalisNet API",
    description="Backend para el agendamiento y gestión médica SaaS VitalisNet",
    version="1.0.0",
)

# Configuración de orígenes permitidos para CORS (pueden ser extendidos para producción)
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Incluir routers bajo el prefijo de la versión de la API
app.include_router(agenda_router, prefix="/api/v1")
app.include_router(finance_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(clinical_router, prefix="/api/v1")

@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check(db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    """
    Endpoint de prueba de salud. Verifica que el servidor backend esté corriendo
    y que la conexión asíncrona a la base de datos sea exitosa.
    """
    try:
        # Ejecutar una consulta simple para verificar la salud de la base de datos
        result = await db.execute(text("SELECT 1"))
        result.scalar()
        db_status = "conectada"
    except Exception as e:
        db_status = f"error: {str(e)}"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "error",
                "mensaje": "El backend está activo pero la base de datos no está disponible",
                "database": db_status,
            },
        )

    return {
        "status": "ok",
        "mensaje": "Servidor backend de VitalisNet activo y funcionando",
        "database": db_status,
        "entorno": settings.ENVIRONMENT,
    }

