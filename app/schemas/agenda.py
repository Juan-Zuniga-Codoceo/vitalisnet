from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator
from typing_extensions import Self

from app.models.agenda import AppointmentState


# ---------------------------------------------
# Esquemas para Clinic (Centro Médico)
# ---------------------------------------------
class ClinicBase(BaseModel):
    nombre: str = Field(..., max_length=150, description="Nombre de la clínica")
    rut_empresa: str = Field(..., max_length=20, description="RUT de la empresa (único)")
    direccion: Optional[str] = Field(None, max_length=255, description="Dirección física")


class ClinicCreate(ClinicBase):
    pass


class ClinicUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=150)
    rut_empresa: Optional[str] = Field(None, max_length=20)
    direccion: Optional[str] = Field(None, max_length=255)


class ClinicResponse(ClinicBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---------------------------------------------
# Esquemas para Professional (Médicos / Profesionales)
# ---------------------------------------------
class ProfessionalBase(BaseModel):
    nombre: str = Field(..., max_length=150, description="Nombre completo del profesional")
    especialidad: str = Field(..., max_length=100, description="Especialidad médica")
    email: EmailStr = Field(..., description="Email de contacto institucional")
    comision_porcentaje: float = Field(default=70.00, ge=0.0, le=100.0, description="Porcentaje de comisión del profesional")
    clinic_id: int = Field(..., description="ID de la clínica a la que pertenece")
    user_id: Optional[int] = Field(None, description="ID del usuario de credenciales (opcional)")


class ProfessionalCreate(ProfessionalBase):
    pass


class ProfessionalUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=150)
    especialidad: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    comision_porcentaje: Optional[float] = Field(None, ge=0.0, le=100.0)
    clinic_id: Optional[int] = None
    user_id: Optional[int] = Field(None)


class ProfessionalResponse(ProfessionalBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---------------------------------------------
# Esquemas para Patient (Pacientes)
# ---------------------------------------------
class PatientBase(BaseModel):
    nombre: str = Field(..., max_length=150, description="Nombre completo del paciente")
    rut: str = Field(..., max_length=20, description="RUT del paciente (único)")
    email: EmailStr = Field(..., description="Email del paciente")
    telefono: str = Field(..., max_length=20, description="Teléfono del paciente")


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=150)
    rut: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    telefono: Optional[str] = Field(None, max_length=20)


class PatientResponse(PatientBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---------------------------------------------
# Esquemas para Appointment (Citas Médicas)
# ---------------------------------------------
class AppointmentBase(BaseModel):
    professional_id: int
    patient_id: int
    precio: float = Field(..., gt=0, description="Precio de la cita médica")
    estado: AppointmentState = Field(default=AppointmentState.PENDIENTE, description="Estado de la cita")


class AppointmentCreate(AppointmentBase):
    fecha_inicio: datetime = Field(..., description="Fecha y hora de inicio de la cita")
    fecha_fin: datetime = Field(..., description="Fecha y hora de término de la cita")

    @model_validator(mode="after")
    def verificar_fechas(self) -> Self:
        if self.fecha_inicio >= self.fecha_fin:
            raise ValueError("La fecha de inicio debe ser anterior a la fecha de término.")
        return self


class AppointmentUpdate(BaseModel):
    professional_id: Optional[int] = None
    patient_id: Optional[int] = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    precio: Optional[float] = Field(None, gt=0)
    estado: Optional[AppointmentState] = None

    @model_validator(mode="after")
    def verificar_fechas(self) -> Self:
        if self.fecha_inicio is not None and self.fecha_fin is not None:
            if self.fecha_inicio >= self.fecha_fin:
                raise ValueError("La fecha de inicio debe ser anterior a la fecha de término.")
        return self


class AppointmentResponse(AppointmentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    fecha_inicio: datetime
    fecha_fin: datetime
