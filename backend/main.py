"""FastAPI backend for the MRI Registration web demo.

Endpoints
    GET  /health            -> liveness + active engine
    GET  /sample            -> a ready-made fixed/moving example pair (base64 PNGs)
    POST /register          -> register an uploaded (or sample) pair, return
                               registered image, deformation grid, Jacobian,
                               difference maps and Dice before/after.

The heavy lifting lives in registration.py (engine) and metrics.py (scoring +
rendering). This file is just the HTTP/glue layer, kept thin so the engine can be
swapped without touching it.
"""

from __future__ import annotations

import io

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

import metrics
import sample_data
from registration import get_engine

app = FastAPI(title="MRI.Zi — Deformable Registration API", version="1.0.0")

# Next.js dev server origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ENGINE_NAME = "classical-tvl1"
TARGET_SIZE = 192  # inputs are resized to this square for a fast, consistent demo


def _load_image_to_array(data: bytes) -> np.ndarray:
    """Decode uploaded bytes -> grayscale float [0,1], resized to TARGET_SIZE."""
    try:
        img = Image.open(io.BytesIO(data)).convert("L")
    except Exception as exc:
        raise HTTPException(status_code=400,
                            detail=f"could not read image: {exc}") from exc
    img = img.resize((TARGET_SIZE, TARGET_SIZE), Image.BILINEAR)
    arr = np.asarray(img, dtype=np.float32) / 255.0
    return arr


def _resize_array(arr: np.ndarray) -> np.ndarray:
    img = Image.fromarray((np.clip(arr, 0, 1) * 255).astype("uint8"))
    img = img.resize((TARGET_SIZE, TARGET_SIZE), Image.BILINEAR)
    return np.asarray(img, dtype=np.float32) / 255.0


def _run_registration(fixed: np.ndarray, moving: np.ndarray) -> dict:
    """Core: register, score, render — shared by /register and /sample."""
    engine = get_engine(ENGINE_NAME)
    res = engine.register(fixed, moving)

    dice_before = metrics.dice(res.fixed, res.moving)
    dice_after = metrics.dice(res.fixed, res.registered)
    jac = metrics.jacobian_determinant(res.v, res.u)

    improvement = dice_after - dice_before
    pct = (improvement / dice_before * 100.0) if dice_before > 0 else 0.0

    return {
        "engine": res.engine,
        "metrics": {
            "dice_before": round(dice_before, 4),
            "dice_after": round(dice_after, 4),
            "improvement": round(improvement, 4),
            "improvement_pct": round(pct, 1),
            "folding_fraction": round(metrics.fraction_folding(jac), 5),
            "mean_displacement": round(
                float(np.mean(np.sqrt(res.v ** 2 + res.u ** 2))), 3
            ),
        },
        "images": {
            "fixed": metrics.render_gray(res.fixed),
            "moving": metrics.render_gray(res.moving),
            "registered": metrics.render_gray(res.registered),
            "diff_before": metrics.render_difference(res.fixed, res.moving),
            "diff_after": metrics.render_difference(res.fixed, res.registered),
            "deformation_grid": metrics.render_deformation_grid(res.v, res.u),
            "jacobian": metrics.render_jacobian(jac),
        },
    }


@app.get("/health")
def health():
    return {"status": "ok", "engine": ENGINE_NAME, "target_size": TARGET_SIZE}


@app.get("/sample")
def sample():
    """A synthetic example pair so the UI works with zero uploads."""
    fixed, moving = sample_data.make_pair(TARGET_SIZE)
    return {
        "fixed": metrics.render_gray(fixed),
        "moving": metrics.render_gray(moving),
    }


@app.post("/register")
async def register(
    fixed: UploadFile | None = File(default=None),
    moving: UploadFile | None = File(default=None),
    use_sample: str = Form(default="false"),
):
    """Register a moving image to a fixed image.

    Either upload both `fixed` and `moving`, or pass use_sample=true to register
    the built-in synthetic example.
    """
    if use_sample.lower() == "true":
        f_arr, m_arr = sample_data.make_pair(TARGET_SIZE)
    else:
        if fixed is None or moving is None:
            raise HTTPException(
                status_code=400,
                detail="provide both 'fixed' and 'moving' images, or use_sample=true",
            )
        f_arr = _load_image_to_array(await fixed.read())
        m_arr = _load_image_to_array(await moving.read())

    return _run_registration(f_arr, m_arr)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
