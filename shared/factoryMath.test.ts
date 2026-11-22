import { describe, expect, it } from "vitest";
import { benchmarkCost, gstBreakdown, movingAverageRate, stockBalance, variancePercent, type StockEntry } from "./factoryMath";

describe("Batchline benchmark arithmetic", () => {
  it("reconciles flour and oil stock from movement entries", () => {
    const ledger: StockEntry[] = [
      { item: "Flour", quantity: 100, unit: "kg", kind: "opening" },
      { item: "Flour", quantity: 60, unit: "kg", kind: "purchase" },
      { item: "Flour", quantity: -40, unit: "kg", kind: "issue" },
      { item: "Oil", quantity: 30, unit: "L", kind: "opening" },
      { item: "Oil", quantity: -10.5, unit: "L", kind: "issue" },
    ];
    expect(stockBalance(ledger, "Flour")).toBe(120);
    expect(stockBalance(ledger, "Oil")).toBe(19.5);
  });

  it("computes Tamil Nadu GST and inter-state IGST using integer paise", () => {
    expect(gstBreakdown(7500, false)).toEqual({ taxable: 7500, cgst: 187.5, sgst: 187.5, igst: 0, total: 7875 });
    expect(gstBreakdown(6000, true)).toEqual({ taxable: 6000, cgst: 0, sgst: 0, igst: 300, total: 6300 });
  });

  it("flags six-percent yield and five-percent oil variance", () => {
    expect(variancePercent(188, 200)).toBe(-6);
    expect(variancePercent(10.5, 10)).toBe(5);
  });

  it("uses moving average flour valuation and explains batch cost", () => {
    expect(movingAverageRate(100, 42, 60, 45)).toBe(43.125);
    const cost = benchmarkCost();
    expect(cost.materials).toBe(4055);
    expect(cost.total).toBe(5855);
    expect(cost.perPacket).toBe(31.14);
    expect(cost.margin).toBe(18.86);
  });
});
