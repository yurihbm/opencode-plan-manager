import { test, expect } from "bun:test";
import { formatDate } from "../../src/utils/date";

test("formatDate - formats current date when no argument provided", () => {
  const result = formatDate();
  // Should match YYYY-MM-DD pattern
  expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

test("formatDate - formats specific dates correctly", () => {
  expect(formatDate(new Date("2024-12-25"))).toBe("2024-12-25");
  expect(formatDate(new Date("2024-01-05"))).toBe("2024-01-05");
  expect(formatDate(new Date("2026-02-05"))).toBe("2026-02-05");
});

test("formatDate - pads single-digit months and days with zeros", () => {
  expect(formatDate(new Date("2024-01-01"))).toBe("2024-01-01");
  expect(formatDate(new Date("2024-09-09"))).toBe("2024-09-09");
  expect(formatDate(new Date("2024-03-07"))).toBe("2024-03-07");
});

test("formatDate - handles leap years", () => {
  expect(formatDate(new Date("2024-02-29"))).toBe("2024-02-29");
  expect(formatDate(new Date("2020-02-29"))).toBe("2020-02-29");
});

test("formatDate - handles year boundaries", () => {
  expect(formatDate(new Date("2023-12-31"))).toBe("2023-12-31");
  expect(formatDate(new Date("2024-01-01"))).toBe("2024-01-01");
});

test("formatDate - handles different months with different days", () => {
  // February
  expect(formatDate(new Date("2024-02-15"))).toBe("2024-02-15");
  // April (30 days)
  expect(formatDate(new Date("2024-04-30"))).toBe("2024-04-30");
  // August (31 days)
  expect(formatDate(new Date("2024-08-31"))).toBe("2024-08-31");
});

test("formatDate - handles dates from different eras", () => {
  expect(formatDate(new Date("2000-01-01"))).toBe("2000-01-01");
  expect(formatDate(new Date("1999-12-31"))).toBe("1999-12-31");
  expect(formatDate(new Date("2099-06-15"))).toBe("2099-06-15");
});
