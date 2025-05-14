<my-app>
  <div class="container">
    <div class="game-area">
      <div class="turn-indicator"></div>
      
      <!-- Board Area Refactored to use state-driven approach -->
      <div class="board-area">
        <!-- Enemy Back Line -->
        <div class="board-row enemy-zone">
          <div each={ i in [1,2,3,4,5] } class="slot" id="enemy-back-{i}" 
               ondragover={ allowDrop } 
               ondragenter={ dragEnter } 
               ondragleave={ dragLeave } 
               ondrop={ handleDrop }>
            <virtual if={ slots['enemy-back-'+i] }>
              <div class="spell-card { slots['enemy-back-'+i].element }"
                   draggable="true"
                   data-card-id={ slots['enemy-back-'+i].instanceId }
                   ondragstart={ parent.dragStart }>
                <div class="mana-indicator">{ slots['enemy-back-'+i].mana }</div>
                <div class="card-header">{ slots['enemy-back-'+i].name }</div>
                <div class="card-body">{ slots['enemy-back-'+i].type === 'unit' ? 'Unit' : 'Spell' } Card</div>
                <div class="card-footer">
                  <span class="type-indicator">{ slots['enemy-back-'+i].element }</span>
                </div>
                <div class="damage-indicator">{ slots['enemy-back-'+i].damage }</div>
                <div if={ slots['enemy-back-'+i].type === 'unit' } class="health-indicator">{ slots['enemy-back-'+i].health }</div>
              </div>
            </virtual>
          </div>
        </div>
        
        <!-- Enemy Front Line -->
        <div class="board-row enemy-zone">
          <div each={ i in [1,2,3,4,5] } class="slot" id="enemy-front-{i}" 
               ondragover={ allowDrop } 
               ondragenter={ dragEnter } 
               ondragleave={ dragLeave } 
               ondrop={ handleDrop }>
            <virtual if={ slots['enemy-front-'+i] }>
              <div class="spell-card { slots['enemy-front-'+i].element }"
                   draggable="true"
                   data-card-id={ slots['enemy-front-'+i].instanceId }
                   ondragstart={ parent.dragStart }>
                <div class="mana-indicator">{ slots['enemy-front-'+i].mana }</div>
                <div class="card-header">{ slots['enemy-front-'+i].name }</div>
                <div class="card-body">{ slots['enemy-front-'+i].type === 'unit' ? 'Unit' : 'Spell' } Card</div>
                <div class="card-footer">
                  <span class="type-indicator">{ slots['enemy-front-'+i].element }</span>
                </div>
                <div class="damage-indicator">{ slots['enemy-front-'+i].damage }</div>
                <div if={ slots['enemy-front-'+i].type === 'unit' } class="health-indicator">{ slots['enemy-front-'+i].health }</div>
              </div>
            </virtual>
          </div>
        </div>
        
        <!-- Player Front Line -->
        <div class="board-row player-zone">
          <div each={ i in [1,2,3,4,5] } class="slot" id="player-front-{i}" 
               ondragover={ allowDrop } 
               ondragenter={ dragEnter } 
               ondragleave={ dragLeave } 
               ondrop={ handleDrop }>
            <virtual if={ slots['player-front-'+i] }>
              <div class="spell-card { slots['player-front-'+i].element }"
                   draggable="true"
                   data-card-id={ slots['player-front-'+i].instanceId }
                   ondragstart={ parent.dragStart }>
                <div class="mana-indicator">{ slots['player-front-'+i].mana }</div>
                <div class="card-header">{ slots['player-front-'+i].name }</div>
                <div class="card-body">{ slots['player-front-'+i].type === 'unit' ? 'Unit' : 'Spell' } Card</div>
                <div class="card-footer">
                  <span class="type-indicator">{ slots['player-front-'+i].element }</span>
                </div>
                <div class="damage-indicator">{ slots['player-front-'+i].damage }</div>
                <div if={ slots['player-front-'+i].type === 'unit' } class="health-indicator">{ slots['player-front-'+i].health }</div>
              </div>
            </virtual>
          </div>
        </div>
        
        <!-- Player Back Line -->
        <div class="board-row player-zone">
          <div each={ i in [1,2,3,4,5] } class="slot" id="player-back-{i}" 
               ondragover={ allowDrop } 
               ondragenter={ dragEnter } 
               ondragleave={ dragLeave } 
               ondrop={ handleDrop }>
            <virtual if={ slots['player-back-'+i] }>
              <div class="spell-card { slots['player-back-'+i].element }"
                   draggable="true"
                   data-card-id={ slots['player-back-'+i].instanceId }
                   ondragstart={ parent.dragStart }>
                <div class="mana-indicator">{ slots['player-back-'+i].mana }</div>
                <div class="card-header">{ slots['player-back-'+i].name }</div>
                <div class="card-body">{ slots['player-back-'+i].type === 'unit' ? 'Unit' : 'Spell' } Card</div>
                <div class="card-footer">
                  <span class="type-indicator">{ slots['player-back-'+i].element }</span>
                </div>
                <div class="damage-indicator">{ slots['player-back-'+i].damage }</div>
                <div if={ slots['player-back-'+i].type === 'unit' } class="health-indicator">{ slots['player-back-'+i].health }</div>
              </div>
            </virtual>
          </div>
        </div>
        
      <!-- Player Hand -->
        <!-- Mana Display - Hearthstone style with fixed container width -->
        <div class="mana-display">
          <div class="mana-container">
            <div class="mana-text">({ currentMana }/{ maxMana })</div>
            <div class="mana-crystals">
              <div each={ i, index in new Array(10) } class="mana-crystal { index < currentMana ? 'active' : '' } { index >= maxMana ? 'hidden' : '' }"></div>
            </div>
          </div>
        </div>
      
        <div class="hand" id="player-hand">
          <div each={ card in playerHand } class="spell-card { card.element } { card.mana <= currentMana ? 'playable' : '' }" 
               draggable="true" 
               data-card-id={ card.instanceId } 
               ondragstart={ parent.dragStart }>
            <div class="mana-indicator">{ card.mana }</div>
            <div class="card-header">{ card.name }</div>
            <div class="card-body">{ card.type === 'unit' ? 'Unit' : 'Spell' } Card</div>
            <div class="card-footer">
              <span class="type-indicator">{ card.element }</span>
            </div>
            <div class="damage-indicator">{ card.damage }</div>
            <div if={ card.type === 'unit' } class="health-indicator">{ card.health }</div>
          </div>
        </div>
  </div>
      
      <!-- Action Buttons -->
      <div class="action-area">
        <button class="cast-button" onclick={ drawCard }>Draw Card</button>
        <div class="end-turn-container">
          <button class="end-turn-button" onclick={ endTurn } disabled={ isOpponentTurn }>End Turn</button>
        </div>
      </div>
      
      <!-- Game Log -->
      <div class="log-area">
        <div each={ entry in logEntries } class="log-entry">{ entry }</div>
      </div>
    </div>
  </div>

  <script>
    const self = this;
    
    // Game state
    self.playerHand = [];
    self.playerDeck = [];
    self.slots = {};
    self.draggingCardId = null;
    self.isOpponentTurn = false;
    self.logEntries = ["Game started. Your turn!"];
    self.currentMana = 1;  // Start with 1 mana
    self.maxMana = 1;      // Max mana starts at 1, increases each turn
    
    // Card templates - these would be loaded from a database in a real game
    self.cardTemplates = [
      { id: 1, name: 'Warrior', type: 'unit', element: 'earth', damage: 3, health: 4, mana: 4 },
      { id: 2, name: 'Mage', type: 'unit', element: 'arcane', damage: 5, health: 2, mana: 5 },
      { id: 3, name: 'Archer', type: 'unit', element: 'earth', damage: 4, health: 3, mana: 4 },
      { id: 4, name: 'Cleric', type: 'unit', element: 'water', damage: 2, health: 5, mana: 3 },
      { id: 5, name: 'Fireball', type: 'spell', element: 'fire', damage: 4, health: 0, mana: 3 },
      { id: 6, name: 'Ice Blast', type: 'spell', element: 'ice', damage: 3, health: 0, mana: 2 },
      { id: 7, name: 'Scout', type: 'unit', element: 'earth', damage: 1, health: 1, mana: 1 },
      { id: 8, name: 'Flame Wisp', type: 'unit', element: 'fire', damage: 2, health: 1, mana: 1 },
      { id: 9, name: 'Water Elemental', type: 'unit', element: 'water', damage: 3, health: 6, mana: 6 },
      { id: 10, name: 'Arcane Missile', type: 'spell', element: 'arcane', damage: 1, health: 0, mana: 1 },
    ];
    
    // Initialize the game
    self.on('mount', function() {
      self.initGame();
    });
    
    // Initialize game
    self.initGame = function() {
      // Initialize deck with cards
      self.playerDeck = [...self.cardTemplates, ...self.cardTemplates]; // Two copies of each
      
      // Shuffle deck
      self.shuffleDeck();
      
      // Draw initial hand
      for (let i = 0; i < 5; i++) {
        self.drawCard();
      }
      
      // Initialize slots
      const slotElements = document.querySelectorAll('.slot');
      slotElements.forEach(slot => {
        self.slots[slot.id] = null; // No card in slot initially
      });
      
      self.currentMana = 1; // Start with 1 mana
      self.maxMana = 1;     // Initial mana cap also 1
      
      self.addLogEntry('Game initialized. You drew 5 cards. Starting with 1 mana.');
      self.update();
    };
    
    // Shuffle the deck (Fisher-Yates algorithm)
    self.shuffleDeck = function() {
      for (let i = self.playerDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [self.playerDeck[i], self.playerDeck[j]] = [self.playerDeck[j], self.playerDeck[i]];
      }
    };
    
    // Draw a card from deck to hand
    self.drawCard = function() {
      if (self.playerDeck.length === 0) {
        self.addLogEntry('No cards left in deck!');
        return null;
      }
      
      const cardTemplate = self.playerDeck.pop();
      const cardId = `card-${Date.now()}-${Math.floor(Math.random() * 1000)}`; // Unique ID
      const card = { ...cardTemplate, instanceId: cardId };
      
      self.playerHand.push(card);
      self.addLogEntry(`You drew ${card.name}.`);
      self.update();
      
      return card;
    };
    
    // End the turn
    self.endTurn = function() {
      self.isOpponentTurn = true;
      self.addLogEntry('Turn ended. Opponent\'s turn now.');
      self.update();
      
      // Simulate opponent's turn
      setTimeout(() => {
        self.isOpponentTurn = false;
        
        // Increase mana for new turn (up to max of 10)
        self.maxMana = Math.min(self.maxMana + 1, 10);
        self.currentMana = self.maxMana;
        
        self.addLogEntry(`Your turn begins. Mana refreshed to ${self.currentMana}.`);
        self.update();
      }, 2000);
    };
    
    // Add a log entry
    self.addLogEntry = function(text) {
      self.logEntries.push(text);
      // Keep only last 10 entries
      if (self.logEntries.length > 10) {
        self.logEntries.shift();
      }
      self.update();
    };
    
    // Drag and drop handlers
    self.dragStart = function(e) {
      // Get the card ID directly from the data attribute
      const cardElement = e.currentTarget;
      const cardId = cardElement.getAttribute('data-card-id');
      
      self.draggingCardId = cardId;
      e.dataTransfer.setData('text/plain', cardId);
    };
    
    // Allow drop
    self.allowDrop = function(e) {
      e.preventDefault(); // Allow drop
    };
    
    // Drag enter (highlight valid/invalid targets)
    self.dragEnter = function(e) {
      const slot = e.currentTarget;
      if (self.canDropInSlot(slot)) {
        slot.classList.add('valid-target');
      } else {
        slot.classList.add('invalid-target');
      }
    };
    
    // Drag leave
    self.dragLeave = function(e) {
      const slot = e.currentTarget;
      slot.classList.remove('valid-target', 'invalid-target');
    };
    
    // Drop handler - refactored to be state-driven
    self.handleDrop = function(e) {
      e.preventDefault();
      
      const slot = e.currentTarget;
      slot.classList.remove('valid-target', 'invalid-target');
      
      if (!self.canDropInSlot(slot)) {
        self.addLogEntry('Cannot place card there.');
        return;
      }
      
      const cardId = e.dataTransfer.getData('text/plain');
      
      // Find the card in hand
      const cardIdx = self.playerHand.findIndex(card => card.instanceId === cardId);
      if (cardIdx !== -1) {
        // Card is from player's hand
        const card = self.playerHand[cardIdx];
        
        // Check if player has enough mana
        if (card.mana > self.currentMana) {
          self.addLogEntry(`Not enough mana! Need ${card.mana} but only have ${self.currentMana}.`);
          return;
        }
        
        // Remove card from hand and spend mana
        self.playerHand.splice(cardIdx, 1);
        self.currentMana -= card.mana;
        
        // Update the slot reference in game state
        self.slots[slot.id] = card;
        
        self.addLogEntry(`Card ${card.name} placed in ${slot.id}. Spent ${card.mana} mana. ${self.currentMana} mana remaining.`);
        self.update();
      } else {
        // Handle card movement between slots
        const srcSlotId = Object.keys(self.slots).find(id => 
          self.slots[id] && self.slots[id].instanceId === cardId
        );
        
        if (srcSlotId) {
          const card = self.slots[srcSlotId];
          self.slots[srcSlotId] = null;
          self.slots[slot.id] = card;
          
          self.addLogEntry(`Card moved from ${srcSlotId} to ${slot.id}.`);
          self.update();
        }
      }
    };
    
    // Check if a card can be dropped in a particular slot
    self.canDropInSlot = function(slot) {
      // Only allow drops in player slots
      if (slot.id.startsWith('enemy-')) {
        return false; // Cannot place in enemy zones
      }
      
      // If slot already has a card, don't allow drop
      if (self.slots[slot.id] !== null) {
        return false;
      }
      
      // Check if player has enough mana for the card
      const cardId = self.draggingCardId;
      if (cardId) {
        // If the card is from the hand (not moving between slots)
        const cardInHand = self.playerHand.find(card => card.instanceId === cardId);
        if (cardInHand && cardInHand.mana > self.currentMana) {
          return false; // Not enough mana
        }
      }
      
      return true;
    };
  </script>
  
  <link rel="stylesheet" href="styles.css">
</my-app>