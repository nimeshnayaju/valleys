import { expectTypeOf } from "vitest";
import {
	type AnyValue,
	any,
	array,
	type InferOutputOf,
	object,
	optional,
	or,
	string,
	validate,
} from "../index";

const requiredPayloadValidator = object({ payload: any() });
expectTypeOf<InferOutputOf<typeof requiredPayloadValidator>>().toEqualTypeOf<{
	payload: AnyValue;
}>();

const optionalPayloadValidator = object({ payload: optional(any()) });
expectTypeOf<InferOutputOf<typeof optionalPayloadValidator>>().toEqualTypeOf<{
	payload?: AnyValue;
}>();

const unconstrainedObjectValidator = object();
expectTypeOf<
	InferOutputOf<typeof unconstrainedObjectValidator>
>().toEqualTypeOf<Record<string, AnyValue>>();

const User = object({
	id: string(),
	nickname: optional(string()),
	metadata: optional(any()),
});
type User = InferOutputOf<typeof User>;
type ExpectedUser = {
	id: string;
	nickname?: string;
	metadata?: AnyValue;
};
expectTypeOf<User>().toEqualTypeOf<ExpectedUser>();

// @ts-expect-error optional keys do not allow a present undefined value
const _invalidNickname: User = {
	id: "1",
	nickname: undefined,
};

// @ts-expect-error optional keys do not allow a present undefined value
const _invalidMetadata: User = {
	id: "1",
	metadata: undefined,
};

// @ts-expect-error optional fields are object modifiers, not array validators
array(optional(string()));

// @ts-expect-error optional fields are object modifiers, not union validators
or([string(), optional(any())]);

declare const typeTestInput: unknown;
// @ts-expect-error optional fields are object modifiers, not top-level validators
validate(typeTestInput, optional(string()));
