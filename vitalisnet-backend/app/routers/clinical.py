from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.agenda import Appointment, AppointmentState, Professional
from app.models.auth import User, UserRole
from app.models.clinical import ClinicalConsultation, ClinicalFile
from app.schemas.clinical import ClinicalFileResponse, ConsultationCreate, ConsultationResponse


router = APIRouter(tags=["Fichas Clínicas"])


@router.post(
    "/clinical/consultations",
    response_model=ConsultationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar la evolución de una atención médica",
)
async def create_consultation(
    consultation_in: ConsultationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ClinicalConsultation:
    # 1. Obtener la cita con su profesional y paciente asociado
    stmt = (
        select(Appointment)
        .options(selectinload(Appointment.professional))
        .where(Appointment.id == consultation_in.appointment_id)
    )
    result = await db.execute(stmt)
    appointment = result.scalar_one_or_none()

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La cita médica especificada no existe.",
        )

    professional = appointment.professional

    # 2. Validar que la cita no haya sido atendida previamente
    if appointment.estado == AppointmentState.ATENDIDO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta cita médica ya ha sido registrada como ATENDIDA.",
        )

    # 3. Validar permisos (RBAC)
    # - Si es PROFESIONAL: debe ser el profesional asignado a la cita
    # - Si es ADMIN_CENTRO: debe pertenecer a la clínica de la cita
    has_permission = False
    if current_user.rol == UserRole.PROFESIONAL:
        prof_stmt = select(Professional).where(Professional.user_id == current_user.id)
        prof_result = await db.execute(prof_stmt)
        user_prof = prof_result.scalar_one_or_none()
        if user_prof and user_prof.id == appointment.professional_id:
            has_permission = True
    elif current_user.rol == UserRole.ADMIN_CENTRO:
        if current_user.clinic_id == professional.clinic_id:
            has_permission = True

    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para registrar la evolución de esta cita médica.",
        )

    # 4. Buscar o crear el Historial Clínico (ClinicalFile) del paciente
    file_stmt = select(ClinicalFile).where(ClinicalFile.patient_id == appointment.patient_id)
    file_result = await db.execute(file_stmt)
    clinical_file = file_result.scalar_one_or_none()

    if not clinical_file:
        clinical_file = ClinicalFile(patient_id=appointment.patient_id)
        db.add(clinical_file)
        await db.flush()  # Generar id de la ficha clínica antes de asociarla

    # 5. Registrar la consulta clínica
    consultation = ClinicalConsultation(
        clinical_file_id=clinical_file.id,
        appointment_id=appointment.id,
        patient_id=appointment.patient_id,
        professional_id=appointment.professional_id,
        motivo_consulta=consultation_in.motivo_consulta,
        evolucion_dinamica=consultation_in.evolucion_dinamica,
    )
    db.add(consultation)

    # 6. Actualizar el estado de la cita a ATENDIDO
    appointment.estado = AppointmentState.ATENDIDO

    await db.commit()
    await db.refresh(consultation)
    return consultation


@router.get(
    "/clinical/patients/{patient_id}/history",
    response_model=ClinicalFileResponse,
    summary="Recuperar la cronología completa de atenciones de un paciente",
)
async def get_patient_history(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ClinicalFile:
    # 1. Obtener todas las citas del paciente para determinar su historial y clínicas/profesionales vinculados
    appointment_stmt = (
        select(Appointment)
        .options(selectinload(Appointment.professional))
        .where(Appointment.patient_id == patient_id)
    )
    appointment_result = await db.execute(appointment_stmt)
    appointments = appointment_result.scalars().all()

    if not appointments:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró historial clínico ni citas registradas para este paciente.",
        )

    # 2. Validar permisos (RBAC)
    # - Si es PROFESIONAL: debe tener o haber tenido al menos una cita con el paciente
    # - Si es ADMIN_CENTRO: debe ser administrador de la clínica de al menos una cita del paciente
    has_permission = False
    if current_user.rol == UserRole.PROFESIONAL:
        prof_stmt = select(Professional).where(Professional.user_id == current_user.id)
        prof_result = await db.execute(prof_stmt)
        user_prof = prof_result.scalar_one_or_none()
        if user_prof:
            prof_id = user_prof.id
            if any(appt.professional_id == prof_id for appt in appointments):
                has_permission = True
    elif current_user.rol == UserRole.ADMIN_CENTRO:
        clinic_id = current_user.clinic_id
        if any(appt.professional.clinic_id == clinic_id for appt in appointments):
            has_permission = True

    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para acceder al historial clínico de este paciente.",
        )

    # 3. Obtener la Ficha Clínica con su lista de consultas ordenadas descendentemente
    stmt = (
        select(ClinicalFile)
        .options(
            selectinload(ClinicalFile.consultations)
        )
        .where(ClinicalFile.patient_id == patient_id)
    )
    result = await db.execute(stmt)
    clinical_file = result.scalar_one_or_none()

    if not clinical_file:
        # Si tiene citas pero aún no tiene consultas registradas (ninguna evolución guardada),
        # creamos una ficha clínica vacía al vuelo para responder coherentemente.
        clinical_file = ClinicalFile(patient_id=patient_id)
        db.add(clinical_file)
        await db.commit()
        await db.refresh(clinical_file)
        
        # Recargar para asegurar la relación de consultas vacía
        stmt_empty = select(ClinicalFile).options(selectinload(ClinicalFile.consultations)).where(ClinicalFile.id == clinical_file.id)
        res_empty = await db.execute(stmt_empty)
        clinical_file = res_empty.scalar_one()

    return clinical_file
