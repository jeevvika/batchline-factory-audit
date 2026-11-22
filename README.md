# Batchline — factory-to-audit operations
## Repository

[View source code on GitHub](https://github.com/jeevvika/batchline-factory-audit)

Batchline is a role-oriented operations prototype for a small South Indian snack maker. Its central design idea is a **batch trail**: an order, production run, stock movement, tax invoice and payment belong to one auditable story. The visual language borrows from shop-floor ledgers and letterpress packaging—warm stock-paper surfaces, dark ink, a tamarind-red signal color, batch stamps and tabular figures.


## Run it

### Prerequisites
- Node.js 20 or later
- pnpm 10.18
- MySQL database
- Required environment variables configured

### Installation

Clone the repository:

```bash
git clone https://github.com/jeevvika/batchline-factory-audit.git
cd batchline-factory-audit
```

Install dependencies:

```bash
pnpm install
```

Configure the required environment variables, including `DATABASE_URL` and the Manus OAuth settings required by the starter.

Run database migrations:

```bash
pnpm db:migrate
```

Load benchmark data:

```bash
pnpm seed:benchmark
```

Start the development server:

```bash
pnpm dev
```

Open `http://localhost:3000` in your browser.

For production:

```bash
pnpm build
pnpm start
```

**Note:** Verify the commands and environment configuration on a fresh setup before submitting. On Windows PowerShell, the development server may require the documented alternative startup command if the `pnpm dev` script fails.

## Implemented in this prototype

The Overview page shows the workflow trail, benchmark stepper, stock, orders, variance and dues. Production includes a five-item BOM, actual run inputs/output, planned-vs-actual yield/oil variance and a preview of the run's stock movements. Orders includes a phone-width order form, Tamil Nadu/Karnataka customers, order statuses, an admin approval/dispatch action and the 32-packet shortage case. Inventory balances are calculated from opening, receipt, issue, production and dispatch movements in the current movement array; both stock ledger and sales register have CSV export. Costing explains moving-weighted-average flour valuation and direct-to-run labour/gas/power. Reports includes an invoice print/save-to-PDF view, GST split and links to CSV exports. Local browser storage preserves the scenario in a single device; the sample workspace can be saved in the managed database.

A typed arithmetic module and Vitest cases cover GST, stock balance, yield/oil variance and batch cost arithmetic. Run checks with `pnpm check` and `pnpm test`.

## Benchmark arithmetic and assumptions

The seed data is in [`shared/benchmark-master-data.json`](shared/benchmark-master-data.json). Flour valuation uses perpetual moving weighted average: `(100 × ₹42 + 60 × ₹45) / 160 = ₹43.125/kg`. The flour issued to the run is valued at ₹1,725. Actual packaging consumption is inferred from the required closing pouch balance: 188 good packets + 6 damaged pouches = 194 pouches consumed. Recorded carton usage is 9, even though the standard BOM is 10; actual usage is valued as recorded and the one-carton difference is visible as a variance.

| Check | Batchline result |
| --- | ---: |
| Flour / oil / spice closing | 120 kg / 19.5 L / 3.8 kg |
| Pouches / cartons closing | 306 pcs / 21 pcs |
| Finished goods after run / Retailer A dispatch | 238 / 88 packets |
| Yield variance / oil variance | −6% / +5% (both over 3% tolerance) |
| Retailer A invoice | ₹7,500 taxable + ₹187.50 CGST + ₹187.50 SGST = ₹7,875 |
| Retailer A dues after ₹4,000 receipt | ₹3,875 |
| Distributor B order | 32-packet shortage; do not invoice or deduct stock |
| Materials + packaging | ₹4,055 |
| Labour + gas/power | ₹1,800 allocated to this run |
| Run cost / good-packet cost | ₹5,855 / ₹31.14 (rounded) |
| Approximate pre-tax gross margin | ₹18.86 / packet, 37.71% |

Costs include 10.5 L oil at ₹140/L, 1.2 kg spice at ₹200/kg, 194 pouches at ₹2.50 and 9 cartons at ₹15. GST is excluded from inventory cost. Overhead is charged directly to this run. Cost and margin are approximate to two decimal places for display; the rate calculations retain the three-decimal flour rate.

## Feature tiers and assumptions

**Must-have prototype flows:** responsive order entry, admin stock check/approval/dispatch walkthrough, invoice tax calculation/print view, recipe/BOM and production posting, variance alerts, movement-based stock projection and CSV sales/ledger export. **Should-have prototype flows:** flour purchase, payment/outstanding calculation, cost per packet, GST invoice summary, owner dashboard and low-stock/watch indicators. **Stretch direction shown:** offline browser draft persistence. True background sync, FEFO batch dispatch, full purchasing/workflow masters, full PDF report pack, Tamil interface and Tally/e-invoice integration are not implemented.

The app deliberately does not require Tally for daily work. It does not connect to GSTN, e-invoice, e-way bill, WhatsApp, email or accounting APIs.

## Important prototype boundaries / known gaps

This is a reviewable visual/functional prototype, not a production accounting or factory system. `factory_workspace` is a **single JSON snapshot table** for this one synthetic benchmark workspace; it is not the fully normalized multi-entity schema envisioned in the design brief. Its embedded movement list is the source for displayed balances, but concurrency control, database transaction boundaries spanning document + ledger writes, immutable append-only movement rows, corrections/credit-note documents and a complete user/time audit table are not yet implemented. Shared demo writes are intentionally public because they contain only invented benchmark data; do not put real business or personal data in it.

The role dropdown is a **role preview**, not secure role-based access control. It demonstrates distinct intended views but does not restrict server mutations by authenticated roles. The top-right account control starts the starter's real Manus OAuth flow; fake test users/passwords and development-mode auth bypasses are intentionally not provided. A production submission still needs authenticated user-to-role assignment, server-side role authorization, admin user management and secured operational APIs. Likewise the order draft persists in browser storage but has no conflict-safe sync queue. The CSV controls are prototype-shaped exports, not a complete set of reconciled monthly auditor workbooks; reports beyond the sales register and movement ledger need normalized transactional records before being treated as official.

The current invoice/production records are demo scenario views, not legally issued invoices. Replace sample GSTINs, invoice series, tax validation and period controls before real use. No hosted/public production link or real evaluator logins are claimed by this README.

## Demo Video

Project demonstration video: [Watch KaiManam Demo](https://drive.google.com/file/d/1jusNmwvZh5BsBohoMX4NHDDNstPn7iOv/view?usp=sharing)

## Demo Access and Test Roles

This prototype uses a role-selection dropdown for demonstration purposes.

Available demo roles:
- Owner
- Salesman
- Factory Admin
- Production
- Auditor

**Note:** These roles are for UI demonstration only. Separate authenticated accounts and secure role-based access control are not implemented in this prototype.

## Run Locally

Prerequisites:
- Node.js
- pnpm

Steps:

1. Clone the repository.
2. Open the project folder in VS Code.
3. Install dependencies using `pnpm install`.
4. Start the development server:

```powershell
$env:NODE_ENV="development"; pnpm exec tsx watch server/_core/index.ts
```

5. Open http://localhost:3000 in your browser.
