window.SC = window.SC || {};

(function () {
  const SC = window.SC;
  const CFG = SC.CONFIG;
  const RUN_KEY = 'shatteredcrown.run';
  const STATS_KEY = 'shatteredcrown.stats';
  const SETTINGS_KEY = 'shatteredcrown.settings';
  const CORRUPT_KEY = 'shatteredcrown.run.corrupt';

  // Falls back to memory when localStorage is unavailable (private mode, tests).
  const mem = {};
  const store = {
    get(k) {
      try { return localStorage.getItem(k); } catch (e) { return mem[k] === undefined ? null : mem[k]; }
    },
    set(k, v) {
      try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; }
    },
    del(k) {
      try { localStorage.removeItem(k); } catch (e) { delete mem[k]; }
    }
  };

  const SCREENS = ['map', 'combat', 'reward', 'shop', 'rest', 'event', 'relicpick'];

  function validCards(list) {
    return Array.isArray(list) && list.every(c => c && typeof c.uid === 'string' && SC.CARDS[c.defId]);
  }

  function validCombat(c) {
    return c && Array.isArray(c.enemies) && c.enemies.length && c.enemies.every(e => SC.ENEMIES[e.id] && Number.isFinite(e.hp) && SC.ENEMIES[e.id].moves[e.move || Object.keys(SC.ENEMIES[e.id].moves)[0]])
      && validCards(c.draw) && validCards(c.hand) && validCards(c.discard) && validCards(c.exhaust)
      && Array.isArray(c.enemyQueue) && c.flags && ['player', 'enemy', 'won', 'lost', 'fled'].includes(c.phase) && Number.isFinite(c.energy);
  }

  function validate(s) {
    try {
      if (!s || s.version !== CFG.saveVersion) return false;
      if (!Number.isFinite(s.seed) || !Number.isFinite(s.rng) || !s.runActive) return false;
      const p = s.player;
      if (!p || !SC.CHARACTERS[p.characterId] || !Number.isFinite(p.hp) || !Number.isFinite(p.maxHp) || p.hp <= 0 || p.hp > p.maxHp || !Number.isFinite(p.gold)) return false;
      if (!validCards(s.deck)) return false;
      if (!Array.isArray(s.relics) || !s.relics.every(r => SC.RELICS[r.id])) return false;
      if (!Array.isArray(s.potions) || !s.potions.every(x => x === null || SC.POTIONS[x])) return false;
      const nodes = s.map && s.map.nodes;
      if (!nodes || !Object.values(nodes).every(n => Array.isArray(n.next) && n.next.every(id => nodes[id]))) return false;
      if (s.currentNode && !nodes[s.currentNode]) return false;
      if (!SCREENS.includes(s.screen) || !s.runStats || !s.relicFlags || !Number.isFinite(s.nextUid)) return false;
      if (s.screen === 'relicpick' && !(s.pending && Array.isArray(s.pending.startRelics) && s.pending.startRelics.every(id => SC.RELICS[id]))) return false;
      if (s.screen === 'combat' && !validCombat(s.combat)) return false;
      if (s.screen === 'reward' && !(s.pending && s.pending.reward)) return false;
      if (s.screen === 'shop' && !(s.pending && s.pending.shop)) return false;
      if (s.screen === 'rest' && !(s.pending && s.pending.rest)) return false;
      if (s.screen === 'event' && !(s.pending && s.pending.event && SC.EVENTS[s.pending.event.id])) return false;
      return true;
    } catch (e) {
      return false;
    }
  }

  const defaultStats = () => ({ totalRuns: 0, wins: 0, highestAct: 0, bestScore: 0, enemiesDefeated: 0, cardsDiscovered: [], relicsDiscovered: [] });

  SC.Save = {
    validate,

    saveRun(state) {
      if (!state || !state.runActive) return;
      store.set(RUN_KEY, JSON.stringify(state, (k, v) => (k === 'events' ? [] : v)));
    },

    hasRun() {
      return store.get(RUN_KEY) !== null;
    },

    // Returns { state } or { error } when the stored run is invalid (it is moved aside, never silently lost).
    loadRun() {
      const raw = store.get(RUN_KEY);
      if (raw === null) return {};
      try {
        const s = JSON.parse(raw);
        if (validate(s)) return { state: s };
      } catch (e) { /* fall through */ }
      store.set(CORRUPT_KEY, raw);
      store.del(RUN_KEY);
      return { error: 'Your saved run was damaged and could not be restored.' };
    },

    clearRun() {
      store.del(RUN_KEY);
    },

    stats() {
      try {
        return Object.assign(defaultStats(), JSON.parse(store.get(STATS_KEY) || '{}'));
      } catch (e) {
        return defaultStats();
      }
    },

    updateStats(fn) {
      const s = SC.Save.stats();
      fn(s);
      store.set(STATS_KEY, JSON.stringify(s));
    },

    discover(kind, id) {
      const key = kind === 'cards' ? 'cardsDiscovered' : 'relicsDiscovered';
      const s = SC.Save.stats();
      if (s[key].includes(id)) return;
      s[key].push(id);
      store.set(STATS_KEY, JSON.stringify(s));
    },

    recordRun(state, won) {
      SC.Save.updateStats(s => {
        if (won) s.wins++;
        s.highestAct = Math.max(s.highestAct, state.act);
        s.bestScore = Math.max(s.bestScore, SC.State.score(state, won));
        s.enemiesDefeated += state.runStats.enemiesDefeated;
      });
    },

    resetAll() {
      [RUN_KEY, STATS_KEY, CORRUPT_KEY].forEach(store.del);
    },

    settings() {
      try {
        return Object.assign({ reduceMotion: false }, JSON.parse(store.get(SETTINGS_KEY) || '{}'));
      } catch (e) {
        return { reduceMotion: false };
      }
    },

    setSetting(k, v) {
      const s = SC.Save.settings();
      s[k] = v;
      store.set(SETTINGS_KEY, JSON.stringify(s));
    }
  };
})();
