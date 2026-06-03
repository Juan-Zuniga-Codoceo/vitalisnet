import json
import urllib.request
import urllib.error
from typing import Any, Dict
import os

class MercadoPagoService:
    def __init__(self):
        # Utilizar tokens configurados en .env o fallback a los extraídos de Operia
        self.access_token = os.getenv(
            "MP_ACCESS_TOKEN", 
            "APP_USR-141593074090820-030510-fd1708c834627d19f6c3784b90c8ef55-1374837402"
        )
        self.api_url = os.getenv("MP_API_URL", "https://api.mercadopago.com")
        self.webhook_url = os.getenv("MP_WEBHOOK_URL", "https://api.vitalisnet.synapsedev.cl/api/v1/payments/webhook")

    def crear_preferencia_suscripcion(self, plan_name: str = "Plan Mensual VitalisNet") -> Dict[str, Any]:
        """
        Crea una preferencia de suscripción recurrente en Mercado Pago
        con 30 días de prueba gratuita para el SaaS.
        """
        url = f"{self.api_url}/preapproval_plan"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        # Estructura del plan auto_recurring con periodo de prueba de 30 días
        payload = {
            "reason": f"Suscripción - {plan_name}",
            "auto_recurring": {
                "frequency": 1,
                "frequency_type": "months",
                "transaction_amount": 29990,  # $29.990 CLP
                "currency_id": "CLP",
                "has_trial": True,
                "trial_duration": 30
            },
            "back_url": "https://vitalisnet.synapsedev.cl/checkout/result"
        }
        
        req_data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=req_data, headers=headers, method="POST")
        
        try:
            with urllib.request.urlopen(req) as response:
                res_body = json.loads(response.read().decode("utf-8"))
                return {
                    "success": True,
                    "plan_id": res_body.get("id"),
                    "init_point": res_body.get("init_point"),
                    "sandbox_init_point": res_body.get("sandbox_init_point"),
                    "raw": res_body
                }
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            try:
                err_json = json.loads(err_body)
            except Exception:
                err_json = {"detail": err_body}
            print(f"❌ Error al crear plan en Mercado Pago: {err_json}")
            return {
                "success": False,
                "error": err_json
            }
        except Exception as e:
            print(f"❌ Error inesperado: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

# Instancia global del servicio
mercadopago_service = MercadoPagoService()
