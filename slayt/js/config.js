window.SC = window.SC || {};

SC.CONFIG = {
  saveVersion: 1,
  handSize: 5,
  maxHand: 10,
  potionSlots: 2,
  startGold: 50,
  restHealPct: 0.3,
  map: { rows: 9, lanes: 5, paths: 4 },
  prices: {
    card: { common: 45, uncommon: 75, rare: 120 },
    relic: 150,
    potion: 40,
    remove: 75,
    removeStep: 25
  },
  gold: { combat: [10, 20], elite: [25, 35], boss: [70, 90], treasure: [15, 30] },
  cardWeights: {
    combat: { common: 60, uncommon: 32, rare: 8 },
    elite: { common: 40, uncommon: 40, rare: 18, legendary: 2 },
    boss: { uncommon: 20, rare: 78, legendary: 2 }
  },
  potionChance: { combat: 0.35, elite: 0.5, boss: 0 }
};
