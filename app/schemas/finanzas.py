from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.models.finanzas import PaymentMethod, PaymentState


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
