<my-app>
  <div class="list-container">
    <button onclick="{ addItem }" class="add-button">Add Item</button>
    
    <ul if="{ items.length > 0 }" class="items-list">
      <li each="{ item, index in items }">
        <span>{ item.text }</span>
        <button onclick="{ parent.removeItem }" class="remove-button">Remove</button>
      </li>
    </ul>
    
    <p if="{ items.length === 0 }" class="empty-message">No items in the list. Add some!</p>
  </div>

  <script>
    const self = this
    
    // Initialize items array
    self.items = []
    
    // Add a new item to the list
    self.addItem = function() {
      const itemNumber = self.items.length + 1
      self.items.push({
        id: Date.now(),
        text: `Item ${itemNumber}`
      })
      self.update()
    }
    
    // Remove an item from the list
    self.removeItem = function(e) {
      const index = e.item.index
      self.items.splice(index, 1)
      self.update()
    }
  </script>
  
  <style>
    .list-container {
      max-width: 500px;
      margin: 20px auto;
    }
    
    .add-button {
      background-color: #4CAF50;
      border: none;
      color: white;
      padding: 10px 16px;
      text-align: center;
      font-size: 16px;
      cursor: pointer;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    
    .items-list {
      list-style-type: none;
      padding: 0;
    }
    
    .items-list li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background-color: #f9f9f9;
      margin-bottom: 8px;
      border-radius: 4px;
      border-left: 3px solid #4CAF50;
    }
    
    .remove-button {
      background-color: #f44336;
      border: none;
      color: white;
      padding: 6px 12px;
      text-align: center;
      font-size: 14px;
      cursor: pointer;
      border-radius: 4px;
    }
    
    .empty-message {
      font-style: italic;
      color: #777;
      text-align: center;
      padding: 20px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
  </style>
</my-app>