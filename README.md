Lightweight, zero-dependency library for validating arbitrary runtime data in TypeScript. `valleys` provides assertion-based validation that refines your types in-place — no cloning, no transformations, and minimal runtime overhead.

## Table of Contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [Benchmarks](#benchmarks)
- [Error handling](#error-handling)
- [API Reference](#api-reference)
  - [`string()`](#string)
  - [`number()`](#number)
  - [`boolean()`](#boolean)
  - [`constant()`](#constant)
  - [`null_()`](#null_)
  - [`undefined_()`](#undefined_)
  - [`iso8601()`](#iso8601)
  - [`array()`](#array)
  - [`object()`](#object)
  - [`or()`](#or)
- [Exported types](#exported-types)
  - [`InferOutputOf<D>`](#inferoutputofd)
  - [`Iso8601`](#iso8601-1)
- [Acknowledgements](#acknowledgements)

### Installation

```bash
npm install valleys
```

### Quick start

`valleys` validates your data and narrows its type in-place. Your original values remain unchanged - only their TypeScript types are refined. The `validate` function runs a runtime check and, on success, asserts the original variable's type. On failure, it throws a `ValidationError`.

```ts
import { object, string, number, validate } from "valleys";

// Example of untrusted data (e.g., from an API)
const input: unknown = { id: 123, name: "Alice" };

// Validate the data (throws if validation fails)
validate(input, object({ id: number(), name: string() }));

// `input` is now typed as { id: number; name: string }
console.log(input.id, input.name);
```

Libraries like [Zod](https://zod.dev/), [Valibot](https://valibot.dev/), [Decoders](https://decoders.cc/), etc typically return a new (often transformed) value from `.parse()`. `valleys` instead asserts types directly - this provides several performance benefits as no time is spent copying arrays, strings or nested objects. This makes `valleys` ideal for performance-critical applications where memory efficiency and speed matter.

### Benchmarks

- **[`valleys` vs `zod`](https://github.com/nimeshnayaju/zod?tab=readme-ov-file#benchmarks)** - Compares Valleys with Zod 4 and Zod 3 using the official benchmarks used by Zod to compare Zod 4 against Zod 3.

- **[`valleys` vs `zod` vs `valibot`](https://github.com/nimeshnayaju/valibot-benchmarks?tab=readme-ov-file#relative-performance-valleys-vs-others)** - Compares Valleys against Zod 4 and Valibot across different environments (Node.js, Bun, Deno) - forked from benchmarks maintained by [@naruaway](https://github.com/naruaway).

These early benchmarks suggest that `valleys` consistently outperforms other validation libraries like Zod and Valibot across all scenarios. For basic validation like strings and numbers, `valleys` is about 1.5-2x faster than Zod 4. However, the real performance gains become apparent when you add validation rules - `valleys` becomes dramatically faster, often 20-30x faster than alternatives when checking things like string length limits, number ranges, or array sizes.

### Error handling

When validation fails, `valleys` takes an equally thoughtful approach. Rather than being prescriptive about error formatting, it exposes a structured error system with an AST-like path that precisely indicates where validation failed. It does include a sensible default error message for debugging, but you can also traverse the error path to build whatever error handling approach fits your application - from simple logging to sophisticated user-facing messages.

The `validate` function throws a `ValidationError` if validation fails; you can catch this error and traverse its `path` property, then inspect the `schema` and `rules` properties to get more information about the error or to build custom error messages.

**Example error message:**

```
Validation failed at user.age due to schema mismatch; expected schema: {"type":"number"}; received value: "ten"
```

> [!NOTE]  
> `valleys` follows a fail-fast approach, immediately throwing when validation fails, which provides better performance and clearer error messages by focusing on the first issue encountered.

### API Reference

#### `string()`

Validates that a value is a string. Optionally accepts rules for validation.

```ts
import { string, validate } from "valleys";

// Basic usage
validate(input, string());
// input is typed as string

// With rules
validate(input, string({ minLength: 3, maxLength: 50 }));
```

**Rules:**

- `minLength?: number` - Minimum string length
- `maxLength?: number` - Maximum string length

#### `number()`

Validates that a value is a finite number.

```ts
import { number, validate } from "valleys";

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
import { boolean, validate } from "valleys";

validate(input, boolean());
// input is typed as boolean
```

#### `constant()`

Validates that a value is exactly equal to a specific literal value.

```ts
import { constant, validate } from "valleys";

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
import { null_, validate } from "valleys";

validate(input, null_());
// input is typed as null
```

#### `undefined_()`

Validates that a value is `undefined`.

```ts
import { undefined_, validate } from "valleys";

validate(input, undefined_());
// input is typed as undefined
```

#### `iso8601()`

Validates that a value is a valid ISO 8601 datetime string with timezone.

```ts
import { iso8601, validate } from "valleys";

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
import { array, string, number, validate } from "valleys";

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
import { object, string, number, boolean, validate } from "valleys";

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

Creates a union type validator that accepts any of the provided validators.

```ts
import { or, string, number, null_, validate } from "valleys";

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

A type utility that extracts the output type from a validator. Useful when you need to reference the type that a validator validates.

```ts
import { object, string, number, InferOutputOf } from "valleys";

const userValidator = object({ id: number(), name: string() });
type User = InferOutputOf<typeof userValidator>;
// User is { id: number; name: string }
```

#### `Iso8601`

A branded string type for ISO 8601 date strings that can only be obtained after validating using the `iso8601` validator.

```ts
import { Iso8601 } from "valleys";

function formatDate(date: Iso8601): string {
  return new Date(date).toLocaleDateString();
}
```

### Acknowledgements

The API is inspired by [Decoders](https://decoders.cc/), which is also my go-to validation library. There is an in-progress [pull request](https://github.com/nvie/decoders/pull/1256) to support readonly decoders, which should bring similar benefits to the library.
