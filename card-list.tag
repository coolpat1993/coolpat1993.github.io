<card-list>
  <div class="card-list-container">
    <div class="main-content-wrapper">
      <div class="cards-section">
        <div class="filters">
          <div class="filter-group">
            <span class="filter-label">Filter by:</span>
            <select ref="typeFilter" onchange={ updateFilters }>
              <option value="">All Types</option>
              <option value="unit">Units</option>
              <option value="item">Items</option>
              <option value="spell">Spells</option>
              <option value="banner">Banners</option>
              <option value="hero">Heroes</option>
            </select>
            
            <select ref="classFilter" onchange={ updateFilters }>
              <option value="">All Classes</option>
              <option value="neutral">Neutral</option>
              <option value="necromancer">Necromancer</option>
              <option value="warrior">Warrior</option>
            </select>
          </div>
          
          <div class="sort-group">
            <span class="filter-label">Sort by:</span>
            <select ref="sortBy" onchange={ updateFilters }>
              <option value="mana">Mana Cost</option>
              <option value="name">Name</option>
              <option value="attack">Attack</option>
              <option value="health">Health</option>
            </select>
            
            <select ref="sortOrder" onchange={ updateFilters }>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
          
          <div class="search-bar">
            <input type="text" ref="searchInput" placeholder="Search cards..." onkeyup={ updateFilters }>
          </div>
        </div>
        
        <div class="category-section" each={ classGroup, className in groupedCards }>
          <h2 class="category-header">{ getCategoryTitle(className) }</h2>
          
          <div class="type-section" each={ typeGroup, typeName in classGroup }>
            <h3 class="type-header">{ getTypeTitle(typeName) }</h3>
            <div class="card-grid">
              <div class="card-wrapper" each={ card in typeGroup }>
                <card data={ card } onClick={ showCardDetails }></card>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Deck Panel Sidebar -->
      <div class="deck-panel">
        <div class="deck-header">
          <h2>Current Deck</h2>
          <div class="deck-actions">
            <div class="deck-select-wrapper">
              <select ref="deckSelector" onchange={ switchCurrentDeck }>
                <option each={ deck, index in decks } value={ index } selected={ index === currentDeckIndex }>
                  { deck.name }
                </option>
              </select>
              <button onclick={ createNewDeck } class="btn-create-deck" title="Create New Deck">+</button>
              <button if={ decks.length > 1 } onclick={ deleteCurrentDeck } class="btn-delete-deck" title="Delete Current Deck">×</button>
            </div>
          </div>
        </div>
        
        <div class="deck-stats">
          <div class="card-count">
            <span class="count-value">{ currentDeck && currentDeck.cards ? currentDeck.cards.length : 0 }</span> / 30 cards
          </div>
          
          <div class="mana-curve">
            <div class="curve-bar" each={ count, cost in manaCurve }>
              <div class="bar-fill" style="height: { getBarHeight(count) }%"></div>
              <div class="bar-label">{ cost }</div>
            </div>
          </div>
        </div>
        
        <div class="deck-cards">
          <div each={ groupedCard in getGroupedDeckCards() } class="deck-card-item">
            <div class="deck-card-cost">{ groupedCard.card.mana }</div>
            <div class="deck-card-name">{ groupedCard.card.name } x{ groupedCard.count }</div>
            <button class="deck-card-remove" onclick={ () => removeCardFromDeck(groupedCard.indices) }>×</button>
          </div>
          <div if={ !currentDeckCards || currentDeckCards.length === 0 } class="empty-deck-message">
            Your deck is empty. Click on cards to add them.
          </div>
        </div>
      </div>
    </div>
    
    <!-- Card Detail Modal -->
    <div class="card-modal { isModalOpen ? 'open' : '' }" onclick={ closeModalOnBackdropClick }>
      <div class="modal-content" onclick={ preventBubbling }>
        <span class="close-modal" onclick={ closeModal }>&times;</span>
        <div class="card-detail-container" if={ selectedCard }>
          <div class="card-detail-left">
            <card data={ selectedCard }></card>
          </div>
          <div class="card-detail-right">
            <h2>{ selectedCard.name }</h2>
            <div class="card-stats">
              <p><strong>Type:</strong> { selectedCard.type }</p>
              <p><strong>Class:</strong> { selectedCard.class }</p>
              <p if={ selectedCard.attack > 0 }><strong>Attack:</strong> { selectedCard.attack > 0 ? selectedCard.attack : getItemAttackValue(selectedCard.description) }</p>
              <p if={ selectedCard.health > 0 }><strong>Health:</strong> { selectedCard.health }</p>
              <p if={ selectedCard.mana !== undefined && selectedCard.mana !== null }><strong>Mana:</strong> { selectedCard.mana }</p>
            </div>
            <div class="card-description-full">
              <p><strong>Description:</strong></p>
              <p>{ selectedCard.description }</p>
            </div>
            <div class="card-actions">
              <button onclick={ addSelectedCardToDeck } class="btn-add-to-deck" disabled={ isDeckFull() || isCardAtMaxCopies(selectedCard) }>
                { getAddButtonText(selectedCard) }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const self = this;
    self.allCards = [];
    self.filteredCards = [];
    self.groupedCards = {};
    self.isModalOpen = false;
    self.selectedCard = null;
    
    // Deck management
    self.decks = [];
    self.currentDeckIndex = 0;
    self.currentDeck = null;
    self.currentDeckCards = [];
    self.manaCurve = {};
    
    // Initialize components
    self.on('mount', function() {
      // Load the deck manager script
      if (typeof deckManager === 'undefined') {
        const scriptTag = document.createElement('script');
        scriptTag.src = 'deck-manager.js';
        scriptTag.onload = function() {
          self.initDeckSystem();
          self.loadCards();
        };
        document.head.appendChild(scriptTag);
      } else {
        self.initDeckSystem();
        self.loadCards();
      }
    });
    
    // Initialize deck system
    self.initDeckSystem = function() {
      self.decks = deckManager.decks;
      self.currentDeckIndex = deckManager.currentDeckIndex;
      self.currentDeck = deckManager.getCurrentDeck();
      self.update();
    };
    
    // Load all cards from the JSON file
    self.loadCards = function() {
      fetch('cards.json')
        .then(response => response.json())
        .then(data => {
          self.allCards = data;
          self.updateDeckCards();
          self.applyFilters();
        })
        .catch(error => {
          console.error('Error loading cards:', error);
        });
    };
    
    // Update the cards in the current deck
    self.updateDeckCards = function() {
      if (!self.currentDeck || !self.allCards || self.allCards.length === 0) return;
      
      // Use the sorted deck cards function
      self.currentDeckCards = deckManager.getSortedDeckCards(self.allCards);
      
      // Calculate mana curve
      self.manaCurve = {};
      for (let i = 0; i <= 7; i++) {
        self.manaCurve[i] = 0;
      }
      
      self.currentDeckCards.forEach(card => {
        const cost = card.mana;
        if (cost >= 7) {
          self.manaCurve[7] = (self.manaCurve[7] || 0) + 1;
        } else {
          self.manaCurve[cost] = (self.manaCurve[cost] || 0) + 1;
        }
      });
      
      self.update();
    };
    
    // Calculate bar height for mana curve
    self.getBarHeight = function(count) {
      if (!count) return 0;
      const maxCount = Math.max(...Object.values(self.manaCurve));
      return maxCount > 0 ? (count / maxCount) * 100 : 0;
    };
    
    // Check if deck is full
    self.isDeckFull = function() {
      return self.currentDeck && self.currentDeck.cards.length >= 30;
    };
    
    // Check if a card is already in deck at max copies
    self.isCardAtMaxCopies = function(card) {
      if (!card || !self.currentDeck) return false;
      const count = deckManager.countCardInDeck(card.id);
      return count >= 2; // Max 2 copies allowed
    };
    
    // Group deck cards by card ID to display counts
    self.getGroupedDeckCards = function() {
      if (!self.currentDeckCards || self.currentDeckCards.length === 0) return [];
      
      const groupedCards = [];
      const cardMap = {};
      
      // Group cards by their ID
      self.currentDeckCards.forEach(card => {
        if (!cardMap[card.id]) {
          cardMap[card.id] = {
            card: card,
            count: 1,
            indices: [self.currentDeck.cards.indexOf(card.id)]
          };
        } else {
          cardMap[card.id].count++;
          cardMap[card.id].indices.push(
            self.currentDeck.cards.indexOf(card.id, cardMap[card.id].indices[cardMap[card.id].indices.length - 1] + 1)
          );
        }
      });
      
      // Convert to array and sort by mana cost
      const result = Object.values(cardMap);
      result.sort((a, b) => {
        if (a.card.mana !== b.card.mana) {
          return a.card.mana - b.card.mana;
        }
        return a.card.name.localeCompare(b.card.name);
      });
      
      return result;
    };
    
    // Create new deck
    self.createNewDeck = function() {
      const name = prompt("Enter deck name:", `New Deck ${self.decks.length + 1}`);
      if (name) {
        deckManager.createDeck(name);
        self.decks = deckManager.decks;
        self.currentDeckIndex = deckManager.currentDeckIndex;
        self.currentDeck = deckManager.getCurrentDeck();
        self.updateDeckCards();
        self.update();
      }
    };
    
    // Delete current deck
    self.deleteCurrentDeck = function() {
      if (confirm("Are you sure you want to delete this deck?")) {
        deckManager.deleteDeck(self.currentDeckIndex);
        self.decks = deckManager.decks;
        self.currentDeckIndex = deckManager.currentDeckIndex;
        self.currentDeck = deckManager.getCurrentDeck();
        self.updateDeckCards();
        self.update();
      }
    };
    
    // Switch to a different deck
    self.switchCurrentDeck = function(e) {
      const index = parseInt(e.target.value, 10);
      if (deckManager.switchDeck(index)) {
        self.currentDeckIndex = deckManager.currentDeckIndex;
        self.currentDeck = deckManager.getCurrentDeck();
        self.updateDeckCards();
        self.update();
      }
    };
    
    // Add selected card to deck
    self.addSelectedCardToDeck = function() {
      if (!self.selectedCard) return;
      
      const result = deckManager.addCardToDeck(self.selectedCard.id);
      if (result.success) {
        self.currentDeck = deckManager.getCurrentDeck();
        self.updateDeckCards();
        self.update();
      } else {
        alert(result.message);
      }
    };
    
    // Remove card from deck
    self.removeCardFromDeck = function(cardIndices) {
      // Remove in reverse order to avoid index shifting problems
      const indices = Array.isArray(cardIndices) ? cardIndices.slice().sort((a, b) => b - a) : [cardIndices];
      
      let success = true;
      indices.forEach(idx => {
        if (!deckManager.removeCardFromDeck(idx)) {
          success = false;
        }
      });
      
      if (success) {
        self.currentDeck = deckManager.getCurrentDeck();
        self.updateDeckCards();
        self.update();
      }
    };
    
    // Update filters when inputs change
    self.updateFilters = function() {
      self.applyFilters();
    }
    
    // Apply filters and group cards
    self.applyFilters = function() {
      const typeFilter = self.refs.typeFilter.value;
      const classFilter = self.refs.classFilter.value;
      const searchTerm = self.refs.searchInput.value.toLowerCase();
      const sortBy = self.refs.sortBy.value;
      const sortOrder = self.refs.sortOrder.value;
      
      // Apply filters
      self.filteredCards = self.allCards.filter(card => {
        // Type filter
        if (typeFilter && card.type !== typeFilter) return false;
        
        // Class filter
        if (classFilter && card.class !== classFilter) return false;
        
        // Search term
        if (searchTerm && !card.name.toLowerCase().includes(searchTerm) && 
            !card.description.toLowerCase().includes(searchTerm)) return false;
        
        return true;
      });
      
      // Group cards first by class, then by type
      self.groupedCards = {};
      
      self.filteredCards.forEach(card => {
        // Group by class
        const cardClass = card.class || 'uncategorized';
        if (!self.groupedCards[cardClass]) {
          self.groupedCards[cardClass] = {};
        }
        
        // Group by type within class
        const cardType = card.type || 'uncategorized';
        if (!self.groupedCards[cardClass][cardType]) {
          self.groupedCards[cardClass][cardType] = [];
        }
        
        self.groupedCards[cardClass][cardType].push(card);
      });
      
      // Sort each type by the selected criteria
      Object.keys(self.groupedCards).forEach(cardClass => {
        Object.keys(self.groupedCards[cardClass]).forEach(cardType => {
          self.groupedCards[cardClass][cardType].sort((a, b) => {
            let comparison = 0;
            
            // Handle null or undefined values
            const aValue = self.getCardValue(a, sortBy);
            const bValue = self.getCardValue(b, sortBy);
            
            // Compare values based on type
            if (typeof aValue === 'string' && typeof bValue === 'string') {
              comparison = aValue.localeCompare(bValue);
            } else {
              comparison = aValue - bValue;
            }
            
            // Apply sort order
            return sortOrder === 'asc' ? comparison : -comparison;
          });
        });
      });
      
      // Define type order for display
      self.typeOrder = ['hero', 'unit', 'spell', 'banner', 'item'];
      
      self.update();
    }
    
    // Helper function to get card value based on sort criteria
    self.getCardValue = function(card, sortBy) {
      if (sortBy === 'name') {
        return card.name || '';
      } else if (sortBy === 'attack') {
        // For items with attack in description
        if (card.type === 'item' && (!card.attack || card.attack === 0)) {
          return self.getItemAttackValue(card.description);
        }
        return card.attack || 0;
      } else if (sortBy === 'health') {
        return card.health || 0;
      } else {
        // Default to mana
        return card.mana || 0;
      }
    }
    
    // Get a formatted title for each class
    self.getCategoryTitle = function(className) {
      // Handle empty class name
      if (!className || className === 'uncategorized') return 'Uncategorized';
      
      // Format the class name (capitalize first letter)
      return className.charAt(0).toUpperCase() + className.slice(1);
    }
    
    // Get a formatted title for each type
    self.getTypeTitle = function(typeName) {
      // Handle empty type name
      if (!typeName || typeName === 'uncategorized') return 'Other';
      
      // Format the type name (capitalize first letter and pluralize)
      const title = typeName.charAt(0).toUpperCase() + typeName.slice(1);
      
      // Add 's' to pluralize, except for special cases
      if (typeName === 'hero') return title + 'es';
      return title + 's';
    }
    
    // Show card details in modal
    self.showCardDetails = function(card) {
      console.log("Card clicked:", card.item.card);
      self.selectedCard = card.item.card;
      self.isModalOpen = true;
      self.update();
    }
    
    // Close the modal
    self.closeModal = function(e) {
      self.isModalOpen = false;
      self.update();
      if (e) e.stopPropagation();
    }
    
    // Close modal when clicking on backdrop
    self.closeModalOnBackdropClick = function(e) {
      if (e.target === e.currentTarget) {
        self.closeModal();
      }
    }
    
    // Prevent event bubbling
    self.preventBubbling = function(e) {
      e.stopPropagation();
    }

    // Extract attack value from item description
    self.getItemAttackValue = function(description) {
      const match = description.match(/\+(\d+)\s*ATK/);
      return match ? parseInt(match[1], 10) : 0;
    }

    // Get the text for the add button
    self.getAddButtonText = function(card) {
      if (self.isCardAtMaxCopies(card)) {
        return 'Max copies in deck';
      } else if (self.isDeckFull()) {
        return 'Deck is full';
      } else {
        return 'Add to Deck';
      }
    }
  </script>

    <style>
    .card-list-container {
      max-width: 100%;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Belwe Bold', 'Times New Roman', serif;
    }
    
    /* Layout structure for main content and deck sidebar */
    .main-content-wrapper {
      display: flex;
      gap: 20px;
    }
    
    .cards-section {
      flex: 1;
    }
    
    .deck-panel {
      width: 300px;
      flex-shrink: 0;
      background: rgba(47, 28, 14, 0.8);
      border-radius: 8px;
      border: 2px solid #8c6d35;
      padding: 15px;
      height: calc(100vh - 80px);
      position: sticky;
      top: 20px;
      display: flex;
      flex-direction: column;
    }
    
    .deck-header {
      display: flex;
      flex-direction: column;
      gap: 10px;
      border-bottom: 1px solid #8c6d35;
      padding-bottom: 10px;
    }
    
    .deck-header h2 {
      color: #e6b948;
      margin: 0;
    }
    
    .deck-select-wrapper {
      display: flex;
      gap: 5px;
      align-items: center;
    }
    
    .deck-select-wrapper select {
      flex: 1;
    }
    
    .btn-create-deck, .btn-delete-deck {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 1px solid #8c6d35;
      background: #e6b948;
      cursor: pointer;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    
    .btn-delete-deck {
      background: #d9534f;
      color: white;
    }
    
    .deck-stats {
      padding: 15px 0;
      border-bottom: 1px solid #8c6d35;
    }
    
    .card-count {
      color: #e6b948;
      font-weight: bold;
      text-align: center;
      margin-bottom: 10px;
    }
    
    .count-value {
      font-size: 18px;
    }
    
    .mana-curve {
      height: 100px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 10px;
    }
    
    .curve-bar {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      position: relative;
    }
    
    .bar-fill {
      width: 15px;
      background: #4a90e2;
      position: absolute;
      bottom: 20px;
      border-radius: 3px 3px 0 0;
    }
    
    .bar-label {
      position: absolute;
      bottom: 0;
      color: #e6b948;
      font-size: 12px;
    }
    
    .deck-cards {
      flex: 1;
      overflow-y: auto;
      padding-top: 10px;
    }
    
    .deck-card-item {
      display: flex;
      align-items: center;
      padding: 8px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.1);
      margin-bottom: 5px;
      color: white;
    }
    
    .deck-card-cost {
      width: 25px;
      height: 25px;
      background: #3a6ba8;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      margin-right: 8px;
    }
    
    .deck-card-name {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .deck-card-remove {
      width: 20px;
      height: 20px;
      background: none;
      border: none;
      color: #d9534f;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.7;
    }
    
    .deck-card-remove:hover {
      opacity: 1;
    }
    
    .empty-deck-message {
      color: #aaa;
      text-align: center;
      padding: 20px;
    }
    
    .card-actions {
      margin-top: 20px;
    }
    
    .btn-add-to-deck {
      background: #4a90e2;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .btn-add-to-deck:disabled {
      background: #888;
      cursor: not-allowed;
    }
    
    .filters {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      background: rgba(47, 28, 14, 0.7);
      padding: 15px;
      border-radius: 8px;
      border: 2px solid #8c6d35;
      flex-wrap: wrap;
      gap: 10px;
    }
    
    .filter-group, .sort-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .filter-label {
      color: #e6b948;
      font-weight: bold;
    }
    
    select, input {
      background: #e6b948;
      border: 2px solid #8c6d35;
      padding: 8px 12px;
      border-radius: 5px;
      color: #2f1c0e;
      font-weight: bold;
    }
    
    .search-bar input {
      min-width: 250px;
    }
    
    .category-section {
      margin-bottom: 30px;
    }
    
    .category-header {
      color: #e6b948;
      border-bottom: 2px solid #8c6d35;
      padding-bottom: 10px;
      margin-top: 30px;
      text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.7);
    }
    
    .type-section {
      margin-bottom: 20px;
    }
    
    .type-header {
      color: #c2a150;
      margin-top: 15px;
      margin-bottom: 10px;
      padding-left: 15px;
      font-size: 1.3rem;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6);
    }
    
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    
    .card-wrapper {
      display: flex;
      justify-content: center;
      cursor: pointer;
    }
    
    /* Modal styles */
    .card-modal {
      display: none;
      position: fixed;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      z-index: 100;
    }
    
    .card-modal.open {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .modal-content {
      background: linear-gradient(135deg, #5a4c44 0%, #2f1c0e 100%);
      padding: 30px;
      border-radius: 10px;
      border: 3px solid #8c6d35;
      width: 90%;
      max-width: 900px;
      position: relative;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
      overflow-y: auto;
      max-height: 90vh;
    }
    
    .close-modal {
      position: absolute;
      top: 10px;
      right: 15px;
      font-size: 24px;
      color: #e6b948;
      cursor: pointer;
      font-weight: bold;
    }
    
    .card-detail-container {
      display: flex;
      flex-wrap: wrap;
      gap: 30px;
    }
    
    .card-detail-left {
      flex: 0 0 auto;
      transform: scale(1.5);
      transform-origin: top left;
      margin: 20px;
      margin-right: 50px;
      height: 0px; /* Corrected height value */
      width: 100px;
    }
    
    .card-detail-right {
      flex: 1;
      color: #fff;
      min-width: 300px;
      padding-left: 20px;
    }
    
    .card-detail-right h2 {
      color: #e6b948;
      margin-top: 0;
    }
    
    .card-stats p {
      margin: 5px 0;
    }
    
    .card-description-full {
      margin-top: 20px;
      background: rgba(255, 255, 255, 0.1);
      padding: 10px;
      border-radius: 5px;
    }

    /* Media queries for responsive design */
    @media (max-width: 1100px) {
      .main-content-wrapper {
        flex-direction: column;
      }
      
      .deck-panel {
        width: 100%;
        height: auto;
        position: relative;
        top: 0;
      }
      
      .deck-cards {
        max-height: 300px;
      }
    }

  </style>
</card-list>