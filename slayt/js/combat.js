window.SC = window.SC || {};

(function () {
  const SC = window.SC;
  const R = SC.RNG;
  const Bus = SC.Bus;
  const CFG = SC.CONFIG;
  const C = (SC.Combat = {});

  const st = (e, k) => (e.statuses && e.statuses[k]) || 0;
  const isPlayer = (state, e) => e === state.player;
  const idOf = (state, e) => (isPlayer(state, e) ? 'player' : e.uid);
  const log = (state, ev) => { if (state.combat) state.combat.events.push(ev); };
  const alive = state => state.combat.enemies.filter(e => !e.dead);

  function addStatus(state, e, k, n) {
    e.statuses = e.statuses || {};
    const v = (e.statuses[k] || 0) + n;
    if (v === 0 || (v < 0 && k !== 'strength')) delete e.statuses[k];
    else e.statuses[k] = v;
    log(state, { type: 'status', target: idOf(state, e), status: k, value: n });
  }

  function calcDamage(state, src, target, base, ctx) {
    let d = base + st(src, 'strength');
    d = Bus.modify(state, 'damageDealt', d, Object.assign({ source: isPlayer(state, src) ? 'player' : 'enemy', src, target }, ctx || {}));
    if (st(src, 'weak') > 0) d *= 0.75;
    if (st(target, 'vulnerable') > 0) d *= 1.5;
    return Math.max(0, Math.floor(d));
  }
  C.calcDamage = calcDamage;

  C.calcBlock = function (state, amount) {
    return st(state.player, 'frail') > 0 ? Math.floor(amount * 0.75) : amount;
  };

  function gainBlock(state, e, amount, raw) {
    if (!raw && st(e, 'frail') > 0) amount = Math.floor(amount * 0.75);
    if (amount <= 0) return;
    e.block += amount;
    log(state, { type: 'block', target: idOf(state, e), amount });
    if (isPlayer(state, e)) Bus.emit(state, 'blockGained', { amount });
  }

  function healEntity(state, e, n) {
    const before = e.hp;
    e.hp = Math.min(e.maxHp, e.hp + n);
    const got = e.hp - before;
    if (got > 0) log(state, { type: 'heal', target: idOf(state, e), amount: got });
  }

  function endCombat(state, result) {
    const c = state.combat;
    c.phase = result;
    state.player.block = 0;
    state.player.statuses = {};
    Bus.emit(state, 'combatEnded', { result });
  }

  function checkWin(state) {
    const c = state.combat;
    if (c.phase === 'won' || c.phase === 'lost' || c.phase === 'fled') return;
    if (!alive(state).length) endCombat(state, 'won');
  }

  function playerDied(state, source) {
    const c = state.combat;
    if (c.phase === 'lost') return;
    c.killer = source || null;
    state.runStats.killedBy = source || null;
    endCombat(state, 'lost');
  }

  function killEnemy(state, e) {
    if (e.dead) return;
    const c = state.combat;
    e.dead = true;
    e.hp = 0;
    e.block = 0;
    log(state, { type: 'death', target: e.uid });
    c.flags.defeated++;
    state.runStats.enemiesDefeated++;
    Bus.emit(state, 'enemyDefeated', { enemy: e });
    for (const o of alive(state)) {
      const od = SC.ENEMIES[o.id];
      if (od.onAllyDefeated) runActions(state, o, od.onAllyDefeated);
    }
    checkWin(state);
  }

  // Returns damage actually taken by health.
  function hit(state, target, amount, opts) {
    opts = opts || {};
    const isP = isPlayer(state, target);
    amount = Math.max(0, amount);
    const blocked = opts.ignoreBlock ? 0 : Math.min(target.block, amount);
    target.block -= blocked;
    let loss = amount - blocked;
    if (isP) loss = Bus.modify(state, 'hpLoss', loss, { target });
    target.hp = Math.max(0, target.hp - loss);
    log(state, { type: 'damage', target: idOf(state, target), amount: loss, blocked });
    if (isP) {
      if (loss > 0) Bus.emit(state, 'playerDamaged', { amount: loss });
      if (target.hp <= 0) playerDied(state, opts.source);
    } else if (target.hp <= 0) {
      killEnemy(state, target);
    } else if (loss > 0) {
      maybePhase(state, target);
    }
    return loss;
  }

  // ---------- Enemy intent ----------
  function phaseIndex(def, e) {
    let ph = -1;
    (def.phases || []).forEach((p, i) => { if (e.hp / e.maxHp <= p.below) ph = i; });
    return ph;
  }

  function chooseIntent(state, e) {
    const def = SC.ENEMIES[e.id];
    const ph = phaseIndex(def, e);
    if (ph !== e.phase) {
      e.phase = ph;
      e.patternIdx = 0;
      if (ph >= 0 && def.phases[ph].enter) runActions(state, e, def.phases[ph].enter);
    }
    const pat = ph >= 0 ? def.phases[ph].pattern : def.pattern;
    e.move = pat[e.patternIdx % pat.length];
  }

  function maybePhase(state, e) {
    const def = SC.ENEMIES[e.id];
    if (def.phases && phaseIndex(def, e) !== e.phase) chooseIntent(state, e);
  }

  C.intentInfo = function (state, e) {
    const move = SC.ENEMIES[e.id].moves[e.move];
    if (!move) return { kind: 'special', name: '' };
    if (st(e, 'stun') > 0) return { kind: 'stun', name: 'Stunned' };
    const a = move.actions.find(x => x.type === 'attack');
    if (a) return { kind: 'attack', name: move.name, damage: calcDamage(state, e, state.player, a.value), hits: a.hits || 1 };
    const has = t => move.actions.some(x => x.type === t);
    if (has('charge')) return { kind: 'charge', name: move.name };
    if (move.actions.some(x => x.type === 'status' && x.to === 'player')) return { kind: 'debuff', name: move.name };
    if (has('block')) return { kind: 'defend', name: move.name };
    if (move.actions.some(x => x.type === 'status')) return { kind: 'buff', name: move.name };
    return { kind: 'special', name: move.name };
  };

  // Resolves non-attack actions (and phase entry effects).
  function runActions(state, e, actions) {
    const c = state.combat;
    for (const a of actions) {
      if (e.dead || c.phase === 'lost' || c.phase === 'won') return;
      if (a.type === 'block') {
        const targets = a.to === 'allEnemies' ? alive(state) : [e];
        targets.forEach(t => gainBlock(state, t, a.value, true));
      } else if (a.type === 'status') {
        const targets = a.to === 'player' ? [state.player] : a.to === 'allEnemies' ? alive(state) : [e];
        targets.forEach(t => addStatus(state, t, a.status, a.value));
      } else if (a.type === 'addCard') {
        for (let i = 0; i < (a.count || 1); i++) insertCard(state, SC.State.makeCard(state, a.cardId, { temp: true }), a.to);
      }
    }
  }

  function runMove(state, e) {
    const c = state.combat;
    const move = SC.ENEMIES[e.id].moves[e.move];
    const p = state.player;
    for (const a of move.actions) {
      if (e.dead || c.phase === 'lost' || c.phase === 'won') return;
      if (a.type === 'attack') {
        for (let h = 0; h < (a.hits || 1); h++) {
          if (e.dead || c.phase === 'lost') return;
          hit(state, p, calcDamage(state, e, p, a.value), { source: SC.ENEMIES[e.id].name });
          const th = st(p, 'thorns');
          if (th > 0 && c.phase !== 'lost') hit(state, e, th, { source: 'thorns' });
        }
      } else {
        runActions(state, e, [a]);
      }
    }
  }

  function decay(state, e) {
    Object.keys(e.statuses || {}).forEach(k => {
      if (SC.STATUSES[k] && SC.STATUSES[k].decay === 'turn') addStatus(state, e, k, -1);
    });
  }

  function insertCard(state, card, to) {
    const c = state.combat;
    if (!card) return;
    if (to === 'draw') c.draw.splice(R.int(state, c.draw.length + 1), 0, card);
    else if (to === 'hand' && c.hand.length < CFG.maxHand) c.hand.push(card);
    else c.discard.push(card);
  }

  function enemyTurn(state, e) {
    const c = state.combat;
    const move = SC.ENEMIES[e.id].moves[e.move];
    log(state, { type: 'enemyAct', target: e.uid, attack: move.actions.some(a => a.type === 'attack') });
    if (!st(e, 'barricade')) e.block = 0;
    if (st(e, 'regeneration')) { healEntity(state, e, st(e, 'regeneration')); addStatus(state, e, 'regeneration', -1); }
    if (st(e, 'ritual')) addStatus(state, e, 'strength', st(e, 'ritual'));
    if (st(e, 'burn')) {
      const b = st(e, 'burn');
      hit(state, e, b);
      if (e.dead) return;
      addStatus(state, e, 'burn', -Math.ceil(b / 2));
    }
    if (st(e, 'stun') > 0) {
      addStatus(state, e, 'stun', -1);
      log(state, { type: 'stunned', target: e.uid });
      decay(state, e);
      return;
    }
    runMove(state, e);
    if (e.dead || c.phase !== 'enemy') return;
    if (st(e, 'poison')) {
      hit(state, e, st(e, 'poison'), { ignoreBlock: true });
      if (e.dead) return;
      addStatus(state, e, 'poison', -1);
    }
    decay(state, e);
    e.patternIdx++;
    chooseIntent(state, e);
  }

  // ---------- Card piles ----------
  function drawCards(state, n) {
    const c = state.combat;
    for (let i = 0; i < n; i++) {
      if (!c.draw.length) {
        if (!c.discard.length) break;
        c.draw = R.shuffle(state, c.discard);
        c.discard = [];
        log(state, { type: 'reshuffle' });
      }
      const card = c.draw.pop();
      if (c.hand.length >= CFG.maxHand) c.discard.push(card);
      else { c.hand.push(card); log(state, { type: 'draw', uid: card.uid }); }
    }
  }

  // ---------- Effects ----------
  function doDamage(state, e, ctx, base) {
    const hits = e.hits || 1;
    const mode = e.target || 'single';
    for (let h = 0; h < hits; h++) {
      let targets;
      if (mode === 'all') targets = alive(state);
      else if (mode === 'random') { const a = alive(state); targets = a.length ? [R.pick(state, a)] : []; }
      else targets = ctx.target && !ctx.target.dead ? [ctx.target] : [];
      if (!targets.length) return;
      for (const t of targets) {
        if (t.dead) continue;
        let b = base;
        if (e.bonusLow && t.hp / t.maxHp < 0.5) b += e.bonusLow;
        const d = calcDamage(state, state.player, t, b, { isAttack: !!ctx.isAttack, firstHit: h === 0, card: ctx.card });
        hit(state, t, d);
        if (ctx.isAttack) Bus.emit(state, 'attackDealtDamage', { target: t, amount: d });
      }
    }
  }

  const RANDOM_BUFFS = [['strength', 2], ['regeneration', 3], ['thorns', 3], ['metallicize', 3]];

  function runEffects(state, effects, ctx) {
    const c = state.combat;
    const p = state.player;
    for (const e of effects) {
      if (c.phase === 'lost' || c.phase === 'fled') return;
      switch (e.type) {
        case 'damage': doDamage(state, e, ctx, e.value); break;
        case 'damageFromBlock': doDamage(state, Object.assign({}, e, { hits: 1 }), ctx, p.block); break;
        case 'block': gainBlock(state, p, e.value); break;
        case 'doubleBlock': gainBlock(state, p, p.block, true); break;
        case 'draw': drawCards(state, e.value); break;
        case 'energy': c.energy += e.value; break;
        case 'loseHp': hit(state, p, e.value, { ignoreBlock: true, source: ctx.card ? SC.cardDef(ctx.card).name : 'Self-harm' }); break;
        case 'heal': healEntity(state, p, e.value); break;
        case 'healPct': healEntity(state, p, Math.ceil(p.maxHp * e.value / 100)); break;
        case 'energyPerDefeated': c.energy += e.value * c.flags.defeated; break;
        case 'status': {
          const to = e.to || 'target';
          const targets = to === 'self' ? [p] : to === 'all' ? alive(state) : [ctx.target];
          targets.forEach(t => { if (t && !t.dead) addStatus(state, t, e.status, e.value); });
          break;
        }
        case 'addCard': {
          const id = e.copySelf ? ctx.card.defId : e.cardId;
          const upg = e.copySelf ? ctx.card.upgraded : false;
          for (let i = 0; i < (e.count || 1); i++) insertCard(state, SC.State.makeCard(state, id, { upgraded: upg, temp: true }), e.to);
          break;
        }
        case 'randomBuff': {
          const b = R.pick(state, RANDOM_BUFFS);
          addStatus(state, p, b[0], b[1]);
          break;
        }
        case 'flee': endCombat(state, 'fled'); return;
        default: break;
      }
    }
  }

  // ---------- Turn flow ----------
  function startPlayerTurn(state) {
    const c = state.combat;
    const p = state.player;
    c.turn++;
    c.phase = 'player';
    c.flags.attacksPlayed = 0;
    c.flags.skillsPlayed = 0;
    c.flags.defeated = 0;
    if (c.turn > 1 && !st(p, 'barricade')) p.block = 0;
    if (st(p, 'regeneration')) { healEntity(state, p, st(p, 'regeneration')); addStatus(state, p, 'regeneration', -1); }
    if (st(p, 'ritual')) addStatus(state, p, 'strength', st(p, 'ritual'));
    if (st(p, 'burn')) {
      const b = st(p, 'burn');
      hit(state, p, b, { source: 'Burn' });
      if (c.phase === 'lost') return;
      addStatus(state, p, 'burn', -Math.ceil(b / 2));
    }
    c.energy = Math.max(0, Bus.modify(state, 'turnEnergy', c.maxEnergy, { turn: c.turn }));
    Bus.emit(state, 'playerTurnStarted', { turn: c.turn });
    drawCards(state, Math.max(0, Bus.modify(state, 'handSize', CFG.handSize, { turn: c.turn }) - c.hand.length));
  }

  C.start = function (state, enemyIds, opts) {
    opts = opts || {};
    const p = state.player;
    p.block = 0;
    p.statuses = {};
    const kind = opts.kind || 'combat';
    const c = (state.combat = {
      turn: 0, phase: 'player', kind,
      maxEnergy: SC.CHARACTERS[p.characterId].energy, energy: 0,
      draw: R.shuffle(state, state.deck), hand: [], discard: [], exhaust: [],
      enemies: enemyIds.map((id, i) => SC.Enemies.create(id, i)),
      enemyQueue: [],
      flags: { attacksPlayed: 0, skillsPlayed: 0, defeated: 0, attackCardsCombat: 0 },
      events: [], killer: null, canFlee: kind === 'combat'
    });
    c.enemies.forEach(e => chooseIntent(state, e));
    Bus.emit(state, 'combatStarted');
    startPlayerTurn(state);
    return c;
  };

  C.canPlay = function (state, card) {
    const c = state.combat;
    if (!c || c.phase !== 'player') return { ok: false, reason: 'Not your turn' };
    const d = SC.cardDef(card);
    if (d.unplayable) return { ok: false, reason: 'Unplayable' };
    if (c.energy < d.cost) return { ok: false, reason: 'Not enough energy' };
    const hpCost = d.effects.filter(e => e.type === 'loseHp').reduce((n, e) => n + e.value, 0);
    if (hpCost && state.player.hp <= hpCost) return { ok: false, reason: 'Not enough health' };
    return { ok: true };
  };

  C.playCard = function (state, uid, targetUid) {
    const c = state.combat;
    if (!c || c.phase !== 'player') return { ok: false, reason: 'Not your turn' };
    const idx = c.hand.findIndex(x => x.uid === uid);
    if (idx < 0) return { ok: false, reason: 'Card not in hand' };
    const card = c.hand[idx];
    const can = C.canPlay(state, card);
    if (!can.ok) return can;
    const d = SC.cardDef(card);
    let target = null;
    if (SC.needsTarget(d)) {
      const al = alive(state);
      target = targetUid ? al.find(e => e.uid === targetUid) : al.length === 1 ? al[0] : null;
      if (!target) return { ok: false, reason: 'Choose a target', needsTarget: true };
    }
    c.energy -= d.cost;
    c.hand.splice(idx, 1);
    log(state, { type: 'play', uid: card.uid, target: target ? target.uid : null });

    const ctx = { card, def: d, target, isAttack: d.type === 'attack' };
    if (ctx.isAttack) log(state, { type: 'playerAttack', target: target ? target.uid : null });
    if (d.type === 'power' || d.effects.some(e => e.type === 'status' && e.to === 'self')) log(state, { type: 'playerBuff' });
    const reps = d.type === 'skill' ? Bus.modify(state, 'skillRepeats', 1, { firstSkill: c.flags.skillsPlayed === 0 }) : 1;
    for (let i = 0; i < reps; i++) runEffects(state, d.effects, ctx);

    if (d.type === 'attack') { c.flags.attacksPlayed++; c.flags.attackCardsCombat++; }
    if (d.type === 'skill') c.flags.skillsPlayed++;
    Bus.emit(state, 'cardPlayed', { card, def: d });

    if (d.type === 'power') { /* stays in effect via status, leaves the deck cycle */ }
    else if (d.exhaust) c.exhaust.push(card);
    else c.discard.push(card);
    return { ok: true };
  };

  // Phase 1 of the end of turn: discard, end-of-turn effects. Enemies then act via stepEnemy.
  C.endPlayerTurn = function (state) {
    const c = state.combat;
    const p = state.player;
    if (!c || c.phase !== 'player') return false;
    const hand = c.hand;
    c.hand = [];
    for (const card of hand) {
      const d = SC.cardDef(card);
      if (d.endTurnInHand) runEffects(state, d.endTurnInHand, { card });
      if (d.ethereal) c.exhaust.push(card); else c.discard.push(card);
    }
    if (c.phase === 'lost') return true;
    Bus.emit(state, 'playerTurnEnded', {});
    if (st(p, 'metallicize')) gainBlock(state, p, st(p, 'metallicize'), true);
    if (st(p, 'poison')) {
      hit(state, p, st(p, 'poison'), { ignoreBlock: true, source: 'Poison' });
      if (c.phase === 'lost') return true;
      addStatus(state, p, 'poison', -1);
    }
    decay(state, p);
    c.phase = 'enemy';
    c.enemyQueue = c.enemies.filter(e => !e.dead).map(e => e.uid);
    return true;
  };

  C.stepEnemy = function (state) {
    const c = state.combat;
    if (!c || c.phase !== 'enemy') return false;
    const uid = c.enemyQueue.shift();
    const e = uid ? c.enemies.find(x => x.uid === uid) : null;
    if (e && !e.dead) enemyTurn(state, e);
    if (c.phase === 'enemy' && !c.enemyQueue.length) startPlayerTurn(state);
    return true;
  };

  // Convenience for tests and bots: resolves the whole enemy phase at once.
  C.endTurn = function (state) {
    if (!C.endPlayerTurn(state)) return false;
    while (state.combat.phase === 'enemy') C.stepEnemy(state);
    return true;
  };

  C.usePotion = function (state, slot) {
    const c = state.combat;
    if (!c || c.phase !== 'player') return { ok: false, reason: 'Not your turn' };
    const id = state.potions[slot];
    if (!id) return { ok: false, reason: 'Empty slot' };
    const pd = SC.POTIONS[id];
    if (pd.flee && !c.canFlee) return { ok: false, reason: 'Cannot flee this fight' };
    state.potions[slot] = null;
    runEffects(state, pd.effects, {});
    return { ok: true };
  };

  C.aliveEnemies = alive;
  C.status = st;
})();
