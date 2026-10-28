window.SC = window.SC || {};

(function () {
  const SC = window.SC;
  const R = SC.RNG;
  const P = SC.CONFIG.prices;

  const price = (state, base) => Math.max(1, Math.round(SC.Bus.modify(state, 'shopPrice', base)));

  // Inventory is rolled once on entry and stored in state.pending so it stays stable.
  SC.Shop = {
    generate(state) {
      const items = [];
      const used = [];
      const add = (rarity, count) => {
        const pool = SC.State.cardPool(state, rarity);
        for (let i = 0; i < count; i++) {
          const left = pool.filter(id => !used.includes(id));
          if (!left.length) return;
          const id = R.pick(state, left);
          used.push(id);
          items.push({ kind: 'card', id, price: price(state, P.card[rarity]), sold: false });
        }
      };
      add('common', 2);
      add('uncommon', 2);
      add('rare', 1);
      const relics = R.shuffle(state, SC.State.relicPool(state)).slice(0, 2);
      relics.forEach(id => items.push({ kind: 'relic', id, price: price(state, P.relic), sold: false }));
      for (let i = 0; i < 2; i++) items.push({ kind: 'potion', id: SC.Rewards.pickPotion(state), price: price(state, P.potion), sold: false });
      return { items, removals: 0 };
    },

    removePrice(shop, state) {
      const base = P.remove + P.removeStep * shop.removals;
      return state ? price(state, base) : base;
    },

    buy(state, index) {
      const shop = state.pending.shop;
      const it = shop.items[index];
      if (!it || it.sold) return { ok: false, reason: 'Sold out' };
      if (state.player.gold < it.price) return { ok: false, reason: 'Not enough gold' };
      if (it.kind === 'potion' && state.potions.indexOf(null) < 0) return { ok: false, reason: 'Potion slots full' };
      SC.State.spendGold(state, it.price);
      it.sold = true;
      if (it.kind === 'card') SC.State.addCard(state, it.id);
      else if (it.kind === 'relic') SC.State.addRelic(state, it.id);
      else SC.State.addPotion(state, it.id);
      return { ok: true };
    },

    remove(state, uid) {
      const shop = state.pending.shop;
      const price = SC.Shop.removePrice(shop, state);
      if (state.player.gold < price) return { ok: false, reason: 'Not enough gold' };
      if (!SC.State.removeCard(state, uid)) return { ok: false, reason: 'Card not found' };
      SC.State.spendGold(state, price);
      shop.removals++;
      return { ok: true };
    }
  };
})();
