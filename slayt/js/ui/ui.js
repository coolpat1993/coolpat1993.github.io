window.SC = window.SC || {};
SC.UI = SC.UI || {};

// Core UI plumbing: render dispatch, overlays, HUD, shared modals. Screens read state only;
// every state change goes through SC.Flow / SC.Combat / SC.State.
(function () {
  const SC = window.SC;
  const UI = SC.UI;
  const I = SC.Icons;
  const $ = id => document.getElementById(id);

  UI.s = {
    view: 'menu', notice: null,
    selected: null, targeting: false, busy: false, resolving: false,
    picked: null, deckSort: 'type', seen: new Set(), overlays: [], gridCtx: null, confirmYes: null
  };
  UI.screens = {};
  UI.actions = {};
  UI.isMobile = () => window.matchMedia
    ? window.matchMedia('(pointer: coarse)').matches
    : (navigator.maxTouchPoints || 0) > 0;

  UI.sleep = ms => new Promise(r => setTimeout(r, SC.Save.settings().reduceMotion ? Math.min(ms, 60) : ms));

  UI.render = function () {
    const g = SC.game;
    const view = UI.s.view || (g ? g.screen : 'menu');
    $('app').innerHTML = (UI.screens[view] || UI.screens.menu)(g);
    if (g && g.runActive) SC.Save.saveRun(g);
    UI.after(view);
  };

  UI.after = function (view) {
    const g = SC.game;
    if (view === 'map') UI.scrollMap();
    if (view === 'combat') UI.afterCombatRender(g);
  };

  // ---- overlays ----
  UI.paintOverlay = function () {
    const o = UI.s.overlays[UI.s.overlays.length - 1];
    $('overlay').innerHTML = o ? '<div class="overlay ' + o.cls + '" data-act="overlaybg">' + o.html + '</div>' : '';
  };
  UI.pushOverlay = function (html, cls, extra) {
    UI.s.overlays.push(Object.assign({ html, cls: cls || '' }, extra || {}));
    UI.paintOverlay();
  };
  UI.popOverlay = function () { UI.s.overlays.pop(); UI.paintOverlay(); };
  UI.clearOverlays = function () { UI.s.overlays = []; UI.paintOverlay(); };

  UI.modal = function (title, body, buttons, cls) {
    UI.pushOverlay('<div class="modal"><h3>' + title + '</h3>' + body + '<div class="footer-bar">' + (buttons || '<button class="btn" data-act="closeov">Close</button>') + '</div></div>', cls);
  };

  UI.confirm = function (title, body, yesLabel, onYes, yesClass) {
    UI.s.confirmYes = onYes;
    UI.modal(title, '<p>' + body + '</p>',
      '<button class="btn secondary" data-act="closeov">Cancel</button><button class="btn ' + (yesClass || 'good') + '" data-act="confirmyes">' + yesLabel + '</button>');
  };

  UI.toast = function (msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1700);
  };

  // ---- shared widgets ----
  UI.hud = function (g, extra) {
    const p = g.player;
    return '<div class="hud">' +
      '<span class="pill hp">' + I.svg('heart') + ' ' + p.hp + '/' + p.maxHp + '</span>' +
      '<span class="pill gold">' + I.svg('coin') + ' ' + p.gold + '</span>' +
      '<div class="potions">' + g.potions.map((id, i) => SC.UI.potionHTML(id, i)).join('') + '</div>' +
      '<div class="hud-relics">' + g.relics.map(r => SC.UI.relicHTML(r.id)).join('') + '</div>' +
      '<div class="hud-right">' + (extra || '') +
      '<span class="hud-act">Act ' + g.act + ' &middot; Floor ' + g.floor + '</span>' +
      '<button class="btn small secondary" data-act="deck">' + I.svg('deck') + ' ' + g.deck.length + '</button>' +
      '<button class="btn small secondary" data-act="pause">' + I.svg('menu') + '</button></div></div>';
  };

  const TYPE_ORDER = { attack: 0, skill: 1, power: 2, curse: 3, status: 4 };
  const RARITY_ORDER = { basic: 0, common: 1, uncommon: 2, rare: 3, legendary: 4, status: 5 };
  UI.sortCards = function (cards, key) {
    const k = c => {
      const d = SC.cardDef(c);
      return key === 'rarity' ? [RARITY_ORDER[d.rarity], d.name]
        : key === 'cost' ? [d.cost, d.name]
        : key === 'name' ? [0, d.name]
        : [TYPE_ORDER[d.type], d.name];
    };
    return cards.slice().sort((a, b) => {
      const x = k(a), y = k(b);
      return x[0] - y[0] || (x[1] < y[1] ? -1 : x[1] > y[1] ? 1 : 0);
    });
  };

  // ctx: { title, cards, act, sortable }
  UI.openGrid = function (ctx) {
    UI.s.gridCtx = ctx;
    const cards = UI.sortCards(ctx.cards, UI.s.deckSort);
    const tabs = ctx.sortable === false ? '' : '<div class="tabs">' +
      ['type', 'rarity', 'cost', 'name'].map(k => '<span class="tab ' + (UI.s.deckSort === k ? 'on' : '') + '" data-act="sort" data-key="' + k + '">' + k[0].toUpperCase() + k.slice(1) + '</span>').join('') + '</div>';
    const html = '<div class="modal"><div class="modal-head"><h3>' + ctx.title + '</h3>' + tabs +
      '<button class="btn small secondary" data-act="closeov">Close</button></div>' +
      '<div class="card-grid">' + (cards.length ? cards.map(c => SC.UI.cardHTML(c, { act: ctx.act })).join('') : '<p>Nothing here.</p>') + '</div></div>';
    const top = UI.s.overlays[UI.s.overlays.length - 1];
    if (top && top.grid) { top.html = html; UI.paintOverlay(); }
    else UI.pushOverlay(html, 'full', { grid: true });
  };

  UI.showBigCard = function (card) {
    UI.modal(SC.cardName(card), '<div class="big-card">' + SC.UI.cardHTML(card, {}) + '</div>');
  };

  UI.swordIcon = function () {
    return '<span class="icon sword-icon" aria-hidden="true"></span>';
  };

  UI.statusIcon = function (key, status) {
    return key === 'strength' ? UI.swordIcon() : I.svg(status.icon);
  };

  UI.statusList = function (statuses) {
    const keys = Object.keys(statuses || {});
    if (!keys.length) return '<p style="color:var(--text2)">No status effects.</p>';
    return '<div class="info-list">' + keys.map(k => {
      const d = SC.STATUSES[k];
      return '<div class="info-item"><span class="status ' + d.kind + '">' + UI.statusIcon(k, d) + '<b>' + statuses[k] + '</b></span><div><b>' + d.name + '</b><br><span class="desc">' + d.desc.replace(/\bN\b/g, statuses[k]) + '</span></div></div>';
    }).join('') + '</div>';
  };

  // ---- actions shared by many screens ----
  const A = UI.actions;
  A.overlaybg = (el, e) => { if (e.target === el) UI.popOverlay(); };
  A.closeov = () => UI.popOverlay();
  A.confirmyes = () => { const f = UI.s.confirmYes; UI.s.confirmYes = null; UI.clearOverlays(); if (f) f(); };

  A.deck = () => UI.openGrid({ title: 'Your Deck (' + SC.game.deck.length + ')', cards: SC.game.deck, act: 'viewcard' });
  A.viewcard = el => {
    const card = (UI.s.gridCtx ? UI.s.gridCtx.cards : SC.game.deck).find(c => c.uid === el.dataset.uid);
    if (card) UI.showBigCard(card);
  };
  A.sort = el => { UI.s.deckSort = el.dataset.key; if (UI.s.gridCtx) UI.openGrid(UI.s.gridCtx); };

  A.relic = el => {
    const r = SC.RELICS[el.dataset.id];
    UI.modal(r.name, '<div class="row"><div class="relic big"><img src="images/' + r.icon + '" alt=""></div><div><p>' + r.desc + '</p><p style="color:var(--text2)">' + r.rarity + ' relic</p></div></div>');
  };

  A.potion = el => {
    const g = SC.game;
    const slot = +el.dataset.slot;
    const p = SC.POTIONS[el.dataset.id];
    const inCombat = g.screen === 'combat' && g.combat && g.combat.phase === 'player';
    UI.modal(p.name, '<div class="row"><div class="potion big" style="--pc:' + p.color + '">' + I.svg('flask') + '</div><p>' + p.desc + '</p></div>',
      '<button class="btn secondary" data-act="closeov">Close</button>' +
      '<button class="btn danger small" data-act="potiondrop" data-slot="' + slot + '">Discard</button>' +
      (inCombat ? '<button class="btn good" data-act="potionuse" data-slot="' + slot + '">Use</button>' : ''));
  };
  A.potiondrop = el => { SC.game.potions[+el.dataset.slot] = null; UI.clearOverlays(); UI.render(); };
  A.potionuse = el => {
    const r = SC.Combat.usePotion(SC.game, +el.dataset.slot);
    UI.clearOverlays();
    if (!r.ok) UI.toast(r.reason);
    UI.render();
  };

  A.pause = () => {
    UI.modal('Paused', '<p>Your run is saved automatically.</p>',
      '<button class="btn good" data-act="closeov">Resume</button>' +
      (UI.isMobile() ? '<button class="btn secondary" data-act="fullscreen">' + I.svg('expand') + ' Full screen</button>' : '') +
      '<button class="btn secondary" data-act="tomenu">Main Menu</button>' +
      '<button class="btn danger small" data-act="abandon">Abandon Run</button>');
  };
  A.tomenu = () => { UI.clearOverlays(); UI.s.view = 'menu'; UI.render(); };

  UI.inFullscreen = () => !!(document.fullscreenElement || document.webkitFullscreenElement);

  // Browsers only allow this from a user gesture; the promise rejects otherwise.
  UI.enterFullscreen = function () {
    const root = document.documentElement;
    const req = root.requestFullscreen || root.webkitRequestFullscreen;
    if (!req || UI.inFullscreen()) return Promise.resolve();
    return Promise.resolve(req.call(root)).then(() => {
      if (screen.orientation && screen.orientation.lock) return screen.orientation.lock('landscape').catch(() => {});
    });
  };

  // iPhone Safari has no Fullscreen API; installed web apps already run fullscreen there.
  A.fullscreen = () => {
    if (!UI.isMobile()) return;
    const d = document;
    const root = d.documentElement;
    if (!(root.requestFullscreen || root.webkitRequestFullscreen)) { UI.toast('Add to Home Screen to play full screen'); return; }
    if (UI.inFullscreen()) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else UI.enterFullscreen().catch(() => UI.toast('Full screen is not available'));
  };
})();
