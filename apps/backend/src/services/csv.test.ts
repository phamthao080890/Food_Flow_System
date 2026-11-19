import { describe, expect, it } from "vitest";
import { cleanCsvText, decodeCsv } from "./csv.js";

describe("CSV encoding", () => {
  it("reads UTF-8 with BOM", () => {
    const bytes = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from("Tên món,Đồ uống")]);
    expect(decodeCsv(bytes)).toBe("Tên món,Đồ uống");
  });

  it("falls back to Windows-1258 and normalizes Vietnamese text", () => {
    const bytes = Buffer.from([0x54, 0xea, 0x6e, 0x20, 0x6d, 0xf3, 0x6e, 0x2c, 0xd0, 0xf4, 0xcc, 0x20, 0x75, 0xf4, 0xec, 0x6e, 0x67]);
    expect(cleanCsvText(decodeCsv(bytes))).toBe("Tên món,Đồ uống");
  });

  it("reads UTF-16LE exported by spreadsheet software", () => {
    const bytes = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from("Tên món", "utf16le")]);
    expect(decodeCsv(bytes)).toBe("Tên món");
  });
});
