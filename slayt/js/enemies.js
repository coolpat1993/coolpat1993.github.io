window.SC = window.SC || {};

(function () {
  const SC = window.SC;
  const atk = (value, hits) => ({ type: 'attack', value, hits: hits || 1 });
  const block = (value, to) => ({ type: 'block', value, to: to || 'self' });
  const stat = (status, value, to) => ({ type: 'status', status, value, to });
  const charge = () => ({ type: 'charge' });

  // move.actions are resolved in order; intent icon is derived from the actions.
  SC.ENEMIES = {
    cave_raider: {
      name: 'Cave Raider', hp: 42, image: 'mercenary.png',
      moves: {
        quick_slash: { name: 'Quick Slash', actions: [atk(8)] },
        guard: { name: 'Guard', actions: [block(6)] },
        heavy_slash: { name: 'Heavy Slash', actions: [atk(13)] }
      },
      pattern: ['quick_slash', 'guard', 'heavy_slash']
    },
    plague_moth: {
      name: 'Plague Moth', hp: 32, image: 'carrion_bat.png',
      moves: {
        wing_attack: { name: 'Wing Attack', actions: [atk(6)] },
        spores: { name: 'Spores', actions: [stat('weak', 1, 'player')] },
        frenzy: { name: 'Frenzy', actions: [atk(4, 2)] }
      },
      pattern: ['wing_attack', 'spores', 'frenzy']
    },
    stone_guardian: {
      name: 'Stone Guardian', hp: 60, image: 'village_guard.png',
      moves: {
        slam: { name: 'Slam', actions: [atk(12)] },
        fortify: { name: 'Fortify', actions: [block(10)] },
        charge: { name: 'Charge', actions: [charge()] },
        crush: { name: 'Crush', actions: [atk(20)] }
      },
      pattern: ['slam', 'fortify', 'charge', 'crush']
    },
    tusked_boar: {
      name: 'Tusked Boar', hp: 38, image: 'tusked_boar.png',
      moves: {
        gore: { name: 'Gore', actions: [atk(7)] },
        snort: { name: 'Snort', actions: [stat('strength', 2, 'self')] },
        trample: { name: 'Trample', actions: [atk(10)] }
      },
      pattern: ['gore', 'snort', 'trample']
    },
    rotting_ghoul: {
      name: 'Rotting Ghoul', hp: 36, image: 'rotting_ghoul.png',
      moves: {
        infect: { name: 'Infect', actions: [stat('poison', 3, 'player')] },
        claw: { name: 'Claw', actions: [atk(8)] }
      },
      pattern: ['infect', 'claw', 'claw']
    },

    // ---- Elites ----
    executioner: {
      name: 'The Executioner', hp: 95, image: 'rageborn_crusher.png', elite: true,
      moves: {
        swing: { name: 'Swing', actions: [atk(12)] },
        raise_axe: { name: 'Raise Axe', actions: [charge()] },
        execution: { name: 'Execution', actions: [atk(28)] },
        whet: { name: 'Whet Blade', actions: [block(10), stat('strength', 1, 'self')] },
        frenzy: { name: 'Frenzy', actions: [atk(14)] }
      },
      pattern: ['swing', 'raise_axe', 'execution', 'whet'],
      phases: [{ below: 0.4, enter: [stat('strength', 3, 'self')], pattern: ['frenzy', 'frenzy', 'raise_axe', 'execution'] }]
    },
    wraith_blade: {
      name: 'Wraith of Blades', hp: 45, image: 'banshee.png', elite: true,
      moves: {
        slash: { name: 'Slash', actions: [atk(9)] },
        rend: { name: 'Rend', actions: [atk(5, 2)] }
      },
      pattern: ['slash', 'rend', 'slash'],
      onAllyDefeated: [stat('strength', 3, 'self')]
    },
    wraith_veil: {
      name: 'Wraith of Veils', hp: 45, image: 'wailing_banshee.png', elite: true,
      moves: {
        hex: { name: 'Hex', actions: [stat('weak', 1, 'player'), stat('frail', 1, 'player')] },
        shroud: { name: 'Shroud', actions: [block(8, 'allEnemies')] },
        drain: { name: 'Drain', actions: [atk(6)] }
      },
      pattern: ['hex', 'shroud', 'drain'],
      onAllyDefeated: [stat('strength', 3, 'self')]
    },
    clockwork_beast: {
      name: 'Clockwork Beast', hp: 110, image: 'siege_commander.png', elite: true,
      moves: {
        whirr: { name: 'Whirr', actions: [block(8), stat('strength', 1, 'self')] },
        tick: { name: 'Tick', actions: [atk(8)] },
        grind: { name: 'Grind', actions: [atk(12)] },
        overload: { name: 'Overload', actions: [atk(30)] }
      },
      pattern: ['whirr', 'tick', 'grind', 'overload']
    },

    // ---- Boss ----
    hollow_king: {
      name: 'The Hollow King', hp: 180, image: 'undying_horror.png', boss: true,
      statuses: { ritual: 1 },
      moves: {
        royal_strike: { name: 'Royal Strike', actions: [atk(14)] },
        stance: { name: 'Defensive Stance', actions: [block(14)] },
        gather: { name: 'Gather Ruin', actions: [charge()] },
        ruin: { name: 'Ruin', actions: [atk(34)] }
      },
      pattern: ['royal_strike', 'stance', 'gather', 'ruin'],
      phases: [{ below: 0.5, enter: [stat('ritual', 1, 'self')], pattern: ['royal_strike', 'royal_strike', 'gather', 'ruin'] }]
    }
  };

  SC.ENCOUNTERS = {
    early: [['cave_raider'], ['plague_moth'], ['rotting_ghoul'], ['tusked_boar']],
    late: [['stone_guardian'], ['tusked_boar', 'plague_moth'], ['cave_raider', 'rotting_ghoul'], ['plague_moth', 'plague_moth'], ['stone_guardian', 'plague_moth']],
    elite: [['executioner'], ['wraith_blade', 'wraith_veil'], ['clockwork_beast']],
    boss: [['hollow_king']]
  };

  SC.Enemies = {
    create(id, index) {
      const d = SC.ENEMIES[id];
      return {
        uid: 'e' + (index + 1), id, name: d.name, hp: d.hp, maxHp: d.hp, block: 0,
        statuses: Object.assign({}, d.statuses || {}), patternIdx: 0, phase: -2, move: null, dead: false
      };
    },
    pickEncounter(state, nodeType, row) {
      const R = SC.RNG;
      if (nodeType === 'boss') return R.pick(state, SC.ENCOUNTERS.boss);
      if (nodeType === 'elite') return R.pick(state, SC.ENCOUNTERS.elite);
      return R.pick(state, row < 3 ? SC.ENCOUNTERS.early : SC.ENCOUNTERS.early.concat(SC.ENCOUNTERS.late));
    }
  };
})();
