from datetime import datetime
from decimal import Decimal
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agenda import Appointment, AppointmentState, Professional
from app.models.finanzas import FinancialTransaction, Payment, PaymentState, CommissionAgreement, CommissionState


async def registrar_y_procesar_pago(
    db: AsyncSession,
    appointment_id: int,
    monto_pago: Optional[float],
    medio_pago: str,
) -> Payment:
    """
    Registra el pago de una cita, actualiza el estado de la cita a PAGADO y
    calcula la división del dinero entre el profesional y el centro médico.
    """
    # 1. Obtener la cita y verificar que exista
    stmt = (
        select(Appointment)
        .join(Professional)
        .where(Appointment.id == appointment_id)
    )
    result = await db.execute(stmt)
    appointment = result.scalar_one_or_none()

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La cita especificada no existe.",
        )

    if appointment.estado == AppointmentState.PAGADO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La cita ya se encuentra pagada.",
        )

    # 2. Si no se especifica monto, usar el precio acordado en la cita
    monto = Decimal(str(monto_pago)) if monto_pago is not None else Decimal(str(appointment.precio))

    # 3. Buscar si ya existe un registro de pago para esta cita
    stmt_pago = select(Payment).where(Payment.appointment_id == appointment_id)
    result_pago = await db.execute(stmt_pago)
    payment = result_pago.scalar_one_or_none()

    now = datetime.now()

    if not payment:
        payment = Payment(
            appointment_id=appointment_id,
            monto=monto,
            medio_pago=medio_pago,
            estado=PaymentState.PAGADO,
            fecha_pago=now,
        )
        db.add(payment)
    else:
        # Si existía un pago pendiente, se actualiza a pagado
        payment.monto = monto
        payment.medio_pago = medio_pago
        payment.estado = PaymentState.PAGADO
        payment.fecha_pago = now

    # Asegurar la inserción del pago para obtener su ID
    await db.flush()

    # 4. Obtener el porcentaje de comisión del profesional (acuerdo ACEPTADO más reciente o 70% por defecto)
    stmt_agree = (
        select(CommissionAgreement)
        .where(
            CommissionAgreement.professional_id == appointment.professional_id,
            CommissionAgreement.estado == CommissionState.ACEPTADO
        )
        .order_by(CommissionAgreement.id.desc())
        .limit(1)
    )
    result_agree = await db.execute(stmt_agree)
    agreement = result_agree.scalar_one_or_none()

    if agreement:
        comision_pct = Decimal(str(agreement.porcentaje_propuesto))
    else:
        comision_pct = Decimal("70.00")

    # 5. Calcular los montos correspondientes
    monto_profesional = (comision_pct / Decimal("100.00")) * monto
    monto_centro = monto - monto_profesional

    # 6. Registrar la transacción financiera
    tx = FinancialTransaction(
        payment_id=payment.id,
        monto_total=monto,
        monto_profesional=monto_profesional,
        monto_centro=monto_centro,
        liquidado=False,
    )
    db.add(tx)

    # 7. Actualizar el estado de la cita a PAGADO
    appointment.estado = AppointmentState.PAGADO

    await db.commit()
    await db.refresh(payment)
    return payment
