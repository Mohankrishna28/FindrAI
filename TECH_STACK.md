# FindrAI — Technology Stack & Architecture Reference

A comprehensive breakdown of all technologies, frameworks, libraries, algorithms, and infrastructure powering the **FindrAI Campus Multi-Modal AI Lost & Found Intelligence System**.

---

## 1. Architecture Overview

FindrAI is engineered as a **Full-Stack, Multi-Modal Artificial Intelligence Platform** capable of matching lost and found reports using high-dimensional Natural Language Processing (NLP), Computer Vision (CV), structured attribute comparison, and spatio-temporal proximity algorithms.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FindrAI Full-Stack Ecosystem                          │
├──────────────────────────────────────┬──────────────────────────────────────┤
│               FRONTEND               │               BACKEND                │
│       React 19 + Vite 8 + CSS        │          FastAPI + Uvicorn           │
│                                      │                                      │
│  • Single Page Application (SPA)     │  • Async RESTful API Architecture    │
│  • Responsive Google-Style UI        │  • Multi-Modal AI Scoring Engine     │
│  • Glassmorphism Design System       │  • SQLAlchemy 2.0 ORM                │
│  • Client-Side State & Anti-Caching  │  • Anti-Cache Security Middleware    │
│  • Optimistic Local Persistence      │  • Static Asset & SPA File Delivery  │
└──────────────────────────────────────┴──────────────────────────────────────┘
                                  ▲
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Multi-Modal AI Pipeline                            │
│  • Semantic Text Embeddings (384-D)    • Perceptual Vision Vectors (512-D)  │
│  • Sentence-Transformers / N-Grams     • MobileNetV3 / Spatial Color & HSV  │
│  • Spatio-Temporal Distance Metrics    • Cosine Matrix Multi-Modal Scoring  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Technologies

| Technology / Library | Version | Purpose & Description |
| :--- | :--- | :--- |
| **React** | `^19.3.1` | Declarative UI framework powering components, reactive states, and wizards. |
| **React DOM** | `^19.3.1` | DOM renderer for React components in modern browsers. |
| **Vite** | `^8.3.4` | Ultra-fast next-generation frontend build tool and local HMR dev server. |
| **Tailwind CSS** | `^4.3.3` | Utility-first CSS engine for dynamic animations, responsive layouts, and typography. |
| **@tailwindcss/vite** | `^4.3.3` | First-party Vite integration plugin for instantaneous Tailwind compilation. |
| **Lucide React** | `^1.16.0` | Comprehensive library of SVG iconography across all navigation, cards, and badges. |
| **Canvas Confetti** | `^1.9.4` | Micro-animation library triggering celebration particles upon high-confidence matches (>75%). |
| **HTML5 & Vanilla CSS** | Modern | Semantic HTML5 structure, custom scrollbars, and glassmorphic translucent panels. |
| **JavaScript (ES6+)** | Modern | Native Fetch API with `cache: 'no-store'`, FormData multipart streaming, and LocalStorage mirror. |

---

## 3. Backend Technologies

| Technology / Library | Version | Purpose & Description |
| :--- | :--- | :--- |
| **Python** | `>=3.10` (3.12 recommended) | Core backend programming language. |
| **FastAPI** | `>=0.110.0` | High-performance, asynchronous web framework built on Starlette and Pydantic. |
| **Uvicorn** | `>=0.28.0` | Lightning-fast ASGI production web server implementing HTTP/1.1 and WebSockets. |
| **Starlette** | Core Dependency | Async toolkit providing middleware support, static file mounting, and FileResponse streaming. |
| **Pydantic** | `>=2.6.0` | Data validation, type safety, and automatic OpenAPI schema generation. |
| **Python-Multipart** | `>=0.0.9` | Streaming parser for multipart/form-data file uploads and form inputs. |

---

## 4. Artificial Intelligence & Multi-Modal Matching Engine

FindrAI uses an ensemble matching algorithm that computes a normalized composite confidence score (0–100%):

$$\text{Total Score} = 0.35 \cdot S_{\text{text}} + 0.25 \cdot S_{\text{vision}} + 0.20 \cdot S_{\text{attributes}} + 0.20 \cdot S_{\text{spatio-temporal}}$$

### A. Semantic NLP & Text Embeddings
- **Sentence-Transformers (`all-MiniLM-L6-v2`)**: Generates 384-dimensional dense semantic vectors mapping item title, category, brand, and descriptions into a shared latent space.
- **Deterministic Subword N-Gram Vectorizer (Fallback)**: Custom L2-normalized 384-dim hashing vectorizer with character 3/4-grams ensuring typo tolerance and zero-crash capability in minimal environments.

### B. Computer Vision & Feature Extraction
- **Torchvision MobileNetV3-Small**: Deep convolutional neural network extracting high-level perceptual embeddings from uploaded photos.
- **Pillow (PIL `>=10.2.0`)**: 
  - `ImageOps.exif_transpose`: Corrects smartphone camera orientation issues.
  - Multi-mode conversion: Converts `RGBA`, `P`, `LA`, and `CMYK` images cleanly to `RGB`.
  - Image scaling: Resizes to 750×750 with `LANCZOS` anti-aliasing and JPEG quality optimization.
  - Base64 encoding: Self-contained data URI generation for in-database image storage.
- **Deterministic Perceptual Vision Extractor (Fallback)**:
  - 8×8 Spatial Color Grid (384 dimensions)
  - 32-bin HSV Color Distribution (96 dimensions)
  - Horizontal Luminance Gradient Moments (32 dimensions)

### C. Mathematics & Similarity Metrics
- **NumPy (`>=1.26.0`)**: High-performance vectorized array operations, vector norms, and histogram calculations.
- **Scikit-Learn (`>=1.4.0`)**: Cosine similarity computation between high-dimensional embedding vectors.

---

## 5. Database & Data Storage

| Layer | Technology | Usage in FindrAI |
| :--- | :--- | :--- |
| **ORM** | **SQLAlchemy 2.0+** | Object-Relational Mapper defining models (`ItemReport`, `MatchResult`, `ClaimRequest`). |
| **Default Storage** | **SQLite 3** | File-based local database with thread-safe connection pooling (`lost_and_found.db`). |
| **Cloud Database** | **PostgreSQL** | Dynamic support via `DATABASE_URL` / `POSTGRES_URL` (Neon, Supabase, Render Postgres). |
| **Image Storage** | **Base64 Data URIs (`Text`)** | Images stored directly inside the database record as web-optimized base64 strings, eliminating broken paths on ephemeral hosts. |
| **Client Storage** | **Web LocalStorage** | Stores recent reports locally to ensure instant optimistic rendering and offline resilience. |

---

## 6. Hosting, Infrastructure & DevOps

| Platform / Tool | Role in Project | Configuration File |
| :--- | :--- | :--- |
| **Render** | Primary Full-Stack Host (FastAPI + React SPA) | [`render.yaml`](file:///d:/Arya%20project/render.yaml), [`Procfile`](file:///d:/Arya%20project/Procfile) |
| **Vercel** | Alternative Serverless Host | [`frontend/vercel.json`](file:///d:/Arya%20project/frontend/vercel.json), [`pyproject.toml`](file:///d:/Arya%20project/pyproject.toml) |
| **Git & GitHub** | Version control and automated continuous deployment | [`.gitignore`](file:///d:/Arya%20project/.gitignore) |
| **Anti-Caching** | Custom ASGI Middleware (`NoCacheApiMiddleware`) + Edge Headers | `backend/main.py`, `frontend/vercel.json` |

---

## 7. Summary of Key Files

- [`backend/main.py`](file:///d:/Arya%20project/backend/main.py): FastAPI application root, middleware, API router inclusion, and SPA static file server.
- [`backend/routes.py`](file:///d:/Arya%20project/backend/routes.py): REST API endpoints (`/api/items`, `/api/matches`, `/api/claims`, `/api/stats`).
- [`backend/matcher.py`](file:///d:/Arya%20project/backend/matcher.py): Multi-modal similarity algorithm, ML embeddings, and mathematical scoring.
- [`backend/models.py`](file:///d:/Arya%20project/backend/models.py): SQLAlchemy database schema definitions.
- [`backend/database.py`](file:///d:/Arya%20project/backend/database.py): Engine initialization and database session management.
- [`frontend/src/App.jsx`](file:///d:/Arya%20project/frontend/src/App.jsx): Main React application component (Explore, Radar, Report Wizard, Heatmap, Admin).
- [`requirements.txt`](file:///d:/Arya%20project/requirements.txt): Python dependencies.
- [`frontend/package.json`](file:///d:/Arya%20project/frontend/package.json): Node.js / React frontend dependencies.
