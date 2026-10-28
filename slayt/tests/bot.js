window.SC = window.SC || {};

// Headless player used by tests to prove a full run can be played without UI.
(function () {
  const SC = window.SC;
  const C = SC.Combat;

  function targetOf(state) {
    const al = C.aliveEnemies(state).slice().sort((a, b) => a.hp - b.hp);
    return al[0] ? al[0].uid : undefined;
  }

  function incoming(state) {
    return C.aliveEnemies(state).reduce((n, e) => {
      const i = C.intentInfo(state, e);
      return n + (i.kind === 'attack' ? i.damage * i.hits : 0);
    }, 0);
  }

  function pickCard(state) {
    const c = state.combat;
    const playable = c.hand.filter(card => C.canPlay(state, card).ok);
    if (!playable.length) return null;
    const need = incoming(state) - state.player.block;
    const rank = card => {
      const d = SC.cardDef(card);
      if (d.type === 'power') return 0;
      const blocks = d.effects.some(e => e.type === 'block');
      if (blocks && need > 0) return 1;
      if (d.type === 'attack') return 2;
      if (!blocks) return 3;
      return 4;
    };
    return playable.sort((a, b) => rank(a) - rank(b) || SC.cardDef(b).cost - SC.cardDef(a).cost)[0];
  }

  function playCombat(state) {
    let guard = 0;
    while (state.combat && state.combat.phase === 'player' && guard++ < 60) {
      const hpPct = state.player.hp / state.player.maxHp;
      const heal = state.potions.indexOf('healing_potion');
      if (hpPct < 0.4 && heal >= 0) C.usePotion(state, heal);
      const card = pickCard(state);
      if (!card) break;
      const r = C.playCard(state, card.uid, targetOf(state));
      if (!r.ok) break;
    }
    if (state.combat && state.combat.phase === 'player') C.endTurn(state);
    if (state.combat && ['won', 'lost', 'fled'].includes(state.combat.phase)) SC.Flow.resolveCombat(state);
  }

  const RARITY = { legendary: 4, rare: 3, uncommon: 2, common: 1 };

  function step(state) {
    const F = SC.Flow;
    switch (state.screen) {
      case 'map': {
        const av = SC.Map.available(state).map(id => state.map.nodes[id]);
        const hpPct = state.player.hp / state.player.maxHp;
        const pref = { rest: hpPct < 0.6 ? 6 : 2, shop: 3, event: 4, treasure: 7, combat: 5, elite: hpPct > 0.7 ? 5 : 0, boss: 9 };
        av.sort((a, b) => pref[b.type] - pref[a.type]);
        F.chooseNode(state, av[0].id);
        break;
      }
      case 'combat': playCombat(state); break;
      case 'reward': {
        const r = state.pending.reward;
        if (r.relic) F.claimRelic(state);
        if (r.potion) F.claimPotion(state);
        if (r.cards) {
          const best = r.cards.slice().sort((a, b) => RARITY[SC.CARDS[b].rarity] - RARITY[SC.CARDS[a].rarity])[0];
          if (state.deck.length < 22) F.claimCard(state, best); else F.skipCards(state);
        }
        F.finishReward(state);
        break;
      }
      case 'shop': {
        const shop = state.pending.shop;
        shop.items.forEach((it, i) => { if (it.kind !== 'potion' && state.player.gold >= it.price + 20) SC.Shop.buy(state, i); });
        F.completeNode(state);
        break;
      }
      case 'rest': {
        if (state.player.hp / state.player.maxHp < 0.65) F.restHeal(state);
        else {
          const up = state.deck.find(SC.State.canUpgrade);
          if (up) F.restUpgrade(state, up.uid); else F.restHeal(state);
        }
        F.completeNode(state);
        break;
      }
      case 'event': {
        const ev = SC.EVENTS[state.pending.event.id];
        const i = ev.options.findIndex(o => SC.Events.available(state, o));
        F.eventChoose(state, i);
        F.completeNode(state);
        break;
      }
      default: break;
    }
  }

  SC.Bot = {
    playRun(seed) {
      const state = SC.Flow.newRun('vanguard', seed);
      SC.Flow.chooseStartRelic(state, state.pending.startRelics[0]);
      let guard = 0;
      while (state.runActive && guard++ < 4000) step(state);
      if (state.runActive) throw new Error('Bot did not finish run for seed ' + seed);
      return state;
    }
  };
})();
