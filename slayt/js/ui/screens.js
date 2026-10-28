window.SC = window.SC || {};
SC.UI = SC.UI || {};

(function () {
  const SC = window.SC;
  const UI = SC.UI;
  const I = SC.Icons;
  const A = UI.actions;
  const S = UI.screens;
  const hasRun = () => !!(SC.game && SC.game.runActive);

  // ---------- Menu / setup ----------
  S.menu = function () {
    const notice = UI.s.notice;
    UI.s.notice = null;
    return '<div class="screen"><div class="center-col">' +
      '<h1 class="title">SHATTERED CROWN</h1><p class="subtitle">A roguelike deckbuilder</p>' +
      (notice ? '<div class="notice">' + notice + '</div>' : '') +
      '<div class="menu-buttons">' +
      (hasRun() ? '<button class="btn good" data-act="continue">Continue Run</button>' : '') +
      '<button class="btn" data-act="newrun">New Run</button>' +
      '<button class="btn secondary" data-act="stats">Statistics</button>' +
      '<button class="btn secondary" data-act="settings">Settings</button>' +
      (UI.isMobile() ? '<button class="btn secondary" data-act="fullscreen">Full screen</button>' : '') +
      (hasRun() ? '<button class="btn danger small" data-act="abandon">Abandon Run</button>' : '') +
      '</div></div></div>';
  };

  A.continue = () => { UI.s.view = null; UI.render(); };
  A.newrun = () => {
    if (hasRun()) UI.confirm('Start a new run?', 'Your current run will be abandoned.', 'Abandon & Continue', () => { SC.Flow.abandon(SC.game); SC.game = null; UI.s.view = 'charselect'; UI.render(); }, 'danger');
    else { UI.s.view = 'charselect'; UI.render(); }
  };
  A.abandon = () => UI.confirm('Abandon this run?', 'This ends the run. It counts as a loss.', 'Abandon', () => {
    SC.Flow.abandon(SC.game);
    SC.game = null;
    UI.s.view = 'menu';
    UI.render();
  }, 'danger');
  A.menu = () => { UI.s.view = 'menu'; UI.render(); };

  S.charselect = function () {
    const ch = SC.CHARACTERS.vanguard;
    const deck = Object.keys(ch.starterDeck).map(id => '<span class="chip">' + ch.starterDeck[id] + '&times; ' + SC.CARDS[id].name + '</span>').join('');
    return '<div class="screen"><div class="page"><div class="center-col" style="min-height:100%">' +
      '<h2>Choose your hero</h2>' +
      '<div class="char-card"><div class="char-portrait" style="background-image:url(\'images/' + ch.art + '\')"></div>' +
      '<div class="char-info"><h3>' + ch.name + '</h3><p>' + ch.role + ' &middot; Difficulty: ' + ch.difficulty + '</p>' +
      '<div class="char-stats"><span class="pill hp">' + I.svg('heart') + ' ' + ch.hp + ' HP</span><span class="pill" style="color:#7cbcff">' + I.svg('bolt') + ' ' + ch.energy + ' Energy</span></div>' +
      '<p><b style="color:var(--gold)">' + ch.passiveName + ':</b> ' + ch.passiveText + '</p><div class="deck-summary">' + deck + '</div></div></div>' +
      '<div class="row"><label>Seed (optional) <input id="seed" class="seed-input" placeholder="random" autocomplete="off"></label></div>' +
      '<div class="row"><button class="btn secondary" data-act="menu">Back</button><button class="btn good" data-act="startrun">Begin Run</button></div>' +
      '</div></div></div>';
  };

  A.startrun = () => {
    const input = document.getElementById('seed');
    const raw = input ? input.value.trim() : '';
    SC.game = SC.Flow.newRun('vanguard', raw ? SC.hashSeed(raw) : undefined);
    UI.s.view = null;
    UI.s.seen = new Set();
    UI.render();
  };

  S.stats = function () {
    const s = SC.Save.stats();
    const totalCards = Object.keys(SC.CARDS).filter(id => SC.CARDS[id].rarity !== 'status').length;
    const stat = (l, v) => '<div class="stat"><small>' + l + '</small><b>' + v + '</b></div>';
    return '<div class="screen"><div class="page"><h2>Statistics</h2><div class="summary">' +
      stat('Total runs', s.totalRuns) + stat('Wins', s.wins) + stat('Highest act', s.highestAct) + stat('Best score', s.bestScore) +
      stat('Enemies defeated', s.enemiesDefeated) + stat('Cards discovered', s.cardsDiscovered.length + ' / ' + totalCards) +
      stat('Relics discovered', s.relicsDiscovered.length + ' / ' + Object.keys(SC.RELICS).length) +
      '</div></div><div class="footer-bar"><button class="btn" data-act="menu">Back</button></div></div>';
  };
  A.stats = () => { UI.s.view = 'stats'; UI.render(); };

  S.settings = function () {
    const st = SC.Save.settings();
    return '<div class="screen"><div class="page"><h2>Settings</h2>' +
      '<div class="toggle" data-act="togglemotion"><span class="box">' + (st.reduceMotion ? I.svg('check') : '') + '</span> Reduce motion (shorter delays, fewer animations)</div><br>' +
      '<button class="btn danger" data-act="resetall">Erase all saved data</button></div>' +
      '<div class="footer-bar"><button class="btn" data-act="menu">Back</button></div></div>';
  };
  A.settings = () => { UI.s.view = 'settings'; UI.render(); };
  A.togglemotion = () => {
    const v = !SC.Save.settings().reduceMotion;
    SC.Save.setSetting('reduceMotion', v);
    document.body.classList.toggle('reduce-motion', v);
    UI.render();
  };
  A.resetall = () => UI.confirm('Erase everything?', 'This deletes your current run, statistics and settings.', 'Erase', () => {
    SC.Save.resetAll();
    SC.game = null;
    UI.s.view = 'menu';
    UI.render();
  }, 'danger');

  // ---------- Starting relic ----------
  S.relicpick = function (g) {
    const picked = UI.s.picked;
    const tiles = g.pending.startRelics.map(id => '<div class="start-relic ' + (picked === id ? 'picked' : '') + '" data-act="pickstart" data-id="' + id + '">' +
      UI.relicHTML(id, { act: '', extra: 'big' }) + '<b>' + SC.RELICS[id].name + '</b><small>' + SC.RELICS[id].desc + '</small></div>').join('');
    return '<div class="screen"><div class="reward-screen"><div class="reward-head"><h2>Choose a starting relic</h2></div>' +
      '<div class="reward-body"><div class="start-row ' + (picked ? 'has-pick' : '') + '">' + tiles + '</div>' +
      '<div class="reward-hint">' + (picked ? 'Tap again or press the button to begin' : 'It stays with you for the whole run') + '</div></div></div>' +
      '<div class="footer-bar"><button class="btn secondary" data-act="menu">Menu</button><button class="btn good" data-act="beginrun" ' + (picked ? '' : 'disabled') + '>' + (picked ? 'Begin with ' + SC.RELICS[picked].name : 'Pick a relic') + '</button></div></div>';
  };
  A.pickstart = el => {
    if (UI.s.picked === el.dataset.id) { A.beginrun(); return; }
    UI.s.picked = el.dataset.id;
    UI.render();
  };
  A.beginrun = () => {
    if (UI.s.picked && SC.Flow.chooseStartRelic(SC.game, UI.s.picked)) { UI.s.picked = null; UI.render(); }
  };

  // ---------- Map ----------
  const NODE_ICON = { elite: 'skull', event: 'question', rest: 'campfire', shop: 'bag', treasure: 'chest', boss: 'crown' };
  const NODE_NAME = { combat: 'Combat', elite: 'Elite', event: 'Event', rest: 'Rest', shop: 'Shop', treasure: 'Treasure', boss: 'Boss' };
  const GEO = { ls: 76, rs: 72, padX: 50, padTop: 55, padBot: 55 };

  function geo(m) {
    const W = (m.lanes - 1) * GEO.ls + GEO.padX * 2;
    const H = m.rows * GEO.rs + GEO.padTop + GEO.padBot;
    return { W, H, x: n => (n.id === 'boss' ? W / 2 : GEO.padX + n.lane * GEO.ls), y: n => H - GEO.padBot - n.row * GEO.rs };
  }

  S.map = function (g) {
    const m = g.map;
    const G = geo(m);
    const av = SC.Map.available(g);
    const nodes = Object.values(m.nodes);
    let edges = '';
    nodes.forEach(n => n.next.forEach(id => {
      const t = m.nodes[id];
      const cls = n.done && (t.done || id === g.currentNode) ? 'done' : g.currentNode === n.id && n.done ? 'live' : '';
      edges += '<line class="map-edge ' + cls + '" x1="' + G.x(n) + '" y1="' + G.y(n) + '" x2="' + G.x(t) + '" y2="' + G.y(t) + '"/>';
    }));
    const body = nodes.map(n => {
      const a = av.includes(n.id);
      const state = a ? 'available' : n.id === g.currentNode ? 'current' : n.done ? 'done' : 'locked';
      const r = n.type === 'boss' ? 30 : 22;
      const sc = n.type === 'boss' ? 1.5 : 1;
      return '<g class="node ' + n.type + ' ' + state + '" ' + (a ? 'data-act="node" data-id="' + n.id + '"' : '') + ' transform="translate(' + G.x(n) + ',' + G.y(n) + ')">' +
        '<circle class="ring" r="' + r + '"/><circle class="base" r="' + r + '"/>' +
        (n.type === 'combat'
          ? '<image class="glyph sword-map-icon" href="assets/icons/sword.svg" x="-12" y="-12" width="24" height="24" />'
          : '<g class="glyph" transform="scale(' + sc + ') translate(-12,-12)" fill="currentColor" fill-opacity=".2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + I.inner(NODE_ICON[n.type]) + '</g>') +
        '<circle r="' + (r + 8) + '" fill="transparent"/>' +
        (n.done ? '<g transform="translate(8,-24)"><circle r="8" fill="#8c6d35"/><g transform="translate(-6,-6) scale(.5)" stroke="#fff" fill="none" stroke-width="3">' + I.inner('check') + '</g></g>' : '') +
        '</g>';
    }).join('');
    const legend = ['combat', 'elite', 'event', 'rest', 'shop', 'treasure', 'boss'].map(t => '<span>' + (t === 'combat' ? UI.swordIcon() : I.svg(NODE_ICON[t])) + ' ' + NODE_NAME[t] + '</span>').join('');
    return '<div class="screen">' + UI.hud(g) +
      '<div class="map-wrap" id="mapwrap"><svg class="map-svg" viewBox="0 0 ' + G.W + ' ' + G.H + '" data-w="' + G.W + '">' + edges + body + '</svg></div>' +
      '<div class="map-legend">' + legend + '<span>Seed ' + g.seed + '</span></div></div>';
  };

  UI.scrollMap = function () {
    const g = SC.game;
    const wrap = document.getElementById('mapwrap');
    if (!wrap || !g) return;
    const G = geo(g.map);
    const svg = wrap.querySelector('svg');
    const scale = svg.getBoundingClientRect().width / G.W;
    const ref = g.currentNode ? g.map.nodes[g.currentNode] : { row: 0, id: 'start' };
    wrap.scrollTop = Math.max(0, (G.H - GEO.padBot - ref.row * GEO.rs) * scale - wrap.clientHeight * 0.65);
  };

  A.node = el => {
    if (SC.Flow.chooseNode(SC.game, el.dataset.id)) { UI.s.seen = new Set(); UI.render(); }
  };

  // ---------- Rewards ----------
  const REWARD_TITLE = { combat: 'Victory!', elite: 'Elite Defeated!', boss: 'The Hollow King Falls!', treasure: 'Treasure' };

  S.reward = function (g) {
    const r = g.pending.reward;
    const picked = UI.s.picked;
    const pending = r.cards && !r.cardsDone;
    let cards = '';
    if (pending) {
      cards = '<div class="reward-row ' + (picked ? 'has-pick' : '') + '">' + r.cards.map(id => UI.cardHTML({ defId: id, upgraded: false }, { act: 'rcard', attrs: 'data-id="' + id + '"', extra: picked === id ? 'picked' : '' })).join('') + '</div>' +
        '<div class="reward-hint">' + (picked ? 'Tap again or press the button to add it to your deck' : 'Choose a card to add to your deck') + '</div>';
    } else if (r.cards) {
      cards = '<div class="reward-done">' + (r.taken ? I.svg('check') + ' ' + SC.CARDS[r.taken].name + ' added to your deck' : 'Card reward skipped') + '</div>';
    }
    const chip = (taken, act, icon, name, desc) => '<div class="claim-btn ' + (taken ? 'done' : '') + '" data-act="' + act + '">' + icon +
      '<div><b>' + name + '</b><small>' + desc + '</small></div><span class="claim-tag">' + (taken ? 'Taken' : 'Take') + '</span></div>';
    const relic = r.relic ? chip(r.relicTaken, 'claimrelic', UI.relicHTML(r.relic, { act: '' }), SC.RELICS[r.relic].name, SC.RELICS[r.relic].desc) : '';
    const potion = r.potion ? chip(r.potionTaken, 'claimpotion', '<div class="potion" style="--pc:' + SC.POTIONS[r.potion].color + '">' + I.svg('flask') + '</div>', SC.POTIONS[r.potion].name, SC.POTIONS[r.potion].desc) : '';
    const takeLabel = picked ? 'Add ' + SC.CARDS[picked].name : 'Pick a card';
    return '<div class="screen">' + UI.hud(g) + '<div class="reward-screen">' +
      '<div class="reward-head"><h2>' + REWARD_TITLE[r.kind] + '</h2><span class="pill gold">' + I.svg('coin') + ' +' + r.gold + '</span>' + relic + potion + '</div>' +
      '<div class="reward-body">' + cards + '</div></div>' +
      '<div class="footer-bar">' +
      (pending ? '<button class="btn secondary" data-act="skipcards">Skip</button><button class="btn good" data-act="takecard" ' + (picked ? '' : 'disabled') + '>' + takeLabel + '</button>'
        : '<button class="btn" data-act="finishreward">Continue</button>') + '</div></div>';
  };

  function leftover(r) { return (r.cards && !r.cardsDone) || (r.relic && !r.relicTaken) || (r.potion && !r.potionTaken); }

  // Once everything is claimed, move on after a short beat so the result is seen.
  function autoFinish() {
    const g = SC.game;
    const r = g.pending && g.pending.reward;
    if (!r || leftover(r)) return;
    UI.sleep(800).then(() => {
      if (SC.game === g && g.screen === 'reward' && g.pending && g.pending.reward === r && !leftover(r) && !UI.s.overlays.length) {
        UI.s.picked = null;
        SC.Flow.finishReward(g);
        UI.render();
      }
    });
  }

  A.rcard = el => {
    if (UI.s.picked === el.dataset.id) { A.takecard(); return; }
    UI.s.picked = el.dataset.id;
    UI.render();
  };
  A.takecard = () => {
    if (UI.s.picked && SC.Flow.claimCard(SC.game, UI.s.picked)) { UI.s.picked = null; UI.render(); autoFinish(); }
  };
  A.skipcards = () => { SC.Flow.skipCards(SC.game); UI.s.picked = null; UI.render(); autoFinish(); };
  A.claimrelic = () => { SC.Flow.claimRelic(SC.game); UI.render(); autoFinish(); };
  A.claimpotion = () => {
    if (!SC.Flow.claimPotion(SC.game)) UI.toast('Potion slots full');
    UI.render();
    autoFinish();
  };
  A.finishreward = () => {
    const g = SC.game;
    const go = () => { UI.s.picked = null; SC.Flow.finishReward(g); UI.render(); };
    if (leftover(g.pending.reward)) UI.confirm('Leave rewards behind?', 'Unclaimed rewards will be lost.', 'Leave', go, 'danger');
    else go();
  };

  // ---------- Shop ----------
  S.shop = function (g) {
    const shop = g.pending.shop;
    const gold = g.player.gold;
    const item = (it, i) => {
      let body;
      if (it.kind === 'card') body = UI.cardHTML({ defId: it.id, upgraded: false }, {});
      else if (it.kind === 'relic') body = '<div class="shop-relic">' + UI.relicHTML(it.id, { act: '', extra: 'big' }) + '</div>';
      else body = '<div class="shop-potion"><div class="potion big" style="--pc:' + SC.POTIONS[it.id].color + '">' + I.svg('flask') + '</div></div>';
      const name = it.kind === 'relic' ? SC.RELICS[it.id].name : it.kind === 'potion' ? SC.POTIONS[it.id].name : '';
      return '<div class="shop-item ' + (it.sold ? 'sold' : '') + ' ' + (gold < it.price ? 'poor' : '') + '" data-act="buyask" data-i="' + i + '">' + body +
        (name ? '<small>' + name + '</small>' : '') + '<span class="price">' + I.svg('coin') + ' ' + it.price + '</span></div>';
    };
    const section = (title, kind) => '<div class="shop-section"><h4>' + title + '</h4><div class="shop-items">' +
      shop.items.map((it, i) => (it.kind === kind ? item(it, i) : '')).join('') + '</div></div>';
    const rp = SC.Shop.removePrice(shop, g);
    return '<div class="screen">' + UI.hud(g) + '<div class="page">' +
      '<h2>The Merchant</h2>' + section('Cards', 'card') + section('Relics', 'relic') + section('Potions', 'potion') +
      '<button class="btn ' + (gold < rp ? 'disabled' : 'secondary') + '" data-act="removeask">Remove a card &middot; ' + rp + ' gold</button></div>' +
      '<div class="footer-bar"><button class="btn" data-act="leave">Leave Shop</button></div></div>';
  };

  A.buyask = el => {
    const g = SC.game;
    const i = +el.dataset.i;
    const it = g.pending.shop.items[i];
    if (it.sold) return;
    const name = it.kind === 'card' ? SC.CARDS[it.id].name : it.kind === 'relic' ? SC.RELICS[it.id].name : SC.POTIONS[it.id].name;
    const desc = it.kind === 'relic' ? SC.RELICS[it.id].desc : it.kind === 'potion' ? SC.POTIONS[it.id].desc : '';
    if (g.player.gold < it.price) { UI.toast('Not enough gold'); return; }
    UI.confirm('Buy ' + name + '?', (desc ? desc + '<br>' : '') + 'Cost: ' + it.price + ' gold.', 'Buy', () => {
      const r = SC.Shop.buy(g, i);
      if (!r.ok) UI.toast(r.reason);
      UI.render();
    });
  };

  A.removeask = () => {
    const g = SC.game;
    const price = SC.Shop.removePrice(g.pending.shop, g);
    if (g.player.gold < price) { UI.toast('Not enough gold'); return; }
    UI.openGrid({ title: 'Remove a card (' + price + ' gold)', cards: g.deck, act: 'removepick' });
  };
  A.removepick = el => {
    const g = SC.game;
    const card = g.deck.find(c => c.uid === el.dataset.uid);
    const price = SC.Shop.removePrice(g.pending.shop, g);
    UI.confirm('Remove ' + SC.cardName(card) + '?', 'This is permanent. Cost: ' + price + ' gold.', 'Remove', () => {
      const r = SC.Shop.remove(g, card.uid);
      if (!r.ok) UI.toast(r.reason);
      UI.render();
    }, 'danger');
  };
  A.leave = () => { SC.Flow.completeNode(SC.game); UI.render(); };

  // ---------- Rest ----------
  S.rest = function (g) {
    const r = g.pending.rest;
    const heal = Math.ceil(g.player.maxHp * SC.CONFIG.restHealPct);
    const canUp = g.deck.some(SC.State.canUpgrade);
    return '<div class="screen">' + UI.hud(g) + '<div class="center-col">' +
      '<h2 style="margin:0;color:var(--gold);font-family:Georgia,serif">Rest Site</h2>' +
      (r.used
        ? '<p class="reward-line">' + r.result + '</p><button class="btn" data-act="leave">Continue</button>'
        : '<p class="subtitle">Choose one.</p><div class="rest-options">' +
          '<div class="big-choice" data-act="rest">' + I.svg('campfire') + '<b>Rest</b><small>Heal ' + heal + ' HP</small></div>' +
          '<div class="big-choice ' + (canUp ? '' : 'disabled') + '" data-act="upgradeopen">' + I.svg('plus') + '<b>Upgrade</b><small>Improve one card</small></div></div>') +
      '</div></div>';
  };
  A.rest = () => { SC.Flow.restHeal(SC.game); UI.render(); };
  A.upgradeopen = () => UI.openGrid({ title: 'Upgrade a card', cards: SC.game.deck.filter(SC.State.canUpgrade), act: 'upgradepick' });
  A.upgradepick = el => {
    const card = SC.game.deck.find(c => c.uid === el.dataset.uid);
    UI.modal('Upgrade ' + SC.CARDS[card.defId].name + '?',
      '<div class="compare">' + UI.cardHTML(card, {}) + '<span class="arrow">&rarr;</span>' + UI.cardHTML({ defId: card.defId, upgraded: true }, {}) + '</div>',
      '<button class="btn secondary" data-act="closeov">Back</button><button class="btn good" data-act="upgradeyes" data-uid="' + card.uid + '">Upgrade</button>');
  };
  A.upgradeyes = el => {
    SC.Flow.restUpgrade(SC.game, el.dataset.uid);
    UI.clearOverlays();
    UI.render();
  };

  // ---------- Event ----------
  S.event = function (g) {
    const ev = g.pending.event;
    const def = SC.EVENTS[ev.id];
    let right;
    if (ev.result) {
      right = '<div class="event-options"><div class="event-text"><p>' + ev.result.text + '</p>' +
        (ev.result.lines.length ? '<ul class="result-lines">' + ev.result.lines.map(l => '<li>' + l + '</li>').join('') + '</ul>' : '') + '</div>' +
        '<button class="btn" data-act="leave">Continue</button></div>';
    } else {
      right = '<div class="event-options">' + def.options.map((o, i) =>
        '<div class="opt-btn ' + (SC.Events.available(g, o) ? '' : 'disabled') + '" data-act="opt" data-i="' + i + '"><b>' + o.text + '</b><small>' + o.hint + '</small></div>').join('') + '</div>';
    }
    return '<div class="screen">' + UI.hud(g) + '<div class="page"><div class="event-layout">' +
      '<div class="event-text"><h2>' + def.title + '</h2><p>' + def.text + '</p></div>' + right + '</div></div></div>';
  };
  A.opt = el => { SC.Flow.eventChoose(SC.game, +el.dataset.i); UI.render(); };

  // ---------- End of run ----------
  function endScreen(g, won) {
    const rs = g.runStats;
    const stat = (l, v) => '<div class="stat"><small>' + l + '</small><b>' + v + '</b></div>';
    const cards = rs.cardsCollected.map(id => '<span class="chip ' + SC.CARDS[id].rarity + '">' + SC.CARDS[id].name + '</span>').join('') || '<span class="chip">None</span>';
    const relics = g.relics.map(r => UI.relicHTML(r.id)).join('') || '<span class="chip">None</span>';
    const boss = rs.bossSeen ? SC.ENEMIES[rs.bossSeen].name : 'Not reached';
    return '<div class="screen"><div class="page"><div class="center-col" style="min-height:100%">' +
      '<h1 class="title">' + (won ? 'VICTORY' : 'DEFEAT') + '</h1>' +
      '<p class="subtitle">' + (won ? 'The Hollow King is no more.' : rs.killedBy ? 'Slain by ' + rs.killedBy + '.' : 'Your run has ended.') + '</p>' +
      '<div class="summary">' + stat('Act reached', g.act) + stat('Floors', g.floor) + stat('Enemies defeated', rs.enemiesDefeated) +
      stat('Elites', rs.elitesDefeated) + stat('Final boss', boss) + stat('Gold', g.player.gold) + stat('Score', SC.State.score(g, won)) + '</div>' +
      '<div style="max-width:760px;width:100%"><small style="color:var(--text2)">CARDS COLLECTED</small><div class="chips">' + cards + '</div></div>' +
      '<div style="max-width:760px;width:100%"><small style="color:var(--text2)">RELICS</small><div class="chips" style="gap:.5em">' + relics + '</div></div>' +
      '</div></div>' +
      '<div class="footer-bar"><button class="btn secondary" data-act="menu">Main Menu</button><button class="btn good" data-act="newrun">New Run</button></div></div>';
  }
  S.victory = g => endScreen(g, true);
  S.defeat = g => endScreen(g, false);
})();
