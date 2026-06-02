from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.agenda import Clinic
from app.models.auth import User
from app.schemas.auth import LoginRequest, Token, UserCreate, UserResponse
from app.services.auth import create_access_token, get_password_hash, verify_password

router = APIRouter(tags=["Autenticación"])


@router.post(
    "/auth/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registro inicial de usuarios",
)
async def register_user(
    user_in: UserCreate, db: AsyncSession = Depends(get_db)
) -> User:
    """
    Registra un nuevo usuario en el sistema.
    Valida la unicidad del correo electrónico y la existencia de la clínica si se proporciona.
    """
    # 1. Verificar si el correo ya existe
    email_query = select(User).where(User.email == user_in.email)
    email_result = await db.execute(email_query)
    if email_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado.",
        )

    # 2. Verificar existencia de la clínica si se provee
    if user_in.clinic_id is not None:
        clinic_query = select(Clinic).where(Clinic.id == user_in.clinic_id)
        clinic_result = await db.execute(clinic_query)
        if not clinic_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El centro médico (clinic_id) especificado no existe.",
            )

    # 3. Hashear la contraseña y crear registro
    hashed_pwd = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_pwd,
        rol=user_in.rol,
        clinic_id=user_in.clinic_id,
        activo=True,
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)

    return db_user


@router.post(
    "/auth/login",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="Iniciar sesión para obtener token JWT",
)
async def login_for_access_token(
    login_in: LoginRequest, db: AsyncSession = Depends(get_db)
) -> Token:
    """
    Autentica un usuario con email y contraseña, retornando un token de acceso JWT.
    """
    # 1. Buscar usuario por email
    query = select(User).where(User.email == login_in.email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    # 2. Validar credenciales
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrectos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Validar si está activo
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo en el sistema.",
        )

    # 4. Generar Token
    access_token = create_access_token(
        user_id=user.id,
        rol=user.rol,
        clinic_id=user.clinic_id,
    )

    return Token(access_token=access_token, token_type="bearer")
