# Python Engine for Investment Tools Hub

This folder contains Python microservices for analytics, simulation, and AI-driven features (e.g., Behavioral Nudge Engine).

## Structure

- `main.py` — Entrypoint for the FastAPI service
- `requirements.txt` — Python dependencies

## Quickstart

```sh
cd python-engine
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

## Endpoints
- `/health` — Health check
- `/nudge` — AI Behavioral Nudge endpoint (POST)

## Environment
- All secrets/config in `.env` (see `.env.example`)

---

See the main README for monorepo setup and orchestration.
