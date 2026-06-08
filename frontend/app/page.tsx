import Playground from "@/components/Playground";
import ResultsShowcase from "@/components/ResultsShowcase";

export default function Home() {
  return (
    <main>
      <header className="masthead">
        <div className="container">
          <div className="masthead-top">
            <span className="brand">MRI.Zi</span>
            <span>Deformable Registration · NIT Trichy Research</span>
          </div>
          <div className="masthead-body">
            <h1 className="display">
              Aligning two brains is a <em>warp</em>, not a shift.
            </h1>
            <p className="lede">
              A working playground for non-rigid medical image registration —
              estimate a dense deformation field that bends one brain slice onto
              another, then read the Dice overlap before and after. Paired with the
              deep-learning study (VoxelMorph, TransMorph, MLKA-Net) it grew out of.
            </p>
            <dl className="meta-row">
              <div className="cell">
                <dt>Stack</dt>
                <dd>FastAPI · Next.js</dd>
              </div>
              <div className="cell">
                <dt>Engine</dt>
                <dd>TV-L1 optical flow</dd>
              </div>
              <div className="cell">
                <dt>Dataset</dt>
                <dd>OASIS · 35 labels</dd>
              </div>
              <div className="cell">
                <dt>Metric</dt>
                <dd>Dice overlap</dd>
              </div>
            </dl>
          </div>
        </div>
      </header>

      <section className="band">
        <div className="container">
          <div className="sec-head">
            <span className="sec-num">01</span>
            <div>
              <h2>Live registration</h2>
              <p>
                Give it a <b>fixed</b> (target) and a <b>moving</b> brain slice — or
                load the built-in example. The backend estimates a per-pixel
                deformation field, warps the moving image onto the fixed one, and
                reports Dice overlap before vs after, running live on CPU.
              </p>
            </div>
          </div>
          <Playground />
        </div>
      </section>

      <section className="band alt">
        <div className="container">
          <div className="sec-head">
            <span className="sec-num">02</span>
            <div>
              <h2>The research behind it</h2>
              <p>
                The playground uses a classical baseline so it runs anywhere. The
                study below benchmarks three pretrained deep models on real 3D OASIS
                brains under one metric — then applies registration to dementia
                detection.
              </p>
            </div>
          </div>
          <ResultsShowcase />
        </div>
      </section>

      <footer>
        <div className="container">
          Gungun Rani — Research Intern, NIT Trichy
          <br />
          github.com/
          <a
            href="https://github.com/GungunRaniSahu"
            target="_blank"
            rel="noreferrer"
          >
            GungunRaniSahu
          </a>
          <br />
          Live engine: classical TV-L1 optical flow (CPU). Pluggable backend accepts
          learned VoxelMorph / TransMorph weights behind the same API.
        </div>
      </footer>
    </main>
  );
}
