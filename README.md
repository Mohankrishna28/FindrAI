# FindrAI - AI-Powered Lost & Found Matching System

A full-stack, multi-modal artificial intelligence web platform for campus and organizational Lost & Found operations. The system automates item discovery by converting unstructured descriptions and photos into high-dimensional semantic vectors and calculating multi-factor similarity scores (0–100%) in real time.

---

## 🚀 Key Architectural Features

1. **Multi-Modal AI Pipeline**:
   - **Semantic NLP Embeddings ($S_{desc}$)**: Encodes text into 384-dimensional dense vectors with cosine similarity metrics.
   - **Computer Vision Embeddings ($S_{img}$)**: Extracts visual descriptors from uploaded photos to match appearance and color palettes.
   - **Dynamic Weight Redistribution**: If one or both items lack photos, the vision weight ($w_2 = 0.30$) is dynamically reallocated to the text, attribute, and location weights.
   - **Attribute Ontology ($S_{attr}$)**: Fuzzy and taxonomy-based color matching combined with brand detection.
   - **Campus Zone Proximity ($S_{loc}$)**: Zone and floor-aware proximity matching (e.g., Library 2nd Floor vs Library Reading Room).
   - **Exponential Temporal Decay ($S_{time}$)**: Normalized decay scoring where proximity in reporting dates increases match confidence ($S_{time} = \exp(-\Delta \text{days} / 14)$).

2. **Scoring Formula**:
   $$\text{Total Score} = (w_1 \cdot S_{desc} + w_2 \cdot S_{img} + w_3 \cdot S_{attr} + w_4 \cdot S_{loc} + w_5 \cdot S_{time}) \times 100$$
   - **With Photos**: $w_1 = 0.35,\ w_2 = 0.30,\ w_3 = 0.15,\ w_4 = 0.10,\ w_5 = 0.10$
   - **Without Photos**: $w_1 = 0.50,\ w_2 = 0.00,\ w_3 = 0.25,\ w_4 = 0.15,\ w_5 = 0.10$

3. **Full-Stack Implementation**:
   - **Backend**: FastAPI REST API with SQLite + SQLAlchemy ORM, Uvicorn server.
   - **Frontend**: Vite + React modern dark UI with glassmorphic design, Lucide icons, and interactive canvas confetti.
   - **Admin & Verification**: Incident status resolution, student ownership claims review, and benchmark re-seeding.

---

## 📂 Project Structure

```text
├── backend/
│   ├── database.py       # SQLite engine and session configuration
│   ├── models.py         # SQLAlchemy schemas (ItemReport, MatchResult, ClaimRequest)
│   ├── matcher.py        # Multi-modal embedding pipeline, scoring, and explanation generator
│   ├── routes.py         # REST API endpoints (/api/items, /api/matches, /api/claims, etc.)
│   ├── seed_data.py      # Benchmark dataset: 5 Lost and 5 Found matching pairs with photos
│   └── main.py           # FastAPI entrypoint and static upload handler
├── frontend/
│   ├── src/
│   │   ├── App.jsx       # Interactive UI (Match Radar, Directory, Report Form, Admin Desk)
│   │   ├── index.css     # Design system, glassmorphism, glowing badges, animations
│   │   └── main.jsx      # React entrypoint
│   ├── index.html        # App wrapper with Outfit and Inter Google Fonts
│   └── vite.config.js    # Vite configuration with backend proxying
├── uploads/              # Storage directory for uploaded images
├── requirements.txt      # Python CPU-optimized dependencies
└── lost_and_found.db     # SQLite persistence database
```

---

## 🛠️ Setup & Running Instructions

### 1. Backend Service
```bash
# Install Python dependencies
pip install -r requirements.txt

# Seed benchmark items (5 Lost + 5 Found pairs with images)
python -m backend.seed_data

# Start the FastAPI backend server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
API Documentation will be live at: `http://127.0.0.1:8000/docs`

### 2. Frontend Application
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1
```
Open your browser at: `http://127.0.0.1:5173/`

---

## 🧪 Benchmark Test Dataset
Running `python -m backend.seed_data` populates 5 realistic matching scenarios:
1. **Texas Instruments TI-84 Plus CE** (Block A Hallway) $\to$ **90.0% Match**
2. **Fossil Brown Leather Bi-fold Wallet** (Canteen Food Court) $\to$ **85.5% Match**
3. **Dell XPS 13 Laptop (Midnight Blue)** (Library 2nd Floor) $\to$ **84.3% Match**
4. **Sony WH-1000XM4 Headphones** (Block B Lab) $\to$ **82.9% Match**
5. **Hydro Flask 32oz Insulated Bottle** (Gymnasium) $\to$ **79.4% Match**
