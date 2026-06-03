import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum as SqlEnum, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.agenda import Appointment, Clinic, Professional


class PaymentMethod(str, enum.Enum):
    TRANSFERENCIA = "transferencia"
    TRANSBANK = "transbank"
    EFECTIVO = "efectivo"


class PaymentState(str, enum.Enum):
    PENDIENTE = "pendiente"
    PAGADO = "pagado"


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    appointment_id: Mapped[int] = mapped_column(ForeignKey("appointments.id"), unique=True, nullable=False)
    monto: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    medio_pago: Mapped[PaymentMethod] = mapped_column(SqlEnum(PaymentMethod), nullable=False)
    estado: Mapped[PaymentState] = mapped_column(
        SqlEnum(PaymentState), default=PaymentState.PENDIENTE, nullable=False
    )
    fecha_pago: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relaciones
    appointment: Mapped["Appointment"] = relationship("Appointment")
    transaction: Mapped[Optional["FinancialTransaction"]] = relationship(
        "FinancialTransaction", back_populates="payment", uselist=False, cascade="all, delete-orphan"
    )


class FinancialTransaction(Base):
    __tablename__ = "financial_transactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    payment_id: Mapped[int] = mapped_column(ForeignKey("payments.id"), unique=True, nullable=False)
    monto_total: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    monto_profesional: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    monto_centro: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    liquidado: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relaciones
    payment: Mapped["Payment"] = relationship("Payment", back_populates="transaction")


class CommissionState(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    ACEPTADO = "ACEPTADO"
    RECHAZADO = "RECHAZADO"


class CommissionAgreement(Base):
    __tablename__ = "commission_agreements"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    clinic_id: Mapped[int] = mapped_column(ForeignKey("clinics.id"), nullable=False)
    professional_id: Mapped[int] = mapped_column(ForeignKey("professionals.id"), nullable=False)
    porcentaje_propuesto: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    estado: Mapped[CommissionState] = mapped_column(
        SqlEnum(CommissionState), default=CommissionState.PENDIENTE, nullable=False
    )
    fecha_propuesta: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    fecha_respuesta: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relaciones
    clinic: Mapped["Clinic"] = relationship("Clinic")
    professional: Mapped["Professional"] = relationship("Professional")

