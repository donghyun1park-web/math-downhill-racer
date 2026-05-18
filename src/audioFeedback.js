export const FEEDBACK_SETTINGS_KEY = "math-downhill-feedback-settings";
export const FEEDBACK_EVENTS = ["correct", "wrong", "boost", "jump", "land", "stageClear", "gameOver", "uiClick"];

const HAPTIC_PATTERNS = {
  correct: 20,
  wrong: [40, 30, 40],
  boost: [20, 20, 30],
  jump: 15,
  land: 30,
  stageClear: [30, 40, 30, 40, 60],
  gameOver: [80, 40, 80],
  uiClick: 8
};

export function getDefaultFeedbackSettings() {
  return { sound: true, haptic: true };
}

export function normalizeFeedbackSettings(value) {
  const defaults = getDefaultFeedbackSettings();
  if (!value || typeof value !== "object") return defaults;
  return {
    sound: typeof value.sound === "boolean" ? value.sound : defaults.sound,
    haptic: typeof value.haptic === "boolean" ? value.haptic : defaults.haptic
  };
}

export function createAudioFeedback({ settings, windowLike, navigatorLike } = {}) {
  let currentSettings = normalizeFeedbackSettings(settings);
  let audioContext = null;
  let unlocked = false;
  const win = windowLike || globalThis.window;
  const nav = navigatorLike || globalThis.navigator;

  function setSettings(next) {
    currentSettings = normalizeFeedbackSettings(next);
  }

  function getSettings() {
    return { ...currentSettings };
  }

  async function unlock() {
    if (!currentSettings.sound || unlocked) return;
    try {
      const AudioContextClass = win?.AudioContext || win?.webkitAudioContext;
      if (!AudioContextClass) return;
      audioContext ||= new AudioContextClass();
      if (audioContext.state === "suspended") await audioContext.resume();
      unlocked = true;
    } catch {
      unlocked = false;
    }
  }

  function play(name) {
    if (!currentSettings.sound || !FEEDBACK_EVENTS.includes(name)) return;
    try {
      const AudioContextClass = win?.AudioContext || win?.webkitAudioContext;
      if (!AudioContextClass) return;
      audioContext ||= new AudioContextClass();
      if (audioContext.state === "suspended") return;
      unlocked = true;
      playPattern(audioContext, name);
    } catch {
      // Audio must never interrupt gameplay.
    }
  }

  function haptic(name) {
    if (!currentSettings.haptic || !FEEDBACK_EVENTS.includes(name)) return;
    try {
      if (typeof nav?.vibrate === "function") nav.vibrate(HAPTIC_PATTERNS[name]);
    } catch {
      // Haptic support varies wildly; ignore failures.
    }
  }

  function trigger(name) {
    play(name);
    haptic(name);
  }

  return { getSettings, setSettings, unlock, play, haptic, trigger };
}

function playPattern(ctx, name) {
  const now = ctx.currentTime;
  if (name === "correct") {
    tone(ctx, 660, 880, now, 0.12, "sine", 0.06);
    tone(ctx, 880, 1175, now + 0.08, 0.14, "sine", 0.05);
  } else if (name === "wrong") {
    tone(ctx, 180, 120, now, 0.18, "square", 0.045);
  } else if (name === "boost") {
    tone(ctx, 160, 820, now, 0.42, "sawtooth", 0.05);
    noise(ctx, now, 0.22, 0.025);
  } else if (name === "jump") {
    tone(ctx, 360, 720, now, 0.18, "triangle", 0.045);
  } else if (name === "land") {
    tone(ctx, 120, 70, now, 0.12, "triangle", 0.07);
    noise(ctx, now, 0.08, 0.035);
  } else if (name === "stageClear") {
    tone(ctx, 523, 523, now, 0.12, "sine", 0.05);
    tone(ctx, 659, 659, now + 0.13, 0.12, "sine", 0.05);
    tone(ctx, 784, 1046, now + 0.26, 0.22, "sine", 0.055);
  } else if (name === "gameOver") {
    tone(ctx, 260, 180, now, 0.22, "sine", 0.055);
    tone(ctx, 180, 95, now + 0.18, 0.28, "sine", 0.045);
  } else if (name === "uiClick") {
    tone(ctx, 420, 620, now, 0.05, "triangle", 0.025);
  }
}

function tone(ctx, startFreq, endFreq, startTime, duration, type, volume) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, startTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), startTime + duration);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.03);
}

function noise(ctx, startTime, duration, volume) {
  const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * duration)), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = buffer;
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(startTime);
}
