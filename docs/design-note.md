# Batchline design note

## Data model and traceability

The initialized database includes the starter `users` table and a `factory_workspace` table (`slug` primary key, JSON `state`, update timestamp). The single `benchmark-demo` record stores the deterministic synthetic walkthrough state: completion flags, orders, payment/overhead totals and a movement list. Each movement has item, signed quantity, unit and movement kind. The UI projects balances from these movements rather than overwriting a balance field. The dedicated `shared/benchmark-master-data.json` is the reviewable master-data seed; `pnpm seed:benchmark` inserts opening balances once and never overwrites the workspace on a rerun.

This is intentionally a small prototype schema, not a production-ready normalized model. A full release should separate products, pack sizes, BOM headers/components, customers, suppliers, purchase documents/lines, production runs/actual material issues, orders/lines, invoices/tax lines, dispatches, payments, stock movements and audit events. Each posted movement should carry immutable `sourceType`, `sourceId`, actor and timestamp fields, and each multi-document posting should be a database transaction. Posted invoices should be corrected via linked credit notes.

## Stock and production computation

For item `i`, projected on-hand quantity is the signed movement sum:

`closing(i) = Σ movement.quantity(i)`

Opening balances are positive movements; a receipt and finished-goods output are positive; production issues, damage consumed and dispatches are negative. Quantities are normalized to three decimal places in the arithmetic helper. Example: flour `100 + 60 − 40 = 120 kg`; oil `30 − 10.5 = 19.5 L`; pouches `500 − 188 − 6 = 306 pcs`; murukku finished stock `50 + 188 − 150 = 88 packets` after dispatch.

Expected yield comes from the BOM (200 packets per batch). Yield variance is `(actual good output − expected output) / expected output × 100`, or `(188 − 200)/200 = −6%`. Oil consumption variance is `(actual − planned) / planned × 100`, or `(10.5 − 10)/10 = +5%`. Both exceed the 3% tolerance. Damaged pouches are separately reported and consumed; pouch closing implies total issue of 194. Recorded carton issue is 9 compared with the BOM's standard 10.

## Tax and costing

Amounts are computed from integer paise at the GST helper boundary. The benchmark is a Tamil Nadu domestic sale: ₹7,500 taxable, 2.5% CGST ₹187.50 + 2.5% SGST ₹187.50 = ₹7,875 gross. The Karnataka order is inter-state and would use 5% IGST if it were invoiced; the prototype correctly holds it before invoice because only 88 packets remain versus the 120 ordered. A ₹4,000 receipt leaves ₹3,875 outstanding.

The selected valuation method is perpetual moving weighted average. Flour rate after receipt is `(100×₹42 + 60×₹45)/160 = ₹43.125/kg`. Materials/packaging for the actual run are ₹1,725 flour + ₹1,470 oil + ₹240 spices + ₹485 pouches + ₹135 cartons = ₹4,055. Labour ₹1,200 and power/gas ₹600 are allocated directly to the run, yielding ₹5,855 / 188 good packets = ₹31.1436, shown as ₹31.14. Approximate pre-tax gross margin is `(₹50−₹31.1436)/₹50 = 37.71%`. GST is excluded from inventory cost. Direct-to-run overhead avoids an arbitrary monthly allocation rule in this one-run benchmark.

## Stack and deployment choice

The React/TypeScript + Express/tRPC + Drizzle/MySQL web stack supports a shared phone/desktop interface, typed calculation logic and managed persistence without Tally as a daily dependency. `pnpm dev` runs the managed local preview; migration and idempotent seed commands are documented in the root README. The database stores the benchmark workspace as one JSON record today; normalize operational entities and add server-side RBAC/atomic posting before using real transactions.
