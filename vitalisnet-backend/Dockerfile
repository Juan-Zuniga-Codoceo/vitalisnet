FROM python:3.11-slim

# Evitar que Python escriba archivos .pyc y asegurar salida de log inmediata
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /code

# Instalar dependencias necesarias para compilar algunos paquetes si fuera necesario
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copiar el código del proyecto
COPY . /code/

# Exponer el puerto de FastAPI
EXPOSE 8000

# Comando por defecto para iniciar uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
