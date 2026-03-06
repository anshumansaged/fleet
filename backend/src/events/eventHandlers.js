const { fleetEvents, EVENTS } = require('./eventEmitter');
const calculationService = require('../services/calculations/tripCalculations');
const ledgerService = require('../services/ledgerService');
const auditService = require('../services/auditService');

function registerEventHandlers(io) {
  // Recalculate on earnings change
  fleetEvents.on(EVENTS.EARNINGS_UPDATED, async ({ tripId, userId }) => {
    try {
      const trip = await calculationService.recalculateTrip(tripId);
      if (io) io.to(`owner_${trip.ownerId}`).emit('trip.updated', { tripId, trip });
    } catch (err) {
      console.error('Event EARNINGS_UPDATED error:', err.message);
    }
  });

  // Recalculate on expenses change
  fleetEvents.on(EVENTS.EXPENSES_UPDATED, async ({ tripId, userId }) => {
    try {
      const trip = await calculationService.recalculateTrip(tripId);
      if (io) io.to(`owner_${trip.ownerId}`).emit('trip.updated', { tripId, trip });
    } catch (err) {
      console.error('Event EXPENSES_UPDATED error:', err.message);
    }
  });

  // Generate ledger entries on settlement
  fleetEvents.on(EVENTS.SETTLEMENT_CREATED, async ({ tripId, userId }) => {
    try {
      await ledgerService.generateLedgerEntries(tripId);
    } catch (err) {
      console.error('Event SETTLEMENT_CREATED error:', err.message);
    }
  });

  // Finalize trip — lock it
  fleetEvents.on(EVENTS.TRIP_FINALIZED, async ({ tripId, userId }) => {
    try {
      await ledgerService.generateLedgerEntries(tripId);
    } catch (err) {
      console.error('Event TRIP_FINALIZED error:', err.message);
    }
  });

  console.log('Event handlers registered');
}

module.exports = { registerEventHandlers };
