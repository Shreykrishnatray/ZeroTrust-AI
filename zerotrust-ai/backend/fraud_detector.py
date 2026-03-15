"""
ZeroTrust AI – Fraud detection classifier for identity documents.
Uses EfficientNet-B0 (ImageNet pretrained) with a binary head: REAL / FAKE.
Combines CNN, image forensics, and text anomaly into a single fraud score.
"""
import io
import logging
from dataclasses import dataclass

import numpy as np
import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms

logger = logging.getLogger(__name__)

# ImageNet normalization (used by pretrained EfficientNet)
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
INPUT_SIZE = 224

# Class index -> label
IDX_TO_LABEL = {0: "FAKE", 1: "REAL"}

# Combined fraud score weights
WEIGHT_CNN = 0.4
WEIGHT_FORENSICS = 0.3
WEIGHT_TEXT_ANOMALY = 0.3
# Threshold above which document is considered fraudulent
FRAUD_THRESHOLD = 0.5

# Lazy-loaded model and transform
_model: nn.Module | None = None
_transform = None


def _get_transform():
    global _transform
    if _transform is None:
        _transform = transforms.Compose([
            transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ])
    return _transform


def _build_model(num_classes: int = 2) -> nn.Module:
    """Build EfficientNet-B0 with ImageNet pretrained backbone and binary classifier head."""
    # Load pretrained EfficientNet-B0 (strip classifier for our 2-class head)
    weights = models.EfficientNet_B0_Weights.IMAGENET1K_V1
    backbone = models.efficientnet_b0(weights=weights)
    in_features = backbone.classifier[1].in_features
    backbone.classifier = nn.Sequential(
        nn.Dropout(p=0.2, inplace=True),
        nn.Linear(in_features, num_classes),
    )
    return backbone


def _get_model() -> nn.Module:
    global _model
    if _model is None:
        _model = _build_model()
        _model.eval()
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        _model.to(device)
        logger.info("Fraud detector model loaded on %s", device)
    return _model


def _image_bytes_to_tensor(image_bytes: bytes):
    """Decode image bytes to RGB PIL, then to normalized tensor [1, 3, H, W]."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    transform = _get_transform()
    tensor = transform(img).unsqueeze(0)  # (1, 3, 224, 224)
    return tensor


@dataclass
class FraudClassifierResult:
    """Result of REAL/FAKE classification."""

    label: str  # "REAL" or "FAKE"
    probability: float
    real_score: float
    fake_score: float


@dataclass
class CombinedFraudResult:
    """Result combining CNN, forensics, and text anomaly into final fraud score."""

    fraud_score: float
    authenticity: str  # "REAL" or "FAKE"
    cnn_probability: float
    image_forensics_score: float
    text_anomaly_score: float


def classify_document(image_bytes: bytes) -> FraudClassifierResult:
    """
    Classify document image as REAL or FAKE using EfficientNet-B0.
    Returns label, probability of predicted class, and per-class scores.
    """
    if not image_bytes or len(image_bytes) == 0:
        return FraudClassifierResult(
            label="FAKE",
            probability=0.0,
            real_score=0.0,
            fake_score=1.0,
        )

    try:
        tensor = _image_bytes_to_tensor(image_bytes)
    except Exception as e:
        logger.warning("Failed to decode image for fraud classifier: %s", e)
        return FraudClassifierResult(
            label="FAKE",
            probability=0.0,
            real_score=0.0,
            fake_score=1.0,
        )

    model = _get_model()
    device = next(model.parameters()).device
    tensor = tensor.to(device)

    with torch.no_grad():
        logits = model(tensor)
        probs = torch.softmax(logits, dim=1)
        probs_np = probs.cpu().numpy().squeeze()

    # Indices: 0 = FAKE, 1 = REAL
    fake_score = float(probs_np[0])
    real_score = float(probs_np[1])
    pred_idx = int(np.argmax(probs_np))
    label = IDX_TO_LABEL[pred_idx]
    probability = float(probs_np[pred_idx])

    return FraudClassifierResult(
        label=label,
        probability=round(probability, 4),
        real_score=round(real_score, 4),
        fake_score=round(fake_score, 4),
    )


def _text_anomaly_from_ocr(image_bytes: bytes) -> float:
    """Derive text anomaly score (0–1, high = more anomalous) from OCR confidence."""
    from ocr_engine import extract_text
    result = extract_text(image_bytes)
    if result.line_count == 0:
        return 0.0
    # Low OCR confidence => high anomaly (1 - confidence)
    return 1.0 - min(result.average_confidence, 1.0)


def run_combined_analysis(image_bytes: bytes) -> CombinedFraudResult:
    """
    Run CNN, image forensics, and OCR; combine into a single fraud score.
    fraud_score = 0.4 * cnn_probability + 0.3 * image_forensics_score + 0.3 * text_anomaly_score
    Returns final fraud score and authenticity (REAL / FAKE).
    """
    from image_forensics import detect_manipulation

    if not image_bytes or len(image_bytes) == 0:
        return CombinedFraudResult(
            fraud_score=1.0,
            authenticity="FAKE",
            cnn_probability=1.0,
            image_forensics_score=0.0,
            text_anomaly_score=0.0,
        )

    cnn_result = classify_document(image_bytes)
    forensics_result = detect_manipulation(image_bytes)
    text_anomaly_score = _text_anomaly_from_ocr(image_bytes)

    cnn_probability = cnn_result.fake_score  # P(FAKE) from CNN
    image_forensics_score = forensics_result.manipulation_score

    fraud_score = (
        WEIGHT_CNN * cnn_probability
        + WEIGHT_FORENSICS * image_forensics_score
        + WEIGHT_TEXT_ANOMALY * text_anomaly_score
    )
    fraud_score = float(np.clip(round(fraud_score, 4), 0.0, 1.0))

    authenticity = "FAKE" if fraud_score >= FRAUD_THRESHOLD else "REAL"

    return CombinedFraudResult(
        fraud_score=fraud_score,
        authenticity=authenticity,
        cnn_probability=round(cnn_probability, 4),
        image_forensics_score=round(image_forensics_score, 4),
        text_anomaly_score=round(text_anomaly_score, 4),
    )
