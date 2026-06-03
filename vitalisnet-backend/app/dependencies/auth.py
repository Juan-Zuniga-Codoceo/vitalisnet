from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.auth import User
from app.schemas.auth import TokenPayload

# Esquema OAuth2 con Bearer Token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
) -> User:
    """
    Inyección de dependencia para obtener el usuario autenticado a partir del token JWT.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales de acceso.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decodificar el token JWT
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        user_id_str: str = payload.get("sub")
        rol: str = payload.get("rol")
        clinic_id: int = payload.get("clinic_id")

        if user_id_str is None:
            raise credentials_exception

        token_data = TokenPayload(
            sub=user_id_str, rol=rol, clinic_id=clinic_id
        )
    except jwt.PyJWTError:
        raise credentials_exception

    # Buscar usuario en base de datos
    query = select(User).where(User.id == int(token_data.sub))
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo en el sistema.",
        )

    return user
