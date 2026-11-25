// Official logos of the Helm charts and git providers. The files live in
// public/assets/chart-logos (its README.md lists source and terms) and render
// only through LogoTile, which takes `{ logo, icon }`.
import { GitBranch, Package } from "lucide-react";

const file = (name) => `/assets/chart-logos/${name}`;

/** The logo of every chart in HELM_CHARTS_CONFIG; null = none (stand-in). */
export const CHART_LOGOS = {
  prometheusStack: file("prometheus.svg"),
  loki: file("loki.svg"),
  // Promtail has no logo of its own: its chart uses Loki's.
  promtail: file("loki.svg"),
  tempo: file("tempo.svg"),
  // ingress-nginx has no logo of its own: its chart uses NGINX's.
  ingressNginx: file("nginx.png"),
  certManager: file("cert-manager.svg"),
  karpenter: file("karpenter.svg"),
  awsLoadBalancerController: file("aws-load-balancer-controller.svg"),
  argocd: file("argo.svg"),
  externalDns: file("external-dns.png"),
};

export const GIT_LOGOS = {
  github: file("github.svg"),
  gitlab: file("gitlab.svg"),
};

/** LogoTile props of a chart key: its logo, else the Package stand-in. */
export const chartLogo = (key) => ({
  logo: Object.hasOwn(CHART_LOGOS, key) ? CHART_LOGOS[key] : null,
  icon: Package,
});

// Host part of a git URL: git@host:path, ssh://user@host:port/path or
// https://host/path. Empty when it cannot be read.
export const gitHost = (url = "") => {
  const match = url
    .trim()
    .toLowerCase()
    .match(/^(?:[a-z+]+:\/\/)?(?:[^@/]+@)?([^/:]+)/);
  return match ? match[1] : "";
};

/**
 * "github" or "gitlab" by the repository host, else null. Self-hosted GitLab
 * (and GitHub Enterprise) is recognised only by the name in its host.
 */
export const gitProviderOf = (url) => {
  const host = gitHost(url ?? "");
  if (host.includes("github")) return "github";
  if (host.includes("gitlab")) return "gitlab";
  return null;
};

/** LogoTile props of a repository URL: its provider's logo, else GitBranch. */
export const gitLogo = (url) => {
  const provider = gitProviderOf(url);
  return { logo: provider ? GIT_LOGOS[provider] : null, icon: GitBranch };
};
