#  AI Automated Infographic Advertisement Video Generator

> Automatically transform any company document (PDF) into a fully animated, narrated infographic advertisement video — powered by Azure AI services.

---

##  Overview

This project is a full-stack web application that reads a PDF document, extracts its content using OCR, generates a structured scene plan using Azure OpenAI, renders animated infographic frames, synthesizes a narration audio track, and stitches everything together into a professional MP4 advertisement video.

**Use case:** Give it your company brochure, product catalog, or annual report — and get back a polished 60–90 second animated advertisement video in minutes.

---

##  Features

-  **PDF Upload & OCR** — Extracts text from uploaded PDFs using Azure Document Intelligence
-  **AI Scene Planning** — Azure OpenAI (GPT-4) generates structured 8–12 scene plans with titles, bullet points, colors, and icons
-  **Animated Frame Rendering** — Pillow-based engine renders 1920×1080 frames with smooth animations, gradients, staggered bullets, and transitions
-  **Text-to-Speech Narration** — Azure AI Speech synthesizes a professional voiceover (en-US-JennyNeural)
-  **FFmpeg Video Compilation** — Merges PNG frames + audio into a final H.264 MP4
-  **Brand Kit Support** — Custom primary/accent colors and logo overlay per user
-  **Azure Blob Storage** — Stores PDFs, generated videos, and brand assets
-  **JWT Authentication** — Secure login with Google / GitHub OAuth support
-  **MongoDB** — Stores user accounts and generation history

---

##  Architecture

```
PDF Upload
    │
    ▼
Azure Document Intelligence (OCR)
    │  extracted text
    ▼
Azure OpenAI GPT-4 (Script Service)
    │  scene plan JSON + narration script
    ▼
Scene Renderer (Pillow)          Azure AI Speech (TTS Service)
    │  PNG frames (1920×1080)          │  narration.mp3
    └──────────────┬───────────────────┘
                   ▼
              FFmpeg (Video Generator)
                   │  final .mp4
                   ▼
         Azure Blob Storage → User Download
```

---

##  Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React + Vite + Tailwind CSS |
| **Backend** | FastAPI (Python) |
| **AI – OCR** | Azure Document Intelligence |
| **AI – Script** | Azure OpenAI (GPT-4) |
| **AI – Voice** | Azure AI Speech (Neural TTS) |
| **Animation** | Pillow (PIL) |
| **Video** | FFmpeg |
| **Storage** | Azure Blob Storage |
| **Database** | MongoDB |
| **Auth** | JWT + OAuth (Google, GitHub) |

---

##  Project Structure

```
├── backend/
│   ├── app.py                # FastAPI app entry point
│   ├── config.py             # Pydantic settings (env vars)
│   ├── auth_service.py       # JWT auth helpers
│   ├── blob_service.py       # Azure Blob Storage uploads/downloads
│   ├── ocr_service.py        # Azure Document Intelligence OCR
│   ├── script_service.py     # Azure OpenAI scene plan generation
│   ├── tts_service.py        # Azure AI Speech narration synthesis
│   ├── scene_renderer.py     # Pillow-based animation frame renderer
│   ├── video_generator.py    # FFmpeg video pipeline orchestrator
│   ├── exceptions.py         # Centralised error handling
│   ├── dependencies.py       # FastAPI dependency injection
│   ├── db.py                 # MongoDB connection
│   └── routes/
│       ├── auth.py           # /auth endpoints
│       ├── user.py           # /user endpoints
│       └── video.py          # /video endpoints
├── frontend-react/
│   ├── src/
│   │   ├── pages/            # React pages (Upload, Result, History…)
│   │   └── components/       # Reusable UI components
│   └── index.html
├── requirements.txt
├── .gitignore
└── README.md
```

---

##  Prerequisites

- Python 3.10+
- Node.js 18+
- [FFmpeg](https://ffmpeg.org/download.html) installed and on system PATH
- Azure subscription with the following services provisioned:
  - Azure Document Intelligence
  - Azure OpenAI (GPT-4 deployment)
  - Azure AI Speech
  - Azure Blob Storage (3 containers: `inputdocs`, `videocontainer`, `brandkit`)
- MongoDB instance (local or Atlas)

---

##  Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Santhosh2432/AI_Automated_Infographic-Advertisment_Video_Generator.git
cd AI_Automated_Infographic-Advertisment_Video_Generator
```

### 2. Set up the backend

```bash
# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/macOS

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
# Azure Document Intelligence
AZURE_DOC_INTEL_ENDPOINT=https://<your-resource>.cognitiveservices.azure.com/
AZURE_DOC_INTEL_KEY=<your-key>

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_UPLOAD_CONTAINER=inputdocs
AZURE_STORAGE_VIDEO_CONTAINER=videocontainer
AZURE_STORAGE_BRANDKIT_CONTAINER=brandkit

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com/
AZURE_OPENAI_KEY=<your-key>
AZURE_OPENAI_DEPLOYMENT=gpt-4

# Azure AI Speech
AZURE_SPEECH_KEY=<your-key>
AZURE_SPEECH_REGION=eastus
AZURE_SPEECH_VOICE=en-US-JennyNeural

# Auth & Database
MONGODB_CONNECTION_STRING=mongodb://localhost:27017/
JWT_SECRET_KEY=<your-secret>

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

FRONTEND_URL=http://localhost:5173
FFMPEG_PATH=ffmpeg
```

### 4. Run the backend

```bash
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

### 5. Set up and run the frontend

```bash
cd frontend-react
npm install
npm run dev
```

The app will be available at **http://localhost:5173**

---

##  How It Works

1. **Upload** a PDF document via the web UI
2. **OCR** — Azure Document Intelligence extracts all text from the document
3. **AI Planning** — Azure OpenAI GPT-4 generates a structured scene plan (8–12 scenes) with titles, bullet points, colors, icons, and a narration script
4. **Frame Rendering** — The scene renderer draws each frame at 1920×1080 with animated gradients, staggered text, icons, and crossfade transitions at 30 FPS
5. **TTS** — Azure AI Speech converts the narration script into an MP3 audio file
6. **Video Compilation** — FFmpeg merges PNG frames + MP3 audio into a final H.264 MP4
7. **Storage & Download** — The video is uploaded to Azure Blob Storage and the user can preview and download it

---

##  API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login and receive JWT token |
| `POST` | `/video/generate` | Upload PDF and generate video |
| `GET` | `/video/history` | Get user's video history |
| `DELETE` | `/video/{id}` | Delete a generated video |
| `POST` | `/user/brand-kit` | Upload brand colors + logo |
| `GET` | `/user/brand-kit` | Get saved brand kit |

---

## Security Notes

- `.env` is excluded from version control via `.gitignore` — **never commit secrets**
- All API routes (except `/auth`) require a valid JWT token
- Azure Blob SAS tokens / connection strings must have minimum required permissions

---

## Team

| Name | Role |
|---|---|
| Santhosh | Backend, Azure AI Integration, Video Pipeline |

---

## License

This project is for academic and demonstration purposes.

---

## 🙏 Acknowledgements

- [Azure AI Services](https://azure.microsoft.com/en-us/products/ai-services/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Pillow (PIL)](https://python-pillow.org/)
- [FFmpeg](https://ffmpeg.org/)
- [React + Vite](https://vitejs.dev/)
