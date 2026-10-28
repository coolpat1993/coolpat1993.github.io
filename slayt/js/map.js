window.SC = window.SC || {};

(function () {
  const SC = window.SC;
  const R = SC.RNG;

  SC.Map = {
    generate(seed, act) {
      const cfg = SC.CONFIG.map;
      const s = R.make((seed + (act || 1) * 1013904223) | 0);
      const rows = cfg.rows;
      const lanes = cfg.lanes;
      const nodes = {};

      const node = (r, l) => {
        const id = r + '_' + l;
        if (!nodes[id]) nodes[id] = { id, row: r, lane: l, type: 'combat', next: [], done: false };
        return nodes[id];
      };
      const boss = { id: 'boss', row: rows, lane: Math.floor(lanes / 2), type: 'boss', next: [], done: false };
      nodes.boss = boss;

      const crosses = (r, from, to) => Object.values(nodes).some(n => {
        if (n.row !== r || n.id === 'boss') return false;
        return n.next.some(nid => {
          const lb = nodes[nid].lane;
          return (n.lane < from && lb > to) || (n.lane > from && lb < to);
        });
      });

      const starts = R.shuffle(s, Array.from({ length: lanes }, (_, i) => i)).slice(0, Math.min(3, lanes));
      while (starts.length < cfg.paths) starts.push(R.int(s, lanes));

      for (const start of starts) {
        let l = start;
        for (let r = 0; r < rows; r++) {
          const cur = node(r, l);
          if (r === rows - 1) {
            if (!cur.next.includes('boss')) cur.next.push('boss');
            break;
          }
          const cand = R.shuffle(s, [l - 1, l, l + 1].filter(x => x >= 0 && x < lanes));
          const nl = cand.find(x => !crosses(r, l, x)) ?? cand[0];
          const nxt = node(r + 1, nl);
          if (!cur.next.includes(nxt.id)) cur.next.push(nxt.id);
          l = nl;
        }
      }

      const list = Object.values(nodes).filter(n => n.id !== 'boss').sort((a, b) => a.row - b.row || a.lane - b.lane);
      const parents = {};
      list.forEach(n => n.next.forEach(id => { (parents[id] = parents[id] || []).push(n); }));

      list.forEach(n => {
        if (n.row === 0) { n.type = 'combat'; return; }
        if (n.row === rows - 1) { n.type = 'rest'; return; }
        if (n.row === Math.floor(rows / 2)) { n.type = 'treasure'; return; }
        const w = [['combat', 45], ['event', 22]];
        const parentTypes = (parents[n.id] || []).map(p => p.type);
        const ok = t => !parentTypes.includes(t);
        if (n.row >= 2 && n.row !== rows - 2 && ok('rest')) w.push(['rest', 12]);
        if (n.row >= 2 && n.row !== rows - 2 && ok('shop')) w.push(['shop', 8]);
        if (n.row >= 3 && ok('elite')) w.push(['elite', 16]);
        n.type = R.weighted(s, w);
      });

      ['shop', 'elite'].forEach(type => {
        if (list.some(n => n.type === type)) return;
        const c = list.filter(n => n.row >= 3 && n.row <= rows - 3 && (n.type === 'combat' || n.type === 'event'));
        if (c.length) R.pick(s, c).type = type;
      });

      return { rows, lanes, nodes, bossId: 'boss' };
    },

    available(state) {
      const m = state.map;
      if (!state.currentNode) return Object.values(m.nodes).filter(n => n.row === 0).map(n => n.id);
      const cur = m.nodes[state.currentNode];
      return cur.done ? cur.next.slice() : [];
    }
  };
})();
