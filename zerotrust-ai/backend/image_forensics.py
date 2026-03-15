"""
ZeroTrust AI – Image forgery / manipulation detection.
Uses OpenCV for Error Level Analysis, edge consistency, and noise inconsistency.
Returns a manipulation score in [0, 1] (higher = more likely manipulated).
"""
import io
import logging
from dataclasses import dataclass

import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# JPEG quality for ELA re-compression
ELA_QUALITY = 95
# Grid size for patch-based analysis (e.g. 4x4)
GRID_ROWS = 4
GRID_COLS = 4
# Weights for combining sub-scores (sum to 1.0)
WEIGHT_ELA = 0.40
WEIGHT_EDGE = 0.35
WEIGHT_NOISE = 0.25


@dataclass
class ForensicsResult:
    """Result of image forensics analysis."""

    manipulation_score: float  # 0.0 = likely authentic, 1.0 = likely manipulated
    ela_score: float
    edge_score: float
    noise_score: float


def _image_bytes_to_bgr(image_bytes: bytes) -> np.ndarray:
    """Decode image bytes to BGR numpy array for OpenCV."""
    img = Image.open(io.BytesIO(image_bytes))
    img = img.convert("RGB")
    arr = np.array(img)
    return cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)


def _error_level_analysis(bgr: np.ndarray) -> float:
    """
    Error Level Analysis: re-save at fixed JPEG quality and compare.
    Tampered regions often show different compression artifacts (higher error).
    Returns a score in [0, 1]; higher = more inconsistent (suspicious).
    """
    try:
        _, buf = cv2.imencode(".jpg", bgr, [cv2.IMWRITE_JPEG_QUALITY, ELA_QUALITY])
        recompressed = cv2.imdecode(buf, cv2.IMREAD_COLOR)
        if recompressed is None:
            return 0.0
        diff = cv2.absdiff(bgr, recompressed)
        gray_diff = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
        mean_val = np.mean(gray_diff)
        std_val = np.std(gray_diff)
        # High mean or high std suggests inconsistent compression (manipulation)
        # Normalize to rough 0-1 range (tune thresholds as needed)
        raw = (mean_val / 30.0) * 0.5 + (min(std_val / 40.0, 3.0) / 3.0) * 0.5
        return float(np.clip(raw, 0.0, 1.0))
    except Exception as e:
        logger.warning("ELA failed: %s", e)
        return 0.0


def _edge_consistency_score(bgr: np.ndarray) -> float:
    """
    Edge detection consistency: divide image into grid, compute edge density per cell.
    Inconsistency (high variance) across cells suggests splicing/tampering.
    Returns score in [0, 1]; higher = more inconsistent (suspicious).
    """
    try:
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        h, w = edges.shape
        cell_h, cell_w = max(1, h // GRID_ROWS), max(1, w // GRID_COLS)
        densities = []
        for r in range(GRID_ROWS):
            for c in range(GRID_COLS):
                y1, y2 = r * cell_h, min((r + 1) * cell_h, h)
                x1, x2 = c * cell_w, min((c + 1) * cell_w, w)
                cell = edges[y1:y2, x1:x2]
                if cell.size > 0:
                    densities.append(np.mean(cell) / 255.0)
        if len(densities) < 2:
            return 0.0
        std = np.std(densities)
        # Map std to 0-1 (e.g. std > 0.2 is quite inconsistent)
        raw = min(std / 0.25, 1.0)
        return float(np.clip(raw, 0.0, 1.0))
    except Exception as e:
        logger.warning("Edge consistency analysis failed: %s", e)
        return 0.0


def _noise_inconsistency_score(bgr: np.ndarray) -> float:
    """
    Noise inconsistency: estimate local noise (e.g. high-pass residual) per patch.
    Tampered regions may have different noise characteristics.
    Returns score in [0, 1]; higher = more inconsistent (suspicious).
    """
    try:
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY).astype(np.float32)
        blurred = cv2.GaussianBlur(gray, (5, 5), 1.0)
        residual = np.abs(gray - blurred)
        h, w = residual.shape
        cell_h, cell_w = max(1, h // GRID_ROWS), max(1, w // GRID_COLS)
        noise_levels = []
        for r in range(GRID_ROWS):
            for c in range(GRID_COLS):
                y1, y2 = r * cell_h, min((r + 1) * cell_h, h)
                x1, x2 = c * cell_w, min((c + 1) * cell_w, w)
                cell = residual[y1:y2, x1:x2]
                if cell.size > 0:
                    noise_levels.append(np.mean(cell))
        if len(noise_levels) < 2:
            return 0.0
        std = np.std(noise_levels)
        mean_noise = np.mean(noise_levels)
        # Coefficient of variation or normalized std
        norm_std = std / (mean_noise + 1e-6)
        raw = min(norm_std / 0.5, 1.0)
        return float(np.clip(raw, 0.0, 1.0))
    except Exception as e:
        logger.warning("Noise inconsistency analysis failed: %s", e)
        return 0.0


def detect_manipulation(image_bytes: bytes) -> ForensicsResult:
    """
    Run ELA, edge consistency, and noise inconsistency checks.
    Returns a combined manipulation score in [0, 1] and per-metric scores.
    """
    if not image_bytes or len(image_bytes) == 0:
        return ForensicsResult(
            manipulation_score=0.0,
            ela_score=0.0,
            edge_score=0.0,
            noise_score=0.0,
        )

    try:
        bgr = _image_bytes_to_bgr(image_bytes)
    except Exception as e:
        logger.warning("Failed to decode image for forensics: %s", e)
        return ForensicsResult(
            manipulation_score=0.0,
            ela_score=0.0,
            edge_score=0.0,
            noise_score=0.0,
        )

    ela_score = _error_level_analysis(bgr)
    edge_score = _edge_consistency_score(bgr)
    noise_score = _noise_inconsistency_score(bgr)

    manipulation_score = (
        WEIGHT_ELA * ela_score + WEIGHT_EDGE * edge_score + WEIGHT_NOISE * noise_score
    )
    manipulation_score = float(np.clip(manipulation_score, 0.0, 1.0))

    return ForensicsResult(
        manipulation_score=round(manipulation_score, 4),
        ela_score=round(ela_score, 4),
        edge_score=round(edge_score, 4),
        noise_score=round(noise_score, 4),
    )
