from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status

from core.config import Settings
from core.dependencies import get_settings
from models.schemas import ModelFileInfo, ModelsListResponse

router = APIRouter(prefix="/models", tags=["models"])


@router.get("", response_model=ModelsListResponse)
async def list_model_files(settings: Settings = Depends(get_settings)) -> ModelsListResponse:
    root = Path(settings.MODEL_DIR)
    if not root.is_dir():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="MODEL_DIR does not exist")

    models: list[ModelFileInfo] = []
    for p in sorted(root.glob("*.pth")):
        if not p.is_file():
            continue
        try:
            size_mb = round(p.stat().st_size / (1024 * 1024), 2)
        except OSError:
            size_mb = 0.0
        models.append(ModelFileInfo(filename=p.name, path=str(p.resolve()), size_mb=size_mb))

    return ModelsListResponse(models=models)
