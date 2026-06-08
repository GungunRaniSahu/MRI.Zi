"use client";

import { useEffect, useState } from "react";
import {
  getHealth,
  registerSample,
  registerUploaded,
  type RegistrationResponse,
} from "@/lib/api";

export default function Playground() {
  const [fixed, setFixed] = useState<File | null>(null);
  const [moving, setMoving] = useState<File | null>(null);
  const [result, setResult] = useState<RegistrationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    getHealth()
      .then(() => setOnline(true))
      .catch(() => setOnline(false));
  }, []);

  async function run(useSample: boolean) {
    setLoading(true);
    setError(null);
    try {
      const res = useSample
        ? await registerSample()
        : await registerUploaded(fixed!, moving!);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "registration failed");
    } finally {
      setLoading(false);
    }
  }

  const canUpload = fixed && moving && !loading;

  return (
    <div>
      <div className="card">
        <div className="controls">
          <div className="upload">
            <label>Fixed image (target)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFixed(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="upload">
            <label>Moving image (to align)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setMoving(e.target.files?.[0] ?? null)}
            />
          </div>
          <button className="btn" disabled={!canUpload} onClick={() => run(false)}>
            {loading ? "Registering…" : "Register"}
          </button>
          <button
            className="btn secondary"
            disabled={loading}
            onClick={() => run(true)}
          >
            Try an example
          </button>
        </div>

        <div className={`status-line ${error ? "err" : ""}`}>
          {online === null && "Checking backend…"}
          {online === false && (
            <>
              <span className="dot down" />
              Backend offline — start it with{" "}
              <code>uvicorn main:app --port 8000</code> in <code>/backend</code>.
            </>
          )}
          {online && !error && (
            <>
              <span className="dot ok" />
              Backend online · engine: classical TV-L1 optical flow · inputs resized
              to 192×192
            </>
          )}
          {error && <>⚠ {error}</>}
        </div>
      </div>

      {result && <Results result={result} />}
    </div>
  );
}

function Results({ result }: { result: RegistrationResponse }) {
  const m = result.metrics;
  return (
    <div style={{ marginTop: 24 }}>
      <div className="metrics">
        <div className="metric">
          <div className="k">Dice before</div>
          <div className="v">{m.dice_before.toFixed(3)}</div>
          <div className="sub">moving ↔ fixed overlap</div>
        </div>
        <div className="metric">
          <div className="k">Dice after</div>
          <div className="v good">{m.dice_after.toFixed(3)}</div>
          <div className="sub">registered ↔ fixed overlap</div>
        </div>
        <div className="metric">
          <div className="k">Improvement</div>
          <div className="v good">
            {m.improvement >= 0 ? "+" : ""}
            {m.improvement.toFixed(3)}
          </div>
          <div className="sub">
            {m.improvement_pct >= 0 ? "+" : ""}
            {m.improvement_pct.toFixed(1)}% relative
          </div>
        </div>
        <div className="metric">
          <div className="k">Mean displacement</div>
          <div className="v">{m.mean_displacement.toFixed(2)}</div>
          <div className="sub">pixels</div>
        </div>
        <div className="metric">
          <div className="k">Folding</div>
          <div className="v">{(m.folding_fraction * 100).toFixed(2)}%</div>
          <div className="sub">non-diffeomorphic px</div>
        </div>
      </div>

      <h3 style={{ margin: "8px 0 12px", fontSize: 16 }}>Images</h3>
      <div className="grid cols-3">
        <Tile src={result.images.fixed} cap="Fixed (target)" />
        <Tile src={result.images.moving} cap="Moving (input)" />
        <Tile src={result.images.registered} cap="Registered (output)" />
      </div>

      <h3 style={{ margin: "22px 0 12px", fontSize: 16 }}>
        How registration changed things
      </h3>
      <div className="grid cols-2">
        <Tile
          src={result.images.diff_before}
          cap="Difference BEFORE (fixed − moving)"
        />
        <Tile
          src={result.images.diff_after}
          cap="Difference AFTER (fixed − registered)"
        />
        <Tile
          src={result.images.deformation_grid}
          cap="Deformation field (warped grid)"
        />
        <Tile
          src={result.images.jacobian}
          cap="Jacobian determinant (shrink ↔ expand)"
        />
      </div>

      <div className="note">
        A smaller / flatter <b>difference-after</b> map and a higher{" "}
        <b>Dice-after</b> mean the moving image was successfully warped onto the
        fixed one. The deformation grid shows <i>where</i> space was stretched; the
        Jacobian shows local shrinkage (blue) vs expansion (red) — the same signal
        Phase&nbsp;4 of the research uses to detect hippocampal atrophy.
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
