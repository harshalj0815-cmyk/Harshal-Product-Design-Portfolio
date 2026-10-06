import { useEffect, useRef, useState } from "react";

let burstId = 0;

/**
 * Center ray matches tip at −113°; sides fan ±45° off that.
 */
const TIP_ANGLE = -113;
const RAY_SPREAD = 56;
const RAYS = [
  { angle: TIP_ANGLE - RAY_SPREAD, length: 6 },
  { angle: TIP_ANGLE, length: 6.5 },
  { angle: TIP_ANGLE + RAY_SPREAD, length: 6 },
];

const DISPLAY_H = 20;

/** Moore-neighbor contour walk on a binary mask. */
function traceContour(mask, w, h, startX, startY) {
  const dirs = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
  ];
  const inside = (x, y) =>
    x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] === 1;

  const points = [];
  let x = startX;
  let y = startY;
  let dir = 0;

  for (let step = 0; step < w * h; step += 1) {
    points.push([x, y]);
    let found = false;
    // start search from dir-2 (prefer turning left) for outer contour
    for (let i = 0; i < 8; i += 1) {
      const d = (dir + 6 + i) % 8;
      const nx = x + dirs[d][0];
      const ny = y + dirs[d][1];
      if (inside(nx, ny)) {
        x = nx;
        y = ny;
        dir = d;
        found = true;
        break;
      }
    }
    if (!found) break;
    if (x === startX && y === startY && points.length > 8) break;
  }

  return points;
}

/** Ramer–Douglas–Peucker simplify. */
function simplify(points, epsilon) {
  if (points.length < 3) return points;

  const [sx, sy] = points[0];
  const [ex, ey] = points[points.length - 1];
  let maxDist = 0;
  let maxIdx = 0;
  const dx = ex - sx;
  const dy = ey - sy;
  const len = Math.hypot(dx, dy) || 1;

  for (let i = 1; i < points.length - 1; i += 1) {
    const [px, py] = points[i];
    const dist = Math.abs(dy * px - dx * py + ex * sy - ey * sx) / len;
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplify(points.slice(0, maxIdx + 1), epsilon);
    const right = simplify(points.slice(maxIdx), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[points.length - 1]];
}

/**
 * Extract the soft pointer silhouette from pointer-click.png and
 * convert it to a crisp SVG path (same shape, no pixel breakup).
 */
function extractCursorPath(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, w, h);
      const total = w * h;
      const dark = new Uint8Array(total);

      for (let i = 0; i < total; i += 1) {
        const o = i * 4;
        const avg = (data[o] + data[o + 1] + data[o + 2]) / 3;
        dark[i] = avg < 80 && data[o + 3] > 40 ? 1 : 0;
      }

      const label = new Int32Array(total);
      let bestLabel = 0;
      let bestCount = 0;
      let next = 1;
      const stack = [];

      for (let start = 0; start < total; start += 1) {
        if (!dark[start] || label[start]) continue;
        const id = next;
        next += 1;
        let count = 0;
        stack.push(start);
        label[start] = id;
        while (stack.length) {
          const i = stack.pop();
          count += 1;
          const x = i % w;
          const y = (i / w) | 0;
          for (const [dx, dy] of [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ]) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const n = ny * w + nx;
            if (!dark[n] || label[n]) continue;
            label[n] = id;
            stack.push(n);
          }
        }
        if (count > bestCount) {
          bestCount = count;
          bestLabel = id;
        }
      }

      const mask = new Uint8Array(total);
      let minX = w;
      let minY = h;
      let maxX = 0;
      let maxY = 0;
      let tipX = 0;
      let tipY = 0;
      let tipScore = Infinity;
      let startX = -1;
      let startY = -1;

      for (let i = 0; i < total; i += 1) {
        if (label[i] !== bestLabel) continue;
        mask[i] = 1;
        const x = i % w;
        const y = (i / w) | 0;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        const score = x + y;
        if (score < tipScore) {
          tipScore = score;
          tipX = x;
          tipY = y;
        }
        // topmost-then-leftmost seed for contour
        if (
          startX < 0 ||
          y < startY ||
          (y === startY && x < startX)
        ) {
          // prefer a boundary pixel: has empty neighbor
          let boundary = false;
          for (const [dx, dy] of [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ]) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h || !mask[ny * w + nx]) {
              // mask not fully filled yet — check dark/label instead
            }
            if (
              nx < 0 ||
              ny < 0 ||
              nx >= w ||
              ny >= h ||
              label[ny * w + nx] !== bestLabel
            ) {
              boundary = true;
            }
          }
          if (boundary || startX < 0) {
            startX = x;
            startY = y;
          }
        }
      }

      // Find a reliable boundary start: leftmost pixel of top row of blob
      startX = minX;
      startY = minY;
      for (let x = minX; x <= maxX; x += 1) {
        if (label[minY * w + x] === bestLabel) {
          startX = x;
          startY = minY;
          break;
        }
      }

      let contour = traceContour(mask, w, h, startX, startY);
      if (contour.length < 8) {
        resolve(null);
        return;
      }

      // Keep enough detail for the soft rounded shape
      contour = simplify(contour, 0.9);

      const pad = 4;
      const cw = maxX - minX + 1 + pad * 2;
      const ch = maxY - minY + 1 + pad * 2;
      const displayH = DISPLAY_H;
      const displayW = Math.round((displayH * cw) / ch);

      const pathD = contour
        .map(([x, y], i) => {
          const px = x - minX + pad;
          const py = y - minY + pad;
          return `${i === 0 ? "M" : "L"}${px.toFixed(2)} ${py.toFixed(2)}`;
        })
        .join(" ");

      const tipDisplayX = ((tipX - minX + pad) / cw) * displayW;
      const tipDisplayY = ((tipY - minY + pad) / ch) * displayH;

      resolve({
        pathD: `${pathD} Z`,
        viewW: cw,
        viewH: ch,
        width: displayW,
        height: displayH,
        tipX: tipDisplayX,
        tipY: tipDisplayY,
      });
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function PointerShape({ asset }) {
  // Uniform stroke width all the way around (scale was uneven on a pointer)
  const border = (2.6 * asset.viewH) / asset.height;

  return (
    <svg
      className="site-cursor-svg"
      width={asset.width}
      height={asset.height}
      viewBox={`0 0 ${asset.viewW} ${asset.viewH}`}
      fill="none"
      aria-hidden="true"
    >
      <path
        d={asset.pathD}
        fill="#ffffff"
        stroke="#111111"
        strokeWidth={border}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClickBurst({ x, y, color = "#111111" }) {
  const size = 36;
  const cx = size / 2;
  const cy = size / 2;
  const gap = 5;

  return (
    <div
      className="site-cursor-burst"
      style={{
        width: size,
        height: size,
        margin: `${-cy}px 0 0 ${-cx}px`,
        transform: `translate3d(${x}px, ${y}px, 0)`,
      }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
        <g
          className="site-cursor-rays"
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
          {RAYS.map((ray, i) => {
            const rad = (ray.angle * Math.PI) / 180;
            const x1 = cx + Math.cos(rad) * gap;
            const y1 = cy + Math.sin(rad) * gap;
            const x2 = cx + Math.cos(rad) * (gap + ray.length);
            const y2 = cy + Math.sin(rad) * (gap + ray.length);
            const len = Math.hypot(x2 - x1, y2 - y1);

            return (
              <line
                key={ray.angle}
                className="site-cursor-ray"
                style={{
                  animationDelay: `${i * 14}ms`,
                  strokeDasharray: len,
                  strokeDashoffset: len,
                }}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export function CustomCursor() {
  const cursorRef = useRef(null);
  const tipRef = useRef({ x: 2, y: 2 });
  const pillLabelRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [bursts, setBursts] = useState([]);
  const [cursorAsset, setCursorAsset] = useState(null);
  const [pillLabel, setPillLabel] = useState(null);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine) and (min-width: 761px)");
    const sync = () => setEnabled(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    extractCursorPath("/cursors/pointer-click.png").then((asset) => {
      if (cancelled || !asset) return;
      tipRef.current = { x: asset.tipX, y: asset.tipY };
      setCursorAsset(asset);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    document.documentElement.classList.add("custom-cursor-on");

    const pointer = { x: 0, y: 0, hasPoint: false };
    let loopRaf = 0;
    let lastVisible = false;

    const overDeviceScreen = (target) =>
      Boolean(
        target?.closest?.(
          ".cp-screen.cp-powered, .hero-nameplate-screen.is-on"
        )
      );

    const overDeviceShell = (target) =>
      Boolean(target?.closest?.(".cp-device, .hero-device, .hero-nameplate"));

    const overButton = (target) =>
      Boolean(
        target?.closest?.(
          "button, [role='button'], .nav-cta, .ask-tile, .views-cover"
        )
      );

    const hitTargetAt = (x, y) => {
      const stack = document.elementsFromPoint?.(x, y);
      if (stack?.length) {
        return (
          stack.find(
            (node) =>
              node instanceof Element &&
              !node.closest?.(".site-cursor, .site-cursor-burst, .scroll-plane")
          ) || null
        );
      }
      return document.elementFromPoint(x, y);
    };

    /** Rect check — works even when scroll moves content under a still pointer. */
    const pillLabelAtPointer = () => {
      if (!pointer.hasPoint) return null;
      const hosts = document.querySelectorAll("[data-cursor-pill]");
      for (const host of hosts) {
        const r = host.getBoundingClientRect();
        if (
          pointer.x >= r.left &&
          pointer.x <= r.right &&
          pointer.y >= r.top &&
          pointer.y <= r.bottom
        ) {
          return host.getAttribute("data-cursor-pill");
        }
      }
      return null;
    };

    const paintPosition = (nextPill) => {
      const el = cursorRef.current;
      if (!el || !pointer.hasPoint) return;
      if (nextPill) {
        el.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
      } else {
        const { x: tipX, y: tipY } = tipRef.current;
        el.style.transform = `translate3d(${pointer.x - tipX}px, ${pointer.y - tipY}px, 0)`;
      }
    };

    const syncHoverState = (targetHint) => {
      if (!pointer.hasPoint) return;

      const target =
        targetHint instanceof Element
          ? targetHint
          : hitTargetAt(pointer.x, pointer.y);
      const onScreen = overDeviceScreen(target);
      document.documentElement.classList.toggle("is-over-cp-screen", onScreen);

      const nextPill = onScreen ? null : pillLabelAtPointer();
      if (nextPill !== pillLabelRef.current) {
        pillLabelRef.current = nextPill;
        setPillLabel(nextPill);
      }

      paintPosition(nextPill);

      const nextVisible = !onScreen;
      if (nextVisible !== lastVisible) {
        lastVisible = nextVisible;
        setVisible(nextVisible);
      }
    };

    // Always re-check card bounds every frame so scroll-without-move clears the pill.
    const tick = () => {
      syncHoverState();
      loopRaf = requestAnimationFrame(tick);
    };
    loopRaf = requestAnimationFrame(tick);

    const onMove = (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.hasPoint = true;
      syncHoverState(e.target);
    };

    const onLeave = () => {
      document.documentElement.classList.remove("is-over-cp-screen");
      pointer.hasPoint = false;
      pillLabelRef.current = null;
      lastVisible = false;
      setPillLabel(null);
      setVisible(false);
    };

    const onPointerDown = (e) => {
      if (e.button !== 0) return;
      if (overDeviceScreen(e.target)) return;
      if (pillLabelAtPointer() || e.target?.closest?.("[data-cursor-pill]")) {
        return;
      }
      const id = ++burstId;
      const { clientX: x, clientY: y } = e;
      const color =
        overButton(e.target) || overDeviceShell(e.target)
          ? "#ffffff"
          : "#111111";
      setBursts((prev) => [...prev, { id, x, y, color }]);
      window.setTimeout(() => {
        setBursts((prev) => prev.filter((b) => b.id !== id));
      }, 560);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(loopRaf);
      document.documentElement.classList.remove("custom-cursor-on");
      document.documentElement.classList.remove("is-over-cp-screen");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  const showCursor = visible && (pillLabel || cursorAsset);

  return (
    <>
      <div
        ref={cursorRef}
        className={`site-cursor${showCursor ? " is-visible" : ""}${pillLabel ? " is-pill" : ""}`}
        aria-hidden="true"
      >
        {pillLabel ? (
          <span className="site-cursor-pill">
            <span className="site-cursor-pill__reel" aria-hidden="true">
              <span className="nav-cta__slide nav-cta__slide--1" />
              <span className="nav-cta__slide nav-cta__slide--2" />
              <span className="nav-cta__slide nav-cta__slide--3" />
              <span className="nav-cta__slide nav-cta__slide--4" />
            </span>
            <span className="site-cursor-pill__label">{pillLabel}</span>
          </span>
        ) : cursorAsset ? (
          <PointerShape asset={cursorAsset} />
        ) : null}
      </div>

      {bursts.map((burst) => (
        <ClickBurst key={burst.id} x={burst.x} y={burst.y} color={burst.color} />
      ))}
    </>
  );
}
