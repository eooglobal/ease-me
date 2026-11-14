import { describe, it, expect } from "vitest";
import { escapeCSVField, buildCSV } from "../export-utils";

describe("Milestone 2: Export Engine & RFC 4180 CSV Tests", () => {
  it("should format plain strings and numbers without quotes", () => {
    expect(escapeCSVField("StandardItem")).toBe("StandardItem");
    expect(escapeCSVField(4500)).toBe("4500");
    expect(escapeCSVField(0)).toBe("0");
  });

  it("should handle null and undefined safely by returning empty string", () => {
    expect(escapeCSVField(null)).toBe("");
    expect(escapeCSVField(undefined)).toBe("");
  });

  it("should escape fields containing commas by wrapping in quotes", () => {
    expect(escapeCSVField("Basmati Rice 5kg, Oil 3L")).toBe('"Basmati Rice 5kg, Oil 3L"');
    expect(escapeCSVField("Lagos, Nigeria")).toBe('"Lagos, Nigeria"');
  });

  it("should escape fields with internal quotes according to RFC 4180", () => {
    expect(escapeCSVField('Display "Super" Pack')).toBe('"Display ""Super"" Pack"');
  });

  it("should escape fields containing line breaks", () => {
    const multiline = "Line 1\nLine 2";
    expect(escapeCSVField(multiline)).toBe('"Line 1\nLine 2"');
  });

  it("should build structured multiline CSV correctly with headers and rows", () => {
    const headers = ["Invoice No", "Customer", "Amount"];
    const rows = [
      ["TX-1001", "Alhaji Musa, Enterprises", 50000],
      ["TX-1002", 'Chinedu "Stores"', 25000],
    ];

    const result = buildCSV(headers, rows);
    const lines = result.split("\r\n");

    expect(lines.length).toBe(3);
    expect(lines[0]).toBe("Invoice No,Customer,Amount");
    expect(lines[1]).toBe('TX-1001,"Alhaji Musa, Enterprises",50000');
    expect(lines[2]).toBe('TX-1002,"Chinedu ""Stores""",25000');
  });
});

