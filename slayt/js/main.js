window.SC = window.SC || {};

(function () {
  const SC = window.SC;
  const UI = SC.UI;

  function boot() {
    if (SC.Save.settings().reduceMotion) document.body.classList.add('reduce-motion');
    const loaded = SC.Save.loadRun();
    SC.game = loaded.state || null;
    if (loaded.error) UI.s.notice = loaded.error;
    UI.s.view = 'menu';

    document.addEventListener('click', e => {
      const el = e.target.closest('[data-act]');
      if (!el) return;
      const fn = UI.actions[el.dataset.act];
      if (fn) fn(el, e);
    });

    UI.render();

    // Rotation is not a user gesture, so if the browser refuses, retry on the next tap.
    const wantFullscreen = () => {
      if (!UI.isMobile() || window.innerWidth <= window.innerHeight || UI.inFullscreen()) return;
      UI.enterFullscreen().catch(() => {
        document.addEventListener('pointerup', () => { if (window.innerWidth > window.innerHeight) UI.enterFullscreen().catch(() => {}); }, { once: true });
      });
    };
    window.addEventListener('orientationchange', () => setTimeout(wantFullscreen, 200));
    if (window.matchMedia) window.matchMedia('(orientation: landscape)').addEventListener('change', e => { if (e.matches) wantFullscreen(); });
    if (UI.isMobile()) document.addEventListener('pointerup', () => { if (window.innerWidth > window.innerHeight && !UI.s.fsTried) { UI.s.fsTried = true; UI.enterFullscreen().catch(() => {}); } }, { once: true });
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  window.addEventListener('DOMContentLoaded', boot);
})();
