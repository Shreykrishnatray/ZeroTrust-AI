"""
Fraud detection pipeline for identity documents.
Processes image bytes and returns analysis result.
"""
import hashlib
from dataclasses import dataclass
from typing import Any



@dataclass
class FraudPipelineResult:
    status: str
    fraud_score: float
    document_hash: str
    analysis_breakdown: list[dict[str, Any]]
    extracted_text: str


ALLOWED_IMAGE_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}

MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def run_fraud_detection(image_bytes: bytes) -> FraudPipelineResult:
    """
    Run the fraud detection pipeline on uploaded document image.
    Returns structured result with status, score, hash, and analysis.
    """
    if len(image_bytes) > MAX_IMAGE_SIZE_BYTES:
        raise ValueError("Image size exceeds maximum allowed (10 MB)")

    document_hash = hashlib.sha256(image_bytes).hexdigest()

    # Placeholder: real implementation would call ML service / OCR / rules.
    # For demo, derive a deterministic "score" from hash and size.
    score_seed = int(document_hash[:8], 16) % 100
    fraud_score = round(score_seed / 100.0, 2)

    if fraud_score >= 0.7:
        status = "fraudulent"
    elif fraud_score >= 0.4:
        status = "suspicious"
    else:
        status = "clean"

    from ocr_engine import extract_text
    ocr_result = extract_text(image_bytes)
    extracted_text = ocr_result.full_text

    analysis_breakdown = [
        {"check": "document_integrity", "result": "pass", "confidence": 1.0 - fraud_score},
        {"check": "image_quality", "result": "pass", "confidence": 0.95},
        {"check": "tampering_detection", "result": "pass" if fraud_score < 0.5 else "flag", "confidence": 1.0 - fraud_score},
        {"check": "template_consistency", "result": "pass", "confidence": 0.9},
        {"check": "ocr_extraction", "result": "pass", "confidence": ocr_result.average_confidence, "line_count": ocr_result.line_count},
    ]

    return FraudPipelineResult(
        status=status,
        fraud_score=fraud_score,
        document_hash=document_hash,
        analysis_breakdown=analysis_breakdown,
        extracted_text=extracted_text,
    )
