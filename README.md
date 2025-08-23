Lightweight, zero-dependency library for validating arbitrary runtime data in TypeScript. `decode-kit` provides assertion-based validation that refines your types in-place — no cloning, no transformations, and minimal runtime overhead.

### Installation

```bash
npm install decode-kit
```

## Quick Start

`decode-kit` validates your data and narrows its type in-place. Your original values remain unchanged - only their TypeScript types are refined. The `validate` function runs a runtime check and, on success, asserts the original variable's type. On failure, it throws a
`DecoderError`.

```ts
import { object, string, number, validate } from "decode-kit";

// Example of untrusted data (e.g., from an API)
const input: unknown = { id: 123, name: "Alice" };

// Validate the data (throws if validation fails)
validate(input, object({ id: number(), name: string() }));

// `input` is now typed as { id: number; name: string }
console.log(input.id, input.name);
```

Libraries like [Zod](https://zod.dev/), [Valibot](https://valibot.dev/), [Decoders](https://decoders.cc/), etc typically return a new (often transformed) value from `.parse()`. `decode-kit` instead asserts types directly - this provides several performance benefits as no time is spent copying arrays, strings or nested objects. This makes `decode-kit` ideal for performance-critical applications where memory efficiency and speed matter.

### Error handling

`decode-kit` uses a fail-fast approach - validation stops and throws an error immediately when the first validation failure is encountered. This provides better performance and clearer error messages by focusing on the first issue found. The `validate` function throws a `DecoderError` if validation fails. This error object includes the path to the exact location of the validation failure (e.g., nested objects/arrays), the expected schema and ruleset that the value failed to match. Additionally, the error includes a pre-formatted human-readable error message.

Example error message:

```
Validation failed at user.age due to schema mismatch; expected schema: {"type":"number"}
```

For more control over error messages, you can catch `DecoderError` and traverse its `path` property to build custom messages.

### API Reference

#### `string()`

Validates that a value is a string. Optionally accepts rules for validation.

```ts
import { string, validate } from "decode-kit";

// Basic usage
validate(input, string());
// input is typed as string

// With rules
validate(
  input,
  string({ minLength: 3, maxLength: 50, pattern: /^[a-zA-Z]+$/ })
);
```

**Rules:**

- `minLength?: number` - Minimum string length
- `maxLength?: number` - Maximum string length
- `pattern?: RegExp` - Regular expression the string must match

#### `number()`

Validates that a value is a finite number.

```ts
import { number, validate } from "decode-kit";

// Basic usage
validate(input, number());
// input is typed as number

// With rules
validate(input, number({ min: 0, max: 100 }));
```

**Rules:**

- `min?: number` - Minimum value (inclusive)
- `max?: number` - Maximum value (inclusive)

#### `boolean()`

Validates that a value is a boolean.

```ts
import { boolean, validate } from "decode-kit";

validate(input, boolean());
// input is typed as boolean
```

#### `constant()`

Validates that a value is exactly equal to a specific literal value.

```ts
import { constant, validate } from "decode-kit";

// String literals
validate(input, constant("hello"));
// input is typed as "hello"

// Number literals
validate(input, constant(42));
// input is typed as 42

// Boolean literals
validate(input, constant(true));
// input is typed as true
```

#### `null_()`

Validates that a value is `null`.

```ts
import { null_, validate } from "decode-kit";

validate(input, null_());
// input is typed as null
```

#### `undefined_()`

Validates that a value is `undefined`.

```ts
import { undefined_, validate } from "decode-kit";

validate(input, undefined_());
// input is typed as undefined
```

#### `iso8601()`

Validates that a value is a valid ISO 8601 datetime string with timezone.

```ts
import { iso8601, validate } from "decode-kit";

validate(input, iso8601());
// input is typed as Iso8601 (a branded string type)

// Valid examples:
// "2024-01-15T10:30:00Z"
// "2024-01-15T10:30:00+01:00"
// "2024-01-15T10:30:00.123Z"
```

#### `array()`

Validates arrays with optional item validation and rules.

```ts
import { array, string, number, validate } from "decode-kit";

// Array of any values
validate(input, array());
// input is typed as unknown[]

// Array with minimum length
validate(input, array({ minLength: 1 }));

// Array of specific type
validate(input, array(string()));
// input is typed as string[]

// Array of specific type with rules
validate(input, array(number(), { minLength: 3 }));
// input is typed as number[] with at least 3 items
```

**Rules:**

- `minLength?: number` - Minimum array length

#### `object()`

Validates objects with optional property validation.

```ts
import { object, string, number, boolean, validate } from "decode-kit";

// Any object
validate(input, object());
// input is typed as Record<string, unknown>

// Object with specific shape
validate(input, object({ id: number(), name: string(), active: boolean() }));
// input is typed as { id: number; name: string; active: boolean }

// Nested objects
validate(
  input,
  object({
    user: object({
      id: number(),
      profile: object({ name: string(), age: number() }),
    }),
  })
);
```

#### `or()`

Creates a union type decoder that accepts any of the provided decoders.

```ts
import { or, string, number, null_, validate } from "decode-kit";

// String or number
validate(input, or([string(), number()]));
// input is typed as string | number

// Nullable string (string or null)
validate(input, or([string(), null_()]));
// input is typed as string | null

// Multiple types
validate(
  input,
  or([constant("pending"), constant("active"), constant("completed")])
);
// input is typed as "pending" | "active" | "completed"
```

### Exported types

#### `InferOutputOf<D>`

A type utility that extracts the output type from a decoder. Useful when you need to reference the type that a decoder validates.

```ts
import { object, string, number, InferOutputOf } from "decode-kit";

const userDecoder = object({ id: number(), name: string() });
type User = InferOutputOf<typeof userDecoder>;
// User is { id: number; name: string }
```

#### `Iso8601`

A branded string type for ISO 8601 date strings that can only be obtained after validating using the `iso8601` decoder.

```ts
import { Iso8601 } from "decode-kit";

function formatDate(date: Iso8601): string {
  return new Date(date).toLocaleDateString();
}
```

### Acknowledgements

The API is inspired by [Decoders](https://decoders.cc/), which is also my go-to validation library. There is an in-progress [pull request](https://github.com/nvie/decoders/pull/1256) to support readonly decoders, which should bring similar benefits to the library.
