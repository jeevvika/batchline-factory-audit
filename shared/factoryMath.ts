export type StockEntry = {
  item: string;
  quantity: number;
  unit: string;
  kind: "opening" | "purchase" | "issue" | "damage" | "production" | "dispatch";
};

const milli = (value: number) => Math.round(value * 1000);
const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const round3 = (value: number) => Math.round((value + Number.EPSILON) * 1000) / 1000;

export function stockBalance(entries: StockEntry[], item: string): number {
  return entries
    .filter(entry => entry.item === item)
    .reduce((sum, entry) => sum + milli(entry.quantity), 0) / 1000;
}

export function variancePercent(actual: number, planned: number): number {
  if (planned === 0) return 0;
  return round2(((actual - planned) / planned) * 100);
}

export function gstBreakdown(taxableRupees: number, interstate: boolean) {
  const taxablePaise = Math.round(taxableRupees * 100);
  const taxPaise = Math.round(taxablePaise * 0.05);
  const cgstPaise = interstate ? 0 : Math.round(taxPaise / 2);
  const sgstPaise = interstate ? 0 : taxPaise - cgstPaise;
  const igstPaise = interstate ? taxPaise : 0;
  const toRupees = (paise: number) => paise / 100;
  return {
    taxable: toRupees(taxablePaise),
    cgst: toRupees(cgstPaise),
    sgst: toRupees(sgstPaise),
    igst: toRupees(igstPaise),
    total: toRupees(taxablePaise + cgstPaise + sgstPaise + igstPaise),
  };
}

export function movingAverageRate(openingQty: number, openingRateRupees: number, receiptQty: number, receiptRateRupees: number) {
  const totalQuantityMilli = milli(openingQty) + milli(receiptQty);
  if (totalQuantityMilli <= 0) return 0;
  const openingValuePaise = Math.round(openingQty * 1000) * Math.round(openingRateRupees * 100);
  const receiptValuePaise = Math.round(receiptQty * 1000) * Math.round(receiptRateRupees * 100);
  return round3(((openingValuePaise + receiptValuePaise) / totalQuantityMilli) / 100);
}

export const benchmark = {
  flour: { openingQty: 100, openingRate: 42, receiptQty: 60, receiptRate: 45 },
  oil: { openingQty: 30, openingRate: 140 },
  spice: { openingQty: 5, openingRate: 200 },
  pouches: { openingQty: 500, openingRate: 2.5 },
  cartons: { openingQty: 30, openingRate: 15 },
  yield: { planned: 200, actual: 188, damagedPouches: 6, cartonsUsed: 9 },
};

export function benchmarkCost(overheadRupees = 1800) {
  const flourRate = movingAverageRate(100, 42, 60, 45);
  const flour = flourRate * 40;
  const oil = 10.5 * 140;
  const spice = 1.2 * 200;
  const pouches = 194 * 2.5;
  const cartons = 9 * 15;
  const materials = round2(flour + oil + spice + pouches + cartons);
  const total = round2(materials + overheadRupees);
  return {
    flourRate,
    flour: round2(flour),
    oil: round2(oil),
    spice: round2(spice),
    pouches: round2(pouches),
    cartons: round2(cartons),
    materials,
    overhead: overheadRupees,
    total,
    perPacket: round2(total / 188),
    margin: round2(50 - total / 188),
    marginPercent: round2(((50 - total / 188) / 50) * 100),
  };
}

export function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}
