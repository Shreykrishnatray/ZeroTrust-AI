"""
ZeroTrust AI – Identity Document Fraud Detection API.
FastAPI backend with /verify-document endpoint.
"""
import logging
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from services.fraud_pipeline import (
    ALLOWED_IMAGE_CONTENT_TYPES,
    MAX_IMAGE_SIZE_BYTES,
    run_fraud_detection,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ZeroTrust AI – Document Verification API",
    description="Identity document fraud detection system",
    version="0.1.0",
)


class VerifyDocumentResponse(BaseModel):
    status: str
    authenticity: str  # "REAL" | "SUSPICIOUS" | "FAKE"
    fraud_score: float
    document_hash: str
    analysis_breakdown: list[dict[str, Any]]
    extracted_text: str


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check for load balancers and orchestration."""
    return {"status": "ok"}


@app.post("/verify-document", response_model=VerifyDocumentResponse)
async def verify_document(
    file: UploadFile = File(..., description="Document image (JPEG, PNG, WebP, GIF)"),
) -> VerifyDocumentResponse:
    """
    Accept an uploaded image file, run fraud detection pipeline,
    and return status, fraud score, document hash, analysis breakdown, and extracted text.
    """
    if not file.content_type or file.content_type.lower() not in ALLOWED_IMAGE_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid file type. Allowed: {', '.join(sorted(ALLOWED_IMAGE_CONTENT_TYPES))}. "
                f"Received: {file.content_type or 'unknown'}"
            ),
        )

    try:
        image_bytes = await file.read()
    except Exception as e:
        logger.exception("Failed to read uploaded file")
        raise HTTPException(status_code=400, detail="Failed to read uploaded file") from e

    if len(image_bytes) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size: {MAX_IMAGE_SIZE_BYTES // (1024 * 1024)} MB",
        )

    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        result = run_fraud_detection(image_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.exception("Fraud detection pipeline failed")
        raise HTTPException(
            status_code=500,
            detail="Document verification failed. Please try again.",
        ) from e

    authenticity = (
        "REAL" if result.status == "clean" else "FAKE" if result.status == "fraudulent" else "SUSPICIOUS"
    )

    return VerifyDocumentResponse(
        status=result.status,
        authenticity=authenticity,
        fraud_score=result.fraud_score,
        document_hash=result.document_hash,
        analysis_breakdown=result.analysis_breakdown,
        extracted_text=result.extracted_text or "",
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    """Return JSON for HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )
