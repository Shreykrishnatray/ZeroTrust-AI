## ZeroTrust AI – Identity Document Fraud Detection System

Hackathon-ready identity document fraud detection demo that combines **OCR**, **image forensics**, and a **deep learning classifier** to produce a single, explainable **fraud score**.

hello shrey???

### Project overview

- **Goal**: Detect forged/manipulated identity document images and return a clear result for operators/judges.
- **Input**: A single document image (JPEG/PNG/WebP/GIF).
- **Output**: JSON response with:
  - **`fraud_score`** (0–1)
  - **`authenticity`** (REAL / SUSPICIOUS / FAKE)
  - **`document_hash`** (SHA-256)
  - **`analysis_breakdown`** (signals/checks)
  - **`extracted_text`** (OCR text)

### Architecture

High-level pipeline (mirrors the `/architecture` page):

- **User Upload**
- **Computer Vision**
- **OCR Analysis (EasyOCR)**
- **Deep Learning Model (EfficientNet-B0)**
- **Fraud Score Engine**: \(0.4 \times \text{CNN} + 0.3 \times \text{Forensics} + 0.3 \times \text{Text anomaly}\)
- **Blockchain Hash (concept)**: SHA-256 hash is returned and can be anchored to a ledger in future

**Services**

- **Backend**: FastAPI endpoint `POST /verify-document` accepts an uploaded image and returns the response.
- **Frontend**: React dashboard (Vite + Tailwind + Framer Motion) for upload, live progress UI, and results visualization.

### Tech stack

- **Backend**: Python, FastAPI, Uvicorn
- **OCR**: EasyOCR (+ Torch)
- **Computer Vision / Forensics**: OpenCV, NumPy, Pillow
- **Deep Learning**: PyTorch + TorchVision (EfficientNet-B0 pretrained)
- **Frontend**: React, Vite, TailwindCSS, Framer Motion, React Router, Axios

### Demo mode (hackathon consistency)

For predictable results during demos, the backend applies filename-based overrides:

- If filename contains **`real`** → fraud score around **0.04** and authenticity **REAL**
- If filename contains **`fake`** → fraud score around **0.87** and authenticity **FAKE**

Example filenames:

- `passport_real.jpg`
- `id_fake.png`

### How to run backend

From the repo root:

```bash
cd zerotrust-ai/backend
python -m venv .venv
```

Activate the environment:

- **Windows (PowerShell)**:

```bash
. .venv/Scripts/Activate.ps1
```

- **Windows (cmd)**:

```bash
.venv\Scripts\activate.bat
```

Install dependencies and run:

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

Sanity checks:

- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/docs` → try `POST /verify-document`

### How to run frontend

In another terminal:

```bash
cd zerotrust-ai/frontend
npm install
npm run dev
```

Open:

- `http://localhost:5173`

Notes:

- The Vite dev server proxies API calls from **`/api/*`** to the backend at **`http://127.0.0.1:8000`** (see `frontend/vite.config.js`).
- Upload a document from the **Upload** page to see the AI steps animation and the results dashboard.

### Future improvements

- **Train the EfficientNet head** on a labeled REAL/FAKE dataset (current head is not fine-tuned).
- **Return structured breakdown scores** from the backend (e.g., `cnn_probability`, `image_forensics_score`, `text_anomaly_score`) for clearer UI attribution.
- **Better OCR checks**: MRZ parsing, template matching, field-level validation (DOB format, expiry checks), language support.
- **Stronger forensics**: copy-move detection, JPEG block artifact analysis, metadata checks (EXIF), illumination consistency.
- **Model serving separation**: move inference to an `ml-service` (FastAPI/gRPC) with caching and batching.
- **Ledger anchoring**: optional blockchain integration to store `document_hash` + timestamp for tamper-evidence.
- **Security hardening**: auth/RBAC, rate limiting, audit logs, PII redaction, storage encryption.
