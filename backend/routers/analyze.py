from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from core.config import Settings
from core.dependencies import get_settings
from models.schemas import ImageAnalysisResult
from services import image_analysis

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analyze-image", tags=["analyze"])


@router.post("")
async def analyze_image(
    file: UploadFile = File(...),
    model_file: str | None = Form(default=None),
    settings: Settings = Depends(get_settings),
) -> ImageAnalysisResult:
    try:
        raw = await file.read()
        mf = model_file or settings.BEST_MODEL_FILE
        data = image_analysis.analyze_image_bytes(raw, model_dir=settings.MODEL_DIR, model_file=mf)
        return ImageAnalysisResult.model_validate(data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    except Exception as e:
        logger.exception("analyze_image: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)) from e
