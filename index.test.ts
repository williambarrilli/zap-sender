import { describe, it, expect } from "vitest";
import { normalizePhone } from "./index";

describe("normalizePhone", () => {
  it("deve normalizar números brasileiros com DDI e DDD", () => {
    expect(normalizePhone("+5554999999999")).toBe("+5554999999999");
    expect(normalizePhone("5549999999999")).toBe("+5549999999999");
    expect(normalizePhone("54999999999")).toBe("+5554999999999");
    expect(normalizePhone("999999999")).toBe("+999999999");
    expect(normalizePhone("wa.me/5549999999999")).toBe("+5549999999999");
  });
  it("deve retornar null para entradas inválidas", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone("abc")).toBeNull();
  });
});
