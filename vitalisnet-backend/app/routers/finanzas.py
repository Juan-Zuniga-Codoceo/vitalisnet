import csv
import io
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.agenda import Appointment, Professional, Patient, MedicalTag, AppointmentState
from app.models.auth import User, UserRole
from app.models.finanzas import FinancialTransaction, Payment, CommissionAgreement, CommissionState
from app.schemas.finanzas import (
    FinancialReportResponse,
    PaymentCreate,
    PaymentResponse,
    CommissionAgreementPropose,
    CommissionAgreementRespond,
    CommissionAgreementResponse,
)
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
    "/finanzas/report/export",
    summary="Exportar reporte financiero en formato CSV",
)
async def export_financial_report(
    professional_id: Optional[int] = Query(None, description="ID del profesional para filtrar"),
    fecha_inicio: Optional[datetime] = Query(None, description="Fecha de inicio para filtrar (ISO 8601)"),
    fecha_fin: Optional[datetime] = Query(None, description="Fecha de fin para filtrar (ISO 8601)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Busca las citas con estado 'pagado' que pertenezcan a la clínica del usuario actual,
    aplica filtros de profesional y fechas si se especifican, y retorna un
    StreamingResponse (CSV) estructurado con codificación utf-8-sig y delimitador ';'.
    """
    if not current_user.clinic_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario no tiene una clínica asociada.",
        )

    # Construir consulta
    stmt = (
        select(
            Appointment,
            Patient,
            Professional,
            MedicalTag,
            FinancialTransaction
        )
        .select_from(Appointment)
        .join(Patient, Patient.id == Appointment.patient_id)
        .join(Professional, Professional.id == Appointment.professional_id)
        .outerjoin(MedicalTag, MedicalTag.id == Appointment.tag_id)
        .join(Payment, Payment.appointment_id == Appointment.id)
        .join(FinancialTransaction, FinancialTransaction.payment_id == Payment.id)
        .where(Professional.clinic_id == current_user.clinic_id)
        .where(Appointment.estado == AppointmentState.PAGADO)
    )

    if professional_id:
        stmt = stmt.where(Appointment.professional_id == professional_id)
    if fecha_inicio:
        stmt = stmt.where(func.lower(Appointment.rango_horario) >= fecha_inicio)
    if fecha_fin:
        stmt = stmt.where(func.lower(Appointment.rango_horario) <= fecha_fin)

    stmt = stmt.order_by(func.lower(Appointment.rango_horario).asc())
    
    result = await db.execute(stmt)
    rows = result.all()

    def generate_csv():
        output = io.StringIO()
        writer = csv.writer(output, delimiter=";")
        
        # Cabecera exacta
        writer.writerow([
            "Fecha",
            "Paciente",
            "Profesional",
            "Tipo de Consulta/Etiqueta",
            "Valor Total",
            "Ingreso Profesional"
        ])
        yield output.getvalue().encode("utf-8-sig")
        output.truncate(0)
        output.seek(0)
        
        for apt, pat, prof, tag, tx in rows:
            fecha_str = apt.fecha_inicio.strftime("%Y-%m-%d %H:%M") if apt.fecha_inicio else ""
            tag_name = tag.nombre if tag else "Consulta General"
            
            writer.writerow([
                fecha_str,
                pat.nombre,
                prof.nombre,
                tag_name,
                f"{int(tx.monto_total)}",
                f"{int(tx.monto_profesional)}"
            ])
            yield output.getvalue().encode("utf-8-sig")
            output.truncate(0)
            output.seek(0)

    headers = {
        "Content-Disposition": f'attachment; filename="reporte_financiero.csv"',
        "Content-Type": "text/csv; charset=utf-8-sig"
    }

    return StreamingResponse(generate_csv(), headers=headers)
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


# ---------------------------------------------
# Endpoints para Negociación de Comisiones
# ---------------------------------------------
@router.post(
    "/finance/commission/propose",
    response_model=CommissionAgreementResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Proponer un nuevo porcentaje de comisión para un profesional",
)
async def propose_commission(
    payload: CommissionAgreementPropose,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CommissionAgreement:
    """
    Permite al Administrador del Centro proponer un nuevo acuerdo de comisión a un profesional.
    El acuerdo inicia en estado 'PENDIENTE'.
    """
    if current_user.rol != UserRole.ADMIN_CENTRO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores del centro pueden proponer acuerdos de comisión.",
        )

    if not current_user.clinic_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El administrador no tiene una clínica asociada.",
        )

    # Validar que el profesional exista y pertenezca a la misma clínica
    prof_stmt = select(Professional).where(Professional.id == payload.professional_id)
    prof_res = await db.execute(prof_stmt)
    professional = prof_res.scalar_one_or_none()

    if not professional:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El profesional especificado no existe.",
        )

    if professional.clinic_id != current_user.clinic_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para proponer comisiones a profesionales de otras clínicas.",
        )

    # Crear el acuerdo
    agreement = CommissionAgreement(
        clinic_id=current_user.clinic_id,
        professional_id=payload.professional_id,
        porcentaje_propuesto=payload.porcentaje_propuesto,
        estado=CommissionState.PENDIENTE,
        fecha_propuesta=datetime.now(),
    )
    db.add(agreement)
    await db.commit()
    await db.refresh(agreement)
    return agreement


@router.put(
    "/finance/commission/respond/{agreement_id}",
    response_model=CommissionAgreementResponse,
    status_code=status.HTTP_200_OK,
    summary="Aceptar o rechazar una propuesta de comisión",
)
async def respond_commission(
    agreement_id: int,
    payload: CommissionAgreementRespond,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CommissionAgreement:
    """
    Permite al profesional médico aceptar o rechazar un acuerdo de comisión propuesto.
    """
    if current_user.rol != UserRole.PROFESIONAL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los profesionales médicos pueden responder a las propuestas de comisión.",
        )

    # Obtener el acuerdo
    agree_stmt = select(CommissionAgreement).where(CommissionAgreement.id == agreement_id)
    agree_res = await db.execute(agree_stmt)
    agreement = agree_res.scalar_one_or_none()

    if not agreement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La propuesta de acuerdo especificada no existe.",
        )

    # Validar que pertenezca al profesional logueado
    prof_stmt = select(Professional).where(Professional.user_id == current_user.id)
    prof_res = await db.execute(prof_stmt)
    professional = prof_res.scalar_one_or_none()

    if not professional or agreement.professional_id != professional.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para responder a esta propuesta de comisión.",
        )

    if agreement.estado != CommissionState.PENDIENTE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta propuesta ya ha sido respondida previamente.",
        )

    # Actualizar estado y fecha
    agreement.estado = payload.estado
    agreement.fecha_respuesta = datetime.now()

    # Si se acepta, actualizar el porcentaje actual del profesional para coherencia
    if payload.estado == CommissionState.ACEPTADO:
        professional.comision_porcentaje = agreement.porcentaje_propuesto

    await db.commit()
    await db.refresh(agreement)
    return agreement


@router.get(
    "/finance/commission/agreements",
    response_model=List[CommissionAgreementResponse],
    status_code=status.HTTP_200_OK,
    summary="Obtener el historial de acuerdos de comisión",
)
async def get_commission_agreements(
    professional_id: Optional[int] = Query(None, description="Filtrar por profesional (solo Admin)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[CommissionAgreement]:
    """
    Obtiene el listado de propuestas de comisión según el rol:
    - Admin Centro: Todas las propuestas de su clínica (opcionalmente filtrado por profesional).
    - Profesional: Sus propias propuestas de comisión.
    """
    if current_user.rol == UserRole.ADMIN_CENTRO:
        if not current_user.clinic_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El administrador no tiene una clínica asociada.",
            )
        stmt = select(CommissionAgreement).where(CommissionAgreement.clinic_id == current_user.clinic_id)
        if professional_id:
            stmt = stmt.where(CommissionAgreement.professional_id == professional_id)

    elif current_user.rol == UserRole.PROFESIONAL:
        prof_stmt = select(Professional).where(Professional.user_id == current_user.id)
        prof_res = await db.execute(prof_stmt)
        professional = prof_res.scalar_one_or_none()

        if not professional:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El perfil profesional del usuario no existe.",
            )
        stmt = select(CommissionAgreement).where(CommissionAgreement.professional_id == professional.id)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Rol no autorizado para visualizar acuerdos de comisión.",
        )

    stmt = stmt.order_by(CommissionAgreement.id.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())

