window.SC = window.SC || {};

// Seeded RNG (mulberry32). Any object with an integer `rng` field works as the generator state,
// so the game state itself can be saved and resumed with identical future rolls.
SC.RNG = {
  make(seed) {
    return { rng: seed | 0 };
  },
  next(s) {
    s.rng = (s.rng + 0x6D2B79F5) | 0;
    let t = Math.imul(s.rng ^ (s.rng >>> 15), 1 | s.rng);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  },
  int(s, n) {
    return Math.floor(SC.RNG.next(s) * n);
  },
  range(s, lo, hi) {
    return lo + SC.RNG.int(s, hi - lo + 1);
  },
  pick(s, arr) {
    return arr[SC.RNG.int(s, arr.length)];
  },
  shuffle(s, arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = SC.RNG.int(s, i + 1);
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  },
  // items: array of [value, weight]
  weighted(s, items) {
    const total = items.reduce((n, it) => n + it[1], 0);
    let r = SC.RNG.next(s) * total;
    for (const it of items) {
      r -= it[1];
      if (r < 0) return it[0];
    }
    return items[items.length - 1][0];
  }
};

SC.hashSeed = function (str) {
  const s = String(str).trim();
  if (/^-?\d+$/.test(s)) return parseInt(s, 10) | 0;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
};
