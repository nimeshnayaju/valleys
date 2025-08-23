import { describe, expect, it } from "vitest";
import { iso8601, DecoderError } from "../index";

describe("iso8601", () => {
  it("should accept valid ISO 8601 strings", () => {
    const decoder = iso8601();

    // Standard formats with Z timezone
    expect(decoder.unstable_decode("2023-12-25T10:30:00Z")).toBe(
      "2023-12-25T10:30:00Z"
    );
    expect(decoder.unstable_decode("2023-01-01T00:00:00Z")).toBe(
      "2023-01-01T00:00:00Z"
    );
    expect(decoder.unstable_decode("2023-12-31T23:59:59Z")).toBe(
      "2023-12-31T23:59:59Z"
    );

    // With milliseconds
    expect(decoder.unstable_decode("2023-12-25T10:30:00.123Z")).toBe(
      "2023-12-25T10:30:00.123Z"
    );
    expect(decoder.unstable_decode("2023-12-25T10:30:00.1Z")).toBe(
      "2023-12-25T10:30:00.1Z"
    );
    expect(decoder.unstable_decode("2023-12-25T10:30:00.999Z")).toBe(
      "2023-12-25T10:30:00.999Z"
    );

    // With timezone offsets
    expect(decoder.unstable_decode("2023-12-25T10:30:00+00:00")).toBe(
      "2023-12-25T10:30:00+00:00"
    );
    expect(decoder.unstable_decode("2023-12-25T10:30:00-05:00")).toBe(
      "2023-12-25T10:30:00-05:00"
    );
    expect(decoder.unstable_decode("2023-12-25T10:30:00+12:00")).toBe(
      "2023-12-25T10:30:00+12:00"
    );
    expect(decoder.unstable_decode("2023-12-25T10:30:00-12:00")).toBe(
      "2023-12-25T10:30:00-12:00"
    );

    // With timezone offsets without colon
    expect(decoder.unstable_decode("2023-12-25T10:30:00+0000")).toBe(
      "2023-12-25T10:30:00+0000"
    );
    expect(decoder.unstable_decode("2023-12-25T10:30:00-0500")).toBe(
      "2023-12-25T10:30:00-0500"
    );

    // With milliseconds and timezone offsets
    expect(decoder.unstable_decode("2023-12-25T10:30:00.123+05:30")).toBe(
      "2023-12-25T10:30:00.123+05:30"
    );
    expect(decoder.unstable_decode("2023-12-25T10:30:00.999-08:00")).toBe(
      "2023-12-25T10:30:00.999-08:00"
    );

    // Edge cases for valid dates
    expect(decoder.unstable_decode("2020-02-29T00:00:00Z")).toBe(
      "2020-02-29T00:00:00Z"
    ); // Leap year
    expect(decoder.unstable_decode("1970-01-01T00:00:00Z")).toBe(
      "1970-01-01T00:00:00Z"
    ); // Unix epoch
    expect(decoder.unstable_decode("2000-01-01T00:00:00Z")).toBe(
      "2000-01-01T00:00:00Z"
    ); // Y2K
    expect(decoder.unstable_decode("9999-12-31T23:59:59Z")).toBe(
      "9999-12-31T23:59:59Z"
    ); // Far future
  });

  it("should reject non-string values", () => {
    const decoder = iso8601();

    expect(() => decoder.unstable_decode(123)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(true)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(false)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(null)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(undefined)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode({})).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode([])).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(new Date())).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode(new Date().toISOString)).toThrowError(
      DecoderError
    );
    expect(() =>
      decoder.unstable_decode(() => "2023-12-25T10:30:00Z")
    ).toThrowError(DecoderError);
    expect(() =>
      decoder.unstable_decode(Symbol("2023-12-25T10:30:00Z"))
    ).toThrowError(DecoderError);
  });

  it("should reject other valid ISO 8601 formats that are not datetime-with-timezone", () => {
    const decoder = iso8601();

    // The decoder only supports the extended datetime-with-timezone format
    // Here are valid ISO 8601 formats that it does NOT support:

    // Date-only formats
    expect(() => decoder.unstable_decode("2023-12-25")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("2023-12")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("2023")).toThrowError(DecoderError);

    // Week date format
    expect(() => decoder.unstable_decode("2023-W52")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("2023-W52-1")).toThrowError(
      DecoderError
    );

    // Ordinal date format (day of year)
    expect(() => decoder.unstable_decode("2023-359")).toThrowError(
      DecoderError
    );

    // Time-only formats
    expect(() => decoder.unstable_decode("10:30:00")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("T10:30:00")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("10:30:00Z")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("T10:30:00Z")).toThrowError(
      DecoderError
    );

    // Basic format without separators
    expect(() => decoder.unstable_decode("20231225T103000Z")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("20231225T103000+0500")).toThrowError(
      DecoderError
    );

    // Partial time representations
    expect(() => decoder.unstable_decode("2023-12-25T10:30")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("2023-12-25T10:30Z")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("2023-12-25T10")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("2023-12-25T10Z")).toThrowError(
      DecoderError
    );

    // Local time without timezone
    expect(() => decoder.unstable_decode("2023-12-25T10:30:00")).toThrowError(
      DecoderError
    );

    // Comma as decimal separator (valid per ISO 8601)
    expect(() =>
      decoder.unstable_decode("2023-12-25T10:30:00,123Z")
    ).toThrowError(DecoderError);

    // Intervals and durations
    expect(() =>
      decoder.unstable_decode("2023-12-25T10:30:00Z/2023-12-26T10:30:00Z")
    ).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("P1Y2M3DT4H5M6S")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("P1W")).toThrowError(DecoderError);

    // Extended year formats
    expect(() =>
      decoder.unstable_decode("+002023-12-25T10:30:00Z")
    ).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("-0001-12-25T10:30:00Z")).toThrowError(
      DecoderError
    );
  });

  it("should reject invalid date formats", () => {
    const decoder = iso8601();

    // Wrong separators
    expect(() => decoder.unstable_decode("2023/12/25T10:30:00Z")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("2023-12-25 10:30:00Z")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("2023-12-25T10.30.00Z")).toThrowError(
      DecoderError
    );

    // Invalid timezone formats
    expect(() =>
      decoder.unstable_decode("2023-12-25T10:30:00UTC")
    ).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("2023-12-25T10:30:00+5")).toThrowError(
      DecoderError
    );
    expect(() =>
      decoder.unstable_decode("2023-12-25T10:30:00+5:00")
    ).toThrowError(DecoderError);
    expect(() =>
      decoder.unstable_decode("2023-12-25T10:30:00+05")
    ).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("2023-12-25T10:30:00+")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("2023-12-25T10:30:00-")).toThrowError(
      DecoderError
    );

    // Human-readable formats
    expect(() =>
      decoder.unstable_decode("December 25, 2023 10:30:00")
    ).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("25/12/2023 10:30:00")).toThrowError(
      DecoderError
    );
    expect(() =>
      decoder.unstable_decode("2023-12-25 10:30:00 AM")
    ).toThrowError(DecoderError);
    expect(() =>
      decoder.unstable_decode("Mon Dec 25 2023 10:30:00 GMT+0000")
    ).toThrowError(DecoderError);

    // Incomplete formats
    expect(() => decoder.unstable_decode("2023-12-25T")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("T10:30:00Z")).toThrowError(
      DecoderError
    );

    // Empty string and random strings
    expect(() => decoder.unstable_decode("")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("hello world")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("not a date")).toThrowError(
      DecoderError
    );
  });

  it("should handle JavaScript Date constructor quirks", () => {
    const decoder = iso8601();

    // JavaScript's Date constructor has some quirks when parsing dates.
    // The iso8601 decoder relies on Date for validation, so it inherits these behaviors:

    // 1. Some "invalid" dates are normalized rather than rejected:

    // February 30th -> March 2nd (or 1st in non-leap years)
    expect(decoder.unstable_decode("2023-02-30T10:30:00Z")).toBe(
      "2023-02-30T10:30:00Z"
    );

    // April 31st -> May 1st
    expect(decoder.unstable_decode("2023-04-31T10:30:00Z")).toBe(
      "2023-04-31T10:30:00Z"
    );

    // February 29th in non-leap year -> March 1st
    expect(decoder.unstable_decode("2023-02-29T10:30:00Z")).toBe(
      "2023-02-29T10:30:00Z"
    );

    // Hour 24 -> Next day at 00:00
    expect(decoder.unstable_decode("2023-12-25T24:00:00Z")).toBe(
      "2023-12-25T24:00:00Z"
    );

    // 2. These are still properly rejected:

    // Invalid months (0 or 13+)
    expect(() => decoder.unstable_decode("2023-13-25T10:30:00Z")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("2023-00-25T10:30:00Z")).toThrowError(
      DecoderError
    );

    // Days too high for normalization
    expect(() => decoder.unstable_decode("2023-12-32T10:30:00Z")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("2023-12-00T10:30:00Z")).toThrowError(
      DecoderError
    );

    // Hour 25+
    expect(() => decoder.unstable_decode("2023-12-25T25:30:00Z")).toThrowError(
      DecoderError
    );

    // Minutes 60+
    expect(() => decoder.unstable_decode("2023-12-25T10:60:00Z")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("2023-12-25T10:61:00Z")).toThrowError(
      DecoderError
    );

    // Seconds 60+ (no leap second support in JavaScript)
    expect(() => decoder.unstable_decode("2023-12-25T10:30:60Z")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("2023-12-25T10:30:61Z")).toThrowError(
      DecoderError
    );
  });

  it("should reject strings with wrong number of digits", () => {
    const decoder = iso8601();

    // Wrong year digits
    expect(() => decoder.unstable_decode("23-12-25T10:30:00Z")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("202-12-25T10:30:00Z")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("20233-12-25T10:30:00Z")).toThrowError(
      DecoderError
    );

    // Wrong month/day digits
    expect(() => decoder.unstable_decode("2023-1-25T10:30:00Z")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("2023-12-5T10:30:00Z")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("2023-123-25T10:30:00Z")).toThrowError(
      DecoderError
    );

    // Wrong time digits
    expect(() => decoder.unstable_decode("2023-12-25T1:30:00Z")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("2023-12-25T10:3:00Z")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("2023-12-25T10:30:0Z")).toThrowError(
      DecoderError
    );
  });

  it("should handle maximum precision milliseconds", () => {
    const decoder = iso8601();

    // Different millisecond precisions
    expect(decoder.unstable_decode("2023-12-25T10:30:00.1Z")).toBe(
      "2023-12-25T10:30:00.1Z"
    );
    expect(decoder.unstable_decode("2023-12-25T10:30:00.12Z")).toBe(
      "2023-12-25T10:30:00.12Z"
    );
    expect(decoder.unstable_decode("2023-12-25T10:30:00.123Z")).toBe(
      "2023-12-25T10:30:00.123Z"
    );
    expect(decoder.unstable_decode("2023-12-25T10:30:00.1234Z")).toBe(
      "2023-12-25T10:30:00.1234Z"
    );
    expect(decoder.unstable_decode("2023-12-25T10:30:00.12345Z")).toBe(
      "2023-12-25T10:30:00.12345Z"
    );
    expect(decoder.unstable_decode("2023-12-25T10:30:00.123456Z")).toBe(
      "2023-12-25T10:30:00.123456Z"
    );
    expect(decoder.unstable_decode("2023-12-25T10:30:00.1234567Z")).toBe(
      "2023-12-25T10:30:00.1234567Z"
    );
  });

  it("should handle timezone offset edge cases", () => {
    const decoder = iso8601();

    // Maximum valid offsets
    expect(decoder.unstable_decode("2023-12-25T10:30:00+14:00")).toBe(
      "2023-12-25T10:30:00+14:00"
    );
    expect(decoder.unstable_decode("2023-12-25T10:30:00-14:00")).toBe(
      "2023-12-25T10:30:00-14:00"
    );

    // Half-hour offsets
    expect(decoder.unstable_decode("2023-12-25T10:30:00+05:30")).toBe(
      "2023-12-25T10:30:00+05:30"
    );
    expect(decoder.unstable_decode("2023-12-25T10:30:00-03:30")).toBe(
      "2023-12-25T10:30:00-03:30"
    );

    // Quarter-hour offsets
    expect(decoder.unstable_decode("2023-12-25T10:30:00+05:45")).toBe(
      "2023-12-25T10:30:00+05:45"
    );
    expect(decoder.unstable_decode("2023-12-25T10:30:00+08:45")).toBe(
      "2023-12-25T10:30:00+08:45"
    );
  });

  it("should handle dates at boundaries", () => {
    const decoder = iso8601();

    // Start and end of months
    expect(decoder.unstable_decode("2023-01-01T00:00:00Z")).toBe(
      "2023-01-01T00:00:00Z"
    );
    expect(decoder.unstable_decode("2023-01-31T23:59:59Z")).toBe(
      "2023-01-31T23:59:59Z"
    );
    expect(decoder.unstable_decode("2023-12-01T00:00:00Z")).toBe(
      "2023-12-01T00:00:00Z"
    );
    expect(decoder.unstable_decode("2023-12-31T23:59:59Z")).toBe(
      "2023-12-31T23:59:59Z"
    );

    // Leap year boundary
    expect(decoder.unstable_decode("2020-02-29T23:59:59.999Z")).toBe(
      "2020-02-29T23:59:59.999Z"
    );
    expect(decoder.unstable_decode("2024-02-29T00:00:00Z")).toBe(
      "2024-02-29T00:00:00Z"
    );

    // Century boundary
    expect(decoder.unstable_decode("1999-12-31T23:59:59.999Z")).toBe(
      "1999-12-31T23:59:59.999Z"
    );
    expect(decoder.unstable_decode("2000-01-01T00:00:00.000Z")).toBe(
      "2000-01-01T00:00:00.000Z"
    );
  });

  it("should throw DecoderError with full details for non-iso8601 violation", () => {
    const decoder = iso8601();

    try {
      decoder.unstable_decode(123);
      expect.fail();
    } catch (error) {
      expect(error).toBeInstanceOf(DecoderError);
      expect((error as DecoderError).path).toEqual({
        type: "schema",
        data: 123,
      });
      expect((error as DecoderError).schema).toEqual({ type: "iso8601" });
      expect((error as DecoderError).rules).toEqual({});
      expect((error as DecoderError).message).toBe(
        'Validation failed due to schema mismatch; expected schema: {"type":"iso8601"}; received value: 123'
      );
    }
  });

  it("should include schema", () => {
    const decoder = iso8601();
    expect(decoder.schema).toEqual({ type: "iso8601" });
  });

  it("should have empty rules", () => {
    const decoder = iso8601();
    expect(decoder.rules).toEqual({});
  });
});
