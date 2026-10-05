import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CodePod } from "./components/CodePod.jsx";
import { CustomCursor } from "./components/CustomCursor.jsx";
import { HeroCable, HeroNameplate } from "./components/HeroNameplate.jsx";
import {
  askAiLinks,
  askAiPrompt,
  caseStudies,
  shippedItems,
  socials,
} from "./data/content.js";
import {
  isDeviceKeyTarget,
  playClickSound,
  playKeySound,
  setUiSoundEnabled,
  unlockUiSounds,
} from "./lib/uiSounds.js";
import "./App.css";

const VIEW_KEY = "hpd-portfolio-views";

function useViewCount() {
  const [views, setViews] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(VIEW_KEY);
      const current = raw ? Number.parseInt(raw, 10) : 0;
      const next = Number.isFinite(current) ? current + 1 : 1;
      localStorage.setItem(VIEW_KEY, String(next));
      setViews(next);
    } catch {
      setViews(1);
    }
  }, []);

  return views;
}

function formatViews(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US").format(n);
}

/** Views counter under a caution cover that falls on click and resets off-screen */
function ViewsBadge({ count }) {
  const wrapRef = useRef(null);
  const coverRef = useRef(null);
  const [fallen, setFallen] = useState(false);
  const [fallBox, setFallBox] = useState(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          setFallen(false);
          setFallBox(null);
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const dropCover = () => {
    const el = coverRef.current;
    if (!el || fallen) return;
    const r = el.getBoundingClientRect();
    // Pin to the viewport so the fall paints outside without growing document height
    setFallBox({
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
    });
    setFallen(true);
  };

  return (
    <div
      ref={wrapRef}
      className={`views-wrap${fallen ? " is-fallen" : ""}`}
      title="Local view counter for this browser"
    >
      <div className="views">
        <span className="views-label">LT-Views</span>
        <span className="views-count">{formatViews(count)}</span>
      </div>

      <button
        ref={coverRef}
        type="button"
        className="views-cover"
        aria-label="Caution, do not click"
        aria-hidden={fallen}
        tabIndex={fallen ? -1 : 0}
        onClick={dropCover}
        style={
          fallBox
            ? {
                position: "fixed",
                top: fallBox.top,
                left: fallBox.left,
                width: fallBox.width,
                height: fallBox.height,
                right: "auto",
                bottom: "auto",
                zIndex: 80,
              }
            : undefined
        }
      >
        <span className="views-cover-stripes" aria-hidden="true" />
        <span className="views-cover-body">
          <svg
            className="views-cover-mark"
            viewBox="0 0 24 24"
            width="28"
            height="28"
            aria-hidden="true"
          >
            <path
              d="M12 2.6L22.4 20.8H1.6L12 2.6Z"
              fill="currentColor"
            />
            <path
              d="M12 8.2v6.1"
              stroke="#ebb018"
              strokeWidth="2.2"
              strokeLinecap="square"
            />
            <rect x="10.9" y="16.2" width="2.2" height="2.2" fill="#ebb018" />
          </svg>
          <span className="views-cover-copy">
            <span className="views-cover-title">Caution</span>
            <span className="views-cover-sub">Do not click</span>
          </span>
        </span>
        <span className="views-cover-stripes" aria-hidden="true" />
        <span className="views-cover-gloss" aria-hidden="true" />
      </button>
    </div>
  );
}

function askAiDestination(baseUrl) {
  const encoded = encodeURIComponent(askAiPrompt);
  try {
    const target = new URL(baseUrl);
    if (target.hostname.includes("chatgpt.com")) {
      target.searchParams.set("q", askAiPrompt);
      return target.toString();
    }
    if (target.hostname.includes("claude.ai")) {
      // Claude web supports /new?q=
      return `https://claude.ai/new?q=${encoded}`;
    }
    if (
      target.hostname.includes("gemini.google.com") ||
      target.hostname.includes("google.com")
    ) {
      // gemini.google.com does not accept ?q= — Google AI Mode does
      return `https://www.google.com/search?udm=50&q=${encoded}`;
    }
  } catch {
    // fall through
  }
  return baseUrl;
}

function openAskAi(url) {
  // Open synchronously inside the click — awaiting clipboard first gets blocked as a popup.
  window.open(askAiDestination(url), "_blank", "noopener,noreferrer");
  navigator.clipboard.writeText(askAiPrompt).catch(() => {
    // Clipboard may be blocked; the URL prefill still carries the prompt where supported.
  });
}

function FeatureStudy({ study, index = 0 }) {
  const tone = study.status === "live" ? "live" : study.status;
  const imageLeft = index % 2 === 0;

  const stageLabel =
    study.stageLabel ||
    (study.status === "progress"
      ? "Drafting…"
      : study.status === "empty"
        ? "Visual soon"
        : "Preview");

  const stageInner = study.image ? (
    <img
      className="stage-image"
      src={study.image}
      alt={study.imageAlt || study.title}
    />
  ) : (
    <div className="stage-panel">
      <div className="stage-row wide" />
      <div className="stage-row mid" />
      <div className="stage-block">{stageLabel}</div>
    </div>
  );

  const stage =
    study.status === "live" ? (
      <a
        className="feature-stage feature-stage-link"
        data-tone={tone}
        href={study.href}
        target="_blank"
        rel="noreferrer"
      >
        {stageInner}
      </a>
    ) : (
      <div className="feature-stage" data-tone={tone} aria-hidden="true">
        {stageInner}
      </div>
    );

  const copy = (
    <div className="feature-copy">
      <span className="pill" data-tone={tone}>
        {study.tag}
      </span>
      <h3 className="feature-title">{study.title}</h3>
      <p className="feature-body">{study.summary}</p>
      {study.status === "live" ? (
        <a
          className="feature-link"
          href={study.href}
          target="_blank"
          rel="noreferrer"
        >
          Read the case study →
        </a>
      ) : (
        <span className="feature-link" style={{ color: "var(--color-slate)" }}>
          {study.status === "progress" ? "In progress" : "Coming soon"}
        </span>
      )}
    </div>
  );

  return (
    <article className={`feature${imageLeft ? "" : " feature--flip"}`}>
      {imageLeft ? (
        <>
          {stage}
          {copy}
        </>
      ) : (
        <>
          {copy}
          {stage}
        </>
      )}
    </article>
  );
}

const UI_SOUND_KEY = "hpd-portfolio-ui-sound";

export default function App() {
  const views = useViewCount();
  const [scrolled, setScrolled] = useState(false);
  const heroInnerRef = useRef(null);
  const deviceRef = useRef(null);
  const nameplateRef = useRef(null);
  const [cablePath, setCablePath] = useState(null);
  const [podPowered, setPodPowered] = useState(true);
  const [uiSoundOn, setUiSoundOn] = useState(() => {
    try {
      const raw = localStorage.getItem(UI_SOUND_KEY);
      if (raw === null) {
        // Migrate older combined mute key if present
        const legacy = localStorage.getItem("hpd-portfolio-sound");
        if (legacy === null) return true;
        return legacy !== "0";
      }
      return raw !== "0";
    } catch {
      return true;
    }
  });

  const toggleUiSound = () => {
    setUiSoundOn((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(UI_SOUND_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setUiSoundEnabled(uiSoundOn);
  }, [uiSoundOn]);

  // Site-wide mouse click; device keycaps use the keyboard sample instead
  useEffect(() => {
    const onPointerDown = (e) => {
      if (e.button !== 0) return;
      unlockUiSounds();
      if (!uiSoundOn) return;
      if (isDeviceKeyTarget(e.target)) {
        playKeySound();
        return;
      }
      playClickSound();
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [uiSoundOn]);

  useLayoutEffect(() => {
    const measure = () => {
      const inner = heroInnerRef.current;
      const device = deviceRef.current;
      const plate = nameplateRef.current;
      if (!inner || !device || !plate) return;

      const ir = inner.getBoundingClientRect();
      const dr = device.getBoundingClientRect();
      const pr = plate.getBoundingClientRect();

      // Dock just inside each edge so the cord reads as coming from behind
      const x1 = dr.right - ir.left - 14;
      const y1 = dr.top - ir.top + dr.height * 0.52;
      const x2 = pr.left - ir.left + 10;
      const y2 = pr.top - ir.top + pr.height * 0.5;
      const dipExtra = Math.min(56, Math.abs(x2 - x1) * 0.35);
      setCablePath({
        x1,
        y1,
        x2,
        y2,
        w: ir.width,
        h: Math.max(ir.height, Math.max(y1, y2) + dipExtra + 28),
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (heroInnerRef.current) ro.observe(heroInnerRef.current);
    if (deviceRef.current) ro.observe(deviceRef.current);
    if (nameplateRef.current) ro.observe(nameplateRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div className="site">
      <CustomCursor />
      <div className="desktop-banner" role="status">
        <strong>Best on a larger screen.</strong> The device interactions are built
        for desktop — open this on a laptop for the full experience.
      </div>

      <div className="paper">
      <header className={`site-nav${scrolled ? " is-scrolled" : ""}`}>
        <a className="brand" href="#top">
          Harshal
        </a>
        <div className="nav-end">
          <nav aria-label="Primary">
            <ul className="nav-links">
              <li>
                <a href="/resume.pdf" target="_blank" rel="noreferrer">
                  Resume
                </a>
              </li>
              <li>
                <a
                  className="nav-cta"
                  href={socials.find((s) => s.id === "email")?.href || "mailto:hello@example.com"}
                >
                  Hire
                </a>
              </li>
            </ul>
          </nav>
          <button
            type="button"
            className={`nav-sound${uiSoundOn ? "" : " is-muted"}`}
            onClick={toggleUiSound}
            aria-label={uiSoundOn ? "Disable UI sounds" : "Enable UI sounds"}
            aria-pressed={uiSoundOn}
            title={uiSoundOn ? "UI sounds on" : "UI sounds off"}
          >
            {uiSoundOn ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 9.5v5h3.2L12 19V5L7.2 9.5H4Z"
                  fill="currentColor"
                />
                <path
                  d="M15.2 8.8a4.2 4.2 0 0 1 0 6.4"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
                <path
                  d="M17.6 6.2a7.2 7.2 0 0 1 0 11.6"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 9.5v5h3.2L12 19V5L7.2 9.5H4Z"
                  fill="currentColor"
                />
                <path
                  d="M16 9.2l4.8 4.8M20.8 9.2L16 14"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero" aria-label="Hero">
          <div className="hero-inner" ref={heroInnerRef}>
            <HeroCable path={cablePath} />
            <div className="hero-device" ref={deviceRef}>
              <CodePod
                accent="#1fe06a"
                onPoweredChange={setPodPowered}
                snippets={[
                  {
                    lang: "PD",
                    code: `const portfolio = {\n  focus: "product design",\n  craft: "interaction",\n  mode: "ship"\n};\n\nexport default portfolio;`,
                  },
                  {
                    lang: "UX",
                    code: `function decide(options) {\n  return options\n    .filter((o) => o.helpsUser)\n    .sort((a, b) => b.clarity - a.clarity)[0];\n}`,
                  },
                  {
                    lang: "AI",
                    code: `prompt = """\nDesign the quietest\npath to the answer.\n"""\n\nprint(explore(prompt))`,
                  },
                  {
                    type: "music",
                    lang: "NOW",
                    tracks: [
                      {
                        title: "All The Same (Streets)",
                        artist: "Keston Wright",
                        src: "/audio/all-the-same.mp3",
                      },
                      {
                        title: "Consolations",
                        artist: "Ryan James Carr",
                        src: "/audio/consolations.mp3",
                      },
                      {
                        title: "The Adults Are Talking",
                        artist: "The Strokes",
                        src: "/audio/adults-are-talking.mp3",
                      },
                    ],
                  },
                ]}
              />
            </div>
            <HeroNameplate
              rootRef={nameplateRef}
              name="Harshal"
              line="Product designer. Interactive work you can hold — case studies, shipped products, and AI experiments below."
              accent="#1fe06a"
              powered={podPowered}
            />
          </div>
        </section>

        <div className="section-mist" id="work">
          <section className="section">
            <p className="section-kicker">Case studies</p>
            <h2 className="section-title">Selected work</h2>
            <p className="section-lead">Selected product stories.</p>
            <div className="feature-stack">
              {caseStudies.map((study, index) => (
                <FeatureStudy key={study.id} study={study} index={index} />
              ))}
            </div>
          </section>
        </div>

        <section className="section" id="shipped">
          <p className="section-kicker">Beyond the case study</p>
          <h2 className="section-title">Shipped & experiments</h2>
          <p className="section-lead">
            Smaller releases and AI explorations — proof that something left the
            notebook.
          </p>
          <div className="shipped-grid">
            {shippedItems.map((item) => (
              <article key={item.id} className="ship-item">
                <p className="ship-kind">
                  {item.status === "progress"
                    ? `${item.kind} · In progress`
                    : item.status === "empty"
                      ? `${item.kind} · Empty`
                      : item.kind}
                </p>
                <h3 className="ship-title">{item.title}</h3>
                <p className="ship-note">{item.note}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="ask-wrap" id="ask">
          <section className="section ask ask-paper">
            <p className="section-kicker">Second opinion</p>
            <h2 className="section-title">Ask an AI about this site</h2>
            <p className="section-lead">
              Copies a short review prompt, then opens the AI of your choice.
              Ask what stands out — and what could be sharper.
            </p>
            <div className="ask-row">
              {askAiLinks.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="ask-tile"
                  style={{ "--ask-tone": item.tone }}
                  onClick={() => openAskAi(item.url)}
                >
                  <span className="ask-tile-fill" aria-hidden="true" />
                  <span
                    className="ask-tile-icon"
                    style={{ background: item.tone }}
                    aria-hidden="true"
                  >
                    <img
                      src={item.logo}
                      alt=""
                      className={
                        item.invertLogo ? "ask-tile-logo is-inverted" : "ask-tile-logo"
                      }
                    />
                  </span>
                  <span className="ask-tile-label">
                    {item.label} <span aria-hidden="true">→</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="ask-hint">Prompt is copied to your clipboard on click.</p>
          </section>
        </div>
      </main>
      </div>

      <footer className="footer" id="connect">
        <div className="footer-inner">
          <div>
            <p className="section-kicker" style={{ marginBottom: 12 }}>
              Connect
            </p>
            <div className="socials">
              {socials.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  target={item.href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noreferrer"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <ViewsBadge count={views} />
        </div>
      </footer>
    </div>
  );
}
