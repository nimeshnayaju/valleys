import { describe, expect, it } from "vitest";
import { iso8601, ValidationError } from "../index";

describe("iso8601", () => {
  it("should accept valid ISO 8601 strings", () => {
    const validator = iso8601();

    // Standard formats with Z timezone
    expect(validator.unstable_validate("2023-12-25T10:30:00Z")).toBe(
      "2023-12-25T10:30:00Z"
    );
    expect(validator.unstable_validate("2023-01-01T00:00:00Z")).toBe(
      "2023-01-01T00:00:00Z"
    );
    expect(validator.unstable_validate("2023-12-31T23:59:59Z")).toBe(
      "2023-12-31T23:59:59Z"
    );

    // With milliseconds
    expect(validator.unstable_validate("2023-12-25T10:30:00.123Z")).toBe(
      "2023-12-25T10:30:00.123Z"
    );
    expect(validator.unstable_validate("2023-12-25T10:30:00.1Z")).toBe(
      "2023-12-25T10:30:00.1Z"
    );
    expect(validator.unstable_validate("2023-12-25T10:30:00.999Z")).toBe(
      "2023-12-25T10:30:00.999Z"
    );

    // With timezone offsets
    expect(validator.unstable_validate("2023-12-25T10:30:00+00:00")).toBe(
      "2023-12-25T10:30:00+00:00"
    );
    expect(validator.unstable_validate("2023-12-25T10:30:00-05:00")).toBe(
      "2023-12-25T10:30:00-05:00"
    );
    expect(validator.unstable_validate("2023-12-25T10:30:00+12:00")).toBe(
      "2023-12-25T10:30:00+12:00"
    );
    expect(validator.unstable_validate("2023-12-25T10:30:00-12:00")).toBe(
      "2023-12-25T10:30:00-12:00"
    );

    // With timezone offsets without colon
    expect(validator.unstable_validate("2023-12-25T10:30:00+0000")).toBe(
      "2023-12-25T10:30:00+0000"
    );
    expect(validator.unstable_validate("2023-12-25T10:30:00-0500")).toBe(
      "2023-12-25T10:30:00-0500"
    );

    // With milliseconds and timezone offsets
    expect(validator.unstable_validate("2023-12-25T10:30:00.123+05:30")).toBe(
      "2023-12-25T10:30:00.123+05:30"
    );
    expect(validator.unstable_validate("2023-12-25T10:30:00.999-08:00")).toBe(
      "2023-12-25T10:30:00.999-08:00"
    );

    // Edge cases for valid dates
    expect(validator.unstable_validate("2020-02-29T00:00:00Z")).toBe(
      "2020-02-29T00:00:00Z"
    ); // Leap year
    expect(validator.unstable_validate("1970-01-01T00:00:00Z")).toBe(
      "1970-01-01T00:00:00Z"
    ); // Unix epoch
    expect(validator.unstable_validate("2000-01-01T00:00:00Z")).toBe(
      "2000-01-01T00:00:00Z"
    ); // Y2K
    expect(validator.unstable_validate("9999-12-31T23:59:59Z")).toBe(
      "9999-12-31T23:59:59Z"
    ); // Far future
  });

  it("should reject non-string values", () => {
    const validator = iso8601();

    expect(() => validator.unstable_validate(123)).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(true)).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(false)).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(null)).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(undefined)).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate({})).toThrowError(ValidationError);
    expect(() => validator.unstable_validate([])).toThrowError(ValidationError);
    expect(() => validator.unstable_validate(new Date())).toThrowError(
      ValidationError
    );
    expect(() =>
      validator.unstable_validate(new Date().toISOString)
    ).toThrowError(ValidationError);
    expect(() =>
      validator.unstable_validate(() => "2023-12-25T10:30:00Z")
    ).toThrowError(ValidationError);
    expect(() =>
      validator.unstable_validate(Symbol("2023-12-25T10:30:00Z"))
    ).toThrowError(ValidationError);
  });

  it("should reject other valid ISO 8601 formats that are not datetime-with-timezone", () => {
    const validator = iso8601();

    // The validator only supports the extended datetime-with-timezone format
    // Here are valid ISO 8601 formats that it does NOT support:

    // Date-only formats
    expect(() => validator.unstable_validate("2023-12-25")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("2023-12")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("2023")).toThrowError(
      ValidationError
    );

    // Week date format
    expect(() => validator.unstable_validate("2023-W52")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("2023-W52-1")).toThrowError(
      ValidationError
    );

    // Ordinal date format (day of year)
    expect(() => validator.unstable_validate("2023-359")).toThrowError(
      ValidationError
    );

    // Time-only formats
    expect(() => validator.unstable_validate("10:30:00")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("T10:30:00")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("10:30:00Z")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("T10:30:00Z")).toThrowError(
      ValidationError
    );

    // Basic format without separators
    expect(() => validator.unstable_validate("20231225T103000Z")).toThrowError(
      ValidationError
    );
    expect(() =>
      validator.unstable_validate("20231225T103000+0500")
    ).toThrowError(ValidationError);

    // Partial time representations
    expect(() => validator.unstable_validate("2023-12-25T10:30")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("2023-12-25T10:30Z")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("2023-12-25T10")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("2023-12-25T10Z")).toThrowError(
      ValidationError
    );

    // Local time without timezone
    expect(() =>
      validator.unstable_validate("2023-12-25T10:30:00")
    ).toThrowError(ValidationError);

    // Comma as decimal separator (valid per ISO 8601)
    expect(() =>
      validator.unstable_validate("2023-12-25T10:30:00,123Z")
    ).toThrowError(ValidationError);

    // Intervals and durations
    expect(() =>
      validator.unstable_validate("2023-12-25T10:30:00Z/2023-12-26T10:30:00Z")
    ).toThrowError(ValidationError);
    expect(() => validator.unstable_validate("P1Y2M3DT4H5M6S")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("P1W")).toThrowError(
      ValidationError
    );

    // Extended year formats
    expect(() =>
      validator.unstable_validate("+002023-12-25T10:30:00Z")
    ).toThrowError(ValidationError);
    expect(() =>
      validator.unstable_validate("-0001-12-25T10:30:00Z")
    ).toThrowError(ValidationError);
  });

  it("should reject invalid date formats", () => {
    const validator = iso8601();

    // Wrong separators
    expect(() =>
      validator.unstable_validate("2023/12/25T10:30:00Z")
    ).toThrowError(ValidationError);
    expect(() =>
      validator.unstable_validate("2023-12-25 10:30:00Z")
    ).toThrowError(ValidationError);
    expect(() =>
      validator.unstable_validate("2023-12-25T10.30.00Z")
    ).toThrowError(ValidationError);

    // Invalid timezone formats
    expect(() =>
      validator.unstable_validate("2023-12-25T10:30:00UTC")
    ).toThrowError(ValidationError);
    expect(() =>
      validator.unstable_validate("2023-12-25T10:30:00+5")
    ).toThrowError(ValidationError);
    expect(() =>
      validator.unstable_validate("2023-12-25T10:30:00+5:00")
    ).toThrowError(ValidationError);
    expect(() =>
      validator.unstable_validate("2023-12-25T10:30:00+05")
    ).toThrowError(ValidationError);
    expect(() =>
      validator.unstable_validate("2023-12-25T10:30:00+")
    ).toThrowError(ValidationError);
    expect(() =>
      validator.unstable_validate("2023-12-25T10:30:00-")
    ).toThrowError(ValidationError);

    // Human-readable formats
    expect(() =>
      validator.unstable_validate("December 25, 2023 10:30:00")
    ).toThrowError(ValidationError);
    expect(() =>
      validator.unstable_validate("25/12/2023 10:30:00")
    ).toThrowError(ValidationError);
    expect(() =>
      validator.unstable_validate("2023-12-25 10:30:00 AM")
    ).toThrowError(ValidationError);
    expect(() =>
      validator.unstable_validate("Mon Dec 25 2023 10:30:00 GMT+0000")
    ).toThrowError(ValidationError);

    // Incomplete formats
    expect(() => validator.unstable_validate("2023-12-25T")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("T10:30:00Z")).toThrowError(
      ValidationError
    );

    // Empty string and random strings
    expect(() => validator.unstable_validate("")).toThrowError(ValidationError);
    expect(() => validator.unstable_validate("hello world")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("not a date")).toThrowError(
      ValidationError
    );
  });

  it("should handle JavaScript Date constructor quirks", () => {
    const validator = iso8601();

    // JavaScript's Date constructor has some quirks when parsing dates.
    // The iso8601 validator relies on Date for validation, so it inherits these behaviors:

    // 1. Some "invalid" dates are normalized rather than rejected:

    // February 30th -> March 2nd (or 1st in non-leap years)
    expect(validator.unstable_validate("2023-02-30T10:30:00Z")).toBe(
      "2023-02-30T10:30:00Z"
    );

    // April 31st -> May 1st
    expect(validator.unstable_validate("2023-04-31T10:30:00Z")).toBe(
      "2023-04-31T10:30:00Z"
    );

    // February 29th in non-leap year -> March 1st
    expect(validator.unstable_validate("2023-02-29T10:30:00Z")).toBe(
      "2023-02-29T10:30:00Z"
    );

    // Hour 24 -> Next day at 00:00
    expect(validator.unstable_validate("2023-12-25T24:00:00Z")).toBe(
      "2023-12-25T24:00:00Z"
    );

    // 2. These are still properly rejected:

    // Invalid months (0 or 13+)
    expect(() =>
      validator.unstable_validate("2023-13-25T10:30:00Z")
    ).toThrowError(ValidationError);
    expect(() =>
      validator.unstable_validate("2023-00-25T10:30:00Z")
    ).toThrowError(ValidationError);

    // Days too high for normalization
    expect(() =>
      validator.unstable_validate("2023-12-32T10:30:00Z")
    ).toThrowError(ValidationError);
    expect(() =>
      validator.unstable_validate("2023-12-00T10:30:00Z")
    ).toThrowError(ValidationError);

    // Hour 25+
    expect(() =>
      validator.unstable_validate("2023-12-25T25:30:00Z")
    ).toThrowError(ValidationError);

    // Minutes 60+
    expect(() =>
      validator.unstable_validate("2023-12-25T10:60:00Z")
    ).toThrowError(ValidationError);
    expect(() =>
      validator.unstable_validate("2023-12-25T10:61:00Z")
    ).toThrowError(ValidationError);

    // Seconds 60+ (no leap second support in JavaScript)
    expect(() =>
      validator.unstable_validate("2023-12-25T10:30:60Z")
    ).toThrowError(ValidationError);
    expect(() =>
      validator.unstable_validate("2023-12-25T10:30:61Z")
    ).toThrowError(ValidationError);
  });

  it("should reject strings with wrong number of digits", () => {
    const validator = iso8601();

    // Wrong year digits
    expect(() =>
      validator.unstable_validate("23-12-25T10:30:00Z")
    ).toThrowError(ValidationError);
    expect(() =>
      validator.unstable_validate("202-12-25T10:30:00Z")
    ).toThrowError(ValidationError);
    expect(() =>
      validator.unstable_validate("20233-12-25T10:30:00Z")
    ).toThrowError(ValidationError);

    // Wrong month/day digits
    expect(() =>
      validator.unstable_validate("2023-1-25T10:30:00Z")
    ).toThrowError(ValidationError);
    expect(() =>
      validator.unstable_validate("2023-12-5T10:30:00Z")
    ).toThrowError(ValidationError);
    expect(() =>
      validator.unstable_validate("2023-123-25T10:30:00Z")
    ).toThrowError(ValidationError);

    // Wrong time digits
    expect(() =>
      validator.unstable_validate("2023-12-25T1:30:00Z")
    ).toThrowError(ValidationError);
    expect(() =>
      validator.unstable_validate("2023-12-25T10:3:00Z")
    ).toThrowError(ValidationError);
    expect(() =>
      validator.unstable_validate("2023-12-25T10:30:0Z")
    ).toThrowError(ValidationError);
  });

  it("should handle maximum precision milliseconds", () => {
    const validator = iso8601();

    // Different millisecond precisions
    expect(validator.unstable_validate("2023-12-25T10:30:00.1Z")).toBe(
      "2023-12-25T10:30:00.1Z"
    );
    expect(validator.unstable_validate("2023-12-25T10:30:00.12Z")).toBe(
      "2023-12-25T10:30:00.12Z"
    );
    expect(validator.unstable_validate("2023-12-25T10:30:00.123Z")).toBe(
      "2023-12-25T10:30:00.123Z"
    );
    expect(validator.unstable_validate("2023-12-25T10:30:00.1234Z")).toBe(
      "2023-12-25T10:30:00.1234Z"
    );
    expect(validator.unstable_validate("2023-12-25T10:30:00.12345Z")).toBe(
      "2023-12-25T10:30:00.12345Z"
    );
    expect(validator.unstable_validate("2023-12-25T10:30:00.123456Z")).toBe(
      "2023-12-25T10:30:00.123456Z"
    );
    expect(validator.unstable_validate("2023-12-25T10:30:00.1234567Z")).toBe(
      "2023-12-25T10:30:00.1234567Z"
    );
  });

  it("should handle timezone offset edge cases", () => {
    const validator = iso8601();

    // Maximum valid offsets
    expect(validator.unstable_validate("2023-12-25T10:30:00+14:00")).toBe(
      "2023-12-25T10:30:00+14:00"
    );
    expect(validator.unstable_validate("2023-12-25T10:30:00-14:00")).toBe(
      "2023-12-25T10:30:00-14:00"
    );

    // Half-hour offsets
    expect(validator.unstable_validate("2023-12-25T10:30:00+05:30")).toBe(
      "2023-12-25T10:30:00+05:30"
    );
    expect(validator.unstable_validate("2023-12-25T10:30:00-03:30")).toBe(
      "2023-12-25T10:30:00-03:30"
    );

    // Quarter-hour offsets
    expect(validator.unstable_validate("2023-12-25T10:30:00+05:45")).toBe(
      "2023-12-25T10:30:00+05:45"
    );
    expect(validator.unstable_validate("2023-12-25T10:30:00+08:45")).toBe(
      "2023-12-25T10:30:00+08:45"
    );
  });

  it("should handle dates at boundaries", () => {
    const validator = iso8601();

    // Start and end of months
    expect(validator.unstable_validate("2023-01-01T00:00:00Z")).toBe(
      "2023-01-01T00:00:00Z"
    );
    expect(validator.unstable_validate("2023-01-31T23:59:59Z")).toBe(
      "2023-01-31T23:59:59Z"
    );
    expect(validator.unstable_validate("2023-12-01T00:00:00Z")).toBe(
      "2023-12-01T00:00:00Z"
    );
    expect(validator.unstable_validate("2023-12-31T23:59:59Z")).toBe(
      "2023-12-31T23:59:59Z"
    );

    // Leap year boundary
    expect(validator.unstable_validate("2020-02-29T23:59:59.999Z")).toBe(
      "2020-02-29T23:59:59.999Z"
    );
    expect(validator.unstable_validate("2024-02-29T00:00:00Z")).toBe(
      "2024-02-29T00:00:00Z"
    );

    // Century boundary
    expect(validator.unstable_validate("1999-12-31T23:59:59.999Z")).toBe(
      "1999-12-31T23:59:59.999Z"
    );
    expect(validator.unstable_validate("2000-01-01T00:00:00.000Z")).toBe(
      "2000-01-01T00:00:00.000Z"
    );
  });

  it("should throw ValidationError with full details for non-iso8601 violation", () => {
    const validator = iso8601();

    try {
      validator.unstable_validate(123);
      expect.fail();
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).path).toEqual({
        type: "schema",
        data: 123,
      });
      expect((error as ValidationError).schema).toEqual({ type: "iso8601" });
      expect((error as ValidationError).rules).toEqual({});
      expect((error as ValidationError).message).toBe(
        'Validation failed due to schema mismatch; expected schema: {"type":"iso8601"}; received value: 123'
      );
    }
  });

  it("should include schema", () => {
    const validator = iso8601();
    expect(validator.schema).toEqual({ type: "iso8601" });
  });

  it("should have empty rules", () => {
    const validator = iso8601();
    expect(validator.rules).toEqual({});
  });
});
