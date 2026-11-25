import { existsSync, readFileSync, readdirSync } from "node:fs";
import { GitBranch, Package } from "lucide-react";

import { HELM_CHARTS_CONFIG } from "../helmChartsConfig";
import {
  CHART_LOGOS,
  GIT_LOGOS,
  chartLogo,
  gitLogo,
  gitProviderOf,
} from "../logos";

// Through a variable: Vite rewrites `new URL("literal", import.meta.url)`
// into a served asset URL, which node:fs cannot read.
const here = import.meta.url;
const PUBLIC = new URL("../../../public/", here);
const DIR = new URL("assets/chart-logos/", PUBLIC);
const readme = readFileSync(new URL("README.md", DIR), "utf8");
const fileOf = (logo) => new URL(logo.replace(/^\//, ""), PUBLIC);
const baseName = (logo) => logo.split("/").pop();

describe("logos", () => {
  // A chart that is added to the catalog must declare its logo or, when it
  // has none, its stand-in (null) on purpose.
  it("declares a logo or the stand-in for every Helm chart", () => {
    for (const key of Object.keys(HELM_CHARTS_CONFIG)) {
      expect(Object.hasOwn(CHART_LOGOS, key), key).toBe(true);
      expect(chartLogo(key).icon).toBe(Package);
    }
  });

  it("has a logo file for both git providers", () => {
    expect(Object.keys(GIT_LOGOS).sort()).toEqual(["github", "gitlab"]);
  });

  // Every logo is a real file, and the README names its source and terms.
  it("serves every logo from public/ and lists it in the README", () => {
    const logos = [...Object.values(CHART_LOGOS), ...Object.values(GIT_LOGOS)]
      .filter(Boolean)
      .map(String);
    for (const logo of logos) {
      expect(logo.startsWith("/assets/chart-logos/"), logo).toBe(true);
      expect(existsSync(fileOf(logo)), logo).toBe(true);
      expect(readme, logo).toContain(`\`${baseName(logo)}\``);
    }
    // No orphan files: everything in the folder is used.
    const used = new Set(logos.map(baseName));
    for (const file of readdirSync(DIR).filter((f) => f !== "README.md")) {
      expect(used.has(file), file).toBe(true);
    }
  });

  it("recognises GitHub and GitLab by the repository host", () => {
    expect(gitProviderOf("git@github.com:org/repo.git")).toBe("github");
    expect(gitProviderOf("https://github.com/org/repo")).toBe("github");
    expect(gitProviderOf("git@gitlab.com:group/repo.git")).toBe("gitlab");
    // Self-hosted GitLab: "gitlab" in the host name.
    expect(gitProviderOf("ssh://git@gitlab.example.com:2222/g/r.git")).toBe(
      "gitlab",
    );
    expect(gitProviderOf("git@bitbucket.org:team/repo.git")).toBeNull();
    // The path does not decide the provider.
    expect(gitProviderOf("git@example.com:github/repo.git")).toBeNull();
    expect(gitProviderOf("")).toBeNull();
    expect(gitProviderOf(undefined)).toBeNull();
  });

  it("falls back to the git stand-in for another host", () => {
    expect(gitLogo("git@github.com:org/repo.git")).toEqual({
      logo: GIT_LOGOS.github,
      icon: GitBranch,
    });
    expect(gitLogo("git@bitbucket.org:team/repo.git")).toEqual({
      logo: null,
      icon: GitBranch,
    });
  });
});
