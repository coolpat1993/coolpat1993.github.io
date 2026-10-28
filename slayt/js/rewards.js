window.SC = window.SC || {};

(function () {
  const SC = window.SC;
  const R = SC.RNG;
  const CFG = SC.CONFIG;

  SC.Rewards = {
    // Distinct cards, rarity rolled from the weight table. Legendary only once per run.
    pickCards(state, kind, n, exclude) {
      const weights = CFG.cardWeights[kind] || CFG.cardWeights.combat;
      const owned = state.runStats.cardsCollected.concat(state.deck.map(c => c.defId));
      const hasLegend = owned.some(id => SC.CARDS[id].rarity === 'legendary');
      const chosen = [];
      let guard = 0;
      while (chosen.length < n && guard++ < 60) {
        const entries = Object.keys(weights)
          .filter(r => !(r === 'legendary' && hasLegend))
          .map(r => [r, weights[r]]);
        const rarity = R.weighted(state, entries);
        const pool = SC.State.cardPool(state, rarity).filter(id => !chosen.includes(id) && !(exclude || []).includes(id));
        if (pool.length) chosen.push(R.pick(state, pool));
      }
      return chosen;
    },

    pickRelic(state) {
      const pool = SC.State.relicPool(state);
      return pool.length ? R.pick(state, pool) : null;
    },

    pickPotion(state) {
      return R.pick(state, Object.keys(SC.POTIONS));
    },

    // Gold is granted immediately; everything else is claimed by the player exactly once.
    generate(state, kind) {
      const range = CFG.gold[kind];
      const gold = R.range(state, range[0], range[1]);
      SC.State.gainGold(state, gold);
      const r = { kind, gold, cards: null, cardsDone: false, relic: null, relicTaken: false, potion: null, potionTaken: false };
      if (kind !== 'treasure') r.cards = SC.Rewards.pickCards(state, kind, 3);
      if (kind === 'elite' || kind === 'boss' || kind === 'treasure') r.relic = SC.Rewards.pickRelic(state);
      if (R.next(state) < (CFG.potionChance[kind] || 0)) r.potion = SC.Rewards.pickPotion(state);
      return r;
    }
  };
})();
