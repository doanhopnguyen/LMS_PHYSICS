// A contiguous watched frontier: replay is allowed, unseen jumps and fast playback are not.
export function createVideoWatchGuard({ watched = 0, completed = false, now = () => performance.now() } = {}) {
  let frontier = Math.max(0, Number(watched) || 0);
  let position = 0;
  let clock = now();
  let duration = 0;
  const reset = () => {
    frontier = 0;
    position = 0;
    clock = now();
    return { violation: true, watched: 0, finished: false };
  };
  return {
    get watched() {
      return frontier;
    },
    setCompleted(value) {
      completed = Boolean(value);
    },
    baseline(time = position) {
      position = time;
      clock = now();
    },
    seek(time) {
      if (!completed && time > frontier + 0.15) return reset();
      position = time;
      clock = now();
      return { watched: frontier, violation: false };
    },
    rate(rate, time = position) {
      return !completed && rate > 1.05 && time >= frontier - 0.15 ? reset() : { watched: frontier, violation: false };
    },
    sample({ time, length = duration, rate = 1, playing = false }) {
      duration = Number.isFinite(length) ? length : 0;
      const elapsed = Math.max(0, (now() - clock) / 1000);
      const advance = time - position;
      if (!completed && time > frontier + 0.15) {
        // A pause can deliver one final media update after playback stops.
        // Accept that small drift without adding watch credit; seeking events remain stricter.
        if (!playing && time <= frontier + 0.4 && advance <= 0.4) {
          position = time;
          clock = now();
          return { watched: frontier, violation: false };
        }
        if (!playing || rate > 1.05 || advance > elapsed + 0.4) return reset();
        frontier = Math.max(frontier, time);
      }
      position = time;
      clock = now();
      return { watched: frontier, violation: false };
    },
    finish() {
      return duration > 0 && (completed || frontier >= duration - 0.5);
    },
  };
}
