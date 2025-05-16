<card>
  <div class="card { opts.data.type } { opts.data.class } { opts.data.type === 'spell' ? 'spell' : '' } { opts.playable }" 
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

    /* Green attack indicator for item cards */
    .card .attack-indicator.item-attack {
      background: linear-gradient(135deg, #4cd964 0%, #2ecc71 100%);
      box-shadow: 0 0 5px rgba(0, 0, 0, 0.8), 0 0 10px rgba(46, 204, 113, 0.3) inset;
    }

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
  </style>
</card>