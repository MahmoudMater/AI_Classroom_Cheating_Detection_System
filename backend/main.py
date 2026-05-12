from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import Settings
from core.database import init_db
from routers import analyze, events, health, model_catalog, sessions, stream
from services.frame_broadcaster import FrameBroadcaster
from services.session_manager import SessionManager

logger = logging.getLogger(__name__)
settings = Settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    import asyncio

    fb: FrameBroadcaster = app.state.frame_broadcaster
    fb.set_loop(asyncio.get_running_loop())
    await init_db()
    await fb.start_consumer()
    logger.info("API ready")
    yield
    await app.state.session_manager.stop_all()
    await fb.stop_consumer()


app = FastAPI(title="Proctoring API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def internal_error_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except HTTPException:
        raise
    except RequestValidationError:
        raise
    except Exception as exc:
        logger.exception("unhandled error: %s", exc)
        return JSONResponse(
            status_code=500,
            content={"error": "internal_server_error", "detail": str(exc)},
        )


app.state.session_manager = SessionManager()
app.state.frame_broadcaster = FrameBroadcaster()

app.include_router(sessions.router, prefix="/api/v1")
app.include_router(events.router, prefix="/api/v1")
app.include_router(model_catalog.router, prefix="/api/v1")
app.include_router(analyze.router, prefix="/api/v1")
app.include_router(stream.router)
app.include_router(health.router)


@app.get("/")
async def root() -> dict[str, str]:
    return {"service": "proctoring-api", "version": settings.API_VERSION}
