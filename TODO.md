# Batchline outcome checklist

## A. Role-specific access and master data
- [ ] Provide login with at least three roles: salesman, admin, production; include auditor read-only and owner summary where feasible.
- [ ] Ensure each role sees only what it needs.
- [ ] Provide product, customer, raw-material and BOM masters. Products have standard selling price, tax classification, pack size and HSN; customers include retailer/distributor type and place of supply; inventory items carry base unit/category/rate; each BOM has standard component quantities per batch and expected packet yield.

## B. Sales order, approval, GST invoice and dispatch
- [ ] Salesman selects a customer (retailer or distributor), adds products and quantities, and submits an order directly to the factory; price comes from a price list. Salesman sees own order status and customer-wise sales.
- [ ] Make order entry mobile friendly; preserve offline order drafts and make them sync/retry when connectivity returns where feasible.
- [ ] Admin receives incoming orders, can verify/edit quantities or prices, and approves or rejects them. Before approval show whether finished-goods stock covers the order.
- [ ] Approved orders can become GST tax invoices containing GSTIN, HSN, taxable value, CGST/SGST or IGST based on place of supply, and financial-year invoice numbering. Provide an invoice PDF/print view that can be downloaded/shared.
- [ ] Dispatch reduces finished-goods stock; record payments against invoices and show customer outstanding balances. Posted invoices must be corrected by credit note rather than deleted.
- [ ] Benchmark: Retailer A (Tamil Nadu) orders 150 packets at ₹50 before tax; invoice taxable ₹7,500 + CGST ₹187.50 + SGST ₹187.50 = ₹7,875. Dispatch leaves 88 packets. Record ₹4,000 payment; outstanding is ₹3,875.
- [ ] Benchmark: Distributor B (Karnataka) orders 120 packets. Flag shortage of 32 packets; if invoiced, IGST applies.

## C. BOM production, stock ledger and variance
- [ ] For each finished product maintain a BOM with standard quantity per batch and expected yield; support kg, g, litres, pieces, packets and cartons of packets with correct conversion.
- [ ] A production run records product, batch/issue, expected output from BOM, actual good output, wastage/scrap and actual component issues. On save, decrease raw/packaging stock and increase finished-goods stock automatically.
- [ ] Compare planned vs actual material consumption and planned vs actual yield; flag variance beyond tolerance (default example 3%).
- [ ] Maintain always-current separate balances for raw materials, packaging, optional WIP and finished goods. Balance is derived/reconciled from the source-linked stock ledger, never a manually overwritten number.
- [ ] Every stock movement links to a purchase, production run, invoice/dispatch or adjustment. Include batch/expiry tracking where feasible.
- [ ] Benchmark BOM: Murukku 200 g, one batch = 200 packets expected: flour 40 kg at opening ₹42/kg and new purchase ₹45/kg; oil 10 L at ₹140/L; spice mix 1.2 kg at ₹200/kg; 200 g pouch 200 pieces at ₹2.50; carton (20 packets) 10 pieces at ₹15.
- [ ] Benchmark opening balances: flour 100 kg, oil 30 L, spice mix 5 kg, pouches 500, cartons 30, finished Murukku 200 g 50 packets. Record purchase 60 kg flour at ₹45/kg. Run issues: flour 40 kg, oil 10.5 L, spice mix 1.2 kg; actual output 188 good packets; 6 pouches damaged; 9 cartons used.
- [ ] Expected benchmark balances/results: flour closing 120 kg; oil closing 19.5 L; pouches closing 306; finished goods 238 after run and 88 after Retailer A dispatch; yield variance 188 vs 200 expected, −6%, flagged; oil consumption variance +5%, flagged.

## D. Costing and purchase records
- [ ] Provide purchases and supplier records where feasible; purchase posting creates source-linked receipts and updates moving balances.
- [ ] Show material/packaging cost per production run from purchase rates, selected valuation method, labour/power/gas/other overhead allocation rule, approximate cost per packet and margin vs selling price.
- [ ] Benchmark costs and assumptions must be explicit. Plan uses perpetual moving weighted-average valuation; flour run value ₹1,725 at ₹43.125/kg; pouch use is inferred as 188 good + 6 damaged = 194 at ₹2.50 each; actual materials/packaging ₹4,055; labour ₹1,200 + gas/power ₹600; batch total ₹5,855; cost per 188 good packets ₹31.14 displayed; approximate pre-tax gross margin ₹18.86 or 37.71% at ₹50 selling price.

## E. Reports and export
- [ ] Generate monthly reports filterable by date range and exportable to Excel/CSV and PDF where feasible: sales register/customer-wise/product-wise sales; GST outward supplies mapping to GSTR-1/GSTR-3B; purchase register; stock summary and stock ledger for raw/packaging/finished goods; production planned-vs-actual consumption, yield and wastage; payments/collections and customer receivables with ageing.
- [ ] Minimum export scope: sales register and stock report exportable to Excel/CSV.
- [ ] Show a month-end owner dashboard with today's orders, stock levels, variance alerts, cost per packet and outstanding dues.

## F. Traceability, seed, deployment and documentation
- [ ] Use a real database with an explainable schema; balances derive from or reconcile against movements. Use decimal quantities or integer minor-unit money arithmetic so rounding does not drift.
- [ ] Audit edits to invoices and production runs with user and time; do not delete posted invoices—use credit note.
- [ ] Include an idempotent script/file that loads section 5 benchmark master data so evaluators can rerun the scenario.
- [ ] Provide deployable setup: hosted demo or a single local run command; include test logins/role instructions without inventing OAuth bypasses.
- [ ] README covers setup, stack and rationale, built must/should/stretch tiers, assumptions, known gaps and benchmark numbers with explanations for any differences.
- [ ] Design note (maximum 2 pages PDF or Markdown) includes data model/ER diagram, stock and BOM computation, costing and valuation method.
- [ ] Include source code with understandable modules and a clear incremental commit history; demo walk-through is a deliverable expectation and should cover section 5 order, including mobile salesman and admin views.
- [ ] Do not require Tally for daily work; accounting export is optional. Use only benchmark dummy data and invented data.
