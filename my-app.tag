<my-app>
  <h1>{ opts.title }</h1>
  
  <div class="connection-controls">
    <div if="{ !connected }">
      <input type="text" placeholder="Your Player Name" ref="playerName" value="{ playerName }">
      <button onclick="{ createNewGame }">Create New Game</button>
      <hr>
      <input type="text" placeholder="Game ID to join" ref="gameIdToJoin">
      <button onclick="{ joinGame }">Join Game</button>
    </div>
    
    <div if="{ connected }">
      <p>Game ID: <strong>{ myPeerId }</strong> (Share this with other players)</p>
      <button onclick="{ disconnectGame }">Disconnect</button>
    </div>
    
    <div if="{ connectionError }" class="error">
      <p>Connection error: { connectionError }</p>
    </div>
  </div>

  <div if="{ connected }" class="game-area">
    <h2>Scoreboard</h2>
    
    <div class="players-list">
      <h3>Players</h3>
      
      <!-- Your own player -->
      <div class="player me">
        <strong>You:</strong> { playerName } 
        <span class="score">Score: { gameState.players[myPeerId].score }</span>
        <div class="score-controls">
          <button onclick="{ addPointToPlayer }" data-id="{ myPeerId }" class="score-btn add">+</button>
          <button onclick="{ removePointFromPlayer }" data-id="{ myPeerId }" class="score-btn remove">-</button>
        </div>
      </div>
      
      <!-- Other players -->
      <div each="{ player, i in otherPlayers() }" class="player">
        <strong>{ player.name }:</strong> 
        <span class="score">Score: { player.score }</span>
        <div class="score-controls">
          <button onclick="{ parent.addPointToPlayer }" data-id="{ player.id }" class="score-btn add">+</button>
          <button onclick="{ parent.removePointFromPlayer }" data-id="{ player.id }" class="score-btn remove">-</button>
        </div>
      </div>
    </div>

    <div class="game-controls">
      <button onclick="{ resetGame }">Reset Scores</button>
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
    self.connections = {}
    self.connectedPeers = {}
    self.connectionError = null
    self.statusMessage = ""
    
    // Game state that will be synced between peers
    self.gameState = {
      players: {}
    }
    
    // Computed property for other players
    self.otherPlayers = function() {
      if (!self.gameState || !self.gameState.players || !self.myPeerId) return []
      
      const others = []
      Object.keys(self.gameState.players).forEach(function(id) {
        if (id !== self.myPeerId) {
          others.push({
            id: id,
            name: self.gameState.players[id].name,
            score: self.gameState.players[id].score
          })
        }
      })
      return others
    }
    
    // Initialize PeerJS on mount
    self.on('mount', function() {
      console.log('Scoreboard component mounted!')
      // Set a default player name
      if (!self.refs.playerName.value) {
        self.refs.playerName.value = "Player " + Math.floor(Math.random() * 1000)
      }
    })
    
    // Create a new game as host
    self.createNewGame = function() {
      self.playerName = self.refs.playerName.value
      if (!self.playerName) {
        self.connectionError = "Please enter a player name"
        self.update()
        return
      }
      
      try {
        // Create peer connection
        self.peer = new Peer()
        
        self.peer.on('open', function(id) {
          self.myPeerId = id
          self.connected = true
          self.connectionError = null
          
          // Add yourself to the game state
          self.gameState.players[id] = {
            name: self.playerName,
            score: 0
          }
          
          self.update()
          self.statusMessage = "Scoreboard created! Share your Game ID with other players."
          self.update()
        })
        
        self.peer.on('connection', function(conn) {
          self.handleNewConnection(conn)
        })
        
        self.peer.on('error', function(err) {
          self.connectionError = err.message
          self.update()
        })
      } catch (err) {
        self.connectionError = "Error creating scoreboard: " + err.message
        self.update()
      }
    }
    
    // Join an existing game
    self.joinGame = function() {
      self.playerName = self.refs.playerName.value
      const gameId = self.refs.gameIdToJoin.value
      
      if (!self.playerName || !gameId) {
        self.connectionError = "Please enter your name and a game ID"
        self.update()
        return
      }
      
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
            
            // Store the connection
            self.connections[gameId] = conn
            self.connectedPeers[gameId] = {
              name: "Host",
              conn: conn
            }
            
            // Add yourself to local game state (will be overwritten when host syncs)
            self.gameState.players[self.myPeerId] = {
              name: self.playerName,
              score: 0
            }
            
            // Send join message
            conn.send({
              type: 'JOIN',
              playerId: self.myPeerId,
              playerName: self.playerName
            })
            
            self.update()
          })
          
          conn.on('data', function(data) {
            self.handlePeerMessage(gameId, data)
          })
          
          conn.on('close', function() {
            delete self.connections[gameId]
            delete self.connectedPeers[gameId]
            self.statusMessage = "Disconnected from host"
            self.update()
          })
        })
        
        self.peer.on('error', function(err) {
          self.connectionError = err.message
          self.update()
        })
      } catch (err) {
        self.connectionError = "Error joining scoreboard: " + err.message
        self.update()
      }
    }
    
    // Handle new incoming connections
    self.handleNewConnection = function(conn) {
      const peerId = conn.peer
      const peerName = conn.metadata ? conn.metadata.name : "Unknown"
      
      // Store the connection
      self.connections[peerId] = conn
      self.connectedPeers[peerId] = {
        name: peerName,
        conn: conn
      }
      
      conn.on('open', function() {
        // Update status
        self.statusMessage = peerName + " joined!"
        self.update()
        
        // Send the current game state to the new peer
        conn.send({
          type: 'SYNC',
          gameState: self.gameState
        })
      })
      
      conn.on('data', function(data) {
        self.handlePeerMessage(peerId, data)
      })
      
      conn.on('close', function() {
        // Remove player from game state
        if (self.gameState.players[peerId]) {
          delete self.gameState.players[peerId]
        }
        
        // Remove connection
        delete self.connections[peerId]
        delete self.connectedPeers[peerId]
        
        self.statusMessage = peerName + " left"
        self.update()
        self.broadcastGameState()
      })
      
      self.update()
    }
    
    // Handle messages from peers
    self.handlePeerMessage = function(peerId, data) {
      console.log('Message from peer:', data)
      
      switch (data.type) {
        case 'JOIN':
          // Add new player to the game state
          self.gameState.players[data.playerId] = {
            name: data.playerName,
            score: 0
          }
          
          self.statusMessage = data.playerName + " joined!"
          self.broadcastGameState()
          break
          
        case 'SYNC':
          // Update our game state
          self.gameState = data.gameState
          self.update()
          break
          
        case 'UPDATE_STATE':
          // Update the game state
          self.gameState = data.gameState
          self.update()
          break
          
        case 'UPDATE_SCORE':
          // Update player score
          if (self.gameState.players[data.playerId]) {
            self.gameState.players[data.playerId].score = data.score;
            self.statusMessage = self.gameState.players[data.playerId].name + "'s score updated to " + data.score;
            self.update()
            
            // Only rebroadcast if you're the host
            if (Object.keys(self.connectedPeers).length > 0 && !self.connections[Object.keys(self.connectedPeers)[0]]) {
              self.broadcastGameState()
            }
          }
          break
          
        case 'RESET':
          // Reset the game state
          self.resetGameState()
          self.statusMessage = "Scores have been reset by " + data.playerName
          self.update()
          break
      }
    }
    
    // Broadcast game state to all connected peers
    self.broadcastGameState = function() {
      Object.keys(self.connections).forEach(function(peerId) {
        self.connections[peerId].send({
          type: 'SYNC',
          gameState: self.gameState
        })
      })
      self.update()
    }
    
    // Add a point to a player
    self.addPointToPlayer = function(e) {
    console.log('gamestate players', self.gameState.players)
      const playerId = e.target.getAttribute('data-id')
      if (self.gameState.players[playerId]) {
        self.gameState.players[playerId].score += 1
        
        // Broadcast to all peers
        Object.keys(self.connections).forEach(function(peerId) {
          self.connections[peerId].send({
            type: 'UPDATE_SCORE',
            playerId: playerId,
            score: self.gameState.players[playerId].score
          })
        })
        
        self.update()
      }
    }
    
    // Remove a point from a player
    self.removePointFromPlayer = function(e) {
      const playerId = e.target.getAttribute('data-id')
      if (self.gameState.players[playerId] && self.gameState.players[playerId].score > 0) {
        self.gameState.players[playerId].score -= 1
        
        // Broadcast to all peers
        Object.keys(self.connections).forEach(function(peerId) {
          self.connections[peerId].send({
            type: 'UPDATE_SCORE',
            playerId: playerId,
            score: self.gameState.players[playerId].score
          })
        })
        
        self.update()
      }
    }
    
    // Reset the game
    self.resetGame = function() {
      self.resetGameState()
      
      // Broadcast reset to all peers
      Object.keys(self.connections).forEach(function(peerId) {
        self.connections[peerId].send({
          type: 'RESET',
          playerName: self.playerName
        })
      })
      
      self.statusMessage = "Scores have been reset"
      self.update()
    }
    
    // Reset game state
    self.resetGameState = function() {
      // Reset player scores
      Object.keys(self.gameState.players).forEach(function(playerId) {
        self.gameState.players[playerId].score = 0
      })
      
      self.update()
    }
    
    // Disconnect from game
    self.disconnectGame = function() {
      if (self.peer) {
        Object.keys(self.connections).forEach(function(peerId) {
          self.connections[peerId].close()
        })
        self.peer.destroy()
      }
      
      // Reset state
      self.peer = null
      self.connections = {}
      self.connectedPeers = {}
      self.connected = false
      self.gameState.players = {}
      self.statusMessage = ""
      
      self.update()
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
      padding: 10px;
      border-bottom: 1px solid #eee;
    }
    
    .player .score {
      margin: 0 15px;
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
  </style>
</my-app>