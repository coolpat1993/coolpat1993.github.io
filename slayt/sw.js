const CACHE = 'shattered-crown-v1';

const CORE = [
  './', 'index.html', 'manifest.json', 'assets/icons/icon.svg', 'assets/icons/sword.svg',
  'css/main.css', 'css/cards.css', 'css/combat.css', 'css/map.css',
  'js/config.js', 'js/rng.js', 'js/cards.js', 'js/enemies.js', 'js/relics.js', 'js/state.js', 'js/combat.js',
  'js/map.js', 'js/rewards.js', 'js/shop.js', 'js/events.js', 'js/flow.js', 'js/save.js',
  'js/ui/icons.js', 'js/ui/card.js', 'js/ui/ui.js', 'js/ui/combat-view.js', 'js/ui/screens.js', 'js/main.js'
];

const IMAGES = ('alpha_crest ancient_stag amulet_of_flux armorer banner_of_command banner_of_mights banner_of_the_brave banshee beast_bond callhorn explosive_arrow_quiver executioners_flail field_scout healer mass_grave soul_collector spirit_hide_armor staff_of_ember sharpened_arrows skull_lantern tome_of_eternal_rot totem_of_the_wild barbarian battlefield_berserker blood_rush bloodsteel_guantlets brutal_axe carrion_bat chainmail claw_gauntlets crushing_blow dark_pact execute fang_nacklace frostbrand_axe gladiators_chains healing_stone hookshot horned_charger hunters_spearhead iron_sword juggernaut_helm mark_prey mercenary orb_of_chaos overwhelm polearm quickblade rageborn_crusher rotting_ghoul scythe_of_sorrow second_wind shield_wall siege_commander spiked_shield spyglass storm_caller tome_of_countering tracking tusked_boar twin_daggers unbreakable_will undying_horror village_guard wailing_banshee war_banner warhammer_of_wrath warlords_guard warpath')
  .split(' ').map(n => 'images/' + n + '.png');

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(cache => Promise.all(CORE.concat(IMAGES).map(u => cache.add(u).catch(() => {})))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Cache-first so the game works offline; refreshed in the background when online.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(hit => {
    const net = fetch(e.request).then(res => {
      if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
