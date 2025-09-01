import { Bench } from "tinybench";
import { z } from "zod";
import { string, validate } from "../src/index";

const ZodStringSchema = z.string();

const StringSchema = string();

const items = Array.from({ length: 50_000 }, () => {
  return "this is a really long string with a lot of characters".repeat(
    1000000
  );
});

const bench = new Bench({ warmupTime: 1500, time: 1500 });
bench.add("Zod", function () {
  for (const item of items) {
    ZodStringSchema.parse(item);
  }
});

bench.add("Valleys", function () {
  for (const item of items) {
    validate(item, StringSchema);
  }
});

await bench.run();
console.table(bench.table());
