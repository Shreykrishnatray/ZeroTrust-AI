"""
ZeroTrust AI – OCR engine for identity document images.
Uses EasyOCR to extract text and return it in a structured format.
"""
import io
import logging
from dataclasses import dataclass, field

import easyocr
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# Default languages for identity documents (expand as needed)
DEFAULT_LANGUAGES = ["en"]


@dataclass
class TextLine:
    """Single line of extracted text with position and confidence."""

    text: str
    confidence: float
    bbox: list[list[float]]  # [[x1,y1], [x2,y2], ...] in image coordinates


@dataclass
class OcrResult:
    """Structured OCR output for a document image."""

    full_text: str
    lines: list[TextLine] = field(default_factory=list)
    line_count: int = 0
    average_confidence: float = 0.0
    language: str = "en"

    def to_dict(self) -> dict:
        """Serialize to a JSON-friendly dict."""
        return {
            "full_text": self.full_text,
            "lines": [
                {
                    "text": line.text,
                    "confidence": round(line.confidence, 4),
                    "bbox": line.bbox,
                }
                for line in self.lines
            ],
            "line_count": self.line_count,
            "average_confidence": round(self.average_confidence, 4),
            "language": self.language,
        }


# Lazy-loaded reader to avoid loading model on import
_reader: easyocr.Reader | None = None


def _get_reader(languages: list[str] | None = None) -> easyocr.Reader:
    global _reader
    if _reader is None:
        _reader = easyocr.Reader(languages or DEFAULT_LANGUAGES, gpu=False, verbose=False)
    return _reader


def image_bytes_to_array(image_bytes: bytes) -> np.ndarray:
    """Decode image bytes to RGB numpy array for EasyOCR."""
    img = Image.open(io.BytesIO(image_bytes))
    img = img.convert("RGB")
    return np.array(img)


def extract_text(
    image_bytes: bytes,
    languages: list[str] | None = None,
) -> OcrResult:
    """
    Run EasyOCR on document image bytes and return structured text.

    Args:
        image_bytes: Raw image bytes (JPEG, PNG, etc.).
        languages: List of language codes (e.g. ["en"]). Uses DEFAULT_LANGUAGES if None.

    Returns:
        OcrResult with full_text, lines (text, confidence, bbox), line_count, average_confidence.
    """
    if not image_bytes or len(image_bytes) == 0:
        return OcrResult(
            full_text="",
            lines=[],
            line_count=0,
            average_confidence=0.0,
            language=(languages or DEFAULT_LANGUAGES)[0],
        )

    try:
        img_array = image_bytes_to_array(image_bytes)
    except Exception as e:
        logger.warning("Failed to decode image for OCR: %s", e)
        return OcrResult(
            full_text="",
            lines=[],
            line_count=0,
            average_confidence=0.0,
            language=(languages or DEFAULT_LANGUAGES)[0],
        )

    reader = _get_reader(languages or DEFAULT_LANGUAGES)
    # readtext returns list of (bbox, text, confidence)
    raw_results = reader.readtext(img_array)

    lines: list[TextLine] = []
    confidences: list[float] = []

    for bbox, text, confidence in raw_results:
        if not text or not text.strip():
            continue
        # bbox from EasyOCR is list of 4 [x,y] points
        bbox_list = [[float(p[0]), float(p[1])] for p in bbox]
        lines.append(
            TextLine(
                text=text.strip(),
                confidence=float(confidence),
                bbox=bbox_list,
            )
        )
        confidences.append(float(confidence))

    full_text = "\n".join(line.text for line in lines)
    average_confidence = sum(confidences) / len(confidences) if confidences else 0.0
    lang = (languages or DEFAULT_LANGUAGES)[0]

    return OcrResult(
        full_text=full_text,
        lines=lines,
        line_count=len(lines),
        average_confidence=average_confidence,
        language=lang,
    )
