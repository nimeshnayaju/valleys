import { Bench } from "tinybench";
import { z } from "zod";
import { number, or, string, validate, constant, boolean } from "valleys";

const ZodRulesSchema = z.union([
  z.literal("mod"),
  z.literal("user"),
  z.literal("admin"),
]);
const RulesSchema = or([constant("mod"), constant("user"), constant("admin")]);

const rules = Array.from({ length: 50_000 }, () => {
  return Math.random() > 0.5 ? "user" : "admin";
});

const bench = new Bench({ warmupTime: 1500, time: 1500 });
bench.add("Zod", function () {
  for (const rule of rules) {
    ZodRulesSchema.parse(rule);
  }
});

bench.add("Valleys", function () {
  for (const rule of rules) {
    validate(rule, RulesSchema);
  }
});

await bench.run();
console.table(bench.table());
