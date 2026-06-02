import enum
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Enum as SqlEnum
from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import ExcludeConstraint, Range, TSTZRANGE
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AppointmentState(str, enum.Enum):
    PENDIENTE = "pendiente"
    CONFIRMADO = "confirmado"
    PAGADO = "pagado"
    CANCELADO = "cancelado"
    ATENDIDO = "atendido"


class Clinic(Base):
    __tablename__ = "clinics"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    rut_empresa: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    direccion: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relaciones
    professionals: Mapped[List["Professional"]] = relationship(
        "Professional", back_populates="clinic", cascade="all, delete-orphan"
    )


class Professional(Base):
    __tablename__ = "professionals"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    especialidad: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    comision_porcentaje: Mapped[float] = mapped_column(Numeric(5, 2), server_default="70.00", default=70.00, nullable=False)
    clinic_id: Mapped[int] = mapped_column(ForeignKey("clinics.id"), nullable=False)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), unique=True, nullable=True)

    # Relaciones
    clinic: Mapped["Clinic"] = relationship("Clinic", back_populates="professionals")
    appointments: Mapped[List["Appointment"]] = relationship(
        "Appointment", back_populates="professional", cascade="all, delete-orphan"
    )
    user: Mapped[Optional["User"]] = relationship("User", back_populates="professional")


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    rut: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    telefono: Mapped[str] = mapped_column(String(20), nullable=False)

    # Relaciones
    appointments: Mapped[List["Appointment"]] = relationship(
        "Appointment", back_populates="patient", cascade="all, delete-orphan"
    )


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    professional_id: Mapped[int] = mapped_column(ForeignKey("professionals.id"), nullable=False)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)

    # Rango horario nativo de Postgres (TSTZRANGE) para control de fechas y exclusión
    rango_horario: Mapped[Range] = mapped_column(TSTZRANGE, nullable=False)

    precio: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    estado: Mapped[AppointmentState] = mapped_column(
        SqlEnum(AppointmentState),
        default=AppointmentState.PENDIENTE,
        nullable=False,
    )

    # Relaciones
    professional: Mapped["Professional"] = relationship("Professional", back_populates="appointments")
    patient: Mapped["Patient"] = relationship("Patient", back_populates="appointments")

    # Restricción de exclusión GIST para evitar double-booking del mismo profesional
    __table_args__ = (
        ExcludeConstraint(
            ("professional_id", "="),
            ("rango_horario", "&&"),
            name="exclude_overlapping_appointments",
        ),
    )

    @property
    def fecha_inicio(self) -> Optional[datetime]:
        """Obtiene la fecha de inicio a partir del límite inferior del rango horario."""
        return self.rango_horario.lower if self.rango_horario else None

    @property
    def fecha_fin(self) -> Optional[datetime]:
        """Obtiene la fecha de fin a partir del límite superior del rango horario."""
        return self.rango_horario.upper if self.rango_horario else None
