# Batchline — implementation and design plan

## Product and implementation approach

Batchline is an order-to-audit operations workspace for a small South Indian snack factory. Its signature idea is a shared **batch trail**: a salesman order, a production run, each stock movement, tax invoice and payment are connected to their source records rather than being disconnected screens or manually overwritten balances. The web app will use the initialized React + TypeScript frontend and Express/tRPC + Drizzle/MySQL backend, with durable records in the managed database. The intended initial demo is benchmark-seeded and role-focused, with the benchmark view usable as a deterministic prototype while records are persisted by application APIs where practical. Never imply that demo seed data is a production accounting system or that unavailable external integrations are live.

The experience is organized as a desktop command desk for admin, production, owner and auditor, plus a compact responsive salesman order-taking flow that remains useful on small screens and weak networks. The main owner overview prioritizes the day's orders, finished stock, outstanding dues, batch variance alerts and unit cost. The most important interaction is the production run: select product/batch, review BOM-planned inputs, record actual issue and output, post the run, then inspect ledger movements and explainable variance. The sales path demonstrates order → approval → GST invoice → dispatch → payment. Reports include sales/GST, purchases, stock ledger/summary, production variance, collections/outstanding and CSV export.

### Scope and feature mapping

Must-have scope: role-specific login/role views for salesman, admin, production and auditor (owner summary view); product/customer/raw-material/BOM masters; mobile-width order entry; admin approval/stock check; invoice rendering with GSTIN/HSN/tax split and invoice number; production posting that updates raw and finished balances; planned-vs-actual consumption/yield with tolerance alerts; movement ledger; sales/stock report CSV export.

Should-have scope: purchase entry, payments/outstanding, weighted-average costing, labour and gas/power allocation, GST summary and owner dashboard. Stretch scope selected: offline-friendly local order draft and retry-on-reconnect affordance; batch/expiry labels as traceability metadata; raw-material reorder alerts; production planning suggestion from unfulfilled orders; Tamil-ready floor copy only if feasible without compromising core correctness. No Tally sync, e-invoice or GPS is required for the prototype.

### Benchmark arithmetic and explicit assumptions

Use integer-paisa money calculations and decimal quantities (never binary floats for persisted amounts). Apply 5% GST, intrastate CGST 2.5% + SGST 2.5%, interstate IGST 5%; no GST rounding issue exists for the given ₹7,500 taxable value. Invoice taxable value is 150 × ₹50 = ₹7,500, CGST ₹187.50, SGST ₹187.50, gross ₹7,875. After ₹4,000 receipt, Retailer A owes ₹3,875. After one run, good finished stock is 50 + 188 = 238; the order of 150 can be dispatched, leaving 88. Distributor B's 120-unit order is short by 32 and should remain blocked pending stock, not silently invoiced. Closing flour is 100 + 60 − 40 = 120 kg; oil is 30 − 10.5 = 19.5 L; spice is 5 − 1.2 = 3.8 kg. Pouches are 500 − 188 − 6 = 306 (188 good units and 6 damaged pouches consumed); cartons are 30 − 9 = 21. Expected yield is 200, actual good output 188, −6% variance, flagged over 3% tolerance. Oil is 10.5 L actual vs 10 L planned, +5%, flagged. Run uses 9 cartons even though the standard recipe specifies 10; show this as a packaging-input shortfall/variance rather than rounding to BOM.

Valuation uses perpetual moving weighted-average cost for each stock item. For flour, `(100×₹42 + 60×₹45)/160 = ₹43.125/kg`; the run's flour is valued at ₹1,725. Assume opening oil ₹140/L and spice ₹200/kg (benchmark rates); pouches ₹2.50 and cartons ₹15. Pouch usage is inferred from the required closing count: 188 good pouches + 6 damaged = 194 consumed. Run material/packaging total = flour ₹1,725 + oil ₹1,470 + spice ₹240 + pouches ₹485 + cartons ₹135 = ₹4,055. Add ₹1,200 labour and ₹600 gas/power directly to this production run, for total batch cost ₹5,855. Cost per good packet = ₹5,855/188 = ₹31.1436, displayed ₹31.14; overheads are assigned to the run, not across months. Damaged pouches are included as consumed packaging. GST is excluded from inventory cost and selling price margin is pre-tax: ₹50 − ₹31.14 = ₹18.86 or 37.71% approximate gross margin. These assumptions must appear in the UI and README.

The benchmark text's pouches closing balance requires deducting the 188 pouches used for good output and 6 damaged pouches; carton recipe standard is 10 but recorded issue is 9. This prototype posts user-recorded actual issue. Avoid double-counting good pouches as damage. Stock balances are computed from source-linked ledger movements; a summary is a projection, never an editable balance.

### Data and application architecture

The database schema should model role-bearing users; products and pack sizes; customers with place of supply and GSTIN; inventory items with base units, category, rates and reorder level; BOM headers and component quantities per batch/yield; purchases and purchase lines; production runs and actual component issues/output/waste/overheads; sales orders and lines; invoices and tax lines; dispatches; payments; stock movements with item, signed quantity, unit, source type/id, timestamp and user; and an audit log. Use foreign keys/unique invoice numbering by financial year where feasible. Use transactions when posting purchases, production, dispatch, invoice and payment to maintain ledger consistency. Preserve posted invoices; corrections use credit notes rather than deletion. Audit mutable edits with user/time.

For prototype delivery, keep concerns separated: `client/src/pages` for role views and reports, `client/src/components` for layout, ledger tables, variance pills and order forms, `client/src/lib` for shared formatters and calculation helpers; `server/routers.ts` for typed API procedures; `server/db.ts` for data access; `drizzle/schema.ts` and `drizzle/` for schema/migrations; `shared/` for calculation/domain types; `scripts/` for idempotent benchmark seed; `docs/` for README/design note. If the supplied template schema cannot be safely expanded in time, demonstrate the end-to-end benchmark with a deterministic client-side seed state and clearly label persistence as a prototype limitation; do not claim production-grade real database behavior without implementing it.

### Design

Three deliberately niche directions considered (each low-probability exploratory style): **heritage export docket** (0.06), **factory signal-board brutalism** (0.04), **tactile batch ledger** (0.08). Choose **tactile batch ledger**, referencing Indian letterpress/ledger books and contemporary editorial dashboards.

- **Design Movement:** Contemporary editorial interface grounded in South Indian shop-floor ledgers and letterpress print.
- **Core Principles:** Trace each number to its source; make variance legible before it becomes waste; prioritize fast role-specific actions; use operational language that respects shop-floor expertise.
- **Color Philosophy:** Warm paper and ink establish calm accounting legibility; a deep tamarind red marks important action/variance; muted turmeric and leaf-green support rather than decorate. Red is an alert, not a blanket accent.
- **Layout Paradigm:** Asymmetric two-column command desk: slim left rail for work areas, broad working canvas with a narrow contextual “batch strip” for stock/cost/status. Mobile order entry becomes a full-height sequence of customer → items → review rather than a compressed desktop grid.
- **Signature Elements:** Batch-number stamps as source-link chips; a perforated-looking ledger rule for movement history; a horizontal “material → run → packet → invoice” trail showing where a figure came from.
- **Interaction Philosophy:** Posting is deliberate and previews stock effects before commit; every consequential action returns a traceable document reference. Offline drafts persist locally until sync is available.
- **Animation:** Brief 160–220 ms fades/slides for drawers and tab changes; stock quantities count only on committed updates; no looping motion or animation that obscures a warning.
- **Typography System:** Fraunces for editorial headlines and prominent batch identifiers; DM Sans for interface, labels and dense tables; tabular numerals for quantities and rupee totals. Headline 30–36 px, section 20–24 px, body 14–16 px, metadata 11–12 px.
- **Brand Essence:** “The snack factory’s single paper trail, from order to audit.” Personality: grounded, exact, resourceful.
- **Brand Voice:** Short, precise, human. Examples: “This batch used 0.5 L more oil than its recipe.” “88 packets remain after Retailer A’s dispatch.”
- **Wordmark & Logo:** “BATCHLINE” custom uppercase wordmark with the A formed as a small gabled factory roof and a rule extending like a ledger line; simplified stamp icon built from stacked packet-like bars.
- **Signature Brand Color:** Tamarind red `#9B3D2F`.

### Project structure

- `client/src/pages/` — dashboard, orders, production, inventory and reports pages/role panels.
- `client/src/components/` — shared navigation, cards, status/variance elements, forms and ledger table.
- `client/src/lib/` — formatting, offline draft support and frontend API helpers.
- `server/routers.ts` — typed API surface and role checks.
- `server/db.ts` — persistent access and source-document writes.
- `drizzle/schema.ts`, `drizzle/` — relational schema and additive migrations.
- `shared/` — domain types, exact tax/BOM/cost calculations.
- `scripts/` — repeatable benchmark seed.
- `docs/` — setup/readme and the concise data-model/costing design note.
- `public/manus-routes.json` — authoritative application route manifest.

## Build workflow and dependencies

1. Inspect the starter frontend/auth/database patterns and retain the supplied Manus OAuth session validation rather than inventing demo authentication.
2. Add accessible responsive shell, role switcher/navigation and seeded benchmark command desk; create a route manifest matching implemented routes.
3. Implement shared deterministic quantity, GST, moving-average and variance functions with tests before connecting their results to UI.
4. Add schema/migration and idempotent seed, then APIs for ledger-backed purchase, production, order approval, invoice/dispatch, payments and report queries. Enforce role checks at the API boundary. If an operational capability cannot be safely completed, show its prototype limitation explicitly.
5. Build concise auditor exports, invoice print/PDF path and README/design note. Ensure seed script can load exactly the benchmark state without overwriting later edits.
6. Enable TypeScript diagnostics before first application-code batch; run project type/test/build checks and resolve actionable diagnostics. Configure the development command through Webdev runtime config, verify service readiness and route manifest, then commit to the canonical `main` checkpoint. Publishing is separate and only after configuration allows it.

### Technical choice

A responsive React web application/PWA-style interface is appropriate because sales staff need phone-first order capture while the factory and auditor benefit from desktop tables. The prepared React/TypeScript + Express/tRPC + Drizzle/MySQL stack supplies shared typed domain logic, an actual relational ledger and a single deployable demo, without making Tally a daily-work dependency.
