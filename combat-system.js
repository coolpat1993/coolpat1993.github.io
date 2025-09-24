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

        // Mark invalid targets (back row if front row has units)
        this.markInvalidTargets();

        return true;
    },

    // Clear the selection
    clearSelection() {
        this.selectedUnit = null;
        this.attackMode = false;
        console.log('Attack selection cleared');

        // Clear invalid target markings
        this.clearInvalidTargets();
    },

    // Check if a target is valid for the selected attacker
    isValidTarget(target) {
        // Basic implementation - can only attack enemy units
        if (!this.selectedUnit) return false;
        if (!this.attackMode) return false;
        if (target.playerId === this.selectedUnit.playerId) return false;

        // Check if target is in the back row and has front row protection
        if (target.slotId && target.slotId.includes('back')) {
            // Ranged units can attack over front row units
            const isRangedAttacker = this.selectedUnit.unitType === 'ranged';
            
            // Only apply front row protection if attacker is not ranged
            if (!isRangedAttacker) {
                // Check if there are any units in the front row that must be attacked first
                const frontRowOccupied = this.hasFrontRowUnits(target.playerId);
                if (frontRowOccupied) {
                    console.log('Cannot attack back row when front row has units (non-ranged unit)');
                    return false;
                }
            }
        }

        return true;
    },

    // Helper function to check if two units are in different rows (one attacking from front to back or back to front)
    areUnitsInDifferentRows(unit1, unit2) {
        if (!unit1.slotId || !unit2.slotId) return false;

        // Check if one unit is in front row and other in back row
        const unit1InFront = unit1.slotId.includes('-front-');
        const unit2InFront = unit2.slotId.includes('-front-');

        // If one is in front and one is in back, they're in different rows
        return unit1InFront !== unit2InFront;
    },

    // Helper function to check if a player has units in their front row
    hasFrontRowUnits(playerId) {
        // We need access to the game state to check slots
        // This will be provided by the game when calling isValidTarget
        const slots = window.gameState ? window.gameState.slots : {};

        // Look for any occupied front row slots for this player
        const prefix = playerId === 'player' ? 'player-front-' : 'enemy-front-';

        for (let i = 1; i <= 5; i++) {
            const slotId = `${prefix}${i}`;
            if (slots[slotId]) {
                return true;
            }
        }

        return false;
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

        // Store original health as maxHealth if not already set
        if (target.maxHealth === undefined) {
            target.maxHealth = target.health;
        }

        // Store the attacker's health for later reference
        const attacker = this.selectedUnit;
        if (attacker.maxHealth === undefined) {
            attacker.maxHealth = attacker.health;
        }

        // Apply damage to target
        target.health -= damage;
        console.log(`${attacker.name} attacks ${target.name} for ${damage} damage`);

        // Check if units are in different rows (one line away)
        if (!this.areUnitsInDifferentRows(attacker, target)) {
            // Attacker also takes damage equal to target's attack
            const counterDamage = target.attack || 0;
            if (counterDamage > 0) {
                attacker.health -= counterDamage;
                console.log(`${attacker.name} takes ${counterDamage} damage from attacking across rows`);

                // Check if attacker is defeated
                if (attacker.health <= 0) {
                    this.handleUnitDefeat(attacker);
                }
            }
        }

        // Check if target is defeated
        if (target.health <= 0) {
            this.handleUnitDefeat(target);
        }

        // Mark the attacker as having attacked this turn
        attacker.canAttack = false;

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
    },

    // Mark invalid targets when a unit is selected for attack
    markInvalidTargets() {
        // Check all enemy cards
        if (!window.gameState) return;

        const slots = window.gameState.slots;
        const hasFrontRowUnits = this.hasFrontRowUnits('enemy');
        
        // Only mark back row units as invalid if front row has units AND attacker is not ranged
        if (hasFrontRowUnits && this.selectedUnit && this.selectedUnit.unitType !== 'ranged') {
            for (let i = 1; i <= 5; i++) {
                const slotId = `enemy-back-${i}`;
                if (slots[slotId] && slots[slotId].cardComponent) {
                    slots[slotId].cardComponent.isInvalidTarget = true;
                    slots[slotId].cardComponent.update();
                }
            }
        }
    },

    // Clear the invalid target markings
    clearInvalidTargets() {
        if (!window.gameState) return;

        const slots = window.gameState.slots;

        // Clear invalid target marking from all cards
        Object.keys(slots).forEach(slotId => {
            if (slotId.startsWith('enemy-') && slots[slotId] && slots[slotId].cardComponent) {
                slots[slotId].cardComponent.isInvalidTarget = false;
                slots[slotId].cardComponent.update();
            }
        });
    }
};

// Export the combat system
window.CombatSystem = CombatSystem;