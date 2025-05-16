<my-app>
  <div class="container">
    <div class="game-area">
      <!-- Enemy Hand Display -->
      <!--  <div class="hand enemy-hand" id="enemy-hand">
        <div each={ card, i in enemyHand } class="card-back">
          <div class="card-cost">{ card.mana }</div>
        </div>
      </div>  -->

              <!-- Enemy Hand with visible cards -->
        <div class="hand enemy-hand-container">
          <div each={ card in enemyHand } class="enemy-card-wrapper">
            <card data={ card } class="enemy-card"></card>
          </div>
        </div>
      
      <!-- Enemy Mana Display -->
      <div class="mana-display enemy-mana">
        <div class="mana-container">
          <div class="mana-text">({ enemyMana }/{ enemyMaxMana })</div>
          <div class="mana-crystals">
            <div each={ i, index in new Array(10) } class="mana-crystal { index < enemyMana ? 'active' : '' } { index >= enemyMaxMana ? 'hidden' : '' }"></div>
          </div>
        </div>
      </div>
      
      <!-- Board Area Refactored to use state-driven approach -->
      <div class="board-area">

      <div class="board-area-inner">
        <!-- Enemy Back Line -->
        <div class="board-row enemy-zone">
          <div each={ i in [1,2,3,4,5] } class="slot" id="enemy-back-{i}" 
               ondragover={ allowDrop } 
               ondragenter={ dragEnter } 
               ondragleave={ dragLeave } 
               ondrop={ handleDrop }>
            <virtual if={ slots['enemy-back-'+i] }>
              <card draggable="false" 
                    data={ slots['enemy-back-'+i] } 
                    data-slot-id="enemy-back-{i}">
              </card>
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
              <card draggable="false" 
                    data={ slots['enemy-front-'+i] } 
                    data-slot-id="enemy-front-{i}">
              </card>
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
              <card draggable="true" 
                    data={ slots['player-front-'+i] } 
                    onDragStart={ parent.handleCardDragStart } 
                    data-slot-id="player-front-{i}"
                    data-card-id={ slots['player-front-'+i].instanceId }>
              </card>
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
              <card draggable="true" 
                    data={ slots['player-back-'+i] } 
                    onDragStart={ parent.handleCardDragStart } 
                    data-slot-id="player-back-{i}"
                    data-card-id={ slots['player-back-'+i].instanceId }>
              </card>
            </virtual>
          </div>
        </div>

        
        <!-- Enemy Deck -->
        <div class="deck enemy-deck">
          <div class="deck-back"></div>
          <div class="ingame-card-count">{ enemyDeck.length }</div>
        </div>

        <div class="end-turn-container">
          <button class="end-turn-button" onclick={ endTurn } disabled={ isOpponentTurn }>End Turn</button>
        </div>
        
        <!-- Player Deck -->
        <div class="deck player-deck">
          <div class="deck-back"></div>
          <div class="ingame-card-count">{ playerDeck.length }</div>
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
          <div each={ card in playerHand } class="card-wrapper">
            <card draggable="true" 
                  data={ card } 
                  onDragStart={ parent.handleCardDragStart }
                  data-card-id={ card.instanceId }
                  playable={ getPlayableState(card) }>
            </card>
          </div>
        </div>
        
  </div>
      
      <!-- Action Buttons -->
      <div class="action-area">
        <button class="cast-button" onclick={ drawCard }>Draw Card</button>
        
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
    self.enemyHand = [];
    self.enemyDeck = [];
    self.slots = {};
    self.draggingCardId = null;
    self.isOpponentTurn = false;
    self.logEntries = ["Game started. Your turn!"];
    self.currentMana = 1;   // Player starting mana
    self.maxMana = 1;       // Player max mana
    self.enemyMana = 0;     // Enemy starting mana
    self.enemyMaxMana = 0;  // Enemy max mana
    self.cardLibrary = [];  // All available cards from JSON
    self.enemyAI = null;    // Will hold the enemy AI instance
    
    // Enemy card collection (IDs) - using neutral and necromancer cards
    self.enemyCardCollection = [
      // Frontline units
      1, 4, 9, 10, 39, 40, 46,
      // Backline units
      3, 7, 41, 42, 43, 45, 47,
      // Banners
      16, 17,
      // Spells
      48, 49, 50, 51, 52,
      // Items
      22, 24, 27, 53, 54, 55
    ];
    
    // Initialize the game
    self.on('mount', function() {
      // Load deck manager script first if it doesn't exist
      if (typeof deckManager === 'undefined') {
        const deckManagerScript = document.createElement('script');
        deckManagerScript.src = 'deck-manager.js';
        deckManagerScript.onload = () => {
          // Now load card data
          self.loadCardDataAndInitGame();
        };
        document.head.appendChild(deckManagerScript);
      } else {
        // Deck manager already loaded, proceed to load card data
        self.loadCardDataAndInitGame();
      }
    });
    
    // Load card data and initialize game
    self.loadCardDataAndInitGame = function() {
      // Load card data from JSON file
      fetch('cards.json')
        .then(response => response.json())
        .then(data => {
          self.cardLibrary = data;
          self.initGame();
        })
        .catch(error => {
          console.error('Error loading cards:', error);
          self.addLogEntry('Error loading cards. Check console for details.');
        });
    };
    
    // Initialize game
    self.initGame = function() {
      // Get player deck from the deck manager
      const currentDeck = deckManager.getCurrentDeck();
      if (!currentDeck) {
        self.addLogEntry('Error: No deck available. Please create a deck first.');
        return;
      }
      
      // Use the current deck from deck manager
      self.playerDeck = [...currentDeck.cards];
      
      // Initialize enemy deck with cards from enemy's collection
      self.enemyDeck = [...self.enemyCardCollection];
      
      // Shuffle both decks
      self.shuffleDeck(self.playerDeck);
      self.shuffleDeck(self.enemyDeck);
      
      // Draw initial hands
      for (let i = 0; i < 5; i++) {
        self.drawCard('player');
        self.drawCard('enemy');
      }
      
      // Initialize slots
      const slotElements = document.querySelectorAll('.slot');
      slotElements.forEach(slot => {
        self.slots[slot.id] = null; // No card in slot initially
      });
      
      // Set starting mana
      self.currentMana = 1;
      self.maxMana = 1;
      self.enemyMana = 0;
      self.enemyMaxMana = 0;
      
      // Initialize enemy AI
      self.enemyAI = new EnemyAI(self);
      
      self.addLogEntry('Game initialized. Both players drew 5 cards. Starting with 1 mana.');
      self.update();
    };
    
    // Shuffle a deck (Fisher-Yates algorithm)
    self.shuffleDeck = function(deck) {
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
    };
    
    // Draw a card from deck to hand
    self.drawCard = function(player = 'player') {
      // Determine which deck and hand to use
      const deck = player === 'player' ? self.playerDeck : self.enemyDeck;
      const hand = player === 'player' ? self.playerHand : self.enemyHand;
      
      if (deck.length === 0) {
        self.addLogEntry(`${player === 'player' ? 'You have' : 'Enemy has'} no cards left in deck!`);
        return;
      }
      
      // Check if hand is full (max 10 cards)
      if (hand.length >= 10) {
        self.addLogEntry(`${player === 'player' ? 'Your' : 'Enemy'} hand is full! Card burned.`);
        deck.pop(); // Remove top card from deck but don't add to hand
        return;
      }
      
      const cardId = deck.pop();
      const cardTemplate = self.cardLibrary.find(c => c.id === cardId);
      
      if (!cardTemplate) {
        self.addLogEntry(`Error: Card ID ${cardId} not found in library!`);
        return;
      }
      
      const instanceId = `${player}-card-${Date.now()}-${Math.floor(Math.random() * 1000)}`; // Unique ID with player prefix
      const card = { ...cardTemplate, instanceId: instanceId };
      
      hand.push(card);
      
      if (player === 'player') {
        self.addLogEntry(`You drew ${card.name}.`);
      } else {
        self.addLogEntry(`Enemy drew a card.`);
      }
      
      self.update();
      return card;
    };
    
    // Start of a new player round
    self.roundStart = function() {
      // Increase mana for new turn (up to max of 10)
      self.maxMana = Math.min(self.maxMana + 1, 10);
      self.currentMana = self.maxMana;
      
      // Draw a card at the start of the round
      self.drawCard('player');
      
      self.addLogEntry(`Your turn begins. Mana refreshed to ${self.currentMana}.`);
      self.update();
    };
    
    // Start of a new enemy round
    self.enemyRoundStart = function() {
      // Increase mana for new turn (up to max of 10)
      self.enemyMaxMana = Math.min(self.enemyMaxMana + 1, 10);
      self.enemyMana = self.enemyMaxMana;
      
      // Draw a card at the start of the round
      self.drawCard('enemy');
      
      self.addLogEntry(`Enemy's turn begins. Enemy has ${self.enemyMana} mana.`);
      self.update();
      
      // Let the AI take over
      self.enemyAI.takeTurn();
    };
    
    // End the player's turn and start enemy turn
    self.endTurn = function() {
      self.isOpponentTurn = true;
      self.addLogEntry('Turn ended. Opponent\'s turn now.');
      self.update();
      
      // Start enemy turn
      self.enemyRoundStart();
    };
    
    // End the enemy's turn and start player turn
    self.endEnemyTurn = function() {
      self.isOpponentTurn = false;
      self.update();
      
      // Start player's turn
      self.roundStart();
    };
    
    // Add a log entry
    self.addLogEntry = function(text) {
      self.logEntries.push(text);
      // Keep only last 10 entries
      if (self.logEntries.length > 10) {
        self.logEntries.shift();
      }
      self.update();
      
      // Also scroll the log to the bottom
      setTimeout(() => {
        const logArea = document.querySelector('.log-area');
        if (logArea) {
          logArea.scrollTop = logArea.scrollHeight;
        }
      }, 0);
    };
    
    // New drag start handler for card component
    self.handleCardDragStart = function(e) {
      // Don't allow dragging during enemy turn
      if (self.isOpponentTurn) {
        e.preventDefault();
        return false;
      }
      
      // Check if this is an enemy card
      const cardElement = e.currentTarget;
      const slotId = cardElement.getAttribute('data-slot-id');
      if (slotId && slotId.startsWith('enemy-')) {
        e.preventDefault();
        return false;
      }
      
      // Get the card ID from the data attribute
      const cardId = cardElement.getAttribute('data-card-id') || 
                     cardElement.querySelector('[data-card-id]')?.getAttribute('data-card-id');
      
      self.draggingCardId = cardId;
      e.dataTransfer.setData('text/plain', cardId);
    };
    
    // Drag and drop handlers
    self.dragStart = function(e) {
      // Don't allow dragging during enemy turn
      if (self.isOpponentTurn) {
        e.preventDefault();
        return false;
      }
      
      // This is kept for backward compatibility but we now prefer handleCardDragStart
      const cardElement = e.currentTarget;
      const cardId = cardElement.getAttribute('data-card-id');
      
      self.draggingCardId = cardId;
      e.dataTransfer.setData('text/plain', cardId);
    };
    
    // Allow drop
    self.allowDrop = function(e) {
      if (self.isOpponentTurn) {
        e.preventDefault();  // Prevent default to stop the drop
        return false;
      }
      
      e.preventDefault(); // Allow drop
    };
    
    // Drag enter (highlight valid/invalid targets)
    self.dragEnter = function(e) {
      if (self.isOpponentTurn) return;
      
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
      
      if (self.isOpponentTurn) return;
      
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
    
    // Check if there are any units on the player's board
    self.hasUnitOnBoard = function() {
      // Check both front and back lines
      for (let i = 1; i <= 5; i++) {
        if (self.slots[`player-front-${i}`] && self.slots[`player-front-${i}`].type === 'unit') {
          return true;
        }
        if (self.slots[`player-back-${i}`] && self.slots[`player-back-${i}`].type === 'unit') {
          return true;
        }
      }
      return false;
    };

    // Get the playable state of a card
    self.getPlayableState = function(card) {
      // Not playable if not enough mana
      if (card.mana > self.currentMana) {
        return '';
      }
      
      // For item cards, check if there's a unit on board
      if (card.type === 'item' && !self.hasUnitOnBoard()) {
        return '';
      }
      
      // Return the appropriate playable state based on card type
      if (card.type === 'item') {
        return 'playable-item';
      } else {
        return 'playable';
      }
    };

    // Check if a card can be dropped in a particular slot
    self.canDropInSlot = function(slot) {
      // Don't allow drops during enemy turn
      if (self.isOpponentTurn) {
        return false;
      }
      
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