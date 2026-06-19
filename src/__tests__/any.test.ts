import { describe, expect, it } from "vitest";
import { any } from "../index";

describe("any", () => {
	it.each([
		null,
		"x",
		0,
		false,
		{},
		[],
	])("should accept value '%s'", (value) => {
		const result = any().unstable_validate(value);
		expect(result.value).toBe(value);
		expect(result.error).toBeUndefined();
	});

	it("should reject undefined", () => {
		const result = any().unstable_validate(undefined);
		expect(result.value).toBeUndefined();
		expect(result.error).toMatchObject({
			type: "schema-violation",
			data: undefined,
			context: { schema: { type: "any" }, rules: {} },
		});
	});

	it("should include schema and rules", () => {
		const validator = any();
		expect(validator.schema).toEqual({ type: "any" });
		expect(validator.rules).toEqual({});
	});
});
