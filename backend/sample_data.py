"""Synthetic brain-slice pair generator for the 'Load example' button.

Produces a fixed/moving pair where the moving image is the fixed image put through
a known smooth elastic deformation. Because the deformation is non-rigid, the live
registration has something real to recover — and the Dice score visibly improves.

This is the same trick Phase 1/2 used to validate the pipeline before real OASIS
data: a controlled deformation with a known answer.
"""

from __future__ import annotations

import numpy as np
from skimage.transform import warp

SIZE = 192


def _phantom(size: int = SIZE) -> np.ndarray:
    """A simple brain-like phantom: skull ellipse, two ventricles, some texture."""
    yy, xx = np.mgrid[0:size, 0:size]
    cy = cx = size / 2
    img = np.zeros((size, size), dtype=np.float32)

    # outer brain (filled ellipse)
    brain = (((xx - cx) / (size * 0.36)) ** 2 + ((yy - cy) / (size * 0.44)) ** 2) < 1
    img[brain] = 0.55

    # cortical band (slightly brighter rim)
    inner = (((xx - cx) / (size * 0.30)) ** 2 + ((yy - cy) / (size * 0.38)) ** 2) < 1
    img[brain & ~inner] = 0.75

    # two lateral ventricles (dark)
    for sign in (-1, 1):
        vc = cx + sign * size * 0.10
        vent = (((xx - vc) / (size * 0.05)) ** 2
                + ((yy - cy) / (size * 0.16)) ** 2) < 1
        img[vent] = 0.15

    # gentle sulci-like texture inside the brain
    texture = 0.06 * np.sin(xx / 6.0) * np.cos(yy / 7.0)
    img[inner] += texture[inner]
    return np.clip(img, 0, 1)


def _smooth_field(size: int, seed_scale: float, amp: float):
    """A smooth random displacement field via low-frequency sinusoids (deterministic)."""
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    v = amp * np.sin(2 * np.pi * (yy / size) * seed_scale + 0.7) \
        * np.cos(2 * np.pi * (xx / size) * (seed_scale + 1))
    u = amp * np.cos(2 * np.pi * (yy / size) * (seed_scale + 1) + 1.3) \
        * np.sin(2 * np.pi * (xx / size) * seed_scale)
    return v.astype(np.float32), u.astype(np.float32)


def make_pair(size: int = SIZE):
    """Return (fixed, moving) float images in [0, 1]."""
    fixed = _phantom(size)
    v, u = _smooth_field(size, seed_scale=1.5, amp=size * 0.035)

    rows, cols = fixed.shape
    rc, cc = np.meshgrid(np.arange(rows), np.arange(cols), indexing="ij")
    coords = np.array([rc + v, cc + u])
    moving = warp(fixed, coords, order=1, mode="edge", preserve_range=True)
    return fixed.astype(np.float32), moving.astype(np.float32)
