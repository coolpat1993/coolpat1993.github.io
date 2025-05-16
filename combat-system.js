/**
 * Combat System for Card Game
 * Handles attacks between units and damage calculations
 */

const CombatSystem = {
    // Track the currently selected unit (attacker)
    selectedUnit: null,

    // Flag to track if we're in attacking mode
    attackMode: false,

    // Initialize the combat system
    init() {
        console.log('Combat system initialized');
    },

    // Select a unit as the attacker
    selectAttacker(unit) {
        if (!unit.canAttack) {
            console.log('This unit cannot attack right now');
            return false;
        }

        this.selectedUnit = unit;
        this.attackMode = true;
        console.log('Selected unit as attacker:', unit);
        return true;
    },

    // Clear the selection
    clearSelection() {
        this.selectedUnit = null;
        this.attackMode = false;
        console.log('Attack selection cleared');
    },

    // Check if a target is valid for the selected attacker
    isValidTarget(target) {
        // Basic implementation - can only attack enemy units
        if (!this.selectedUnit) return false;
        if (!this.attackMode) return false;
        if (target.playerId === this.selectedUnit.playerId) return false;

        return true;
    },

    // Process an attack between the selected unit and a target
    attack(target) {
        if (!this.selectedUnit) {
            console.log('No attacker selected');
            return false;
        }

        if (!this.isValidTarget(target)) {
            console.log('Invalid target');
            return false;
        }

        // Calculate damage (basic implementation)
        const damage = this.calculateDamage(this.selectedUnit, target);

        // Apply damage to target
        target.health -= damage;
        console.log(`${this.selectedUnit.name} attacks ${target.name} for ${damage} damage`);

        // Check if target is defeated
        if (target.health <= 0) {
            this.handleUnitDefeat(target);
        }

        // Mark the attacker as having attacked this turn
        this.selectedUnit.canAttack = false;

        // Clear selection after attack
        this.clearSelection();

        return true;
    },

    // Calculate damage for an attack
    calculateDamage(attacker, defender) {
        // Basic damage calculation - can be expanded later
        return attacker.attack;
    },

    // Handle a unit being defeated
    handleUnitDefeat(unit) {
        console.log(`${unit.name} has been defeated`);
        // Will need to implement removal logic or death effects here
    },

    // Reset units' ability to attack (call this at the start of a player's turn)
    resetAttacks(playerId) {
        // This function would reset canAttack for all units belonging to the player
        console.log(`Reset attacks for player ${playerId}`);
        // Logic to be implemented by the calling code
    }
};

// Export the combat system
window.CombatSystem = CombatSystem;