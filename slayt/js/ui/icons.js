window.SC = window.SC || {};
SC.UI = SC.UI || {};

// Simple stroke icons (24x24) so nothing depends on external assets or emoji fonts.
SC.Icons = (function () {
  const P = {
    sword: '<path d="M6 18L19 5M8 12l4 4M4 20l2-2"/><path d="M19 5h-4M19 5v4"/>',
    shield: '<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/>',
    bolt: '<path d="M13 2L5 14h6l-1 8 8-12h-6z"/>',
    heart: '<path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z"/>',
    drop: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
    flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    skull: '<path d="M12 3a8 8 0 0 0-8 8c0 3 1.5 4.5 3 5.5V20h10v-3.5c1.5-1 3-2.5 3-5.5a8 8 0 0 0-8-8z"/><path d="M9 12h.01M15 12h.01"/>',
    hourglass: '<path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/>',
    spike: '<path d="M12 3l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"/>',
    crown: '<path d="M4 18l-1-10 5 4 4-7 4 7 5-4-1 10z"/>',
    up: '<path d="M12 20V6M6 12l6-6 6 6"/>',
    down: '<path d="M12 4v14M6 12l6 6 6-6"/>',
    target: '<circle cx="12" cy="12" r="6"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    crack: '<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/><path d="M12 3l-2 6 3 3-2 5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    wall: '<path d="M3 5h18v14H3zM3 12h18M9 5v7M15 12v7"/>',
    flask: '<path d="M9 3h6M10 3v6l-5 10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2l-5-10V3"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 10h6M9 14h6"/>',
    cards: '<rect x="6" y="4" width="12" height="16" rx="2"/><path d="M3 8v10M21 8v10"/>',
    deck: '<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M9 9h6M9 13h6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14"/>',
    campfire: '<path d="M12 4c1 3 4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 2-4 0 1.5 1 2 1 2 0-2-1-3 1-6z"/><path d="M5 20l14-3M5 17l14 3"/>',
    chest: '<path d="M4 10h16v9H4zM4 10a8 5 0 0 1 16 0M12 13v3"/>',
    bag: '<path d="M6 8h12l1 12H5zM9 8a3 3 0 0 1 6 0"/>',
    question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'
  };
  return {
    inner(name) { return P[name] || P.star; },
    svg(name, cls) {
      return '<svg class="icon ' + (cls || '') + '" viewBox="0 0 24 24" fill="currentColor" fill-opacity=".18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || P.star) + '</svg>';
    }
  };
})();
