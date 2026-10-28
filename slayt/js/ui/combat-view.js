window.SC = window.SC || {};
SC.UI = SC.UI || {};

(function () {
  const SC = window.SC;
  const UI = SC.UI;
  const I = SC.Icons;
  const C = SC.Combat;
  const A = UI.actions;

  const INTENT_ICON = { defend: 'shield', buff: 'up', debuff: 'down', charge: 'hourglass', stun: 'bolt', special: 'bolt' };

  function intentHTML(g, e) {
    const info = C.intentInfo(g, e);
    const val = info.kind === 'attack' ? info.damage + (info.hits > 1 ? '&times;' + info.hits : '') : '';
    const icon = info.kind === 'attack' ? UI.swordIcon() : I.svg(INTENT_ICON[info.kind]);
    return '<div class="intent ' + info.kind + '">' + icon + (val ? '<span>' + val + '</span>' : '') + '</div>';
  }

  function bar(cur, max, cls, loss) {
    const lossPct = loss > 0 ? Math.min(100 * loss / max, 100 * cur / max) : 0;
    return '<div class="hpbar ' + (cls || '') + '"><i style="width:' + Math.max(0, Math.round(100 * cur / max)) + '%"></i>' +
      (lossPct ? '<em class="loss" style="left:' + (100 * cur / max - lossPct) + '%;width:' + lossPct + '%"></em>' : '') +
      '<span>' + cur + '/' + max + '</span></div>';
  }

  // Damage the living enemies will deal on their coming turn, before and after Block.
  function incoming(g) {
    const raw = C.aliveEnemies(g).reduce((n, e) => {
      const i = C.intentInfo(g, e);
      return n + (i.kind === 'attack' ? i.damage * i.hits : 0);
    }, 0);
    return { raw, net: Math.max(0, raw - g.player.block) };
  }

  function damageSources(g) {
    const sources = [];
    const p = g.player;
    const rel = id => g.relics.some(r => r.id === id);
    const passive = SC.PASSIVES[SC.CHARACTERS[p.characterId].passive];
    if (passive && passive.name === 'Momentum' && g.combat.flags.attackCardsCombat === 0) sources.push({ name: 'Momentum', value: '+2 first Attack' });
    if ((p.statuses.strength || 0) > 0) sources.push({ name: 'Strength', value: '+' + p.statuses.strength + ' damage' });
    if (rel('soldiers_banner')) sources.push({ name: "Soldier's Banner", value: '+1 Strength' });
    if (rel('sharpened_edge')) sources.push({ name: 'Sharpened Edge', value: '+1 damage' });
    if (rel('warriors_crest') && g.combat.flags.attackCardsCombat === 0) sources.push({ name: "Warrior's Crest", value: '+5 first Attack' });
    if (rel('blood_compass') && p.hp / p.maxHp < 0.5) sources.push({ name: 'Blood Compass', value: '+20% damage' });
    return sources;
  }

  function enemyHTML(g, e, targeting) {
    const d = SC.ENEMIES[e.id];
    const pendingDeath = e.dead && g.combat.events.some(ev => ev.type === 'death' && ev.target === e.uid);
    const cls = ['enemy', d.elite ? 'elite' : '', d.boss ? 'boss' : '', e.dead && !pendingDeath ? 'dead' : '', pendingDeath ? 'death-pending' : '', targeting && !e.dead ? 'targetable' : ''].join(' ');
    const intent = e.dead
      ? '<div class="intent special" style="visibility:hidden">.</div>'
      : UI.s.enemyIntentSnapshot && UI.s.enemyIntentSnapshot[e.uid] || intentHTML(g, e);
    return '<div class="' + cls + '" data-act="enemy" data-uid="' + e.uid + '" data-target="' + e.uid + '">' +
      intent +
      '<div class="enemy-art" style="background-image:url(\'images/' + d.image + '\')"></div>' +
      '<div class="bars">' + (e.block > 0 ? '<div class="block-chip">' + e.block + '</div>' : '') + bar(e.hp, e.maxHp) + '</div>' +
      '<div class="status-row">' + UI.statusChips(e.statuses) + '</div>' +
      '<div class="unit-name">' + d.name + '</div></div>';
  }

  // Fan layout: arc by index, selected card lifts and neighbours shift aside.
  function cardVars(i, n, sel) {
    const mid = (n - 1) / 2;
    const d = i - mid;
    const step = Math.min(4, 20 / Math.max(n, 1));
    let rot = d * step;
    let ty = 'calc(var(--card-w) * ' + (0.01 * d * d).toFixed(3) + ')';
    let sx = '0px';
    let sc = 1;
    let z = i + 1;
    if (sel >= 0) {
      if (i === sel) { rot = 0; ty = 'calc(var(--card-w) * -0.62)'; sc = 1.3; z = 60; }
      else sx = 'calc(var(--card-w) * ' + (i < sel ? -0.3 : 0.3) + ')';
    }
    return { '--rot': rot.toFixed(2) + 'deg', '--ty': ty, '--sx': sx, '--sc': sc, '--z': z };
  }

  UI.layoutHand = function () {
    const g = SC.game;
    const els = Array.from(document.querySelectorAll('.hand .card'));
    const sel = els.findIndex(el => el.dataset.uid === UI.s.selected);
    els.forEach((el, i) => {
      const v = cardVars(i, els.length, sel);
      Object.keys(v).forEach(k => el.style.setProperty(k, v[k]));
      el.classList.toggle('selected', i === sel);
    });
    const hint = document.getElementById('hint');
    if (hint) hint.style.display = UI.s.targeting ? '' : 'none';
    document.querySelectorAll('.enemy').forEach(el => {
      const e = g.combat.enemies.find(x => x.uid === el.dataset.uid);
      el.classList.toggle('targetable', UI.s.targeting && !!e && !e.dead);
    });
  };

  UI.screens.combat = function (g) {
    const c = g.combat;
    const p = g.player;
    const ch = SC.CHARACTERS[p.characterId];
    UI.s.pendingHp = displayedHpSnapshot();
    if (!c.hand.some(x => x.uid === UI.s.selected)) { UI.s.selected = null; UI.s.targeting = false; }
    const sel = c.hand.findIndex(x => x.uid === UI.s.selected);
    const isPlayerTurn = c.phase === 'player' && !UI.s.busy;
    const inc = incoming(g);
    const canAct = isPlayerTurn && c.hand.some(card => C.canPlay(g, card).ok);
    const incBadge = inc.net > 0 && c.phase === 'player' && !UI.s.enemyTransition
      ? '<div class="incoming danger"><span>-' + inc.net + '</span><small>incoming</small></div>'
      : '';
    const sources = damageSources(g);
    const sourceRow = sources.length
      ? '<div class="damage-sources" aria-label="Active damage bonuses">' + sources.map(s => '<span class="damage-source"><b>' + s.name + '</b><small>' + s.value + '</small></span>').join('') + '</div>'
      : '';

    let delay = 0;
    const hand = (UI.s.enemyTransition ? [] : c.hand).map((card, i) => {
      const can = C.canPlay(g, card);
      const v = cardVars(i, c.hand.length, sel);
      const isNew = !UI.s.seen.has(card.uid);
      if (isNew) delay += 0.07;
      return UI.cardHTML(card, {
        act: 'card',
        live: {
          damage: v => C.calcDamage(g, g.player, { statuses: {}, hp: 1, maxHp: 1 }, v, { isAttack: SC.cardDef(card).type === 'attack', firstHit: true }),
          block: v => C.calcBlock(g, v)
        },
        playable: can.ok && isPlayerTurn,
        disabled: !can.ok,
        selected: i === sel,
        extra: isNew ? 'drawn' : '',
        style: Object.keys(v).map(k => k + ':' + v[k]).join(';') + (isNew ? ';--delay:' + delay.toFixed(2) + 's' : '')
      });
    }).join('');
    if (!UI.s.enemyTransition) UI.s.seen = new Set(c.hand.map(x => x.uid));

    const crystals = Array.from({ length: Math.max(c.maxEnergy, c.energy) }, (_, i) => '<span class="crystal ' + (i < c.energy ? 'on' : '') + '"></span>').join('');
    return '<div class="screen combat">' +
      UI.hud(g, '<span class="turn-label">Turn ' + c.turn + '</span>') +
      '<div class="field" data-act="field">' +
      '<div class="hint" id="hint" style="display:' + (UI.s.targeting ? 'block' : 'none') + '">Choose a target</div>' +
      '<div class="player-side" data-act="player" data-target="player">' +
      '<div class="player-art" style="background-image:url(\'images/' + ch.art + '\')"></div>' + incBadge +
      '<div class="bars">' + (p.block > 0 ? '<div class="block-chip">' + p.block + '</div>' : '') + bar(p.hp, p.maxHp, 'player', c.phase === 'player' ? inc.net : 0) + '</div>' +
      '<div class="status-row">' + UI.statusChips(p.statuses) + '</div>' + sourceRow + '</div>' +
      '<div class="enemies">' + c.enemies.map(e => enemyHTML(g, e, UI.s.targeting)).join('') + '</div>' +
      '</div>' +
      '<div class="hand-zone">' +
      '<div class="energy-wrap"><div class="energy-orb ' + (c.energy === 0 ? 'empty' : '') + '">' + c.energy + '<small>/' + c.maxEnergy + '</small></div><div class="crystals">' + crystals + '</div></div>' +
      '<div class="hand" id="hand" style="--ov:' + (c.hand.length <= 6 ? -0.08 : c.hand.length <= 8 ? -0.3 : -0.45) + '">' + hand + '</div>' +
      '</div>' +
      '<button class="btn ' + (canAct ? 'warn' : 'good') + ' end-turn" data-act="endturn" ' + (isPlayerTurn ? '' : 'disabled') + '>End Turn</button></div>';
  };

  // ---- feedback ----
  function target(id) { return document.querySelector('[data-target="' + id + '"]'); }
  function displayedHpSnapshot() {
    const hp = {};
    document.querySelectorAll('.player-side[data-target], .enemy[data-target]').forEach(unit => {
      const match = unit.querySelector('.hpbar span')?.textContent.match(/^(\d+)\//);
      if (match) hp[unit.dataset.target] = Number(match[1]);
    });
    return hp;
  }

  function setDisplayedHp(id, value, immediate) {
    const unit = target(id);
    const entity = id === 'player' ? SC.game.player : SC.game.combat.enemies.find(e => e.uid === id);
    const hpBar = unit && unit.querySelector('.hpbar');
    const fill = hpBar && hpBar.querySelector('i');
    const label = hpBar && hpBar.querySelector('span');
    if (!entity || !fill || !label) return;
    if (immediate) fill.style.transition = 'none';
    fill.style.width = Math.max(0, Math.round(100 * value / entity.maxHp)) + '%';
    label.textContent = value + '/' + entity.maxHp;
    const loss = hpBar.querySelector('.loss');
    if (loss) loss.style.left = Math.max(0, 100 * value / entity.maxHp - parseFloat(loss.style.width || 0)) + '%';
    if (immediate) requestAnimationFrame(() => requestAnimationFrame(() => fill.style.removeProperty('transition')));
  }

  // Effects live on <body> above everything so a played card never hides them.
  function artRect(el) {
    const art = el.querySelector('.enemy-art, .player-art') || el;
    return art.getBoundingClientRect();
  }
  function popup(id, text, cls, delay) {
    const show = () => {
      const el = target(id);
      if (!el) return;
      const r = artRect(el);
      const p = document.createElement('div');
      p.className = 'popup ' + cls;
      p.textContent = text;
      p.style.left = (r.left + r.width / 2) + 'px';
      p.style.top = (r.top + r.height * 0.3) + 'px';
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1400);
    };
    if (delay > 0) setTimeout(show, delay);
    else show();
  }
  function impact(id, delay) {
    const show = () => {
      const el = target(id);
      if (!el) return;
      const r = artRect(el);
      const fx = document.createElement('div');
      fx.className = 'impact';
      fx.style.cssText = 'left:' + (r.left + r.width / 2) + 'px;top:' + (r.top + r.height / 2) + 'px;width:' + r.width * 1.1 + 'px';
      document.body.appendChild(fx);
      setTimeout(() => fx.remove(), 700);
    };
    if (delay > 0) setTimeout(show, delay);
    else show();
  }

  function buffPulse(el, delay) {
    if (!el) return;
    setTimeout(() => {
      el.classList.remove('buffing');
      void el.offsetWidth;
      el.classList.add('buffing');
      setTimeout(() => el.classList.remove('buffing'), 900);
    }, delay || 0);
  }

  UI.drainEvents = function () {
    const c = SC.game.combat;
    if (!c) return;
    const evs = c.events.splice(0);
    const displayedHp = UI.s.pendingHp || {};
    UI.s.pendingHp = null;
    const damageHp = {};
    let attackImpactAt = null;
    evs.forEach((ev, i) => {
      let d = i * 70;
      const el = ev.target ? target(ev.target) : null;
      if (ev.type === 'playerAttack') {
        attackImpactAt = d + 330;
        const playerSide = document.querySelector('.player-side');
        if (playerSide) {
          playerSide.classList.remove('attacking');
          void playerSide.offsetWidth;
          playerSide.classList.add('attacking');
          setTimeout(() => playerSide.classList.remove('attacking'), 640);
        }
        if (el) {
          el.classList.remove('player-targeted');
          void el.offsetWidth;
          el.classList.add('player-targeted');
          setTimeout(() => el.classList.remove('player-targeted'), 760);
        }
      } else if (ev.type === 'playerBuff') {
        buffPulse(document.querySelector('.player-side'), d);
      } else if (ev.type === 'damage') {
        const delayedDamage = attackImpactAt !== null;
        if (delayedDamage) d = Math.max(d, attackImpactAt);
        if (ev.amount > 0) {
          if (delayedDamage) {
            const entity = ev.target === 'player' ? SC.game.player : c.enemies.find(e => e.uid === ev.target);
            if (damageHp[ev.target] === undefined) {
              damageHp[ev.target] = displayedHp[ev.target] ?? Math.min(entity.maxHp, entity.hp + ev.amount);
              setDisplayedHp(ev.target, damageHp[ev.target], true);
            }
            damageHp[ev.target] = Math.max(0, damageHp[ev.target] - ev.amount);
            const hpAtImpact = damageHp[ev.target];
            setTimeout(() => setDisplayedHp(ev.target, hpAtImpact), d);
          }
          popup(ev.target, '-' + ev.amount, 'dmg' + (ev.amount >= 10 ? ' big' : ''), d);
          if (el) {
            impact(ev.target, d);
            setTimeout(() => {
              const hitTarget = target(ev.target);
              if (!hitTarget) return;
              hitTarget.classList.remove('hit'); void hitTarget.offsetWidth; hitTarget.classList.add('hit');
            }, d);
          }
        }
        else if (ev.blocked > 0) popup(ev.target, 'Blocked', 'blk', d);
      } else if (ev.type === 'block') {
        popup(ev.target, '+' + ev.amount, 'blk', d);
        buffPulse(ev.target === 'player' ? document.querySelector('.player-side') : el, d);
      } else if (ev.type === 'death') {
        const deathDelay = attackImpactAt === null ? d : Math.max(d, attackImpactAt);
        if (el) setTimeout(() => {
          el.classList.remove('death-pending');
          el.classList.add('dead');
        }, deathDelay);
      }
      else if (ev.type === 'heal') popup(ev.target, '+' + ev.amount, 'heal', d);
      else if (ev.type === 'enemyAct' && el) {
        el.classList.add('acting');
        if (ev.attack) {
          el.classList.add('attacking');
          attackImpactAt = d + 475;
        } else attackImpactAt = null;
      }
      else if (ev.type === 'stunned') popup(ev.target, 'Stunned', 'txt', d);
      else if (ev.type === 'status' && ev.value !== 0) popup(ev.target, (ev.value > 0 ? '+' : '') + ev.value + ' ' + SC.STATUSES[ev.status].name, 'txt', d);
    });
  };

  UI.flyCard = function (el) {
    const r = el.getBoundingClientRect();
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const clone = el.cloneNode(true);
    clone.className = clone.className.replace(/\b(selected|drawn|playable)\b/g, '') + ' card-fly';
    clone.removeAttribute('data-act');
    clone.style.cssText = '--card-w:' + w + 'px;position:fixed;margin:0;z-index:150;pointer-events:none;left:' + (r.left + r.width / 2 - w / 2) + 'px;top:' + (r.top + r.height / 2 - h / 2) + 'px';
    document.body.appendChild(clone);
    setTimeout(() => clone.remove(), 480);
  };

  UI.afterCombatRender = function (g) {
    const c = g.combat;
    if (!c) return;
    UI.drainEvents();
    if (['won', 'lost', 'fled'].includes(c.phase) && !UI.s.resolving) {
      UI.s.resolving = true;
      setTimeout(() => {
        UI.s.resolving = false;
        UI.s.busy = false;
        UI.s.selected = null;
        UI.s.targeting = false;
        UI.s.seen = new Set();
        SC.Flow.resolveCombat(g);
        UI.render();
      }, c.phase === 'won' ? 1800 : 1000);
    } else if (c.phase === 'enemy' && !UI.s.busy) {
      UI.runEnemyPhase();
    }
  };

  UI.runEnemyPhase = async function () {
    const g = SC.game;
    UI.s.busy = true;
    const previousIntents = {};
    document.querySelectorAll('.enemy[data-uid] .intent').forEach(el => {
      const unit = el.closest('.enemy[data-uid]');
      if (unit) previousIntents[unit.dataset.uid] = el.outerHTML;
    });
    UI.s.enemyIntentSnapshot = previousIntents;
    UI.s.enemyTransition = true;
    while (g.combat && g.combat.phase === 'enemy') {
      await UI.sleep(300);
      if (SC.game !== g || !g.combat) break;
      C.stepEnemy(g);
      const playerTurnStarted = g.combat && g.combat.phase === 'player';
      if (!g.combat || (g.combat.phase !== 'enemy' && !playerTurnStarted)) UI.s.busy = false;
      UI.render();
      await UI.sleep(playerTurnStarted ? 1750 : 850);
      if (SC.game !== g || !g.combat) break;
      if (playerTurnStarted) {
        if (g.combat.phase !== 'player') break;
        UI.s.enemyIntentSnapshot = null;
        UI.s.enemyTransition = false;
        UI.s.busy = false;
        UI.render();
        break;
      }
    }
    UI.s.busy = false;
    if (!g.combat || g.combat.phase !== 'player') {
      UI.s.enemyIntentSnapshot = null;
      UI.s.enemyTransition = false;
    }
  };

  // ---- actions ----
  function playSelected(uid, targetUid) {
    const g = SC.game;
    const el = document.querySelector('.hand .card[data-uid="' + uid + '"]');
    const res = C.playCard(g, uid, targetUid || undefined);
    if (!res.ok) { UI.toast(res.reason); return; }
    if (el) UI.flyCard(el);
    UI.s.selected = null;
    UI.s.targeting = false;
    UI.render();
  }

  A.card = el => {
    const g = SC.game;
    const c = g.combat;
    if (!c || c.phase !== 'player' || UI.s.busy || UI.s.justDragged) return;
    const uid = el.dataset.uid;
    if (UI.s.selected !== uid) {
      UI.s.selected = uid;
      UI.s.targeting = false;
      UI.layoutHand();
      return;
    }
    const card = c.hand.find(x => x.uid === uid);
    const can = C.canPlay(g, card);
    if (!can.ok) {
      UI.toast(can.reason);
      el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
      return;
    }
    if (SC.needsTarget(SC.cardDef(card)) && C.aliveEnemies(g).length > 1) {
      UI.s.targeting = !UI.s.targeting;
      UI.layoutHand();
      return;
    }
    playSelected(uid, null);
  };

  A.enemy = el => {
    const g = SC.game;
    const c = g.combat;
    const e = c.enemies.find(x => x.uid === el.dataset.uid);
    if (!e || e.dead) return;
    if (UI.s.targeting && UI.s.selected && c.phase === 'player' && !UI.s.busy) { playSelected(UI.s.selected, e.uid); return; }
    const info = C.intentInfo(g, e);
    const move = SC.ENEMIES[e.id].moves[e.move];
    const detail = info.kind === 'attack' ? 'Attacks for ' + info.damage + (info.hits > 1 ? ' x ' + info.hits : '') : info.kind === 'stun' ? 'Stunned: skips its action' : info.kind;
    UI.modal(e.name, '<p>HP ' + e.hp + '/' + e.maxHp + (e.block ? ' &middot; Block ' + e.block : '') + '</p>' +
      '<p><b>Next:</b> ' + (move ? move.name : '') + ' (' + detail + ')</p>' + UI.statusList(e.statuses));
  };

  A.player = () => {
    const p = SC.game.player;
    UI.modal(SC.CHARACTERS[p.characterId].name,
      '<p>HP ' + p.hp + '/' + p.maxHp + (p.block ? ' &middot; Block ' + p.block : '') + '</p>' +
      '<p><b>' + SC.CHARACTERS[p.characterId].passiveName + ':</b> ' + SC.CHARACTERS[p.characterId].passiveText + '</p>' + UI.statusList(p.statuses));
  };

  A.field = () => {
    if (UI.s.selected) { UI.s.selected = null; UI.s.targeting = false; UI.layoutHand(); }
  };

  A.endturn = async () => {
    const g = SC.game;
    const c = g.combat;
    if (!c || c.phase !== 'player' || UI.s.busy) return;
    UI.s.selected = null;
    UI.s.targeting = false;
    if (!C.endPlayerTurn(g)) return;
    UI.render();
  };

  A.pile = el => {
    const c = SC.game.combat;
    const key = el.dataset.pile;
    const cards = key === 'draw' ? c.draw.slice().sort((a, b) => SC.cardName(a) < SC.cardName(b) ? -1 : 1) : c[key];
    UI.openGrid({ title: { draw: 'Draw Pile (order hidden)', discard: 'Discard Pile', exhaust: 'Exhausted' }[key] + ' - ' + cards.length, cards, act: 'viewcard', sortable: key !== 'draw' });
  };

  // ---- drag a card onto an enemy (or above the hand) to cast it ----
  let drag = null;

  function setHover(en) {
    document.querySelectorAll('.enemy.drop-hover').forEach(x => { if (x !== en) x.classList.remove('drop-hover'); });
    if (en) en.classList.add('drop-hover');
  }

  function endDrag(d, play, e) {
    const hint = document.getElementById('hint');
    if (hint) hint.textContent = 'Choose a target';
    setHover(null);
    if (play) { playSelected(d.uid, play.target); return; }
    d.el.style.translate = '';
    d.el.style.pointerEvents = '';
    d.el.style.transition = '';
    UI.s.selected = null;
    UI.s.targeting = false;
    UI.layoutHand();
  }

  document.addEventListener('pointerdown', e => {
    const el = e.target.closest && e.target.closest('.hand .card');
    const g = SC.game;
    if (!el || !g || !g.combat || g.combat.phase !== 'player' || UI.s.busy || e.button > 0) return;
    drag = { el, uid: el.dataset.uid, x: e.clientX, y: e.clientY, active: false, id: e.pointerId };
  });

  document.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.active) {
      if (Math.hypot(dx, dy) < 10) return;
      const g = SC.game;
      drag.active = true;
      drag.card = g.combat.hand.find(c => c.uid === drag.uid);
      drag.needsTarget = SC.needsTarget(SC.cardDef(drag.card));
      UI.s.selected = null;
      UI.s.targeting = drag.needsTarget && C.aliveEnemies(g).length > 1;
      UI.layoutHand();
      try { drag.el.setPointerCapture(e.pointerId); } catch (err) { /* capture is optional */ }
      const hint = document.getElementById('hint');
      if (hint) { hint.textContent = drag.needsTarget ? 'Drop on an enemy' : 'Release above your hand to play'; hint.style.display = ''; }
      drag.el.style.transition = 'none';
      drag.el.style.pointerEvents = 'none';
      drag.el.style.setProperty('--rot', '0deg');
      drag.el.style.setProperty('--sc', '1.12');
      drag.el.style.setProperty('--z', '120');
    }
    drag.el.style.translate = dx + 'px ' + dy + 'px';
    setHover(drag.needsTarget ? enemyAt(e.clientX, e.clientY) : null);
  });

  function enemyAt(x, y) {
    const el = document.elementFromPoint(x, y);
    return el ? el.closest('.enemy:not(.dead)') : null;
  }

  function finishDrag(e, cancelled) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (!d.active) return;
    UI.s.justDragged = true;
    setTimeout(() => { UI.s.justDragged = false; }, 80);
    const g = SC.game;
    const zone = document.querySelector('.hand-zone');
    const above = e.clientY < (zone ? zone.getBoundingClientRect().top : window.innerHeight * 0.6);
    const en = cancelled ? null : enemyAt(e.clientX, e.clientY);
    const alive = C.aliveEnemies(g);
    let play = null;
    if (!cancelled) {
      if (d.needsTarget) {
        if (en) play = { target: en.dataset.uid };
        else if (alive.length === 1 && above) play = { target: alive[0].uid };
      } else if (above || en) play = { target: null };
    }
    if (play) {
      const can = C.canPlay(g, d.card);
      if (!can.ok) { UI.toast(can.reason); play = null; }
    }
    endDrag(d, play);
  }

  document.addEventListener('pointerup', e => finishDrag(e, false));
  document.addEventListener('pointercancel', e => finishDrag(e, true));
})();
