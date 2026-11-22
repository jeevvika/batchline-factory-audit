
# Batchline – System Design Note

## 1. System Architecture

Batchline is a factory-to-audit operations
system for a small snack manufacturing business.

Main modules:
- Orders
- Production
- Inventory
- Costing
- Reports

## 2. Data Model

Main entities:
- Users
- Customers
- Products
- Orders
- Order Items
- Raw Materials
- BOM
- Production Runs
- Stock Movements
- Invoices
- Payments

## 3. Stock Calculation

Closing Stock =
Opening Stock + Stock Received
+ Production Output - Dispatch
- Other Stock Losses

## 4. BOM Consumption

BOM means Bill of Materials.

For one Murukku batch:

- Flour: 40 kg
- Cooking Oil: 10 L
- Spice Mix: 1.2 kg
- Pouches: 200 pieces
- Cartons: 10 pieces

Expected output: 200 packets.

## 5. Actual Production Benchmark

- Good output: 188 packets
- Expected output: 200 packets
- Yield variance: -6%
- Oil consumed: 10.5 L
- Oil variance: +5%

## 6. Costing and Valuation

Explain material costs, production overhead,
unit production cost and stock valuation.

Use the actual costing method implemented
in the project.

## 7. Assumptions and Limitations

Document assumptions and known gaps.