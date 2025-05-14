<card>
  <div class="spell-card { opts.data.type } { opts.data.category === 'item' ? 'item' : '' } { opts.data.type === 'spell' ? 'spell' : '' }" 
       draggable={ opts.draggable || false }
       data-card-id={ opts.data.id }
       onclick={ handleClick }>
    <div class="mana-indicator">{ opts.data.mana }</div>
    <div class="card-image" style="background-image: url('images/{ opts.data.image }')"></div>
    <div class="card-header">{ opts.data.name }</div>
    <div class="card-description">{ opts.data.description }</div>
    <div class="damage-indicator { opts.data.type === 'item' ? 'item-damage' : '' }" if={ opts.data.damage > 0}>{opts.data.damage}</div>
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
  </script>
</card>