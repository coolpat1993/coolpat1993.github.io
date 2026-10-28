window.SC = window.SC || {};

(function () {
  const SC = window.SC;
  const R = SC.RNG;

  // Outcome effects: loseHp, gainGold, loseGold, heal, gainMaxHp, loseMaxHp, relic,
  // removeRandomCard, upgradeRandomCard, addRandomCard {rarity}, addCard {id}.
  // option.requires: { gold, hp } (hp = amount that must leave the player alive).
  SC.EVENTS = {
    forgotten_shrine: {
      title: 'The Forgotten Shrine',
      text: 'You discover a shrine hidden beneath a collapsed stone archway.',
      options: [
        { text: 'Offer Blood', hint: 'Lose 8 HP. Gain a random relic.', requires: { hp: 8 },
          outcomes: [{ weight: 1, text: 'The shrine drinks deep and answers.', effects: [{ type: 'loseHp', value: 8 }, { type: 'relic' }] }] },
        { text: 'Search the Ruins', hint: 'Gain 25 gold.',
          outcomes: [{ weight: 1, text: 'You find coins among the rubble.', effects: [{ type: 'gainGold', value: 25 }] }] },
        { text: 'Leave', hint: 'Nothing happens.',
          outcomes: [{ weight: 1, text: 'You walk on.', effects: [] }] }
      ]
    },
    wandering_merchant: {
      title: 'The Wandering Merchant',
      text: 'A merchant offers to exchange one of your cards for a mysterious item.',
      options: [
        { text: 'Trade', hint: 'Remove a random card. Gain a random uncommon card.', requires: { deck: 6 },
          outcomes: [{ weight: 1, text: 'A fair trade, probably.', effects: [{ type: 'removeRandomCard' }, { type: 'addRandomCard', rarity: 'uncommon' }] }] },
        { text: 'Negotiate', hint: 'Pay 40 gold. Upgrade a random card.', requires: { gold: 40 },
          outcomes: [{ weight: 1, text: 'The merchant sharpens your gear.', effects: [{ type: 'loseGold', value: 40 }, { type: 'upgradeRandomCard' }] }] },
        { text: 'Decline', hint: 'Leave without spending anything.',
          outcomes: [{ weight: 1, text: 'The merchant shrugs.', effects: [] }] }
      ]
    },
    whispering_well: {
      title: 'The Whispering Well',
      text: 'Cool water glints far below. Something murmurs your name.',
      options: [
        { text: 'Drink', hint: 'Likely heal 20 HP. Might lose 6 HP.', requires: { hp: 7 },
          outcomes: [
            { weight: 3, text: 'The water is sweet and clear.', effects: [{ type: 'heal', value: 20 }] },
            { weight: 1, text: 'It tastes of rust and ash.', effects: [{ type: 'loseHp', value: 6 }] }] },
        { text: 'Toss a Coin', hint: 'Pay 15 gold. Gain 5 max HP.', requires: { gold: 15 },
          outcomes: [{ weight: 1, text: 'The whispers settle into your bones.', effects: [{ type: 'loseGold', value: 15 }, { type: 'gainMaxHp', value: 5 }] }] },
        { text: 'Leave', hint: 'Nothing happens.',
          outcomes: [{ weight: 1, text: 'You turn from the well.', effects: [] }] }
      ]
    },
    fallen_knight: {
      title: 'The Fallen Knight',
      text: 'A knight slumped against a tree. His blade still gleams.',
      options: [
        { text: 'Search the Body', hint: 'Gain 40 gold, or be ambushed (lose 8 HP, gain 20 gold).', requires: { hp: 9 },
          outcomes: [
            { weight: 1, text: 'His purse is heavy.', effects: [{ type: 'gainGold', value: 40 }] },
            { weight: 1, text: 'A trap! You escape with a little coin.', effects: [{ type: 'loseHp', value: 8 }, { type: 'gainGold', value: 20 }] }] },
        { text: 'Take the Blade', hint: 'Gain a random rare card and a Regret curse.',
          outcomes: [{ weight: 1, text: 'The sword is yours, and so is his regret.', effects: [{ type: 'addRandomCard', rarity: 'rare' }, { type: 'addCard', id: 'regret' }] }] },
        { text: 'Pay Respects', hint: 'Upgrade a random card.',
          outcomes: [{ weight: 1, text: 'You feel his resolve pass to you.', effects: [{ type: 'upgradeRandomCard' }] }] }
      ]
    },
    gamblers_den: {
      title: "The Gambler's Den",
      text: 'Dice rattle in a smoke-filled tent. A grinning dealer waves you over.',
      options: [
        { text: 'Wager 30 Gold', hint: '45% chance to win 75 gold.', requires: { gold: 30 },
          outcomes: [
            { weight: 45, text: 'Lucky roll! Pay out.', effects: [{ type: 'loseGold', value: 30 }, { type: 'gainGold', value: 75 }] },
            { weight: 55, text: 'Snake eyes. The dealer pockets your coins.', effects: [{ type: 'loseGold', value: 30 }] }] },
        { text: 'Walk Away', hint: 'Nothing happens.',
          outcomes: [{ weight: 1, text: 'Wise, perhaps.', effects: [] }] }
      ]
    },
    cursed_altar: {
      title: 'The Cursed Altar',
      text: 'A black altar hums with power. A relic rests upon it.',
      options: [
        { text: 'Take the Relic', hint: 'Gain a random relic and a Regret curse.',
          outcomes: [{ weight: 1, text: 'Power floods in. So does the cost.', effects: [{ type: 'relic' }, { type: 'addCard', id: 'regret' }] }] },
        { text: 'Smash the Altar', hint: 'Gain 30 gold. Lose 5 HP.', requires: { hp: 5 },
          outcomes: [{ weight: 1, text: 'Shards of gold scatter.', effects: [{ type: 'loseHp', value: 5 }, { type: 'gainGold', value: 30 }] }] },
        { text: 'Leave', hint: 'Nothing happens.',
          outcomes: [{ weight: 1, text: 'You do not look back.', effects: [] }] }
      ]
    }
  };

  SC.Events = {
    pick(state) {
      const ids = Object.keys(SC.EVENTS);
      const fresh = ids.filter(id => !state.seenEvents.includes(id));
      return R.pick(state, fresh.length ? fresh : ids);
    },

    available(state, option) {
      const r = option.requires || {};
      if (r.gold && state.player.gold < r.gold) return false;
      if (r.hp && state.player.hp <= r.hp) return false;
      if (r.deck && state.deck.length < r.deck) return false;
      return true;
    },

    // Returns result lines to show the player.
    apply(state, effect) {
      const P = state.player;
      switch (effect.type) {
        case 'loseHp': P.hp = Math.max(1, P.hp - effect.value); return 'Lost ' + effect.value + ' HP.';
        case 'heal': return 'Healed ' + SC.State.heal(state, effect.value) + ' HP.';
        case 'gainGold': SC.State.gainGold(state, effect.value); return 'Gained ' + effect.value + ' gold.';
        case 'loseGold': P.gold = Math.max(0, P.gold - effect.value); return 'Paid ' + effect.value + ' gold.';
        case 'gainMaxHp': SC.State.gainMaxHp(state, effect.value); return 'Max HP +' + effect.value + '.';
        case 'loseMaxHp': SC.State.loseMaxHp(state, effect.value); return 'Max HP -' + effect.value + '.';
        case 'relic': {
          const id = SC.Rewards.pickRelic(state);
          if (!id) return 'Nothing left to find.';
          SC.State.addRelic(state, id);
          return 'Gained relic: ' + SC.RELICS[id].name + '.';
        }
        case 'removeRandomCard': {
          if (!state.deck.length) return '';
          const c = R.pick(state, state.deck);
          SC.State.removeCard(state, c.uid);
          return 'Removed ' + SC.cardName(c) + '.';
        }
        case 'upgradeRandomCard': {
          const c = state.deck.filter(SC.State.canUpgrade);
          if (!c.length) return 'Nothing to upgrade.';
          const pick = R.pick(state, c);
          SC.State.upgradeCard(state, pick.uid);
          return 'Upgraded ' + SC.CARDS[pick.defId].name + '.';
        }
        case 'addRandomCard': {
          const pool = SC.State.cardPool(state, effect.rarity);
          if (!pool.length) return '';
          const card = SC.State.addCard(state, R.pick(state, pool));
          return 'Gained ' + SC.CARDS[card.defId].name + '.';
        }
        case 'addCard': {
          const card = SC.State.addCard(state, effect.id);
          return 'Gained ' + SC.CARDS[card.defId].name + '.';
        }
        default: return '';
      }
    }
  };
})();
