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
]

const cardContainer = document.getElementById("cardContainer")
const sortRarity = document.getElementById("sortRarity")
const sortClass = document.getElementById("sortClass")
const sortItemSlot = document.getElementById("sortItemSlot")

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

  // Filter the items
  const filteredItems = additionalItems.filter((item) => {
    const matchRarity =
      selectedRarity === "all" || item.rarity === selectedRarity
    const matchClass = selectedClass === "all" || item.class === selectedClass
    const matchItemSlot =
      selectedItemSlot === "all" || item.itemSlot === selectedItemSlot
    return matchRarity && matchClass && matchItemSlot
  })

  filteredItems.sort((a, b) => a.name.localeCompare(b.name))

  // Render the filtered cards
  filteredItems.forEach((item) => createCard(item))
}

// Event listeners for sorting
sortRarity.addEventListener("change", renderFilteredCards)
sortClass.addEventListener("change", renderFilteredCards)
sortItemSlot.addEventListener("change", renderFilteredCards)

// Initial render of all cards
renderFilteredCards()
