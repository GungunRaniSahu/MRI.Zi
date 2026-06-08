// Static showcase of the real NIT Trichy research: VoxelMorph vs TransMorph on
// OASIS, and the Phase-4 dementia-detection application. Images here are the
// actual figures produced by the research notebooks (in /public/research).

const MODELS = [
  {
    name: "VoxelMorph",
    family: "CNN (U-Net)",
    backend: "TensorFlow",
    input: "160×160×192",
    note: "SynthMorph pretrained baseline (Phase 2)",
  },
  {
    name: "TransMorph",
    family: "Swin-Transformer + ConvNet",
    backend: "PyTorch",
    input: "160×192×224",
    note: "Learn2Reg OASIS winner (Phase 3)",
    best: true,
  },
  {
    name: "MLKA-Net",
    family: "Multi-scale large-kernel attention",
    backend: "PyTorch",
    input: "native",
    note: "Attention target model (Phase 4/5)",
  },
];

export default function ResultsShowcase() {
  return (
    <div>
      <table className="research">
        <thead>
          <tr>
            <th>Model</th>
            <th>Architecture</th>
            <th>Backend</th>
            <th>Input size</th>
            <th>Role in study</th>
          </tr>
        </thead>
        <tbody>
          {MODELS.map((m) => (
            <tr key={m.name}>
              <td>
                <span className={m.best ? "best" : undefined}>{m.name}</span>
              </td>
              <td>{m.family}</td>
              <td>{m.backend}</td>
              <td>{m.input}</td>
              <td style={{ color: "var(--text-dim)" }}>{m.note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="note">
        All three models are benchmarked on the <b>same Neurite-OASIS</b> dataset
        (414 brains, 35 anatomical labels) under the same metric — <b>Dice</b> on
        warped segmentation labels — for a fair comparison. Figures below are real
        outputs from the research notebooks.
      </div>

      <h3 style={{ margin: "26px 0 12px", fontSize: 16 }}>
        Registration outputs (VoxelMorph baseline)
      </h3>
      <div className="grid cols-3">
        <Tile src="/research/fixed_moving.png" cap="Fixed vs moving OASIS pair" />
        <Tile src="/research/registered.png" cap="Registered result" />
        <Tile
          src="/research/deformation_field.png"
          cap="Predicted deformation field"
        />
      </div>

      <h3 style={{ margin: "26px 0 12px", fontSize: 16 }}>
        Dice: before vs after registration
      </h3>
      <div className="grid cols-2">
        <Tile
          src="/research/dice_comparison.png"
          cap="Per-structure Dice (overlap accuracy)"
        />
        <Tile
          src="/research/registration_output.png"
          cap="Registration pipeline output"
        />
      </div>

      <h3 style={{ margin: "26px 0 12px", fontSize: 16 }}>
        TransMorph (Transformer) on OASIS
      </h3>
      <div className="grid cols-2">
        <Tile src="/research/transmorph_1.png" cap="TransMorph registration result" />
        <Tile src="/research/transmorph_2.png" cap="TransMorph deformation / metrics" />
      </div>

      <div className="note">
        <b>Phase 4 — clinical application.</b> Beyond comparing Dice, the study{" "}
        <i>uses</i> each model&rsquo;s deformation field: it measures the Jacobian
        determinant inside the <b>hippocampus</b> and trains a classifier to detect{" "}
        <b>dementia</b> (healthy vs demented from OASIS CDR labels), then asks{" "}
        <i>whose deformation is most predictive</i> — deformation-based morphometry,
        scored by ROC-AUC.
      </div>
    </div>
  );
}

function Tile({ src, cap }: { src: string; cap: string }) {
  return (
    <div className="tile">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={cap} />
      <div className="cap">{cap}</div>
    </div>
  );
}
