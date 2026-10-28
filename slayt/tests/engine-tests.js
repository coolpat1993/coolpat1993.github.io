window.SC = window.SC || {};

(function () {
  const SC = window.SC;
  const C = SC.Combat;
  const tests = [];
  const test = (name, fn) => tests.push({ name, fn });
  const eq = (a, b, msg) => { if (a !== b) throw new Error((msg || 'eq') + ': expected ' + b + ', got ' + a); };
  const ok = (v, msg) => { if (!v) throw new Error(msg || 'assertion failed'); };

  // Fresh combat with a fixed hand for deterministic checks.
  function setup(enemyIds, seed, hand) {
    const state = SC.State.newRun('vanguard', seed || 1);
    state.map = SC.Map.generate(state.seed, 1);
    C.start(state, enemyIds || ['cave_raider']);
    if (hand) {
      const c = state.combat;
      c.draw = c.draw.concat(c.hand);
      c.hand = [];
      hand.forEach(id => {
        const i = c.draw.findIndex(x => x.defId === id);
        c.hand.push(i >= 0 ? c.draw.splice(i, 1)[0] : SC.State.makeCard(state, id));
      });
    }
    return state;
  }
  const hasCard = (state, id) => state.combat.hand.find(c => c.defId === id);

  // A started run with the neutral Soldier's Banner picked.
  function fresh(seed) {
    const s = SC.Flow.newRun('vanguard', seed);
    s.pending.startRelics = ['soldiers_banner'];
    SC.Flow.chooseStartRelic(s, 'soldiers_banner');
    return s;
  }

  test('starting relic choice: three offers, one pick, no starter relics elsewhere', () => {
    const s = SC.Flow.newRun('vanguard', 21);
    eq(s.screen, 'relicpick');
    eq(s.pending.startRelics.length, 3);
    ok(s.pending.startRelics.every(id => SC.RELICS[id].starter));
    ok(!SC.Flow.chooseStartRelic(s, 'last_stand'), 'only offered relics');
    ok(SC.Save.validate(Object.assign(JSON.parse(JSON.stringify(s)), { screen: 'relicpick' })), 'relicpick state saves');
    ok(SC.Flow.chooseStartRelic(s, s.pending.startRelics[0]));
    eq(s.screen, 'map');
    eq(s.relics.length, 1);
    ok(!SC.Flow.chooseStartRelic(s, 'soldiers_banner'), 'cannot pick twice');
    ok(!SC.State.relicPool(s).some(id => SC.RELICS[id].starter), 'starters are not in the loot pool');
  });

  test('new relics: pickup bonuses, strength start, extra draw, shop discount', () => {
    const s = SC.State.newRun('vanguard', 22);
    SC.State.addRelic(s, 'heartwood_charm');
    eq(s.player.maxHp, 90);
    const g0 = s.player.gold;
    SC.State.addRelic(s, 'war_chest');
    eq(s.player.gold, g0 + 60);
    SC.State.addRelic(s, 'soldiers_banner');
    SC.State.addRelic(s, 'war_horn');
    SC.State.addRelic(s, 'travelers_pack');
    C.start(s, ['cave_raider']);
    eq(s.player.statuses.strength, 1);
    eq(s.combat.hand.length, 8, '5 + war horn + traveler pack (2)');
    const t = SC.State.newRun('vanguard', 23);
    const base = SC.Shop.removePrice({ removals: 0 }, t);
    SC.State.addRelic(t, 'haggler_seal');
    eq(SC.Shop.removePrice({ removals: 0 }, t), Math.round(base * 0.8));
  });

  test('combat relics: lantern heals on kill, quiver and rot apply to enemies, field rations heal after a win', () => {
    const s = SC.State.newRun('vanguard', 24);
    ['skull_lantern', 'explosive_quiver', 'tome_of_rot', 'field_rations', 'soul_collector'].forEach(id => SC.State.addRelic(s, id));
    s.player.hp = 50;
    C.start(s, ['plague_moth']);
    const e = s.combat.enemies[0];
    eq(e.statuses.vulnerable, 1);
    eq(e.statuses.poison, 4);
    e.hp = 1;
    C.endTurn(s);
    eq(s.combat.phase, 'won');
    ok(s.player.hp >= 50 + 3 + 6 - 6, 'healed from lantern and rations');
    eq(s.player.maxHp, 81);
  });

  test('new run starts with the correct 10-card deck, 5 card hand and 3 energy', () => {
    const s = setup();
    eq(s.deck.length, 11);
    eq(s.deck.filter(c => c.defId === 'strike').length, 4);
    eq(s.deck.filter(c => c.defId === 'defend').length, 3);
    eq(s.deck.filter(c => c.defId === 'quick_slash').length, 1);
    eq(s.deck.filter(c => c.defId === 'brace').length, 1);
    eq(s.deck.filter(c => c.defId === 'heavy_blow').length, 1);
    eq(s.deck.filter(c => c.defId === 'flex').length, 1);
    eq(s.combat.hand.length, 5);
    eq(s.combat.draw.length, 6);
    eq(s.combat.energy, 3);
    eq(s.player.hp, 80);
  });

  test('block absorbs damage correctly (8 block vs 12 damage leaves 4 damage)', () => {
    const s = setup(['stone_guardian']);
    s.player.hp = 30;
    s.player.block = 8;
    s.combat.enemies[0].move = 'slam';
    C.endTurn(s);
    eq(s.player.hp, 26);
  });

  test('energy is deducted and illegal plays are rejected', () => {
    const s = setup(['cave_raider'], 2, ['strike', 'heavy_blow', 'strike']);
    const strike = hasCard(s, 'strike');
    ok(C.playCard(s, strike.uid).ok);
    eq(s.combat.energy, 2);
    s.combat.energy = 1;
    const hb = hasCard(s, 'heavy_blow');
    const r = C.playCard(s, hb.uid);
    ok(!r.ok, 'heavy blow should be unaffordable');
    eq(s.combat.energy, 1);
    ok(hasCard(s, 'heavy_blow'), 'card stays in hand');
  });

  test('Momentum adds 2 damage only to the first attack of combat', () => {
    const s = setup(['cave_raider'], 3, ['strike', 'strike']);
    const e = s.combat.enemies[0];
    const [a, b] = s.combat.hand;
    C.playCard(s, a.uid);
    eq(e.hp, 42 - 8);
    C.endTurn(s);
    s.combat.hand = [SC.State.makeCard(s, 'strike')];
    C.playCard(s, s.combat.hand[0].uid);
    eq(e.hp, 42 - 8 - 6);
  });

  test('vulnerable and weak modify damage', () => {
    const s = setup(['cave_raider'], 3, ['shield_bash', 'strike']);
    const e = s.combat.enemies[0];
    C.playCard(s, hasCard(s, 'shield_bash').uid);
    eq(e.statuses.vulnerable, 1);
    eq(e.hp, 42 - 6, 'vulnerable is applied after the hit that inflicts it');
    const before = e.hp;
    C.playCard(s, hasCard(s, 'strike').uid);
    eq(e.hp, before - Math.floor(6 * 1.5));
  });

  test('discard is reshuffled into an empty draw pile', () => {
    const s = setup();
    const c = s.combat;
    c.discard = c.discard.concat(c.draw, c.hand);
    c.draw = [];
    c.hand = [];
    C.endTurn(s);
    eq(c.hand.length, 5);
    eq(c.hand.length + c.draw.length + c.discard.length + c.exhaust.length, 11);
  });

  test('exhaust cards leave the draw cycle and powers are removed from the deck cycle', () => {
    const s = setup(['stone_guardian'], 4, ['crushing_force', 'iron_will']);
    s.combat.energy = 5;
    C.playCard(s, hasCard(s, 'crushing_force').uid);
    eq(s.combat.exhaust.length, 1);
    C.playCard(s, hasCard(s, 'iron_will').uid);
    eq(s.combat.discard.length, 0);
    eq(s.player.statuses.metallicize, 3);
  });

  test('enemy dying mid-action does not complete its scheduled action', () => {
    const s = setup(['plague_moth']);
    s.player.statuses.thorns = 50;
    s.combat.enemies[0].move = 'frenzy';
    const hp = s.player.hp;
    s.player.block = 0;
    C.endTurn(s);
    eq(s.combat.phase, 'won');
    eq(s.player.hp, hp - 4, 'only the first hit lands');
  });

  test('no actions after combat ends', () => {
    const s = setup(['plague_moth'], 5, ['strike']);
    s.combat.enemies[0].hp = 1;
    C.playCard(s, hasCard(s, 'strike').uid);
    eq(s.combat.phase, 'won');
    ok(!C.playCard(s, 'x').ok);
    ok(!C.endPlayerTurn(s));
    eq(s.player.block, 0);
  });

  test('player death ends combat as lost', () => {
    const s = setup(['stone_guardian']);
    s.player.hp = 5;
    s.combat.enemies[0].move = 'slam';
    C.endTurn(s);
    eq(s.combat.phase, 'lost');
    eq(s.player.hp, 0);
  });

  test('intent shown matches executed attack damage', () => {
    const s = setup(['cave_raider']);
    const e = s.combat.enemies[0];
    e.move = 'quick_slash';
    const info = C.intentInfo(s, e);
    const hp = s.player.hp;
    s.player.block = 0;
    C.endTurn(s);
    eq(hp - s.player.hp, info.damage);
  });

  test('status timings: weak lasts through the enemy turn then expires', () => {
    const s = setup(['cave_raider'], 6, ['hamstring']);
    const e = s.combat.enemies[0];
    e.move = 'quick_slash';
    C.playCard(s, hasCard(s, 'hamstring').uid);
    eq(e.statuses.weak, 1);
    s.player.block = 0;
    const hp = s.player.hp;
    C.endTurn(s);
    eq(hp - s.player.hp, 6, '8 damage reduced by 25%');
    ok(!e.statuses.weak, 'weak expired');
  });

  test('poison hurts at end of holder turn, regeneration heals at start', () => {
    const s = setup(['cave_raider']);
    const e = s.combat.enemies[0];
    e.statuses.poison = 3;
    C.endTurn(s);
    eq(e.hp, 42 - 3);
    eq(e.statuses.poison, 2);
    s.player.hp = 50;
    s.player.statuses.regeneration = 4;
    C.endTurn(s);
    ok(s.player.hp > 50 || s.player.hp > 40);
  });

  test('stun skips the enemy action', () => {
    const s = setup(['cave_raider']);
    const e = s.combat.enemies[0];
    e.move = 'quick_slash';
    e.statuses.stun = 1;
    const hp = s.player.hp;
    C.endTurn(s);
    eq(s.player.hp, hp);
    ok(!e.statuses.stun);
  });

  test('upgrading modifies the instance, not the definition', () => {
    const s = setup();
    const [a, b] = s.deck.filter(c => c.defId === 'strike');
    SC.State.upgradeCard(s, a.uid);
    eq(SC.cardDef(a).effects[0].value, 9);
    eq(SC.cardDef(b).effects[0].value, 6);
    eq(SC.CARDS.strike.effects[0].value, 6);
    ok(!SC.State.upgradeCard(s, a.uid), 'cannot upgrade twice');
  });

  test('cleave hits all enemies; war cry pays energy per defeated enemy', () => {
    const s = setup(['plague_moth', 'plague_moth'], 7, ['cleave', 'war_cry']);
    s.combat.enemies.forEach(e => { e.hp = 5; });
    s.combat.energy = 5;
    C.playCard(s, hasCard(s, 'cleave').uid);
    eq(s.combat.phase, 'won');
    const t = setup(['plague_moth', 'cave_raider'], 7, ['war_cry']);
    t.combat.enemies[0].hp = 3;
    t.combat.energy = 2;
    C.playCard(t, hasCard(t, 'war_cry').uid, 'e1');
    eq(t.combat.energy, 1);
  });

  test('relics: iron heart, glass engine, echo stone, last stand, lens', () => {
    const s = SC.State.newRun('vanguard', 9);
    SC.State.addRelic(s, 'iron_heart');
    SC.State.addRelic(s, 'glass_engine');
    SC.State.addRelic(s, 'echo_stone');
    SC.State.addRelic(s, 'last_stand');
    SC.State.addRelic(s, 'collectors_lens');
    C.start(s, ['cave_raider']);
    eq(s.player.block, 6);
    eq(s.combat.energy, 4);
    const gold = s.player.gold;
    SC.State.addCard(s, 'strike');
    eq(s.player.gold, gold + 5);
    const d = SC.State.makeCard(s, 'defend');
    s.combat.hand.push(d);
    s.player.block = 0;
    C.playCard(s, d.uid);
    eq(s.player.block, 10, 'first skill triggers twice');
    C.endTurn(s);
    eq(s.combat.energy, 2, 'later turns start with 1 less energy');
    s.player.hp = 3;
    s.player.block = 0;
    s.combat.enemies[0].move = 'heavy_slash';
    C.endTurn(s);
    eq(s.player.hp, 1, 'survives once');
    s.player.block = 0;
    s.combat.enemies[0].move = 'heavy_slash';
    C.endTurn(s);
    eq(s.combat.phase, 'lost', 'second fatal hit kills');
  });

  test('new relics: execution mark, first-skill block, victory gold', () => {
    const marked = setup(['cave_raider'], 31, ['strike']);
    SC.State.addRelic(marked, 'executioners_mark');
    marked.combat.enemies[0].hp = 20;
    C.playCard(marked, hasCard(marked, 'strike').uid);
    eq(marked.combat.enemies[0].hp, 9, 'Momentum and Executioner mark both boost the hit');

    const warded = setup(['cave_raider'], 32, ['defend', 'brace']);
    SC.State.addRelic(warded, 'wardens_oath');
    C.playCard(warded, hasCard(warded, 'defend').uid);
    eq(warded.player.block, 8, 'first Skill gains 3 additional Block');
    C.playCard(warded, hasCard(warded, 'brace').uid);
    eq(warded.player.block, 16, 'second Skill does not repeat the bonus');

    const purse = setup(['cave_raider'], 33, ['strike']);
    SC.State.addRelic(purse, 'pilgrims_purse');
    purse.combat.enemies[0].hp = 8;
    const gold = purse.player.gold;
    C.playCard(purse, hasCard(purse, 'strike').uid);
    eq(purse.combat.phase, 'won');
    eq(purse.player.gold, gold + 12, 'victory grants 12 gold');
  });

  test('blood price cannot be played if it would kill', () => {
    const s = setup(['cave_raider'], 3, ['blood_price']);
    s.player.hp = 3;
    ok(!C.canPlay(s, hasCard(s, 'blood_price')).ok);
  });

  test('card text is generated from effect data', () => {
    const t = SC.describe({ defId: 'strike', upgraded: false });
    ok(/Deal <b class="num">6<\/b> damage/.test(t), t);
    const u = SC.describe({ defId: 'strike', upgraded: true });
    ok(/class="num up">9/.test(u), u);
  });

  test('seeded generation is reproducible', () => {
    const a = SC.Map.generate(123, 1);
    const b = SC.Map.generate(123, 1);
    eq(JSON.stringify(a), JSON.stringify(b));
    ok(JSON.stringify(a) !== JSON.stringify(SC.Map.generate(124, 1)));
    const s1 = setup(['cave_raider'], 55);
    const s2 = setup(['cave_raider'], 55);
    eq(s1.combat.hand.map(c => c.defId).join(), s2.combat.hand.map(c => c.defId).join());
  });

  test('maps are valid for many seeds', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const m = SC.Map.generate(seed, 1);
      const nodes = Object.values(m.nodes);
      const reach = new Set();
      const stack = nodes.filter(n => n.row === 0).map(n => n.id);
      ok(stack.length >= 2, 'start nodes');
      while (stack.length) {
        const id = stack.pop();
        if (reach.has(id)) continue;
        reach.add(id);
        m.nodes[id].next.forEach(x => stack.push(x));
      }
      eq(reach.size, nodes.length, 'every node reachable, seed ' + seed);
      const toBoss = id => id === 'boss' || m.nodes[id].next.some(toBoss);
      nodes.forEach(n => ok(toBoss(n.id), 'node reaches boss, seed ' + seed));
      nodes.forEach(n => { if (n.id !== 'boss') ok(n.next.length > 0 && n.next.every(x => m.nodes[x].row === n.row + 1), 'edges go up one row'); });
      ok(nodes.some(n => n.type === 'shop') && nodes.some(n => n.type === 'elite'), 'has shop and elite');
    }
  });

  test('only reachable nodes can be chosen and encounters block the map', () => {
    const s = fresh(11);
    const av = SC.Map.available(s);
    const other = Object.keys(s.map.nodes).find(id => !av.includes(id));
    ok(!SC.Flow.chooseNode(s, other));
    ok(SC.Flow.chooseNode(s, av[0]));
    eq(SC.Map.available(s).length, 0, 'no moves while node unresolved');
    ok(!SC.Flow.chooseNode(s, av[1] || av[0]));
  });

  test('rewards are granted once', () => {
    const s = fresh(12);
    s.pending = { reward: SC.Rewards.generate(s, 'elite') };
    s.screen = 'reward';
    const r = s.pending.reward;
    eq(r.cards.length, 3);
    const before = s.deck.length;
    ok(SC.Flow.claimCard(s, r.cards[0]));
    ok(!SC.Flow.claimCard(s, r.cards[1]));
    eq(s.deck.length, before + 1);
    ok(SC.Flow.claimRelic(s));
    ok(!SC.Flow.claimRelic(s));
    eq(s.relics.length, 2);
  });

  test('shop deducts gold, blocks unaffordable buys and removal works', () => {
    const s = fresh(13);
    s.pending = { shop: SC.Shop.generate(s) };
    const shop = s.pending.shop;
    s.player.gold = 0;
    ok(!SC.Shop.buy(s, 0).ok);
    s.player.gold = 500;
    const card = shop.items.findIndex(i => i.kind === 'card');
    const price = shop.items[card].price;
    ok(SC.Shop.buy(s, card).ok);
    eq(s.player.gold, 500 - price);
    ok(!SC.Shop.buy(s, card).ok, 'sold out');
    const gold = s.player.gold;
    const uid = s.deck[0].uid;
    ok(SC.Shop.remove(s, uid).ok);
    eq(s.player.gold, gold - 75);
    ok(!s.deck.some(c => c.uid === uid));
    eq(SC.Shop.removePrice(shop), 100);
  });

  test('events apply the chosen option', () => {
    const s = fresh(14);
    s.pending = { event: { id: 'forgotten_shrine', result: null } };
    s.screen = 'event';
    const hp = s.player.hp;
    ok(SC.Flow.eventChoose(s, 0));
    eq(s.player.hp, hp - 8);
    eq(s.relics.length, 2);
    ok(!SC.Flow.eventChoose(s, 1), 'only one choice');
  });

  test('rest heals 30% rounded up or upgrades once', () => {
    const s = fresh(15);
    s.pending = { rest: { used: false } };
    s.player.hp = 10;
    ok(SC.Flow.restHeal(s));
    eq(s.player.hp, 34);
    ok(!SC.Flow.restUpgrade(s, s.deck[0].uid));
  });

  test('save validation accepts a real run mid-combat and rejects corruption', () => {
    const s = fresh(16);
    SC.Flow.chooseNode(s, SC.Map.available(s)[0]);
    const copy = JSON.parse(JSON.stringify(s));
    ok(SC.Save.validate(copy), 'valid combat save');
    const bad = JSON.parse(JSON.stringify(s));
    bad.deck[0].defId = 'nope';
    ok(!SC.Save.validate(bad));
    const bad2 = JSON.parse(JSON.stringify(s));
    delete bad2.combat.hand;
    ok(!SC.Save.validate(bad2));
    // resumed state continues identically
    const a = JSON.parse(JSON.stringify(s));
    C.playCard(s, s.combat.hand[0].uid, 'e1');
    C.playCard(a, a.combat.hand[0].uid, 'e1');
    eq(JSON.stringify(s.combat.enemies), JSON.stringify(a.combat.enemies));
  });

  test('every card definition is well formed', () => {
    const pool = SC.State.cardPool(SC.State.newRun('vanguard', 1));
    ok(pool.length >= 30, 'reward pool size ' + pool.length);
    Object.keys(SC.CARDS).forEach(id => {
      const d = SC.CARDS[id];
      ok(d.name && d.type && d.rarity && d.cost !== undefined, id);
      d.effects.forEach(e => ok(['damage', 'damageFromBlock', 'block', 'doubleBlock', 'draw', 'energy', 'loseHp', 'heal', 'status', 'addCard', 'energyPerDefeated'].includes(e.type), id + ' effect ' + e.type));
      ok(SC.describe({ defId: id, upgraded: false }).length > 0, id);
      ok(SC.describe({ defId: id, upgraded: !!d.upgrade }).length > 0, id);
    });
    Object.keys(SC.ENEMIES).forEach(id => {
      const d = SC.ENEMIES[id];
      d.pattern.forEach(m => ok(d.moves[m], id + ' move ' + m));
      (d.phases || []).forEach(p => p.pattern.forEach(m => ok(d.moves[m], id + ' phase move ' + m)));
    });
  });

  test('enemy phase change updates intent at health threshold', () => {
    const s = setup(['executioner'], 8, ['heavy_blow']);
    const e = s.combat.enemies[0];
    e.hp = 41;
    s.combat.energy = 3;
    C.playCard(s, hasCard(s, 'heavy_blow').uid);
    eq(e.phase, 0);
    eq(e.move, 'frenzy');
    eq(e.statuses.strength, 3);
  });

  test('bot completes 40 full runs without errors or invariant violations', () => {
    let wins = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const s = SC.Bot.playRun(seed);
      ok(s.player.hp >= 0 && s.player.hp <= s.player.maxHp, 'hp bounds seed ' + seed);
      ok(s.player.gold >= 0, 'gold');
      if (s.screen === 'victory') wins++;
      else eq(s.screen, 'defeat');
    }
    SC.botWins = wins;
  });

  SC.runTests = function (print) {
    let pass = 0;
    const failed = [];
    tests.forEach(t => {
      try { t.fn(); pass++; print('PASS ' + t.name); }
      catch (e) { failed.push(t.name); print('FAIL ' + t.name + '\n     ' + e.message + '\n' + (e.stack || '').split('\n').slice(1, 3).join('\n')); }
    });
    print('\n' + pass + '/' + tests.length + ' passed. Bot wins: ' + SC.botWins + '/40');
    return failed.length === 0;
  };
})();
