// OP-225: these wizard defaults are what a real generation sends to Injecto, so
// they — not the template defaults — decide what reaches the customer's AWS.
//
// The templates gate cannot cover this: its fixture supplies these params by
// hand, so the template value is overridden there and a regression here would
// pass the gate clean. This is the producer-side half of that guard.
import { describe, it, expect } from "vitest";
import { SERVICES_CONFIG } from "../servicesConfig";

const field = (service, name) => SERVICES_CONFIG[service]?.fields?.[name];

describe("database defaults are safe out of the box", () => {
  it.each(["rds", "aurora"])(
    "%s: deletion protection is on, so a destroy cannot silently take the database",
    (service) => {
      expect(field(service, "deletionProtection")?.defaultValue).toBe(true);
    },
  );

  it.each(["rds", "aurora"])(
    "%s: a final snapshot is taken on delete — this shipped as skip=true, i.e. no snapshot",
    (service) => {
      expect(field(service, "skipFinalSnapshot")?.defaultValue).toBe(false);
    },
  );

  it.each(["rds", "aurora"])(
    "%s: the master password is managed by AWS, keeping it out of Terraform state",
    (service) => {
      expect(field(service, "manageMasterUserPassword")?.defaultValue).toBe(
        true,
      );
    },
  );
});

describe("baseline NetworkPolicies are opt-in", () => {
  // Deliberately off: turning them on changes how traffic reaches a running
  // cluster, and the policy set is verified against Calico rather than against
  // a real EKS + VPC CNI. The gate's fixture sets this param to true so CI
  // exercises the generated policies, which means a flip to true here would
  // pass the gate silently — this is the only place that would notice.
  it("defaults to false", () => {
    expect(field("eks", "networkPolicyEnabled")?.defaultValue).toBe(false);
  });

  it("is defined, so the assertion above is not vacuously undefined-vs-false", () => {
    expect(field("eks", "networkPolicyEnabled")).toBeDefined();
  });
});

describe("the fields exist at all", () => {
  // A renamed or removed field would make every assertion above vacuously
  // undefined-vs-true, so pin their presence separately.
  it.each([
    ["rds", "deletionProtection"],
    ["rds", "skipFinalSnapshot"],
    ["rds", "manageMasterUserPassword"],
    ["aurora", "deletionProtection"],
    ["aurora", "skipFinalSnapshot"],
    ["aurora", "manageMasterUserPassword"],
  ])("%s.%s is defined", (service, name) => {
    expect(field(service, name)).toBeDefined();
  });
});
