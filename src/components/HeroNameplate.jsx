import { useEffect, useRef, useState } from "react";

/**
 * Bare module readout — thin metal bezel, sunken matte screen,
 * detailed flex circuit at the bottom. Type matches CodePod screen.
 * Power follows the main device with a short random flicker, no CRT wipe.
 */
export function HeroNameplate({
  name = "Harshal",
  line = "Product designer. Interactive work you can hold — case studies, shipped products, and AI experiments below.",
  accent = "#1fe06a",
  powered = true,
  rootRef,
}) {
  const traces = [
    11, 14, 9, 16, 12, 15, 10, 17, 13, 11, 16, 9, 14, 12, 15, 10, 17, 13, 11, 14,
    12, 16, 10, 15,
  ];

  const [screenOn, setScreenOn] = useState(powered);
  const [dim, setDim] = useState(false);
  const skipFlicker = useRef(true);

  // Same pixel-diamond cursor as the CodePod screen
  const CP_PIX = 1;
  const cpDiamondRows = [
    [3],
    [2, 3, 4],
    [1, 2, 3, 4, 5],
    [0, 1, 2, 3, 4, 5, 6],
    [1, 2, 3, 4, 5],
    [2, 3, 4],
    [3],
  ];
  const cpDiamondCells = cpDiamondRows.flatMap((cols, cy) =>
    cols.map((cx) => [cx, cy])
  );
  const cpRectsFor = (cells) =>
    cells
      .map(
        ([cx, cy]) =>
          `<rect x='${cx * CP_PIX}' y='${cy * CP_PIX}' width='${CP_PIX}' height='${CP_PIX}'/>`
      )
      .join("");
  const screenCursorSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 ${7 * CP_PIX} ${7 * CP_PIX}' shape-rendering='crispEdges'><g fill='${accent}'>${cpRectsFor(cpDiamondCells)}</g></svg>`;
  const screenCursor = `url("data:image/svg+xml,${encodeURIComponent(screenCursorSvg)}") 7 7, auto`;

  // Soft 1–2 brightness dips, then settle — no hard cut or CRT wipe
  useEffect(() => {
    if (skipFlicker.current) {
      skipFlicker.current = false;
      setScreenOn(powered);
      setDim(false);
      return;
    }

    const timers = [];
    const count = Math.random() < 0.6 ? 1 : 2;
    let t = 40;

    // Keep the picture up while flickering so dips read as dim, not blackouts
    if (powered) setScreenOn(true);

    for (let i = 0; i < count; i++) {
      const dip = 55 + Math.floor(Math.random() * 35);
      const recover = 90 + Math.floor(Math.random() * 50);
      timers.push(setTimeout(() => setDim(true), t));
      t += dip;
      timers.push(setTimeout(() => setDim(false), t));
      t += recover;
    }

    timers.push(
      setTimeout(() => {
        setDim(false);
        setScreenOn(powered);
      }, t)
    );

    return () => {
      timers.forEach(clearTimeout);
      setDim(false);
    };
  }, [powered]);

  return (
    <div
      ref={rootRef}
      className="hero-nameplate"
      style={{
        ["--np-accent"]: accent,
        ["--np-glow"]: `${accent}55`,
      }}
    >
      <div className="hero-nameplate-module">
        <div className="hero-nameplate-bezel" aria-hidden="true" />
        <div
          className={`hero-nameplate-screen${screenOn ? " is-on" : ""}${
            dim ? " is-dim" : ""
          }`}
          style={{ cursor: screenOn ? screenCursor : "default" }}
        >
          <div
            className="hero-nameplate-grid"
            style={{ opacity: screenOn ? 1 : 0.3 }}
            aria-hidden="true"
          />
          <div className="hero-nameplate-scan" aria-hidden="true" />
          {screenOn && <div className="hero-nameplate-gloss" aria-hidden="true" />}

          {screenOn ? (
            <div className="hero-nameplate-copy">
              <p className="hero-nameplate-kicker">PD</p>
              <h1 className="hero-brand">{name}</h1>
              <p className="hero-line">
                {line}
                <span className="hero-nameplate-caret" aria-hidden="true" />
              </p>
            </div>
          ) : (
            <div className="hero-nameplate-off" aria-hidden="true" />
          )}
        </div>

        <div className="hero-nameplate-flex" aria-hidden="true">
          <svg
            className="hero-nameplate-flex-svg"
            viewBox="0 0 360 16"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="flex-green" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2a8f4e" />
                <stop offset="45%" stopColor="#1a6b38" />
                <stop offset="100%" stopColor="#0f4424" />
              </linearGradient>
              <linearGradient id="flex-gold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f0d78a" />
                <stop offset="35%" stopColor="#d4a84b" />
                <stop offset="100%" stopColor="#9a7420" />
              </linearGradient>
              <linearGradient id="flex-pad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#efe6c8" />
                <stop offset="100%" stopColor="#c4a35a" />
              </linearGradient>
            </defs>

            {/* substrate */}
            <rect width="360" height="16" fill="url(#flex-green)" />
            {/* weave / fiber hint */}
            <g opacity="0.12" stroke="#0a2012" strokeWidth="0.35">
              {Array.from({ length: 10 }, (_, i) => (
                <line key={`h${i}`} x1="0" y1={1 + i * 1.5} x2="360" y2={1 + i * 1.5} />
              ))}
            </g>

            {/* contact finger row under the glass edge */}
            {traces.map((len, i) => {
              const x = 22 + i * 13.2;
              const h = Math.min(len * 0.45, 8);
              return (
                <g key={`t${i}`}>
                  <rect
                    x={x}
                    y="0"
                    width="4"
                    height="3"
                    rx="0.3"
                    fill="url(#flex-pad)"
                  />
                  <rect
                    x={x + 1}
                    y="3"
                    width="2"
                    height={h}
                    fill="url(#flex-gold)"
                  />
                  <circle
                    cx={x + 2}
                    cy={3 + h + 1}
                    r="0.65"
                    fill="#c9a227"
                    opacity="0.85"
                  />
                </g>
              );
            })}

            {/* horizontal bus near bottom */}
            <rect x="22" y="13" width="316" height="0.9" fill="#c9a227" opacity="0.55" />
            <rect x="48" y="11" width="1.1" height="2.5" fill="#c9a227" opacity="0.5" />
            <rect x="180" y="11" width="1.1" height="2.5" fill="#c9a227" opacity="0.5" />
            <rect x="300" y="11" width="1.1" height="2.5" fill="#c9a227" opacity="0.5" />

            {/* silkscreen marks */}
            <text
              x="28"
              y="15.2"
              fill="#d7f5e2"
              fontSize="2.4"
              fontFamily="monospace"
              opacity="0.45"
            >
              J2 · FFC
            </text>
            <text
              x="312"
              y="15.2"
              fill="#d7f5e2"
              fontSize="2.4"
              fontFamily="monospace"
              opacity="0.4"
            >
              24P
            </text>
          </svg>

          {/* Screws as overlays so they stay round (SVG stretch would squash them) */}
          <span className="hero-nameplate-screw is-left" />
          <span className="hero-nameplate-screw is-right" />
        </div>
      </div>
    </div>
  );
}

/**
 * Cable measured between devices. Soft shadow offsets bottom-right
 * to match the CodePod light (from top-left).
 */
export function HeroCable({ path }) {
  if (!path) return null;

  const { x1, y1, x2, y2, w, h } = path;
  const midX = (x1 + x2) / 2;
  const dip = Math.max(y1, y2) + Math.min(56, Math.abs(x2 - x1) * 0.35);
  const d = `M ${x1} ${y1} C ${midX - 20} ${y1}, ${midX - 10} ${dip}, ${midX} ${dip} S ${midX + 20} ${y2}, ${x2} ${y2}`;
  const shadowD = `M ${x1 + 5} ${y1 + 7} C ${midX - 15} ${y1 + 7}, ${midX - 5} ${dip + 10}, ${midX + 5} ${dip + 10} S ${midX + 25} ${y2 + 7}, ${x2 + 5} ${y2 + 7}`;

  return (
    <svg
      className="hero-cable"
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hero-cable-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3a3f44" />
          <stop offset="40%" stopColor="#1a1d20" />
          <stop offset="100%" stopColor="#3a3f44" />
        </linearGradient>
        <linearGradient id="hero-cable-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
          <stop offset="55%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <filter id="hero-cable-blur" x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>

      <path
        d={shadowD}
        stroke="rgba(15,20,20,0.22)"
        strokeWidth="14"
        strokeLinecap="round"
        filter="url(#hero-cable-blur)"
      />
      <path
        d={shadowD}
        stroke="rgba(15,20,20,0.14)"
        strokeWidth="8"
        strokeLinecap="round"
        filter="url(#hero-cable-blur)"
      />
      <path
        d={d}
        stroke="url(#hero-cable-body)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d={d}
        stroke="url(#hero-cable-shine)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.65"
      />

      <rect x={x1 - 5} y={y1 - 7} width="10" height="14" rx="2" fill="#2a2e32" />
      <rect x={x2 - 5} y={y2 - 7} width="10" height="14" rx="2" fill="#2a2e32" />
    </svg>
  );
}
