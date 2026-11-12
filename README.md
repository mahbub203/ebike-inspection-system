# GLAFIT Bangladesh — AI-Powered Electric Bike Fleet Damage Inspection System

An enterprise-grade AI-powered Electric Bike Damage Inspection Web Application designed for commercial electric bike rental fleets in Bangladesh.

The system ensures that every rental vehicle is verified for scratches, dents, cracks, and frame damage using computer vision before staff or customers can submit a rental contract to a service hub or office.

---

## 1. Key Architectural Features

- **Exclusive Live Camera Capture**:
  - Direct hardware optical feed via `navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } })`.
  - **Zero file uploads**: No file input (`<input type="file">`), no gallery picker, and no drag-and-drop zone.
  - Interactive optical viewfinder HUD overlays tailored to each angle (Front, Rear, Left, Right, Damage Close-up).
  - Built-in hardware camera stream simulation mode for automated testing on camera-less VMs/servers.
- **YOLOv8 Computer Vision Pipeline**:
  - High-precision defect detection powered by Ultralytics YOLOv8 and calibrated computer vision edge/concavity defect analyzers.
  - Supported damage classes: **Scratch**, **Dent**, **Crack**, **Broken Parts**, **Frame Damage**, and **Loose Cable**.
  - High-resolution visual bounding box rendering with severity tags and confidence percentages.
- **Safety Arbitration & Security Gate**:
  - **PASS**: All 4 mandatory views captured, no disqualifying damage detected, within cosmetic scratch tolerance. Unlocks the "PROCEED TO CONTRACT SUBMISSION" action.
  - **FAIL**: Disqualifying damage detected or missing mandatory views. Completely blocks contract submission and displays:
    > *"Sorry! Your bike inspection did not pass. You cannot submit the bike contract with the hub or office at this moment. Please visit your nearest Glafit hub or office for manual inspection and assistance."*
  - **Dual-Layer Security**: Backend API rejects contract submissions for failed or unverified inspections with `HTTP 403 Forbidden` and prevents duplicate contract submissions (`HTTP 409 Conflict`).
- **Hardened Authentication & Session Lifecycle**:
  - `PBKDF2-HMAC-SHA256` password hashing with 100,000 iterations and per-user cryptographic salt.
  - Active server-side session revocation on logout.
  - Brute-force protection: Automatic account lockout after 5 consecutive failed login attempts.
  - Bangladeshi data validation: 11-digit mobile phone numbers (`01[3-9]\d{8}`) and 10/17-digit National ID (NID).
- **Modern EV Aesthetic Design**:
  - Color Palette:
    - Primary Navy: `#102A43`
    - Electric Blue: `#1677FF`
    - Clean Light Grey: `#F7F9FC`
    - Surface White: `#FFFFFF`
    - Success Green: `#16A36A`
    - Danger Scarlet: `#E5484D`
    - Warning Amber: `#F4A340`
  - Typography: Plus Jakarta Sans, Inter.
  - Tactile micro-interactions and WCAG AA accessible contrast.

---

## 2. Technology Stack

- **Frontend**:
  - React.js + Vite + TypeScript
  - Tailwind CSS + Autoprefixer
  - Lucide React Icons
  - Framer Motion
  - React Router DOM
  - Canvas Confetti
- **Backend**:
  - Python FastAPI + Uvicorn
  - Ultralytics YOLOv8 + PyTorch
  - OpenCV (`opencv-python`) + Pillow (`PIL`)
  - Pydantic v2 + Python Multipart
  - HTTPX Async & Sync REST client

---

## 3. Getting Started

### Backend Setup:
```bash
cd backend
pip install -r requirements.txt
python run.py
```
FastAPI runs on `http://127.0.0.1:8000` with Swagger docs at `http://127.0.0.1:8000/docs`.

### Frontend Setup:
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```
Vite runs on `http://localhost:5173/` and on your local network IP (e.g., `http://192.168.x.x:5173/`).
