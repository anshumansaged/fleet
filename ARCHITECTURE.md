# Fleet Trip Accounting System — Architecture Document

## System Overview
Production-grade fleet trip accounting for taxi fleet owners tracking trips, earnings, commissions, expenses, driver payroll, and cash settlement across multiple platforms.

---

## Core Formulas

```
Total KM          = End KM - Start KM
Total Earnings    = Σ (platform earnings)  [Uber + InDrive + YatriSathi + Rapido + Offline]
Uber Commission   = ₹117 (fixed per day with Uber trips)
Yatri Commission  = Yatri Trip Count × ₹10
Total Commission  = Uber Commission + Yatri Commission + Other Platform Commissions
Net Earnings      = Total Earnings - Total Commission
Total Cash Collected = Σ (cash collected per platform)
Total Fuel Expense   = Σ (fuel entries)
Total Expenses       = Total Fuel + Σ (other expenses)
Driver Salary        = Net Earnings × (Driver Commission % / 100)
Cash In Driver Hand  = Total Cash Collected - Total Expenses - Online Payments
Cash To Cashier      = Cash In Driver Hand - Driver Salary (if taken)
Remaining Balance    = Cash In Driver Hand - Cash Given To Cashier - Driver Salary Taken
Owner Profit         = Net Earnings - Driver Salary - Total Expenses
```

---

## Database Schema (MongoDB)

### Collections

1. **owners** — Fleet owner accounts
2. **drivers** — Driver profiles with commission %
3. **vehicles** — Vehicle registry
4. **trips** — Daily trip sheets (core entity)
5. **platform_earnings** — Earnings per platform per trip sheet
6. **expenses** — Fuel + other expenses per trip sheet
7. **settlements** — Cash settlement records
8. **ledger_entries** — Double-entry financial ledger
9. **audit_logs** — Immutable audit trail
10. **reconciliations** — Daily reconciliation snapshots

### Relationships
```
Owner → has many → Vehicles
Owner → has many → Drivers
Vehicle → assigned to → Driver (current)
Trip → belongs to → Driver, Vehicle, Owner
Trip → has many → PlatformEarnings
Trip → has many → Expenses
Trip → has one → Settlement
Settlement → generates → LedgerEntries
Every mutation → generates → AuditLog
```

---

## API Architecture

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh-token

### Drivers
- GET    /api/drivers
- POST   /api/drivers
- PUT    /api/drivers/:id
- DELETE /api/drivers/:id

### Vehicles
- GET    /api/vehicles
- POST   /api/vehicles
- PUT    /api/vehicles/:id

### Trips (Daily Trip Sheets)
- GET    /api/trips               (list with filters)
- GET    /api/trips/:id           (detail with all sub-data)
- POST   /api/trips               (create trip sheet)
- PUT    /api/trips/:id           (update trip sheet)
- POST   /api/trips/:id/finalize  (lock for audit)

### Earnings
- POST   /api/trips/:tripId/earnings
- PUT    /api/trips/:tripId/earnings/:id

### Expenses
- POST   /api/trips/:tripId/expenses
- PUT    /api/trips/:tripId/expenses/:id
- DELETE /api/trips/:tripId/expenses/:id

### Settlement
- POST   /api/trips/:tripId/settlement
- PUT    /api/trips/:tripId/settlement

### Analytics / Dashboard
- GET    /api/analytics/daily-summary
- GET    /api/analytics/driver-performance
- GET    /api/analytics/vehicle-stats
- GET    /api/analytics/profit-loss
- GET    /api/analytics/cash-flow

### Reconciliation
- POST   /api/reconciliation/daily
- GET    /api/reconciliation/:date

### Audit
- GET    /api/audit-logs

---

## Event-Driven Architecture

Using EventEmitter for in-process events (scalable to Redis/Kafka later):

| Event                    | Triggers                              |
|--------------------------|---------------------------------------|
| trip.created             | Initialize calculations               |
| earnings.updated         | Recalculate totals, commission, salary|
| expenses.updated         | Recalculate cash in hand, profit      |
| settlement.created       | Generate ledger entries               |
| settlement.finalized     | Lock trip, create audit snapshot       |
| reconciliation.triggered | Daily balance verification            |

---

## Financial Ledger (Double-Entry)

Every cash movement creates a debit + credit entry:
- Cash collected → DR: Cash, CR: Revenue
- Commission paid → DR: Commission Expense, CR: Cash
- Fuel expense → DR: Fuel Expense, CR: Cash  
- Driver salary → DR: Salary Expense, CR: Cash/Payable
- Cash to cashier → DR: Cashier, CR: Driver Cash

---

## Fraud Prevention

1. Immutable audit logs (no update/delete on audit_logs)
2. KM validation (end > start, reasonable daily range)
3. Earnings cross-check (platform total vs cash collected)
4. Trip finalization lock (no edits after finalized)
5. Settlement amount verification (calculated vs reported)
6. Daily reconciliation with discrepancy alerts
7. Role-based access (owner vs driver vs cashier)

---

## Scalability Design (1000+ cars)

1. MongoDB indexes on owner_id, driver_id, date, vehicle_id
2. Compound indexes for common queries
3. Pagination on all list endpoints
4. Redis caching for dashboard analytics
5. Background jobs for reconciliation
6. Horizontal scaling via stateless API design
7. Connection pooling for MongoDB

---

## Tech Stack

| Layer      | Technology                       |
|------------|----------------------------------|
| Backend    | Node.js, Express, MongoDB, Mongoose |
| Web        | React, Redux Toolkit, TailwindCSS  |
| Mobile     | Flutter, Riverpod, Dio             |
| Cache      | Redis (optional, for scale)         |
| Events     | Node EventEmitter → Redis Pub/Sub  |
| Auth       | JWT (access + refresh tokens)       |
| Validation | Joi / express-validator             |
