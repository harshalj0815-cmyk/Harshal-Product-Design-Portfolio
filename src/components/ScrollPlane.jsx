import { useEffect, useRef } from "react";

function scrollMax() {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
}

function readScrollProgress() {
  const max = scrollMax();
  if (max <= 0) return 0;
  return Math.min(1, Math.max(0, window.scrollY / max));
}

/** Instant jump — overrides html { scroll-behavior: smooth }. */
function scrollToProgress(progress) {
  const root = document.documentElement;
  const top = scrollMax() * Math.min(1, Math.max(0, progress));
  root.scrollTop = top;
  document.body.scrollTop = top;
}

/** Custom scroll pane: paper plane + dash trail; drag scrolls in realtime. */
export function ScrollPlane() {
  const trackRef = useRef(null);
  const trailRef = useRef(null);
  const planeRef = useRef(null);
  const draggingRef = useRef(false);
  const prevScrollBehaviorRef = useRef("");

  const paint = (progress) => {
    const pct = `${progress * 100}%`;
    if (trailRef.current) trailRef.current.style.height = pct;
    if (planeRef.current) planeRef.current.style.top = pct;
  };

  useEffect(() => {
    paint(readScrollProgress());
    const onScrollOrResize = () => {
      if (draggingRef.current) return;
      paint(readScrollProgress());
    };
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, []);

  const progressFromClientY = (clientY) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    if (rect.height <= 0) return 0;
    return Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
  };

  const applyDrag = (clientY) => {
    const next = progressFromClientY(clientY);
    // Paint plane first, then scroll — both sync, no React batch delay
    paint(next);
    scrollToProgress(next);
  };

  const endDrag = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    document.documentElement.classList.remove("is-scroll-plane-dragging");
    document.documentElement.style.scrollBehavior = prevScrollBehaviorRef.current;
    paint(readScrollProgress());
  };

  const onPointerDown = (event) => {
    if (event.button != null && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    draggingRef.current = true;
    prevScrollBehaviorRef.current =
      document.documentElement.style.scrollBehavior || "";
    document.documentElement.style.scrollBehavior = "auto";
    document.documentElement.classList.add("is-scroll-plane-dragging");
    applyDrag(event.clientY);
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const onMove = (event) => {
      if (!draggingRef.current) return;
      event.preventDefault();
      applyDrag(event.clientY);
    };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, []);

  return (
    <div className="scroll-plane" aria-hidden="true">
      <div
        ref={trackRef}
        className="scroll-plane__track"
        onPointerDown={onPointerDown}
      >
        <div ref={trailRef} className="scroll-plane__trail" />
        <div
          ref={planeRef}
          className="scroll-plane__plane"
          onPointerDown={onPointerDown}
        >
          <img
            src="/PaperPlane.svg?v=2"
            alt=""
            className="scroll-plane__icon"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
