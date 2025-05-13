<character-slots>
  <div class="character-slots">
    <h2>Character Equipment</h2>
    <div class="slot" each={ slot in slots } data-slot={ slot.id }>
      { slot.name }: { slot.equipped || 'None' }
    </div>
  </div>

  <script>
    export default {
      slots: [
        { id: 'HelmetSlot', name: 'Helmet' },
        { id: 'ChestSlot', name: 'Chest' },
        { id: 'BeltSlot', name: 'Belt' },
        { id: 'BracersSlot', name: 'Bracers' },
        { id: 'GlovesSlot', name: 'Gloves' },
        { id: 'BootsSlot', name: 'Boots' },
        { id: 'ShoulderSlot', name: 'Shoulder' },
        { id: 'RingSlot', name: 'Ring' },
        { id: 'CloakSlot', name: 'Cloak' },
        { id: 'TrinketSlot', name: 'Trinket' },
        { id: 'WeaponSlot', name: 'Weapon' },
        { id: 'NeckSlot', name: 'Neck' },
        { id: 'LegsSlot', name: 'Legs' }
      ],

      onMounted() {
        this.on('equip-item', (item) => {
          const slot = this.slots.find(s => s.id === item.slot + 'Slot')
          if (slot) {
            slot.equipped = item.name
            this.update()
          }
        })
      }
    }
  </script>
</character-slots> 