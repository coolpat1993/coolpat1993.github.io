<controls-panel>
  <div class="controls">
    <label for="sortCriteria">Sort By:</label>
    <select id="sortCriteria" onchange={ onSortCriteriaChange }>
      <option value="name">Name</option>
      <option value="rarity">Rarity</option>
      <option value="itemSlot">Item Slot</option>
      <option value="class">Class</option>
    </select>

    <label for="sortRarity">Rarity:</label>
    <select id="sortRarity" onchange={ onRarityChange }>
      <option value="all">All</option>
      <option value="Common">Common</option>
      <option value="Rare">Rare</option>
      <option value="Epic">Epic</option>
      <option value="Legendary">Legendary</option>
    </select>

    <label for="sortClass">Class:</label>
    <select id="sortClass" onchange={ onClassChange }>
      <option value="all">All</option>
      <option value="Neutral">Neutral</option>
      <option value="Warrior">Warrior</option>
      <option value="Rogue">Rogue</option>
      <option value="Hunter">Hunter</option>
      <option value="Mage">Mage</option>
      <option value="Paladin">Paladin</option>
      <option value="Shaman">Shaman</option>
      <option value="Warlock">Warlock</option>
      <option value="Druid">Druid</option>
      <option value="Priest">Priest</option>
    </select>

    <label for="sortItemSlot">Item Slot:</label>
    <select id="sortItemSlot" onchange={ onItemSlotChange }>
      <option value="all">All</option>
      <option value="Weapon">Weapon</option>
      <option value="Trinket">Trinket</option>
      <option value="Helmet">Helmet</option>
      <option value="Chest">Chest</option>
      <option value="Belt">Belt</option>
      <option value="Bracers">Bracers</option>
      <option value="Gloves">Gloves</option>
      <option value="Boots">Boots</option>
      <option value="Shoulder">Shoulder</option>
      <option value="Legs">Legs</option>
      <option value="Ring">Ring</option>
      <option value="Neck">Neck</option>
      <option value="Cloak">Cloak</option>
      <option value="Misc">Misc</option>
    </select>
  </div>

  <script>
    export default {
      onSortCriteriaChange(e) {
        this.trigger('filter-change', { type: 'sort', value: e.target.value })
      },
      onRarityChange(e) {
        this.trigger('filter-change', { type: 'rarity', value: e.target.value })
      },
      onClassChange(e) {
        this.trigger('filter-change', { type: 'class', value: e.target.value })
      },
      onItemSlotChange(e) {
        this.trigger('filter-change', { type: 'itemSlot', value: e.target.value })
      }
    }
  </script>
</controls-panel> 