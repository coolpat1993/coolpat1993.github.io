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
    name: "Shielded Mech Helm",
    itemSlot: "Helm",
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
    itemSlot: "Helm",
    class: "Neutral",
    rarity: "Rare",
    effect:
      "On use: Shrink an enemy, reducing their damage by 30% and movement speed by 20% for 10 seconds.",
  },
  {
    name: "Annoy-o-Tron Shoulders",
    itemSlot: "Shoulders",
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
    name: "Mega Bomb Helm",
    itemSlot: "Helm",
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
    name: "Whirling Blades Shoulders",
    itemSlot: "Shoulders",
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
    name: "Blood Sworn Helm",
    itemSlot: "Helm",
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
    itemSlot: "Helm + Chest + Legs",
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
    itemSlot: "Weapon + Shoulders + Trinket",
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
    name: "Wyrmguard Shoulders",
    itemSlot: "Shoulders",
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
    name: "Scaled Guardian Helm",
    itemSlot: "Helm",
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
]

const cardContainer = document.getElementById("cardContainer")
const sortRarity = document.getElementById("sortRarity")
const sortClass = document.getElementById("sortClass")
const sortItemSlot = document.getElementById("sortItemSlot")

// Function to create a card
function createCard(item) {
  const card = document.createElement("div")
  card.classList.add("card")

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
  itemClass.innerText = item.class

  // Effect
  const effect = document.createElement("div")
  effect.classList.add("effect")
  effect.innerText = item.effect

  // Append to card
  card.appendChild(itemSlot)
  card.appendChild(rarity)
  card.appendChild(title)
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
