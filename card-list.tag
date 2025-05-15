<card-list>
  <div class="card-list-container">
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
        
        <select ref="categoryFilter" onchange={ updateFilters }>
          <option value="">All Categories</option>
          <option value="neutral">Neutral</option>
          <option value="necromancer">Necromancer</option>
          <option value="item">Items</option>
        </select>
      </div>
      
      <div class="search-bar">
        <input type="text" ref="searchInput" placeholder="Search cards..." onkeyup={ updateFilters }>
      </div>
    </div>
    
    <div class="category-section" each={ category, categoryName in groupedCards }>
      <h2 class="category-header">{ getCategoryTitle(categoryName) }</h2>
      <div class="card-grid">
        <div class="card-wrapper" each={ card in category }>
          <card data={ card } onClick={ showCardDetails }></card>
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
              <p><strong>Category:</strong> { selectedCard.category }</p>
              <p if={ selectedCard.attack > 0 }><strong>Attack:</strong> { selectedCard.attack > 0 ? selectedCard.attack : getItemAttackValue(selectedCard.description) }</p>
              <p if={ selectedCard.health > 0 }><strong>Health:</strong> { selectedCard.health }</p>
              <p if={ selectedCard.mana !== undefined && selectedCard.mana !== null }><strong>Mana:</strong> { selectedCard.mana }</p>
            </div>
            <div class="card-description-full">
              <p><strong>Description:</strong></p>
              <p>{ selectedCard.description }</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <style>
    .card-list-container {
      max-width: 100%;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Belwe Bold', 'Times New Roman', serif;
    }
    
    .filters {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      background: rgba(47, 28, 14, 0.7);
      padding: 15px;
      border-radius: 8px;
      border: 2px solid #8c6d35;
    }
    
    .filter-group {
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

  </style>

  <script>
    const self = this;
    self.allCards = [];
    self.filteredCards = [];
    self.groupedCards = {};
    self.isModalOpen = false;
    self.selectedCard = null;
    
    // Load all cards from the JSON file
    self.on('mount', function() {
      fetch('cards.json')
        .then(response => response.json())
        .then(data => {
          self.allCards = data;
          self.applyFilters();
        })
        .catch(error => {
          console.error('Error loading cards:', error);
        });
    });
    
    // Update filters when inputs change
    self.updateFilters = function() {
      self.applyFilters();
    }
    
    // Apply filters and group cards
    self.applyFilters = function() {
      const typeFilter = self.refs.typeFilter.value;
      const categoryFilter = self.refs.categoryFilter.value;
      const searchTerm = self.refs.searchInput.value.toLowerCase();
      
      // Apply filters
      self.filteredCards = self.allCards.filter(card => {
        // Type filter
        if (typeFilter && card.type !== typeFilter) return false;
        
        // Category filter
        if (categoryFilter && card.category !== categoryFilter) return false;
        
        // Search term
        if (searchTerm && !card.name.toLowerCase().includes(searchTerm) && 
            !card.description.toLowerCase().includes(searchTerm)) return false;
        
        return true;
      });
      
      // Group cards first by category, then by type
      self.groupedCards = {};
      
      self.filteredCards.forEach(card => {
        // Group by category
        const category = card.category || 'uncategorized';
        if (!self.groupedCards[category]) {
          self.groupedCards[category] = [];
        }
        self.groupedCards[category].push(card);
      });
      
      // Sort each category by mana cost, then by name
      Object.keys(self.groupedCards).forEach(category => {
        self.groupedCards[category].sort((a, b) => {
          if (a.mana === b.mana) {
            return a.name.localeCompare(b.name);
          }
          return a.mana - b.mana;
        });
      });
      
      self.update();
    }
    
    // Get a formatted title for each category
    self.getCategoryTitle = function(categoryName) {
      // Handle empty category name
      if (!categoryName || categoryName === 'uncategorized') return 'Uncategorized';
      
      // Format the category name (capitalize first letter)
      return categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
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
  </script>
</card-list>