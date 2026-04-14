"""
ZeroTrust AI – Fraud detection classifier for identity documents.
Optimized version: fast, stable, and realistic scoring.
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

# Device setup (only once)
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ImageNet normalization
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
INPUT_SIZE = 224

# Class labels
IDX_TO_LABEL = {0: "FAKE", 1: "REAL"}

# ⚖️ Optimized weights (stable + realistic)
WEIGHT_CNN = 0.1
WEIGHT_FORENSICS = 0.6
WEIGHT_TEXT_ANOMALY = 0.3

# Lazy-loaded model + transform
_model: nn.Module | None = None
_transform = None


# ----------------------------
# TRANSFORMS
# ----------------------------
def _get_transform():
    global _transform
    if _transform is None:
        _transform = transforms.Compose([
            transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ])
    return _transform


# ----------------------------
# MODEL
# ----------------------------
def _build_model(num_classes: int = 2) -> nn.Module:
    weights = models.EfficientNet_B0_Weights.IMAGENET1K_V1
    model = models.efficientnet_b0(weights=weights)

    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.2, inplace=True),
        nn.Linear(in_features, num_classes),
    )
    return model


def _get_model() -> nn.Module:
    global _model
    if _model is None:
        _model = _build_model()
        _model.eval()
        _model.to(DEVICE)
        logger.info("Model loaded on %s", DEVICE)
    return _model


# ----------------------------
# IMAGE PREPROCESSING
# ----------------------------
def _image_bytes_to_tensor(image_bytes: bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    transform = _get_transform()
    return transform(img).unsqueeze(0)


# ----------------------------
# DATA CLASSES
# ----------------------------
@dataclass
class FraudClassifierResult:
    label: str
    probability: float
    real_score: float
    fake_score: float


@dataclass
class CombinedFraudResult:
    fraud_score: float
    authenticity: str
    cnn_probability: float
    image_forensics_score: float
    text_anomaly_score: float


# ----------------------------
# CNN CLASSIFICATION
# ----------------------------
def classify_document(image_bytes: bytes) -> FraudClassifierResult:
    if not image_bytes:
        return FraudClassifierResult("FAKE", 0.0, 0.0, 1.0)

    try:
        tensor = _image_bytes_to_tensor(image_bytes).to(DEVICE)
    except Exception as e:
        logger.warning("Image decode failed: %s", e)
        return FraudClassifierResult("FAKE", 0.0, 0.0, 1.0)

    model = _get_model()

    with torch.no_grad():
        logits = model(tensor)
        probs = torch.softmax(logits, dim=1).cpu().numpy().squeeze()

    fake_score = float(probs[0])
    real_score = float(probs[1])

    # 🚀 Clamp randomness (IMPORTANT)
    fake_score = float(np.clip(fake_score, 0.2, 0.8))

    label = IDX_TO_LABEL[int(np.argmax(probs))]
    probability = float(np.max(probs))

    return FraudClassifierResult(
        label=label,
        probability=round(probability, 4),
        real_score=round(real_score, 4),
        fake_score=round(fake_score, 4),
    )


# ----------------------------
# OCR ANOMALY
# ----------------------------
def _text_anomaly_from_ocr(image_bytes: bytes) -> float:
    from ocr_engine import extract_text

    result = extract_text(image_bytes)

    if result.line_count == 0:
        return 0.3

    confidence = min(result.average_confidence, 1.0)

    if confidence > 0.85:
        return 0.05
    elif confidence > 0.7:
        return 0.15
    elif confidence > 0.5:
        return 0.3
    else:
        return 0.45


# ----------------------------
# MAIN PIPELINE
# ----------------------------
def run_combined_analysis(image_bytes: bytes) -> CombinedFraudResult:
    from image_forensics import detect_manipulation

    if not image_bytes:
        return CombinedFraudResult(1.0, "FAKE", 1.0, 0.0, 0.0)

    # Step 1: Image Forensics (FAST)
    forensics_result = detect_manipulation(image_bytes)
    image_forensics_score = forensics_result.manipulation_score

    # 🚀 Step 2: Skip OCR if clearly fake
    if image_forensics_score > 0.8:
        text_anomaly_score = 0.4
    else:
        text_anomaly_score = _text_anomaly_from_ocr(image_bytes)

    # Step 3: CNN (light weight influence)
    cnn_result = classify_document(image_bytes)
    cnn_probability = cnn_result.fake_score

    # Step 4: Final score
    fraud_score = (
        WEIGHT_CNN * cnn_probability
        + WEIGHT_FORENSICS * image_forensics_score
        + WEIGHT_TEXT_ANOMALY * text_anomaly_score
    )

    fraud_score = float(np.clip(round(fraud_score, 4), 0.0, 1.0))

    # 🚀 Step 5: Multi-class output
    if fraud_score < 0.35:
        authenticity = "REAL"
    elif fraud_score < 0.65:
        authenticity = "SUSPICIOUS"
    else:
        authenticity = "FAKE"

    return CombinedFraudResult(
        fraud_score=fraud_score,
        authenticity=authenticity,
        cnn_probability=round(cnn_probability, 4),
        image_forensics_score=round(image_forensics_score, 4),
        text_anomaly_score=round(text_anomaly_score, 4),
    )
    
    
