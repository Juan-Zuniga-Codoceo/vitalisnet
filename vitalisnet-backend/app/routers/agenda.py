from typing import List
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import Range
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.auth import User
from app.dependencies.auth import get_current_user
from app.models.agenda import Appointment, Clinic, Patient, Professional
from app.schemas.agenda import (
    AppointmentCreate,
    AppointmentResponse,
    ClinicCreate,
    ClinicResponse,
    PatientCreate,
    PatientResponse,
    ProfessionalCreate,
    ProfessionalResponse,
)
from app.services.notifications import enviar_recordatorio_whatsapp

router = APIRouter(tags=["Agenda"])


# ---------------------------------------------
# Endpoints para Clínicas (Centros Médicos)
# ---------------------------------------------
@router.post(
    "/clinics",
    response_model=ClinicResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un centro médico",
)
async def create_clinic(clinic: ClinicCreate, db: AsyncSession = Depends(get_db)) -> Clinic:
    # Verificar si el RUT de empresa ya está registrado
    query = select(Clinic).where(Clinic.rut_empresa == clinic.rut_empresa)
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un centro médico registrado con este RUT.",
        )

    db_clinic = Clinic(**clinic.model_dump())
    db.add(db_clinic)
    try:
        await db.commit()
        await db.refresh(db_clinic)
    except IntegrityError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al registrar el centro médico: {str(e.orig)}",
        )
    return db_clinic


# ---------------------------------------------
# Endpoints para Profesionales
# ---------------------------------------------
@router.post(
    "/professionals",
    response_model=ProfessionalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un profesional y asociarlo a una clínica",
)
async def create_professional(
    professional: ProfessionalCreate, db: AsyncSession = Depends(get_db)
) -> Professional:
    # Verificar que el centro médico (clínica) exista
    clinic_query = select(Clinic).where(Clinic.id == professional.clinic_id)
    clinic_result = await db.execute(clinic_query)
    if not clinic_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El centro médico (clinic_id) especificado no existe.",
        )

    # Verificar si el correo ya está registrado para algún profesional
    email_query = select(Professional).where(Professional.email == professional.email)
    email_result = await db.execute(email_query)
    if email_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un profesional registrado con este correo electrónico.",
        )

    db_prof = Professional(**professional.model_dump())
    db.add(db_prof)
    try:
        await db.commit()
        await db.refresh(db_prof)
    except IntegrityError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al registrar al profesional: {str(e.orig)}",
        )
    return db_prof


@router.get(
    "/professionals",
    response_model=List[ProfessionalResponse],
    status_code=status.HTTP_200_OK,
    summary="Listar todos los profesionales de la clínica",
)
async def list_professionals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[Professional]:
    stmt = select(Professional)
    if current_user.clinic_id:
        stmt = stmt.where(Professional.clinic_id == current_user.clinic_id)
    res = await db.execute(stmt)
    return list(res.scalars().all())


# ---------------------------------------------
# Endpoints para Pacientes
# ---------------------------------------------
@router.post(
    "/patients",
    response_model=PatientResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar o buscar un paciente por su RUT",
)
async def create_or_get_patient(
    patient: PatientCreate, db: AsyncSession = Depends(get_db)
) -> Patient:
    # Buscar si el paciente ya existe en el sistema por su RUT
    query = select(Patient).where(Patient.rut == patient.rut)
    result = await db.execute(query)
    existing_patient = result.scalar_one_or_none()

    if existing_patient:
        # Idempotencia: si el paciente ya existe, se devuelve el registro existente
        # Nota: En un flujo de agendamiento rápido, esto evita excepciones de duplicados
        return existing_patient

    db_patient = Patient(**patient.model_dump())
    db.add(db_patient)
    try:
        await db.commit()
        await db.refresh(db_patient)
    except IntegrityError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al registrar al paciente: {str(e.orig)}",
        )
    return db_patient


# ---------------------------------------------
# Endpoints para Citas Médicas (Appointments)
# ---------------------------------------------
@router.post(
    "/appointments",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Agendar una cita médica",
)
async def create_appointment(
    appointment: AppointmentCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> Appointment:
    # 1. Validaciones previas de integridad lógica
    prof_query = select(Professional).where(Professional.id == appointment.professional_id)
    prof_result = await db.execute(prof_query)
    prof_obj = prof_result.scalar_one_or_none()
    if not prof_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El profesional especificado no existe.",
        )

    pat_query = select(Patient).where(Patient.id == appointment.patient_id)
    pat_result = await db.execute(pat_query)
    pat_obj = pat_result.scalar_one_or_none()
    if not pat_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El paciente especificado no existe.",
        )

    # 2. Construcción de modelo convirtiendo fechas al rango nativo (TSTZRANGE)
    db_appointment = Appointment(
        professional_id=appointment.professional_id,
        patient_id=appointment.patient_id,
        rango_horario=Range(appointment.fecha_inicio, appointment.fecha_fin),
        precio=appointment.precio,
        estado=appointment.estado,
    )

    db.add(db_appointment)
    try:
        await db.commit()
        await db.refresh(db_appointment)
    except IntegrityError as e:
        await db.rollback()

        # 3. Manejo de excepciones de conflicto y exclusión (double-booking)
        orig_err = e.orig
        sqlstate = getattr(orig_err, "sqlstate", None)
        constraint = getattr(orig_err, "constraint_name", None)

        # Código de estado PostgreSQL '23P11' corresponde a exclusion_violation
        if (
            sqlstate == "23P11"
            or constraint == "exclude_overlapping_appointments"
            or "exclude_overlapping_appointments" in str(orig_err)
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El profesional no tiene disponibilidad en el bloque horario seleccionado.",
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error de integridad de datos: {str(orig_err)}",
        )

    # 4. Encolar recordatorio por WhatsApp en segundo plano
    confirm_link = f"https://agenda.vitalisnet.cl/appointments/confirm/{db_appointment.id}"
    background_tasks.add_task(
        enviar_recordatorio_whatsapp,
        paciente_nombre=pat_obj.nombre,
        profesional_nombre=prof_obj.nombre,
        fecha_hora=appointment.fecha_inicio,
        enlace_confirmar=confirm_link,
    )

    return db_appointment
