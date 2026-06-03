from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.auth import UserRole


class UserBase(BaseModel):
    email: EmailStr = Field(..., description="Correo electrónico del usuario")
    rol: UserRole = Field(..., description="Rol del usuario en la plataforma")
    clinic_id: Optional[int] = Field(None, description="ID de la clínica asociada (opcional)")
    activo: bool = Field(default=True, description="Estado activo del usuario")


class UserCreate(BaseModel):
    email: EmailStr = Field(..., description="Correo electrónico único")
    password: str = Field(..., min_length=6, description="Contraseña del usuario (mínimo 6 caracteres)")
    rol: UserRole = Field(default=UserRole.ADMIN_CENTRO, description="Rol asignado al usuario")
    clinic_id: Optional[int] = Field(None, description="ID de la clínica (opcional)")


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None  # Contendrá el user_id convertido a string
    rol: Optional[str] = None
    clinic_id: Optional[int] = None
    exp: Optional[int] = None


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Correo electrónico del usuario")
    password: str = Field(..., description="Contraseña en texto plano")
