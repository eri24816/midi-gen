# for backend, pip install -r requirements.txt and uvicorn backend.app.main:app
# for frontend, cd frontend && npm install && npm run dev
FROM python:3.11

# WORKDIR /app

# COPY requirements.txt .
# RUN pip install -r requirements.txt

# COPY . .

# CMD ["uvicorn", "backend.app.main:app"]

WORKDIR /app

COPY testapp/ .

RUN chmod +x entry.sh

CMD ["./entry.sh"]