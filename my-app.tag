<my-app>
  <h1>{ opts.title }</h1>
  
  <div class="connection-controls">
    <div if="{ !connected }">
      <button onclick="{ createNewGame }">Host Game</button>
      
      <div if="{ gameIdFromUrl }" class="join-from-url">
        <hr>
        <p>Join game: { gameIdFromUrl }</p>
        <button onclick="{ joinFromUrl }">Join Game</button>
      </div>
    </div>
    
    <div if="{ connected }">
      <p if="{ isHost }">
        <button onclick="{ copyShareableLink }" class="share-button">
          { linkCopied ? 'Link Copied!' : 'Copy Game Link' }
        </button>
      </p>
      <button onclick="{ disconnectGame }">{ isHost ? 'Stop Hosting' : 'Disconnect' }</button>
    </div>
    
    <div if="{ connectionError }" class="error">
      <p>Connection error: { connectionError }</p>
    </div>
  </div>

  <div if="{ hostLeft }" class="host-disconnected-alert">
    <p>⚠️ The host has ended the game session</p>
    <button onclick="{ resetApp }">Start New Game</button>
  </div>

  <div if="{ connected }" class="game-area">
    <h2>Game Area</h2>
    
    <div class="connection-status-bar">
      <div class="connection-status">
        <div class="connection-indicator { connected ? 'connected' : '' }"></div>
        <span>{ connected ? 'Connected' : 'Disconnected' }</span>
        <span if="{ !isHost && connected }" class="client-badge">Client</span>
        <span if="{ isHost }" class="host-badge">Host</span>
      </div>
    </div>
    
    <div class="players-list">
      <!-- Top player position -->
      <div class="player { isHost ? 'opponent' : 'self' }">
        <div class="connection-indicator { connected && ((isHost && opponent) || (!isHost)) ? 'connected' : '' }"></div>
        <strong>{ isHost ? 'Opponent' : 'You (Client)' }:</strong> 
        <span class="score">Health: { isHost ? (gameState.players.opponent ? gameState.players.opponent.health : 30) : gameState.players.self.health }</span>
        <div class="score-controls">
          <button onclick="{ isHost ? increaseOpponentHealth : increaseHealth }" class="score-btn add">+</button>
          <button onclick="{ isHost ? decreaseOpponentHealth : decreaseHealth }" class="score-btn remove">-</button>
        </div>
      </div>
      
      <div class="vs-badge">VS</div>
      
      <!-- Bottom player position -->
      <div class="player { isHost ? 'self' : 'opponent' }">
        <div class="connection-indicator { connected ? 'connected' : '' }"></div>
        <strong>{ isHost ? 'You (Host)' : 'Opponent' }:</strong> 
        <span class="score">Health: { isHost ? gameState.players.self.health : (gameState.players.opponent ? gameState.players.opponent.health : 30) }</span>
        <div class="score-controls">
          <button onclick="{ isHost ? increaseHealth : increaseOpponentHealth }" class="score-btn add">+</button>
          <button onclick="{ isHost ? decreaseHealth : decreaseOpponentHealth }" class="score-btn remove">-</button>
        </div>
      </div>
    </div>

    <div class="game-controls">
      <button onclick="{ resetGame }">Reset Health</button>
    </div>

    <p class="status-message">{ statusMessage }</p>
  </div>

  <script>
    const self = this
    
    // Game state
    self.connected = false
    self.myPeerId = null
    self.playerName = ""
    self.peer = null
    self.connection = null
    self.connectionError = null
    self.statusMessage = ""
    self.linkCopied = false
    self.gameIdFromUrl = null
    self.isHost = false
    self.opponent = null
    self.hostLeft = false

    // Game state that will be synced between peers - simplified for 1v1
    self.gameState = {
      players: {
        self: { health: 30 },
        opponent: null
      }
    }
    
    // Parse URL query parameters
    self.getQueryParams = function() {
      const params = {}
      const queryString = window.location.search
      
      if (queryString) {
        const urlParams = new URLSearchParams(queryString)
        
        urlParams.forEach(function(value, key) {
          params[key] = value
        })
      }
      
      return params
    }
    
    // Generate a shareable link with the game ID
    self.generateShareableLink = function(gameId) {
      const url = new URL(window.location.href)
      url.search = new URLSearchParams({ gameId: gameId }).toString()
      return url.toString()
    }
    
    // Initialize on mount
    self.on('mount', function() {
      console.log('Card game component mounted!')
      
      // Try to load saved player name from localStorage
      const savedPlayerName = localStorage.getItem('playerName')
      if (savedPlayerName) {
        self.playerName = savedPlayerName
      } else {
        // Set a default player name if no saved name exists
        self.playerName = "Player " + Math.floor(Math.random() * 1000)
      }

      // Check for game ID in URL query parameters
      const queryParams = self.getQueryParams()
      console.log('Query params:', queryParams)
      
      if (queryParams.gameId) {
        self.gameIdFromUrl = queryParams.gameId
        console.log('Found game ID in URL:', self.gameIdFromUrl)
      }
      
      self.update()
    })
    
    // Create a new game as host
    self.createNewGame = function() {
      self.playerName = self.playerName.trim()
      
      // Validate username
      if (!self.playerName) {
        self.connectionError = "Please enter a player name"
        self.update()
        return
      }
      
      // Save player name to localStorage
      localStorage.setItem('playerName', self.playerName)
      
      try {
        // Create peer connection
        self.peer = new Peer()
        
        self.peer.on('open', function(id) {
          self.myPeerId = id
          self.connected = true
          self.connectionError = null
          self.isHost = true
          
          // Set up your player in game state
          self.gameState.players.self = {
            id: id,
            name: self.playerName,
            health: 30
          }
          
          // Generate shareable link
          self.shareableLink = self.generateShareableLink(id)
          
          self.statusMessage = "Game created! Share your game link with your opponent to begin."
          self.update()
        })
        
        self.peer.on('connection', function(conn) {
          // Only allow one connection for 1v1 game - Hearthstone style 1v1
          if (self.connection) {
            conn.on('open', function() {
              conn.send({
                type: 'GAME_FULL',
                message: "This game already has an opponent"
              })
              conn.close()
            })
            return
          }
          
          self.handleNewConnection(conn)
        })
        
        self.peer.on('error', function(err) {
          self.connectionError = err.message
          self.update()
        })
      } catch (err) {
        self.connectionError = "Error creating game: " + err.message
        self.update()
      }
    }
    
    // Join an existing game
    self.joinFromUrl = function() {
      self.playerName = self.playerName.trim()
      const gameId = self.gameIdFromUrl
      
      // Validate inputs
      if (!self.playerName) {
        self.connectionError = "Please enter a player name"
        self.update()
        return
      }
      
      if (!gameId) {
        self.connectionError = "Invalid game ID"
        self.update()
        return
      }
      
      // Save player name to localStorage
      localStorage.setItem('playerName', self.playerName)
      
      try {
        // Create peer
        self.peer = new Peer()
        
        self.peer.on('open', function(id) {
          self.myPeerId = id
          
          // Connect to the host
          const conn = self.peer.connect(gameId, {
            metadata: {
              name: self.playerName
            }
          })
          
          conn.on('open', function() {
            self.connected = true
            self.connectionError = null
            self.isHost = false
            self.hostLeft = false
            self.connection = conn
            
            // Set up your player in game state
            self.gameState.players.self = {
              id: id,
              name: self.playerName,
              health: 30
            }
            
            // Send join message
            conn.send({
              type: 'JOIN',
              playerId: id,
              playerName: self.playerName
            })
            
            self.update()
          })
          
          conn.on('data', function(data) {
            self.handlePeerMessage(data)
          })
          
          conn.on('close', function() {
            self.connection = null
            
            // Show host disconnection alert
            self.hostLeft = true
            self.connected = false
            self.statusMessage = "Host has ended the game session"
            self.update()
          })
        })
        
        self.peer.on('error', function(err) {
          self.connectionError = err.message
          self.update()
        })
      } catch (err) {
        self.connectionError = "Error joining game: " + err.message
        self.update()
      }
    }
    
    // Handle new incoming connection
    self.handleNewConnection = function(conn) {
      const peerId = conn.peer
      const peerName = conn.metadata ? conn.metadata.name : "Opponent"
      
      // Store the connection
      self.connection = conn
      
      conn.on('open', function() {
        // Update status
        self.statusMessage = peerName + " joined!"
        self.update()
      })
      
      conn.on('data', function(data) {
        self.handlePeerMessage(data)
      })
      
      conn.on('close', function() {
        // Reset opponent
        self.gameState.players.opponent = null
        self.opponent = null
        self.connection = null
        
        self.statusMessage = peerName + " left"
        self.update()
      })
    }
    
    // Handle messages from peer
    self.handlePeerMessage = function(data) {
      console.log('Message from peer:', data)
      
      switch (data.type) {
        case 'JOIN':
          // Set up the opponent in game state
          self.gameState.players.opponent = {
            id: data.playerId,
            name: data.playerName,
            health: 30
          }
          
          // Update opponent info
          self.opponent = {
            id: data.playerId,
            name: data.playerName
          }
          
          // Send the current game state back
          if (self.isHost && self.connection) {
            self.connection.send({
              type: 'SYNC',
              gameState: self.gameState,
              hostName: self.playerName
            })
          }
          
          self.statusMessage = data.playerName + " joined!"
          self.update()
          break
          
        case 'SYNC':
          // Update our game state
          self.gameState = data.gameState
          
          // Update opponent info
          if (!self.isHost && data.hostName) {
            self.opponent = {
              name: data.hostName
            }
          }
          
          self.update()
          break
          
        case 'UPDATE_HEALTH':
          // Update player health
          if (data.player === 'self') {
            self.gameState.players.opponent.health = data.health
          } else {
            self.gameState.players.self.health = data.health
          }
          
          self.update()
          break
          
        case 'RESET':
          // Reset the game state
          self.gameState.players.self.health = 30
          if (self.gameState.players.opponent) {
            self.gameState.players.opponent.health = 30
          }
          
          self.statusMessage = "Scores have been reset"
          self.update()
          break

        case 'HOST_DISCONNECTING':
          // Host has notified they are disconnecting
          self.statusMessage = "Host has ended the game session"
          self.hostLeft = true
          self.connected = false
          self.update()
          break
          
        case 'GAME_FULL':
          // Game is full
          self.connectionError = data.message
          self.peer.destroy()
          self.peer = null
          self.update()
          break
      }
    }
    
    // Add a point to self
    self.increaseHealth = function() {
      self.gameState.players.self.health += 1
      
      // Notify peer
      if (self.connection) {
        self.connection.send({
          type: 'UPDATE_HEALTH',
          player: 'opponent',
          health: self.gameState.players.self.health
        })
      }
      
      self.update()
    }
    
    // Remove a point from self
    self.decreaseHealth = function() {
      if (self.gameState.players.self.health > 0) {
        self.gameState.players.self.health -= 1
        
        // Notify peer
        if (self.connection) {
          self.connection.send({
            type: 'UPDATE_HEALTH',
            player: 'opponent',
            health: self.gameState.players.self.health
          })
        }
        
        self.update()
      }
    }
    
    // Add a point to opponent
    self.increaseOpponentHealth = function() {
      if (self.gameState.players.opponent) {
        self.gameState.players.opponent.health += 1
        
        // Notify peer
        if (self.connection) {
          self.connection.send({
            type: 'UPDATE_HEALTH',
            player: 'self',
            health: self.gameState.players.opponent.health
          })
        }
        
        self.update()
      }
    }
    
    // Remove a point from opponent
    self.decreaseOpponentHealth = function() {
      if (self.gameState.players.opponent && self.gameState.players.opponent.health > 0) {
        self.gameState.players.opponent.health -= 1
        
        // Notify peer
        if (self.connection) {
          self.connection.send({
            type: 'UPDATE_HEALTH',
            player: 'self',
            health: self.gameState.players.opponent.health
          })
        }
        
        self.update()
      }
    }
    
    // Reset the game
    self.resetGame = function() {
      // Reset health
      self.gameState.players.self.health = 30
      if (self.gameState.players.opponent) {
        self.gameState.players.opponent.health = 30
      }
      
      // Notify peer
      if (self.connection) {
        self.connection.send({
          type: 'RESET'
        })
      }
      
      self.statusMessage = "Health has been reset to 30"
      self.update()
    }
    
    // Reset app after host disconnection
    self.resetApp = function() {
      self.hostLeft = false
      self.connected = false
      self.peer = null
      self.connection = null
      self.opponent = null
      self.gameState.players = {
        self: { health: 30 },
        opponent: null
      }
      self.statusMessage = ""
      self.update()
    }

    // Copy shareable link to clipboard
    self.copyShareableLink = function() {
      navigator.clipboard.writeText(self.shareableLink).then(function() {
        self.linkCopied = true
        self.update()
        setTimeout(function() {
          self.linkCopied = false
          self.update()
        }, 2000)
      }).catch(function(err) {
        console.error('Could not copy text: ', err)
      })
    }

    // Disconnect from game
    self.disconnectGame = function() {
      if(self.isHost) {
        // Notify client that the host is disconnecting
        if (self.connection) {
          self.connection.send({
            type: 'HOST_DISCONNECTING'
          })
          
          // Short delay to allow message to be sent before closing connection
          setTimeout(function() {
            if (self.connection) {
              self.connection.close()
            }
            if (self.peer) {
              self.peer.destroy()
            }
            
            // Reset state
            self.peer = null
            self.connection = null
            self.connected = false
            self.opponent = null
            self.statusMessage = ""
            
            self.update()
          }, 300)
        }
      } else {
        // Client disconnect
        if (self.connection) {
          self.connection.close()
        }
        if (self.peer) {
          self.peer.destroy()
        }
        
        // Reset state
        self.peer = null
        self.connection = null
        self.connected = false
        self.opponent = null
        self.statusMessage = ""
        self.hostLeft = false
        
        self.update()
      }
    }
  </script>
  
  <style>
    .error {
      color: red;
      margin: 10px 0;
    }
    
    .status-message {
      font-style: italic;
      color: #555;
      margin-top: 15px;
    }
    
    .player {
      display: flex;
      align-items: center;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .player.me {
      background-color: #e6f7ff;
    }
    
    .player.peer {
      background-color: #fff1e6;
    }
    
    .player .score {
      margin: 0 15px;
      font-size: 18px;
      font-weight: bold;
    }
    
    .score-controls {
      display: flex;
    }
    
    .score-btn {
      width: 30px;
      height: 30px;
      padding: 0;
      margin: 0 2px;
      font-size: 16px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .score-btn.add {
      background-color: #4CAF50;
    }
    
    .score-btn.remove {
      background-color: #f44336;
    }
    
    button {
      background-color: #4CAF50;
      border: none;
      color: white;
      padding: 8px 16px;
      text-align: center;
      text-decoration: none;
      display: inline-block;
      font-size: 14px;
      margin: 4px 2px;
      cursor: pointer;
      border-radius: 4px;
    }
    
    input[type="text"] {
      padding: 8px;
      margin: 5px 0;
      border: 1px solid #ddd;
      border-radius: 4px;
      width: 200px;
    }
    
    hr {
      border: 0;
      height: 1px;
      background-color: #ddd;
      margin: 15px 0;
    }
    
    .join-from-url {
      margin-top: 10px;
      padding: 10px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
    
    .share-button {
      display: inline-block;
      background-color: #2196F3;
      color: white;
      padding: 10px 15px;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
    }
    
    .share-button:hover {
      background-color: #0b7dda;
    }

    .host-disconnected-alert {
      background-color: #f8d7da;
      color: #721c24;
      padding: 15px;
      border-radius: 5px;
      border: 1px solid #f5c6cb;
      margin: 20px 0;
      text-align: center;
    }
    
    .host-disconnected-alert p {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 15px;
    }
    
    .host-disconnected-alert button {
      background-color: #007bff;
    }

    .connection-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: #ccc;
      margin-right: 10px;
    }

    .connection-indicator.connected {
      background-color: #4CAF50;
    }

    .players-list {
      display: flex;
      flex-direction: column;
      min-height: 300px;
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      position: relative;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .vs-badge {
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      margin: 15px 0;
      color: #e74c3c;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
    }
    
    .player.opponent {
      background-color: #fff1e6;
      border-left: 4px solid #e74c3c;
      margin-bottom: 20px;
    }
    
    .player.self {
      background-color: #e6f7ff;
      border-left: 4px solid #3498db;
      margin-top: 20px;
    }
    
    .game-area {
      max-width: 600px;
      margin: 0 auto;
    }

    .connection-status-bar {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 15px;
    }

    .connection-status {
      display: flex;
      align-items: center;
      font-size: 16px;
      font-weight: bold;
    }

    .client-badge {
      background-color: #3498db;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      margin-left: 10px;
    }

    .host-badge {
      background-color: #e74c3c;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      margin-left: 10px;
    }
  </style>
</my-app>