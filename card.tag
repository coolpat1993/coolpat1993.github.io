<card>
  <div class={ getCardClassNames() }
       draggable={ opts.draggable || false }
       data-card-id={ opts.data && opts.data.instanceId }
       data-slot-id={ opts.dataSlotId }
       data-unit-type={ opts.data && opts.data.unitType }
       ondragstart={ handleDragStart }
       onclick={ handleClick }>
    <div class="card-image" style="background-image: url('images/{ opts.data && opts.data.image }')">
      <div class="card-header">{ opts.data && opts.data.name }</div>
    </div>
    <div class="card-description">
      <!-- Use a show/hide approach with empty span to keep everything in-line -->
      <span show={ opts.data && opts.data.type === 'unit' && opts.data.unitType }><b>{ opts.data && opts.data.type === 'unit' && opts.data.unitType ? opts.data.unitType.charAt(0).toUpperCase() + opts.data.unitType.slice(1) : '' }</b> - </span>{ opts.data && opts.data.description }
    </div>
    <div class="mana-indicator" if={ opts.data && opts.data.mana !== undefined }>{ opts.data && opts.data.mana }</div>
    <div class={ getAttackIndicatorClass() } if={ shouldShowAttack() }>{ opts.data && opts.data.attack }</div>
    <div class={ getHealthIndicatorClass() } if={ shouldShowHealth() }>{ opts.data && opts.data.health }</div>
  </div>

  <script>
    const self = this;
    
    // Track if this card is selected for combat
    self.isCombatSelected = false;
    
    // Track if this card is an invalid target for combat (e.g., can't attack backrow when frontrow has units)
    self.isInvalidTarget = false;

    // Setup combat system when mounted
    self.on('mount', function() {
      // Access the global combat system
      if (window.CombatSystem) {
        self.combatSystem = window.CombatSystem;
      }
      
      // Store a reference to this card component in the card data
      // This allows the combat system to update card visual states
      if (self.opts.data) {
        self.opts.data.cardComponent = self;
        
        // Add slot ID to the card data for checking front/back row
        if (self.opts.dataSlotId) {
          self.opts.data.slotId = self.opts.dataSlotId;
        }
      }
    });
    
    // Check if card health is damaged (less than max health)
    self.isDamaged = function() {
      if (!self.opts.data) return false;
      
      // Get the card data
      const card = self.opts.data;
      
      // Check if card has a maxHealth property explicitly set
      if (card.maxHealth) {
        console.log('triggered 1:', card.maxHealth, '<', card.health);
        return card.health < card.maxHealth;
      }
      
      // If no maxHealth is set but the card has a base template,
      // compare with the base health from the template
      if (card.baseCard && card.baseCard.health) {
        console.log('triggered 2:', card.baseCard.health);
        return card.health < card.baseCard.health;
      }
      
      // If we have an original health property stored after damage was taken
      if (card.originalHealth) {
        console.log('triggered 3:', card.originalHealth);
        return card.health < card.originalHealth;
      }
      
      // Last option - look at card ID in the card library if available
      if (window.cardLibrary && card.id) {
        console.log('triggered 4:', card.id);
        const template = window.cardLibrary.find(c => c.id === card.id);
        if (template && template.health) {
          return card.health < template.health;
        }
      }
      
      return false;
    }
    
    // Handle card click events
    self.handleClick = function(e) {
      // Check if opts.data is null or undefined
      if (!self.opts.data) {
        console.warn('Card clicked but opts.data is null or undefined');
        return;
      }
      
      // Get the card data and location info
      const card = self.opts.data;
      const slotId = self.opts.dataSlotId;
      
      // Check if we're in attack mode
      if (self.combatSystem && self.combatSystem.attackMode) {
        // If this is an enemy card, try to attack it
        if (slotId && slotId.startsWith('enemy-')) {
          // Add player/enemy id to the card for combat logic
          card.playerId = 'enemy';
          
          // Try to attack this card
          if (self.combatSystem.attack(card)) {
            // Clear selection state of all cards after successful attack
            self.isCombatSelected = false;
            self.update();
            // We should also update the parent to refresh all cards
            self.parent.update();
            return;
          }
        }
        
        // If click wasn't an attack, clear the combat selection
        self.combatSystem.clearSelection();
        self.parent.update();
        return;
      }
      
      // If this is a player unit on the board, select it for attack
      if (slotId && slotId.startsWith('player-') && card.type === 'unit') {
        // Add player/enemy id to the card for combat logic
        card.playerId = 'player';
        
        // Only allow selection if the card can attack
        if (card.canAttack !== false) {
          // By default, units can attack when placed
          if (card.canAttack === undefined) {
            card.canAttack = true;
          }
          
          // Try to select this card as the attacker
          if (self.combatSystem && self.combatSystem.selectAttacker(card)) {
            self.isCombatSelected = true;
            self.parent.addLogEntry(`${card.name} ready to attack. Click an enemy unit to attack.`);
            self.update();
            self.parent.update();
            return;
          }
        } else {
          self.parent.addLogEntry(`${card.name} has already attacked this turn.`);
        }
      }

      // Trigger custom event up to parent components for other handling
      if (self.opts.onClick) {
        self.opts.onClick(self.opts.data);
      }
    }
    
    // Handle drag start events
    self.handleDragStart = function(e) {
      // Check if opts.data is null or undefined
      if (!self.opts.data) {
        console.warn('Drag started but opts.data is null or undefined');
        return;
      }
      
      // Forward the drag event to the parent component if handler exists
      if (self.opts.onDragStart) {
        self.opts.onDragStart(e);
      } else {
        // Default drag behavior if no parent handler
        const cardId = self.opts.data.instanceId;
        if (cardId) {
          e.dataTransfer.setData('text/plain', cardId);
        }
      }
    }

    // Clear combat selection if the combat system selection was cleared elsewhere
    self.on('update', function() {
      if (self.combatSystem && !self.combatSystem.attackMode && self.isCombatSelected) {
        self.isCombatSelected = false;
      }
    });
    
    // Generate all card classes dynamically
    self.getCardClassNames = function() {
      const card = self.opts.data;
      if (!card) return 'card';
      
      // Start with the base card class
      const classes = ['card'];
      
      // Add card type class (unit, spell, item, etc.)
      if (card.type) classes.push(card.type);
      
      // Add card class (necromancer, warrior, etc.)
      if (card.class) classes.push(card.class);
      
      // Check if it's the opponent's turn before applying playable/attack classes
      const isOpponentTurn = window.gameState && window.gameState.isOpponentTurn;
      
      // Add playability status - only when it's not opponent's turn
      if (!isOpponentTurn) {
        if (self.opts.playable) classes.push('playable');
        if (self.opts.playable === 'playable-item') classes.push('playable-item');
        
        // Add attack ability status for units - only when it's not opponent's turn
        if (card.canAttack && card.type === 'unit') classes.push('can-attack');
      }
      
      // Add combat selection status
      if (self.isCombatSelected) classes.push('selected-for-combat');
      
      // Add invalid target status
      if (self.isInvalidTarget) classes.push('invalid-target');
      
      // Any additional conditional classes can be added here
      
      return classes.join(' ');
    };
    
    // Helper method for attack indicator class
    self.getAttackIndicatorClass = function() {
      const card = self.opts.data;
      if (!card) return 'attack-indicator';
      
      const classes = ['attack-indicator'];
      
      // Add item-attack class for items
      if (card.type === 'item') classes.push('item-attack');
      
      return classes.join(' ');
    };
    
    // Helper method for health indicator class
    self.getHealthIndicatorClass = function() {
      const card = self.opts.data;
      if (!card) return 'health-indicator';
      
      const classes = ['health-indicator'];
      
      // Add damaged-health class if health is reduced
      if (self.isDamaged()) classes.push('damaged-health');
      
      return classes.join(' ');
    };
    
    // Helper method to determine if attack indicator should be shown
    self.shouldShowAttack = function() {
      const card = self.opts.data;
      if (!card) return false;
      
      // Show attack for units and items with attack value
      return (card.attack && card.attack !== 0) || 
             (card.type === 'item' && card.attack);
    };
    
    // Helper method to determine if health indicator should be shown
    self.shouldShowHealth = function() {
      const card = self.opts.data;
      if (!card) return false;
      
      // Show health for units and banners, but not spells or items
      return card.health > 0 && 
             card.type !== 'spell' && 
             card.type !== 'item';
    };
  </script>

  <style>
    /* Card styles */
    .card {
      width: 100px;
      height: 145px;
      border-radius: 8px;
      position: relative;
      /* Common Hearthstone-style base with the requested colors */
      background: linear-gradient(135deg, #736258 0%, #5a4c44 100%);
      padding: 5px;
      border: 2px solid #35312a;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(51, 50, 48, 0.2) inset;
      color: white;
      box-sizing: border-box;
      font-family: 'Belwe Bold', 'Times New Roman', serif;
      transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
      z-index: 5;
      display: flex;
      flex-direction: column;
    }

  
    /* Special styling for spell cards */
    .card.spell {
      background: linear-gradient(135deg, #6a5cff 0%, #4a3cd7 100%);
      border-color: #35318d;
    }

    /* Special styling for item cards */
    .card.item {
      background: linear-gradient(135deg, #c99e39 0%, #9c7b2d 100%);
      border-color: #765c20;
    }

    /* Class-specific styling - Necromancer */
    /* Base necromancer unit card style */
    .card.necromancer {
      background: linear-gradient(135deg, #9747e5 0%, #7035b0 100%);
      border-color: #5b2b91;
    }

    /* Necromancer spell card style */
    .card.necromancer.spell {
      background: linear-gradient(135deg, #6a5cff 0%, #4a3cd7 100%);
      border-color: #35318d;
    }

    /* Necromancer item card style */
    .card.necromancer.item {
      background: linear-gradient(135deg, #4a0072 0%, #2d0045 100%);
      border-color: #220033;
    }

    /* Class-specific styling - Warrior */
    /* Base warrior unit card style */
    .card.warrior {
      background: linear-gradient(135deg, #5d3a3a 0%, #723d3d 100%);
      border-color: #522a2a;
    }

    /* Warrior spell card style */
    .card.warrior.spell {
      background: linear-gradient(135deg, #792a2a 0%, #6c2e2e 100%);
      border-color: #663030;
    }

    /* Warrior item card style */
    .card.warrior.item {
      background: linear-gradient(135deg, #4a2525 0%, #331818 100%);
      border-color: #271212;
    }

    /* Class-specific styling - Beastmaster */
    /* Base beastmaster unit card style - earthy green */
    .card.beastmaster {
      background: linear-gradient(135deg, #4a6d40 0%, #3a5933 100%);
      border-color: #2c4326;
    }

    /* Beastmaster spell card style - lighter green */
    .card.beastmaster.spell {
      background: linear-gradient(135deg, #5e8851 0%, #4e7243 100%);
      border-color: #3a5633;
    }

    /* Beastmaster item card style - darker green */
    .card.beastmaster.item {
      background: linear-gradient(135deg, #2e4324 0%, #1f2e17 100%);
      border-color: #192313;
    }

    /* Card image container */
    .card-image {
      height: 65%; /* Increased from 50% to 65% to make the image taller */
      width: 100%;
      margin: 0 auto;
      background-size: cover;
      background-position: center;
      border-radius: 5px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3), inset 0 0 5px rgba(255,255,255,0.2);
      position: relative; /* Added to position the overlaid card name */
    }

    .card .card-header {
      position: absolute; /* Position absolutely to overlay on the image */
      bottom: 0; /* Place at the bottom of the image */
      left: 0;
      right: 0;
      font-weight: bold;
      font-size: 11px;
      text-align: center;
      padding: 5px 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-shadow: 1px 1px 2px #000, 0 0 5px rgba(0,0,0,0.8); /* Enhanced text shadow for better readability */
      background: linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0)); /* Gradient background for better text visibility */
      border-bottom-left-radius: 5px;
      border-bottom-right-radius: 5px;
      color: #ffffff; /* White text for better contrast against the dark gradient */
    }

    .card .card-description {
      font-size: 10px;
      text-align: center;
      color: #000000;
      padding: 0 5px;
      height: 35%; /* Reduced from 45% to accommodate the taller image */
      overflow: hidden;
      background: #A89783;
      border-radius: 4px;
      font-family: 'Franklin Gothic Condensed', 'Arial Narrow', sans-serif;
      justify-content: center;
      align-items: center;
      margin-top: 5px; /* Add a little spacing after the image */
    }

    /* Unit type indicators */
    .tank {
      border-bottom-color: #8e6b1d;
    }

    .caster {
      border-bottom-color: #a55fda;
    }

    .ranged {
      border-bottom-color: #3ba0db;
    }

    .healer {
      border-bottom-color: #5fda81;
    }

    .stealth {
      border-bottom-color: #6e6e6e;
    }

    /* Hearthstone-style indicators */
    .card .mana-indicator {
      position: absolute;
      top: 0;
      left: 0;
      width: 23px;
      height: 23px;
      background: linear-gradient(135deg, #4facfe 0%, #1a56e8 100%);
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-weight: bold;
      font-size: 16px;
      box-shadow: 0 0 5px rgba(0, 0, 0, 0.8), 0 0 10px rgba(29, 162, 216, 0.6) inset;
      transform: translate(-10px, -10px);
      text-shadow: 0px 0px 2px #000;
    }

    /* Attack indicator - now using dynamic class */
    .card .attack-indicator {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 23px;
      height: 23px;
      background: linear-gradient(135deg, #ffdd00 0%, #e6a700 100%);
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-weight: bold;
      font-size: 16px;
      box-shadow: 0 0 5px rgba(0, 0, 0, 0.8), 0 0 10px rgba(255, 215, 0, 0.3) inset;
      transform: translate(-10px, 8px);
      text-shadow: 0px 0px 2px #000;
    }

    /* Health indicator - now using dynamic class */
    .card .health-indicator {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 23px;
      height: 23px;
      background: linear-gradient(135deg, #ff3019 0%, #990000 100%);
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-weight: bold;
      font-size: 16px;
      box-shadow: 0 0 5px rgba(0, 0, 0, 0.8), 0 0 10px rgba(255, 0, 0, 0.3) inset;
      transform: translate(10px, 8px);
      text-shadow: 0px 0px 2px #000;
    }
    
    /* Style for damaged health indicator */
    .card .health-indicator.damaged-health {
      color:  #ff0000;
    }

    /* Hide attack and health indicators for spell cards, and only health indicators for item cards */
    .card.spell .attack-indicator,
    .card.spell .health-indicator,
    .card.item .health-indicator {
      display: none;
    }

    /* Green glow effect for playable cards */
    .card.playable {
      border-color: #6BFD3F;
      box-shadow: 
                 0 0 6px #6BFD3F inset, 
                 0 0 8px #6BFD3F;
      animation: playable-pulse 1.5s infinite alternate;
    }

    /* Yellow glow effect for playable item cards when a unit is on the board */
    .card.playable-item {
      border-color: #FFD700;
      box-shadow: 
                 0 0 6px #FFD700 inset, 
                 0 0 8px #FFD700;
      animation: playable-item-pulse 1.5s infinite alternate;
    }

    /* Green glow effect for cards that can attack */
    .card.can-attack:not(.selected-for-combat) {
      border-color: #6BFD3F;
      box-shadow: 
                 0 0 6px #6BFD3F inset, 
                 0 0 8px #6BFD3F;
      animation: playable-pulse 1.5s infinite alternate;
    }

    @keyframes playable-pulse {
      from {
          box-shadow:
                   0 0 6px #6BFD3F inset, 
                   0 0 9px #6BFD3F;
      }
      to {
          box-shadow:
                   0 0 8px #6BFD3F inset, 
                   0 0 12px #6BFD3F;
      }
    }

    @keyframes playable-item-pulse {
      from {
          box-shadow:
                   0 0 6px #FFD700 inset, 
                   0 0 9px #FFD700;
      }
      to {
          box-shadow:
                   0 0 8px #FFD700 inset, 
                   0 0 12px #FFD700;
      }
    }

    /* Combat selection styling - overrides can-attack */
    .card.selected-for-combat {
      border-color: #ff5722;
      box-shadow: 
                 0 0 6px #ff5722 inset, 
                 0 0 8px #ff5722;
      animation: none;
      transform: scale(1.1);
      z-index: 10;
      transition: transform 0.3s ease-out, box-shadow 0.3s ease-out;
    }

    /* Dimmed effect for invalid targets */
    .card.invalid-target {
      opacity: 0.5;
      filter: grayscale(100%);
      pointer-events: none; /* Prevent interaction with invalid targets */
      transition: filter 0.3s ease-out, opacity 0.3s ease-out;
    }

  </style>
</card>