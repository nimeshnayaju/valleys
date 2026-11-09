import { expectTypeOf } from "vitest";
import {
  type AnyValue,
  any,
  array,
  constant,
  type DateTimeString,
  dateTime,
  type InferOutputOf,
  integer,
  number,
  object,
  optional,
  or,
  record,
  string,
  ValidationError,
  validate
} from "..";

const integerValidator = integer();
expectTypeOf<InferOutputOf<typeof integerValidator>>().toEqualTypeOf<number>();

const requiredPayloadValidator = object({ payload: any() });
expectTypeOf<InferOutputOf<typeof requiredPayloadValidator>>().toEqualTypeOf<{
  payload: AnyValue;
}>();

const optionalPayloadValidator = object({ payload: optional(any()) });
expectTypeOf<InferOutputOf<typeof optionalPayloadValidator>>().toEqualTypeOf<{
  payload?: AnyValue;
}>();

const unconstrainedObjectValidator = object();
expectTypeOf<InferOutputOf<typeof unconstrainedObjectValidator>>().toEqualTypeOf<Record<string, AnyValue>>();

const stringRecordValidator = record(string());
expectTypeOf<InferOutputOf<typeof stringRecordValidator>>().toEqualTypeOf<Record<string, string>>();

const anyRecordValidator = record(any());
expectTypeOf<InferOutputOf<typeof anyRecordValidator>>().toEqualTypeOf<Record<string, AnyValue>>();

const validatorNamedFields = object({
  unstable_validate: string(),
  schema: string(),
  rules: string()
});
expectTypeOf<InferOutputOf<typeof validatorNamedFields>>().toEqualTypeOf<{
  unstable_validate: string;
  schema: string;
  rules: string;
}>();

const User = object({
  id: string(),
  nickname: optional(string()),
  metadata: optional(any())
});
type User = InferOutputOf<typeof User>;
type ExpectedUser = {
  id: string;
  nickname?: string;
  metadata?: AnyValue;
};
expectTypeOf<User>().toEqualTypeOf<ExpectedUser>();

// Optional keys do not allow a present undefined value
expectTypeOf<{ id: string; nickname: undefined }>().not.toExtend<User>();
expectTypeOf<{ id: string; metadata: undefined }>().not.toExtend<User>();

// @ts-expect-error optional fields are object modifiers, not array validators
array(optional(string()));

// @ts-expect-error optional fields are object modifiers, not union validators
or([string(), optional(any())]);

declare const typeTestInput: unknown;
// @ts-expect-error optional fields are object modifiers, not top-level validators
validate(typeTestInput, optional(string()));

// @ts-expect-error symbols aren't wire data
constant(Symbol("x"));

expectTypeOf(constant(1).schema).toEqualTypeOf<{ type: "constant"; value: 1 }>();

const taggedUnionValidator = or([
  object({ type: constant("send"), content: array(string()) }),
  object({ type: constant("stop"), id: string() })
]);
type TaggedUnionOutput = InferOutputOf<typeof taggedUnionValidator>;
expectTypeOf<TaggedUnionOutput>().toEqualTypeOf<{ type: "send"; content: string[] } | { type: "stop"; id: string }>();
expectTypeOf<Extract<TaggedUnionOutput, { type: "stop" }>>().toEqualTypeOf<{ type: "stop"; id: string }>();

declare const validationError: ValidationError;
expectTypeOf(validationError.cause.path).toEqualTypeOf<Array<string | number>>();
expectTypeOf(validationError.cause.type).toEqualTypeOf<"schema-mismatch" | "rule-violation">();

expectTypeOf(record(string()).schema).toEqualTypeOf<{ type: "record"; values: { type: "string" } }>();
expectTypeOf(record(string()).rules).toEqualTypeOf<{}>();
expectTypeOf(string().rules).toEqualTypeOf<{ minLength?: number; maxLength?: number }>();
expectTypeOf(number().rules).toEqualTypeOf<{ min?: number; max?: number }>();
expectTypeOf(or([string(), number()]).schema).toEqualTypeOf<{
  type: "or";
  options: ({ type: "string" } | { type: "number" })[];
}>();
expectTypeOf(dateTime().schema).toEqualTypeOf<{ type: "dateTime" }>();
expectTypeOf<InferOutputOf<ReturnType<typeof dateTime>>>().toEqualTypeOf<DateTimeString>();

// @ts-expect-error a record takes a validator, not a field map
record({ name: string() });
