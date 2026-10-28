window.SC = window.SC || {};

(function () {
  const SC = window.SC;
  const CFG = SC.CONFIG;

  // Run progression: the only place that moves the run between screens.
  const F = (SC.Flow = {});

  F.newRun = function (characterId, seed) {
    if (seed === undefined || seed === null) seed = Math.floor(Math.random() * 2147483647);
    const state = SC.State.newRun(characterId, seed);
    state.map = SC.Map.generate(seed, state.act);
    const starters = Object.keys(SC.RELICS).filter(id => SC.RELICS[id].starter);
    state.pending = { startRelics: SC.RNG.shuffle(state, starters).slice(0, 3) };
    state.screen = 'relicpick';
    SC.Save.updateStats(s => { s.totalRuns++; });
    return state;
  };

  F.chooseStartRelic = function (state, id) {
    if (state.screen !== 'relicpick' || !state.pending || !state.pending.startRelics.includes(id)) return false;
    SC.State.addRelic(state, id);
    state.pending = null;
    state.screen = 'map';
    return true;
  };

  F.node = state => (state.currentNode ? state.map.nodes[state.currentNode] : null);

  F.chooseNode = function (state, id) {
    if (state.screen !== 'map' || !SC.Map.available(state).includes(id)) return false;
    const node = state.map.nodes[id];
    state.currentNode = id;
    state.floor++;
    switch (node.type) {
      case 'combat':
      case 'elite':
      case 'boss': {
        const ids = SC.Enemies.pickEncounter(state, node.type, node.row);
        if (node.type === 'boss') state.runStats.bossSeen = ids[0];
        SC.Combat.start(state, ids, { kind: node.type });
        state.screen = 'combat';
        break;
      }
      case 'event': {
        const eid = SC.Events.pick(state);
        state.seenEvents.push(eid);
        state.pending = { event: { id: eid, result: null } };
        state.screen = 'event';
        break;
      }
      case 'rest':
        state.pending = { rest: { used: false } };
        state.screen = 'rest';
        break;
      case 'shop':
        state.pending = { shop: SC.Shop.generate(state) };
        state.screen = 'shop';
        break;
      case 'treasure':
        state.pending = { reward: SC.Rewards.generate(state, 'treasure') };
        state.screen = 'reward';
        break;
    }
    return true;
  };

  F.completeNode = function (state) {
    const node = F.node(state);
    if (node) node.done = true;
    state.pending = null;
    state.combat = null;
    state.screen = 'map';
  };

  // ---- Combat resolution ----
  F.resolveCombat = function (state) {
    const c = state.combat;
    if (!c) return;
    if (c.phase === 'lost') return F.defeat(state);
    if (c.phase === 'fled') return F.completeNode(state);
    if (c.phase !== 'won') return;
    const node = F.node(state);
    const kind = node.type === 'boss' ? 'boss' : node.type === 'elite' ? 'elite' : 'combat';
    if (kind === 'elite') state.runStats.elitesDefeated++;
    if (kind === 'boss') {
      state.runStats.bossesDefeated++;
      SC.Bus.emit(state, 'bossDefeated');
    }
    state.combat = null;
    state.pending = { reward: SC.Rewards.generate(state, kind) };
    state.screen = 'reward';
  };

  // ---- Rewards (each item can be claimed once) ----
  F.claimCard = function (state, defId) {
    const r = state.pending.reward;
    if (!r.cards || r.cardsDone || !r.cards.includes(defId)) return false;
    r.cardsDone = true;
    r.taken = defId;
    SC.State.addCard(state, defId);
    return true;
  };

  F.skipCards = function (state) {
    const r = state.pending.reward;
    if (r.cardsDone) return false;
    r.cardsDone = true;
    return true;
  };

  F.claimRelic = function (state) {
    const r = state.pending.reward;
    if (!r.relic || r.relicTaken) return false;
    r.relicTaken = true;
    SC.State.addRelic(state, r.relic);
    return true;
  };

  F.claimPotion = function (state) {
    const r = state.pending.reward;
    if (!r.potion || r.potionTaken) return false;
    if (!SC.State.addPotion(state, r.potion)) return false;
    r.potionTaken = true;
    return true;
  };

  F.finishReward = function (state) {
    const node = F.node(state);
    if (node && node.type === 'boss') return F.victory(state);
    F.completeNode(state);
  };

  // ---- Rest ----
  F.restHeal = function (state) {
    const r = state.pending.rest;
    if (r.used) return false;
    r.used = true;
    r.result = 'Healed ' + SC.State.heal(state, Math.ceil(state.player.maxHp * CFG.restHealPct)) + ' HP.';
    return true;
  };

  F.restUpgrade = function (state, uid) {
    const r = state.pending.rest;
    if (r.used || !SC.State.upgradeCard(state, uid)) return false;
    r.used = true;
    r.result = 'Upgraded a card.';
    return true;
  };

  // ---- Events ----
  F.eventChoose = function (state, optionIndex) {
    const ev = state.pending.event;
    if (ev.result) return false;
    const opt = SC.EVENTS[ev.id].options[optionIndex];
    if (!opt || !SC.Events.available(state, opt)) return false;
    const outcome = SC.RNG.weighted(state, opt.outcomes.map(o => [o, o.weight]));
    const lines = outcome.effects.map(e => SC.Events.apply(state, e)).filter(Boolean);
    ev.result = { text: outcome.text, lines };
    return true;
  };

  // ---- End of run ----
  F.defeat = function (state) {
    state.runActive = false;
    state.screen = 'defeat';
    state.combat = null;
    SC.Save.recordRun(state, false);
    SC.Save.clearRun();
  };

  F.victory = function (state) {
    state.runActive = false;
    state.screen = 'victory';
    state.combat = null;
    SC.Save.recordRun(state, true);
    SC.Save.clearRun();
  };

  F.abandon = function (state) {
    if (state && state.runActive) {
      state.runActive = false;
      SC.Save.recordRun(state, false);
    }
    SC.Save.clearRun();
  };
})();
