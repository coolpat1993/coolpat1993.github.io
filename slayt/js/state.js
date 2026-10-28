window.SC = window.SC || {};

(function () {
  const SC = window.SC;
  const CFG = SC.CONFIG;

  // All run mutations go through these helpers; the UI only reads state.
  SC.State = {
    newRun(characterId, seed) {
      const ch = SC.CHARACTERS[characterId];
      const state = {
        version: CFG.saveVersion,
        screen: 'map',
        seed: seed | 0,
        rng: seed | 0,
        runActive: true,
        act: 1,
        floor: 0,
        player: { characterId, hp: ch.hp, maxHp: ch.hp, block: 0, energy: ch.energy, gold: CFG.startGold, statuses: {} },
        deck: [],
        relics: [],
        relicFlags: {},
        potions: [],
        map: null,
        currentNode: null,
        combat: null,
        pending: null,
        seenEvents: [],
        nextUid: 1,
        runStats: { enemiesDefeated: 0, elitesDefeated: 0, bossesDefeated: 0, cardsCollected: [], relicsObtained: [], goldEarned: 0, bossSeen: null, killedBy: null }
      };
      for (let i = 0; i < CFG.potionSlots; i++) state.potions.push(null);
      Object.keys(ch.starterDeck).forEach(id => {
        for (let i = 0; i < ch.starterDeck[id]; i++) state.deck.push(SC.State.makeCard(state, id));
      });
      return state;
    },

    makeCard(state, defId, extra) {
      return Object.assign({ uid: 'c' + state.nextUid++, defId, upgraded: false }, extra || {});
    },

    addCard(state, defId) {
      const card = SC.State.makeCard(state, defId);
      state.deck.push(card);
      state.runStats.cardsCollected.push(defId);
      if (SC.Save) SC.Save.discover('cards', defId);
      SC.Bus.emit(state, 'cardAdded', { card });
      return card;
    },

    removeCard(state, uid) {
      const i = state.deck.findIndex(c => c.uid === uid);
      if (i >= 0) state.deck.splice(i, 1);
      return i >= 0;
    },

    canUpgrade(card) {
      return !card.upgraded && !!SC.CARDS[card.defId].upgrade;
    },

    upgradeCard(state, uid) {
      const card = state.deck.find(c => c.uid === uid);
      if (!card || !SC.State.canUpgrade(card)) return false;
      card.upgraded = true;
      return true;
    },

    gainGold(state, n) {
      state.player.gold += n;
      state.runStats.goldEarned += n;
      SC.Bus.emit(state, 'goldGained', { amount: n });
    },

    spendGold(state, n) {
      if (state.player.gold < n) return false;
      state.player.gold -= n;
      return true;
    },

    heal(state, n) {
      const p = state.player;
      const before = p.hp;
      p.hp = Math.min(p.maxHp, p.hp + n);
      return p.hp - before;
    },

    gainMaxHp(state, n) {
      state.player.maxHp += n;
      state.player.hp += n;
    },

    loseMaxHp(state, n) {
      state.player.maxHp = Math.max(1, state.player.maxHp - n);
      state.player.hp = Math.min(state.player.hp, state.player.maxHp);
    },

    hasRelic(state, id) {
      return state.relics.some(r => r.id === id);
    },

    addRelic(state, id) {
      if (SC.State.hasRelic(state, id)) return false;
      state.relics.push({ id });
      state.runStats.relicsObtained.push(id);
      if (SC.Save) SC.Save.discover('relics', id);
      SC.Bus.emit(state, 'relicObtained', { id });
      return true;
    },

    addPotion(state, id) {
      const slot = state.potions.indexOf(null);
      if (slot < 0) return false;
      state.potions[slot] = id;
      return true;
    },

    // Defs the player may be offered, optionally filtered by rarity.
    cardPool(state, rarity) {
      const ch = state.player.characterId;
      return Object.keys(SC.CARDS).filter(id => {
        const d = SC.CARDS[id];
        return (d.character === ch || d.character === 'shared') && d.rarity !== 'basic' && d.rarity !== 'status' && (!rarity || d.rarity === rarity);
      });
    },

    relicPool(state) {
      return Object.keys(SC.RELICS).filter(id => !SC.State.hasRelic(state, id) && !SC.RELICS[id].starter);
    },

    score(state, won) {
      const rs = state.runStats;
      return state.floor * 10 + rs.enemiesDefeated * 5 + rs.bossesDefeated * 100 + state.player.gold + (won ? 250 : 0);
    }
  };
})();
