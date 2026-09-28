import { describe, expect, it } from "vitest";
import { greatCircleKm } from "./geo";

describe("greatCircleKm", () => {
  it("is zero for the same point", () => {
    expect(greatCircleKm({ lat: -15.78, lon: -47.87 }, { lat: -15.78, lon: -47.87 })).toBe(0);
  });

  it("measures a quarter meridian as ~10 008 km", () => {
    expect(greatCircleKm({ lat: 0, lon: 0 }, { lat: 90, lon: 0 })).toBeCloseTo(10007.5, 0);
  });

  it("is symmetric", () => {
    const a = { lat: -15.78, lon: -47.87 };
    const b = { lat: 45.42, lon: -75.7 };
    expect(greatCircleKm(a, b)).toBeCloseTo(greatCircleKm(b, a), 6);
  });
});
