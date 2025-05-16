// Deck Manager - Handles deck creation, storage and retrieval
class DeckManager {
    constructor() {
        this.decks = this.loadDecks();
        this.currentDeckIndex = this.getCurrentDeckIndex();
    }

    // Load decks from local storage
    loadDecks() {
        const savedDecks = localStorage.getItem('cardGameDecks');
        if (savedDecks) {
            return JSON.parse(savedDecks);
        } else {
            // Create default deck if none exists
            const defaultDecks = [
                {
                    name: "Default Deck",
                    cards: [
                        // Neutral Units - frontline fighters
                        1, 4, 9, 10, 12,
                        // Neutral Units - backline specialists
                        2, 3, 5, 6, 7,
                        // Support units
                        8, 11, 13, 14, 15,
                        // Banners
                        16, 17,
                        // Weapons for different unit types
                        21, 22, 24, 28, 32,
                        // Utility items
                        27, 33, 34
                    ]
                }
            ];
            localStorage.setItem('cardGameDecks', JSON.stringify(defaultDecks));
            return defaultDecks;
        }
    }

    // Save all decks to local storage
    saveDecks() {
        localStorage.setItem('cardGameDecks', JSON.stringify(this.decks));
    }

    // Get current deck index from local storage
    getCurrentDeckIndex() {
        const index = localStorage.getItem('currentDeckIndex');
        return index !== null ? parseInt(index, 0) : 0;
    }

    // Save current deck index to local storage
    saveCurrentDeckIndex(index) {
        this.currentDeckIndex = index;
        localStorage.setItem('currentDeckIndex', index.toString());
    }

    // Get the current deck
    getCurrentDeck() {
        return this.decks[this.currentDeckIndex];
    }

    // Get deck cards expanded with card data from the library
    getExpandedDeckCards(cardLibrary) {
        if (!this.getCurrentDeck() || !cardLibrary) return [];

        const deckCardIds = this.getCurrentDeck().cards;
        return deckCardIds.map(id => {
            const card = cardLibrary.find(c => c.id === id);
            return card || null;
        }).filter(card => card !== null);
    }

    // Get sorted deck cards with card data from the library
    getSortedDeckCards(cardLibrary) {
        const expandedCards = this.getExpandedDeckCards(cardLibrary);

        // Sort by mana cost first, then by name
        return expandedCards.sort((a, b) => {
            if (a.mana !== b.mana) {
                return a.mana - b.mana;
            }
            return a.name.localeCompare(b.name);
        });
    }

    // Count occurrences of a card in the deck
    countCardInDeck(cardId) {
        if (!this.getCurrentDeck()) return 0;
        return this.getCurrentDeck().cards.filter(id => id === cardId).length;
    }

    // Create a new empty deck
    createDeck(name) {
        const newDeck = {
            name: name || `Deck ${this.decks.length + 1}`,
            cards: []
        };

        this.decks.push(newDeck);
        this.saveCurrentDeckIndex(this.decks.length - 1);
        this.saveDecks();
        return newDeck;
    }

    // Delete a deck
    deleteDeck(index) {
        if (index >= 0 && index < this.decks.length) {
            this.decks.splice(index, 1);

            // Adjust current deck index if needed
            if (this.decks.length === 0) {
                this.createDeck("Default Deck");
            } else if (this.currentDeckIndex >= this.decks.length) {
                this.currentDeckIndex = this.decks.length - 1;
            }

            this.saveCurrentDeckIndex(this.currentDeckIndex);
            this.saveDecks();
            return true;
        }
        return false;
    }

    // Add a card to the current deck
    addCardToDeck(cardId) {
        if (this.getCurrentDeck().cards.length >= 30) {
            return { success: false, message: "Deck is full (max 30 cards)" };
        }

        // Check if there are already 2 copies of this card
        const cardCount = this.countCardInDeck(cardId);
        if (cardCount >= 2) {
            return { success: false, message: "Maximum of 2 copies per card allowed" };
        }

        this.getCurrentDeck().cards.push(cardId);
        this.saveDecks();
        return { success: true };
    }

    // Remove a card from the current deck
    removeCardFromDeck(cardIndex) {
        if (cardIndex >= 0 && cardIndex < this.getCurrentDeck().cards.length) {
            this.getCurrentDeck().cards.splice(cardIndex, 1);
            this.saveDecks();
            return true;
        }
        return false;
    }

    // Switch to a different deck
    switchDeck(index) {
        if (index >= 0 && index < this.decks.length) {
            this.saveCurrentDeckIndex(index);
            return true;
        }
        return false;
    }
}

// Create a singleton instance
const deckManager = new DeckManager();