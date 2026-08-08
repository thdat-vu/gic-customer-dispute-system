# GCI Dispute Outcome Tracking Tool

Small internal tool for recording dispute outcomes and reviewing outcome trends.

## Prerequisites

- Python 3.14 and [uv](https://docs.astral.sh/uv/)
- Node.js 22+ and npm

## Run locally

Start the backend in one terminal:

```bash
cd backend
uv sync
uv run fastapi dev main.py
```

The backend is available at `http://localhost:8000`; Swagger UI is at
`http://localhost:8000/docs`.

Start the frontend in a second terminal:

```bash
cd frontend
npm ci
npm run dev
```

The frontend is available at `http://localhost:3000`.

## Validation

```bash
cd frontend && npm run lint
cd backend && uv run pytest
```

Backend tests and application features are added in later implementation milestones.
