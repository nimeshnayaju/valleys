import { describe, expect, it } from "vitest";
import { dateTime } from "..";

describe("dateTime", () => {
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

    // Lowercase t and z
    "2023-12-25t10:30:00Z",
    "2023-12-25T10:30:00z",

    // Year 0000 is a leap year
    "0000-02-29T00:00:00Z",

    // Largest offset
    "2023-12-25T10:30:00+23:59",

    // RFC 3339 section 4.3: unknown local offset
    "2023-12-25T10:30:00-00:00"
  ])("should accept ISO 8601 string '%s'", (value) => {
    const result = dateTime().unstable_validate(value);
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

    // Seconds 60+ (RFC 3339 allows a leap second, but Date can't represent one, so dateTime() rejects it)
    "2023-12-25T10:30:60Z",
    "2023-12-25T10:30:61Z",

    // RFC 3339 requires the colon in the offset, as in +00:00
    "2023-12-25T10:30:00+0000",
    "2023-12-25T10:30:00-0500",

    // The day is past the end of its month
    "2023-02-30T10:30:00Z",
    "2023-04-31T10:30:00Z",
    "2023-02-29T10:30:00Z",
    "2023-06-31T00:00:00Z",

    // Hours run 00-23
    "2023-12-25T24:00:00Z",

    // Offset hour 24
    "2023-12-25T10:30:00+24:00",

    // Century year 1900 is not a leap year
    "1900-02-29T00:00:00Z"
  ])("should reject value '%s'", (value) => {
    const result = dateTime().unstable_validate(value);
    expect(result.value).toBeUndefined();
    expect(result.error).toBeDefined();
  });

  describe("JSON Schema Test Suite", () => {
    it.each([
      // a valid date-time string
      "1963-06-19T08:30:06.283185Z",
      // a valid date-time string without second fraction
      "1963-06-19T08:30:06Z",
      // a valid date-time string with plus offset
      "1937-01-01T12:00:27.87+00:20",
      // a valid date-time string with minus offset
      "1990-12-31T15:59:50.123-08:00",
      // case-insensitive T and Z
      "1963-06-19t08:30:06.283185z",
      // a valid date-time with a second fraction of fifteen nines
      "1985-04-12T00:59:59.999999999999999Z",
      // a valid date-time with 28 days in February
      "2021-02-28T00:00:00Z",
      // 2020 is a leap year
      "2020-02-29T00:00:00Z",
      // century year 0400 is a leap year
      "0400-02-29T00:00:00Z"
    ])("should accept '%s'", (value) => {
      const result = dateTime().unstable_validate(value);
      expect(result.value).toBe(value);
      expect(result.error).toBeUndefined();
    });

    it.each([
      // invalid: past leap second
      "1998-12-31T23:59:61Z",
      // invalid: leap second on a wrong minute
      "1998-12-31T23:58:60Z",
      // invalid: leap second on a wrong hour
      "1998-12-31T22:59:60Z",
      // invalid day
      "1990-02-31T15:59:59.123-08:00",
      // invalid offset
      "1990-12-31T15:59:59-24:00",
      // closing Z after offset
      "1963-06-19T08:30:06.28123+01:00Z",
      // invalid hour
      "1990-12-31T24:00:00Z",
      // invalid minute
      "1990-12-31T15:60:00Z",
      // invalid offset minute
      "1990-12-31T10:00:00+10:60",
      // invalid date-time string
      "06/19/1963 08:30:06 PST",
      // only RFC 3339, not all of ISO 8601
      "2013-350T01:01:01",
      // non-padded month
      "1963-6-19T08:30:06.283185Z",
      // non-padded day
      "1963-06-1T08:30:06.283185Z",
      // Bengali digit in the date
      "1963-06-1৪T00:00:00Z",
      // Bengali digit in the time
      "1963-06-11T0৪:00:00Z",
      // extended year
      "+11963-06-19T08:30:06.283185Z",
      // offset without minutes
      "1985-04-12T23:20:50+01",
      // hour 24 with a leap second
      "2016-12-31T24:59:60+01:00",
      // trailing newline
      "1985-04-12T23:20:50Z\n",
      // without seconds
      "1985-04-12T23:20Z",
      // trailing content
      "1985-04-12T23:20:50Ztail",
      // invalid minute with offset
      "1985-04-12T23:60:00+00:01",
      // 30 days in February
      "2020-02-30T00:00:00Z",
      // 2021 is not a leap year
      "2021-02-29T00:00:00Z",
      // century year 0100 is not a leap year
      "0100-02-29T00:00:00Z",
      // century year 2100 is not a leap year
      "2100-02-29T00:00:00Z",
      // fraction with no digits
      "1985-04-12T23:20:50.Z",
      // comma decimal separator
      "1985-04-12T23:20:50,5Z",
      // leading whitespace
      " 1985-04-12T23:20:50Z",
      // trailing whitespace
      "1985-04-12T23:20:50Z "
    ])("should reject '%s'", (value) => {
      const result = dateTime().unstable_validate(value);
      expect(result.value).toBeUndefined();
      expect(result.error).toMatchObject({
        type: "schema-mismatch",
        input: value,
        schema: { type: "dateTime" },
        rules: {}
      });
    });

    // The suite marks these valid, but dateTime() deliberately rejects leap seconds because Date can't represent them
    it.each([
      // a valid date-time with a leap second, UTC
      "1998-12-31T23:59:60Z",
      // a valid date-time with a leap second, with minus offset
      "1998-12-31T15:59:60.123-08:00"
    ])("should reject leap second '%s'", (value) => {
      const result = dateTime().unstable_validate(value);
      expect(result.value).toBeUndefined();
      expect(result.error).toMatchObject({
        type: "schema-mismatch",
        input: value,
        schema: { type: "dateTime" },
        rules: {}
      });
    });
  });

  it("should reject an ISO 8601 date alone", () => {
    const result = dateTime().unstable_validate("2024-02-29");
    expect(result.value).toBeUndefined();
    expect(result.error).toMatchObject({ type: "schema-mismatch", input: "2024-02-29" });
  });

  it("should return the original value", () => {
    const value = "2023-12-25T10:30:00Z";
    const result = dateTime().unstable_validate(value);
    expect(result.value).toBe(value);
  });

  it("should include schema", () => {
    const validator = dateTime();
    expect(validator.schema).toEqual({ type: "dateTime" });
  });

  it("should include rules", () => {
    const validator = dateTime();
    expect(validator.rules).toEqual({});
  });

  it("should include schema information in error", () => {
    expect(dateTime().unstable_validate(123).error).toMatchObject({
      schema: { type: "dateTime" }
    });
  });

  it("should report a schema mismatch", () => {
    const input = 123;
    const validator = dateTime();
    const result = validator.unstable_validate(input);
    expect(result.error).toMatchObject({
      type: "schema-mismatch",
      input: input
    });
  });
});
