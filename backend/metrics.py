"""Quantitative metrics and visualization rendering for a registration result.

Dice is computed exactly the way the research does it: build a binary mask for the
fixed and the (moving / registered) image, then measure overlap. In the research a
*segmentation label* defines the mask; here, with arbitrary uploaded slices, we
derive the mask by Otsu thresholding the brain foreground. The number is therefore
a real overlap score on the same scale (0-1), shown as before -> after.

Figures are rendered on a dark "viewer" background to match the imaging-workstation
look of the frontend.
"""

from __future__ import annotations

import base64
import io

import matplotlib

matplotlib.use("Agg")  # headless rendering
import matplotlib.pyplot as plt
import numpy as np
from skimage.filters import threshold_otsu

# Dark imaging-viewer palette (matches the frontend frames).
_BG = "#0c0c0f"
_FG = "#cfccc2"
_GRID = "#5cc6e6"


def _mask(img: np.ndarray) -> np.ndarray:
    """Foreground (brain) mask via Otsu; robust to all-zero inputs."""
    if img.max() <= img.min():
        return np.zeros(img.shape, dtype=bool)
    try:
        t = threshold_otsu(img)
    except Exception:
        t = 0.5
    return img > t


def dice(a: np.ndarray, b: np.ndarray) -> float:
    """Dice overlap of two grayscale images' foreground masks."""
    ma, mb = _mask(a), _mask(b)
    inter = np.logical_and(ma, mb).sum()
    denom = ma.sum() + mb.sum()
    if denom == 0:
        return 0.0
    return float(2.0 * inter / denom)


def jacobian_determinant(v: np.ndarray, u: np.ndarray) -> np.ndarray:
    """Jacobian determinant of the displacement field.

    <1 = local shrinkage, >1 = local expansion. This is the same quantity Phase 4
    summarizes inside the hippocampus for dementia detection.
    """
    dvdr, dvdc = np.gradient(v)
    dudr, dudc = np.gradient(u)
    # J = [[1 + du/dc, du/dr], [dv/dc, 1 + dv/dr]]
    jac = (1 + dudc) * (1 + dvdr) - (dudr * dvdc)
    return jac


def fraction_folding(jac: np.ndarray) -> float:
    """Fraction of pixels with non-positive Jacobian (folded / non-diffeomorphic)."""
    return float((jac <= 0).mean())


# --- PNG renderers (return base64 data URIs the frontend can <img src> directly) ---

def _new_fig():
    fig, ax = plt.subplots(figsize=(3.4, 3.4))
    fig.patch.set_facecolor(_BG)
    ax.set_facecolor(_BG)
    return fig, ax


def _fig_to_data_uri(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(
        buf,
        format="png",
        bbox_inches="tight",
        pad_inches=0.04,
        dpi=130,
        facecolor=fig.get_facecolor(),
    )
    plt.close(fig)
    buf.seek(0)
    b64 = base64.b64encode(buf.read()).decode("ascii")
    return f"data:image/png;base64,{b64}"


def render_gray(img: np.ndarray, title: str | None = None) -> str:
    fig, ax = _new_fig()
    ax.imshow(img, cmap="gray", vmin=0, vmax=1)
    ax.axis("off")
    if title:
        ax.set_title(title, fontsize=9, color=_FG)
    return _fig_to_data_uri(fig)


def render_difference(a: np.ndarray, b: np.ndarray, title: str | None = None) -> str:
    """Signed difference heatmap, e.g. fixed - moving vs fixed - registered."""
    diff = np.asarray(a, dtype=np.float32) - np.asarray(b, dtype=np.float32)
    lim = max(float(np.abs(diff).max()), 1e-6)
    fig, ax = _new_fig()
    ax.imshow(diff, cmap="RdBu_r", vmin=-lim, vmax=lim)
    ax.axis("off")
    if title:
        ax.set_title(title, fontsize=9, color=_FG)
    return _fig_to_data_uri(fig)


def render_deformation_grid(v: np.ndarray, u: np.ndarray, step: int = 8) -> str:
    """Warped regular grid — the classic 'how space was deformed' visualization."""
    rows, cols = v.shape
    fig, ax = _new_fig()

    for c in range(0, cols, step):
        rr = np.arange(rows)
        cc = c + u[rr, np.full_like(rr, c)]
        ax.plot(cc, rr, color=_GRID, linewidth=0.5, alpha=0.9)
    for r in range(0, rows, step):
        cc = np.arange(cols)
        rr = r + v[np.full_like(cc, r), cc]
        ax.plot(cc, rr, color=_GRID, linewidth=0.5, alpha=0.9)

    ax.set_xlim(0, cols)
    ax.set_ylim(rows, 0)
    ax.axis("off")
    return _fig_to_data_uri(fig)


def render_jacobian(jac: np.ndarray) -> str:
    """Jacobian-determinant heatmap (shrink vs expand)."""
    fig, ax = _new_fig()
    im = ax.imshow(jac, cmap="coolwarm", vmin=0, vmax=2)
    ax.axis("off")
    cbar = fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    cbar.ax.yaxis.set_tick_params(color=_FG, labelcolor=_FG)
    cbar.outline.set_edgecolor(_FG)
    for t in cbar.ax.get_yticklabels():
        t.set_fontsize(7)
    return _fig_to_data_uri(fig)
