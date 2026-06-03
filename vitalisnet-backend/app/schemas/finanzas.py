from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.models.finanzas import PaymentMethod, PaymentState, CommissionState


class PaymentCreate(BaseModel):
    monto: Optional[float] = Field(
        None, gt=0, description="Monto del pago. Si no se especifica, se usará el precio de la cita."
    )
    medio_pago: PaymentMethod = Field(..., description="Medio de pago utilizado")


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    appointment_id: int
    monto: float
    medio_pago: PaymentMethod
    estado: PaymentState
    fecha_pago: Optional[datetime] = None


class FinancialReportResponse(BaseModel):
    professional_id: int
    ingresos_totales: float = Field(..., description="Suma de todos los montos de pagos recibidos")
    monto_profesional: float = Field(..., description="Suma del dinero acumulado para el médico profesional")
    monto_centro: float = Field(..., description="Suma del dinero acumulado para el centro médico")
    citas_pagadas_cantidad: int = Field(..., description="Cantidad total de citas pagadas en el periodo")


class CommissionAgreementPropose(BaseModel):
    professional_id: int
    porcentaje_propuesto: float = Field(..., ge=0, le=100, description="Porcentaje propuesto para el profesional (0-100)")


class CommissionAgreementRespond(BaseModel):
    estado: CommissionState = Field(..., description="Nuevo estado del acuerdo (ACEPTADO o RECHAZADO)")


class CommissionAgreementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    clinic_id: int
    professional_id: int
    porcentaje_propuesto: float
    estado: CommissionState
    fecha_propuesta: datetime
    fecha_respuesta: Optional[datetime] = None

