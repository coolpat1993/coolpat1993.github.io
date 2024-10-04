const additionalItems = [
  {
    name: "Mechano-Enhanced Powerfists",
    itemSlot: "Gloves",
    class: "Warrior",
    rarity: "Epic",
    effect:
      "On use: Gain 30% increased attack speed and reduce damage taken by 10% for 6 seconds. After the duration, take 10% extra damage for 3 seconds.",
  },
  {
    name: "Gnomish Rocket Boots",
    itemSlot: "Boots",
    class: "Neutral",
    rarity: "Rare",
    effect:
      "On use: Dash forward 20 yards, leaving a trail of flames that deals damage to enemies in your path.",
  },
  {
    name: "Boom-Bot Launcher",
    itemSlot: "Trinket",
    class: "Hunter",
    rarity: "Legendary",
    effect:
      "On use: Launch 2 Boom Bots that explode when they hit an enemy, dealing random damage between 5% and 20% of the enemy's health.",
  },
  {
    name: "Explosive Sheep Cloak",
    itemSlot: "Cloak",
    class: "Warlock",
    rarity: "Common",
    effect:
      "When struck by a melee attack, summon an explosive sheep that detonates after 3 seconds, dealing AoE damage to enemies.",
  },
  {
    name: "Goblin Tech Bracers",
    itemSlot: "Bracers",
    class: "Rogue",
    rarity: "Epic",
    effect:
      "Every 10 seconds, fire a random gizmo at a nearby enemy, dealing 10% of your weapon damage.",
  },
  {
    name: "Shielded Mech Helmet",
    itemSlot: "Helmet",
    class: "Paladin",
    rarity: "Rare",
    effect:
      "On critical hit, summon a shielded robot companion that absorbs 20% of incoming damage for 10 seconds.",
  },
  {
    name: "Micromachine Chestguard",
    itemSlot: "Chest",
    class: "Warrior",
    rarity: "Epic",
    effect:
      "Reduces incoming physical damage by 20%. Every time you're hit, gain 1% increased damage for 10 seconds (stacks up to 10 times).",
  },
  {
    name: "Tinker's Treads",
    itemSlot: "Boots",
    class: "Neutral",
    rarity: "Common",
    effect:
      "On use: Gain a 25% movement speed boost for 5 seconds. Upon expiration, deal 5% of your max health as AoE damage to nearby enemies.",
  },
  {
    name: "Shrink Ray Goggles",
    itemSlot: "Helmet",
    class: "Neutral",
    rarity: "Rare",
    effect:
      "On use: Shrink an enemy, reducing their damage by 30% and movement speed by 20% for 10 seconds.",
  },
  {
    name: "Annoy-o-Tron Shoulder",
    itemSlot: "Shoulder",
    class: "Paladin",
    rarity: "Epic",
    effect:
      "Summon a small mech companion with a shield. The companion taunts enemies and absorbs up to 15% of damage dealt to you.",
  },
  {
    name: "Goblin Blast Gloves",
    itemSlot: "Gloves",
    class: "Mage",
    rarity: "Rare",
    effect:
      "On use: Launch a fireball that deals random damage between 5% and 15% of an enemy's health. May backfire and deal 5% of your own health in damage.",
  },
  {
    name: "Gnome Engineer's Belt",
    itemSlot: "Belt",
    class: "Neutral",
    rarity: "Epic",
    effect:
      "On use: Activate a random gadget: Rocket Boost, Turbo Heal, or Disorienting Ray (each with unpredictable effects).",
  },
  {
    name: "Matter Displacer Ring",
    itemSlot: "Ring",
    class: "Warlock",
    rarity: "Legendary",
    effect:
      "On use: Teleport an enemy to a random spot within 20 yards. They are stunned for 2 seconds upon landing.",
  },
  {
    name: "Overcharged Tesla Bracers",
    itemSlot: "Bracers",
    class: "Shaman",
    rarity: "Rare",
    effect:
      "Every 5 attacks, release a chain lightning bolt that strikes 3 nearby enemies, dealing damage and reducing their movement speed by 10%.",
  },
  {
    name: "Mega Bomb Helmet",
    itemSlot: "Helmet",
    class: "Hunter",
    rarity: "Epic",
    effect:
      "On use: Place a proximity bomb on the ground. Explodes when an enemy is near, dealing massive damage to all enemies in range.",
  },
  {
    name: "Jeeves' Portable Repair Kit",
    itemSlot: "Trinket",
    class: "Neutral",
    rarity: "Rare",
    effect:
      "On use: Summon Jeeves, who restores 30% of your health and repairs damaged armor over 10 seconds.",
  },
  {
    name: "Whirling Blades Shoulder",
    itemSlot: "Shoulder",
    class: "Rogue",
    rarity: "Epic",
    effect:
      "On use: Fire spinning blades in all directions, dealing damage to all enemies within 10 yards. The blades return, dealing damage a second time.",
  },
  {
    name: "Scrapbot Infusion Bracers",
    itemSlot: "Bracers",
    class: "Druid",
    rarity: "Epic",
    effect:
      "On use: Summon a Scrapbot that heals for 10% of your max health and repairs damaged gear over 10 seconds.",
  },
  {
    name: "Goblin Mortar Boots",
    itemSlot: "Boots",
    class: "Warrior",
    rarity: "Rare",
    effect:
      "On use: Leap forward 15 yards and launch a mortar shell at your original location, dealing AoE damage.",
  },
  {
    name: "Repair-O-Matic Shield Generator",
    itemSlot: "Trinket",
    class: "Paladin",
    rarity: "Legendary",
    effect:
      "On use: Create a shield around yourself that absorbs 20% of all incoming damage for 10 seconds. If the shield breaks, it explodes, dealing AoE damage to enemies.",
  },
  {
    name: "Poison Touch",
    itemSlot: "Gloves",
    class: "Rogue",
    rarity: "Rare",
    effect:
      "Apply a deadly poison to the foe. After 10 seconds, if the opponent is under 25% health, they die instantly.",
  },
  {
    name: "Baited Trap",
    itemSlot: "Trinket",
    class: "Hunter",
    rarity: "Common",
    effect:
      "Plant a trap dealing damage to the first person who triggers it and summon a hungry wolf to attack them for 10 seconds.",
  },
  {
    name: "Blood Sworn Helmet",
    itemSlot: "Helmet",
    class: "Paladin",
    rarity: "Common",
    effect:
      "Deal 100% weapon damage to a foe and heal for 50% of the damage dealt.",
  },
  {
    name: "Chaotic Missile Gloves",
    itemSlot: "Gloves",
    class: "Neutral",
    rarity: "Epic",
    effect:
      "2-minute cooldown. Fire 4 missiles dealing random damage to enemies within 10 yards. Each shot deals 20% of your total damage. May backfire and hit the user.",
  },
  {
    name: "Healing Chest",
    itemSlot: "Chest",
    class: "Neutral",
    rarity: "Common",
    effect:
      "When activated, heal everyone within 10 yards for 30% of their total health.",
  },
  {
    name: "Commune with the Elements",
    itemSlot: "Ring",
    class: "Shaman",
    rarity: "Rare",
    effect:
      "Grants a random elemental buff: Fire (bonus fire damage), Frost (slows movement and attack speed by 20%), Earth (gain earth shield reducing damage by 20% per stack), Air (reduces the chance to be hit by 50% for 10 seconds).",
  },
  {
    name: "Vengeful Imp Cloak",
    itemSlot: "Cloak",
    class: "Warlock",
    rarity: "Rare",
    effect:
      "When hit, you have a chance to summon a vengeful imp that pursues and attacks your attacker.",
  },
  {
    name: "Hit and Run",
    itemSlot: "Gloves",
    class: "Neutral",
    rarity: "Common",
    effect:
      "First melee attack in 5 seconds grants a burst of speed, increasing movement by 15% and attack speed by 10% for 5 seconds.",
  },
  {
    name: "Gauntlets of Dominion",
    itemSlot: "Bracers",
    class: "Neutral",
    rarity: "Epic",
    effect:
      "When your health falls below 50%, gain control of an enemy minion (once per game).",
  },
  {
    name: "Sturdy Leather Boots",
    itemSlot: "Boots",
    class: "Neutral",
    rarity: "Common",
    effect:
      "For 5 seconds after using a movement ability, gain a 10% increase to movement speed.",
  },
  {
    name: "Sylvan Spiritform",
    itemSlot: "Helmet + Chest + Legs",
    class: "Druid",
    rarity: "Legendary",
    effect:
      "After casting 10 bleed effects, 5 healing spells, and 15 offensive spells, enter Spirit of the Forest mode for 15 seconds. Deal nature and bleed damage to nearby enemies. Heal for 5% of max health every 2 seconds. Immune to stuns, silences, and roots.",
  },
  {
    name: "Reckless Provocation",
    itemSlot: "Bracers",
    class: "Warrior",
    rarity: "Rare",
    effect:
      "On-use: Hurl insults, causing the foe to target you for 10 seconds. During this time, take 20% increased damage.",
  },
  {
    name: "Charge Reset Boots",
    itemSlot: "Boots",
    class: "Warrior",
    rarity: "Common",
    effect:
      "For 5 seconds after using Charge, any snare or slow will reset the cooldown of Charge.",
  },
  {
    name: "Ring of Unstable Energies",
    itemSlot: "Ring",
    class: "Neutral",
    rarity: "Rare",
    effect:
      "On-use: Explodes, dealing 50% of your current health as damage to all nearby enemies and reducing your health to 1%.",
  },
  {
    name: "Meta Adaptation",
    itemSlot: "Bracers",
    class: "Warrior",
    rarity: "Common",
    effect:
      "Gain 5% stacking damage for every enemy minion killed, ideal against minion-summoning foes like Warlock.",
  },
  {
    name: "Elemental Overload",
    itemSlot: "Weapon + Shoulder + Trinket",
    class: "Shaman",
    rarity: "Legendary",
    effect:
      "After taking X amount of damage, transform into an elemental, increasing damage by 100% for 15 seconds. Requires multiple gear slots to activate.",
  },
  {
    name: "Attack Speed Build",
    itemSlot: "Shoulder",
    class: "Warrior",
    rarity: "Rare",
    effect:
      "For every hit taken, gain 10% armor, stacking until 3 seconds without taking damage.",
  },
  {
    name: "Theft of Power",
    itemSlot: "Gloves",
    class: "Neutral",
    rarity: "Legendary",
    effect:
      "For the next 10 seconds, any legendary effect applied to an opponent is stolen and applied to the user.",
  },
  {
    name: "Claw of the Elder Drake",
    itemSlot: "Weapon",
    class: "Warrior",
    rarity: "Legendary",
    effect:
      "On use: Strike an enemy with the fury of an ancient dragon, dealing 200% weapon damage. If the target is below 20% health, execute them instantly.",
  },
  {
    name: "Stormwing Harness",
    itemSlot: "Chest",
    class: "Hunter",
    rarity: "Epic",
    effect:
      "On use: Summon a tempestuous dragon mount for 10 seconds, increasing your movement speed by 100% and allowing you to perform ranged attacks while mounted.",
  },
  {
    name: "Arcane Tempest Relic",
    itemSlot: "Trinket",
    class: "Mage",
    rarity: "Legendary",
    effect:
      "On use: Release a blast of raw arcane energy in a cone, dealing damage equal to 25% of your total mana to all enemies hit. Restores 10% of your mana for each enemy struck.",
  },
  {
    name: "Chrono-Stasis Pendant",
    itemSlot: "Trinket",
    class: "Neutral",
    rarity: "Epic",
    effect:
      "On use: Freeze time for 5 seconds, preventing all movement and attacks for both enemies and allies. Any cooldowns or damage-over-time effects are paused during this duration.",
  },
  {
    name: "Wyrmguard Shoulder",
    itemSlot: "Shoulder",
    class: "Paladin",
    rarity: "Epic",
    effect:
      "On use: Gain a protective dragon wing barrier, absorbing 15% of incoming damage for 8 seconds. While active, enemies striking you are burned for 5% of your health as fire damage.",
  },
  {
    name: "Flamewrought Gauntlets",
    itemSlot: "Gloves",
    class: "Shaman",
    rarity: "Rare",
    effect:
      "On use: Summon a fiery explosion around you, dealing fire damage to nearby enemies and reducing their healing received by 30% for 6 seconds.",
  },
  {
    name: "Twilight Drake Cloak",
    itemSlot: "Cloak",
    class: "Warlock",
    rarity: "Legendary",
    effect:
      "When struck by a spell, gain a shadowy shield that absorbs 20% of magic damage for 10 seconds. If the shield breaks, it explodes in shadow flames, dealing AoE damage.",
  },
  {
    name: "Embercore Bracers",
    itemSlot: "Bracers",
    class: "Warrior",
    rarity: "Epic",
    effect:
      "Each time you take fire damage, you gain a stack of 'Embercore Fury', increasing your attack speed by 2% per stack for 10 seconds (stacks up to 10 times).",
  },
  {
    name: "Stormcaller's Treads",
    itemSlot: "Boots",
    class: "Shaman",
    rarity: "Rare",
    effect:
      "On use: Summon a lightning storm in your path, dealing nature damage to enemies you pass through and slowing them by 20% for 4 seconds.",
  },
  {
    name: "Draconic Catalyst Ring",
    itemSlot: "Ring",
    class: "Mage",
    rarity: "Epic",
    effect:
      "On use: Transform into a dragon for 10 seconds, gaining 25% spell power and immunity to crowd control effects. While in dragon form, spells have a chance to ignite enemies, dealing fire damage over time.",
  },
  {
    name: "Scaled Guardian Helmet",
    itemSlot: "Helmet",
    class: "Paladin",
    rarity: "Epic",
    effect:
      "On critical hit, summon a draconic guardian that absorbs 15% of damage for 10 seconds. When the guardian expires, it explodes, healing allies for 10% of their max health.",
  },
  {
    name: "Crystal-Infused Heart",
    itemSlot: "Trinket",
    class: "Neutral",
    rarity: "Legendary",
    effect:
      "On use: Grant yourself a crystal shield, absorbing up to 20% of your max health in damage. If the shield is destroyed, all nearby allies are healed for the damage absorbed.",
  },
  {
    name: "Skyfire Brooch",
    itemSlot: "Neck",
    class: "Hunter",
    rarity: "Rare",
    effect:
      "On use: Fire a piercing shot that travels in a straight line, dealing damage to all enemies hit and marking them, increasing damage taken from your attacks by 10% for 8 seconds.",
  },
  {
    name: "Scalebreaker Gauntlets",
    itemSlot: "Gloves",
    class: "Warrior",
    rarity: "Epic",
    effect:
      "Each time you parry an attack, deal 5% of your weapon damage as fire damage to the attacker and reduce the cooldown of your next offensive ability by 1 second.",
  },
  {
    name: "Vortexborn Leggings",
    itemSlot: "Legs",
    class: "Druid",
    rarity: "Epic",
    effect:
      "On use: Summon a vortex of wind around you, increasing your dodge chance by 30% and dealing nature damage to all enemies in a 10-yard radius for 8 seconds.",
  },
  {
    name: "Molten Wyrmhide Belt",
    itemSlot: "Belt",
    class: "Neutral",
    rarity: "Epic",
    effect:
      "On use: Absorb 15% of incoming fire damage for 6 seconds. Afterward, unleash the stored damage as a fiery explosion, dealing AoE damage to enemies around you.",
  },
  {
    name: "Draconic Wildshape Pendant",
    itemSlot: "Neck",
    class: "Druid",
    rarity: "Legendary",
    effect:
      "On use: Transform into a dragon for 10 seconds, gaining 50% increased attack power and the ability to breathe fire, dealing AoE damage to nearby enemies.",
  },
  {
    name: "Verdant Dragonheart Boots",
    itemSlot: "Boots",
    class: "Druid",
    rarity: "Epic",
    effect:
      "Increases movement speed by 20% and grants the ability to leave a trail of healing flowers, restoring 5% health to allies who walk through them.",
  },
  {
    name: "Claw of the Emerald Wyrm",
    itemSlot: "Weapon",
    class: "Druid",
    rarity: "Epic",
    effect:
      "Attacks have a chance to deal additional nature damage and heal the user for 10% of the damage dealt.",
  },
  {
    name: "Wyrmcaller’s Barkskin",
    itemSlot: "Chest",
    class: "Druid",
    rarity: "Rare",
    effect:
      "Activate to gain a shield absorbing 30% of your health for 8 seconds. During this time, all healing received is increased by 20%.",
  },
  {
    name: "Dragon's Breath Ring",
    itemSlot: "Ring",
    class: "Druid",
    rarity: "Rare",
    effect:
      "On use: Channel the breath of dragons, dealing fire damage to enemies in a cone and reducing their movement speed by 30% for 5 seconds.",
  },
  {
    name: "Ravenous Dragonfruit",
    itemSlot: "Trinket",
    class: "Druid",
    rarity: "Legendary",
    effect:
      "When activated, instantly restore 20% health and grant 10% increased attack speed for 8 seconds. Cooldown: 2 minutes.",
  },
  {
    name: "Dragonfly Wings Cloak",
    itemSlot: "Cloak",
    class: "Druid",
    rarity: "Epic",
    effect:
      "Gain a 50% chance to evade the next incoming attack. If an attack is evaded, your next spell has double the effect.",
  },
  {
    name: "Nature's Guardian Bracers",
    itemSlot: "Bracers",
    class: "Druid",
    rarity: "Rare",
    effect:
      "On critical heal, summon a guardian spirit that follows you for 10 seconds, absorbing up to 15% of damage taken.",
  },
  {
    name: "Celestial Scale Shoulder",
    itemSlot: "Shoulder",
    class: "Druid",
    rarity: "Epic",
    effect:
      "Grants a chance to unleash a wave of celestial energy on spell cast, dealing AoE damage and healing allies for 10% of the damage dealt.",
  },
  {
    name: "Fangs of the Serpent Dragon",
    itemSlot: "Gloves",
    class: "Druid",
    rarity: "Legendary",
    effect:
      "Basic attacks apply a venom effect, dealing additional damage over time and healing for a percentage of damage dealt.",
  },
  {
    name: "Dragonblood Charm",
    itemSlot: "Trinket",
    class: "Druid",
    rarity: "Rare",
    effect:
      "When activated, your next healing spell will also apply a damage reduction buff to the target, absorbing 15% of incoming damage for 6 seconds.",
  },
  {
    name: "Ancient Wyrmroot Staff",
    itemSlot: "Weapon",
    class: "Druid",
    rarity: "Epic",
    effect:
      "Increases spell power by 30%. On spell cast, there’s a chance to root the target for 2 seconds, preventing movement.",
  },
  {
    name: "Dragonkin Scale Helmet",
    itemSlot: "Helmet",
    class: "Druid",
    rarity: "Rare",
    effect:
      "Reduces the cooldown of all shapeshifting forms by 1 second. When shapeshifting, gain a temporary boost to your highest primary stat.",
  },
  {
    name: "Breath of the Wild",
    itemSlot: "Cloak",
    class: "Druid",
    rarity: "Epic",
    effect:
      "On use: Create a temporary forest area that heals allies for 2% of their health every second for 8 seconds.",
  },
  // Offensive Helm
  {
    name: "Mask of the Phantom Dancer",
    itemSlot: "Helm",
    class: "Rogue",
    rarity: "Epic",
    effect:
      "Increases your critical strike chance by 15%. On use, become invisible for 5 seconds, allowing you to escape or reposition without being targeted.",
  },
  // Offensive Shoulders
  {
    name: "Shoulders of Enigmatic Shadows",
    itemSlot: "Shoulders",
    class: "Rogue",
    rarity: "Legendary",
    effect:
      "Your Combo spells deal an additional 10% damage. After using a Combo ability, gain a stack of Shadow Energy that increases your next attack speed by 5% (stacks up to 3 times).",
  },
  // Defensive Chest
  {
    name: "Cloak of the Night Stalker",
    itemSlot: "Chest",
    class: "Rogue",
    rarity: "Epic",
    effect:
      "Reduces all incoming damage by 10%. When taking damage, you have a chance to disappear and reappear behind the attacker, gaining 5% damage for your next attack.",
  },
  // Miscellaneous Belt
  {
    name: "Belt of Trickster's Illusions",
    itemSlot: "Belt",
    class: "Rogue",
    rarity: "Rare",
    effect:
      "On use: Create a decoy that distracts enemies for 5 seconds. While the decoy is active, you gain 15% increased damage.",
  },
  // Defensive Legs
  {
    name: "Leggings of Subterfuge",
    itemSlot: "Legs",
    class: "Rogue",
    rarity: "Epic",
    effect:
      "Increases your agility by 10%. When you enter stealth, your next attack deals 25% increased damage.",
  },
  // Movement-based Boots
  {
    name: "Boots of the Silent Steps",
    itemSlot: "Boots",
    class: "Rogue",
    rarity: "Rare",
    effect:
      "Gain a 20% movement speed boost while stealthed. On use: Gain 50% movement speed for 5 seconds and leave behind a trail of smoke that blinds enemies.",
  },
  // Offensive Gloves
  {
    name: "Gloves of the Daring Duelist",
    itemSlot: "Gloves",
    class: "Rogue",
    rarity: "Legendary",
    effect:
      "On use: Increase your attack power by 20% for your next melee attack. If it’s a critical hit, restore 10% of your maximum health.",
  },
  // Miscellaneous Bracers
  {
    name: "Bracers of Swift Retribution",
    itemSlot: "Bracers",
    class: "Rogue",
    rarity: "Epic",
    effect:
      "When you successfully dodge an attack, gain a burst of energy, restoring 5 energy instantly.",
  },
  // Class-based Ring
  {
    name: "Ring of the Shadowblade",
    itemSlot: "Ring",
    class: "Rogue",
    rarity: "Rare",
    effect:
      "Increases your stealth duration by 2 seconds. Each time you use a stealth ability, gain 2% increased damage (stacks up to 10 times).",
  },
  // Versatile Trinket
  {
    name: "Trinket of the Arcane Trickster",
    itemSlot: "Trinket",
    class: "Rogue",
    rarity: "Legendary",
    effect:
      "On use: Summon an illusionary duplicate of yourself that draws aggro for 6 seconds. While active, you gain a 15% increase in attack power.",
  },
  // Offensive Helm
  {
    name: "Cowl of the Illusive Assassin",
    itemSlot: "Helm",
    class: "Rogue",
    rarity: "Epic",
    effect:
      "Increases your critical strike damage by 25%. On use: Your next attack will critically strike and cannot be dodged.",
  },
  // Offensive Shoulders
  {
    name: "Mantle of Phantom Blades",
    itemSlot: "Shoulders",
    class: "Rogue",
    rarity: "Rare",
    effect:
      "Your abilities have a 10% chance to trigger an extra hit that deals 50% of the original damage.",
  },
  // Defensive Chest
  {
    name: "Vest of the Midnight Stalker",
    itemSlot: "Chest",
    class: "Rogue",
    rarity: "Legendary",
    effect:
      "Reduces all incoming damage by 15%. When you drop below 30% health, gain a shield that absorbs 25% of your maximum health for 8 seconds.",
  },
  // Miscellaneous Belt
  {
    name: "Sash of the Serpent's Shadow",
    itemSlot: "Belt",
    class: "Rogue",
    rarity: "Epic",
    effect:
      "On use: Release a cloud of poison that lasts for 5 seconds, dealing damage over time to enemies within. Reduces your health by 5% when activated.",
  },
  // Defensive Legs
  {
    name: "Trousers of the Silent Assassin",
    itemSlot: "Legs",
    class: "Rogue",
    rarity: "Rare",
    effect:
      "Increases your evasion chance by 10%. Each successful evasion grants a stack of Agility, increasing your damage by 2% (up to 10%).",
  },
  // Movement-based Boots
  {
    name: "Footpads of the Shadowstep",
    itemSlot: "Boots",
    class: "Rogue",
    rarity: "Epic",
    effect:
      "On use: Dash forward 10 yards, becoming stealthed for 5 seconds. Each enemy hit during the dash takes 20% weapon damage.",
  },
  // Offensive Gloves
  {
    name: "Fingers of the Swindler",
    itemSlot: "Gloves",
    class: "Rogue",
    rarity: "Legendary",
    effect:
      "On use: Steal 5% of an enemy's current health on hit. If this causes them to fall below 20% health, execute them instantly.",
  },
  // Miscellaneous Bracers
  {
    name: "Bracers of the Quick Strike",
    itemSlot: "Bracers",
    class: "Rogue",
    rarity: "Rare",
    effect:
      "Increases your attack speed by 10%. Whenever you deal damage to an enemy, increase your dodge chance by 2% for 4 seconds.",
  },
  {
    name: "Molten Core Spaulders",
    itemSlot: "Shoulders",
    class: "Shaman",
    rarity: "Epic",
    effect:
      "Every 8 seconds, release a lava wave in a 10-yard cone in front of you, dealing fire damage and reducing the movement speed of enemies by 20% for 4 seconds.",
  },
  {
    name: "Grimy Goons Sledgehammer",
    itemSlot: "Weapon",
    class: "Warrior",
    rarity: "Epic",
    effect:
      "On hit: Slam the ground, dealing AoE damage and stunning enemies for 2 seconds. Favored by Gadgetzan’s toughest enforcers.",
  },
  {
    name: "Grimy Goons Battleplate",
    itemSlot: "Chest",
    class: "Hunter",
    rarity: "common",
    effect:
      "Increases ranged attack power by 15%. When taking damage, gain 5% increased damage reduction for 6 seconds.",
  },
  {
    name: "Firestarter's Robes",
    itemSlot: "Chest",
    class: "Warlock",
    rarity: "Epic",
    effect:
      "Each time you cast a fire spell, gain 10% bonus spell power for 5 seconds. Stacks up to 3 times.",
  },
  {
    name: "The Draw of the voic",
    itemSlot: "Trinket",
    class: "Warlock",
    rarity: "epic",
    effect:
      "On use: Summon a portal to the Void that pulls all nearby enemies toward it for 3 seconds and weakens their resistances by 15%.",
  },
  {
    name: "Thunder charged Gauntlets",
    itemSlot: "Gloves",
    class: "Shaman",
    rarity: "common",
    effect:
      "When using an ability, there is a 5% chance to call down a bolt of lightning that stuns enemies within 5 yards for 2 seconds.",
  },
  {
    name: "Tears of the Martyr",
    itemSlot: "Ring",
    class: "Priest",
    rarity: "Epic",
    effect:
      "Each time you heal an ally, store 5% of the healing as 'Tears.' On use: Release the Tears, healing all nearby allies for the stored amount. Maximum 10 stacks.",
  },
  {
    name: "Emerald Blossom Chestguard",
    itemSlot: "Chest",
    class: "Druid",
    rarity: "Rare",
    effect:
      "When you heal an ally with a direct heal, spawn an Emerald Blossom at their feet, healing nearby allies for 10% of their total health over 6 seconds.",
  },
  {
    name: "Barkskin Bracers",
    itemSlot: "Bracers",
    class: "Druid",
    rarity: "Common",
    effect:
      "When you heal a target below 30% health, they gain Barkskin, reducing damage taken by 10% for 8 seconds.",
  },
  {
    name: "Grovekeeper's Staff",
    itemSlot: "Weapon",
    class: "Druid",
    rarity: "Epic",
    effect:
      "Casting Rejuvenation on a target below 50% health applies an additional 10-second HoT that heals for 5% of their total health.",
  },
  {
    name: "Emberstrike Daggers",
    itemSlot: "Weapon",
    class: "Rogue",
    rarity: "Epic",
    effect:
      "Your Melee attacks now deal fire damage instead of physical damage. On use: Ignite your weapons, causing your next 5 attacks to apply a fire damage dot to the target.",
  },
  {
    name: "Heatweaver Sash",
    itemSlot: "Belt",
    class: "Neutral",
    rarity: "Rare",
    effect:
      "When you deal fire damage, gain a stack of Heatweaver, increasing your fire damage by 3% per stack. Stacks up to 3 times.",
  },
  {
    name: "Hotstep greaves",
    itemSlot: "Boots",
    class: "Neutral",
    rarity: "common",
    effect:
      "When you deal fire damage, gain a stack of Scorch, increasing your movement speed by 5% per stack. Stacks up to 5 times.",
  },
  {
    name: "Manacles of Burning Servatude",
    itemSlot: "Bracers",
    class: 'Neutral',
    rarity: "Epic",
    effect:
      "On use: Summon a minion of flame, casting fire damage at your near by foes whenever you deal direct fire damage",
  },
  {
    name: "Flameforged cloak",
    itemSlot: "Cloak",
    class: "Neutral",
    rarity: "Rare",
    effect: "when you take fire damage while below 50% health, gain a shield that absorbs 10% of your max health for 6 seconds, this effect cannot occur more than once every 30 seconds",
  },
  {
    name: "Icebound Gauntlets",
    itemSlot: "Gloves",
    class: "Neutral",
    rarity: "Epic",
    effect: "On use: summon a frost nova around you, freezing all nearby enemies for 3 seconds and dealing frost damage",
  },
  {
    name: "Frostbite Boots",
    itemSlot: "Boots",
    class: "Neutral",
    rarity: "Rare",
    effect: "When you deal frost damage, gain a stack of Frostbite, increasing your frost damage by 3% per stack. Stacks up to 3 times.",
  },
  {
    name: "Frostweaver's Cloak",
    itemSlot: "Cloak",
    class: "Neutral",
    rarity: "common",
    effect: "When you take frost damage while below 50% health, gain a shield that absorbs 10% of your max health for 6 seconds, this effect cannot occur more than once every 30 seconds",
  },
  {
    name: "Stormcaller's Mantle",
    itemSlot: "Shoulder",
    class: "Neutral",
    rarity: "Epic",
    effect: "On use: summon a storm cloud above you, dealing nature damage to all nearby enemies and reducing their movement speed by 20% for 4 seconds.",
  },
  {
    name: "Stormweaver's Cloak",
    itemSlot: "Cloak",
    class: "Neutral",
    rarity: "common",
    effect: "When you take nature damage while below 50% health, gain a shield that absorbs 10% of your max health for 6 seconds, this effect cannot occur more than once every 30 seconds",
  },
  {
    name: "Stormcaller's Pauldrons",
    itemSlot: "Shoulder",
    class: "Neutral",
    rarity: "Epic",
    effect: "On use: summon a storm cloud above you, dealing nature damage to all nearby enemies and reducing their movement speed by 20% for 4 seconds.",
  },
  {
    name: "Thunderstruck Belt",
    itemSlot: "Belt",
    class: "Neutral",
    rarity: "Rare",
    effect: "When you deal nature damage, gain a stack of Thunderstruck, increasing your nature damage by 3% per stack, stacks up to 3 times.",
  }

]

const cardContainer = document.getElementById("cardContainer")
const sortRarity = document.getElementById("sortRarity")
const sortClass = document.getElementById("sortClass")
const sortItemSlot = document.getElementById("sortItemSlot")
const sortCriteria = document.getElementById("sortCriteria")

/*
Death Knight	196	30	58	0.77	0.12	0.23	#C41E3A	Red
Demon Hunter	163	48	201	0.64	0.19	0.79	#A330C9	Dark Magenta
Druid	255	124	10	1.00	0.49	0.04	#FF7C0A	Orange
Evoker	51	147	127	0.20	0.58	0.50	#33937F	Dark Emerald
Hunter	170	211	114	0.67	0.83	0.45	#AAD372	Pistachio
Mage	63	199	235	0.25	0.78	0.92	#3FC7EB	Light Blue
Monk	0	255	152	0.00	1.00	0.60	#00FF98	Spring Green
Paladin	244	140	186	0.96	0.55	0.73	#F48CBA	Pink
Priest	255	255	255	1.00	1.00	1.00	#FFFFFF	White*
Rogue	255	244	104	1.00	0.96	0.41	#FFF468	Yellow*
Shaman	0	112	221	0.00	0.44	0.87	#0070DD	Blue
Warlock	135	136	238	0.53	0.53	0.93	#8788EE	Purple
Warrior	198	155	109	0.78	0.61	0.43	#C69B6D	Tan */

const classColorDictionary = {
  Warrior: "#C69B6D",
  Hunter: "#AAD372",
  Mage: "#3FC7EB",
  Rogue: "#FFF468",
  Paladin: "#F48CBA",
  Shaman: "#0070DD",
  Warlock: "#8788EE",
  Druid: "#FF7C0A",
  Priest: "#FFFFFF",
  Neutral: "#33937F",
}

// Function to create a card
function createCard(item) {
  const card = document.createElement("div")
  card.classList.add("card")

  // Item Slot
  const itemImage = document.createElement("img")
  // image number should be based on the item name's first letter converted into a numbre % 5
  imageNumber = (item.name.charCodeAt(2) % 5) + 1
  console.log(imageNumber)
  itemImage.src = `assets/${item.itemSlot}/${imageNumber}.png`
  itemImage.onerror = () => {
    itemImage.src = "https://via.placeholder.com/150"
  }
  // /image test

  // itemImage.src = 'https://via.placeholder.com/150'
  itemImage.classList.add("itemImage")

  // Item Slot
  const itemSlot = document.createElement("div")
  itemSlot.classList.add("itemSlot")
  itemSlot.innerText = item.itemSlot

  // Rarity
  const rarity = document.createElement("div")
  rarity.classList.add("rarity", item.rarity)
  rarity.innerText = item.rarity

  // Title
  const title = document.createElement("div")
  title.classList.add("title")
  title.innerText = item.name

  // Class
  const itemClass = document.createElement("div")
  itemClass.classList.add("class")
  // classes should have the generic class color and the class name
  itemClass.style.backgroundColor = classColorDictionary[item.class]

  itemClass.innerText = item.class

  // Effect
  const effect = document.createElement("div")
  effect.classList.add("effect")
  effect.innerText = item.effect

  // Append to card
  card.appendChild(itemSlot)
  card.appendChild(rarity)
  card.appendChild(title)
  card.appendChild(itemImage)
  card.appendChild(itemClass)
  card.appendChild(effect)

  // Append card to container
  cardContainer.appendChild(card)
}

// Function to render cards based on selected filters
function renderFilteredCards() {
  // Clear existing cards
  cardContainer.innerHTML = ""

  // Get selected values
  const selectedRarity = sortRarity.value
  const selectedClass = sortClass.value
  const selectedItemSlot = sortItemSlot.value
  const selectedSortCriteria = sortCriteria.value

  // Filter the items
  const filteredItems = additionalItems.filter((item) => {
    const matchRarity =
      selectedRarity === "all" || item.rarity === selectedRarity
    const matchClass = selectedClass === "all" || item.class === selectedClass
    const matchItemSlot =
      selectedItemSlot === "all" || item.itemSlot === selectedItemSlot
    return matchRarity && matchClass && matchItemSlot
  })
  // Sort the filtered items based on selected sort criteria
  console.log(selectedSortCriteria)
  filteredItems.sort((a, b) => {
    if (selectedSortCriteria === "name") {
      return a.name.localeCompare(b.name)
    } else if (selectedSortCriteria === "rarity") {
      const rarityOrder = ["Common", "Rare", "Epic", "Legendary"]
      return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
    } else if (selectedSortCriteria === "itemSlot") {
      return a.itemSlot.localeCompare(b.itemSlot)
    } else if (selectedSortCriteria === "class") {
      return a.class.localeCompare(b.class)
    }
    return 0
  })
  // filteredItems.sort((a, b) => a.name.localeCompare(b.name))

  // Render the filtered cards
  filteredItems.forEach((item) => createCard(item))
}

// Event listeners for sorting
sortRarity.addEventListener("change", renderFilteredCards)
sortClass.addEventListener("change", renderFilteredCards)
sortItemSlot.addEventListener("change", renderFilteredCards)
sortCriteria.addEventListener("change", renderFilteredCards)

// Initial render of all cards
renderFilteredCards()

/*
	•	Helms and Shoulders: Focused on offensive capabilities, enhancing attack power and damage.
	•	Chest and Legs: Designed for defense, providing damage reduction and shields.
	•	Belt: Included miscellaneous on-use effects for utility and buffs.
	•	Boots: Focused on mobility and speed enhancements.
	•	Gloves: Contained on-use offensive abilities that can execute or deal significant damage.
	•	Bracers: Miscellaneous effects that provide defense or offensive opportunities.
	•	Rings: Designed to enhance warrior traits like strength and stamina.
	•	Trinkets: Versatile effects that amplify damage or provide significant boosts during combat.
 
 Warrior

Warriors are typically strong melee fighters with a balance of damage, defense, and crowd control. They focus on mobility, burst, and sustainability in combat.

	1.	Charge: Rush toward an enemy, stunning them briefly and closing the gap.
	2.	Pummel: Interrupt an enemy’s spellcasting, silencing them for a short duration.
	3.	Hamstring: Slow the enemy’s movement speed for a period of time.
	4.	Stun (e.g., Shockwave or Intercept): Stun the target for a short duration.
	5.	Bleed (e.g., Rend): Apply a damage-over-time bleed effect to the target.
	6.	Whirlwind: Spin in place, dealing damage to all nearby enemies.
	7.	Execute: A powerful finishing move that deals high damage when the target is below a certain health threshold.
	8.	Battle Shout: Increase your attack power and that of nearby allies for a short duration.
	9.	Defensive Stance: Reduce incoming damage for a limited time, trading damage output for survivability.
	10.	Berserker Rage: Break free of crowd control and increase damage dealt for a short time.

Mage

Mages are known for their powerful ranged magic, crowd control, and burst damage abilities. They excel in controlling the battlefield and dealing high damage from afar.

	1.	Frostbolt: Deals damage and slows the target’s movement speed.
	2.	Fireball: A high-damage single-target spell with a chance to ignite the enemy for additional burning damage.
	3.	Arcane Blast: Deals increasing arcane damage with each cast in quick succession.
	4.	Polymorph: Transforms an enemy into a harmless creature, disabling them for a short time.
	5.	Ice Barrier: Shields the mage, absorbing damage for a few seconds.
	6.	Blink: Teleport a short distance forward, removing movement-impairing effects.
	7.	Flamestrike: Deals area-of-effect fire damage to all enemies in a designated area.
	8.	Counterspell: Interrupts an enemy’s spellcasting and prevents them from casting spells of that school for a few seconds.
	9.	Cone of Cold: A wide cone of frost damage that also slows enemies.
	10.	Evocation: Regenerate a large portion of your mana over time, but you’re vulnerable while channeling it.

Priest

Priests are versatile casters who can either deal damage with dark magic or provide healing and protection to allies.

	1.	Smite: Deal holy damage to a single target.
	2.	Shadow Word: Pain: Apply a damage-over-time effect that ticks periodically.
	3.	Power Word: Shield: Shield an ally, absorbing damage and granting brief immunity to interrupts.
	4.	Heal: A standard single-target healing spell.
	5.	Flash Heal: A fast but mana-intensive heal for urgent situations.
	6.	Mind Control: Temporarily take control of an enemy, forcing them to fight for you.
	7.	Mass Dispel: Removes harmful debuffs from all allies in the area.
	8.	Holy Nova: Heals allies and damages enemies in an area around the priest.
	9.	Psychic Scream: Causes enemies around the priest to flee in fear for a short time.
	10.	Renew: Heal over time effect placed on an ally.

Rogue

Rogues are stealthy and quick, excelling in burst damage and crowd control. They focus on positioning and surprise attacks.

	1.	Stealth: Enter stealth mode, becoming invisible to enemies until you attack.
	2.	Backstab: Deals bonus damage when attacking from behind.
	3.	Cheap Shot: A stealth-based stun to open the fight.
	4.	Sinister Strike: A fast melee attack that generates combo points for finishers.
	5.	Eviscerate: A finishing move that deals higher damage based on the number of combo points.
	6.	Sap: Incapacitates a humanoid target for a short time, only usable in stealth.
	7.	Poison (e.g., Deadly Poison): Coats your weapon in poison, applying a damage-over-time effect.
	8.	Vanish: Immediately enter stealth and remove movement-impairing effects.
	9.	Kick: Interrupt an enemy’s spellcasting and lock them out of that school of magic for a short time.
	10.	Cloak of Shadows: Remove all harmful magic effects and become immune to spells for a short time.

Paladin

Paladins are durable fighters with a mixture of melee combat and healing abilities, bolstered by divine power.

	1.	Judgment: Calls down a divine judgment to deal holy damage.
	2.	Crusader Strike: A melee attack that deals holy damage.
	3.	Holy Light: A slow but powerful healing spell.
	4.	Flash of Light: A quick healing spell with a moderate mana cost.
	5.	Consecration: Sanctifies the ground beneath you, dealing holy damage over time to all enemies in the area.
	6.	Divine Shield: Make yourself immune to all damage for a short time.
	7.	Lay on Hands: Instantly heals a target to full health, but with a very long cooldown.
	8.	Blessing of Protection: Protect an ally from physical damage for a few seconds.
	9.	Avenging Wrath: Increases your damage and healing output significantly for a short period of time.
	10.	Hammer of Justice: A stun that interrupts and incapacitates an enemy.

Druid

Druids are highly versatile shapeshifters that can fill multiple roles, from damage dealer to healer or tank. They have access to different forms, each granting unique abilities.

	1.	Rejuvenation: Heals an ally over time.
	2.	Moonfire: A ranged spell that deals arcane damage and applies a damage-over-time effect.
	3.	Bear Form: Shapeshift into a bear, increasing your health and armor while gaining new defensive abilities.
	4.	Cat Form: Shapeshift into a cat, increasing your speed and gaining new melee abilities.
	5.	Regrowth: A healing spell that heals instantly and continues to heal over time.
	6.	Entangling Roots: Roots an enemy in place, preventing movement for a short period of time.
	7.	Innervate: Regenerates a large amount of mana for a friendly target.
	8.	Barkskin: Reduces damage taken by a percentage for a short time.
	9.	Wild Growth: Heals multiple allies over time in a wide area.
	10.	Cyclone: Tosses the enemy into the air, preventing them from taking actions for a short time but making them immune to damage.

Hunter

Hunters are ranged physical damage dealers who excel at using bows, traps, and pets to control the battlefield.

	1.	Arcane Shot: A quick shot that deals arcane damage.
	2.	Multi-Shot: Fires arrows at multiple nearby enemies.
	3.	Aimed Shot: A powerful, slower shot that deals significant damage.
	4.	Freezing Trap: Places a trap on the ground that freezes the first enemy to walk into it, incapacitating them.
	5.	Serpent Sting: Apply a poison to your target that deals damage over time.
	6.	Disengage: Leap backwards to put distance between you and your enemies.
	7.	Kill Command: Orders your pet to attack with increased ferocity, dealing extra damage.
	8.	Feign Death: Pretend to die, causing enemies to ignore you for a brief period.
	9.	Rapid Fire: Increases your attack speed significantly for a short period.
	10.	Mend Pet: Heals your pet over time.

Shaman

Shamans are hybrid casters who can deal elemental damage, summon totems, and heal allies. They combine offense with support utility.

	1.	Lightning Bolt: Deal nature damage to a single target.
	2.	Chain Heal: Heal an ally and have the spell jump to heal additional nearby allies.
	3.	Flame Shock: Apply a fire-based damage-over-time effect.
	4.	Lava Burst: A high-damage spell that deals increased damage if the target is affected by Flame Shock.
	5.	Earth Shock: Deal nature damage and interrupt the target’s spellcasting.
	6.	Healing Surge: A fast, moderate-cost heal.
	7.	Earthbind Totem: Summon a totem that slows enemies in the area.
	8.	Windfury Weapon: Grants your weapon a chance to strike additional times with each attack.
	9.	Hex: Transform an enemy into a harmless creature for a short time.
	10.	Spirit Walk: Remove movement-impairing effects and increase your movement speed briefly.

Warlock

Warlocks are dark spellcasters who deal damage over time and summon demons to assist them in combat.

	1.	Shadow Bolt: Fires a bolt of shadow magic at the target.
	2.	Corruption: Apply a damage-over-time effect that slowly drains the target’s life.
	3.	Fear: Causes the target to flee in terror for a short duration.
	4.	Summon Demon: Summon a demon companion to assist in battle.
	5.	Drain Life: Steal health from a target over time, healing yourself.
	6.	Chaos Bolt: A powerful spell that deals high damage and cannot be resisted.
	7.	Siphon Life: Heal yourself while damaging the target over time.
	8.	Mortal Coil: Causes fear and heals you based on the damage dealt.
	9.	Howl of Terror: A fear-based ability that causes all nearby enemies to flee.
	10.	Dark Pact: Sacrifice a portion of your pet’s health to restore your own mana.


  */
