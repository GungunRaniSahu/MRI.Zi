import Playground from "@/components/Playground";
import ResultsShowcase from "@/components/ResultsShowcase";

export default function Home() {
  return (
    <main>
      <header className="hero">
        <div className="container">
          <h1>
            MRI.Zi — <span className="grad">Deformable Brain-MRI Registration</span>
          </h1>
          <p>
            An interactive playground for non-rigid medical image registration,
            paired with deep-learning research results (VoxelMorph, TransMorph,
            MLKA-Net) benchmarked on the OASIS brain-MRI dataset. Upload two slices,
            watch one warp onto the other, and see the Dice score improve in real
            time.
          </p>
          <div className="badges">
            <span className="badge">FastAPI</span>
            <span className="badge">Next.js</span>
            <span className="badge">scikit-image · TV-L1 optical flow</span>
            <span className="badge">VoxelMorph / TransMorph</span>
            <span className="badge">OASIS · Dice</span>
            <span className="badge">Research: NIT Trichy</span>
          </div>
        </div>
      </header>

      <section>
        <div className="container">
          <div className="section-head">
            <p className="section-title">Live demo</p>
            <h2>Registration playground</h2>
            <p>
              Upload a <b>fixed</b> (target) and a <b>moving</b> brain slice, or try
              the built-in example. The backend estimates a dense per-pixel
              deformation field, warps the moving image onto the fixed one, and
              reports Dice overlap before vs after — the same evaluation used in the
              research, running live on CPU.
            </p>
          </div>
          <Playground />
        </div>
      </section>

      <section style={{ background: "var(--bg-soft)" }}>
        <div className="container">
          <div className="section-head">
            <p className="section-title">Research</p>
            <h2>Deep-learning registration on OASIS</h2>
            <p>
              The interactive demo above uses a classical baseline so it runs
              anywhere. The research below uses pretrained deep models on real 3D
              OASIS brains — benchmarking three model families under one metric, then
              applying registration to dementia detection.
            </p>
          </div>
          <ResultsShowcase />
        </div>
      </section>

      <footer>
        <div className="container">
          Built by Gungun Rani · Research Intern, NIT Trichy ·{" "}
          <a href="https://github.com/GungunRaniSahu" target="_blank" rel="noreferrer">
            github.com/GungunRaniSahu
          </a>
          <br />
          Live engine: classical TV-L1 optical flow (CPU). The pluggable backend
          accepts learned VoxelMorph / TransMorph weights behind the same API.
        </div>
      </footer>
    </main>
  );
}
