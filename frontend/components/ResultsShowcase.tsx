// Static showcase of the real NIT Trichy research: VoxelMorph vs TransMorph on
// OASIS, and the Phase-4 dementia-detection application. Images here are the
// actual figures produced by the research notebooks (in /public/research).

const MODELS = [
  {
    name: "VoxelMorph",
    family: "CNN (U-Net)",
    backend: "TensorFlow",
    dice: "0.475 → 0.734",
    auc: "0.637",
    note: "SynthMorph pretrained baseline · Phase 2",
  },
  {
    name: "TransMorph",
    family: "Swin-Transformer + ConvNet",
    backend: "PyTorch",
    dice: "0.472 → 0.883",
    auc: "0.835",
    note: "Learn2Reg OASIS winner · Phase 3",
    best: true,
  },
  {
    name: "MLKA-Net",
    family: "Large-kernel attention",
    backend: "PyTorch",
    dice: "— not evaluated",
    auc: "—",
    note: "No public pretrained weights · future work",
  },
];

export default function ResultsShowcase() {
  return (
    <div>
      <div className="table-wrap">
        <table className="research">
          <thead>
            <tr>
              <th>Model</th>
              <th>Architecture</th>
              <th>Backend</th>
              <th>Mean Dice (before → after)</th>
              <th>Dementia ROC-AUC</th>
              <th>Role in study</th>
            </tr>
          </thead>
          <tbody>
            {MODELS.map((m) => (
              <tr key={m.name}>
                <td className="model">
                  <span className={m.best ? "best" : undefined}>{m.name}</span>
                </td>
                <td className="dim">{m.family}</td>
                <td className="mono">{m.backend}</td>
                <td className="mono">{m.dice}</td>
                <td className="mono">
                  <span className={m.best ? "best" : undefined}>{m.auc}</span>
                </td>
                <td className="dim">{m.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="note">
        Models are evaluated on <b>Neurite-OASIS</b> (414 brains, 35 anatomical
        labels) using <b>Dice</b> on warped segmentation labels. VoxelMorph (Phase 2)
        and TransMorph (Phase 3) were each measured on their own native grid
        (160×160×192 vs 160×192×224), so the raw Dice values are indicative but{" "}
        <i>not yet a like-for-like comparison</i> — a unified single-grid harness with
        significance tests (Wilcoxon, DeLong) is Phase 5, in progress. <b>MLKA-Net</b>{" "}
        has no public pretrained weights and was <i>not evaluated</i>. The TransMorph
        figures below are real outputs from the Phase 3 notebooks.
      </p>

      <div className="readout" style={{ marginTop: 18 }}>
        <div className="readout-main">
          <div className="kicker">Phase 4 · dementia detection · ROC-AUC</div>
          <div className="dice-flow">
            <span className="num">0.637</span>
            <span className="arrow">→</span>
            <span className="num good">0.835</span>
          </div>
          <div className="delta">
            ▲ TransMorph&rsquo;s hippocampus deformation predicts dementia far better
            than VoxelMorph&rsquo;s — a ~0.20 AUC gap
          </div>
        </div>
        <div className="readout-stats">
          <div className="stat">
            <div className="k">VoxelMorph</div>
            <div className="v">0.637</div>
            <div className="u">AUC · CNN</div>
          </div>
          <div className="stat">
            <div className="k">TransMorph</div>
            <div className="v good">0.835</div>
            <div className="u">AUC · Transformer</div>
          </div>
          <div className="stat">
            <div className="k">Task</div>
            <div className="v" style={{ fontSize: 14 }}>
              CDR
            </div>
            <div className="u">healthy vs demented</div>
          </div>
        </div>
      </div>

      <div className="block-title">Fig. 1 — Registration outputs (VoxelMorph)</div>
      <div className="viewer-grid three">
        <Frame src="/research/fixed_moving.png" tag="1a" cap="Fixed vs moving pair" />
        <Frame src="/research/registered.png" tag="1b" cap="Registered result" />
        <Frame
          src="/research/deformation_field.png"
          tag="1c"
          cap="Predicted deformation field"
        />
      </div>

      <div className="block-title">Fig. 2 — Dice, before vs after</div>
      <div className="viewer-grid two">
        <Frame
          src="/research/dice_comparison.png"
          tag="2a"
          cap="Per-structure Dice overlap"
        />
        <Frame
          src="/research/registration_output.png"
          tag="2b"
          cap="Pipeline output"
        />
      </div>

      <div className="block-title">Fig. 3 — TransMorph (Transformer) on OASIS</div>
      <div className="viewer-grid two">
        <Frame src="/research/transmorph_1.png" tag="3a" cap="TransMorph result" />
        <Frame
          src="/research/transmorph_2.png"
          tag="3b"
          cap="Deformation / metrics"
        />
      </div>

      <p className="note">
        <b>Phase 4 — clinical application.</b> Beyond comparing Dice, the study{" "}
        <i>uses</i> each model&rsquo;s deformation: it measures the Jacobian
        determinant inside the <b>hippocampus</b> and trains a classifier to detect{" "}
        <b>dementia</b> (healthy vs demented, OASIS CDR labels), then asks{" "}
        <i>whose deformation is most predictive</i> — deformation-based morphometry,
        scored by ROC-AUC.
      </p>
    </div>
  );
}

function Frame({ src, tag, cap }: { src: string; tag: string; cap: string }) {
  return (
    <figure className="frame">
      <div className="scope">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={cap} />
      </div>
      <figcaption>
        <span className="tag">{tag}</span>
        <span>{cap}</span>
      </figcaption>
    </figure>
  );
}
