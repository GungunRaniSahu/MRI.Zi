# MRI.Zi — Deformable Brain-MRI Registration

An interactive **deformable medical image registration** web app, paired with a
showcase of deep-learning research (VoxelMorph, TransMorph, MLKA-Net) benchmarked on
the **OASIS** brain-MRI dataset at NIT Trichy.

Upload two brain slices (a **fixed** target and a **moving** image), and the app
estimates a dense per-pixel deformation field, warps the moving image onto the fixed
one, and reports the **Dice** overlap score **before vs after** — the same evaluation
metric used in the research.

![stack](https://img.shields.io/badge/FastAPI-009688) ![stack](https://img.shields.io/badge/Next.js-000000) ![stack](https://img.shields.io/badge/scikit--image-orange)

---

## Why two parts?

| Part | What it is | Runs |
| --- | --- | --- |
| **Live playground** | A real **classical** deformable registration (TV-L1 optical flow) | On CPU, no GPU/weights — works anywhere |
| **Research showcase** | The actual **VoxelMorph / TransMorph** results on 3D OASIS | Produced on Colab GPU; figures included |

The classical engine makes the demo runnable by anyone, while the research section
grounds it in real deep-learning work. The backend is written behind a small
`RegistrationEngine` interface, so a learned VoxelMorph/TransMorph model can be
dropped in **behind the same API** without changing the frontend.

---

## Architecture

```
moving + fixed ──▶ RegistrationEngine ──▶ deformation field (u, v)
                                              │
                                              ├─▶ warp moving ──▶ registered image
                                              ├─▶ Dice (before vs after)
                                              ├─▶ deformation grid + Jacobian
                                              └─▶ difference maps
```

```
MRI.Zi/
├── backend/                 FastAPI + scikit-image
│   ├── main.py              HTTP layer: /health, /sample, /register
│   ├── registration.py      pluggable engine interface + classical TV-L1 engine
│   ├── metrics.py           Dice, Jacobian, PNG renderers
│   ├── sample_data.py       synthetic brain-pair generator ("Try an example")
│   └── requirements.txt
└── frontend/                Next.js (App Router, TypeScript)
    ├── app/                 page, layout, global styles
    ├── components/          Playground (live) + ResultsShowcase (research)
    ├── lib/api.ts           typed backend client
    └── public/research/     real research figures
```

---

## Run it locally

You need **Python 3.11+** and **Node 18+**. Two terminals.

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend is now at `http://localhost:8000` (try `http://localhost:8000/health`).

### 2. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**. Click **“Try an example”** to run immediately, or
upload two brain-MRI slices.

> The frontend reads the backend URL from `NEXT_PUBLIC_API_URL` (defaults to
> `http://localhost:8000`). Set it in `frontend/.env.local` to point elsewhere.

---

## The research behind it (NIT Trichy)

Reproducible 3D brain-MRI registration comparing three model families on the same
**Neurite-OASIS** data (414 brains, 35 anatomical labels) under one metric — **Dice**
on warped segmentation labels.

| Model | Architecture | Backend | Input | Role |
| --- | --- | --- | --- | --- |
| **VoxelMorph** | CNN (U-Net) | TensorFlow | 160×160×192 | SynthMorph pretrained baseline |
| **TransMorph** | Swin-Transformer + ConvNet | PyTorch | 160×192×224 | Learn2Reg OASIS winner |
| **MLKA-Net** | Multi-scale large-kernel attention | PyTorch | native | Attention target model |

**Application (Phase 4):** rather than stopping at Dice, the study uses each model's
deformation field — measuring the **Jacobian determinant inside the hippocampus** — to
**detect dementia** (healthy vs demented from OASIS CDR labels), comparing models by
ROC-AUC. This is deformation-based morphometry.

---

## Swapping in a learned model

Implement the interface in `backend/registration.py`:

```python
class VoxelMorphEngine(RegistrationEngine):
    name = "voxelmorph"
    def register(self, fixed, moving) -> RegistrationResult:
        # run the network, get displacement (v, u), warp moving, return result
        ...
```

Register it in `get_engine(...)` and set `ENGINE_NAME` in `main.py`. The metrics,
visualizations, API and frontend are unchanged.

---

## Notes & honest caveats

- The live engine is a **classical** baseline, not a neural network — chosen so the
  demo runs on any CPU. The deep-learning results live in the research section.
- In the live demo, the Dice mask is derived by **Otsu thresholding** the uploaded
  slice (no segmentation labels uploaded). In the research, Dice uses real anatomical
  **segmentation labels** — the more rigorous version of the same metric.
- Inputs are resized to **192×192** grayscale for a fast, consistent demo.
