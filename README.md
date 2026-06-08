<div align="center">

# MRI.Zi — Deformable Brain-MRI Registration

**Bend one brain onto another, and watch the Dice score climb.**

An interactive web app for non-rigid medical image registration, paired with the
deep-learning research it grew out of — VoxelMorph, TransMorph and MLKA-Net
benchmarked on the **OASIS** brain-MRI dataset at NIT Trichy.

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![scikit-image](https://img.shields.io/badge/scikit--image-FF7F0E?logo=scikitimage&logoColor=white)](https://scikit-image.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-1d4e5f.svg)](#license)

</div>

<!-- Drop a screenshot here once deployed:  ![MRI.Zi screenshot](docs/screenshot.png) -->

---

## What it does

Upload two brain-MRI slices — a **fixed** (target) and a **moving** (source) — and the
app estimates a dense, per-pixel **deformation field** that warps the moving image onto
the fixed one. It then reports the **Dice overlap** *before vs after* registration, and
visualizes exactly what changed: the warped result, a difference map, the deformation
grid, and the Jacobian determinant (where tissue locally shrank or expanded).

> **Registration ≠ a shift or rotation.** It is a smooth, non-rigid *warp* — the core
> problem in medical imaging when comparing brains across subjects or time.

### Two parts, one story

| | What it is | Where it runs |
| --- | --- | --- |
| **① Live playground** | A real **classical** deformable registration (TV-L1 optical flow) | CPU only — works anywhere, no GPU or trained weights |
| **② Research showcase** | The actual **VoxelMorph / TransMorph** results on 3D OASIS brains | Produced on Colab GPU; figures included in the app |

The classical engine makes the demo runnable by anyone; the research section grounds it
in real deep-learning work. Crucially, the backend is built behind a small
`RegistrationEngine` interface, so a learned VoxelMorph/TransMorph model can be dropped
in **behind the same API** without touching the frontend.

---

## Features

- 🧠 **Real deformable registration** — dense TV-L1 optical-flow displacement field, not a rigid transform
- 📊 **Quantitative readout** — Dice before → after, mean displacement, % folding (diffeomorphism check)
- 🔬 **Rich visualizations** — fixed/moving/registered, signed difference maps, warped deformation grid, Jacobian heatmap
- ⚡ **Zero-setup demo** — built-in synthetic brain pair with a known deformation (the "Load example" button)
- 🔌 **Pluggable engine** — swap the classical baseline for a learned model behind one interface
- 🎨 **Editorial UI** — a radiology-workstation aesthetic, not a template

---

## How it works

```
            ┌──────────────────────────── RegistrationEngine ───────────────────────────┐
 fixed ───▶ │                                                                            │
 moving ──▶ │   estimate dense displacement field (u, v)  ─────────────────────────────▶ │ ──▶ deformation field
            │                                                                            │
            └────────────────────────────────────┬───────────────────────────────────── ┘
                                                  │
                  ┌───────────────────────────────┼───────────────────────────────┐
                  ▼                ▼               ▼                ▼               ▼
            warp moving      Dice before/     deformation       Jacobian       difference
            → registered     after overlap    grid (warp)       |J| heatmap     maps
```

The **Dice** score is computed the same way the research does it — overlap of binary
masks. In the research, masks come from anatomical **segmentation labels**; in the live
demo (arbitrary uploads) the brain mask is derived by Otsu thresholding, so the number is
a real overlap score on the same 0–1 scale.

---

## Tech stack

| Layer | Tools |
| --- | --- |
| **Backend** | FastAPI · scikit-image (TV-L1 optical flow) · NumPy · Pillow · Matplotlib |
| **Frontend** | Next.js (App Router) · React · TypeScript |
| **Research** | VoxelMorph (TensorFlow) · TransMorph (PyTorch) · MLKA-Net · OASIS dataset |

---

## Run it locally

**Requirements:** Python 3.11+ and Node 18+. Use two terminals.

### 1 · Backend (FastAPI)

```bash
cd backend
python -m venv .venv

# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1
# macOS / Linux
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Check it's up: open <http://localhost:8000/health> → `{"status":"ok", ...}`.

### 2 · Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:3000> and click **“Load example”** to run instantly, or upload two
brain slices.

> The frontend reads the backend URL from `NEXT_PUBLIC_API_URL` (defaults to
> `http://localhost:8000`). Set it in `frontend/.env.local` to point elsewhere.

---

## Project structure

```
MRI.Zi/
├── backend/                  FastAPI service
│   ├── main.py               HTTP layer: /health · /sample · /register
│   ├── registration.py       RegistrationEngine interface + classical TV-L1 engine
│   ├── metrics.py            Dice, Jacobian, and dark-themed figure renderers
│   ├── sample_data.py        synthetic brain-pair generator ("Load example")
│   └── requirements.txt
└── frontend/                 Next.js app
    ├── app/                  page · layout · global styles
    ├── components/           Playground (live)  ·  ResultsShowcase (research)
    ├── lib/api.ts            typed backend client
    └── public/research/      real research figures
```

### API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Liveness + active engine |
| `GET` | `/sample` | A ready-made fixed/moving example pair (base64 PNGs) |
| `POST` | `/register` | Register an uploaded (or sample) pair → metrics + images |

---

## The research behind it (NIT Trichy)

A reproducible pipeline comparing three model families on the **same Neurite-OASIS** data
(414 brains, 35 anatomical labels) under one metric — **Dice** on warped segmentation
labels.

| Model | Architecture | Backend | Input | Role |
| --- | --- | --- | --- | --- |
| **VoxelMorph** | CNN (U-Net) | TensorFlow | 160×160×192 | SynthMorph pretrained baseline |
| **TransMorph** | Swin-Transformer + ConvNet | PyTorch | 160×192×224 | Learn2Reg OASIS winner |
| **MLKA-Net** | Large-kernel attention | PyTorch | native | Attention target model |

**Application (Phase 4).** Rather than stopping at "which model has the best Dice," the
study *uses* each model's deformation field — measuring the **Jacobian determinant inside
the hippocampus** — to **detect dementia** (healthy vs demented from OASIS CDR labels),
comparing models by ROC-AUC. This is deformation-based morphometry.

---

## Swapping in a learned model

Implement the interface in `backend/registration.py`:

```python
class VoxelMorphEngine(RegistrationEngine):
    name = "voxelmorph"

    def register(self, fixed, moving) -> RegistrationResult:
        # run the network → displacement (v, u) → warp moving → return result
        ...
```

Register it in `get_engine(...)` and set `ENGINE_NAME` in `main.py`. The metrics,
visualizations, API, and frontend stay unchanged.

---

## Roadmap

- [ ] Deploy (frontend → Vercel, backend → Render) for a live link
- [ ] Wire in pretrained VoxelMorph weights for an authentic DL demo
- [ ] NIfTI (`.nii`) upload + scrollable 3D slice viewer
- [ ] Side-by-side engine comparison (classical vs learned)

---

## Honest caveats

- The live engine is a **classical** baseline (not a neural net) — chosen so the demo runs
  on any CPU. The deep-learning results live in the research section.
- Live-demo Dice uses an **Otsu-thresholded** mask (no labels uploaded); the research uses
  real anatomical **segmentation labels** — the more rigorous version of the same metric.
- Inputs are resized to **192×192** grayscale for a fast, consistent demo.

---

## Author

**Gungun Rani** — Research Intern, NIT Trichy · AI & Full-Stack Developer
[GitHub](https://github.com/GungunRaniSahu) · [LinkedIn](https://www.linkedin.com/in/gungun-rani-300667258/)

## License

Released under the MIT License.
