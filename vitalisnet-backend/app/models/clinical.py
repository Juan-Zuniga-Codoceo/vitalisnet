from datetime import datetime
from typing import Any, Dict, List
from sqlalchemy import DateTime, ForeignKey, String, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ClinicalFile(Base):
    __tablename__ = "clinical_files"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), unique=True, nullable=False)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relaciones
    patient: Mapped["Patient"] = relationship("Patient")
    consultations: Mapped[List["ClinicalConsultation"]] = relationship(
        "ClinicalConsultation",
        back_populates="clinical_file",
        cascade="all, delete-orphan",
        order_by="desc(ClinicalConsultation.fecha_atencion)"
    )


class ClinicalConsultation(Base):
    __tablename__ = "clinical_consultations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    clinical_file_id: Mapped[int] = mapped_column(ForeignKey("clinical_files.id"), nullable=False)
    appointment_id: Mapped[int] = mapped_column(ForeignKey("appointments.id"), unique=True, nullable=False)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    professional_id: Mapped[int] = mapped_column(ForeignKey("professionals.id"), nullable=False)
    
    fecha_atencion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    motivo_consulta: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Campo JSONB con fallback a JSON para soporte local de SQLite en pruebas
    evolucion_dinamica: Mapped[Dict[str, Any]] = mapped_column(
        JSONB().with_variant(JSON, "sqlite"),
        nullable=False,
        default=dict
    )

    # Relaciones
    clinical_file: Mapped["ClinicalFile"] = relationship("ClinicalFile", back_populates="consultations")
    appointment: Mapped["Appointment"] = relationship("Appointment")
    patient: Mapped["Patient"] = relationship("Patient")
    professional: Mapped["Professional"] = relationship("Professional")
