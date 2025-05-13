<my-app>
  <h1>{ opts.title }</h1>
  
  <button onclick="{ addItem }">Add Item</button>
    <button onclick="{ clearItems }">Clear Items</button>
  
  <div class="items">
    <div each="{ item in items }" class="item">
      <h3>{ item.name }</h3>
      <p>{ item.description }</p>
    </div>
  </div>

  <script>

    const self = this
    // Initial state
    self.items = [
      { name: 'Item 1', description: 'Description for item 1' },
      { name: 'Item 2', description: 'Description for item 2' }
    ]
    
    // Mount lifecycle event
    self.on('mount', function() {
      console.log('Component mounted!')
      // You can do initialization here
    })
    
    // Method to add a new item
    self.addItem = function() {
      const newId = self.items.length + 1
      self.items.push({ 
        name: 'Item ' + newId, 
        description: 'Description for item ' + newId 
      })
      self.update() // Update the component
    }

    self.clearItems = function() {
      self.items = []
      self.update() // Update the component
    }
  </script>
</my-app>