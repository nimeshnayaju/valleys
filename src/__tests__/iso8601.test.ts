import { describe, expect, it } from "vitest";
import { iso8601, ValidationError } from "../index";

describe("iso8601", () => {
  it.each([
    // Standard formats with Z timezone
    "2023-12-25T10:30:00Z",
    "2023-01-01T00:00:00Z",
    "2023-12-31T23:59:59Z",

    // With milliseconds
    "2023-12-25T10:30:00.123Z",
    "2023-12-25T10:30:00.1Z",
    "2023-12-25T10:30:00.999Z",

    // With timezone offsets
    "2023-12-25T10:30:00+00:00",
    "2023-12-25T10:30:00-05:00",
    "2023-12-25T10:30:00+12:00",
    "2023-12-25T10:30:00-12:00",

    // With timezone offsets without colon
    "2023-12-25T10:30:00+0000",
    "2023-12-25T10:30:00-0500",

    // With milliseconds and timezone offsets
    "2023-12-25T10:30:00.123+05:30",
    "2023-12-25T10:30:00.999-08:00",

    // Edge cases for valid dates
    "2020-02-29T00:00:00Z", // Leap year
    "1970-01-01T00:00:00Z", // Unix epoch
    "2000-01-01T00:00:00Z", // Y2K
    "9999-12-31T23:59:59Z", // Far future

    // Different millisecond precisions
    "2023-12-25T10:30:00.1Z",
    "2023-12-25T10:30:00.12Z",
    "2023-12-25T10:30:00.123Z",
    "2023-12-25T10:30:00.1234Z",
    "2023-12-25T10:30:00.12345Z",
    "2023-12-25T10:30:00.123456Z",
    "2023-12-25T10:30:00.1234567Z",

    // Maximum valid offsets
    "2023-12-25T10:30:00+14:00",
    "2023-12-25T10:30:00-14:00",

    // Half-hour offsets
    "2023-12-25T10:30:00+05:30",
    "2023-12-25T10:30:00-03:30",

    // Quarter-hour offsets
    "2023-12-25T10:30:00+05:45",
    "2023-12-25T10:30:00+08:45",

    // Start and end of months
    "2023-01-01T00:00:00Z",
    "2023-01-31T23:59:59Z",
    "2023-12-01T00:00:00Z",
    "2023-12-31T23:59:59Z",

    // Leap year boundary
    "2020-02-29T23:59:59.999Z",
    "2024-02-29T00:00:00Z",

    // Century boundary
    "1999-12-31T23:59:59.999Z",
    "2000-01-01T00:00:00.000Z",

    // JavaScript Date constructor quirks (normalized dates)
    "2023-02-30T10:30:00Z", // February 30th -> March 2nd
    "2023-04-31T10:30:00Z", // April 31st -> May 1st
    "2023-02-29T10:30:00Z", // February 29th in non-leap year -> March 1st
    "2023-12-25T24:00:00Z", // Hour 24 -> Next day at 00:00
  ])("should accept ISO 8601 string '%s'", (value) => {
    const result = iso8601().unstable_validate(value);
    expect(result.value).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it.each([
    // Non-string values
    123,
    true,
    false,
    null,
    undefined,
    {},
    [],
    new Date(),
    new Date().toISOString,
    () => "2023-12-25T10:30:00Z",
    Symbol("2023-12-25T10:30:00Z"),

    // Date-only formats
    "2023-12-25",
    "2023-12",
    "2023",

    // Week date format
    "2023-W52",
    "2023-W52-1",

    // Ordinal date format (day of year)
    "2023-359",

    // Time-only formats
    "10:30:00",
    "T10:30:00",
    "10:30:00Z",
    "T10:30:00Z",

    // Basic format without separators
    "20231225T103000Z",
    "20231225T103000+0500",

    // Partial time representations
    "2023-12-25T10:30",
    "2023-12-25T10:30Z",
    "2023-12-25T10",
    "2023-12-25T10Z",

    // Local time without timezone
    "2023-12-25T10:30:00",

    // Comma as decimal separator (valid per ISO 8601)
    "2023-12-25T10:30:00,123Z",

    // Intervals and durations
    "2023-12-25T10:30:00Z/2023-12-26T10:30:00Z",
    "P1Y2M3DT4H5M6S",
    "P1W",

    // Extended year formats
    "+002023-12-25T10:30:00Z",
    "-0001-12-25T10:30:00Z",

    // Wrong separators
    "2023/12/25T10:30:00Z",
    "2023-12-25 10:30:00Z",
    "2023-12-25T10.30.00Z",

    // Invalid timezone formats
    "2023-12-25T10:30:00UTC",
    "2023-12-25T10:30:00+5",
    "2023-12-25T10:30:00+5:00",
    "2023-12-25T10:30:00+05",
    "2023-12-25T10:30:00+",
    "2023-12-25T10:30:00-",

    // Human-readable formats
    "December 25, 2023 10:30:00",
    "25/12/2023 10:30:00",
    "2023-12-25 10:30:00 AM",
    "Mon Dec 25 2023 10:30:00 GMT+0000",

    // Incomplete formats
    "2023-12-25T",
    "T10:30:00Z",

    // Empty string and random strings
    "",
    "hello world",
    "not a date",

    // Wrong number of digits
    "23-12-25T10:30:00Z",
    "202-12-25T10:30:00Z",
    "20233-12-25T10:30:00Z",
    "2023-1-25T10:30:00Z",
    "2023-12-5T10:30:00Z",
    "2023-123-25T10:30:00Z",
    "2023-12-25T1:30:00Z",
    "2023-12-25T10:3:00Z",
    "2023-12-25T10:30:0Z",

    // Invalid months (0 or 13+)
    "2023-13-25T10:30:00Z",
    "2023-00-25T10:30:00Z",

    // Days too high for normalization
    "2023-12-32T10:30:00Z",
    "2023-12-00T10:30:00Z",

    // Hour 25+
    "2023-12-25T25:30:00Z",

    // Minutes 60+
    "2023-12-25T10:60:00Z",
    "2023-12-25T10:61:00Z",

    // Seconds 60+ (no leap second support in JavaScript)
    "2023-12-25T10:30:60Z",
    "2023-12-25T10:30:61Z",
  ])("should reject value '%s'", (value) => {
    const result = iso8601().unstable_validate(value);
    expect(result.value).toBeUndefined();
    expect(result.error).toBeDefined();
  });

  it("should return the original value", () => {
    const value = "2023-12-25T10:30:00Z";
    const result = iso8601().unstable_validate(value);
    expect(result.value).toBe(value);
  });

  it("should include schema", () => {
    const validator = iso8601();
    expect(validator.schema).toEqual({ type: "iso8601" });
  });

  it("should include rules", () => {
    const validator = iso8601();
    expect(validator.rules).toEqual({});
  });

  it("should include schema information in error", () => {
    expect(iso8601().unstable_validate(123).error).toMatchObject({
      context: { schema: { type: "iso8601" } },
    });
  });

  it("should include 'schema' path in error in case of schema violation", () => {
    const input = 123;
    const validator = iso8601();
    const result = validator.unstable_validate(input);
    expect(result.error).toMatchObject({
      type: "schema-violation",
      data: input,
    });
  });
});
