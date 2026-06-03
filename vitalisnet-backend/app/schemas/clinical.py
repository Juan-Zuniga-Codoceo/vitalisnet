from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ConsultationCreate(BaseModel):
    appointment_id: int = Field(..., description="ID de la cita médica asociada")
    motivo_consulta: str = Field(..., max_length=255, description="Motivo de la consulta médica")
    evolucion_dinamica: Dict[str, Any] = Field(
        default_factory=dict,
        description="Datos y variables clínicas dinámicas guardadas en formato JSONB"
    )


class ConsultationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    clinical_file_id: int
    appointment_id: int
    patient_id: int
    professional_id: int
    fecha_atencion: datetime
    motivo_consulta: str
    evolucion_dinamica: Dict[str, Any]


class ClinicalFileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    fecha_creacion: datetime
    consultations: List[ConsultationResponse] = []
