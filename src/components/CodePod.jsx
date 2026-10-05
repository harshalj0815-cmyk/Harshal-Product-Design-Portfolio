import React, { useState, useMemo, useRef, useEffect } from "react";
import { Power, ChevronLeft, ChevronRight } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Tiny syntax highlighter — just enough to sell "code on a screen"  */
/* ------------------------------------------------------------------ */
const TOKEN_RULES = [
  { type: "comment", re: /(\/\/.*$|#.*$)/gm },
  { type: "string", re: /(`[^`]*`|"[^"]*"|'[^']*')/g },
  {
    type: "keyword",
    re: /\b(function|return|const|let|var|def|for|in|if|else|fn|let|mut|import|from|class|new|println!|console|vec!|impl|struct|pub|self|True|False|None)\b/g,
  },
  { type: "number", re: /\b(\d+(\.\d+)?)\b/g },
];

function highlight(code) {
  const marks = [];
  TOKEN_RULES.forEach(({ type, re }) => {
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(code)) !== null) {
      marks.push({ start: m.index, end: m.index + m[0].length, type });
      if (m[0].length === 0) re.lastIndex++;
    }
  });
  marks.sort((a, b) => a.start - b.start || b.end - a.end);
  const kept = [];
  let cursor = 0;
  for (const mk of marks) {
    if (mk.start >= cursor) {
      kept.push(mk);
      cursor = mk.end;
    }
  }
  const colors = {
    comment: "#6f8578",
    string: "#5dff9a",
    keyword: "#ff8a3d",
    number: "#5eb8ff",
  };
  const out = [];
  let last = 0;
  kept.forEach((mk, i) => {
    if (mk.start > last) out.push(<span key={`t${i}`}>{code.slice(last, mk.start)}</span>);
    out.push(
      <span key={`m${i}`} style={{ color: colors[mk.type] }}>
        {code.slice(mk.start, mk.end)}
      </span>
    );
    last = mk.end;
  });
  if (last < code.length) out.push(<span key="tail">{code.slice(last)}</span>);
  return out;
}

/* ------------------------------------------------------------------ */
/*  Pixel ships — type colors (high sat), different silhouettes        */
/* ------------------------------------------------------------------ */
const SHIP_COLORS = {
  player: { fill: "#2ecbff", glow: "rgba(46, 203, 255, 0.9)" },
  enemy: { fill: "#ff3b4a", glow: "rgba(255, 59, 74, 0.9)" },
  hunter: { fill: "#c44dff", glow: "rgba(196, 77, 255, 0.9)" },
  playerBolt: { fill: "#ff9a1a", glow: "rgba(255, 154, 26, 0.85)" },
  enemyBolt: { fill: "#ffd84a", glow: "rgba(255, 216, 74, 0.8)" },
  hunterBolt: { fill: "#e08cff", glow: "rgba(224, 140, 255, 0.85)" },
};

const PIXEL_SHIPS = {
  // player — pointed fighter, nose up
  player: ["00100", "01110", "11111", "10101", "10001"],
  // formation variants — nose down toward the player
  enemyA: ["10001", "10101", "11111", "01110", "00100"],
  enemyB: ["01010", "11111", "01110", "11111", "00100"],
  enemyC: ["11111", "10101", "01110", "00100", "00100"],
  // hunter — wide interceptor
  hunter: ["10001", "11011", "11111", "01110", "10101"],
};

const ENEMY_VARIANTS = ["enemyA", "enemyB", "enemyC"];

function PixelShip({
  variant = "player",
  colorKey = "player",
  flipX = false,
  size = 14,
}) {
  const pattern = PIXEL_SHIPS[variant] || PIXEL_SHIPS.player;
  const { fill, glow } = SHIP_COLORS[colorKey] || SHIP_COLORS.player;
  const rows = pattern.length;
  const cols = pattern[0].length;
  return (
    <div
      aria-hidden="true"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        width: size,
        height: Math.round((size * rows) / cols),
        imageRendering: "pixelated",
        transform: flipX ? "scaleX(-1)" : "none",
        filter: `drop-shadow(0 0 3px ${glow})`,
        flexShrink: 0,
      }}
    >
      {pattern.flatMap((row, y) =>
        row.split("").map((cell, x) => (
          <span
            key={`${x}-${y}`}
            style={{
              background: cell === "1" ? fill : "transparent",
              imageRendering: "pixelated",
            }}
          />
        ))
      )}
    </div>
  );
}

function PixelBolt({ colorKey = "playerBolt", tall = true }) {
  const { fill, glow } = SHIP_COLORS[colorKey] || SHIP_COLORS.playerBolt;
  return (
    <div
      aria-hidden="true"
      style={{
        width: 2,
        height: tall ? 10 : 8,
        background: fill,
        boxShadow: `0 0 4px ${glow}`,
        imageRendering: "pixelated",
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  QFP chip generator — a square IC with fine pins on all four sides */
/* ------------------------------------------------------------------ */
function QFPChip({ x, y, size, pins = 8, label, showPad }) {
  const pitch = size / (pins + 1);
  const pinLen = 3.4;
  const pinW = 1.3;
  return (
    <g opacity="0.85">
      {Array.from({ length: pins }).map((_, i) => {
        const off = pitch * (i + 1);
        return (
          <g key={`pin-${i}`} fill="#c7cbc9">
            <rect x={x + off - pinW / 2} y={y - pinLen} width={pinW} height={pinLen} />
            <rect x={x + off - pinW / 2} y={y + size} width={pinW} height={pinLen} />
            <rect x={x - pinLen} y={y + off - pinW / 2} width={pinLen} height={pinW} />
            <rect x={x + size} y={y + off - pinW / 2} width={pinLen} height={pinW} />
          </g>
        );
      })}
      <rect x={x} y={y} width={size} height={size} rx="1.5" fill="url(#icSheen)" stroke="#3f4342" strokeWidth="0.8" />
      <circle cx={x + 6} cy={y + 6} r="1.1" fill="#6b6f70" />
      {showPad && (
        <rect x={x + size / 2 - 8} y={y + size / 2 - 8} width="16" height="16" fill="#2a2c2c" stroke="#5a5f5e" strokeWidth="0.6" />
      )}
      {label && (
        <text x={x + size / 2} y={y + size / 2 + 2.5} fontSize="5" fill="#8a908d" fontFamily="monospace" textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  PCB backplate — visible through the translucent shell             */
/* ------------------------------------------------------------------ */
function PcbLayer() {
  // The board sits inside the clear shell as its own distinct part, and it
  // runs a little wider than the screen module above it, so a sliver of
  // green is visible past the screen's edges rather than lining up with it.
  const bx = 3, by = 10, bw = 294, bh = 456; // board bounding box
  const rot = 0; // degrees

  const resistors = [
    [20, 214, "#c98a3a", "#3a7d44"], [20, 234, "#3a7d44", "#c94a3a"], [20, 254, "#c94a3a", "#8a5a2a"], [20, 274, "#8a5a2a", "#3a7d44"],
    [258, 214, "#8a5a2a", "#c98a3a"], [258, 234, "#3a7d44", "#c98a3a"], [258, 254, "#c94a3a", "#3a7d44"], [258, 274, "#c98a3a", "#8a5a2a"],
    [96, 414, "#c98a3a", "#3a7d44"], [122, 414, "#3a7d44", "#c94a3a"],
    [172, 414, "#c94a3a", "#8a5a2a"], [198, 414, "#8a5a2a", "#c98a3a"],
  ];

  const ceramicCaps = [
    [96, 224], [196, 224], [40, 300], [244, 340],
  ];

  const vias = [
    [30, 226], [30, 250], [266, 226], [266, 250],
    [86, 218], [206, 218], [96, 310], [190, 310], [76, 350], [214, 350],
    [56, 414], [238, 414], [150, 340], [150, 400],
    [30, 400], [266, 400],
  ];

  const pads = [
    [20, 226], [20, 250], [258, 226], [258, 250], [96, 426], [122, 426],
    [172, 426], [198, 426], [56, 300], [244, 300],
  ];

  return (
    <svg
      viewBox="0 0 300 470"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.95 }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="pcbBase" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a7a3e" />
          <stop offset="55%" stopColor="#0f6b34" />
          <stop offset="100%" stopColor="#0a4f27" />
        </linearGradient>
        <linearGradient id="copper" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f0cf8e" />
          <stop offset="100%" stopColor="#c99a4e" />
        </linearGradient>
        <linearGradient id="copperDim" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e0b96f" />
          <stop offset="100%" stopColor="#a9803f" />
        </linearGradient>
        <pattern id="hatch" width="5" height="5" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="5" stroke="#0c4020" strokeWidth="1" />
        </pattern>
        <radialGradient id="icSheen" cx="30%" cy="20%" r="80%">
          <stop offset="0%" stopColor="#3a3d3e" />
          <stop offset="100%" stopColor="#131414" />
        </radialGradient>
        <linearGradient id="battFoil" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5f7f6" />
          <stop offset="50%" stopColor="#dadfdd" />
          <stop offset="100%" stopColor="#b4bab7" />
        </linearGradient>
        <linearGradient id="battTab" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f2b23a" />
          <stop offset="50%" stopColor="#d98f1f" />
          <stop offset="100%" stopColor="#b06e12" />
        </linearGradient>
        {/* simulate the pouch cell's real-world puffiness: a soft highlight
            where light catches the bulge, and a vignette that darkens
            toward the edges — both confined inside the battery's own
            shape, unlike the board's external drop-shadow */}
        <radialGradient id="battPuffHighlight" cx="38%" cy="28%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="battPuffShade" cx="50%" cy="48%" r="72%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0" />
          <stop offset="62%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.42" />
        </radialGradient>
        <filter id="boardShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.35" />
        </filter>
        <filter id="battPop" x="-25%" y="-50%" width="150%" height="220%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0a1512" floodOpacity="0.55" />
        </filter>
        <clipPath id="boardClip">
          <rect x={bx} y={by} width={bw} height={bh} rx="26" />
        </clipPath>
      </defs>

      {/* the board sits at a slight, deliberate tilt off the case axis */}
      <g transform={`rotate(${rot} ${bx + bw / 2} ${by + bh / 2})`}>
        {/* the board itself — inset from every edge, with its own drop shadow.
            Corner radius matches the outer case's own rounding (~30/22px on
            a similar-width box) so the board's curves read as consistent
            with the shell around it rather than sharper or flatter. */}
        <rect x={bx} y={by} width={bw} height={bh} rx="26" fill="url(#pcbBase)" stroke="#063a1c" strokeWidth="1" filter="url(#boardShadow)" />

        <g clipPath="url(#boardClip)">
        <rect x={bx} y={by} width={bw} height={bh} fill="url(#hatch)" opacity="0.22" />
        {/* ground-plane pour */}
        <rect x={bx + 8} y={by + 8} width={bw - 16} height={bh - 16} rx="10" fill="#eaf5ee" opacity="0.06" />

        {/* ================= dense trace network ================= */}
        <g stroke="url(#copper)" strokeWidth="1.05" fill="none" opacity="0.6" strokeLinecap="round">
          <path d="M40 176 v20 l10 10 h20" />
          <path d="M66 176 v14 l8 8 h20" />
          <path d="M92 176 v10 h14 l10 10 v10" />
          <path d="M196 186 v10 l-10 10 h-14" />
          <path d="M222 186 v14 l-8 8 h-20" />
          <path d="M248 176 v20 l-10 10 h-20" />
          <path d="M30 232 h30 l10 -10 h20" />
          <path d="M30 256 h20 l10 10 h26" />
          <path d="M266 232 h-30 l-10 -10 h-20" />
          <path d="M266 256 h-20 l-10 10 h-26" />
          <path d="M86 226 v-8 h30 l8 -8" />
          <path d="M206 226 v-8 h-30 l-8 -8" />
          <path d="M96 310 h-20 l-10 10 v20" />
          <path d="M190 310 h20 l10 10 v20" />
          <path d="M76 350 h-20 v40 h20" />
          <path d="M214 350 h20 v40 h-20" />
          <path d="M150 340 v20 h30 v20" />
          <path d="M150 340 v14 h-30 v14" />
          <path d="M56 300 h-20" />
          <path d="M244 300 h20" />
          <path d="M96 426 v-12 h26 v-8" />
          <path d="M122 426 v-12" />
          <path d="M172 426 v-12" />
          <path d="M198 426 v-12 h-26 v-8" />
          <path d="M150 180 v-14 h-30" />
          <path d="M150 200 v14 h30" />
        </g>
        {/* fine signal / bus traces */}
        <g stroke="url(#copperDim)" strokeWidth="0.5" fill="none" opacity="0.55">
          {Array.from({ length: 8 }).map((_, i) => (
            <path key={`fan-${i}`} d={`M${118 + i * 8} 226 v-10 h${i % 2 === 0 ? -10 : 10}`} />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <path key={`fan2-${i}`} d={`M${118 + i * 8} 306 v10 h${i % 2 === 0 ? 10 : -10}`} />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <path key={`fanL-${i}`} d={`M110 ${232 + i * 8} h-10 v${i % 2 === 0 ? -6 : 6}`} />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <path key={`fanR-${i}`} d={`M182 ${232 + i * 8} h10 v${i % 2 === 0 ? -6 : 6}`} />
          ))}
          {/* bus between the two QFP chips */}
          {Array.from({ length: 6 }).map((_, i) => (
            <path key={`bus-${i}`} d={`M204 ${312 + i * 3} h14`} />
          ))}
        </g>

        {/* vias */}
        {vias.map(([x, y], i) => (
          <g key={`via-${i}`}>
            <circle cx={x} cy={y} r="2.2" fill="none" stroke="#c8a664" strokeWidth="0.8" opacity="0.55" />
            <circle cx={x} cy={y} r="0.75" fill="#08341a" opacity="0.85" />
          </g>
        ))}

        {/* pads */}
        {pads.map(([x, y], i) => (
          <circle key={`pad-${i}`} cx={x} cy={y} r="2.1" fill="#e3c07a" opacity="0.65" />
        ))}

        {/* large orange tooling / test pads, like a populated production board */}
        {[[220, 200], [58, 340], [214, 424]].map(([x, y], i) => (
          <g key={`tool-${i}`}>
            <circle cx={x} cy={y} r="6" fill="none" stroke="#e08a3a" strokeWidth="1.6" opacity="0.6" />
            <circle cx={x} cy={y} r="2.4" fill="#08341a" opacity="0.7" />
          </g>
        ))}

        {/* ================= main QFP MCU ================= */}
        <QFPChip x={110} y={228} size={72} pins={8} label="U1 · MEGA16" showPad />

        {/* second QFP chip, bottom right */}
        <QFPChip x={196} y={352} size={46} pins={6} label="U2" showPad />

        {/* small EEPROM (SOIC) */}
        <g opacity="0.75">
          <rect x="46" y="368" width="22" height="14" rx="1.2" fill="url(#icSheen)" stroke="#484d4d" strokeWidth="0.6" />
          {Array.from({ length: 3 }).map((_, i) => (
            <rect key={`ep1-${i}`} x={49 + i * 7} y="365" width="1.8" height="3.5" fill="#c7cbc9" />
          ))}
          {Array.from({ length: 3 }).map((_, i) => (
            <rect key={`ep2-${i}`} x={49 + i * 7} y="382" width="1.8" height="3.5" fill="#c7cbc9" />
          ))}
          <text x="46" y="392" fontSize="4" fill="#8a908d" fontFamily="monospace">U4</text>
        </g>

        {/* driver SOIC, lower left */}
        <g opacity="0.75">
          <rect x="24" y="382" width="30" height="14" rx="1.2" fill="url(#icSheen)" stroke="#484d4d" strokeWidth="0.6" />
          {Array.from({ length: 4 }).map((_, i) => (
            <rect key={`dr1-${i}`} x={27 + i * 7} y="379" width="1.8" height="3.5" fill="#c7cbc9" />
          ))}
          {Array.from({ length: 4 }).map((_, i) => (
            <rect key={`dr2-${i}`} x={27 + i * 7} y="396" width="1.8" height="3.5" fill="#c7cbc9" />
          ))}
          <text x="24" y="406" fontSize="4" fill="#8a908d" fontFamily="monospace">U5</text>
        </g>

        {/* crystal oscillator */}
        <g opacity="0.8">
          <rect x="196" y="320" width="20" height="10" rx="2" fill="#1c2a26" stroke="#5a6d64" strokeWidth="0.8" />
          <line x1="188" y1="325" x2="196" y2="325" stroke="url(#copperDim)" strokeWidth="1" />
          <line x1="216" y1="325" x2="224" y2="325" stroke="url(#copperDim)" strokeWidth="1" />
          <text x="196" y="337" fontSize="4.5" fill="#6b7a72" fontFamily="monospace">Y1 16M</text>
        </g>

        {/* battery pack — spans the board's exact width (bx to bx+bw), its
            own dedicated band above the rest of the circuit, extended much
            taller toward the top; styled after a real LiPo pouch cell */}
        <g opacity="0.98" filter="url(#battPop)">
          {/* orange/gold tab end */}
          <rect x={bx} y="54" width="34" height="154" rx="3" fill="url(#battTab)" stroke="#6b4a10" strokeWidth="1" />
          <rect x={bx} y="54" width="34" height="154" rx="3" fill="url(#battPuffHighlight)" />
          <rect x={bx} y="54" width="34" height="154" rx="3" fill="url(#battPuffShade)" />
          {/* silver foil pouch body — fills the rest of the board's width */}
          <rect x={bx + 34} y="50" width={bw - 34} height="162" rx="5" fill="url(#battFoil)" stroke="#6b706e" strokeWidth="1.1" />
          <rect x={bx + 34} y="50" width={bw - 34} height="162" rx="5" fill="url(#battPuffHighlight)" />
          <rect x={bx + 34} y="50" width={bw - 34} height="162" rx="5" fill="url(#battPuffShade)" />
          <line x1={bx + 26} y1="56" x2={bx + 46} y2="208" stroke="#ffffff" strokeWidth="0.6" opacity="0.4" />
          <line x1={bx + 76} y1="52" x2={bx + 56} y2="210" stroke="#ffffff" strokeWidth="0.6" opacity="0.3" />
          <line x1={bx + bw - 74} y1="56" x2={bx + bw - 54} y2="208" stroke="#ffffff" strokeWidth="0.6" opacity="0.3" />
          <text x={bx + bw / 2} y="128" fontSize="6" fill="#3a3e3d" fontFamily="monospace" textAnchor="middle">− DTP 603450 +</text>
          <text x={bx + bw / 2} y="138" fontSize="6" fill="#3a3e3d" fontFamily="monospace" textAnchor="middle">3.7V · 1000mAh</text>
          {/* twisted red/black leads dropping down into the board below */}
          <path d={`M${bx + bw - 10} 182 C ${bx + bw + 4} 186, ${bx + bw + 4} 198, ${bx + bw - 5} 206`} stroke="#c9302a" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.95" />
          <path d={`M${bx + bw - 10} 192 C ${bx + bw + 4} 198, ${bx + bw + 4} 208, ${bx + bw - 5} 216`} stroke="#141414" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.95" />
          <rect x={bx + bw - 11} y="206" width="9" height="16" rx="2" fill="#f2f2ec" stroke="#8a8f8d" strokeWidth="0.8" />
          {/* a long visible lead running from the battery up to where the
              side dial is mounted, so the connection reads clearly through
              the case rather than as a tiny stub */}
          <path
            d={`M${bx + 17} 54 C ${bx + 8} 36, ${bx - 2} 24, ${bx + 2} 14`}
            stroke="#c9531f"
            strokeWidth="2.8"
            fill="none"
            strokeLinecap="round"
            opacity="0.92"
          />
          <path
            d={`M${bx + 17} 54 C ${bx + 8} 36, ${bx - 2} 24, ${bx + 2} 14`}
            stroke="#f0894c"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
            opacity="0.55"
          />
          <circle cx={bx + 2} cy="14" r="2.4" fill="#e3c07a" opacity="0.75" />
          <circle cx={bx + 17} cy="54" r="2.4" fill="#e3c07a" opacity="0.75" />
        </g>

        {/* decoupling caps hugging the main QFP */}
        {[[100, 220], [178, 220], [100, 304], [178, 304]].map(([x, y], i) => (
          <rect key={`dc-${i}`} x={x} y={y} width="6" height="4" rx="0.8" fill="#8a5a2a" opacity="0.7" />
        ))}

        {/* electrolytic capacitors — silver cylinders */}
        <g opacity="0.75">
          <circle cx="256" cy="300" r="9" fill="#c9cdcb" stroke="#8a8f8d" strokeWidth="1" />
          <line x1="252" y1="294" x2="252" y2="306" stroke="#5a5f5d" strokeWidth="0.8" />
          <line x1="249" y1="300" x2="255" y2="300" stroke="#5a5f5d" strokeWidth="0.8" />
          <circle cx="256" cy="300" r="3" fill="#7d827f" />
        </g>
        <g opacity="0.75">
          <circle cx="30" cy="410" r="10" fill="#c9cdcb" stroke="#8a8f8d" strokeWidth="1" />
          <line x1="26" y1="404" x2="26" y2="416" stroke="#5a5f5d" strokeWidth="0.8" />
          <line x1="23" y1="410" x2="29" y2="410" stroke="#5a5f5d" strokeWidth="0.8" />
          <circle cx="30" cy="410" r="3.4" fill="#7d827f" />
        </g>

        {/* small ceramic caps, orange */}
        {ceramicCaps.map(([x, y], i) => (
          <rect key={`cc-${i}`} x={x} y={y} width="7" height="7" rx="2" fill="#e0692f" opacity="0.7" />
        ))}

        {/* resistor bank */}
        {resistors.map(([x, y, c1, c2], i) => (
          <g key={`res-${i}`} opacity="0.7">
            <rect x={x} y={y} width="17" height="6.5" rx="1" fill="#2b2b28" stroke="#5a5a56" strokeWidth="0.6" />
            <rect x={x + 3} y={y} width="2" height="6.5" fill={c1} />
            <rect x={x + 8} y={y} width="2" height="6.5" fill={c2} />
          </g>
        ))}

        {/* LED indicator, beside the header */}
        <g opacity="0.8">
          <circle cx="240" cy="226" r="3" fill="#ff6b4a" opacity="0.6" />
          <circle cx="240" cy="226" r="1.2" fill="#ffd7c8" opacity="0.8" />
          <text x="228" y="238" fontSize="3.6" fill="#8a908d" fontFamily="monospace">D1</text>
        </g>

        {/* right-side vertical header — sits below the battery band, clear of it */}
        <g opacity="0.75">
          <rect x="254" y="220" width="16" height="52" rx="1" fill="#141414" stroke="#4a4a4a" strokeWidth="0.6" />
          {Array.from({ length: 5 }).map((_, i) => (
            <rect key={`rh-${i}`} x="257" y={224 + i * 9} width="10" height="4" fill="#d9b46a" opacity="0.75" />
          ))}
        </g>

        {/* bottom-left small connector */}
        <g opacity="0.7">
          <rect x="20" y="420" width="14" height="28" rx="1" fill="#141414" stroke="#4a4a4a" strokeWidth="0.6" />
          {Array.from({ length: 3 }).map((_, i) => (
            <rect key={`bl-${i}`} x="23" y={424 + i * 8} width="8" height="3" fill="#d9b46a" opacity="0.75" />
          ))}
        </g>

        {/* wide bottom IDC connector, two staggered rows */}
        <g opacity="0.7">
          <rect x="134" y="432" width="80" height="12" rx="1" fill="#141414" stroke="#4a4a4a" strokeWidth="0.6" />
          {Array.from({ length: 8 }).map((_, i) => (
            <rect key={`idc1-${i}`} x={137 + i * 9.5} y="434" width="4" height="3.2" fill="#d9b46a" opacity="0.75" />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <rect key={`idc2-${i}`} x={137 + i * 9.5} y="439" width="4" height="3.2" fill="#d9b46a" opacity="0.75" />
          ))}
        </g>

        {/* silkscreen designators + orientation mark */}
        <g fill="#eaf5ee" fontFamily="monospace" opacity="0.85">
          <text x="47" y="416" fontSize="4">R1</text>
          <text x="176" y="416" fontSize="4">R6</text>
          <text x="252" y="292" fontSize="4">C1</text>
          <text x="20" y="404" fontSize="4">C2</text>
          <text x="140" y="428" fontSize="4">J1 · EXPANSION</text>
          <text x="86" y="196" fontSize="7" opacity="0.7">M</text>
          <circle cx="90" cy="200" r="0.8" opacity="0.6" />
        </g>

        <text x={bx + 14} y="450" fontSize="6.5" fill="#eaf5ee" fontFamily="monospace" opacity="0.75">
          REV·C · CP-01
        </text>

        {/* board-standoff holes, tucked into empty corners of the board itself */}
        {[
          [bx + 16, by + 16],
          [bx + bw - 16, by + 16],
          [bx + 16, by + bh - 16],
          [bx + bw - 16, by + bh - 16],
        ].map(([x, y], i) => (
          <g key={`hole-${i}`}>
            <circle cx={x} cy={y} r="6.5" fill="none" stroke="#e08a3a" strokeWidth="1.4" opacity="0.55" />
            <circle cx={x} cy={y} r="2.4" fill="#08341a" opacity="0.8" />
          </g>
        ))}
        </g>
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Reusable device — CodePod                                         */
/* ------------------------------------------------------------------ */
/**
 * <CodePod
 *    accent="#4fd1a5"        // brand / glow / button accent colour
 *    label="CODEPOD"         // silkscreened brand text
 *    snippets={[{ lang, code }]}
 * />
 */
export function CodePod({
  accent = "#4fd1a5",
  label = "",
  onPoweredChange,
  snippets = [
    {
      lang: "JS",
      code: `function greet(name) {\n  return \`Hi, \${name}!\`;\n}\n\nconsole.log(greet("world"));`,
    },
    {
      lang: "PY",
      code: `def fib(n):\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a`,
    },
    {
      lang: "RS",
      code: `fn main() {\n    let nums = vec![1, 2, 3];\n    let sum: i32 = nums.iter().sum();\n    println!("{}", sum);\n}`,
    },
  ],
}) {
  const [index, setIndex] = useState(0);
  const [powered, setPowered] = useState(true);
  const [pressed, setPressed] = useState(null);
  const [toggleOn, setToggleOn] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const lastCoordsRef = useRef(0);
  const [screenOn, setScreenOn] = useState(true);
  const [screenClosing, setScreenClosing] = useState(false);
  const [screenOpening, setScreenOpening] = useState(false);
  const screenRef = useRef(null);
  const lastFlickerRef = useRef(0);

  // --- retro space-shooter, launched by the red button -----------------
  const GAME_COLS = 14;
  const GAME_ROWS = 8;
  const ENEMY_ROW = 1; // top row an enemy ship flies along
  const ENEMY_ROW_2 = 2; // second row, used once there's more than one ship
  const HUNTER_ROW = 0; // the hunter flies along its own row, above the rest
  const MAX_ENEMIES = 4;
  const BULLET_SPEED = 1; // rows per tick — small, frequent steps read as
  // travel; a few big jumps (what this was before) just looks like it's
  // teleporting between two spots.
  const TRACK_DELAY = 25; // ticks before the hunter's aim updates to where
  // the player currently is — it always shoots at a slightly *stale*
  // position, which is exactly what makes standing still dangerous and
  // moving an effective dodge.

  // How hard level N is: an extra ship every 3 levels (capped), plus both
  // the whole formation's movement and its fire rate creeping up — all
  // three knobs turning at once, each with a floor/ceiling so it never
  // spirals into something unfair.
  const shipCountForLevel = (lvl) => Math.min(MAX_ENEMIES, 1 + Math.floor((lvl - 1) / 3));
  const moveThresholdForLevel = (lvl) => Math.max(3, 9 - Math.floor(lvl / 2));
  const fireThresholdForLevel = (lvl) => Math.max(18, 55 - lvl * 3);
  const hunterFireThresholdForLevel = (lvl) => Math.max(14, 34 - lvl * 2);

  const [gameMode, setGameMode] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [shipCol, setShipCol] = useState(6);
  const [bullet, setBullet] = useState(null); // player bullet: { col, row } | null
  const [enemies, setEnemies] = useState(() => [{ id: "e0", col: 7, row: ENEMY_ROW, dir: 1 }]);
  const [enemyBullets, setEnemyBullets] = useState([]); // [{ col, row, id }]
  const [hunter, setHunter] = useState({ col: 3, dir: 1 });
  const [hunterAlive, setHunterAlive] = useState(true);
  const [hunterBullets, setHunterBullets] = useState([]); // [{ col, row, id }]
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [levelBanner, setLevelBanner] = useState(null); // level number shown briefly, or null
  const [lives, setLives] = useState(3);
  const [modeStatic, setModeStatic] = useState(false);

  const shipColRef = useRef(shipCol);
  shipColRef.current = shipCol;
  const bulletRef = useRef(bullet);
  bulletRef.current = bullet;
  const enemiesRef = useRef(enemies);
  enemiesRef.current = enemies;
  const enemyBulletsRef = useRef(enemyBullets);
  enemyBulletsRef.current = enemyBullets;
  const hunterRef = useRef(hunter);
  hunterRef.current = hunter;
  const hunterAliveRef = useRef(hunterAlive);
  hunterAliveRef.current = hunterAlive;
  const hunterBulletsRef = useRef(hunterBullets);
  hunterBulletsRef.current = hunterBullets;
  const levelRef = useRef(level);
  levelRef.current = level;
  const enemyMoveStepRef = useRef(0);
  const enemyFireStepRef = useRef(0);
  const enemyBulletStepRef = useRef(0);
  const hunterMoveStepRef = useRef(0);
  const hunterFireStepRef = useRef(0);
  const hunterBulletStepRef = useRef(0);
  const trackStepRef = useRef(0);
  const trackedColRef = useRef(shipCol); // the "last known position" the hunter aims at

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setLives(3);
    setGameOver(false);
    setShipCol(Math.floor(GAME_COLS / 2));
    setBullet(null);
    setEnemies([{ id: "e0", col: Math.floor(GAME_COLS / 2), row: ENEMY_ROW, dir: 1 }]);
    setEnemyBullets([]);
    setHunter({ col: 3, dir: 1 });
    setHunterAlive(true);
    setHunterBullets([]);
    enemyMoveStepRef.current = 0;
    enemyFireStepRef.current = 0;
    enemyBulletStepRef.current = 0;
    hunterMoveStepRef.current = 0;
    hunterFireStepRef.current = 0;
    hunterBulletStepRef.current = 0;
    trackStepRef.current = 0;
    trackedColRef.current = Math.floor(GAME_COLS / 2);
  };

  useEffect(() => {
    if (!gameMode || !powered || gameOver) return;
    const tick = setInterval(() => {
      // Read everything from refs and compute the whole next frame up front,
      // then commit it with one setState per value.
      let nextBullet = bulletRef.current;
      let nextEnemies = enemiesRef.current;
      let nextEnemyBullets = enemyBulletsRef.current;
      let nextHunter = hunterRef.current;
      let nextHunterAlive = hunterAliveRef.current;
      let nextHunterBullets = hunterBulletsRef.current;
      let hitShipIdx = -1;
      let hitHunter = false;
      let hitPlayer = false;
      let nextLevel = levelRef.current;

      // 0. the hunter's "last known position" of the player updates only
      //    every TRACK_DELAY ticks — a snapshot, not a live read
      trackStepRef.current += 1;
      if (trackStepRef.current >= TRACK_DELAY) {
        trackStepRef.current = 0;
        trackedColRef.current = shipColRef.current;
      }

      // 1. move the player's bullet, checking every row it passes through
      //    for a hit against any enemy ship OR the hunter, so a fast bullet
      //    can't skip straight over one
      if (nextBullet) {
        let landed = null;
        for (let r = nextBullet.row - 1; r >= nextBullet.row - BULLET_SPEED; r--) {
          if (r < 0) {
            landed = null;
            break;
          }
          if (r === HUNTER_ROW && nextHunterAlive && nextBullet.col === nextHunter.col) {
            hitHunter = true;
            landed = null;
            break;
          }
          const idx = nextEnemies.findIndex((e) => e.row === r && e.col === nextBullet.col);
          if (idx !== -1) {
            hitShipIdx = idx;
            landed = null;
            break;
          }
          landed = { col: nextBullet.col, row: r };
        }
        nextBullet = hitShipIdx !== -1 || hitHunter ? null : landed;
      }
      if (hitShipIdx !== -1) {
        nextEnemies = nextEnemies.filter((_, i) => i !== hitShipIdx);
        setScore((s) => s + 1); // every individual hit still scores...
      }
      if (hitHunter) {
        setScore((s) => s + 2); // worth more — it's the harder, evasive target
        nextHunterAlive = false; // stays gone until the next level's wave spawns
      }
      // ...but the level (and a fresh, bigger/faster wave) only advances
      // once the *entire* current wave has been cleared out, not on the
      // first ship destroyed
      if (nextEnemies.length === 0) {
        nextLevel = levelRef.current + 1;
        setLevel(nextLevel);
        const freshCount = shipCountForLevel(nextLevel);
        for (let i = 0; i < freshCount; i++) {
          const useSecondRow = i % 2 === 1;
          nextEnemies.push({
            id: `${Date.now()}-${i}-${Math.random()}`,
            col: Math.floor(Math.random() * GAME_COLS),
            row: useSecondRow ? ENEMY_ROW_2 : ENEMY_ROW,
            dir: Math.random() < 0.5 ? 1 : -1,
          });
        }
        // the hunter comes back for the new wave, wherever it left off
        nextHunterAlive = true;
        nextHunter = { col: Math.floor(Math.random() * GAME_COLS), dir: Math.random() < 0.5 ? 1 : -1 };
      }
      // auto-fire a fresh bullet from the ship whenever none is in flight
      if (!nextBullet) {
        nextBullet = { col: shipColRef.current, row: GAME_ROWS - 2 };
      }

      // 2. the whole formation patrols left/right, each ship bouncing off
      //    the edges independently — gets a little quicker each level
      enemyMoveStepRef.current += 1;
      if (enemyMoveStepRef.current >= moveThresholdForLevel(nextLevel)) {
        enemyMoveStepRef.current = 0;
        nextEnemies = nextEnemies.map((e) => {
          let col = e.col + e.dir;
          let dir = e.dir;
          if (col <= 0 || col >= GAME_COLS - 1) {
            dir = -dir;
            col = e.col + dir;
          }
          return { ...e, col, dir };
        });
      }

      // 3. a random ship in the formation fires occasionally — deliberately
      //    a low rate compared to the player's near-constant fire, only
      //    creeping up slightly with level
      enemyFireStepRef.current += 1;
      if (enemyFireStepRef.current >= fireThresholdForLevel(nextLevel) && nextEnemies.length > 0) {
        enemyFireStepRef.current = 0;
        const shooter = nextEnemies[Math.floor(Math.random() * nextEnemies.length)];
        nextEnemyBullets = [
          ...nextEnemyBullets,
          { col: shooter.col, row: shooter.row + 1, id: `${Date.now()}-${Math.random()}` },
        ];
      }

      // 4. enemy bullets drift down slower than the player's own bullet
      enemyBulletStepRef.current += 1;
      if (enemyBulletStepRef.current >= 3) {
        enemyBulletStepRef.current = 0;
        nextEnemyBullets = nextEnemyBullets
          .map((b) => ({ ...b, row: b.row + 1 }))
          .filter((b) => {
            if (b.row >= GAME_ROWS - 1 && b.col === shipColRef.current) {
              hitPlayer = true;
              return false;
            }
            return b.row < GAME_ROWS;
          });
      }

      // 5. the hunter drifts along its own row, independent of the formation
      //    (only while it's actually alive)
      if (nextHunterAlive) {
        hunterMoveStepRef.current += 1;
        if (hunterMoveStepRef.current >= 5) {
          hunterMoveStepRef.current = 0;
          let col = nextHunter.col + nextHunter.dir;
          let dir = nextHunter.dir;
          if (col <= 0 || col >= GAME_COLS - 1) {
            dir = -dir;
            col = nextHunter.col + dir;
          }
          nextHunter = { col, dir };
        }
      }

      // 6. the hunter fires from its own position — the bullet then angles
      //    toward the player's tracked (stale) position as it falls, rather
      //    than spawning at the target column out of nowhere — only while alive
      if (nextHunterAlive) {
        hunterFireStepRef.current += 1;
        if (hunterFireStepRef.current >= hunterFireThresholdForLevel(nextLevel)) {
          hunterFireStepRef.current = 0;
          nextHunterBullets = [
            ...nextHunterBullets,
            {
              col: nextHunter.col,
              row: HUNTER_ROW + 1,
              targetCol: trackedColRef.current,
              id: `${Date.now()}-${Math.random()}`,
            },
          ];
        }
      }

      // 7. hunter bullets fall a little faster than the regular formation's,
      //    since they're aimed rather than opportunistic — each step they
      //    also nudge one column toward their target, so the shot visibly
      //    curves from the hunter's position toward the tracked spot
      hunterBulletStepRef.current += 1;
      if (hunterBulletStepRef.current >= 2) {
        hunterBulletStepRef.current = 0;
        nextHunterBullets = nextHunterBullets
          .map((b) => {
            const col = b.col < b.targetCol ? b.col + 1 : b.col > b.targetCol ? b.col - 1 : b.col;
            return { ...b, col, row: b.row + 1 };
          })
          .filter((b) => {
            if (b.row >= GAME_ROWS - 1 && b.col === shipColRef.current) {
              hitPlayer = true;
              return false;
            }
            return b.row < GAME_ROWS;
          });
      }

      if (hitPlayer) {
        setLives((l) => {
          const next = l - 1;
          if (next <= 0) setGameOver(true);
          return Math.max(0, next);
        });
      }

      setBullet(nextBullet);
      setEnemies(nextEnemies);
      setEnemyBullets(nextEnemyBullets);
      setHunter(nextHunter);
      setHunterAlive(nextHunterAlive);
      setHunterBullets(nextHunterBullets);
    }, 45);
    return () => clearInterval(tick);
  }, [gameMode, powered, gameOver]);

  // Game mode turns itself off if the device powers down, same as the
  // red button's own state.
  useEffect(() => {
    if (!powered) {
      setGameMode(false);
      setScore(0);
    }
  }, [powered]);

  // Flashes "LEVEL N" briefly whenever the level changes (including the
  // very first one, when a game starts) — deliberately short so it reads
  // as a beat, not a breakdown of whether the wave was actually cleared.
  useEffect(() => {
    if (!gameMode) return;
    setLevelBanner(level);
    const t = setTimeout(() => setLevelBanner(null), 550);
    return () => clearTimeout(t);
  }, [level, gameMode]);


  // Keep a satellite screen (hero nameplate) in lockstep with this device.
  useEffect(() => {
    onPoweredChange?.(powered);
  }, [powered, onPoweredChange]);

  // The screen takes a moment to actually light up after power is applied —
  // a short warm-up delay when turning on. Turning off plays an old-CRT
  // "collapse to a line, then a dot" animation before the picture actually
  // cuts; turning back on plays the same effect in reverse.
  useEffect(() => {
    let t1, t2;
    if (powered) {
      setScreenClosing(false);
      t1 = setTimeout(() => setScreenOn(true), 420);
    } else {
      // small pause after the button is pressed before the screen actually
      // starts reacting, rather than collapsing the instant it's clicked
      t1 = setTimeout(() => {
        setScreenClosing(true);
        t2 = setTimeout(() => {
          setScreenOn(false);
          setScreenClosing(false);
        }, 380);
      }, 180);
    }
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [powered]);

  // Fires every time the screen actually lights up (including on mount),
  // so the "expand from a dot" animation plays on every power-on.
  useEffect(() => {
    if (!screenOn) {
      setScreenOpening(false);
      return;
    }
    setScreenOpening(true);
    const t = setTimeout(() => setScreenOpening(false), 380);
    return () => clearTimeout(t);
  }, [screenOn]);

  // Both the open/close CRT effect AND the hover flicker drive the same
  // element's `animation` property directly via the DOM (not React state),
  // because inline styles always win over a CSS class rule for the same
  // property — mixing the two approaches was why the close animation only
  // ever played once (a later hover left a stale inline `animation` value
  // that silently blocked the class-based rule from ever applying again).
  // Routing everything through this single effect keeps there being only
  // one thing in charge of that property at a time.
  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    if (screenClosing) {
      el.style.animation = "none";
      void el.offsetWidth;
      el.style.animation = "cp-tv-off 380ms cubic-bezier(0.6, 0, 0.9, 0.4) forwards";
    } else if (screenOpening) {
      el.style.animation = "none";
      void el.offsetWidth;
      el.style.animation = "cp-tv-on 380ms cubic-bezier(0.1, 0.6, 0.2, 1) forwards";
    } else {
      el.style.animation = "none";
    }
  }, [screenClosing, screenOpening]);

  // The red button loses its state whenever the device powers down — like a
  // real indicator that can't hold "on" without power — so switching back
  // on always comes up with it off, not remembering the last state.
  useEffect(() => {
    if (!powered) setToggleOn(false);
  }, [powered]);

  // Trigger a quick flicker burst each time the cursor moves across the
  // powered screen, throttled so it doesn't fire on every single pixel of
  // movement — restarts the CSS animation via direct DOM manipulation
  // (rather than React state) so rapid mousemove events don't cause
  // constant re-renders. Skipped mid-open/close so it can't stomp on that
  // animation.
  const handleScreenMouseMove = () => {
    if (!powered || screenClosing || screenOpening) return;
    const now = performance.now();
    if (now - lastFlickerRef.current < 110) return;
    lastFlickerRef.current = now;
    const el = screenRef.current;
    if (!el) return;
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "cp-move-flicker 260ms steps(3)";
  };

  // Coordinate readout tracks the cursor across the whole page (a global
  // window listener), not just while it's over the screen — throttled so
  // it doesn't trigger a re-render on every single pixel of movement.
  useEffect(() => {
    const onMove = (e) => {
      const now = performance.now();
      if (now - lastCoordsRef.current < 50) return;
      lastCoordsRef.current = now;
      setCoords({ x: Math.round(e.clientX), y: Math.round(e.clientY) });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const handleScreenMouseLeave = () => {
    if (screenClosing || screenOpening) return;
    const el = screenRef.current;
    if (el) el.style.animation = "none";
  };

  const current = snippets[index];
  const isMusic = current?.type === "music";
  const musicTracks = useMemo(() => {
    if (!isMusic) return [];
    if (Array.isArray(current?.tracks) && current.tracks.length) return current.tracks;
    if (current?.src) {
      return [
        {
          title: current.title || "Untitled",
          artist: current.artist || "Unknown",
          src: current.src,
        },
      ];
    }
    return [];
  }, [isMusic, current]);
  const rendered = useMemo(
    () => (current?.code ? highlight(current.code) : null),
    [current?.code]
  );

  const audioRef = useRef(null);
  const keepPlayingRef = useRef(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);
  const [musicProgress, setMusicProgress] = useState(0);
  const [musicDuration, setMusicDuration] = useState(0);
  const activeTrack =
    musicTracks[Math.min(trackIndex, Math.max(0, musicTracks.length - 1))] || null;

  // Music mute — independent from site-nav UI click sounds
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = musicMuted;
  }, [musicMuted, activeTrack?.src]);

  // Pause when leaving the music slide or powering down
  useEffect(() => {
    if (!isMusic || !powered || !screenOn) {
      audioRef.current?.pause();
      keepPlayingRef.current = false;
      setMusicPlaying(false);
    }
  }, [isMusic, powered, screenOn, index]);

  // Reset to first track when entering the music slide
  useEffect(() => {
    if (isMusic) {
      keepPlayingRef.current = false;
      setTrackIndex(0);
    }
  }, [isMusic, index]);

  // Load the active track; wait until it can play before resuming
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeTrack?.src) return;

    let cancelled = false;
    setMusicProgress(0);
    setMusicDuration(0);
    audio.pause();
    audio.src = activeTrack.src;
    audio.load();

    const tryPlay = () => {
      if (cancelled || !keepPlayingRef.current) {
        setMusicPlaying(false);
        return;
      }
      audio
        .play()
        .then(() => {
          if (!cancelled) setMusicPlaying(true);
        })
        .catch(() => {
          if (!cancelled) {
            keepPlayingRef.current = false;
            setMusicPlaying(false);
          }
        });
    };

    const onReady = () => tryPlay();
    const onMeta = () => {
      if (!cancelled) setMusicDuration(audio.duration || 0);
    };
    const onError = () => {
      if (!cancelled) {
        keepPlayingRef.current = false;
        setMusicPlaying(false);
      }
    };

    audio.addEventListener("canplay", onReady, { once: true });
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("error", onError, { once: true });

    return () => {
      cancelled = true;
      audio.removeEventListener("canplay", onReady);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("error", onError);
    };
  }, [activeTrack?.src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setMusicProgress(audio.currentTime || 0);
    const onEnded = () => {
      if (musicTracks.length > 1) {
        keepPlayingRef.current = true;
        setTrackIndex((i) => (i + 1) % musicTracks.length);
      } else {
        keepPlayingRef.current = false;
        setMusicPlaying(false);
        setMusicProgress(0);
      }
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, [musicTracks.length]);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio || !isMusic || !activeTrack?.src) return;
    if (audio.paused) {
      keepPlayingRef.current = true;
      const start = () =>
        audio
          .play()
          .then(() => setMusicPlaying(true))
          .catch(() => {
            keepPlayingRef.current = false;
            setMusicPlaying(false);
          });
      if (audio.readyState >= 2) start();
      else audio.addEventListener("canplay", start, { once: true });
    } else {
      keepPlayingRef.current = false;
      audio.pause();
      setMusicPlaying(false);
    }
  };

  const changeTrack = (dir) => {
    if (musicTracks.length < 2) return;
    const audio = audioRef.current;
    // Keep playback going across skips when already playing
    keepPlayingRef.current = Boolean(
      keepPlayingRef.current || (audio && !audio.paused)
    );
    setTrackIndex((i) => (i + dir + musicTracks.length) % musicTracks.length);
  };

  const seekMusic = (e) => {
    const audio = audioRef.current;
    if (!audio || !musicDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * musicDuration;
    setMusicProgress(audio.currentTime);
  };

  const fmtTime = (s) => {
    if (!Number.isFinite(s) || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const trackLabel = String(trackIndex + 1).padStart(2, "0");
  const trackTotal = String(Math.max(musicTracks.length, 1)).padStart(2, "0");

  const press = (key, fn) => ({
    "data-device-key": key,
    onMouseDown: () => setPressed(key),
    onMouseUp: () => setPressed(null),
    onMouseLeave: () => setPressed((p) => (p === key ? null : p)),
    onClick: fn,
  });

  const glow = `${accent}55`;

  // A small pixel-diamond cursor, tinted back to the device's accent color —
  // a compact rhombus built from the same crisp square "dots" as the
  // screen's dot-matrix grid, smaller than the earlier arrow attempts.
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
  const cpDiamondCells = cpDiamondRows.flatMap((cols, cy) => cols.map((cx) => [cx, cy]));
  const cpRectsFor = (cells) =>
    cells.map(([cx, cy]) => `<rect x='${cx * CP_PIX}' y='${cy * CP_PIX}' width='${CP_PIX}' height='${CP_PIX}'/>`).join("");
  const screenCursorSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 ${7 * CP_PIX} ${7 * CP_PIX}' shape-rendering='crispEdges'><g fill='${accent}'>${cpRectsFor(cpDiamondCells)}</g></svg>`;
  const screenCursor = `url("data:image/svg+xml,${encodeURIComponent(screenCursorSvg)}") 7 7, auto`;

  return (
    <div
      className="cp-device"
      style={{
        width: 300,
        position: "relative",
        fontFamily: "var(--font-terminal)",
        userSelect: "none",
      }}
    >
      {/* ---------- outer shell ---------- */}
      <div
        style={{
          position: "relative",
          borderRadius: "30px 30px 22px 22px",
          padding: 12,
          background:
            "linear-gradient(155deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.42) 24%, rgba(248,250,252,0.28) 52%, rgba(255,255,255,0.38) 78%, rgba(230,234,238,0.40) 100%)",
          backdropFilter: "blur(2.2px)",
          WebkitBackdropFilter: "blur(2.2px)",
          border: "1px solid rgba(255,255,255,0.82)",
          boxShadow: `
            inset 0 1px 1px rgba(255,255,255,0.95),
            inset 0 0 0 1px rgba(255,255,255,0.35),
            inset -18px -28px 42px rgba(15,20,20,0.16),
            inset 0 -20px 36px rgba(255,255,255,0.18),
            inset 0 12px 24px rgba(0,0,0,0.04),
            26px 50px 64px -8px rgba(15,20,20,0.5),
            12px 24px 34px rgba(15,20,20,0.32)
          `,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.9,
            filter: "blur(0.35px) saturate(0.92)",
          }}
        >
          <PcbLayer />
        </div>

        {/* directional shadow — light falls from the top-left, so density
            builds toward the opposite (bottom-right) corner */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(145deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 36%, rgba(10,14,14,0.08) 62%, rgba(10,14,14,0.22) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* frosted diffusion — milky white polycarbonate wash */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(160deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.18) 45%, rgba(245,247,250,0.22) 100%)",
            backdropFilter: "blur(1.1px)",
            WebkitBackdropFilter: "blur(1.1px)",
            pointerEvents: "none",
          }}
        />

        {/* diagonal glass glare */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(115deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0) 20%, rgba(255,255,255,0) 76%, rgba(255,255,255,0.16) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* side grip ribbing — molded texture on the case edges */}
        {[{ left: 3 }, { right: 3 }].map((pos, i) => (
          <div
            key={`rib-${i}`}
            style={{
              position: "absolute",
              ...pos,
              top: 70,
              bottom: 70,
              width: 4,
              borderRadius: 3,
              background:
                "repeating-linear-gradient(0deg, rgba(255,255,255,0.55) 0px, rgba(255,255,255,0.55) 1.5px, rgba(20,25,25,0.12) 1.5px, rgba(20,25,25,0.12) 3.5px)",
              opacity: 0.55,
              pointerEvents: "none",
            }}
          />
        ))}

        {/* corner screws */}
        {[
          { top: 7, left: 7 },
          { top: 7, right: 7 },
          { bottom: 7, left: 7 },
          { bottom: 7, right: 7 },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              ...pos,
              width: 13,
              height: 13,
              borderRadius: "50%",
              zIndex: 3,
              background: "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.16), rgba(0,0,0,0) 70%)",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 1.5,
                borderRadius: "50%",
                background: "radial-gradient(circle at 34% 28%, #f1f2f2, #9aa0a1 50%, #55595a 100%)",
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.4), 0 1px 1px rgba(255,255,255,0.6)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 6,
                  height: 1,
                  background: "#3a3d3f",
                  transform: "translate(-50%,-50%) rotate(28deg)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 6,
                  height: 1,
                  background: "#3a3d3f",
                  transform: "translate(-50%,-50%) rotate(118deg)",
                }}
              />
            </div>
          </div>
        ))}

        {/* ---------- screen ---------- */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            borderRadius: 18,
            padding: 8,
            background: "linear-gradient(160deg,#1c1e1f,#0c0d0e)",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05)",
          }}
        >
          <div
            ref={screenRef}
            className={`cp-screen${screenOn ? " cp-powered" : ""}`}
            onMouseMove={handleScreenMouseMove}
            onMouseLeave={handleScreenMouseLeave}
            style={{
              position: "relative",
              borderRadius: 12,
              height: 216,
              overflow: "hidden",
              background: screenOn
                ? "radial-gradient(120% 100% at 30% 0%, #0c1a14 0%, #07110d 55%, #040a07 100%)"
                : "linear-gradient(160deg,#1a1c1c,#0a0b0b)",
              boxShadow: screenOn
                ? `inset 0 0 26px ${glow}, inset 0 0 2px rgba(0,0,0,0.8)`
                : "inset 0 0 18px rgba(0,0,0,0.9)",
              transition: "box-shadow 400ms ease, background 400ms ease",
              cursor: screenOn ? screenCursor : "default",
            }}
          >
            {/* dot-matrix grid */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,0.05) 0.6px, transparent 0.6px)",
                backgroundSize: "4px 4px",
                opacity: screenOn ? 1 : 0.3,
              }}
            />
            {/* scanlines */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 3px)",
                mixBlendMode: "multiply",
              }}
            />

            {/* feathered gloss — a soft, blurred highlight in the top-left,
                like light glancing off the display glass */}
            <div
              style={{
                position: "absolute",
                top: "-45%",
                left: "-40%",
                width: "115%",
                height: "95%",
                borderRadius: "50%",
                background:
                  "radial-gradient(closest-side, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.07) 45%, rgba(255,255,255,0) 75%)",
                filter: "blur(22px)",
                transform: "rotate(-18deg)",
                pointerEvents: "none",
                mixBlendMode: "screen",
              }}
            />

            {/* TV-static noise, shown briefly while switching between the
                code view and game mode — like an old set changing channels.
                Fully opaque (no blend-with-content-behind, no <1 opacity)
                so it actually hides the swap instead of letting it show
                through underneath. */}
            {modeStatic && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 5,
                  pointerEvents: "none",
                  backgroundColor: "#050f08",
                  backgroundImage: [
                    "repeating-linear-gradient(0deg, rgba(180,255,190,0.14) 0px, rgba(180,255,190,0.14) 1px, transparent 1px, transparent 3px)",
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                    "radial-gradient(ellipse at center, #b6f5c8 0%, #3f8f5a 45%, #050f08 100%)",
                  ].join(", "),
                  backgroundSize: "auto, 90px 90px, 100% 100%",
                  backgroundBlendMode: "overlay, screen, normal",
                  animation: "cp-static-jitter 90ms steps(2) infinite",
                }}
              />
            )}

            {/* mouse coordinate readout, bottom-right of the screen */}
            {screenOn && (
              <div
                style={{
                  position: "absolute",
                  right: 6,
                  bottom: 4,
                  fontSize: 8.5,
                  letterSpacing: 0.5,
                  color: "#4fd9a8",
                  opacity: 0.95,
                  fontFamily: "var(--font-terminal)",
                  pointerEvents: "none",
                  zIndex: 3,
                }}
              >
                x:{coords.x} y:{coords.y}
              </div>
            )}

            {screenOn ? (
              gameMode ? (
                <div style={{ position: "relative", padding: "10px 12px", height: "100%", boxSizing: "border-box" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        letterSpacing: 1,
                        color: "#4fd9a8",
                        opacity: 1,
                      }}
                    >
                      SCORE {score} · LV {level}
                    </span>
                    <span style={{ fontSize: 10, letterSpacing: 1, color: "#ff3b5c", opacity: 1 }}>
                      {"♥".repeat(lives)}
                      <span style={{ opacity: 0.28, color: "#6a5058" }}>{"♥".repeat(Math.max(0, 3 - lives))}</span>
                    </span>
                  </div>
                  {/* CSS Grid instead of absolute-position + aspect-ratio math —
                      every sprite is placed by simple 1-indexed grid-column /
                      grid-row coordinates, which is much harder to get subtly
                      wrong than computing percentages by hand. */}
                  <div
                    style={{
                      position: "relative",
                      display: "grid",
                      gridTemplateColumns: `repeat(${GAME_COLS}, 1fr)`,
                      gridTemplateRows: `repeat(${GAME_ROWS}, 1fr)`,
                      width: "100%",
                      height: 150,
                      /* Faded starfield behind the playfield */
                      backgroundImage: [
                        "radial-gradient(1px 1px at 8% 18%, rgba(255,255,255,0.38), transparent)",
                        "radial-gradient(1px 1px at 22% 62%, rgba(255,255,255,0.22), transparent)",
                        "radial-gradient(1.2px 1.2px at 36% 30%, rgba(255,255,255,0.3), transparent)",
                        "radial-gradient(1px 1px at 48% 78%, rgba(255,255,255,0.18), transparent)",
                        "radial-gradient(1px 1px at 61% 14%, rgba(255,255,255,0.28), transparent)",
                        "radial-gradient(1.2px 1.2px at 74% 54%, rgba(255,255,255,0.24), transparent)",
                        "radial-gradient(1px 1px at 86% 36%, rgba(255,255,255,0.2), transparent)",
                        "radial-gradient(1px 1px at 14% 88%, rgba(255,255,255,0.16), transparent)",
                        "radial-gradient(1px 1px at 92% 82%, rgba(255,255,255,0.26), transparent)",
                        "radial-gradient(1px 1px at 55% 44%, rgba(255,255,255,0.14), transparent)",
                        "radial-gradient(1.2px 1.2px at 30% 8%, rgba(255,255,255,0.2), transparent)",
                        "radial-gradient(1px 1px at 70% 92%, rgba(255,255,255,0.18), transparent)",
                      ].join(", "),
                    }}
                  >
                    {/* Enemy formation — pixel ships, same cyan, varied hulls */}
                    {!gameOver &&
                      enemies.map((e, i) => (
                        <div
                          key={e.id}
                          style={{
                            gridColumn: e.col + 1,
                            gridRow: e.row + 1,
                            alignSelf: "center",
                            justifySelf: "center",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <PixelShip
                            variant={ENEMY_VARIANTS[i % ENEMY_VARIANTS.length]}
                            colorKey="enemy"
                            flipX={e.dir < 0}
                            size={13}
                          />
                        </div>
                      ))}

                    {enemyBullets.map((b) => (
                      <div
                        key={b.id}
                        style={{
                          gridColumn: b.col + 1,
                          gridRow: b.row + 1,
                          alignSelf: "center",
                          justifySelf: "center",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <PixelBolt colorKey="enemyBolt" />
                      </div>
                    ))}

                    {/* Hunter — wider pixel interceptor */}
                    {!gameOver && hunterAlive && (
                      <div
                        style={{
                          gridColumn: hunter.col + 1,
                          gridRow: HUNTER_ROW + 1,
                          alignSelf: "center",
                          justifySelf: "center",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <PixelShip
                          variant="hunter"
                          colorKey="hunter"
                          flipX={hunter.dir < 0}
                          size={14}
                        />
                      </div>
                    )}

                    {hunterBullets.map((b) => (
                      <div
                        key={b.id}
                        style={{
                          gridColumn: b.col + 1,
                          gridRow: b.row + 1,
                          alignSelf: "center",
                          justifySelf: "center",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <PixelBolt colorKey="hunterBolt" tall={false} />
                      </div>
                    ))}

                    {bullet && !gameOver && (
                      <div
                        style={{
                          gridColumn: bullet.col + 1,
                          gridRow: bullet.row + 1,
                          alignSelf: "center",
                          justifySelf: "center",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <PixelBolt colorKey="playerBolt" />
                      </div>
                    )}

                    <div
                      style={{
                        gridColumn: shipCol + 1,
                        gridRow: GAME_ROWS,
                        alignSelf: "center",
                        justifySelf: "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <PixelShip variant="player" colorKey="player" size={14} />
                    </div>

                    {gameOver && (
                      <div
                        style={{
                          gridColumn: `1 / ${GAME_COLS + 1}`,
                          gridRow: `1 / ${GAME_ROWS + 1}`,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          background: "transparent",
                          pointerEvents: "none",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            letterSpacing: 2,
                            color: "#ff3b5c",
                            fontWeight: 700,
                            textShadow:
                              "0 0 8px rgba(255, 59, 92, 0.65), 0 1px 2px rgba(0,0,0,0.85)",
                          }}
                        >
                          GAME OVER
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            color: "#fff4f6",
                            textShadow: "0 1px 2px rgba(0,0,0,0.85)",
                          }}
                        >
                          FINAL SCORE {score}
                        </span>
                        <span
                          style={{
                            fontSize: 8,
                            color: "#1fe06a",
                            textShadow: "0 1px 2px rgba(0,0,0,0.75)",
                          }}
                        >
                          ◀ ▶ TO RESTART
                        </span>
                      </div>
                    )}

                    {/* quick "LEVEL N" flash — on top of everything, gone
                        again almost as fast as it appears */}
                    {levelBanner !== null && (
                      <div
                        style={{
                          gridColumn: `1 / ${GAME_COLS + 1}`,
                          gridRow: `1 / ${GAME_ROWS + 1}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "transparent",
                          pointerEvents: "none",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 15,
                            letterSpacing: 3,
                            color: "#d8ecdf",
                            textShadow: "0 1px 2px rgba(0,0,0,0.85)",
                          }}
                        >
                          LEVEL {levelBanner}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : isMusic ? (
                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    padding: "10px 12px",
                    height: "100%",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    /* Leave the bottom-right corner free for the x/y axis readout */
                    paddingBottom: 22,
                    fontFamily: "var(--font-terminal)",
                  }}
                >
                  <audio ref={audioRef} preload="metadata" />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        letterSpacing: 1,
                        color: "#4fd9a8",
                      }}
                    >
                      {current.lang || "NOW"}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        letterSpacing: 1,
                        color: musicMuted
                          ? "#6f8578"
                          : musicPlaying
                            ? accent
                            : "#6f8578",
                      }}
                    >
                      {musicMuted ? "MUTED" : musicPlaying ? "PLAYING" : "IDLE"}
                    </span>
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: 9,
                        letterSpacing: 1,
                        color: "#6f8578",
                        marginBottom: 6,
                      }}
                    >
                      TRACK {trackLabel} / {trackTotal}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#eafff2",
                        lineHeight: 1.25,
                        marginBottom: 4,
                      }}
                    >
                      {activeTrack?.title || "Untitled"}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#4fd9a8",
                        opacity: 0.9,
                      }}
                    >
                      {activeTrack?.artist || "Unknown"}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      flexShrink: 0,
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 9,
                        color: "#6f8578",
                        width: "100%",
                      }}
                    >
                      <span>{fmtTime(musicProgress)}</span>
                      <span>{fmtTime(musicDuration)}</span>
                    </div>
                    <div
                      role="slider"
                      aria-label="Seek"
                      aria-valuemin={0}
                      aria-valuemax={musicDuration || 0}
                      aria-valuenow={musicProgress}
                      onClick={seekMusic}
                      style={{
                        width: "100%",
                        height: 6,
                        borderRadius: 2,
                        background: "rgba(79, 217, 168, 0.15)",
                        border: "1px solid rgba(79, 217, 168, 0.25)",
                        cursor: "inherit",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${
                            musicDuration
                              ? (musicProgress / musicDuration) * 100
                              : 0
                          }%`,
                          background: accent,
                          boxShadow: `0 0 6px ${accent}88`,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        width: "100%",
                      }}
                    >
                      {musicTracks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => changeTrack(-1)}
                          aria-label="Previous track"
                          style={{
                            appearance: "none",
                            border: `1px solid ${accent}88`,
                            background: "rgba(0,0,0,0.25)",
                            color: accent,
                            fontFamily: "inherit",
                            fontSize: 13,
                            lineHeight: 1,
                            width: 28,
                            height: 28,
                            padding: 0,
                            borderRadius: 3,
                            cursor: "inherit",
                          }}
                        >
                          ⏮
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={toggleMusic}
                        aria-label={musicPlaying ? "Pause" : "Play"}
                        style={{
                          appearance: "none",
                          border: `1px solid ${accent}88`,
                          background: musicPlaying
                            ? `${accent}22`
                            : "rgba(0,0,0,0.25)",
                          color: accent,
                          fontFamily: "inherit",
                          fontSize: 12,
                          lineHeight: 1,
                          width: 28,
                          height: 28,
                          padding: 0,
                          borderRadius: 3,
                          cursor: "inherit",
                          boxShadow: musicPlaying
                            ? `0 0 8px ${accent}55`
                            : "none",
                        }}
                      >
                        {musicPlaying ? "❚❚" : "▶"}
                      </button>
                      {musicTracks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => changeTrack(1)}
                          aria-label="Next track"
                          style={{
                            appearance: "none",
                            border: `1px solid ${accent}88`,
                            background: "rgba(0,0,0,0.25)",
                            color: accent,
                            fontFamily: "inherit",
                            fontSize: 13,
                            lineHeight: 1,
                            width: 28,
                            height: 28,
                            padding: 0,
                            borderRadius: 3,
                            cursor: "inherit",
                          }}
                        >
                          ⏭
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setMusicMuted((m) => !m)}
                        aria-label={musicMuted ? "Unmute music" : "Mute music"}
                        aria-pressed={musicMuted}
                        title={musicMuted ? "Unmute" : "Mute"}
                        style={{
                          appearance: "none",
                          marginLeft: "auto",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: `1px solid ${musicMuted ? "#6f8578" : `${accent}88`}`,
                          background: musicMuted
                            ? "rgba(0,0,0,0.35)"
                            : "rgba(0,0,0,0.25)",
                          color: musicMuted ? "#6f8578" : accent,
                          width: 28,
                          height: 28,
                          padding: 0,
                          borderRadius: 3,
                          cursor: "inherit",
                        }}
                      >
                        {musicMuted ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                              d="M4 9.5v5h3.2L12 19V5L7.2 9.5H4Z"
                              fill="currentColor"
                            />
                            <path
                              d="M16 9.2l4.8 4.8M20.8 9.2L16 14"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                              d="M4 9.5v5h3.2L12 19V5L7.2 9.5H4Z"
                              fill="currentColor"
                            />
                            <path
                              d="M15.2 8.8a4.2 4.2 0 0 1 0 6.4"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                            <path
                              d="M17.6 6.2a7.2 7.2 0 0 1 0 11.6"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ position: "relative", padding: "10px 12px", height: "100%", boxSizing: "border-box" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-terminal)",
                        fontSize: 10,
                        fontWeight: 400,
                        letterSpacing: 1,
                        color: "#4fd9a8",
                        opacity: 1,
                      }}
                    >
                      {current.lang}
                    </span>
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-terminal)",
                      fontSize: 11.5,
                      fontWeight: 400,
                      lineHeight: 1.55,
                      letterSpacing: "normal",
                      color: "#eafff2",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {rendered}
                    <span
                      style={{
                        display: "inline-block",
                        width: 6,
                        height: 12,
                        marginLeft: 2,
                        background: "#ff8a3d",
                        boxShadow: "0 0 7px rgba(255,138,61,0.75)",
                        verticalAlign: "-2px",
                        animation: "cp-blink 1.1s steps(1) infinite",
                      }}
                    />
                  </pre>
                </div>
              )
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0) 40%)",
                }}
              />
            )}
          </div>
        </div>

        {/* seam groove — where the front panel meets the lower shell */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            height: 5,
            marginTop: 10,
            marginLeft: 4,
            marginRight: 4,
            borderRadius: 3,
            boxShadow:
              "inset 0 1.5px 2px rgba(0,0,0,0.18), inset 0 -1px 1px rgba(255,255,255,0.55)",
            pointerEvents: "none",
          }}
        />

        {/* ---------- control deck ---------- */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            marginTop: 6,
            padding: "6px 10px 4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* ambient light the power button throws onto the deck around it */}
          <div
            style={{
              position: "absolute",
              left: -10,
              top: "50%",
              width: 160,
              height: 160,
              transform: "translateY(-50%)",
              background: `radial-gradient(circle, ${accent}28 0%, ${accent}12 34%, transparent 66%)`,
              filter: "blur(15px)",
              opacity: powered ? 1 : 0,
              transition: "opacity 450ms ease",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          {/* power button — sits in a fixed dark socket cut into the deck, so
              pressing it reveals more of that socket instead of empty space */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              width: 60,
              height: 60,
              borderRadius: 12,
              background: "linear-gradient(165deg, rgba(10,12,12,0.72) 0%, rgba(18,21,21,0.72) 100%)",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5), inset 0 -1px 1px rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <button
              {...press("power", () => setPowered((p) => !p))}
              aria-label="Power"
              style={{
                position: "relative",
                width: 52,
                height: 52,
                padding: 0,
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                opacity: 0.92,
                background: powered
                  ? `linear-gradient(165deg, ${accent}55 0%, #241407 55%, #140b04 100%)`
                  : "linear-gradient(165deg, #4a4e50 0%, #232527 55%, #131415 100%)",
                boxShadow:
                  pressed === "power"
                    ? `inset 0 3px 6px rgba(0,0,0,0.7)${powered ? `, 0 0 8px ${accent}55` : ""}`
                    : powered
                    ? `3px 5px 8px rgba(10,14,14,0.5), 6px 12px 18px -4px rgba(10,14,14,0.55), 0 0 5px ${accent}88, 0 0 11px ${accent}33`
                    : "3px 5px 8px rgba(10,14,14,0.5), 6px 12px 18px -4px rgba(10,14,14,0.55)",
                transform: pressed === "power" ? "translateY(4px)" : "translateY(0)",
                transition: "transform 80ms ease, box-shadow 300ms ease, background 300ms ease",
              }}
            >
            {/* inset top face — the visible "cap" of the keycap */}
            <div
              style={{
                position: "absolute",
                top: 4,
                left: 4,
                right: 4,
                bottom: 5,
                borderRadius: 5,
                overflow: "hidden",
                background: powered
                  ? `radial-gradient(circle at 46% 34%, ${accent}dd 0%, ${accent}99 24%, #2b1608 70%, #1a0f07 100%)`
                  : "radial-gradient(circle at 34% 28%, #55595b 0%, #303234 55%, #1c1d1e 100%)",
                boxShadow:
                  "inset 0 2px 2px rgba(255,255,255,0.3), inset 0 -3px 4px rgba(0,0,0,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* subtle plastic grain — keeps the surface from looking too clean */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                  opacity: 0.16,
                  mixBlendMode: "overlay",
                  pointerEvents: "none",
                }}
              />
              {/* a faint worn smudge, off-center */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(circle at 74% 78%, rgba(0,0,0,0.16) 0%, transparent 40%), radial-gradient(circle at 22% 84%, rgba(0,0,0,0.1) 0%, transparent 30%)",
                  pointerEvents: "none",
                }}
              />
              {/* glass gloss highlight, slightly off-axis */}
              <div
                style={{
                  position: "absolute",
                  top: 2,
                  left: 4,
                  right: 6,
                  height: "36%",
                  borderRadius: 3,
                  transform: "rotate(-1.5deg)",
                  background: "linear-gradient(182deg, rgba(255,255,255,0.4), rgba(255,255,255,0))",
                  opacity: powered ? 0.5 : 0.3,
                  pointerEvents: "none",
                }}
              />
              <Power
                size={19}
                color={powered ? "#f2ede0" : "#6b6f70"}
                strokeWidth={2.4}
                style={{
                  filter: powered ? `drop-shadow(0 0 2px ${accent}) drop-shadow(0 0 4px ${accent}aa)` : "none",
                  position: "relative",
                }}
              />
            </div>
            </button>
          </div>

          {/* left / right arrows — same fixed dark sockets and keycap style as the power button */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              gap: 8,
            }}
          >
            {[
              {
                key: "prev",
                Icon: ChevronLeft,
                fn: () => {
                  if (!gameMode) return setIndex((i) => (i - 1 + snippets.length) % snippets.length);
                  if (gameOver) return startGame();
                  setShipCol((c) => Math.max(0, c - 1));
                },
              },
              {
                key: "next",
                Icon: ChevronRight,
                fn: () => {
                  if (!gameMode) return setIndex((i) => (i + 1) % snippets.length);
                  if (gameOver) return startGame();
                  setShipCol((c) => Math.min(GAME_COLS - 1, c + 1));
                },
              },
            ].map(({ key, Icon, fn }) => (
              <div
                key={key}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 12,
                  background: "linear-gradient(165deg, rgba(10,12,12,0.72) 0%, rgba(18,21,21,0.72) 100%)",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5), inset 0 -1px 1px rgba(255,255,255,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <button
                  {...press(key, fn)}
                  aria-label={key === "prev" ? "Previous" : "Next"}
                  style={{
                    position: "relative",
                    width: 52,
                    height: 52,
                    padding: 0,
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    opacity: 0.92,
                    background: "linear-gradient(165deg, #4a4e50 0%, #232527 55%, #131415 100%)",
                    boxShadow:
                      pressed === key
                        ? "inset 0 2px 5px rgba(0,0,0,0.7)"
                        : "2px 4px 7px rgba(10,14,14,0.5), 5px 10px 15px -3px rgba(10,14,14,0.5)",
                    transform: pressed === key ? "translateY(4px)" : "translateY(0)",
                    transition: "transform 80ms ease, box-shadow 80ms ease",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 4,
                      left: 4,
                      right: 4,
                      bottom: 5,
                      borderRadius: 5,
                      overflow: "hidden",
                      background: "radial-gradient(circle at 34% 28%, #55595b 0%, #303234 55%, #1c1d1e 100%)",
                      boxShadow: "inset 0 2px 2px rgba(255,255,255,0.3), inset 0 -3px 4px rgba(0,0,0,0.35)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 2,
                        left: 4,
                        right: 6,
                        height: "36%",
                        borderRadius: 3,
                        transform: "rotate(-1.5deg)",
                        background: "linear-gradient(182deg, rgba(255,255,255,0.35), rgba(255,255,255,0))",
                        opacity: 0.3,
                        pointerEvents: "none",
                      }}
                    />
                    <Icon size={19} color="#d7dcd9" strokeWidth={2.4} style={{ position: "relative" }} />
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* red circular button — same footprint and alignment as the old
            toggle, beneath the right arrow button */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            justifyContent: "flex-end",
            padding: "0 22px 0 10px",
            marginTop: 6,
          }}
        >
          {/* inner wrapper sized to the button itself, so the glow below is
              guaranteed centered on it regardless of the row's padding */}
          <div style={{ position: "relative", width: 16, height: 16 }}>
            {/* ambient light the button throws onto the deck around it when lit */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 70,
                height: 70,
                transform: "translate(-50%, -50%)",
                background: "radial-gradient(circle, rgba(255,60,40,0.55) 0%, rgba(255,60,40,0.22) 35%, transparent 68%)",
                filter: "blur(10px)",
                opacity: toggleOn && powered ? 1 : 0,
                transition: "opacity 320ms ease 90ms",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />
            <button
              onClick={() => {
                // glitch sequence: a couple of quick flickers, noise builds
                // to peak intensity (the swap happens hidden inside that
                // peak), then eases back down with a final flicker before
                // the new screen settles in — not a flat, steady static.
                setModeStatic(true);
                setTimeout(() => {
                  setToggleOn((v) => !v);
                  setGameMode((v) => {
                    const next = !v;
                    if (next) startGame();
                    return next;
                  });
                }, 270);
                setTimeout(() => setModeStatic(false), 620);
              }}
              aria-label="Toggle"
              aria-pressed={toggleOn}
              style={{
                position: "relative",
                zIndex: 1,
                width: 16,
                height: 16,
                padding: 0,
                border: "none",
                borderRadius: "50%",
                cursor: "pointer",
                overflow: "hidden",
                background: "radial-gradient(circle at 32% 26%, #4a0e0a 0%, #2a0705 60%, #1a0403 100%)",
                boxShadow:
                  "inset 0 1px 2px rgba(0,0,0,0.7), inset 0 -1px 1px rgba(255,255,255,0.06), 2px 3px 5px rgba(10,14,14,0.4)",
              }}
            >
              {/* lit tint — only when both toggled on AND the device is
                  powered, so it can't stay lit while the device is off */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 32% 26%, #ff5a3c 0%, #d81f1f 55%, #7a0f0f 100%)",
                  boxShadow:
                    toggleOn && powered
                      ? "0 0 8px 2px rgba(255,60,40,0.95), 0 0 16px 4px rgba(255,40,20,0.5)"
                      : "none",
                  opacity: toggleOn && powered ? 1 : 0,
                  transition: "opacity 220ms ease 90ms, box-shadow 220ms ease 90ms",
                }}
              />
              {/* glass highlight */}
              <div
                style={{
                  position: "absolute",
                  top: 1.5,
                  left: 3,
                  width: 7,
                  height: 5,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.45)",
                  filter: "blur(0.4px)",
                  pointerEvents: "none",
                }}
              />
            </button>
          </div>
        </div>

        {/* bottom accent tab — small molded detail at the base of the shell */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            width: 46,
            height: 4,
            margin: "12px auto 0",
            borderRadius: 3,
            background: "linear-gradient(180deg, rgba(0,0,0,0.14), rgba(0,0,0,0.04))",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5)",
          }}
        />
      </div>

      {/* side dial — moved to the top-left edge of the case, mirrored so the
          wheel still stands proud of the case with the bracket behind it */}
      <div
        style={{
          position: "absolute",
          left: -27,
          top: 42,
          width: 34,
          height: 58,
          zIndex: 1,
        }}
      >
        {/* bracket tab, a short lip where the wheel meets the case */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 12,
            width: 12,
            height: 34,
            borderRadius: "0 3px 3px 0",
            background: "linear-gradient(260deg, #e9ebea 0%, #c7cac8 60%, #9a9f9d 100%)",
            boxShadow: "2px 4px 6px rgba(10,14,14,0.35)",
          }}
        />

        {/* the wheel — square-cornered, not a pill */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 26,
            height: 58,
            borderRadius: 4,
            background: "linear-gradient(180deg, #f2f3f2 0%, #d7d9d8 45%, #9a9f9d 100%)",
            boxShadow: "4px 6px 10px rgba(10,14,14,0.55)",
            overflow: "hidden",
          }}
        >
          {/* vertical knurl ridges */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(10,14,14,0.28) 0px, rgba(10,14,14,0.28) 1px, rgba(255,255,255,0.35) 1px, rgba(255,255,255,0.35) 2px, transparent 2px, transparent 4px)",
            }}
          />
          {/* bottom shadow gradient — reads as the cylinder curving away from the light */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(5,8,8,0.55) 100%)",
            }}
          />
          {/* top highlight — where the light hits the roll */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "30%",
              background: "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)",
            }}
          />
        </div>
      </div>

      {/* top nub — a small port/antenna stub poking above the shell, now
          carrying the status LED that used to sit on the screen */}
      <div
        style={{
          position: "absolute",
          top: -9,
          left: "64%",
          width: 15,
          height: 11,
          borderRadius: "5px 5px 3px 3px",
          background: "linear-gradient(180deg, #4a4e4f 0%, #26292a 60%, #141515 100%)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.25)",
          zIndex: 1,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2,
            left: "50%",
            width: 5,
            height: 5,
            borderRadius: "50%",
            transform: "translateX(-50%)",
            background: powered
              ? accent
              : "radial-gradient(circle at 35% 30%, #ff6a55 0%, #e01818 55%, #7a0a0a 100%)",
            boxShadow: powered
              ? `0 0 6px 2px ${accent}, 0 0 12px 3px ${accent}99`
              : "0 0 5px 1px rgba(255, 40, 30, 0.85), 0 0 10px 2px rgba(220, 20, 20, 0.45)",
            animation: powered ? "none" : "cp-led-blink 1.1s steps(1) infinite",
            transition: "background 200ms ease, box-shadow 200ms ease",
          }}
        />
      </div>

      {/* side grip texture */}
      <style>{`
        @keyframes cp-blink { 0%, 45% { opacity: 1 } 46%, 100% { opacity: 0 } }
        @keyframes cp-led-blink {
          0%, 48% { opacity: 1; filter: brightness(1.35); }
          49%, 100% { opacity: 0.12; filter: brightness(0.35); }
        }
        @keyframes cp-pulse { 0%,100% { opacity: 0.55 } 50% { opacity: 1 } }
        @keyframes cp-move-flicker {
          0%   { filter: brightness(1); }
          20%  { filter: brightness(0.75) contrast(1.03); }
          45%  { filter: brightness(1.15); }
          70%  { filter: brightness(0.88); }
          100% { filter: brightness(1); }
        }
        @keyframes cp-tv-off {
          0%   { transform: scale(1, 1); filter: brightness(1); }
          12%  { transform: scale(1.02, 0.96); filter: brightness(1.3); }
          30%  { transform: scale(1, 0.04); filter: brightness(2); }
          55%  { transform: scale(1, 0.02); filter: brightness(2.4); }
          78%  { transform: scale(0.05, 0.02); filter: brightness(3); }
          100% { transform: scale(0.001, 0.001); filter: brightness(0.2); opacity: 0; }
        }
        @keyframes cp-tv-on {
          0%   { transform: scale(0.001, 0.001); filter: brightness(3); opacity: 0; }
          15%  { transform: scale(0.05, 0.02); filter: brightness(3); opacity: 1; }
          40%  { transform: scale(1, 0.02); filter: brightness(2.4); }
          62%  { transform: scale(1, 0.05); filter: brightness(2); }
          85%  { transform: scale(1.02, 0.97); filter: brightness(1.3); }
          100% { transform: scale(1, 1); filter: brightness(1); }
        }
        @keyframes cp-static-jitter {
          0%   { background-position: 0 0, 0 0, 0px 0px; }
          15%  { background-position: 0 0, 0 0, -23px 11px; }
          30%  { background-position: 0 0, 0 0, 17px -19px; }
          45%  { background-position: 0 0, 0 0, -9px 26px; }
          60%  { background-position: 0 0, 0 0, 24px 7px; }
          75%  { background-position: 0 0, 0 0, -18px -14px; }
          90%  { background-position: 0 0, 0 0, 12px 20px; }
          100% { background-position: 0 0, 0 0, 0px 0px; }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Demo — proves the shell is reusable: same component, new props    */
/* ------------------------------------------------------------------ */
export default function Demo() {
  return (
    <div
      style={{
        minHeight: 620,
        padding: "56px 24px",
        background:
          "radial-gradient(120% 90% at 50% 0%, #f4f5f3 0%, #e7e9e6 55%, #dcdfdb 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 36,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 460 }}>
        <div style={{ fontSize: 12, letterSpacing: 3, color: "#8a938d", marginBottom: 8 }}>
          HARDWARE COMPONENT
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.6, color: "#5b635e" }}>
          <code style={{ color: "#1f2422" }}>&lt;CodePod /&gt;</code> — a clear-shell device with the
          board in its true colours underneath. Pass <code style={{ color: "#1f2422" }}>accent</code>,{" "}
          <code style={{ color: "#1f2422" }}>label</code> and <code style={{ color: "#1f2422" }}>snippets</code>{" "}
          to make it yours. Tap the power button, click the arrows to flip through code.
        </div>
      </div>

      <CodePod />
    </div>
  );
}
