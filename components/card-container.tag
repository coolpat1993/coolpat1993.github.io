<card-container>
  <div class="card-container">
    <div class="card" each={ card in filteredCards } onclick={ () => onCardClick(card) }>
      <div class="card-inner { card.rarity.toLowerCase() }">
        <div class="card-header">
          <span class="card-name">{ card.name }</span>
          <span class="card-class">{ card.class }</span>
        </div>
        <div class="card-body">
          <div class="card-image">
            <img src={ card.imageUrl } alt={ card.name } />
          </div>
          <div class="card-stats">
            <div class="stat" each={ stat in card.stats }>
              <span class="stat-name">{ stat.name }</span>
              <span class="stat-value">{ stat.value }</span>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <span class="card-slot">{ card.itemSlot }</span>
          <span class="card-rarity">{ card.rarity }</span>
        </div>
      </div>
    </div>
  </div>

  <script>
    export default {
      cards: [],
      filters: {
        sort: 'name',
        rarity: 'all',
        class: 'all',
        itemSlot: 'all'
      },

      get filteredCards() {
        let filtered = [...this.cards]
        
        // Apply filters
        if (this.filters.rarity !== 'all') {
          filtered = filtered.filter(card => card.rarity === this.filters.rarity)
        }
        if (this.filters.class !== 'all') {
          filtered = filtered.filter(card => card.class === this.filters.class)
        }
        if (this.filters.itemSlot !== 'all') {
          filtered = filtered.filter(card => card.itemSlot === this.filters.itemSlot)
        }

        // Apply sorting
        filtered.sort((a, b) => {
          const valueA = a[this.filters.sort]
          const valueB = b[this.filters.sort]
          return valueA.localeCompare(valueB)
        })

        return filtered
      },

      onMounted() {
        // Listen for filter changes
        this.on('filter-change', (data) => {
          this.filters[data.type] = data.value
          this.update()
        })

        // Load cards data
        this.loadCards()
      },

      async loadCards() {
        try {
          const response = await fetch('cards.json')
          this.cards = await response.json()
          this.update()
        } catch (error) {
          console.error('Error loading cards:', error)
        }
      },

      onCardClick(card) {
        this.trigger('equip-item', card)
      }
    }
  </script>
</card-container> 