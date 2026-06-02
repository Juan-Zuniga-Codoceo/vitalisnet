import logging
from datetime import datetime

# Configurar logger estructurado
logger = logging.getLogger("app.notifications")


async def enviar_recordatorio_whatsapp(
    paciente_nombre: str,
    profesional_nombre: str,
    fecha_hora: datetime,
    enlace_confirmar: str,
) -> None:
    """
    Simula el envío de un recordatorio de cita por WhatsApp.
    Imprime en los logs/consola del contenedor el mensaje exacto formateado
    conforme a las directrices de comunicación de la sección 7.2 del Brand Book.
    """
    # Formatear fecha y hora al estándar chileno (DD/MM/AAAA y HH:MM)
    fecha_str = fecha_hora.strftime("%d/%m/%Y")
    hora_str = fecha_hora.strftime("%H:%M")

    # Generar enlace ficticio de reagendamiento a partir de la confirmación
    enlace_reagendar = enlace_confirmar.replace("/confirm/", "/reschedule/")

    # Plantilla oficial aprobada por el Brand Book (Sección 7.2)
    mensaje = (
        f"\n======================================================\n"
        f"🩺 *VitalisNet - Recordatorio*\n"
        f"Hola {paciente_nombre}, tienes una cita con {profesional_nombre}\n"
        f"el día {fecha_str} a las {hora_str}.\n\n"
        f"✅ Confirmar: {enlace_confirmar}\n"
        f"🔄 Reagendar: {enlace_reagendar}\n\n"
        f"No respondas a este mensaje. Es automático de VitalisNet.\n"
        f"======================================================"
    )

    # Imprimir en logs y consola Docker (flush=True asegura salida inmediata)
    logger.info("Enviando recordatorio de WhatsApp en segundo plano...")
    print(mensaje, flush=True)
