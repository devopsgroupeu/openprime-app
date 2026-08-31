#!/usr/bin/env node
/**
 * Check that a catalog can actually drive the wizard.
 *
 * catalog-parity.js answers "does the catalog say the same as the static
 * config". This answers a different question the parity check cannot: "will
 * the wizard survive rendering it". A field can match the static config in
 * every compared attribute and still be unrenderable, and a field the static
 * config never had — every EKS addon flag — is not compared at all.
 *
 * The rule that motivated this: FIELD_TYPES has no DYNAMIC_LIST, so the
 * renderer's `case FIELD_TYPES.DYNAMIC_LIST` is `case undefined`, which
 * catches every field with no type and then dereferences fieldConfig
 * .itemSchema. A missing control is not a cosmetic gap; it takes the service
 * card down.
 *
 *   node scripts/catalog-lint.js --catalog catalog.json
 *
 * Exit 0 when clean, 1 otherwise.
 */

const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

function loadFieldTypes() {
  const entry = path.join(
    __dirname,
    "..",
    "src",
    "config",
    "services",
    "fieldTypes.js",
  );
  const { outputFiles } = esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: "cjs",
    platform: "node",
    logLevel: "silent",
  });
  const mod = { exports: {} };
  new Function("module", "exports", outputFiles[0].text)(mod, mod.exports);
  return new Set(Object.values(mod.exports.FIELD_TYPES));
}

function lint(catalog, controls) {
  const problems = [];
  const add = (rule, where, detail) => problems.push({ rule, where, detail });

  for (const [key, service] of Object.entries(catalog.services || {})) {
    if (!service.displayName)
      add("service-without-label", key, "no displayName");

    for (const [name, f] of Object.entries(service.fields || {})) {
      const where = `${key}.${name}`;

      // The one that takes a card down rather than looking wrong.
      if (f.type === undefined) {
        add(
          "no-control",
          where,
          `valueType=${f.valueType} — falls into case undefined`,
        );
      } else if (!controls.has(f.type)) {
        add("unknown-control", where, `type=${f.type} is not in FIELD_TYPES`);
      }

      if (!f.displayName) add("no-label", where, "renders with an empty label");
      if (!f.name) add("no-name", where, "the wizard reads name off the field");

      if (f.type === "dropdown" && !Array.isArray(f.options)) {
        add(
          "dropdown-without-options",
          where,
          "a dropdown with nothing to choose",
        );
      }

      if (
        Array.isArray(f.options) &&
        f.defaultValue !== undefined &&
        f.defaultValue !== null
      ) {
        const values = f.options.map((o) =>
          String(o && o.value !== undefined ? o.value : o),
        );
        if (!values.includes(String(f.defaultValue))) {
          add(
            "default-not-an-option",
            where,
            `default ${JSON.stringify(f.defaultValue)} is not in ${JSON.stringify(values)}`,
          );
        }
      }

      // Only flag a control the value cannot hold. HCL converts freely between
      // string, number and bool, which is why opensearch.allowExplicitIndex is a
      // Terraform string edited by a toggle and still correct. It does not
      // convert a bool into a list, and a toggle over one writes a value
      // Terraform rejects at plan.
      const PRIMITIVE = new Set(["string", "number", "boolean"]);
      const scalarControl = ["toggle", "number", "text", "dropdown"].includes(
        f.type,
      );
      if (scalarControl && f.valueType && !PRIMITIVE.has(f.valueType)) {
        add(
          "control-fights-value",
          where,
          `${f.type} control over a ${f.valueType} value`,
        );
      }

      if (f.defaultValue !== undefined && f.defaultValue !== null) {
        const actual = Array.isArray(f.defaultValue)
          ? "list"
          : typeof f.defaultValue;
        const want = {
          string: "string",
          number: "number",
          boolean: "boolean",
          list: "list",
          object: "object",
        }[f.valueType];
        const got = actual === "object" ? "object" : actual;
        if (want && got !== want) {
          add(
            "default-wrong-shape",
            where,
            `valueType=${f.valueType} but default is a ${got}`,
          );
        }
      }
    }
  }
  return problems;
}

function main() {
  const i = process.argv.indexOf("--catalog");
  if (i === -1 || !process.argv[i + 1]) {
    console.error("usage: catalog-lint.js --catalog <file>");
    process.exit(2);
  }
  const catalog = JSON.parse(fs.readFileSync(process.argv[i + 1], "utf8"));
  const controls = loadFieldTypes();
  const problems = lint(catalog, controls);

  const services = Object.keys(catalog.services || {}).length;
  const fields = Object.values(catalog.services || {}).reduce(
    (n, s) => n + Object.keys(s.fields || {}).length,
    0,
  );
  console.log(`checked ${fields} fields across ${services} services\n`);

  if (!problems.length) {
    console.log("PASS — every field has a control the renderer knows");
    process.exit(0);
  }

  const byRule = {};
  for (const p of problems) (byRule[p.rule] ||= []).push(p);
  for (const [rule, list] of Object.entries(byRule)) {
    console.log(`  ${rule} (${list.length})`);
    for (const p of list) console.log(`      ${p.where}: ${p.detail}`);
  }
  console.log(`\nFAIL — ${problems.length} problem(s)`);
  process.exit(1);
}

main();
