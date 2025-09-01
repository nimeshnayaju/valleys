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
  array,
} from "../src/index";

const ZodArraySchema = z.array(z.string());

const ArraySchema = array(string());

const items = Array.from({ length: 50_000 }, () => {
  return ["string", "string", "string"];
});

const bench = new Bench({ warmupTime: 1500, time: 1500 });
bench.add("Zod", function () {
  for (const item of items) {
    ZodArraySchema.parse(item);
  }
});

bench.add("Valleys", function () {
  for (const item of items) {
    validate(item, ArraySchema);
  }
});

await bench.run();
console.table(bench.table());
