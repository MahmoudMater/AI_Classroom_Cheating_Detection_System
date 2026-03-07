# AI Service (Flask)

AI microservice skeleton for monitoring and inference callbacks.

## Endpoints

- `GET /health`
- `POST /monitor/start`
- `POST /monitor/stop`
- `GET /monitor/status/<session_id>`
- `POST /infer/frame`

`/infer/frame` currently runs mock inference and can callback the backend at `POST /ai/alert`.

## Run locally

```bash
cd ai-service
cp .env.example .env
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m app.main
```
