const EventEmitter = require('events');

class FleetEventEmitter extends EventEmitter {}

const fleetEvents = new FleetEventEmitter();
fleetEvents.setMaxListeners(20);

// Event constants
const EVENTS = {
  TRIP_CREATED: 'trip.created',
  TRIP_UPDATED: 'trip.updated',
  TRIP_FINALIZED: 'trip.finalized',
  EARNINGS_UPDATED: 'earnings.updated',
  EXPENSES_UPDATED: 'expenses.updated',
  SETTLEMENT_CREATED: 'settlement.created',
  SETTLEMENT_UPDATED: 'settlement.updated',
};

module.exports = { fleetEvents, EVENTS };
