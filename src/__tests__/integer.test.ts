import { describe, expect, it } from "vitest";
import { integer } from "../index";

describe("integer", () => {
	it.each([
		0,
		-0,
		1,
		-1,
		42,
		1.0,
		Number.MAX_SAFE_INTEGER,
		Number.MIN_SAFE_INTEGER,
	])("should accept integer %s", (value) => {
		const result = integer().unstable_validate(value);
		expect(result.value).toBe(value);
		expect(result.error).toBeUndefined();
	});

	it.each([
		3.14,
		-2.71,
		Number.EPSILON,
		1e-10,
		Infinity,
		-Infinity,
		NaN,
		"42",
		true,
		null,
		undefined,
		{},
		[],
		42n,
	])("should reject non-integer value %s", (value) => {
		const result = integer().unstable_validate(value);
		expect(result.value).toBeUndefined();
		expect(result.error).toBeDefined();
	});

	it("should expose a JSON Schema-aligned schema", () => {
		expect(integer().schema).toEqual({ type: "integer" });
	});

	it.each([
		{},
		{ min: 5 },
		{ max: 10 },
		{ min: 5, max: 10 },
	])("should include rules %s", (rules) => {
		expect(integer(rules).rules).toEqual(rules);
	});

	it("should include schema information in a schema violation", () => {
		const input = 1.5;
		expect(integer().unstable_validate(input).error).toMatchObject({
			type: "schema-violation",
			data: input,
			context: {
				schema: { type: "integer" },
				rules: {},
			},
		});
	});

	describe("rules", () => {
		it.each([
			{ input: 10, rules: { min: 10 } },
			{ input: 11, rules: { min: 10 } },
			{ input: -5, rules: { min: -10 } },
			{ input: 4, rules: { min: 3.14 } },
		])("should accept $input meeting minimum $rules.min", ({
			input,
			rules,
		}) => {
			expect(integer(rules).unstable_validate(input)).toEqual({ value: input });
		});

		it.each([
			{ input: 9, rules: { min: 10 } },
			{ input: -11, rules: { min: -10 } },
			{ input: 3, rules: { min: 3.14 } },
		])("should reject $input below minimum $rules.min", ({ input, rules }) => {
			expect(integer(rules).unstable_validate(input).error).toMatchObject({
				type: "rule-violation",
				rule: "min",
				data: input,
				context: { rules },
			});
		});

		it.each([
			{ input: 10, rules: { max: 10 } },
			{ input: 9, rules: { max: 10 } },
			{ input: -10, rules: { max: -10 } },
			{ input: 3, rules: { max: 3.14 } },
		])("should accept $input meeting maximum $rules.max", ({
			input,
			rules,
		}) => {
			expect(integer(rules).unstable_validate(input)).toEqual({ value: input });
		});

		it.each([
			{ input: 11, rules: { max: 10 } },
			{ input: -9, rules: { max: -10 } },
			{ input: 4, rules: { max: 3.14 } },
		])("should reject $input above maximum $rules.max", ({ input, rules }) => {
			expect(integer(rules).unstable_validate(input).error).toMatchObject({
				type: "rule-violation",
				rule: "max",
				data: input,
				context: { rules },
			});
		});

		it.each([
			{ input: 10, rules: { min: 10, max: 20 } },
			{ input: 15, rules: { min: 10, max: 20 } },
			{ input: 20, rules: { min: 10, max: 20 } },
		])("should accept $input within the range", ({ input, rules }) => {
			expect(integer(rules).unstable_validate(input)).toEqual({ value: input });
		});

		it.each([
			{ input: 9, rule: "min", rules: { min: 10, max: 20 } },
			{ input: 21, rule: "max", rules: { min: 10, max: 20 } },
		])("should reject $input outside the range", ({ input, rule, rules }) => {
			expect(integer(rules).unstable_validate(input).error).toMatchObject({
				type: "rule-violation",
				rule,
				data: input,
				context: { rules },
			});
		});
	});
});
