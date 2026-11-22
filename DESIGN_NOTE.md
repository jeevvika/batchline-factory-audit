# Batchline – System Design Note

## 1. System Architecture

Batchline is a factory-to-audit operations prototype designed for a small snack manufacturing business. It connects the main operational activities through a common batch trail.

**Main modules:**
- **Orders:** Customer orders, approval, shortage handling and dispatch.
- **Production:** Bill of Materials (BOM), actual production recording and variance detection.
- **Inventory:** Raw material and finished goods stock tracking.
- **Costing:** Material valuation, production overhead and cost per packet.
- **Reports:** Invoice views, GST summaries and CSV exports.

The application uses React, TypeScript, Express/tRPC, Drizzle and MySQL. The prototype also supports local browser storage for demo scenario persistence.

## 2. Data Model

The main conceptual entities are:

| Entity | Purpose |
|---|---|
| Users | User and role information |
| Customers | Retailer and distributor details |
| Products | Finished product information |
| Orders / Order Items | Customer orders and quantities |
| Raw Materials | Flour, oil, spice and packaging stock |
| BOM | Standard material requirements per batch |
| Production Runs | Actual inputs, output and yield |
| Stock Movements | Receipts, issues, production and dispatch |
| Invoices | Sales and tax calculations |
| Payments | Customer payment records |

**Relationship overview:** Customers place orders containing products. Products have BOM recipes. Production runs consume raw materials and create finished goods. Stock movements record receipts, consumption and dispatch. Invoices are associated with fulfilled orders, and payments reduce outstanding customer dues.

**Implementation note:** The current prototype stores the benchmark workspace in a single `factory_workspace` JSON snapshot table. Its embedded stock movement list is used to calculate displayed balances. The above entities describe the conceptual business model, not separate normalized database tables.

## 3. Stock Calculation

Inventory is calculated from stock movements.

**Closing Stock = Opening Stock + Receipts + Production Output − Production Issues − Dispatches − Other Recorded Losses**

- Raw material receipts increase available material stock.
- Production issues decrease raw material stock.
- Good production output increases finished goods stock.
- Customer dispatch decreases finished goods stock.

The movement list is the source for the displayed inventory balances.

## 4. BOM Consumption

BOM (Bill of Materials) defines the standard materials required for one production batch.

**Standard Murukku BOM:**

| Material | Standard Quantity |
|---|---:|
| Flour | 40 kg |
| Cooking oil | 10 L |
| Salt and spice mix | 1.2 kg |
| 200 g pouches | 200 pcs |
| Cartons | 10 pcs |

Expected output: **200 packets**.

Actual production records are compared with standard quantities to identify material and yield variances.

## 5. Actual Production Benchmark

The recorded production run `RUN-26-018` has the following results:

- Expected output: 200 packets
- Good output: 188 packets
- Damaged pouches: 6
- Actual oil consumption: 10.5 L
- Actual carton usage: 9 pcs
- Yield variance: −6%
- Oil variance: +5%

Pouch consumption is calculated as 188 good packets + 6 damaged pouches = 194 pouches. Both yield and oil variance exceed the 3% alert threshold.

## 6. Costing and Inventory Valuation

The prototype uses **perpetual moving weighted-average valuation** for flour.

Flour valuation:

(100 kg × ₹42 + 60 kg × ₹45) / 160 kg = ₹43.125 per kg.

Flour issued to production:

40 kg × ₹43.125 = ₹1,725.

**Actual batch cost:**

| Cost component | Amount |
|---|---:|
| Flour | ₹1,725 |
| Cooking oil (10.5 L × ₹140) | ₹1,470 |
| Spice mix (1.2 kg × ₹200) | ₹240 |
| Pouches (194 × ₹2.50) | ₹485 |
| Cartons (9 × ₹15) | ₹135 |
| **Total materials and packaging** | **₹4,055** |
| Labour and gas/power overhead | ₹1,800 |
| **Total production cost** | **₹5,855** |

**Cost per good packet:**

₹5,855 / 188 = **₹31.14 per packet** (rounded).

At a selling price of ₹50 per packet, the approximate pre-tax gross margin is ₹18.86 per packet, or 37.71%.

GST is excluded from inventory cost. Production overhead is allocated directly to the recorded run.

## 7. Assumptions and Limitations

- The system uses synthetic benchmark customer and company data.
- The current benchmark workspace is stored as a JSON snapshot rather than a fully normalized multi-entity database.
- Stock balances are derived from the embedded stock movement list.
- The role selector is a preview, not secure role-based access control.
- Shared demo writes use invented benchmark data and are not suitable for real business information.
- Full background synchronization, immutable stock movement records, complete audit history and production-grade transaction controls are not implemented.
- GSTN, e-invoice, e-way bill and Tally integrations are not available.
- The displayed invoices are demonstration records, not legally issued tax invoices.