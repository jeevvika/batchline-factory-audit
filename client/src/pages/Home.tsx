import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BadgeCheck, Banknote,
  Boxes, ChartNoAxesColumnIncreasing, Check, ChevronDown, CircleHelp, ClipboardList,
  Factory, FileDown, FileText, Flame, Gauge, Package, PackageCheck, Plus, RefreshCw,
  Search, ShoppingBag, ShoppingCart, Sparkles, Truck, Users, Wallet, Wheat,
} from "lucide-react";
import {
  benchmarkCost, gstBreakdown, money, stockBalance, variancePercent,
  type StockEntry,
} from "@shared/factoryMath";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";

type Role = "Owner" | "Salesman" | "Factory admin" | "Production" | "Auditor";
type Page = "Overview" | "Orders" | "Production" | "Inventory" | "Costing" | "Reports";
type Order = { id: string; customer: string; state: "Submitted" | "Approved" | "Invoiced & dispatched" | "Shortage"; qty: number; territory: string; salesman: string };
type DemoState = { moves: StockEntry[]; complete: string[]; orders: Order[]; payment: number; overhead: number; invoiceNo: string; customToast: string };

const baseMoves: StockEntry[] = [
  { item: "Flour", quantity: 100, unit: "kg", kind: "opening" },
  { item: "Cooking oil", quantity: 30, unit: "L", kind: "opening" },
  { item: "Salt & spice mix", quantity: 5, unit: "kg", kind: "opening" },
  { item: "200 g pouch", quantity: 500, unit: "pcs", kind: "opening" },
  { item: "Carton · 20 pk", quantity: 30, unit: "pcs", kind: "opening" },
  { item: "Murukku · 200 g", quantity: 50, unit: "packets", kind: "opening" },
];
const initial: DemoState = { moves: baseMoves, complete: [], orders: [], payment: 0, overhead: 0, invoiceNo: "—", customToast: "" };
const steps = [
  ["purchase", "Purchase 60 kg flour", "Stock receipt · ₹45/kg"],
  ["production", "Post Murukku batch", "188 good · 6 pouch damage · 9 cartons"],
  ["retailer-order", "Salesman A · Retailer A", "150 packets · Tamil Nadu"],
  ["retailer-invoice", "Approve, invoice & dispatch", "CGST + SGST · 150 packets"],
  ["distributor-order", "Salesman B · Distributor B", "120 packets · Karnataka"],
  ["payment", "Record Retailer A payment", "₹4,000 received"],
  ["overhead", "Add run overheads", "₹1,200 labour + ₹600 gas / power"],
] as const;
const navItems: { name: Page; icon: typeof Gauge; hint: string }[] = [
  { name: "Overview", icon: Gauge, hint: "At a glance" },
  { name: "Orders", icon: ClipboardList, hint: "Sell & dispatch" },
  { name: "Production", icon: Factory, hint: "Recipe to run" },
  { name: "Inventory", icon: Boxes, hint: "Every movement" },
  { name: "Costing", icon: ChartNoAxesColumnIncreasing, hint: "Know your margin" },
  { name: "Reports", icon: FileText, hint: "Close the month" },
];
const roleAccess: Record<Role, Page[]> = {
  Owner: ["Overview", "Orders", "Production", "Inventory", "Costing", "Reports"],
  Salesman: ["Overview", "Orders"],
  "Factory admin": ["Overview", "Orders", "Inventory", "Reports"],
  Production: ["Overview", "Production", "Inventory"],
  Auditor: ["Overview", "Inventory", "Costing", "Reports"],
};

function loadDemo(): DemoState {
  try {
    const raw = localStorage.getItem("batchline-benchmark-v1");
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as DemoState;
    if (!Array.isArray(parsed.moves) || !Array.isArray(parsed.complete)) return initial;
    return { ...initial, ...parsed };
  } catch { return initial; }
}
function formatQty(value: number, digits = 1) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: digits }).format(value);
}
function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}
function StateBadge({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "good" | "warn" | "red" }) {
  return <span className={`state-badge ${tone}`}>{children}</span>;
}
function Metric({ label, value, detail, icon: Icon, tone = "" }: { label: string; value: string; detail: string; icon: typeof Gauge; tone?: string }) {
  return <article className={`metric-card ${tone}`}><div className="metric-top"><span>{label}</span><Icon size={17} strokeWidth={1.8} /></div><strong>{value}</strong><small>{detail}</small></article>;
}

export default function Home() {
  const [demo, setDemo] = useState<DemoState>(loadDemo);
  const remoteState = trpc.factory.load.useQuery(undefined, { retry: false });
  const saveState = trpc.factory.save.useMutation();
  const [hydrated, setHydrated] = useState(false);
  const [page, setPage] = useState<Page>("Overview");
  const [role, setRole] = useState<Role>("Owner");
  const [orderQty, setOrderQty] = useState(150);
  const [orderCustomer, setOrderCustomer] = useState("Retailer A");
  const [toast, setToast] = useState("");
  const visibleNav = navItems.filter(item => roleAccess[role].includes(item.name));
  const complete = (key: string) => demo.complete.includes(key);
  useEffect(() => {
    if (remoteState.isLoading) return;
    const state = remoteState.data as unknown as DemoState | null | undefined;
    if (state && Array.isArray(state.moves) && Array.isArray(state.complete)) setDemo({ ...initial, ...state });
    setHydrated(true);
  }, [remoteState.data, remoteState.isLoading]);
  useEffect(() => {
    localStorage.setItem("batchline-benchmark-v1", JSON.stringify(demo));
    if (hydrated) saveState.mutate(demo);
  }, [demo, hydrated]);
  useEffect(() => { if (!roleAccess[role].includes(page)) setPage(roleAccess[role][0]); }, [role, page]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const balances = useMemo(() => Object.fromEntries(["Flour", "Cooking oil", "Salt & spice mix", "200 g pouch", "Carton · 20 pk", "Murukku · 200 g"].map(item => [item, stockBalance(demo.moves, item)])), [demo.moves]);
  const yieldVariance = variancePercent(188, 200);
  const oilVariance = variancePercent(10.5, 10);
  const costs = benchmarkCost(demo.overhead);
  const stockCount = balances["Murukku · 200 g"] ?? 0;
  const shortage = Math.max(0, 120 - stockCount);
  const pending = steps.find(([key]) => !complete(key));
  const invoice = gstBreakdown(150 * 50, false);
  const orderAOutstanding = Math.max(0, invoice.total - demo.payment);

  const commitStep = (key: string) => {
    if (complete(key)) return;
    const next: DemoState = { ...demo, complete: [...demo.complete, key] };
    if (key === "purchase") {
      next.moves = [...demo.moves, { item: "Flour", quantity: 60, unit: "kg", kind: "purchase" }];
      setToast("Purchase GRN-26-004 posted · 60 kg flour received at ₹45/kg.");
    }
    if (key === "production") {
      if (!complete("purchase")) { setToast("Receive the flour purchase first so its weighted-average rate is correct."); return; }
      next.moves = [...demo.moves,
        { item: "Flour", quantity: -40, unit: "kg", kind: "issue" },
        { item: "Cooking oil", quantity: -10.5, unit: "L", kind: "issue" },
        { item: "Salt & spice mix", quantity: -1.2, unit: "kg", kind: "issue" },
        { item: "200 g pouch", quantity: -194, unit: "pcs", kind: "issue" },
        { item: "Carton · 20 pk", quantity: -9, unit: "pcs", kind: "issue" },
        { item: "Murukku · 200 g", quantity: 188, unit: "packets", kind: "production" },
      ];
      setToast("RUN-26-018 posted · all six movements linked to the batch.");
    }
    if (key === "retailer-order") {
      if (!complete("production")) { setToast("Post the production run before placing the benchmark order."); return; }
      next.orders = [...demo.orders, { id: "SO-26-041", customer: "Retailer A", state: "Submitted", qty: orderQty, territory: "Tamil Nadu", salesman: "Salesman A" }];
      setToast("SO-26-041 submitted from Salesman A’s phone.");
    }
    if (key === "retailer-invoice") {
      const submitted = demo.orders.find(order => order.customer === "Retailer A" && order.state === "Submitted");
      if (!submitted) { setToast("Submit Retailer A’s order first."); return; }
      if (submitted.qty > stockCount) { setToast(`Not enough finished goods. ${submitted.qty - stockCount} packet shortage.`); return; }
      next.orders = demo.orders.map(order => order.id === submitted.id ? { ...order, state: "Invoiced & dispatched" } : order);
      next.moves = [...demo.moves, { item: "Murukku · 200 g", quantity: -submitted.qty, unit: "packets", kind: "dispatch" }];
      next.invoiceNo = "26-27/0041";
      setToast("GST invoice 26-27/0041 posted · CGST + SGST · stock dispatched.");
    }
    if (key === "distributor-order") {
      if (!complete("retailer-invoice")) { setToast("Dispatch Retailer A’s order before checking remaining stock."); return; }
      next.orders = [...demo.orders, { id: "SO-26-042", customer: "Distributor B", state: "Shortage", qty: 120, territory: "Karnataka", salesman: "Salesman B" }];
      setToast(`SO-26-042 held · ${Math.max(0, 120 - stockCount)} packets short. No invoice or stock issue created.`);
    }
    if (key === "payment") {
      if (!complete("retailer-invoice")) { setToast("Post the invoice before recording its payment."); return; }
      next.payment = 4000;
      setToast("₹4,000 receipt allocated to invoice 26-27/0041 · ₹3,875 remains.");
    }
    if (key === "overhead") {
      if (!complete("production")) { setToast("Post the production run first."); return; }
      next.overhead = 1800;
      setToast("₹1,200 labour + ₹600 gas/power allocated to RUN-26-018.");
    }
    setDemo(next);
  };

  const reset = () => {
    localStorage.removeItem("batchline-benchmark-v1");
    setDemo(initial);
    setToast("Benchmark reset to the exact opening balances.");
  };
  const nextStep = () => pending ? commitStep(pending[0]) : setToast("Benchmark sequence complete. Reports are ready to export.");
  const completedCount = demo.complete.length;
  const submitCustomOrder = () => {
    if (orderQty < 1) { setToast("Enter at least one packet."); return; }
    const id = `SO-26-${String(43 + demo.orders.length).padStart(3, "0")}`;
    setDemo({ ...demo, orders: [...demo.orders, { id, customer: orderCustomer, state: orderQty > stockCount ? "Shortage" : "Submitted", qty: orderQty, territory: orderCustomer === "Distributor B" ? "Karnataka" : "Tamil Nadu", salesman: role === "Salesman" ? "Salesman A" : "Field sales" }] });
    setToast(`${id} saved as an order draft. Sample workspace stores this in this browser.`);
  };
  const exportSales = () => downloadCsv("batchline-sales-register.csv", [["Invoice", "Date", "Customer", "Place of supply", "Taxable value (INR)", "CGST", "SGST", "IGST", "Gross", "Paid", "Outstanding"], ...(complete("retailer-invoice") ? [[demo.invoiceNo, "2026-11-21", "Retailer A", "Tamil Nadu", invoice.taxable, invoice.cgst, invoice.sgst, invoice.igst, invoice.total, demo.payment, orderAOutstanding]] : [])]);
  const exportGST = () => downloadCsv("batchline-gst-outward-summary.csv", [["Period", "Place of supply", "Tax rate", "Taxable value", "CGST", "SGST", "IGST", "Gross"], ...(complete("retailer-invoice") ? [["Nov 2026", "Tamil Nadu", "5%", invoice.taxable, invoice.cgst, invoice.sgst, invoice.igst, invoice.total]] : [])]);
  const exportStock = () => downloadCsv("batchline-stock-ledger.csv", [["Item", "Movement", "Unit", "Source kind"], ...demo.moves.map(m => [m.item, m.quantity, m.unit, m.kind])]);
  const exportStockSummary = () => downloadCsv("batchline-stock-summary.csv", [["Item", "Closing quantity", "Unit"], ...Object.entries(balances).map(([item, quantity]) => [item, quantity, item === "Flour" || item === "Salt & spice mix" ? "kg" : item === "Cooking oil" ? "L" : item === "Murukku · 200 g" ? "packets" : "pcs"]) ]);
  const exportProduction = () => downloadCsv("batchline-production-variance.csv", [["Run", "Item", "Planned", "Actual", "Unit", "Variance %", "Alert tolerance"], ["RUN-26-018", "Yield", 200, 188, "packets", yieldVariance, "3%"], ["RUN-26-018", "Cooking oil", 10, 10.5, "L", oilVariance, "3%"], ["RUN-26-018", "Carton", 10, 9, "pcs", -10, "3%"]]);
  const exportPurchases = () => downloadCsv("batchline-purchase-register.csv", [["GRN", "Date", "Item", "Quantity", "Unit", "Rate INR", "Line total INR"], ...(complete("purchase") ? [["GRN-26-004", "2026-11-21", "Flour", 60, "kg", 45, 2700]] : [])]);
  const exportCollections = () => downloadCsv("batchline-collections-outstanding.csv", [["Customer", "Invoice", "Gross INR", "Paid INR", "Outstanding INR"], ...(complete("retailer-invoice") ? [["Retailer A", demo.invoiceNo, invoice.total, demo.payment, orderAOutstanding]] : [])]);
  const reportCards: { title: string; desc: string; Icon: typeof FileText; exporter: () => void }[] = [
    { title: "Sales register", desc: "Customer & product-wise · invoice 26-27/0041", Icon: FileText, exporter: exportSales },
    { title: "GST outward supplies", desc: "GSTR-1 / 3B shape · 5% packaged snacks", Icon: Banknote, exporter: exportGST },
    { title: "Stock summary & ledger", desc: "Raw · packaging · finished goods", Icon: Boxes, exporter: exportStockSummary },
    { title: "Production variance", desc: "BOM consumption · yield · scrap", Icon: Activity, exporter: exportProduction },
    { title: "Purchase register", desc: "Supplier receipts · moving average", Icon: ShoppingCart, exporter: exportPurchases },
    { title: "Collections & outstanding", desc: "Payment register · customer dues", Icon: Wallet, exporter: exportCollections },
  ];

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><span></span><span></span><span></span></div><div><b>BATCHLINE</b><small>factory-to-audit</small></div></div>
      <div className="workspace-label">WORKSPACE <span>DEMO</span></div>
      <nav className="nav-list" aria-label="Main navigation">
        {visibleNav.map(item => <button key={item.name} className={`nav-item ${page === item.name ? "active" : ""}`} onClick={() => setPage(item.name)}><item.icon size={17}/><span>{item.name}</span>{item.name === "Orders" && demo.orders.some(o => o.state === "Submitted") && <i className="nav-dot"/>}</button>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="online-note"><i/> SAMPLE WORKSPACE <small>{saveState.isSuccess ? "Saved to shared demo database" : remoteState.isError ? "Offline · saved on this device" : "Benchmark sample data only"}</small></div>
        <button className="user-chip" onClick={() => setRole(role === "Owner" ? "Factory admin" : "Owner")}><div className="avatar">JN</div><div><b>Jeevvika N.</b><small>{role} · Preview role</small></div><ChevronDown size={14}/></button>
      </div>
    </aside>

    <main className="main-area">
      <header className="topbar">
        <div className="crumb"><span>Operations</span><span className="slash">/</span><b>{page}</b></div>
        <div className="top-actions"><div className="date-chip"><span className="live-dot"/> Saturday, 21 Nov 2026</div><button className="icon-button" aria-label="Search"><Search size={17}/></button><button className="avatar top-avatar" title="Account" onClick={() => startLogin()}>JN </button></div>
      </header>
      <section className="content">
        <div className="page-heading">
          <div><div className="eyebrow">
            KAI MANAM - Traditional Taste,Homemade Love <span>·</span> COIMBATORE </div><h1>{page === "Overview" ? "Good evening, Jeevvika." : page}</h1><p>{page === "Overview" ? "A clear line from today’s orders to the month-end close." : page === "Production" ? "Plan against the recipe. Record what the floor actually used." : page === "Inventory" ? "Every balance adds up from a source document." : page === "Orders" ? "One order, one trail—from the field to dispatch." : page === "Costing" ? "What did a good packet really cost this run?" : "The month-end packet, already assembled."}</p></div>
          <div className="heading-actions"><label className="role-select-label">VIEW AS <select value={role} onChange={e => setRole(e.target.value as Role)} aria-label="Choose role preview">{(["Owner", "Salesman", "Factory admin", "Production", "Auditor"] as Role[]).map(r => <option key={r}>{r}</option>)}</select></label><button className="button secondary" onClick={reset}><RefreshCw size={15}/> Reset demo</button></div>
        </div>

        {page === "Overview" && <>
          <section className="hero-band">
            <div className="hero-main"><div className="hero-kicker"><Sparkles size={14}/> THE FACTORY, IN ONE LINE</div><h2>From the first order<br/>to the last ledger entry.</h2><p>A single trail for what you sold, what you made, and what it actually cost.</p><button className="button hero-button" onClick={() => setPage("Production")}>Open today’s batch <span>→</span></button></div>
            <div className="hero-art" aria-hidden="true"><div className="sun-disc"/><div className="art-line a1"/><div className="art-line a2"/><div className="packet packet-back">MURUKKU</div><div className="packet packet-front"><i/><b>200</b><small>g</small></div><div className="hero-serial">RUN / 018</div><span className="art-seal">TRICHY<br/>2026</span></div>
            <div className="hero-foot"><span>YOUR PRODUCTION STORY</span><div><span className="trail-step done">01 <i/>Order</span><span className="trail-connector"/><span className={`trail-step ${complete("production") ? "done" : ""}`}>02 <i/>Batch</span><span className="trail-connector"/><span className={`trail-step ${complete("retailer-invoice") ? "done" : ""}`}>03 <i/>Invoice</span><span className="trail-connector"/><span className={`trail-step ${completedCount >= 6 ? "done" : ""}`}>04 <i/>Books</span></div></div>
          </section>
          <div className="benchmark-strip"><div className="bench-title"><span className="benchmark-icon"><Activity size={16}/></span><div><b>Benchmark walkthrough</b><small>{completedCount} of 7 events posted · seeded with the internship scenario</small></div></div><div className="bench-progress"><span style={{ width: `${completedCount / 7 * 100}%` }}/></div><button className="button dark-button" disabled={role === "Auditor" || role === "Production" || role === "Salesman"} onClick={nextStep}>{pending ? <><span className="play">▶</span> {pending[1]}</> : <><BadgeCheck size={15}/> All events posted</>}</button></div>
          <div className="metric-grid"><Metric label="FINISHED STOCK" value={`${formatQty(stockCount, 0)} pkts`} detail={stockCount < 100 ? "Below the 100-packet watch line" : "Murukku · 200 g"} icon={PackageCheck} tone="metric-ink"/><Metric label="ORDERS TODAY" value={String(demo.orders.length)} detail={demo.orders.filter(o => o.state === "Submitted").length + " awaiting admin"} icon={ShoppingBag}/><Metric label="RUN VARIANCE" value={complete("production") ? `${yieldVariance}%` : "—"} detail={complete("production") ? "Yield · alert beyond ±3%" : "No production run posted"} icon={AlertTriangle} tone={complete("production") ? "metric-warn" : ""}/><Metric label="CUSTOMER DUES" value={money(orderAOutstanding)} detail={demo.payment ? "Retailer A · ₹4,000 received" : "No collections posted yet"} icon={Wallet}/></div>
          <div className="section-grid"><section className="panel panel-wide"><div className="panel-heading"><div><span className="section-kicker">THE DAY’S PAPER TRAIL</span><h3>Latest movements</h3></div><button className="text-button" onClick={() => setPage("Inventory")}>Open stock ledger <span>→</span></button></div><LedgerTable moves={demo.moves.slice(-5).reverse()} compact /></section><section className="panel"><div className="panel-heading"><div><span className="section-kicker">NEEDS A LOOK</span><h3>Floor signals</h3></div><span className="signal-count">{complete("production") ? "02" : "00"}</span></div>{complete("production") ? <div className="signal-list"><div className="signal-row danger"><span className="signal-mark">!</span><div><b>Yield below recipe</b><small>188 good of 200 expected · −6%</small></div><span>→</span></div><div className="signal-row amber"><span className="signal-mark">!</span><div><b>Oil issue above BOM</b><small>10.5 L actual vs 10 L planned · +5%</small></div><span>→</span></div></div> : <div className="empty-signal"><span>✓</span><div><b>Quiet floor—for now.</b><small>Variance signals appear when a run is posted.</small></div></div>}<div className="note-card"><Flame size={15}/><span>Each alert stays attached to its batch record.</span></div></section></div>
        </>}

        {page === "Production" && <>
          <div className="production-banner"><div><span className="section-kicker">LIVE RECIPE · BOM-001</span><h2>Murukku <em>200 g</em></h2><p>One batch should make 200 packets. Here’s the recipe the floor starts from.</p></div><StateBadge tone={complete("production") ? "warn" : "good"}>{complete("production") ? "RUN-26-018 POSTED" : "READY TO RUN"}</StateBadge></div>
          <div className="section-grid prod-grid"><section className="panel"><div className="panel-heading"><div><span className="section-kicker">STANDARD BILL OF MATERIALS</span><h3>Recipe for one batch</h3></div><button className="icon-button soft"><CircleHelp size={16}/></button></div><div className="bom-list"><BOMRow name="Flour" note="Opening ₹42 · receipt ₹45/kg" qty="40" unit="kg" icon={Wheat}/><BOMRow name="Cooking oil" note="Benchmark rate ₹140/L" qty="10" unit="L" icon={Flame}/><BOMRow name="Salt & spice mix" note="Benchmark rate ₹200/kg" qty="1.2" unit="kg" icon={Sparkles}/><BOMRow name="200 g pouch" note="One per good packet" qty="200" unit="pcs" icon={Package}/><BOMRow name="Carton · 20 packets" note="Standard pack-out" qty="10" unit="pcs" icon={Boxes}/></div><div className="bom-footer"><span>EXPECTED YIELD</span><b>200 <small>packets</small></b></div></section>
          <section className="panel run-panel"><div className="panel-heading"><div><span className="section-kicker">ACTUAL RUN · 21 NOV 2026</span><h3>What the floor recorded</h3></div><span className="run-stamp">18</span></div>{!complete("purchase") && <div className="inline-notice"><AlertTriangle size={16}/> Post the 60 kg flour receipt before this run to establish weighted-average cost.</div>}<div className="actual-grid"><div><small>Flour issued</small><b>40 <i>kg</i></b><span>matches recipe</span></div><div className="warn-box"><small>Oil issued</small><b>10.5 <i>L</i></b><span>+0.5 L over</span></div><div><small>Spice issued</small><b>1.2 <i>kg</i></b><span>matches recipe</span></div><div><small>Good output</small><b>188 <i>pkts</i></b><span className="bad-text">12 below plan</span></div><div><small>Pouches damaged</small><b>6 <i>pcs</i></b><span>194 total consumed</span></div><div><small>Cartons used</small><b>9 <i>pcs</i></b><span>1 below standard</span></div></div><div className="variance-box"><div><span className="variance-icon"><AlertTriangle size={16}/></span><div><b>Recipe variance detected</b><small>Alert threshold · 3% in either direction</small></div></div><div className="variance-chips"><StateBadge tone="red">Yield {yieldVariance}%</StateBadge><StateBadge tone="warn">Oil +{oilVariance}%</StateBadge></div></div><div className="run-actions"><div><b>Posting creates 6 stock movements</b><small>Raw inputs decrease · 188 good packets increase</small></div><button className="button primary" disabled={complete("production") || !complete("purchase")} onClick={() => commitStep("production")}>{complete("production") ? <><Check size={15}/> Run posted</> : <>Post production run <span>→</span></>}</button></div></section></div>
          <section className="panel movement-preview"><div className="panel-heading"><div><span className="section-kicker">POSTING PREVIEW</span><h3>Ledger impact of RUN-26-018</h3></div><StateBadge>Source linked</StateBadge></div><div className="movement-chips"><Movement item="Flour" qty="−40 kg"/><Movement item="Cooking oil" qty="−10.5 L" warn/><Movement item="Spice mix" qty="−1.2 kg"/><Movement item="Pouches" qty="−194 pcs"/><Movement item="Cartons" qty="−9 pcs"/><Movement item="Murukku 200 g" qty="+188 pkts" good/></div></section>
        </>}

        {page === "Orders" && <div className="section-grid orders-layout"><section className="panel order-entry"><div className="panel-heading"><div><span className="section-kicker">FIELD ORDER · MOBILE FIRST</span><h3>New order</h3></div><span className="phone-tag">PHONE VIEW</span></div><label className="field-label">CUSTOMER<select value={orderCustomer} onChange={e => setOrderCustomer(e.target.value)}><option>Retailer A</option><option>Distributor B</option><option>Retailer C</option></select></label><div className="customer-snippet"><div className="avatar customer-avatar"><Users size={17}/></div><div><b>{orderCustomer}</b><small>{orderCustomer === "Distributor B" ? "Distributor · Karnataka · GSTIN 29AABCU9603R1ZX" : "Retailer · Tamil Nadu · GSTIN 33AABCU9603R1ZV"}</small></div><StateBadge tone="good">PRICE LIST</StateBadge></div><div className="order-product"><div className="product-icon"><Package size={21}/></div><div className="product-title"><b>Murukku · 200 g</b><small>MRK-200 · HSN 1905 · 5% GST</small></div><span>{money(50)} <small>/ packet</small></span></div><div className="qty-control"><span>QUANTITY</span><div><button onClick={() => setOrderQty(Math.max(1, orderQty - 10))}>−</button><input aria-label="Order quantity" type="number" min="1" value={orderQty} onChange={e => setOrderQty(Number(e.target.value))}/><button onClick={() => setOrderQty(orderQty + 10)}>+</button></div></div><div className="order-total"><span>Taxable value <small>· before GST</small></span><b>{money(orderQty * 50)}</b></div><button className="button primary full-button" onClick={submitCustomOrder}><Plus size={16}/> Submit order <span>→</span></button><div className="offline-indicator"><span/> Drafts stay on this device when you’re offline</div></section>
          <section className="panel orders-table-panel"><div className="panel-heading"><div><span className="section-kicker">ORDER DESK · {demo.orders.length} TOTAL</span><h3>Orders & fulfilment</h3></div><StateBadge tone="warn">{demo.orders.filter(o => o.state === "Submitted").length} to review</StateBadge></div>{demo.orders.length === 0 ? <div className="blank-state"><ShoppingCart size={26}/><b>No orders have reached the desk yet.</b><small>Use the walkthrough step or place one from the field-order form.</small></div> : <div className="orders-table-wrap"><table className="orders-table"><thead><tr><th>ORDER / CUSTOMER</th><th>SALESMAN</th><th>QTY</th><th>STATUS</th><th>STOCK CHECK</th><th/></tr></thead><tbody>{demo.orders.map(order => <tr key={order.id}><td><b>{order.id}</b><small>{order.customer} · {order.territory}</small></td><td>{order.salesman}</td><td>{order.qty} pkts</td><td><StateBadge tone={order.state === "Invoiced & dispatched" ? "good" : order.state === "Shortage" ? "warn" : "plain"}>{order.state}</StateBadge></td><td>{order.state === "Shortage" ? <span className="bad-text">Short by {Math.max(0, order.qty - stockCount)}</span> : order.state === "Invoiced & dispatched" ? "Invoice posted" : `${stockCount} available`}</td><td>{order.state === "Submitted" && role === "Factory admin" && <button className="mini-action" onClick={() => commitStep("retailer-invoice")}>Approve & dispatch</button>}</td></tr>)}</tbody></table></div>}<div className="admin-note"><Truck size={16}/><span><b>Dispatch is a stock event.</b> The invoice, dispatch note and finished-goods deduction share one trail.</span></div></section></div>}

        {page === "Inventory" && <><div className="inventory-callout"><div><span className="section-kicker">LEDGER FIRST · ALWAYS</span><h2>A balance you can prove.</h2><p>Opening stock + receipts − issues − dispatches = what’s on the shelf.</p></div><div className="inventory-equation"><span>OPENING</span><b>+</b><span>RECEIPTS</span><b>−</b><span>ISSUES</span><b>=</b><span>ON HAND</span></div></div><div className="inventory-cards">{[
            ["Flour", "kg", "Raw material", Wheat], ["Cooking oil", "L", "Raw material", Flame], ["Salt & spice mix", "kg", "Raw material", Sparkles], ["200 g pouch", "pcs", "Packaging", Package], ["Carton · 20 pk", "pcs", "Packaging", Boxes], ["Murukku · 200 g", "packets", "Finished goods", PackageCheck],
          ].map(([name, unit, category, Icon]) => { const item = String(name); const qty = balances[item] ?? 0; const rawItem = typeof Icon === "function" && (item === "Flour" || item === "Cooking oil" || item === "Salt & spice mix"); return <article className="stock-card" key={item}><div className="stock-top"><span className="stock-icon"><Icon size={18}/></span><span className="section-kicker">{String(category).toUpperCase()}</span><button className="dots">···</button></div><h3>{item}</h3><div className="stock-balance">{formatQty(qty, 1)} <small>{String(unit)}</small></div><div className="stock-bar"><span style={{ width: `${Math.max(7, Math.min(100, qty / (item === "Flour" ? 160 : item === "Murukku · 200 g" ? 250 : 35) * 100))}%` }}/></div><div className="stock-foot"><span>{rawItem && qty < 20 ? <StateBadge tone="warn">Reorder soon</StateBadge> : <span>Updated from ledger</span>}</span><span>{demo.moves.filter(m => m.item === item).length} moves</span></div></article>; })}</div><section className="panel ledger-panel"><div className="panel-heading"><div><span className="section-kicker">MOVEMENT REGISTER</span><h3>Stock ledger</h3></div><button className="button secondary small-button" onClick={exportStock}><FileDown size={15}/> Export CSV</button></div><LedgerTable moves={demo.moves.slice().reverse()}/></section></>}

        {page === "Costing" && <><div className="costing-hero"><div><span className="section-kicker">RUN-26-018 · WEIGHTED AVERAGE</span><h2>A packet costs<br/><em>{money(costs.perPacket)}</em> to make.</h2><p>That’s the good packet, after actual material use and the run’s overhead.</p></div><div className="cost-circle"><span>PRE-TAX<br/>GROSS MARGIN</span><b>{costs.marginPercent}%</b><small>{money(costs.margin)} per packet</small></div></div><div className="section-grid cost-grid"><section className="panel"><div className="panel-heading"><div><span className="section-kicker">BATCH COST BUILD-UP</span><h3>Where the rupees went</h3></div><StateBadge>₹ INR</StateBadge></div><div className="cost-rows"><CostRow name="Flour · 40 kg × ₹43.125/kg" value={costs.flour}/><CostRow name="Cooking oil · 10.5 L × ₹140/L" value={costs.oil}/><CostRow name="Salt & spice · 1.2 kg × ₹200/kg" value={costs.spice}/><CostRow name="Pouches · 194 used × ₹2.50" value={costs.pouches}/><CostRow name="Cartons · 9 used × ₹15" value={costs.cartons}/><CostRow name="Labour · direct to this run" value={demo.overhead ? 1200 : 0}/><CostRow name="Gas & power · direct to this run" value={demo.overhead ? 600 : 0}/></div><div className="cost-total"><span>Total for 188 good packets</span><b>{money(costs.total)}</b></div><div className="cost-per"><span>÷ 188 good packets</span><b>{money(costs.perPacket)} <small>/ packet</small></b></div></section><section className="panel valuation-panel"><span className="section-kicker">WHY THIS METHOD?</span><h3>Perpetual moving average</h3><p>Every flour receipt updates its running cost. That keeps a single, explainable value for each issue—without choosing the oldest or newest bag.</p><div className="formula"><span>100 kg × ₹42</span><b>+</b><span>60 kg × ₹45</span><b>÷</b><span>160 kg</span><i>=</i><strong>₹43.125/kg</strong></div><div className="selling-price"><span>Selling price · before tax</span><b>{money(50)}</b><span>Approx. gross margin</span><b className="green-text">{money(costs.margin)} <small>({costs.marginPercent}%)</small></b></div><div className="note-card"><CircleHelp size={15}/><span>Overheads are assigned directly to this run. GST is excluded from product cost.</span></div></section></div></>}

        {page === "Reports" && <><div className="reports-head"><div><span className="section-kicker">NOVEMBER 2026 · FINANCIAL YEAR 2026–27</span><h2>Auditor’s packet, in progress.</h2><p>Every report traces back to an invoice, purchase, payment or batch record.</p></div><label className="month-select">REPORTING PERIOD<select><option>November 2026</option><option>October 2026</option></select></label></div><div className="report-grid">{reportCards.map(({ title, desc, Icon, exporter }) => <article className="report-card" key={title}><div className="report-icon"><Icon size={18}/></div><h3>{title}</h3><p>{desc}</p><div className="report-bottom"><span><i/> {demo.complete.length ? "Ready to export" : "Awaiting transactions"}</span><button onClick={exporter}><FileDown size={14}/> CSV</button></div></article>)}</div><section className="panel invoice-panel"><div className="panel-heading"><div><span className="section-kicker">TAX INVOICE · {demo.invoiceNo}</span><h3>Retailer A · Tamil Nadu</h3></div><button className="button secondary small-button" onClick={() => window.print()}><FileDown size={15}/> Print / Save PDF</button></div><div className="invoice-details"><div><small>SELLER GSTIN</small><b>33AABCU9603R1ZV</b></div><div><small>PLACE OF SUPPLY</small><b>Tamil Nadu · intra-state</b></div><div><small>HSN / GST RATE</small><b>1905 · 5%</b></div><div><small>INVOICE DATE</small><b>21 Nov 2026</b></div></div><div className="invoice-table"><div><span>Murukku · 200 g <small>150 × ₹50</small></span><b>{money(invoice.taxable)}</b></div><div><span>CGST · 2.5%</span><b>{money(invoice.cgst)}</b></div><div><span>SGST · 2.5%</span><b>{money(invoice.sgst)}</b></div><div className="invoice-grand"><span>Invoice total</span><b>{money(invoice.total)}</b></div><div><span>Payment received</span><b>− {money(demo.payment)}</b></div><div className="invoice-grand due"><span>Outstanding</span><b>{money(orderAOutstanding)}</b></div></div><div className="invoice-footer"><BadgeCheck size={16}/> Posted invoices are preserved. Corrections go through a credit note.</div></section></>}
      </section>
    </main>
    {toast && <div className="toast"><span><Check size={15}/></span>{toast}</div>}
  </div>;
}

function LedgerTable({ moves, compact = false }: { moves: StockEntry[]; compact?: boolean }) {
  const source = (move: StockEntry) => move.kind === "opening" ? "Opening balance" : move.kind === "purchase" ? "GRN-26-004 · Flour receipt" : move.kind === "production" ? "RUN-26-018 · Good output" : move.kind === "dispatch" ? "INV-26-27/0041 · Dispatch" : "RUN-26-018 · Actual issue";
  return <div className="ledger-wrap"><table className="ledger-table"><thead><tr><th>ITEM</th><th>SOURCE DOCUMENT</th><th>TYPE</th><th>QUANTITY</th>{!compact && <th>POSTED BY</th>}</tr></thead><tbody>{moves.map((move, index) => <tr key={`${move.item}-${move.kind}-${index}`}><td><b>{move.item}</b></td><td><span className="source-link"><FileText size={13}/>{source(move)}</span></td><td><StateBadge tone={move.kind === "purchase" || move.kind === "production" ? "good" : move.kind === "issue" || move.kind === "dispatch" ? "warn" : "plain"}>{move.kind}</StateBadge></td><td className={move.quantity < 0 ? "qty-negative" : "qty-positive"}>{move.quantity > 0 ? "+" : ""}{formatQty(move.quantity, 3)} <small>{move.unit}</small></td>{!compact && <td>JN · Jeevvika N.</td>}</tr>)}</tbody></table>{moves.length === 0 && <div className="table-empty">No movements posted yet.</div>}</div>;
}
function BOMRow({ name, note, qty, unit, icon: Icon }: { name: string; note: string; qty: string; unit: string; icon: typeof Wheat }) {
  return <div className="bom-row"><span className="bom-icon"><Icon size={16}/></span><span className="bom-label"><b>{name}</b><small>{note}</small></span><span className="bom-qty"><b>{qty}</b><small>{unit}</small></span></div>;
}
function Movement({ item, qty, warn = false, good = false }: { item: string; qty: string; warn?: boolean; good?: boolean }) {
  return <div className={`movement-chip ${warn ? "movement-warn" : ""} ${good ? "movement-good" : ""}`}><span>{item}</span><b>{qty}</b></div>;
}
function CostRow({ name, value }: { name: string; value: number }) {
  return <div className="cost-row"><span>{name}</span><b>{money(value)}</b></div>;
}
