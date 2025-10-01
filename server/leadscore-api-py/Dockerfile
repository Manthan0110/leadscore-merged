# server/Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --upgrade pip
COPY . /app
# Cloud Run expects the app to listen on $PORT (default 8080)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
