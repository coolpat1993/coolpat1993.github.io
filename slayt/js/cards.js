window.SC = window.SC || {};

(function () {
  const SC = window.SC;

  // decay: 'turn' stacks drop by 1 at the end of the holder's turn.
  SC.STATUSES = {
    strength:    { name: 'Strength',    icon: 'up',      kind: 'buff',   desc: 'Attacks deal N more damage.' },
    weak:        { name: 'Weak',        icon: 'down',    kind: 'debuff', decay: 'turn', desc: 'Attacks deal 25% less damage. Lasts N turns.' },
    vulnerable:  { name: 'Vulnerable',  icon: 'target',  kind: 'debuff', decay: 'turn', desc: 'Takes 50% more attack damage. Lasts N turns.' },
    frail:       { name: 'Frail',       icon: 'crack',   kind: 'debuff', decay: 'turn', desc: 'Gains 25% less Block. Lasts N turns.' },
    poison:      { name: 'Poison',      icon: 'drop',    kind: 'debuff', desc: 'At end of turn, lose N health (ignores Block), then N drops by 1.' },
    regeneration:{ name: 'Regeneration',icon: 'plus',    kind: 'buff',   desc: 'At start of turn, heal N, then N drops by 1.' },
    burn:        { name: 'Burn',        icon: 'flame',   kind: 'debuff', desc: 'At start of turn, take N damage, then N is halved.' },
    stun:        { name: 'Stun',        icon: 'bolt',    kind: 'debuff', desc: 'Skips its next action.' },
    metallicize: { name: 'Metallicize', icon: 'shield',  kind: 'buff',   desc: 'At end of your turn, gain N Block.' },
    thorns:      { name: 'Thorns',      icon: 'spike',   kind: 'buff',   desc: 'When attacked, deal N damage back to the attacker.' },
    ritual:      { name: 'Ritual',      icon: 'crown',   kind: 'buff',   desc: 'At start of turn, gain N Strength.' },
    barricade:   { name: 'Barricade',   icon: 'wall',    kind: 'buff',   desc: 'Block is not removed at the start of your turn.' }
  };

  SC.CHARACTERS = {
    vanguard: {
      id: 'vanguard',
      name: 'The Vanguard',
      role: 'Balanced fighter',
      difficulty: 'Easy',
      hp: 80,
      energy: 3,
      passive: 'momentum',
      passiveName: 'Momentum',
      passiveText: 'The first Attack card played each combat deals 2 additional damage.',
      art: 'barbarian.png',
      starterDeck: { strike: 3, rallying_strike: 1, defend: 3, heavy_blow: 1, flex: 1, quick_slash: 1, brace: 1 }
    }
  };

  // ---- effect builders ----
  const dmg = (value, o) => Object.assign({ type: 'damage', value }, o || {});
  const blk = value => ({ type: 'block', value });
  const draw = value => ({ type: 'draw', value });
  const energy = value => ({ type: 'energy', value });
  const lose = value => ({ type: 'loseHp', value });
  const heal = value => ({ type: 'heal', value });
  const status = (s, value, to) => ({ type: 'status', status: s, value, to: to || 'target' });
  const me = (s, value) => status(s, value, 'self');

  SC.CARDS = {};
  function def(c) {
    c.character = c.character || 'vanguard';
    c.effects = c.effects || [];
    SC.CARDS[c.id] = c;
    c.target = SC.needsTarget(c) ? 'single_enemy' : (c.effects.some(e => (e.type === 'damage' && e.target === 'all') || (e.type === 'status' && e.to === 'all')) ? 'all_enemies' : 'self');
  }

  SC.needsTarget = function (d) {
    return d.effects.some(e =>
      (e.type === 'damage' && (e.target || 'single') === 'single') ||
      e.type === 'damageFromBlock' ||
      (e.type === 'status' && e.to === 'target'));
  };

  // Resolve upgrade overrides for a card instance.
  SC.cardDef = function (card) {
    const base = SC.CARDS[card.defId];
    if (!card.upgraded || !base.upgrade) return base;
    const d = Object.assign({}, base, base.upgrade);
    d.target = SC.needsTarget(d) ? 'single_enemy' : base.target;
    return d;
  };

  // ---------- Basic ----------
  def({ id: 'strike', name: 'Strike', type: 'attack', rarity: 'basic', cost: 1, image: 'iron_sword.png', tags: ['strike'],
    effects: [dmg(6)], upgrade: { effects: [dmg(9)] } });
  def({ id: 'rallying_strike', name: 'Rallying Strike', type: 'attack', rarity: 'basic', cost: 1, image: 'hookshot.png',
    effects: [dmg(5), draw(1)] });
  def({ id: 'defend', name: 'Defend', type: 'skill', rarity: 'basic', cost: 1, image: 'chainmail.png',
    effects: [blk(5)], upgrade: { effects: [blk(8)] } });
  def({ id: 'heavy_blow', name: 'Heavy Blow', type: 'attack', rarity: 'basic', cost: 2, image: 'brutal_axe.png',
    effects: [dmg(12)], upgrade: { effects: [dmg(18)] } });
  def({ id: 'flex', name: 'Flex', type: 'skill', rarity: 'basic', cost: 1, image: 'banner_of_the_brave.png',
    effects: [me('strength', 1)], upgrade: { effects: [me('strength', 2)] } });

  // ---------- Common ----------
  def({ id: 'cleave', name: 'Cleave', type: 'attack', rarity: 'common', cost: 1, image: 'polearm.png',
    effects: [dmg(5, { target: 'all' })], upgrade: { effects: [dmg(8, { target: 'all' })] } });
  def({ id: 'riposte', name: 'Riposte', type: 'attack', rarity: 'common', cost: 1, image: 'quickblade.png',
    effects: [blk(4), dmg(4)], upgrade: { effects: [blk(6), dmg(6)] } });
  def({ id: 'twin_strike', name: 'Twin Strike', type: 'attack', rarity: 'common', cost: 1, image: 'twin_daggers.png',
    effects: [dmg(5, { hits: 2 })], upgrade: { effects: [dmg(7, { hits: 2 })] } });
  def({ id: 'shield_bash', name: 'Shield Bash', type: 'attack', rarity: 'common', cost: 1, image: 'gladiators_chains.png',
    effects: [dmg(4), status('vulnerable', 1)], upgrade: { effects: [dmg(6), status('vulnerable', 2)] } });
  def({ id: 'brace', name: 'Brace', type: 'skill', rarity: 'common', cost: 1, image: 'shield_wall.png',
    effects: [blk(8)], upgrade: { effects: [blk(11)] } });
  def({ id: 'pommel_strike', name: 'Pommel Strike', type: 'attack', rarity: 'common', cost: 1, image: 'hookshot.png',
    effects: [dmg(8), draw(1)], upgrade: { effects: [dmg(10), draw(2)] } });
  def({ id: 'intimidate', name: 'Intimidate', type: 'skill', rarity: 'common', cost: 0, image: 'mark_prey.png', exhaust: true,
    effects: [status('weak', 1, 'all')], upgrade: { effects: [status('weak', 2, 'all')] } });
  def({ id: 'quick_slash', name: 'Quick Slash', type: 'attack', rarity: 'common', cost: 0, image: 'claw_gauntlets.png',
    effects: [dmg(4)], upgrade: { effects: [dmg(6)] } });
  def({ id: 'hamstring', name: 'Hamstring', type: 'attack', rarity: 'common', cost: 1, image: 'frostbrand_axe.png',
    effects: [dmg(5), status('weak', 1)], upgrade: { effects: [dmg(7), status('weak', 2)] } });
  def({ id: 'body_slam', name: 'Body Slam', type: 'attack', rarity: 'common', cost: 1, image: 'warhammer_of_wrath.png',
    effects: [{ type: 'damageFromBlock' }], upgrade: { cost: 0 } });
  def({ id: 'anger', name: 'Anger', type: 'attack', rarity: 'common', cost: 0, image: 'battlefield_berserker.png',
    effects: [dmg(6), { type: 'addCard', copySelf: true, to: 'discard' }], upgrade: { effects: [dmg(8), { type: 'addCard', copySelf: true, to: 'discard' }] } });
  def({ id: 'regroup', name: 'Regroup', type: 'skill', rarity: 'common', cost: 1, image: 'tracking.png',
    effects: [draw(2)], upgrade: { effects: [draw(3)] } });

  // ---------- Uncommon ----------
  def({ id: 'blood_price', name: 'Blood Price', type: 'skill', rarity: 'uncommon', cost: 0, image: 'dark_pact.png',
    effects: [lose(3), energy(1)], upgrade: { effects: [lose(2), energy(1)] } });
  def({ id: 'crushing_force', name: 'Crushing Force', type: 'attack', rarity: 'uncommon', cost: 2, image: 'crushing_blow.png', exhaust: true,
    effects: [dmg(16)], upgrade: { effects: [dmg(22)] } });
  def({ id: 'rage', name: 'Rage', type: 'skill', rarity: 'uncommon', cost: 1, image: 'warpath.png', exhaust: true,
    effects: [me('strength', 2)], upgrade: { effects: [me('strength', 3)] } });
  def({ id: 'whirlwind', name: 'Whirlwind', type: 'attack', rarity: 'uncommon', cost: 2, image: 'overwhelm.png',
    effects: [dmg(5, { target: 'all', hits: 2 })], upgrade: { effects: [dmg(8, { target: 'all', hits: 2 })] } });
  def({ id: 'entrench', name: 'Entrench', type: 'skill', rarity: 'uncommon', cost: 2, image: 'unbreakable_will.png',
    effects: [{ type: 'doubleBlock' }], upgrade: { cost: 1 } });
  def({ id: 'reckless_charge', name: 'Reckless Charge', type: 'attack', rarity: 'uncommon', cost: 0, image: 'horned_charger.png',
    effects: [dmg(7), { type: 'addCard', cardId: 'dazed', to: 'draw' }],
    upgrade: { effects: [dmg(10), { type: 'addCard', cardId: 'dazed', to: 'draw' }] } });
  def({ id: 'feint', name: 'Feint', type: 'skill', rarity: 'uncommon', cost: 1, image: 'spyglass.png',
    effects: [blk(5), status('weak', 2)], upgrade: { effects: [blk(8), status('weak', 3)] } });
  def({ id: 'execute', name: 'Execute', type: 'attack', rarity: 'uncommon', cost: 1, image: 'execute.png',
    effects: [dmg(8, { bonusLow: 10 })], upgrade: { effects: [dmg(10, { bonusLow: 14 })] } });
  def({ id: 'spiked_armor', name: 'Spiked Armor', type: 'power', rarity: 'uncommon', cost: 1, image: 'spiked_shield.png',
    effects: [me('thorns', 3)], upgrade: { effects: [me('thorns', 5)] } });
  def({ id: 'iron_will', name: 'Iron Will', type: 'power', rarity: 'uncommon', cost: 1, image: 'juggernaut_helm.png',
    effects: [me('metallicize', 3)], upgrade: { effects: [me('metallicize', 4)] } });
  def({ id: 'bloodthirst', name: 'Bloodthirst', type: 'attack', rarity: 'uncommon', cost: 1, image: 'bloodsteel_guantlets.png',
    effects: [dmg(7), heal(3)], upgrade: { effects: [dmg(9), heal(4)] } });
  def({ id: 'concussive_blow', name: 'Concussive Blow', type: 'attack', rarity: 'uncommon', cost: 2, image: 'hunters_spearhead.png', exhaust: true,
    effects: [dmg(10), status('stun', 1)], upgrade: { effects: [dmg(14), status('stun', 1)] } });

  // ---------- Rare ----------
  def({ id: 'second_wind', name: 'Second Wind', type: 'skill', rarity: 'rare', cost: 1, image: 'second_wind.png',
    effects: [blk(10), draw(1)], upgrade: { effects: [blk(13), draw(1)] } });
  def({ id: 'war_cry', name: 'War Cry', type: 'attack', rarity: 'rare', cost: 2, image: 'banner_of_command.png',
    effects: [dmg(8), { type: 'energyPerDefeated', value: 1 }], upgrade: { effects: [dmg(12), { type: 'energyPerDefeated', value: 1 }] } });
  def({ id: 'warlords_oath', name: "Warlord's Oath", type: 'power', rarity: 'rare', cost: 2, image: 'war_banner.png',
    effects: [me('ritual', 2)], upgrade: { cost: 1 } });
  def({ id: 'bulwark', name: 'Bulwark', type: 'power', rarity: 'rare', cost: 3, image: 'warlords_guard.png',
    effects: [me('barricade', 1)], upgrade: { cost: 2 } });
  def({ id: 'shockwave', name: 'Shockwave', type: 'skill', rarity: 'rare', cost: 2, image: 'storm_caller.png', exhaust: true,
    effects: [status('weak', 2, 'all'), status('vulnerable', 2, 'all')],
    upgrade: { effects: [status('weak', 3, 'all'), status('vulnerable', 3, 'all')] } });
  def({ id: 'offering', name: 'Offering', type: 'skill', rarity: 'rare', cost: 0, image: 'blood_rush.png', exhaust: true,
    effects: [lose(6), energy(2), draw(3)], upgrade: { effects: [lose(6), energy(2), draw(5)] } });

  // ---------- Legendary ----------
  def({ id: 'crown_breaker', name: 'Crown Breaker', type: 'attack', rarity: 'legendary', cost: 3, image: 'scythe_of_sorrow.png', exhaust: true,
    effects: [dmg(40)], upgrade: { effects: [dmg(52)] } });

  // ---------- Status / Curse (never in reward pools) ----------
  def({ id: 'dazed', name: 'Dazed', type: 'status', rarity: 'status', cost: 0, character: 'none', unplayable: true, ethereal: true,
    text: 'Unplayable. <i>Ethereal.</i>' });
  def({ id: 'wound', name: 'Wound', type: 'status', rarity: 'status', cost: 0, character: 'none', unplayable: true,
    text: 'Unplayable.' });
  def({ id: 'regret', name: 'Regret', type: 'curse', rarity: 'status', cost: 0, character: 'none', unplayable: true,
    endTurnInHand: [lose(1)], text: 'Unplayable. If this is in your hand at end of turn, lose 1 HP.' });

  // ---------- Potions ----------
  SC.POTIONS = {
    healing_potion: { id: 'healing_potion', name: 'Healing Potion', color: '#e0524d', effects: [{ type: 'healPct', value: 25 }], desc: 'Restore 25% of maximum health.' },
    strength_potion: { id: 'strength_potion', name: 'Strength Potion', color: '#f05a55', effects: [me('strength', 3)], desc: 'Gain 3 Strength for this combat.' },
    energy_potion: { id: 'energy_potion', name: 'Energy Potion', color: '#4facfe', effects: [energy(2)], desc: 'Gain 2 Energy.' },
    smoke_flask: { id: 'smoke_flask', name: 'Smoke Flask', color: '#a9b2c3', effects: [{ type: 'flee' }], flee: true, desc: 'Escape a normal combat. No rewards.' },
    chaos_potion: { id: 'chaos_potion', name: 'Chaos Potion', color: '#b18aff', effects: [{ type: 'randomBuff' }], desc: 'Gain a random positive status effect.' }
  };

  // ---------- Descriptions generated from effect data ----------
  // `live` (optional) adjusts shown numbers for current combat modifiers such as Strength.
  const num = (v, b, lv) => {
    if (lv !== undefined && lv !== v) return '<b class="num ' + (lv > v ? 'up' : 'down') + '">' + lv + '</b>';
    return '<b class="num' + (b !== undefined && b !== v ? ' up' : '') + '">' + v + '</b>';
  };
  const sname = k => SC.STATUSES[k].name;

  function textEffect(e, b, live) {
    const bv = b ? b.value : undefined;
    switch (e.type) {
      case 'damage': {
        let s = 'Deal ' + num(e.value, bv, live ? live.damage(e.value) : undefined) + ' damage';
        if (e.hits > 1) s += ' ' + num(e.hits, b && b.hits) + ' times';
        if (e.target === 'all') s += ' to ALL enemies';
        if (e.bonusLow) s += '. Deal ' + num(e.bonusLow, b && b.bonusLow) + ' more if the enemy is below half health';
        return s;
      }
      case 'damageFromBlock': return 'Deal damage equal to your Block';
      case 'block': return 'Gain ' + num(e.value, bv, live ? live.block(e.value) : undefined) + ' Block';
      case 'doubleBlock': return 'Double your Block';
      case 'draw': return 'Draw ' + num(e.value, bv) + (e.value === 1 ? ' card' : ' cards');
      case 'energy': return 'Gain ' + num(e.value, bv) + ' Energy';
      case 'loseHp': return 'Lose ' + num(e.value, bv) + ' HP';
      case 'heal': return 'Heal ' + num(e.value, bv) + ' HP';
      case 'energyPerDefeated': return 'Gain ' + e.value + ' Energy for each enemy defeated this turn';
      case 'addCard':
        if (e.copySelf) return 'Add a copy of this card to your discard pile';
        return 'Shuffle a ' + SC.CARDS[e.cardId].name + ' into your draw pile';
      case 'status':
        if (e.to === 'self') return 'Gain ' + num(e.value, bv) + ' ' + sname(e.status);
        if (e.to === 'all') return 'Apply ' + num(e.value, bv) + ' ' + sname(e.status) + ' to ALL enemies';
        return 'Apply ' + num(e.value, bv) + ' ' + sname(e.status);
      default: return '';
    }
  }

  SC.describe = function (card, live) {
    const base = SC.CARDS[card.defId];
    const d = SC.cardDef(card);
    if (d.text) return d.text;
    const parts = d.effects.map((e, i) => {
      const b = card.upgraded && base.effects[i] && base.effects[i].type === e.type ? base.effects[i] : undefined;
      return textEffect(e, b, live);
    });
    let s = parts.join('. ') + '.';
    if (d.exhaust) s += ' <i>Exhaust.</i>';
    return s;
  };

  SC.cardName = function (card) {
    return SC.cardDef(card).name + (card.upgraded ? '+' : '');
  };
})();
