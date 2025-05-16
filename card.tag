<card>
  <div class="card { opts.data.type } { opts.data.class } { opts.data.type === 'spell' ? 'spell' : '' }" 
       draggable={ opts.draggable || false }
       data-card-id={ opts.data.instanceId }
       data-slot-id={ opts.dataSlotId }
       data-unit-type={ opts.data.unitType }
       ondragstart={ handleDragStart }
       onclick={ handleClick }>
    <div class="card-image" style="background-image: url('images/{ opts.data.image }')">
      <div class="card-header">{ opts.data.name }</div>
    </div>
    <div class="card-description">
      <!-- Use a show/hide approach with empty span to keep everything in-line -->
      <span show={ opts.data.type === 'unit' && opts.data.unitType }><b>{ opts.data.unitType ? opts.data.unitType.charAt(0).toUpperCase() + opts.data.unitType.slice(1) : '' }</b> - </span>{ opts.data.description }
    </div>
    <div class="mana-indicator">{ opts.data.mana }</div>
    <div class="attack-indicator { opts.data.type === 'item' ? 'item-attack' : '' }" if={opts.data.attack && opts.data.attack != 0}>{opts.data.attack}</div>
    <div class="health-indicator" if={ opts.data.health > 0 && opts.data.type !== 'spell' && opts.data.type !== 'item' }>{ opts.data.health }</div>
  </div>

  <script>
    const self = this;
    
    // Handle card click events
    self.handleClick = function(e) {
      // Trigger custom event up to parent components
      if (self.opts.onClick) {
        self.opts.onClick(self.opts.data);
      }
    }
    
    // Handle drag start events
    self.handleDragStart = function(e) {
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
  </script>
</card>