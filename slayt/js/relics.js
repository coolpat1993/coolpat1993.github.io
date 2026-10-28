window.SC = window.SC || {};

(function () {
  const SC = window.SC;

  // Relics and character passives react to game events through this bus.
  // `on` handlers run for side effects; `mod` handlers transform a value and must return it.
  SC.RELICS = {
    warriors_crest: {
      name: "Warrior's Crest", rarity: 'uncommon', icon: 'alpha_crest.png',
      desc: 'The first Attack each combat deals 5 additional damage.',
      mod: {
        damageDealt(v, ctx, state) {
          return ctx.source === 'player' && ctx.isAttack && ctx.firstHit && state.combat.flags.attackCardsCombat === 0 ? v + 5 : v;
        }
      }
    },
    iron_heart: {
      name: 'Iron Heart', rarity: 'common', icon: 'healing_stone.png',
      desc: 'Start each combat with 6 Block.',
      on: { combatStarted(state) { state.player.block += 6; } }
    },
    glass_engine: {
      name: 'Glass Engine', rarity: 'rare', icon: 'orb_of_chaos.png',
      desc: 'Gain 1 additional energy on the first turn of combat, but start later turns with 1 less energy.',
      mod: { turnEnergy(v, ctx) { return ctx.turn === 1 ? v + 1 : v - 1; } }
    },
    collectors_lens: {
      name: "Collector's Lens", rarity: 'common', icon: 'spyglass.png',
      desc: 'Whenever you add a card to your deck, gain 5 gold.',
      on: { cardAdded(state) { SC.State.gainGold(state, 5); } }
    },
    blood_compass: {
      name: 'Blood Compass', rarity: 'uncommon', icon: 'fang_nacklace.png',
      desc: 'Deal 20% more damage while below 50% health.',
      mod: {
        damageDealt(v, ctx, state) {
          return ctx.source === 'player' && state.player.hp / state.player.maxHp < 0.5 ? v * 1.2 : v;
        }
      }
    },
    lucky_coin: {
      name: 'Lucky Coin', rarity: 'common', icon: 'amulet_of_flux.png',
      desc: 'Gain 25 additional gold after every boss.',
      on: { bossDefeated(state) { SC.State.gainGold(state, 25); } }
    },
    echo_stone: {
      name: 'Echo Stone', rarity: 'rare', icon: 'tome_of_countering.png',
      desc: 'The first Skill played each turn is triggered twice.',
      mod: { skillRepeats(v, ctx) { return ctx.firstSkill ? v + 1 : v; } }
    },
    last_stand: {
      name: 'Last Stand', rarity: 'rare', icon: 'juggernaut_helm.png',
      desc: 'Once per run, survive a fatal hit with 1 health.',
      mod: {
        hpLoss(v, ctx, state) {
          if (ctx.target.hp - v <= 0 && !state.relicFlags.last_stand) {
            state.relicFlags.last_stand = true;
            return ctx.target.hp - 1;
          }
          return v;
        }
      }
    }
  };

  const gain = (state, k, n) => {
    const s = state.player.statuses;
    s[k] = (s[k] || 0) + n;
  };
  const foes = (state, fn) => state.combat.enemies.forEach(e => { if (!e.dead) fn(e); });
  const addTo = (e, k, n) => { e.statuses[k] = (e.statuses[k] || 0) + n; };

  // `starter: true` relics are only offered at the start of a run.
  Object.assign(SC.RELICS, {
    soldiers_banner: {
      name: "Soldier's Banner", rarity: 'starter', starter: true, icon: 'banner_of_mights.png',
      desc: 'Start each combat with 1 Strength.',
      on: { combatStarted(state) { gain(state, 'strength', 1); } }
    },
    field_rations: {
      name: 'Field Rations', rarity: 'starter', starter: true, icon: 'healer.png',
      desc: 'After winning a combat, heal 6 HP.',
      on: { combatEnded(state, p) { if (p.result === 'won') SC.State.heal(state, 6); } }
    },
    sharpened_edge: {
      name: 'Sharpened Edge', rarity: 'starter', starter: true, icon: 'sharpened_arrows.png',
      desc: 'Your Attacks deal 1 additional damage.',
      mod: { damageDealt(v, ctx) { return ctx.source === 'player' && ctx.isAttack ? v + 1 : v; } }
    },
    travelers_pack: {
      name: "Traveler's Pack", rarity: 'starter', starter: true, icon: 'field_scout.png',
      desc: 'Draw 2 additional cards on the first turn of each combat.',
      mod: { handSize(v, ctx) { return ctx.turn === 1 ? v + 2 : v; } }
    },
    war_chest: {
      name: 'War Chest', rarity: 'starter', starter: true, icon: 'mass_grave.png',
      desc: 'Gain 60 gold when you pick this up.',
      on: { relicObtained(state, p) { if (p.id === 'war_chest') SC.State.gainGold(state, 60); } }
    },
    heartwood_charm: {
      name: 'Heartwood Charm', rarity: 'starter', starter: true, icon: 'totem_of_the_wild.png',
      desc: 'Gain 10 max HP when you pick this up.',
      on: { relicObtained(state, p) { if (p.id === 'heartwood_charm') SC.State.gainMaxHp(state, 10); } }
    },

    skull_lantern: {
      name: 'Skull Lantern', rarity: 'common', icon: 'skull_lantern.png',
      desc: 'Heal 3 HP whenever you defeat an enemy.',
      on: { enemyDefeated(state) { SC.State.heal(state, 3); } }
    },
    armorers_plate: {
      name: "Armorer's Plate", rarity: 'common', icon: 'armorer.png',
      desc: 'Start each combat with 1 Metallicize.',
      on: { combatStarted(state) { gain(state, 'metallicize', 1); } }
    },
    ancient_antler: {
      name: 'Ancient Antler', rarity: 'common', icon: 'ancient_stag.png',
      desc: 'Start each combat with 3 Regeneration.',
      on: { combatStarted(state) { gain(state, 'regeneration', 3); } }
    },
    haggler_seal: {
      name: "Haggler's Seal", rarity: 'common', icon: 'beast_bond.png',
      desc: 'Shop prices are 20% lower.',
      mod: { shopPrice(v) { return v * 0.8; } }
    },
    ember_staff: {
      name: 'Ember Staff', rarity: 'uncommon', icon: 'staff_of_ember.png',
      desc: 'Gain 4 Block whenever you play a Power.',
      on: { cardPlayed(state, p) { if (p.def.type === 'power') state.player.block += 4; } }
    },
    spirit_hide: {
      name: 'Spirit Hide', rarity: 'uncommon', icon: 'spirit_hide_armor.png',
      desc: 'Gain 3 Block whenever you lose HP.',
      on: { playerDamaged(state, p) { if (p.amount > 0) state.player.block += 3; } }
    },
    explosive_quiver: {
      name: 'Explosive Quiver', rarity: 'uncommon', icon: 'explosive_arrow_quiver.png',
      desc: 'Enemies start each combat Vulnerable.',
      on: { combatStarted(state) { foes(state, e => addTo(e, 'vulnerable', 1)); } }
    },
    soul_collector: {
      name: 'Soul Collector', rarity: 'uncommon', icon: 'soul_collector.png',
      desc: 'Gain 1 max HP whenever you defeat an enemy.',
      on: { enemyDefeated(state) { SC.State.gainMaxHp(state, 1); } }
    },
    tome_of_rot: {
      name: 'Tome of Eternal Rot', rarity: 'rare', icon: 'tome_of_eternal_rot.png',
      desc: 'Enemies start each combat with 4 Poison.',
      on: { combatStarted(state) { foes(state, e => addTo(e, 'poison', 4)); } }
    },
    war_horn: {
      name: 'War Horn', rarity: 'rare', icon: 'callhorn.png',
      desc: 'Draw 1 additional card each turn.',
      mod: { handSize(v) { return v + 1; } }
    },
    executioners_mark: {
      name: "Executioner's Mark", rarity: 'uncommon', icon: 'executioners_flail.png',
      desc: 'Attacks deal 3 additional damage to enemies below half health.',
      mod: {
        damageDealt(v, ctx) {
          return ctx.source === 'player' && ctx.isAttack && ctx.target.hp / ctx.target.maxHp < 0.5 ? v + 3 : v;
        }
      }
    },
    wardens_oath: {
      name: "Warden's Oath", rarity: 'common', icon: 'spiked_shield.png',
      desc: 'The first Skill you play each turn grants 3 Block.',
      on: {
        cardPlayed(state, p) {
          if (p.def.type === 'skill' && state.combat.flags.skillsPlayed === 1) {
            state.player.block += 3;
            state.combat.events.push({ type: 'block', target: 'player', amount: 3 });
          }
        }
      }
    },
    pilgrims_purse: {
      name: "Pilgrim's Purse", rarity: 'common', icon: 'amulet_of_flux.png',
      desc: 'Gain 12 gold after each combat victory.',
      on: { combatEnded(state, p) { if (p.result === 'won') SC.State.gainGold(state, 12); } }
    }
  });

  SC.PASSIVES = {
    momentum: {
      name: 'Momentum',
      mod: {
        damageDealt(v, ctx, state) {
          return ctx.source === 'player' && ctx.isAttack && ctx.firstHit && state.combat.flags.attackCardsCombat === 0 ? v + 2 : v;
        }
      }
    }
  };

  function handlers(state) {
    const list = [];
    const ch = SC.CHARACTERS[state.player.characterId];
    if (ch && SC.PASSIVES[ch.passive]) list.push(SC.PASSIVES[ch.passive]);
    for (const r of state.relics) if (SC.RELICS[r.id]) list.push(SC.RELICS[r.id]);
    return list;
  }

  SC.Bus = {
    emit(state, name, payload) {
      for (const h of handlers(state)) if (h.on && h.on[name]) h.on[name](state, payload || {});
    },
    modify(state, name, value, ctx) {
      for (const h of handlers(state)) if (h.mod && h.mod[name]) value = h.mod[name](value, ctx || {}, state);
      return value;
    }
  };
})();
