import enum
from typing import Optional

from sqlalchemy import Boolean
from sqlalchemy import Enum as SqlEnum
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserRole(str, enum.Enum):
    ADMIN_CENTRO = "admin_centro"
    PROFESIONAL = "profesional"
    SECRETARIA = "secretaria"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    rol: Mapped[UserRole] = mapped_column(SqlEnum(UserRole), nullable=False)
    clinic_id: Mapped[Optional[int]] = mapped_column(ForeignKey("clinics.id"), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relaciones
    clinic: Mapped[Optional["Clinic"]] = relationship("Clinic")
    professional: Mapped[Optional["Professional"]] = relationship(
        "Professional", back_populates="user", uselist=False
    )
