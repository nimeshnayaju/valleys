import { Bench } from "tinybench";
import { z } from "zod";
import {
  number,
  or,
  string,
  validate,
  constant,
  boolean,
  object,
} from "../src/index";

const ZodObjectSchema = z.object({
  string: z.string(),
  boolean: z.boolean(),
  number: z.number(),
});

const ObjectSchema = object({
  string: string(),
  boolean: boolean(),
  number: number(),
});

const items = Array.from({ length: 50_000 }, () => {
  return {
    string: "string",
    boolean: true,
    number: 1,
  };
});

const bench = new Bench({ warmupTime: 1500, time: 1500 });
bench.add("Zod", function () {
  for (const item of items) {
    ZodObjectSchema.parse(item);
  }
});

bench.add("Valleys", function () {
  for (const item of items) {
    validate(item, ObjectSchema);
  }
});

await bench.run();
console.table(bench.table());
