# for backend, pip install -r requirements.txt and uvicorn backend.app.main:app
# for frontend, cd frontend && npm install && npm run dev

FROM node:22-alpine as frontend-builder
WORKDIR /frontend

COPY frontend/package.json frontend/package-lock.json ./

RUN echo $NODE_ENV
RUN npm config set loglevel info
RUN npm install --verbose
COPY frontend/ .
RUN npm run build-only


FROM pytorch/pytorch:2.5.1-cuda12.4-cudnn9-runtime

WORKDIR /app/backend

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y git

COPY backend/pyproject.toml .
RUN pip install -e .

COPY backend/ .

WORKDIR /app

COPY --from=frontend-builder /frontend/dist ./static

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8010"]

# WORKDIR /app

# COPY testapp/ .

# RUN chmod +x entry.sh

# ENTRYPOINT ["./entry.sh"]