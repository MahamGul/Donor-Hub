# Donor Hub (scaffold)

This workspace contains a minimal scaffold for a Python backend (FastAPI) and a React frontend (Vite).

Backend (Python/FastAPI):

- Path: backend/
- Install & run:

```bash
python -m pip install -r backend/requirements.txt
uvicorn app.main:app --reload --port 8000 --app-dir backend/
```

Frontend (React + Vite):

- Path: frontend/
- Install & run:

```bash
cd frontend
npm install
npm run dev
```

If the backend runs on a different host/port, set `VITE_API_URL` before starting the frontend:

```bash
export VITE_API_URL=http://localhost:8000
npm run dev
```
