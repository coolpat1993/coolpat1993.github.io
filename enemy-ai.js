/**
 * Enemy AI for the card game
 * Basic version - plays cards that it can afford and ends its turn
 */

(function (global) {
    // Constructor for the EnemyAI
    function EnemyAI(gameState) {
        this.gameState = gameState;
    }

    // Method to handle the enemy turn
    EnemyAI.prototype.takeTurn = function () {
        console.log("Enemy AI taking turn...");

        // Wait a bit to simulate thinking
        setTimeout(() => {
            // Play cards that the AI can afford
            this.playAvailableCards();

            // End turn after a short delay to make it seem more natural
            setTimeout(() => {
                this.endTurn();
            }, 1000);
        }, 1500);
    };

    // Play cards that the AI can afford from its hand
    EnemyAI.prototype.playAvailableCards = function () {
        // Sort cards by mana cost (expensive to cheap)
        const sortedHand = [...this.gameState.enemyHand].sort((a, b) => b.mana - a.mana);

        // Try to play each card, starting with the most expensive ones the AI can afford
        for (const card of sortedHand) {
            // Skip if we can't afford the card
            if (card.mana > this.gameState.enemyMana) {
                continue;
            }

            // Choose a valid slot for this card
            const slot = this.findValidSlotForCard(card);

            // If a valid slot was found, place the card
            if (slot) {
                this.placeCard(card, slot);

                // Reduce enemy mana
                this.gameState.enemyMana -= card.mana;

                // Remove card from hand
                const cardIndex = this.gameState.enemyHand.findIndex(c => c.instanceId === card.instanceId);
                if (cardIndex !== -1) {
                    this.gameState.enemyHand.splice(cardIndex, 1);
                }

                // Log the play
                this.gameState.addLogEntry(`Enemy plays ${card.name} (${card.mana} mana).`);
            }
        }
    };

    // Find a valid slot for a card
    EnemyAI.prototype.findValidSlotForCard = function (card) {
        // The slot selection logic depends on the card type
        if (card.type === 'unit') {
            // For units, try the front line first, then the back line
            return this.findEmptySlot('enemy-front-') || this.findEmptySlot('enemy-back-');
        } else if (card.type === 'banner') {
            // Banners typically go in the back line
            return this.findEmptySlot('enemy-back-');
        } else if (card.type === 'spell') {
            // Spells might require targets, not implementing targeting yet
            return null;
        } else if (card.type === 'item') {
            // Items need to be attached to units, not implementing this yet
            return null;
        }

        return null;
    };

    // Find an empty slot with the given prefix
    EnemyAI.prototype.findEmptySlot = function (prefix) {
        // Try each position from 1 to 5
        for (let i = 1; i <= 5; i++) {
            const slotId = `${prefix}${i}`;
            if (!this.gameState.slots[slotId]) {
                return slotId;
            }
        }
        return null;
    };

    // Place a card in a slot
    EnemyAI.prototype.placeCard = function (card, slotId) {
        // Update the game state
        this.gameState.slots[slotId] = card;

        // Update the UI
        this.gameState.update();
    };

    // End the enemy turn
    EnemyAI.prototype.endTurn = function () {
        // Log that the enemy ended their turn
        this.gameState.addLogEntry("Enemy ends their turn.");

        // Call the game's endTurn method to handle turn transition
        this.gameState.endEnemyTurn();
    };

    // Export to global scope
    global.EnemyAI = EnemyAI;
})(window);