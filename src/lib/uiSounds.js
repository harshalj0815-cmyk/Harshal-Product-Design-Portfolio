const CLICK_SRC = "/sfx/mouse-click.mp3";
const KEY_SRC = "/sfx/key-click.mp3";

let soundEnabled = true;
let unlocked = false;

const caches = {
  click: null,
  key: null,
};

const UI_VOLUME = 0.32;

function getCached(kind, src) {
  if (!caches[kind]) {
    const a = new Audio(src);
    a.preload = "auto";
    a.volume = UI_VOLUME;
    caches[kind] = a;
  }
  return caches[kind];
}

/** Warm buffers so the first audible click isn't lost to load latency. */
export function unlockUiSounds() {
  if (unlocked) return;
  unlocked = true;
  getCached("click", CLICK_SRC);
  getCached("key", KEY_SRC);
  // Prime decode without audible output
  for (const kind of ["click", "key"]) {
    const a = caches[kind];
    if (!a) continue;
    const prev = a.volume;
    a.volume = 0;
    a.play()
      .then(() => {
        a.pause();
        a.currentTime = 0;
        a.volume = prev;
      })
      .catch(() => {
        a.volume = prev;
      });
  }
}

function play(kind, src) {
  if (!soundEnabled) return;
  unlockUiSounds();
  try {
    // Clone so rapid clicks overlap cleanly and aren't cut short
    const base = getCached(kind, src);
    const audio = base.cloneNode(true);
    audio.volume = UI_VOLUME;
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Fallback: replay the shared element
      base.currentTime = 0;
      base.volume = UI_VOLUME;
      void base.play().catch(() => {});
    });
  } catch {
    /* ignore */
  }
}

export function setUiSoundEnabled(on) {
  soundEnabled = Boolean(on);
}

export function playClickSound() {
  play("click", CLICK_SRC);
}

export function playKeySound() {
  play("key", KEY_SRC);
}

/** True when the event target is a physical CodePod keycap. */
export function isDeviceKeyTarget(target) {
  return Boolean(target?.closest?.("[data-device-key]"));
}
