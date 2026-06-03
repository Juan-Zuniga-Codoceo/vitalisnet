from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.agenda import Appointment, Professional
from app.models.auth import User, UserRole
from app.models.finanzas import FinancialTransaction, Payment
from app.schemas.finanzas import FinancialReportResponse, PaymentCreate, PaymentResponse
from app.services.finanzas import registrar_y_procesar_pago
from app.dependencies.auth import get_current_user
from app.services.mercadopago import mercadopago_service

router = APIRouter(tags=["Finanzas"])


# ---------------------------------------------
# Endpoints para Pagos (Payments)
# ---------------------------------------------
@router.post(
    "/payments/{appointment_id}/pay",
    response_model=PaymentResponse,
    status_code=status.HTTP_200_OK,
    summary="Registrar el pago de una cita y calcular comisiones",
)
async def pay_appointment(
    appointment_id: int,
    payment_in: PaymentCreate,
    db: AsyncSession = Depends(get_db),
) -> Payment:
    """
    Registra el pago para una cita médica. Si la transacción es exitosa,
    actualiza el estado de la cita a 'pagado' y genera la distribución
    financiera de comisiones entre el centro y el profesional.
    """
    try:
        payment = await registrar_y_procesar_pago(
            db=db,
            appointment_id=appointment_id,
            monto_pago=payment_in.monto,
            medio_pago=payment_in.medio_pago,
        )
        return payment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno al procesar el pago: {str(e)}",
        )


# ---------------------------------------------
# Endpoints para Reportes Financieros
# ---------------------------------------------
@router.get(
    "/finance/reports/professional/{professional_id}",
    response_model=FinancialReportResponse,
    status_code=status.HTTP_200_OK,
    summary="Obtener reporte financiero consolidado de un profesional",
)
async def get_professional_financial_report(
    professional_id: int,
    fecha_inicio: Optional[datetime] = Query(
        None, description="Fecha de inicio del filtro (ISO 8601)"
    ),
    fecha_fin: Optional[datetime] = Query(None, description="Fecha de fin del filtro (ISO 8601)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Genera un reporte financiero consolidando los ingresos totales generados,
    las comisiones asignadas al profesional médico y la porción correspondiente
    al centro de salud en un periodo de tiempo.
    Protegido para que solo el profesional correspondiente o el administrador de su clínica puedan consultarlo.
    """
    # 1. Validar existencia del profesional y cargar datos
    prof_stmt = select(Professional).where(Professional.id == professional_id)
    prof_res = await db.execute(prof_stmt)
    professional = prof_res.scalar_one_or_none()
    if not professional:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El profesional especificado no existe.",
        )

    # 2. Control de accesos por rol
    authorized = False

    # Rol Admin Centro: sólo si pertenece al mismo centro médico (clinic_id)
    if current_user.rol == UserRole.ADMIN_CENTRO:
        if current_user.clinic_id == professional.clinic_id:
            authorized = True

    # Rol Profesional: sólo si es su propio reporte financiero
    elif current_user.rol == UserRole.PROFESIONAL:
        if professional.user_id == current_user.id:
            authorized = True

    if not authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para consultar la información financiera de este profesional.",
        )

    # 2. Consultar transacciones asociadas
    query = (
        select(FinancialTransaction)
        .join(Payment)
        .join(Appointment, Payment.appointment_id == Appointment.id)
        .where(Appointment.professional_id == professional_id)
    )

    if fecha_inicio:
        query = query.where(Payment.fecha_pago >= fecha_inicio)
    if fecha_fin:
        query = query.where(Payment.fecha_pago <= fecha_fin)

    result = await db.execute(query)
    transactions = result.scalars().all()

    # 3. Sumarizar montos de las transacciones
    ingresos_totales = sum(tx.monto_total for tx in transactions)
    monto_profesional = sum(tx.monto_profesional for tx in transactions)
    monto_centro = sum(tx.monto_centro for tx in transactions)
    citas_pagadas_cantidad = len(transactions)

    return {
        "professional_id": professional_id,
        "ingresos_totales": float(ingresos_totales),
        "monto_profesional": float(monto_profesional),
        "monto_centro": float(monto_centro),
        "citas_pagadas_cantidad": citas_pagadas_cantidad,
    }


# ---------------------------------------------
# Endpoints para Suscripción Mercado Pago
# ---------------------------------------------
@router.post(
    "/payments/subscribe",
    status_code=status.HTTP_200_OK,
    summary="Crear una preferencia de suscripción con periodo de prueba de 30 días",
)
async def create_subscription_preference():
    """
    Crea una preferencia de suscripción recurrente en Mercado Pago.
    Retorna la URL de Mercado Pago (init_point o sandbox_init_point)
    para redirigir al usuario al flujo de suscripción.
    """
    res = mercadopago_service.crear_preferencia_suscripcion()
    if not res["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al conectar con Mercado Pago: {res.get('error')}"
        )
    return {
        "plan_id": res["plan_id"],
        "init_point": res["init_point"],
        "sandbox_init_point": res["sandbox_init_point"]
    }
