window.SC = window.SC || {};
SC.UI = SC.UI || {};

(function () {
  const UI = SC.UI;
  const I = SC.Icons;

  const TYPE_ICON = { skill: 'shield', power: 'star', curse: 'skull', status: 'skull' };
  const typeIcon = type => type === 'attack' ? UI.swordIcon() : I.svg(TYPE_ICON[type], '');

  UI.cardHTML = function (card, o) {
    o = o || {};
    const base = SC.CARDS[card.defId];
    if (!base) return '';
    const d = SC.cardDef(card);
    const cls = ['card', d.type, d.rarity];
    if (card.upgraded) cls.push('upgraded');
    if (o.playable) cls.push('playable');
    if (o.disabled) cls.push('disabled');
    if (o.selected) cls.push('selected');
    if (o.extra) cls.push(o.extra);
    const art = d.image
      ? "url('images/" + d.image + "')"
      : 'radial-gradient(circle at 50% 40%, #6b5a7a, #1d1826)';
    const costCls = d.cost < base.cost ? 'less' : d.cost > base.cost ? 'more' : '';
    const text = SC.describe(card, o.live);
    const len = text.replace(/<[^>]+>/g, '').length;
    const size = len > 90 ? ' xlong' : len > 55 ? ' long' : '';
    return '<div class="' + cls.join(' ') + '"' +
      (card.uid ? ' data-uid="' + card.uid + '"' : '') +
      (o.act ? ' data-act="' + o.act + '"' : '') +
      (o.attrs ? ' ' + o.attrs : '') +
      (o.style ? ' style="' + o.style + '"' : '') + '>' +
      '<div class="card-image" style="background-image:' + art + '">' +
      (d.image ? '' : '<div class="card-art-icon">' + typeIcon(d.type) + '</div>') +
      '<div class="card-header">' + SC.cardName(card) + '</div>' +
      '<div class="card-type-badge">' + typeIcon(d.type) + '</div></div>' +
      '<div class="card-description"><div class="card-text' + size + '"><span>' + text + '</span></div></div>' +
      (d.unplayable ? '' : '<div class="mana-indicator ' + costCls + '">' + d.cost + '</div>') +
      '</div>';
  };

  UI.relicHTML = function (id, o) {
    o = o || {};
    const r = SC.RELICS[id];
    const act = o.act === undefined ? 'relic' : o.act;
    return '<div class="relic ' + (o.extra || '') + '"' + (act ? ' data-act="' + act + '"' : '') + ' data-id="' + id + '" title="' + r.name + '">' +
      '<img src="images/' + r.icon + '" alt="' + r.name + '"></div>';
  };

  UI.potionHTML = function (id, slot, o) {
    o = o || {};
    if (!id) return '<div class="potion empty" data-slot="' + slot + '"></div>';
    const p = SC.POTIONS[id];
    return '<div class="potion ' + (o.extra || '') + '" data-act="' + (o.act || 'potion') + '" data-slot="' + slot + '" data-id="' + id + '" style="--pc:' + p.color + '" title="' + p.name + '">' +
      I.svg('flask', '') + '</div>';
  };

  UI.statusChips = function (statuses, o) {
    return Object.keys(statuses || {}).map(k => {
      const d = SC.STATUSES[k];
      if (!d) return '';
      const icon = k === 'strength' ? UI.swordIcon() : I.svg(d.icon, '');
      return '<span class="status ' + d.kind + '" data-status="' + k + '" title="' + d.name + '">' + icon + '<b>' + statuses[k] + '</b></span>';
    }).join('');
  };
})();
