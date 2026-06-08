"""Deformable image registration engines.

The web demo runs a *classical* dense deformable registration (optical flow) so it
works on CPU with no trained weights. It is written behind a small interface
(`RegistrationEngine`) so a learned model (VoxelMorph / TransMorph) can be dropped
in later without changing the API or the frontend.

Mirrors the research pipeline:
    moving + fixed  ->  dense displacement field (u, v)  ->  warp moving  ->  Dice
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass

import numpy as np
from skimage.registration import optical_flow_tvl1
from skimage.transform import warp


@dataclass
class RegistrationResult:
    """Everything a single registration produces.

    Images are float arrays in [0, 1], shape (H, W). The displacement field maps
    output (registered) coordinates back to moving coordinates: for each pixel,
    (row + v, col + u) is sampled from the moving image.
    """

    fixed: np.ndarray
    moving: np.ndarray
    registered: np.ndarray
    v: np.ndarray  # vertical (row) displacement
    u: np.ndarray  # horizontal (col) displacement
    engine: str


class RegistrationEngine(ABC):
    """Interface every registration backend implements.

    To add a learned model, subclass this and return a RegistrationResult whose
    (v, u) come from the network's predicted deformation field. The metrics,
    visualizations and API layer stay identical.
    """

    name: str = "abstract"

    @abstractmethod
    def register(self, fixed: np.ndarray, moving: np.ndarray) -> RegistrationResult:
        ...


class ClassicalOpticalFlow(RegistrationEngine):
    """Dense deformable registration via TV-L1 optical flow.

    A genuine non-rigid registration: it estimates a per-pixel displacement field
    aligning `moving` to `fixed`, then warps `moving` by that field. No training
    or GPU required, so it runs live in the web demo.
    """

    name = "classical-tvl1"

    def __init__(self, attachment: float = 15.0, num_warp: int = 5,
                 num_iter: int = 10):
        # attachment: higher = follow the data more (sharper, less smooth field).
        self.attachment = attachment
        self.num_warp = num_warp
        self.num_iter = num_iter

    def register(self, fixed: np.ndarray, moving: np.ndarray) -> RegistrationResult:
        fixed = _as_gray_float(fixed)
        moving = _as_gray_float(moving)
        if fixed.shape != moving.shape:
            raise ValueError(
                f"fixed {fixed.shape} and moving {moving.shape} must match; "
                "the API resizes inputs to a common size before this call."
            )

        # Estimate the field that moves `moving` toward `fixed`.
        v, u = optical_flow_tvl1(
            fixed, moving,
            attachment=self.attachment,
            num_warp=self.num_warp,
            num_iter=self.num_iter,
        )

        registered = _apply_field(moving, v, u)
        return RegistrationResult(
            fixed=fixed, moving=moving, registered=registered,
            v=v, u=u, engine=self.name,
        )


# --- helpers -----------------------------------------------------------------

def _as_gray_float(img: np.ndarray) -> np.ndarray:
    """Coerce to a single-channel float32 image in [0, 1]."""
    arr = np.asarray(img)
    if arr.ndim == 3:
        arr = arr[..., :3].mean(axis=-1)  # RGB(A) -> gray
    arr = arr.astype(np.float32)
    lo, hi = float(arr.min()), float(arr.max())
    if hi > lo:
        arr = (arr - lo) / (hi - lo)
    else:
        arr = np.zeros_like(arr)
    return arr


def _apply_field(moving: np.ndarray, v: np.ndarray, u: np.ndarray) -> np.ndarray:
    """Warp `moving` by displacement (v, u) using bilinear sampling."""
    rows, cols = moving.shape
    row_coords, col_coords = np.meshgrid(
        np.arange(rows), np.arange(cols), indexing="ij"
    )
    coords = np.array([row_coords + v, col_coords + u])
    return warp(moving, coords, order=1, mode="edge", preserve_range=True)


def get_engine(name: str = "classical-tvl1") -> RegistrationEngine:
    """Factory. Extend this when a learned engine is added."""
    engines = {
        ClassicalOpticalFlow.name: ClassicalOpticalFlow,
    }
    if name not in engines:
        raise ValueError(f"unknown engine '{name}'. available: {list(engines)}")
    return engines[name]()
