#!/usr/bin/env node
/**
 * Compare the runtime catalog against the static service config.
 *
 * The point of OP-202 is that the catalog replaces src/config/services/aws.js.
 * That is only safe once the two describe the same thing, and "we think they
 * match" is not a claim anyone should act on — OP-227 was a single field name
 * that had silently drifted apart for months, and it took a production walk to
 * find it.
 *
 * Both sides now use one vocabulary (Injecto >= 0.9.0), so this compares like
 * with like: no translation layer, and therefore no place for the comparison
 * itself to hide a difference.
 *
 *   node scripts/catalog-parity.js --catalog catalog.json
 *   node scripts/catalog-parity.js --catalog https://api.openprime.io/api/catalog --token "$JWT"
 *
 * Exit 0 when the only differences are allowlisted, 1 otherwise.
 */

const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

const ALLOWLIST_PATH = path.join(__dirname, "catalog-parity-allowed.json");

function parseArgs(argv) {
  const args = {
    catalog: null,
    token: process.env.CATALOG_TOKEN || null,
    json: false,
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--catalog") args.catalog = argv[++i];
    else if (argv[i] === "--token") args.token = argv[++i];
    else if (argv[i] === "--json") args.json = true;
  }
  if (!args.catalog) {
    console.error(
      "usage: catalog-parity.js --catalog <file|url> [--token <jwt>] [--json]",
    );
    process.exit(2);
  }
  return args;
}

// aws.js is ESM inside a commonjs package, so Node cannot require() it and
// import() would treat it as CJS. Bundling is more honest than re-parsing the
// file with a regex: it evaluates the same module the app evaluates, including
// the FIELD_TYPES constants.
function loadStaticConfig() {
  const entry = path.join(
    __dirname,
    "..",
    "src",
    "config",
    "services",
    "aws.js",
  );
  const { outputFiles } = esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: "cjs",
    platform: "node",
    logLevel: "silent",
  });
  const module = { exports: {} };
  new Function("module", "exports", outputFiles[0].text)(
    module,
    module.exports,
  );
  return module.exports.awsServices;
}

async function loadCatalog({ catalog, token }) {
  if (!/^https?:\/\//.test(catalog)) {
    return JSON.parse(fs.readFileSync(catalog, "utf8"));
  }
  const res = await fetch(catalog, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error(`${catalog} returned ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function loadAllowlist() {
  if (!fs.existsSync(ALLOWLIST_PATH))
    return { services: [], fields: [], attributes: [] };
  return JSON.parse(fs.readFileSync(ALLOWLIST_PATH, "utf8"));
}

// Compared because the wizard reads them. `valueType`, `path`, `tfVar`, `file`
// and `line` exist only in the catalog and have no static counterpart, so they
// are not differences. `section`, `helpText`, `placeholder` and `dependsOn` are
// in aws.js and read by nothing — verified across src/ — so they are not either.
const COMPARED = ["type", "defaultValue", "displayName"];

// Read off the service itself, not its fields. `available` is the one that
// bites: aws.js hides lambda with `available: false` because lambda.tf needs
// deployment packages the wizard cannot supply, and a catalog silent about it
// puts a service on offer whose apply fails. The field loop below could never
// have seen that — it only ever compares fields.
const SERVICE_COMPARED = [
  "displayName",
  "description",
  "category",
  "available",
];

function compare(staticCfg, catalog) {
  const diffs = [];
  const catServices = catalog.services || {};

  const staticKeys = Object.keys(staticCfg).sort();
  const catKeys = Object.keys(catServices).sort();

  for (const key of staticKeys) {
    if (!catServices[key])
      diffs.push({ kind: "service-missing-from-catalog", service: key });
  }
  for (const key of catKeys) {
    if (!staticCfg[key])
      diffs.push({ kind: "service-only-in-catalog", service: key });
  }

  for (const key of staticKeys.filter((k) => catServices[k])) {
    const s = staticCfg[key];
    const c = catServices[key];
    const sFields = s.fields || {};
    const cFields = c.fields || {};

    for (const attr of SERVICE_COMPARED) {
      const sv = s[attr];
      const cv = c[attr];
      if (sv === undefined && cv === undefined) continue;
      // Everything else is compared stringified on purpose: Python `True` and
      // JS `true` are the same value and comparing them by type resurrects 76
      // false differences (OP-206). `available` is the exception, because for
      // it the type IS the meaning -- the wizard tests `available !== false`,
      // so the string "false" leaves the service on offer. An extractor that
      // forgets to coerce it must fail here, not read as agreement.
      const typeDiffers = attr === "available" && typeof sv !== typeof cv;
      if (typeDiffers || String(sv) !== String(cv)) {
        diffs.push({
          kind: "service-attribute",
          service: key,
          attribute: attr,
          static: sv,
          catalog: cv,
        });
      }
    }

    for (const f of Object.keys(sFields)) {
      if (!cFields[f])
        diffs.push({
          kind: "field-missing-from-catalog",
          service: key,
          field: f,
        });
    }
    for (const f of Object.keys(cFields)) {
      if (!sFields[f])
        diffs.push({ kind: "field-only-in-catalog", service: key, field: f });
    }

    for (const f of Object.keys(sFields).filter((x) => cFields[x])) {
      for (const attr of COMPARED) {
        const sv = sFields[f][attr];
        const cv = cFields[f][attr];
        if (sv === undefined && cv === undefined) continue;
        // Loose on purpose: the catalog carries "2" where a JS literal is 2,
        // because a tfvars literal is text until Terraform reads it.
        if (String(sv) !== String(cv)) {
          diffs.push({
            kind: "attribute",
            service: key,
            field: f,
            attribute: attr,
            static: sv,
            catalog: cv,
          });
        }
      }

      // Validation is compared because losing it is invisible everywhere else.
      // aws.js guarded services.vpc.cidr with a format pattern; the catalog
      // carried none, so hydrating from it dropped the only check on a VPC
      // network range — in the same window as the backend removing its own CIDR
      // validator. Both gates were green: this loop only ever compared type,
      // defaultValue and displayName.
      //
      // Normalised before comparing, because the two sides encode the same
      // regex differently: aws.js holds a RegExp literal (String() gives
      // "/^a$/") while the catalog holds the source text ("^a$"). Comparing
      // them raw would report a difference for every pattern that matches —
      // the false-difference trap OP-206 already worked through once.
      // `\/` is unescaped before comparing, and only `\/`. A JS regex LITERAL
      // must escape a forward slash or it terminates early, so aws.js is forced
      // to write `\/`; a decorator holds plain text and writes `/`. The two are
      // the same regex, and this is the one normalisation that difference
      // needs — deliberately not a general de-escaper, which would start
      // equating patterns that really do differ.
      const patternOf = (v) => {
        if (v === undefined) return undefined;
        return (v instanceof RegExp ? v.source : String(v)).replace(
          /\\\//g,
          "/",
        );
      };
      const sPat = patternOf(sFields[f].validation?.pattern);
      const cPat = patternOf(cFields[f].validation?.pattern);
      if (sPat !== cPat) {
        diffs.push({
          kind: "attribute",
          service: key,
          field: f,
          attribute: "validation.pattern",
          static: sPat,
          catalog: cPat,
        });
      }

      const sOpts = (sFields[f].options || [])
        .map((o) => String(o.value))
        .sort();
      const cOpts = (cFields[f].options || [])
        .map((o) => String(o.value ?? o))
        .sort();
      if (JSON.stringify(sOpts) !== JSON.stringify(cOpts)) {
        diffs.push({
          kind: "options",
          service: key,
          field: f,
          static: sOpts,
          catalog: cOpts,
        });
      }
    }
  }
  return diffs;
}

function isAllowed(diff, allow) {
  if (diff.kind.startsWith("service") && allow.services.includes(diff.service))
    return true;
  if (diff.field && allow.fields.includes(`${diff.service}.${diff.field}`))
    return true;
  if (diff.kind === "service-attribute")
    return (allow.serviceAttributes || []).includes(
      `${diff.service}.${diff.attribute}`,
    );
  if (
    diff.attribute &&
    allow.attributes.includes(`${diff.service}.${diff.field}.${diff.attribute}`)
  )
    return true;
  return false;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const staticCfg = loadStaticConfig();
  const catalog = await loadCatalog(args);
  const allow = loadAllowlist();

  const all = compare(staticCfg, catalog);
  const blocking = all.filter((d) => !isAllowed(d, allow));
  const allowed = all.filter((d) => isAllowed(d, allow));

  if (args.json) {
    console.log(JSON.stringify({ blocking, allowed }, null, 2));
    process.exit(blocking.length ? 1 : 0);
  }

  console.log(`static services: ${Object.keys(staticCfg).length}`);
  console.log(
    `catalog services: ${Object.keys(catalog.services || {}).length}`,
  );
  console.log(`differences: ${all.length} (${allowed.length} allowlisted)\n`);

  for (const d of blocking) {
    if (d.kind === "attribute") {
      console.log(
        `  ${d.kind.padEnd(28)} ${d.service}.${d.field}.${d.attribute}: static=${JSON.stringify(d.static)} catalog=${JSON.stringify(d.catalog)}`,
      );
    } else if (d.kind === "service-attribute") {
      console.log(
        `  ${d.kind.padEnd(28)} ${d.service}.${d.attribute}: static=${JSON.stringify(d.static)} catalog=${JSON.stringify(d.catalog)}`,
      );
    } else if (d.kind === "options") {
      console.log(
        `  ${d.kind.padEnd(28)} ${d.service}.${d.field}: static=${JSON.stringify(d.static)} catalog=${JSON.stringify(d.catalog)}`,
      );
    } else {
      console.log(
        `  ${d.kind.padEnd(28)} ${d.service}${d.field ? "." + d.field : ""}`,
      );
    }
  }

  if (!blocking.length) {
    console.log("PASS — the catalog can stand in for the static config");
    process.exit(0);
  }
  console.log(
    `\nFAIL — ${blocking.length} difference(s) not in ${path.basename(ALLOWLIST_PATH)}`,
  );
  process.exit(1);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(2);
});
