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
      <div className="panel">
        <div className="toolbar">
          <div className="field">
            <label>Fixed / target</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFixed(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="field">
            <label>Moving / source</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setMoving(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="toolbar-actions">
            <button className="btn ghost" disabled={loading} onClick={() => run(true)}>
              Load example
            </button>
            <button className="btn" disabled={!canUpload} onClick={() => run(false)}>
              {loading ? "Registering…" : "Register"}
            </button>
          </div>
        </div>

        <div className={`statusbar ${error ? "err" : ""}`}>
          {online === null && "Checking backend…"}
          {online === false && (
            <>
              <span className="led down" />
              Backend offline — run <code>uvicorn main:app --port 8000</code> in
              /backend
            </>
          )}
          {online && !error && (
            <>
              <span className="led ok" />
              Backend online · engine TV-L1 optical flow · inputs 192×192 grayscale
            </>
          )}
          {error && (
            <>
              <span className="led down" />
              {error}
            </>
          )}
        </div>
      </div>

      {result && <Results result={result} />}
    </div>
  );
}

function Results({ result }: { result: RegistrationResponse }) {
  const m = result.metrics;
  const improved = m.improvement >= 0;
  return (
    <div>
      <div className="readout">
        <div className="readout-main">
          <div className="kicker">Dice overlap · before → after</div>
          <div className="dice-flow">
            <span className="num">{m.dice_before.toFixed(3)}</span>
            <span className="arrow">→</span>
            <span className="num good">{m.dice_after.toFixed(3)}</span>
          </div>
          <div className={`delta ${improved ? "" : "neg"}`}>
            {improved ? "▲" : "▼"} {improved ? "+" : ""}
            {m.improvement.toFixed(3)} ({improved ? "+" : ""}
            {m.improvement_pct.toFixed(1)}%) overlap with target
          </div>
        </div>
        <div className="readout-stats">
          <div className="stat">
            <div className="k">Mean disp.</div>
            <div className="v">{m.mean_displacement.toFixed(2)}</div>
            <div className="u">pixels</div>
          </div>
          <div className="stat">
            <div className="k">Folding</div>
            <div className="v">{(m.folding_fraction * 100).toFixed(2)}%</div>
            <div className="u">non-diffeo.</div>
          </div>
          <div className="stat">
            <div className="k">Engine</div>
            <div className="v" style={{ fontSize: 14 }}>
              TV-L1
            </div>
            <div className="u">optical flow</div>
          </div>
        </div>
      </div>

      <div className="block-title">Fixed · Moving · Registered</div>
      <div className="viewer-grid three">
        <Frame src={result.images.fixed} tag="A" cap="Fixed (target)" />
        <Frame src={result.images.moving} tag="B" cap="Moving (input)" />
        <Frame src={result.images.registered} tag="B→A" cap="Registered (output)" />
      </div>

      <div className="block-title">What registration changed</div>
      <div className="viewer-grid two">
        <Frame
          src={result.images.diff_before}
          tag="Δ"
          cap="Difference before (fixed − moving)"
        />
        <Frame
          src={result.images.diff_after}
          tag="Δ"
          cap="Difference after (fixed − registered)"
        />
        <Frame
          src={result.images.deformation_grid}
          tag="φ"
          cap="Deformation field (warped grid)"
        />
        <Frame
          src={result.images.jacobian}
          tag="|J|"
          cap="Jacobian — shrink vs expand"
        />
      </div>

      <p className="note">
        A flatter <b>difference-after</b> map and a higher <b>Dice-after</b> mean the
        moving image was warped onto the fixed one. The deformation grid shows{" "}
        <i>where</i> space was stretched; the Jacobian shows local shrinkage vs
        expansion — the same signal Phase&nbsp;4 of the research uses to detect
        hippocampal atrophy.
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
